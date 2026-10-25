package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.config.SecurityConfig;
import com.HoiAn.HA_App.dto.response.CreatePaymentResponse;
import com.HoiAn.HA_App.dto.response.VnPayIpnResponse;
import com.HoiAn.HA_App.sercurity.JwtService;
import com.HoiAn.HA_App.service.AccessTokenService;
import com.HoiAn.HA_App.service.PaymentService;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PaymentController.class)
@Import(SecurityConfig.class)
class PaymentControllerIpnTest {
    @Autowired private MockMvc mvc;
    @MockitoBean private PaymentService payments;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private AccessTokenService tokens;

    @Test
    void ipnDoesNotRequireLoginAndUsesVnPayJsonFieldNames() throws Exception {
        when(payments.handleIpn(anyMap())).thenReturn(new VnPayIpnResponse("97", "Invalid Checksum"));

        mvc.perform(get("/api/payments/vnpay/ipn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("97"))
                .andExpect(jsonPath("$.Message").value("Invalid Checksum"));
        verify(payments).handleIpn(anyMap());
        verifyNoInteractions(tokens, jwtService);
    }

    @Test
    void duplicateVnpParametersAreRejectedBeforeProcessing() throws Exception {
        mvc.perform(get("/api/payments/vnpay/ipn").param("vnp_Amount", "100", "200"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.RspCode").value("97"));
        verifyNoInteractions(payments);
    }

    @Test
    void processingFailureReturnsRetryableJsonWithoutExceptionDetails() throws Exception {
        when(payments.handleIpn(anyMap())).thenThrow(new IllegalStateException("private-error-detail"));

        mvc.perform(get("/api/payments/vnpay/ipn"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.RspCode").value("99"))
                .andExpect(content().string(not(containsString("private-error-detail"))));
    }

    @Test
    void guestPaymentCreatesServerCookieWithoutTrustingSessionIdFromBody() throws Exception {
        when(payments.createPayment(anyString(), anyString(), any(), anyString()))
                .thenReturn(new CreatePaymentResponse("test-ref", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "test-claim"));

        var result = mvc.perform(post("/api/payments")
                        .header("Origin", "http://localhost:5173")
                        .contentType("application/json").content("{\"session_id\":999,\"userId\":999}"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"))
                .andExpect(cookie().httpOnly("hoian_guest_session", true))
                .andExpect(cookie().secure("hoian_guest_session", true)).andReturn();

        Cookie guest = result.getResponse().getCookie("hoian_guest_session");
        assertThat(guest).isNotNull();
        assertThat(UUID.fromString(guest.getValue())).isNotNull();
        verify(payments).createPayment(anyString(), eq(guest.getValue()), any(), anyString());
        verifyNoInteractions(jwtService, tokens);
    }

    @Test
    void existingGuestCookieIsRestoredWithoutCreatingAnotherIdentity() throws Exception {
        String device = UUID.randomUUID().toString();
        when(payments.createPayment(anyString(), eq(device), any(), anyString()))
                .thenReturn(new CreatePaymentResponse("test-ref", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html", "test-claim"));

        mvc.perform(post("/api/payments").cookie(new Cookie("hoian_guest_session", device)))
                .andExpect(status().isOk()).andExpect(cookie().doesNotExist("hoian_guest_session"));
        verify(payments).createPayment(anyString(), eq(device), any(), anyString());
    }
}
