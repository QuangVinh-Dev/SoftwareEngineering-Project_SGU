package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.config.VnPayProperties;
import com.HoiAn.HA_App.entity.GuestSession;
import com.HoiAn.HA_App.entity.Payment;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.event.PaymentConfirmedEvent;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PaymentRepository;
import com.HoiAn.HA_App.util.VnPayUtil;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PaymentServiceSecurityTest {
    private static final String HASH_SECRET = "test-hash-secret";

    private PaymentRepository payments;
    private GuestSessionService sessions;
    private AppConfigService configs;
    private AccessTokenService tokens;
    private ApplicationEventPublisher events;
    private PaymentService service;
    private VnPayProperties vnpay;

    @BeforeEach
    void setUp() {
        payments = mock(PaymentRepository.class);
        sessions = mock(GuestSessionService.class);
        configs = mock(AppConfigService.class);
        tokens = mock(AccessTokenService.class);
        events = mock(ApplicationEventPublisher.class);
        vnpay = new VnPayProperties(
                "TMNCODE", HASH_SECRET,
                "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
                "https://app.example.test/", "https://api.example.test/api/payments/vnpay/ipn");
        service = new PaymentService(payments, sessions, configs, vnpay, tokens, events);
    }

    @Test
    void newPaymentAlwaysUsesServerPriceAndLinksTheRegisteredGuestSession() {
        GuestSession guest = mock(GuestSession.class);
        when(guest.getId()).thenReturn(37);
        when(sessions.registerOrUpdate("device-uuid", "vi", "mobile")).thenReturn(guest);
        when(configs.getUnlockPrice()).thenReturn(new BigDecimal("20000"));
        when(configs.getRequiredValue("UNLOCK_CURRENCY")).thenReturn("VND");

        var response = service.createPayment("127.0.0.1", "device-uuid", "vi", "mobile");

        assertThat(response.paymentUrl()).startsWith(vnpay.payUrl() + "?");
        assertThat(response.claimSecret()).isNotBlank();
        verify(sessions).registerOrUpdate("device-uuid", "vi", "mobile");
        var captor = org.mockito.ArgumentCaptor.forClass(Payment.class);
        verify(payments).save(captor.capture());
        assertThat(captor.getValue().getSessionId()).isEqualTo(37);
        assertThat(captor.getValue().getAmount()).isEqualByComparingTo("20000");
    }

    @Test
    void statusCannotBeReadWithOnlyATransactionReference() {
        Payment payment = pendingPayment("txn-status");
        when(payments.findByProviderTxnId("txn-status")).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> service.getPaymentStatus("txn-status", null, null))
                .isInstanceOf(NoSuchElementException.class);
        assertThatThrownBy(() -> service.getPaymentStatus("txn-status", "wrong", null))
                .isInstanceOf(NoSuchElementException.class);
        assertThat(service.getPaymentStatus("txn-status", "claim-secret", null).status())
                .isEqualTo("PENDING");
    }

    @Test
    void accessTokenCanReadOnlyItsOwnPaymentAndGetsBackendExpiry() {
        Payment payment = pendingPayment("txn-access");
        payment.setStatus(PaymentStatus.PAID);
        when(payments.findByProviderTxnId("txn-access")).thenReturn(Optional.of(payment));
        when(tokens.resolveToken("service-token")).thenReturn(Optional.of("txn-access"));
        when(tokens.getExpiresAt("service-token")).thenReturn(java.time.Instant.now().plusSeconds(7200));

        var status = service.getPaymentStatus("txn-access", null, "service-token");

        assertThat(status.accessExpiresAt()).isNotNull();
        assertThat(status.secondsRemaining()).isPositive();
        when(tokens.resolveToken("other-token")).thenReturn(Optional.of("another-txn"));
        assertThatThrownBy(() -> service.getPaymentStatus("txn-access", null, "other-token"))
                .isInstanceOf(NoSuchElementException.class);
    }

    @Test
    void signedIpnIsIdempotentAndPublishesEntitlementOnlyOnce() {
        AtomicReference<Payment> row = new AtomicReference<>(pendingPayment("txn-ipn"));
        when(payments.findByProviderTxnIdForUpdate("txn-ipn"))
                .thenAnswer(invocation -> Optional.of(row.get()));
        when(payments.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            row.set(saved);
            return saved;
        });
        Map<String, String> ipn = signedIpn("txn-ipn");

        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("00");
        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("00");

        assertThat(row.get().getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(row.get().getPaidAt()).isNotNull();
        assertThat(row.get().getProviderTransactionNo()).isEqualTo("123456789");
        when(payments.findByProviderTxnId("txn-ipn")).thenReturn(Optional.of(row.get()));
        assertThat(service.getPaymentStatus("txn-ipn", "claim-secret", null).status()).isEqualTo("PAID");
        verify(payments, times(1)).save(any(Payment.class));
        verify(events, times(1)).publishEvent(any(PaymentConfirmedEvent.class));
    }

    @Test
    void signedBrowserReturnIsVerifiedAndUpdatesTheSamePaymentIdempotently() {
        Payment row = pendingPayment("txn-return");
        when(payments.findByProviderTxnIdForUpdate("txn-return")).thenReturn(Optional.of(row));
        when(payments.save(row)).thenReturn(row);
        when(payments.findByProviderTxnId("txn-return")).thenReturn(Optional.of(row));

        var response = service.handleReturn(signedIpn("txn-return"));

        assertThat(response.verified()).isTrue();
        assertThat(response.txnRef()).isEqualTo("txn-return");
        assertThat(response.status()).isEqualTo("PAID");
        assertThat(row.getStatus()).isEqualTo(PaymentStatus.PAID);
        verify(events).publishEvent(any(PaymentConfirmedEvent.class));
    }

    @Test
    void invalidBrowserReturnCannotUpdatePayment() {
        Map<String, String> returned = signedIpn("txn-return-invalid");
        returned.put("vnp_Amount", "1");

        var response = service.handleReturn(returned);

        assertThat(response.verified()).isFalse();
        assertThat(response.status()).isNull();
        verifyNoInteractions(payments, events);
    }

    @Test
    void invalidIpnSignatureDoesNotChangePaymentOrPublishEntitlement() {
        AtomicReference<Payment> row = new AtomicReference<>(pendingPayment("txn-invalid"));
        when(payments.findByProviderTxnIdForUpdate("txn-invalid"))
                .thenAnswer(invocation -> Optional.of(row.get()));
        Map<String, String> ipn = signedIpn("txn-invalid");
        ipn.put("vnp_Amount", "1");

        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("97");
        assertThat(row.get().getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(events, never()).publishEvent(any(PaymentConfirmedEvent.class));
    }

    @Test
    void paymentUrlContainsRequiredFieldsAndSignsExactlyTheEncodedQuery() throws Exception {
        GuestSession guest = mock(GuestSession.class);
        when(guest.getId()).thenReturn(37);
        when(sessions.registerOrUpdate(any(), any(), any())).thenReturn(guest);
        when(configs.getUnlockPrice()).thenReturn(new BigDecimal("20000"));
        when(configs.getRequiredValue("UNLOCK_CURRENCY")).thenReturn("VND");

        var created = service.createPayment("127.0.0.1", "device", "vi", "desktop");
        String query = URI.create(created.paymentUrl()).getRawQuery();
        Map<String, String> fields = new HashMap<>();
        for (String entry : query.split("&")) {
            String[] pair = entry.split("=", 2);
            fields.put(pair[0], URLDecoder.decode(pair[1], StandardCharsets.UTF_8));
        }
        assertThat(fields).containsEntry("vnp_ReturnUrl", vnpay.returnUrl())
                .containsEntry("vnp_Version", "2.1.0").containsEntry("vnp_Command", "pay")
                .containsEntry("vnp_Amount", "2000000").containsEntry("vnp_CurrCode", "VND")
                .containsEntry("vnp_TxnRef", created.txnRef()).containsEntry("vnp_IpAddr", "127.0.0.1");
        DateTimeFormatter format = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        assertThat(Duration.between(LocalDateTime.parse(fields.get("vnp_CreateDate"), format),
                LocalDateTime.parse(fields.get("vnp_ExpireDate"), format))).isEqualTo(Duration.ofMinutes(15));

        Mac mac = Mac.getInstance("HmacSHA512");
        mac.init(new SecretKeySpec(HASH_SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
        String signedQuery = query.substring(0, query.lastIndexOf("&vnp_SecureHash="));
        String expected = HexFormat.of().formatHex(mac.doFinal(signedQuery.getBytes(StandardCharsets.UTF_8)));
        assertThat(fields.get("vnp_SecureHash")).isEqualTo(expected);
    }

    @Test
    void missingOrInvalidReturnUrlIsRejectedBeforePersistingAnything() {
        for (String returnUrl : new String[] { "", "localhost:5173", "javascript:alert(1)" }) {
            var invalidConfig = new VnPayProperties(vnpay.tmnCode(), HASH_SECRET,
                    vnpay.payUrl(), returnUrl, vnpay.ipnUrl());
            var invalidService = new PaymentService(payments, sessions, configs, invalidConfig, tokens, events);

            assertThatThrownBy(() -> invalidService.createPayment("127.0.0.1", "device", "vi", "desktop"))
                    .isInstanceOf(IllegalStateException.class).hasMessageContaining("VNPAY_RETURN_URL");
        }
        verifyNoInteractions(payments, sessions, configs, tokens, events);
    }

    @Test
    void signedWrongAmountDoesNotChangePayment() {
        Payment row = pendingPayment("txn-amount");
        when(payments.findByProviderTxnIdForUpdate("txn-amount")).thenReturn(Optional.of(row));
        Map<String, String> ipn = signedIpn("txn-amount");
        ipn.put("vnp_Amount", "100");
        resign(ipn);

        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("04");
        assertThat(row.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(payments, never()).save(any());
        verifyNoInteractions(events);
    }

    @Test
    void signedUnknownOrderIsRejected() {
        when(payments.findByProviderTxnIdForUpdate("unknown")).thenReturn(Optional.empty());

        assertThat(service.handleIpn(signedIpn("unknown")).RspCode()).isEqualTo("01");
        verify(payments, never()).save(any());
        verifyNoInteractions(events);
    }

    @Test
    void signedWrongMerchantIsRejectedBeforeLookingUpPayment() {
        Map<String, String> ipn = signedIpn("txn-merchant");
        ipn.put("vnp_TmnCode", "OTHER001");
        resign(ipn);

        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("97");
        verifyNoInteractions(payments, events);
    }

    @Test
    void signedCancellationUpdatesFailedOnceAndDoesNotGrantAccess() {
        Payment row = pendingPayment("txn-cancel");
        when(payments.findByProviderTxnIdForUpdate("txn-cancel")).thenReturn(Optional.of(row));
        Map<String, String> ipn = signedIpn("txn-cancel");
        ipn.put("vnp_ResponseCode", "24");
        ipn.put("vnp_TransactionStatus", "02");
        resign(ipn);

        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("00");
        assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("02");
        assertThat(row.getStatus()).isEqualTo(PaymentStatus.FAILED);
        assertThat(row.getPaidAt()).isNull();
        verify(payments, times(1)).save(row);
        verifyNoInteractions(events, tokens);
    }

    @Test
    void signedMissingOrMalformedResultDoesNotTurnPendingIntoFailed() {
        Payment row = pendingPayment("txn-incomplete");
        when(payments.findByProviderTxnIdForUpdate("txn-incomplete")).thenReturn(Optional.of(row));
        for (String field : new String[] { "vnp_ResponseCode", "vnp_TransactionStatus", "vnp_TransactionNo" }) {
            Map<String, String> ipn = signedIpn("txn-incomplete");
            ipn.remove(field);
            resign(ipn);
            assertThat(service.handleIpn(ipn).RspCode()).isEqualTo("99");
        }
        Map<String, String> malformed = signedIpn("txn-incomplete");
        malformed.put("vnp_TransactionStatus", "invalid");
        resign(malformed);
        assertThat(service.handleIpn(malformed).RspCode()).isEqualTo("99");
        assertThat(row.getStatus()).isEqualTo(PaymentStatus.PENDING);
        verify(payments, never()).save(any());
        verifyNoInteractions(events);
    }

    @Test
    void failedPaymentCannotBeResurrectedByAnotherNotification() {
        Payment row = pendingPayment("txn-failed");
        row.setStatus(PaymentStatus.FAILED);
        when(payments.findByProviderTxnIdForUpdate("txn-failed")).thenReturn(Optional.of(row));

        assertThat(service.handleIpn(signedIpn("txn-failed")).RspCode()).isEqualTo("02");
        assertThat(row.getStatus()).isEqualTo(PaymentStatus.FAILED);
        verifyNoInteractions(events);
    }

    @Test
    void pendingPaymentCannotBeClaimed() {
        when(payments.findByClaimSecretHash(VnPayUtil.sha256Hex("claim-secret")))
                .thenReturn(Optional.of(pendingPayment("txn-pending")));

        assertThatThrownBy(() -> service.claimAccess("claim-secret"))
                .isInstanceOf(ApiException.class)
                .extracting(error -> ((ApiException) error).getStatus())
                .isEqualTo(org.springframework.http.HttpStatus.CONFLICT);
        verifyNoInteractions(tokens);
    }

    private static Payment pendingPayment(String txnRef) {
        Payment payment = new Payment();
        payment.setProviderTxnId(txnRef);
        payment.setClaimSecretHash(VnPayUtil.sha256Hex("claim-secret"));
        payment.setAmount(new BigDecimal("20000"));
        payment.setCurrency("VND");
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        return payment;
    }

    private Map<String, String> signedIpn(String txnRef) {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TmnCode", "TMNCODE");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", "2000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_TransactionStatus", "00");
        params.put("vnp_TransactionNo", "123456789");
        resign(params);
        return params;
    }

    private void resign(Map<String, String> params) {
        params.remove("vnp_SecureHash");
        params.put("vnp_SecureHash",
                VnPayUtil.hmacSha512(HASH_SECRET, VnPayUtil.buildHashData(params)));
    }
}
