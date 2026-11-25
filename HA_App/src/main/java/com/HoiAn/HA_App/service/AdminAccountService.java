package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.request.CreateAdminAccountRequest;
import com.HoiAn.HA_App.dto.request.UpdateAdminAccountRequest;
import com.HoiAn.HA_App.dto.response.ActionLogResponse;
import com.HoiAn.HA_App.dto.response.AdminAccountResponse;
import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.ActionLog;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.ActionLogRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class AdminAccountService {

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final ActionLogRepository actionLogRepository;
    private final PasswordEncoder passwordEncoder;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    public AdminAccountService(AccountRepository accountRepository,
                               RoleRepository roleRepository,
                               ActionLogRepository actionLogRepository,
                               PasswordEncoder passwordEncoder) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.actionLogRepository = actionLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<AdminAccountResponse> listAccounts() {
        return accountRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminAccountResponse updateStatus(Integer id, String targetStatus, String currentUsername) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));

        if ("admin".equalsIgnoreCase(account.getUsername()) && "LOCKED".equalsIgnoreCase(targetStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể khóa tài khoản Quản trị viên chính.");
        }

        String newStatus;
        if (targetStatus == null || targetStatus.isBlank()) {
            newStatus = "ACTIVE".equalsIgnoreCase(account.getStatus()) ? "LOCKED" : "ACTIVE";
        } else {
            newStatus = targetStatus.toUpperCase(Locale.ROOT);
        }

        if (!"ACTIVE".equals(newStatus) && !"LOCKED".equals(newStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ: " + targetStatus);
        }

        account.setStatus(newStatus);
        Account saved = accountRepository.save(account);

        logAction(currentUsername,
                "ACTIVE".equals(newStatus) ? "Mở khóa tài khoản @" + saved.getUsername() : "Khóa tài khoản @" + saved.getUsername(),
                "ACCOUNT",
                saved.getId());

        return toResponse(saved);
    }

    @Transactional
    public AdminAccountResponse createAccount(CreateAdminAccountRequest req, String currentUsername) {
        String username = req.username().trim().toLowerCase(Locale.ROOT);
        String email = req.email().trim().toLowerCase(Locale.ROOT);

        if (accountRepository.existsByUsername(username)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tên đăng nhập đã tồn tại trên hệ thống.");
        }
        if (accountRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng bởi một tài khoản khác.");
        }

        String roleName = "MERCHANT".equalsIgnoreCase(req.role()) ? "MERCHANT" : "ADMIN";
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ: " + roleName));

        Account account = new Account();
        account.setUsername(username);
        account.setPasswordHash(passwordEncoder.encode(req.password()));
        account.setFullName(req.fullName().trim());
        account.setEmail(email);
        account.setRole(role);
        account.setAccountType(roleName);
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());

        Account saved = accountRepository.save(account);

        logAction(currentUsername, "Tạo tài khoản @" + saved.getUsername(), "ACCOUNT", saved.getId());

        return toResponse(saved);
    }

    @Transactional
    public AdminAccountResponse updateAccount(Integer id, UpdateAdminAccountRequest req, String currentUsername) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy tài khoản."));

        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (!email.equalsIgnoreCase(account.getEmail()) && accountRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng bởi tài khoản khác.");
        }

        account.setFullName(req.fullName().trim());
        account.setEmail(email);

        if (req.role() != null && !req.role().isBlank()) {
            String roleName = "MERCHANT".equalsIgnoreCase(req.role()) ? "MERCHANT" : "ADMIN";
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ: " + roleName));
            account.setRole(role);
            account.setAccountType(roleName);
        }

        Account saved = accountRepository.save(account);

        logAction(currentUsername, "Cập nhật thông tin tài khoản @" + saved.getUsername(), "ACCOUNT", saved.getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ActionLogResponse> listLogs() {
        return actionLogRepository.findAllByOrderByPerformedAtDesc()
                .stream()
                .limit(100)
                .map(this::toLogResponse)
                .toList();
    }

    private void logAction(String username, String action, String targetType, Integer targetId) {
        if (username == null || username.isBlank()) return;
        accountRepository.findByUsername(username).ifPresent(acc -> {
            try {
                ActionLog log = new ActionLog(acc, action, targetType, targetId);
                actionLogRepository.save(log);
            } catch (Exception ignored) {
            }
        });
    }

    private AdminAccountResponse toResponse(Account a) {
        String roleName = a.getRole() != null ? a.getRole().getName() : a.getAccountType();
        String created = a.getCreatedAt() != null ? a.getCreatedAt().format(DATE_FMT) : "";
        return new AdminAccountResponse(
                a.getId(),
                a.getUsername(),
                a.getFullName() != null ? a.getFullName() : a.getUsername(),
                a.getEmail() != null ? a.getEmail() : "",
                roleName,
                a.getAccountType(),
                a.getStatus(),
                created,
                null
        );
    }

    private ActionLogResponse toLogResponse(ActionLog log) {
        LocalDateTime time = log.getPerformedAt() != null ? log.getPerformedAt() : LocalDateTime.now();
        String username = log.getAccount() != null ? log.getAccount().getUsername() : "system";
        String role = log.getAccount() != null && log.getAccount().getRole() != null
                ? log.getAccount().getRole().getName() : "ADMIN";
        String target = (log.getTargetType() != null ? log.getTargetType() : "") +
                (log.getTargetId() != null ? " #" + log.getTargetId() : "");

        return new ActionLogResponse(
                log.getId(),
                time.format(TIME_FMT),
                time.format(DATE_FMT),
                username,
                role,
                log.getAction(),
                target,
                "127.0.0.1"
        );
    }
}
