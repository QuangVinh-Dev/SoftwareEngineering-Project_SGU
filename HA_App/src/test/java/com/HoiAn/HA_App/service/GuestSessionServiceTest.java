package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.GuestSession;
import com.HoiAn.HA_App.repository.GuestSessionRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class GuestSessionServiceTest {
    @Test
    void upsertsByAnonymousDeviceIdAndReturnsTheExistingSession() {
        GuestSessionRepository repository = mock(GuestSessionRepository.class);
        GuestSession existing = mock(GuestSession.class);
        when(repository.findByAnonymousDeviceId("browser-uuid"))
                .thenReturn(Optional.of(existing));
        GuestSessionService service = new GuestSessionService(repository);

        GuestSession result = service.registerOrUpdate("browser-uuid", "vi", "mobile");

        assertThat(result).isSameAs(existing);
        verify(repository).upsert("browser-uuid", "vi", "mobile");
        verify(repository).findByAnonymousDeviceId("browser-uuid");
    }
}
