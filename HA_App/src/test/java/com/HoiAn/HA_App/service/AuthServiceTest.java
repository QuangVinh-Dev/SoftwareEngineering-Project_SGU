package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.request.LoginRequest;
import com.HoiAn.HA_App.dto.request.RegisterMerchantRequest;
import com.HoiAn.HA_App.entity.Account;
import com.HoiAn.HA_App.entity.Merchant;
import com.HoiAn.HA_App.entity.Role;
import com.HoiAn.HA_App.repository.AccountRepository;
import com.HoiAn.HA_App.repository.MerchantImageRepository;
import com.HoiAn.HA_App.repository.MerchantRepository;
import com.HoiAn.HA_App.repository.RoleRepository;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.sercurity.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    @Mock private AccountRepository accountRepository;
    @Mock private MerchantRepository merchantRepository;
    @Mock private MerchantImageRepository merchantImageRepository;
    @Mock private MerchantImageStorageService imageStorage;
    @Mock private RoleRepository roleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private Account account;
    @Mock private Merchant merchant;
    @Mock private Role role;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(accountRepository, merchantRepository, merchantImageRepository,
                imageStorage, roleRepository, passwordEncoder, jwtService);
    }

    private void stubLogin() {
        when(accountRepository.findByUsername("owner")).thenReturn(Optional.of(account));
        when(account.getId()).thenReturn(17);
        when(account.getPasswordHash()).thenReturn("password-hash");
        when(account.getStatus()).thenReturn("ACTIVE");
        when(account.getAccountType()).thenReturn("MERCHANT");
        when(account.getRole()).thenReturn(role);
        when(account.getUsername()).thenReturn("owner");
        when(account.getFullName()).thenReturn("Store Owner");
        when(account.getEmail()).thenReturn("owner@example.com");
        when(role.getName()).thenReturn("MERCHANT");
        when(passwordEncoder.matches("password", "password-hash")).thenReturn(true);
        when(merchantRepository.findByAccountId(17)).thenReturn(Optional.of(merchant));
        when(jwtService.generateToken(any(AuthUser.class))).thenReturn("access-token");
        when(jwtService.getTtlSeconds()).thenReturn(3600L);
    }

    @Test
    void pendingMerchantCanSignInWithoutApprovedMerchantAccess() {
        stubLogin();
        when(merchant.getApprovalStatus()).thenReturn("PENDING");

        var response = authService.login(new LoginRequest("owner", "password"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.user().approvalStatus()).isEqualTo("PENDING");
        assertThat(response.user().merchantId()).isNull();
        verify(jwtService).generateToken(argThat(user -> user.merchantId() == null));
    }

    @Test
    void rejectedMerchantCanSignInAndSeeRejectionReason() {
        stubLogin();
        when(merchant.getApprovalStatus()).thenReturn("REJECTED");
        when(merchant.getRejectReason()).thenReturn("Thiếu giấy phép kinh doanh");

        var response = authService.login(new LoginRequest("owner", "password"));

        assertThat(response.user().approvalStatus()).isEqualTo("REJECTED");
        assertThat(response.user().rejectionReason()).isEqualTo("Thiếu giấy phép kinh doanh");
        assertThat(response.user().merchantId()).isNull();
    }

    @Test
    void approvedMerchantRetainsMerchantAccess() {
        stubLogin();
        when(merchant.getApprovalStatus()).thenReturn("APPROVED");
        when(merchant.getId()).thenReturn(42);

        var response = authService.login(new LoginRequest("owner", "password"));

        assertThat(response.user().approvalStatus()).isEqualTo("APPROVED");
        assertThat(response.user().merchantId()).isEqualTo(42);
        verify(jwtService).generateToken(argThat(user -> user.merchantId().equals(42)));
    }

    @Test
    void registerMerchantNormalizesPlanAndBillingBeforeSaving() {
        when(accountRepository.existsByUsername("new-owner")).thenReturn(false);
        when(accountRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(roleRepository.findByName("MERCHANT")).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("Password123")).thenReturn("password-hash");
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(merchantRepository.save(any(Merchant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var request = new RegisterMerchantRequest(
                "new-owner",
                "Password123",
                "New Owner",
                "new@example.com",
                "New Shop",
                null,
                null,
                null,
                null,
                List.of(),
                new RegisterMerchantRequest.PlanInfo(" PREMIUM ", " YEARLY ")
        );

        authService.registerMerchant(request);

        verify(merchantRepository).save(argThat(saved ->
                "premium".equals(saved.getPlanId())
                        && "yearly".equals(saved.getBillingCycle())));
    }
}
