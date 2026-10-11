package com.HoiAn.HA_App.config;

import com.HoiAn.HA_App.repository.AccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * version_1.0.sql seed tài khoản "admin" với hash giả nên không đăng nhập được.
 * Khi khởi động, nếu tài khoản này vẫn còn hash giả thì đặt lại mật khẩu thật (BCrypt).
 * Mật khẩu lấy từ biến môi trường APP_ADMIN_PASSWORD; mặc định chỉ dùng cho môi trường dev.
 */
@Component
public class AdminAccountSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSeeder.class);

    private static final String PLACEHOLDER_PREFIX = "$2b$10$abcdefghijklmnopqrstuv";
    private static final String DEV_DEFAULT_PASSWORD = "Admin@123";

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminPassword;

    public AdminAccountSeeder(AccountRepository accountRepository,
                              PasswordEncoder passwordEncoder,
                              @Value("${app.seed.admin-password:}") String adminPassword) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        accountRepository.findByUsername("admin").ifPresent(account -> {
            if (!account.getPasswordHash().startsWith(PLACEHOLDER_PREFIX)) {
                return;
            }

            boolean usingDefault = adminPassword == null || adminPassword.isBlank();
            String password = usingDefault ? DEV_DEFAULT_PASSWORD : adminPassword;

            account.setPasswordHash(passwordEncoder.encode(password));
            accountRepository.save(account);

            if (usingDefault) {
                log.warn("Đã đặt mật khẩu mặc định cho tài khoản 'admin'. Hãy đặt APP_ADMIN_PASSWORD khi triển khai thật.");
            } else {
                log.info("Đã đặt mật khẩu cho tài khoản 'admin' từ APP_ADMIN_PASSWORD.");
            }
        });
    }
}
