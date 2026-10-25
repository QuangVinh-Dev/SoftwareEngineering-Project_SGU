package com.HoiAn.HA_App.service;


import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.TimeUnit;
import java.util.Optional;

@Service
public class AccessTokenService {

    private final StringRedisTemplate redis;
    private final SecureRandom secureRandom = new SecureRandom();

    public AccessTokenService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Sinh token ngẫu nhiên đủ mạnh.
     *
     * Token là bearer credential: ai có token có thể sử dụng nó,
     * do đó không được ghi token vào log.
     */
    public String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    /**
     * Lưu token vào Redis theo cấu trúc auth:{token}.
     *
     * Giá trị lưu là txnRef để biết token được cấp từ giao dịch nào.
     */
    public void saveToken(
            String token,
            String txnRef,
            Duration ttl
    ) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException(
                    "TTL phải lớn hơn 0"
            );
        }

        redis.opsForValue().set(
                "auth:" + token,
                txnRef,
                ttl
        );
    }

    /**
     * Kiểm tra token có còn tồn tại và chưa hết hạn hay không.
     */
    public Optional<String> resolveToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        return Optional.ofNullable(
                redis.opsForValue().get("auth:" + token)
        );
    }

    public Instant getExpiresAt(String token) {
        long remainingMillis = redis.getExpire("auth:" + token, TimeUnit.MILLISECONDS);
        if (remainingMillis <= 0) {
            throw new IllegalStateException("Quyền sử dụng đã hết hạn");
        }
        return Instant.now().plusMillis(remainingMillis);
    }

    public void revokeToken(String token) {
        if (token != null && !token.isBlank()) {
            redis.delete("auth:" + token);
        }
    }

    /**
     * Lưu token để trình duyệt nhận một lần qua claim.
     */
    public void saveHandoff(
            String txnRef,
            String token,
            Duration ttl
    ) {
        redis.opsForValue().set(
                "handoff:" + txnRef,
                token,
                ttl
        );
    }

    /**
     * Trả lại cùng một handoff trong thời hạn ngắn để request claim có thể retry
     * an toàn nếu response bị mất. Không tạo một quyền/token mới.
     */
    public Optional<String> claimHandoff(String txnRef) {
        return Optional.ofNullable(
                redis.opsForValue().get("handoff:" + txnRef)
        );
    }
}
