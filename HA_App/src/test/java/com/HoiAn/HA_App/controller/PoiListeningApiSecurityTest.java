package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.config.SecurityConfig;
import com.HoiAn.HA_App.entity.Payment;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.repository.AudioRepository;
import com.HoiAn.HA_App.repository.ListeningLogRepository;
import com.HoiAn.HA_App.repository.PaymentRepository;
import com.HoiAn.HA_App.sercurity.JwtService;
import com.HoiAn.HA_App.service.AccessTokenService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PoiListeningController.class)
@Import(SecurityConfig.class)
class PoiListeningApiSecurityTest {
    @Autowired private MockMvc mvc;
    @MockitoBean private PaymentRepository payments;
    @MockitoBean private AudioRepository audios;
    @MockitoBean private ListeningLogRepository logs;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private AccessTokenService accessTokens;

    @Test
    void rejectsListeningLogRequestsWithoutServiceAccess() throws Exception {
        mvc.perform(post("/api/poi/23/listening")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"audioId\":8,\"languageCode\":\"vi\",\"triggerMethod\":\"TAP\"}"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(payments, audios, logs);
    }

    @Test
    void acceptsOnlyAValidPaidServiceTokenForListeningLog() throws Exception {
        Payment payment = new Payment();
        payment.setSessionId(41);
        payment.setStatus(PaymentStatus.PAID);
        when(accessTokens.resolveToken("service-token")).thenReturn(Optional.of("txn-1"));
        when(payments.findByProviderTxnId("txn-1")).thenReturn(Optional.of(payment));
        when(audios.isApprovedAudioForPoi(23, 8, "vi")).thenReturn(true);

        mvc.perform(post("/api/poi/23/listening")
                        .header("X-Service-Token", "service-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"audioId\":8,\"languageCode\":\"vi\",\"triggerMethod\":\"TAP\"}"))
                .andExpect(status().isCreated());

        verify(logs).recordStart(41, 23, 8, "vi", "TAP");
        verifyNoInteractions(jwtService);
    }
}
