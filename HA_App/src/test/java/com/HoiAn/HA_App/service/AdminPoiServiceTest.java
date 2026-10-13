package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminPoiServiceTest {
    @Mock private PoiRepository pois;
    @Mock private AdminPoiContentService contentService;

    @Test
    void createsPersistedPoiUsingExistingEntityFields() {
        when(pois.save(any(Poi.class))).thenAnswer(invocation -> invocation.getArgument(0));
        AdminPoiService service = new AdminPoiService(pois, contentService);
        var request = new AdminPoiService.PoiMutationRequest("  Test POI  ", new BigDecimal("15.123456"),
                new BigDecimal("108.123456"), 30, 2, "Vietnamese narration", null, "ACTIVE");

        var response = service.create(request);

        ArgumentCaptor<Poi> captor = ArgumentCaptor.forClass(Poi.class);
        verify(pois).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Test POI");
        assertThat(captor.getValue().getOriginalDescription()).isEqualTo("Vietnamese narration");
        assertThat(response.latitude()).isEqualByComparingTo("15.123456");
        assertThat(response.status()).isEqualTo("ACTIVE");
        assertThat(response.id()).isNull(); // database generates the ID
    }
}
