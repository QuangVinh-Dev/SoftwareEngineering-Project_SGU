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

/**
 * Khởi tạo hoặc cập nhật mật khẩu cho tài khoản quản trị viên duy nhất "admin" (role ADMIN).
 */
@Component
public class AdminAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

    private static final String PLACEHOLDER_PREFIX = "$2b$10$abcdefghijklmnopqrstuv";
    private static final String DEV_DEFAULT_PASSWORD = "Admin@123";

    private final AccountRepository accountRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminPassword;

    public AdminAccountSeeder(AccountRepository accountRepository,
                              RoleRepository roleRepository,
                              PasswordEncoder passwordEncoder,
                              @Value("${app.seed.admin-password:}") String adminPassword) {
        this.accountRepository = accountRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminPassword = adminPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean usingDefault = adminPassword == null || adminPassword.isBlank();
        String password = usingDefault ? DEV_DEFAULT_PASSWORD : adminPassword;

        accountRepository.findByUsername("admin").ifPresentOrElse(account -> {
            if (account.getPasswordHash().startsWith(PLACEHOLDER_PREFIX)) {
                account.setPasswordHash(passwordEncoder.encode(password));
                accountRepository.save(account);
                log.info("Đã cập nhật mật khẩu cho tài khoản 'admin'.");
            }
        }, () -> {
            Role role = roleRepository.findByName("ADMIN").orElse(null);
            if (role != null) {
                Account account = new Account();
                account.setRole(role);
                account.setUsername("admin");
                account.setPasswordHash(passwordEncoder.encode(password));
                account.setFullName("Administrator");
                account.setEmail("admin@hoian.vn");
                account.setAccountType("ADMIN");
                account.setStatus("ACTIVE");
                account.setCreatedAt(LocalDateTime.now());
                accountRepository.save(account);
                log.info("Đã tạo tài khoản quản trị 'admin' với quyền ADMIN.");
            }
        });
    }
}
