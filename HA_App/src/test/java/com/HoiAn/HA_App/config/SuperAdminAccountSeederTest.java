package com.HoiAn.HA_App.config;

import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.ApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SuperAdminAccountSeederTest {

    @Mock private AccountRepository accountRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private Role superAdminRole;
    @Mock private ApplicationArguments arguments;

    @Test
    void createsEnabledSuperAdminWithEncodedPasswordAndIsIdempotent() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        when(roleRepository.findByNameForUpdate("SUPER_ADMIN")).thenReturn(java.util.Optional.of(superAdminRole));
        when(accountRepository.existsByUsername("superadmin")).thenReturn(false, true);
        SuperAdminAccountSeeder seeder = new SuperAdminAccountSeeder(
                accountRepository, roleRepository, encoder, "123456");

        seeder.run(arguments);
        seeder.run(arguments);

        ArgumentCaptor<Account> accountCaptor = ArgumentCaptor.forClass(Account.class);
        verify(accountRepository, times(1)).save(accountCaptor.capture());
        Account seeded = accountCaptor.getValue();
        assertThat(seeded.getUsername()).isEqualTo("superadmin");
        assertThat(seeded.getRole()).isSameAs(superAdminRole);
        assertThat(seeded.getAccountType()).isEqualTo("ADMIN");
        assertThat(seeded.getStatus()).isEqualTo("ACTIVE");
        assertThat(seeded.getPasswordHash()).isNotEqualTo("123456");
        assertThat(encoder.matches("123456", seeded.getPasswordHash())).isTrue();
        assertThat(seeded.getCreatedAt()).isNotNull();
    }

    @Test
    void leavesExistingAccountUntouched() {
        when(roleRepository.findByNameForUpdate("SUPER_ADMIN")).thenReturn(java.util.Optional.of(superAdminRole));
        when(accountRepository.existsByUsername("superadmin")).thenReturn(true);
        SuperAdminAccountSeeder seeder = new SuperAdminAccountSeeder(
                accountRepository, roleRepository, new BCryptPasswordEncoder(), "123456");

        seeder.run(arguments);

        verify(accountRepository, never()).save(any());
    }
}
