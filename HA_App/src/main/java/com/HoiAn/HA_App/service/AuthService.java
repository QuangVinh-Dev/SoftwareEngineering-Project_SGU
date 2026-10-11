package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.request.LoginRequest;
import com.HoiAn.HA_App.dto.request.RegisterAdminRequest;
import com.HoiAn.HA_App.dto.request.RegisterMerchantRequest;
import com.HoiAn.HA_App.dto.response.AuthResponse;
import com.HoiAn.HA_App.dto.response.MerchantRegistrationResponse;
import com.HoiAn.HA_App.dto.response.UserResponse;
import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Merchant;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.MerchantRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import com.HoiAn.HA_App.security.AuthUser;
import com.HoiAn.HA_App.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class AuthService {

    private static final String BAD_CREDENTIALS = "Sai tên đăng nhập hoặc mật khẩu";

    private final AccountRepository accountRepository;
    private final MerchantRepository merchantRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /** Hash giả để so sánh khi username không tồn tại, tránh lộ thông tin qua thời gian phản hồi. */
    private final String dummyHash;

    public AuthService(AccountRepository accountRepository,
                       MerchantRepository merchantRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.merchantRepository = merchantRepository;
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

        Account account = accountRepository.findByUsername(username).orElse(null);

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
                        "Đăng ký gian hàng đã bị từ chối");
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
        String username = normalize(request.username());
        String email = normalize(request.email());

        checkPasswordLength(request.password());
        checkUnique(username, email);

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
        merchant.setApprovalStatus("PENDING");
        merchant.setRegisteredAt(LocalDateTime.now());
        merchant = merchantRepository.save(merchant);

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
