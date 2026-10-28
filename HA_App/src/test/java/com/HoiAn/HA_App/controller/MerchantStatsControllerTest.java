package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.ListeningStatsResponse;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.service.ListeningStatsService;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class MerchantStatsControllerTest {
    private ListeningStatsService service;
    private MerchantStatsController controller;

    @BeforeEach
    void setUp() {
        service = mock(ListeningStatsService.class);
        controller = new MerchantStatsController(service);
    }

    @Test
    void usesOnlyTheMerchantIdentityFromTheAuthenticatedPrincipal() {
        AuthUser merchant = new AuthUser(10, "merchant", "MERCHANT", "MERCHANT", 42);
        ListeningStatsResponse expected = new ListeningStatsResponse(0, 0, 0, 0, List.of(), List.of());
        when(service.getStats(42, "month")).thenReturn(expected);

        var result = controller.getListeningStats(merchant, "month");

        org.assertj.core.api.Assertions.assertThat(result).isSameAs(expected);
        verify(service).getStats(42, "month");
        verifyNoMoreInteractions(service);
    }

    @Test
    void rejectsPrincipalsWithoutMerchantIdentityAndUnsupportedRanges() {
        AuthUser withoutMerchant = new AuthUser(11, "user", "MERCHANT", "MERCHANT", null);

        assertThatThrownBy(() -> controller.getListeningStats(withoutMerchant, "week"))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> controller.getListeningStats(
                new AuthUser(10, "merchant", "MERCHANT", "MERCHANT", 42), "year"))
                .isInstanceOf(ResponseStatusException.class);

        verifyNoInteractions(service);
    }
}
