package com.HoiAn.HA_App.service;

import java.time.Duration;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AccessTokenServiceTest {
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> values = mock(ValueOperations.class);
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);

    private AccessTokenService service() {
        when(redis.opsForValue()).thenReturn(values);
        return new AccessTokenService(redis);
    }

    @Test
    void savesAndResolvesServiceTokenSeparatelyFromJwt() {
        AccessTokenService service = service();
        service.saveToken("service-token", "txn-1", Duration.ofHours(12));
        when(values.get("auth:service-token")).thenReturn("txn-1");

        assertThat(service.resolveToken("service-token")).contains("txn-1");
        verify(values).set("auth:service-token", "txn-1", Duration.ofHours(12));
    }

    @Test
    void missingOrExpiredTokenIsRejectedAndCanBeRevoked() {
        AccessTokenService service = service();
        when(values.get("auth:expired")).thenReturn(null);
        when(redis.getExpire("auth:expired", TimeUnit.MILLISECONDS)).thenReturn(-2L);

        assertThat(service.resolveToken("expired")).isEmpty();
        assertThatThrownBy(() -> service.getExpiresAt("expired"))
                .isInstanceOf(IllegalStateException.class);
        service.revokeToken("expired");
        verify(redis).delete("auth:expired");
    }

    @Test
    void redisFailureIsNotConvertedToAnAuthorizedResult() {
        AccessTokenService service = service();
        when(values.get("auth:token")).thenThrow(new IllegalStateException("redis down"));

        assertThatThrownBy(() -> service.resolveToken("token"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void repeatedClaimReturnsTheSameHandoffTokenWithoutCreatingAnotherGrant() {
        AccessTokenService service = service();
        when(values.get("handoff:txn-1")).thenReturn("same-service-token");

        assertThat(service.claimHandoff("txn-1")).contains("same-service-token");
        assertThat(service.claimHandoff("txn-1")).contains("same-service-token");

        verify(values, times(2)).get("handoff:txn-1");
        verify(values, never()).getAndDelete("handoff:txn-1");
    }
}
