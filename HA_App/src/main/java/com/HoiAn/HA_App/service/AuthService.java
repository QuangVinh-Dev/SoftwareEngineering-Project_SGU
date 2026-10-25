package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.request.LoginRequest;
import com.HoiAn.HA_App.dto.request.RegisterAdminRequest;
import com.HoiAn.HA_App.dto.request.RegisterMerchantRequest;
import com.HoiAn.HA_App.dto.response.AuthResponse;
import com.HoiAn.HA_App.dto.response.MerchantRegistrationResponse;
import com.HoiAn.HA_App.dto.response.UserResponse;
import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Merchant;
import com.HoiAn.HA_App.entity.MerchantImage;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.MerchantImageRepository;
import com.HoiAn.HA_App.repository.MerchantRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.sercurity.JwtService;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {

    private static final String BAD_CREDENTIALS = "Sai tên đăng nhập hoặc mật khẩu";

    private final AccountRepository accountRepository;
    private final MerchantRepository merchantRepository;
    private final MerchantImageRepository merchantImageRepository;
    private final MerchantImageStorageService imageStorage;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** Hash giả để so sánh khi username không tồn tại, tránh lộ thông tin qua thời gian phản hồi. */
    private final String dummyHash;

    private static final Set<String> PLAN_IDS = Set.of("free", "standard", "premium");
    private static final Set<String> BILLING_CYCLES = Set.of("monthly", "yearly");

    public AuthService(AccountRepository accountRepository,
                       MerchantRepository merchantRepository,
                       MerchantImageRepository merchantImageRepository,
                       MerchantImageStorageService imageStorage,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.merchantRepository = merchantRepository;
        this.merchantImageRepository = merchantImageRepository;
        this.imageStorage = imageStorage;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    // ------------------------------------------------------------------
    // Đăng nhập (admin + chủ gian hàng)
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String username = normalize(request.username());

        // FE cho phép nhập "email hoặc tên đăng nhập".
        Account account = accountRepository.findByUsername(username)
                .or(() -> accountRepository.findByEmailIgnoreCase(username))
                .orElse(null);

        String hash = account != null ? account.getPasswordHash() : dummyHash;
        boolean passwordOk = passwordEncoder.matches(request.password(), hash);

        if (account == null || !passwordOk) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, BAD_CREDENTIALS);
        }

        if (!"ACTIVE".equals(account.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }

        Integer merchantId = null;
        if ("MERCHANT".equals(account.getAccountType())) {
            Merchant merchant = merchantRepository.findByAccountId(account.getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN,
                            "Tài khoản chưa có thông tin gian hàng"));

            switch (merchant.getApprovalStatus()) {
                case "APPROVED" -> merchantId = merchant.getId();
                case "PENDING" -> throw new ApiException(HttpStatus.FORBIDDEN,
                        "Gian hàng đang chờ quản trị viên duyệt");
                default -> throw new ApiException(HttpStatus.FORBIDDEN,
                        merchant.getRejectReason() == null || merchant.getRejectReason().isBlank()
                                ? "Đăng ký gian hàng đã bị từ chối"
                                : "Đăng ký gian hàng đã bị từ chối: " + merchant.getRejectReason());
            }
        }

        AuthUser user = toAuthUser(account, merchantId);
        String token = jwtService.generateToken(user);

        return new AuthResponse(token, "Bearer", jwtService.getTtlSeconds(), toUserResponse(account, merchantId));
    }

    // ------------------------------------------------------------------
    // Đăng ký chủ gian hàng (công khai, chờ admin duyệt)
    // ------------------------------------------------------------------
    @Transactional
    public MerchantRegistrationResponse registerMerchant(RegisterMerchantRequest request) {
        String email = normalize(request.email());
        // FE đăng nhập bằng email: không gửi username thì dùng luôn email.
        String username = request.username() == null || request.username().isBlank()
                ? email : normalize(request.username());

        checkPasswordLength(request.password());
        checkUnique(username, email);

        List<String> images = request.merchantImages() == null ? List.of() : request.merchantImages();
        String planId = request.plan() == null || request.plan().id() == null
                ? "free" : request.plan().id().trim().toLowerCase(Locale.ROOT);
        String billing = request.plan() == null || request.plan().billing() == null
                ? "monthly" : request.plan().billing().trim().toLowerCase(Locale.ROOT);
        if (!PLAN_IDS.contains(planId) || !BILLING_CYCLES.contains(billing)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Gói dịch vụ không hợp lệ");
        }

        Role role = findRole("MERCHANT");

        Account account = new Account();
        account.setRole(role);
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setFullName(request.fullName().trim());
        account.setEmail(email);
        account.setAccountType("MERCHANT");
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        account = accountRepository.save(account);

        Merchant merchant = new Merchant();
        merchant.setAccount(account);
        merchant.setName(request.merchantName().trim());
        merchant.setPhoneNumber(blankToNull(request.phoneNumber()));
        merchant.setAddress(blankToNull(request.address()));
        merchant.setCategory(blankToNull(request.category()));
        merchant.setDescription(blankToNull(request.description()));
        merchant.setPlanId(planId);
        merchant.setBillingCycle(billing);
        merchant.setApprovalStatus("PENDING");
        merchant.setRegisteredAt(LocalDateTime.now());
        merchant = merchantRepository.save(merchant);

        int order = 1;
        for (String dataUri : images) {
            MerchantImage image = new MerchantImage();
            image.setMerchantId(merchant.getId());
            image.setFilePath(imageStorage.save(dataUri));
            image.setOrderNum(order++);
            merchantImageRepository.save(image);
        }

        return new MerchantRegistrationResponse(
                account.getId(),
                merchant.getId(),
                merchant.getApprovalStatus(),
                "Đăng ký thành công. Vui lòng chờ quản trị viên duyệt gian hàng trước khi đăng nhập."
        );
    }

    // ------------------------------------------------------------------
    // Tạo tài khoản admin (chỉ SUPER_ADMIN gọi được, xem SecurityConfig)
    // ------------------------------------------------------------------
    @Transactional
    public UserResponse registerAdmin(RegisterAdminRequest request) {
        String username = normalize(request.username());
        String email = normalize(request.email());

        checkPasswordLength(request.password());
        checkUnique(username, email);

        String roleName = request.roleName() == null || request.roleName().isBlank()
                ? "ADMIN" : request.roleName();
        Role role = findRole(roleName);

        Account account = new Account();
        account.setRole(role);
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setFullName(request.fullName().trim());
        account.setEmail(email);
        account.setAccountType("ADMIN");
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        account = accountRepository.save(account);

        return toUserResponse(account, null);
    }

    // ------------------------------------------------------------------
    // Thông tin tài khoản hiện tại
    // ------------------------------------------------------------------
    @Transactional(readOnly = true)
    public UserResponse me(AuthUser current) {
        Account account = accountRepository.findById(current.id())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Tài khoản không tồn tại"));

        if (!"ACTIVE".equals(account.getStatus())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        }
        return toUserResponse(account, current.merchantId());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private void checkUnique(String username, String email) {
        if (accountRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tên đăng nhập đã tồn tại");
        }
        if (accountRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email đã được sử dụng");
        }
    }

    /** BCrypt chỉ xét tối đa 72 byte; ký tự có dấu có thể làm vượt giới hạn dù chưa đủ 72 ký tự. */
    private void checkPasswordLength(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mật khẩu tối đa 72 byte");
        }
    }

    private Role findRole(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new IllegalStateException("Thiếu role " + name + " trong database"));
    }

    private AuthUser toAuthUser(Account account, Integer merchantId) {
        return new AuthUser(account.getId(), account.getUsername(),
                account.getRole().getName(), account.getAccountType(), merchantId);
    }

    private UserResponse toUserResponse(Account account, Integer merchantId) {
        return new UserResponse(account.getId(), account.getUsername(), account.getFullName(),
                account.getEmail(), account.getRole().getName(), account.getAccountType(), merchantId);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
