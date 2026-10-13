package com.HoiAn.HA_App.config;

import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Creates the initial SUPER_ADMIN only when its username is absent. */
@Component
public class SuperAdminAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SuperAdminAccountSeeder.class);
    private static final String USERNAME = "superadmin";
    private static final String ROLE_NAME = "SUPER_ADMIN";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String initialPassword;

    public SuperAdminAccountSeeder(AccountRepository accountRepository,
                                   RoleRepository roleRepository,
                                   PasswordEncoder passwordEncoder,
                                   @Value("${app.seed.super-admin-password:123456}") String initialPassword) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.initialPassword = initialPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Locking the shared role row serializes concurrent application startups;
        // account.username's existing unique constraint remains the final safeguard.
        Role role = roleRepository.findByNameForUpdate(ROLE_NAME)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy role SUPER_ADMIN trong database"));

        if (accountRepository.existsByUsername(USERNAME)) {
            log.info("Tài khoản superadmin đã tồn tại; giữ nguyên dữ liệu hiện có.");
            return;
        }

        if (initialPassword == null || initialPassword.isBlank()) {
            throw new IllegalStateException("app.seed.super-admin-password không được để trống");
        }

        Account account = new Account();
        account.setRole(role);
        account.setUsername(USERNAME);
        account.setPasswordHash(passwordEncoder.encode(initialPassword));
        account.setFullName("Super Administrator");
        account.setAccountType("ADMIN");
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        accountRepository.save(account);

        log.info("Đã tạo tài khoản SUPER_ADMIN mặc định 'superadmin'.");
    }
}
