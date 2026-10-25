package com.HoiAn.HA_App.security;

import com.HoiAn.HA_App.config.SecurityConfig;
import com.HoiAn.HA_App.sercurity.JwtService;
import com.HoiAn.HA_App.service.AccessTokenService;
import com.HoiAn.HA_App.service.PoiService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = com.HoiAn.HA_App.controller.PoiController.class)
@Import(SecurityConfig.class)
class ServiceAccessSecurityTest {
    @Autowired private MockMvc mvc;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private AccessTokenService accessTokenService;
    @MockitoBean private PoiService poiService;

    @BeforeEach
    void setUp() {
        when(jwtService.parseToken(anyString())).thenReturn(Optional.empty());
        when(poiService.getActivePois()).thenReturn(List.of());
    }

    @Test
    void paidContentRejectsMissingOrExpiredServiceTokenAndJwtAlone() throws Exception {
        when(accessTokenService.resolveToken("expired")).thenReturn(Optional.empty());

        mvc.perform(get("/api/poi/locations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/poi/locations").header("X-Service-Token", "expired"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/poi/1/audio?languageCode=vi"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/uploads/audio/paid-audio.mp3"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/poi/locations").header("Authorization", "Bearer login-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validServiceTokenIsAccepted() throws Exception {
        when(accessTokenService.resolveToken("active")).thenReturn(Optional.of("txn-1"));

        mvc.perform(get("/api/poi/locations").header("X-Service-Token", "active"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/poi/1/audio?languageCode=vi")
                        .header("X-Service-Token", "active"))
                .andExpect(status().isOk());

        verify(accessTokenService, times(2)).resolveToken("active");
        verify(poiService).getActivePois();
    }

    @Test
    void redisFailureReturnsUnavailableInsteadOfAllowingPaidContent() throws Exception {
        when(accessTokenService.resolveToken("token"))
                .thenThrow(new RedisConnectionFailureException("redis unavailable"));

        mvc.perform(get("/api/poi/locations").header("X-Service-Token", "token"))
                .andExpect(status().isServiceUnavailable());

        verifyNoInteractions(poiService);
    }
}
