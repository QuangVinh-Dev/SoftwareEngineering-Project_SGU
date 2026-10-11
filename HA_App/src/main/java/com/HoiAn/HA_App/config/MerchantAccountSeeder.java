
package com.HoiAn.HA_App.config;

import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Merchant;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.MerchantRepository;
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

@Component
public class MerchantAccountSeeder implements ApplicationRunner {

    private static final Logger log =
            LoggerFactory.getLogger(MerchantAccountSeeder.class);

    private final AccountRepository accountRepository;
    private final MerchantRepository merchantRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String merchantPassword;

    public MerchantAccountSeeder(
            AccountRepository accountRepository,
            MerchantRepository merchantRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.seed.merchant-password:123456}")
            String merchantPassword) {

        this.accountRepository = accountRepository;
        this.merchantRepository = merchantRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.merchantPassword = merchantPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String username = "chugianhang";

        // Không tạo trùng nếu tài khoản đã tồn tại.
        if (accountRepository.existsByUsername(username)) {
            log.info("Tài khoản chugianhang đã tồn tại.");
            return;
        }

        Role role = roleRepository.findByName("MERCHANT")
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Không tìm thấy role MERCHANT trong database"));

        Account account = new Account();
        account.setRole(role);
        account.setUsername(username);
        account.setPasswordHash(
                passwordEncoder.encode(merchantPassword));
        account.setFullName("Chủ gian hàng");
        account.setEmail("chugianhang@example.com");
        account.setAccountType("MERCHANT");
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());

        account = accountRepository.save(account);

        Merchant merchant = new Merchant();
        merchant.setAccount(account);
        merchant.setName("Gian hàng Hội An");
        merchant.setApprovalStatus("APPROVED");
        merchant.setRegisteredAt(LocalDateTime.now());

        merchantRepository.save(merchant);

        log.info("Đã tạo tài khoản chủ gian hàng chugianhang.");
    }
}
