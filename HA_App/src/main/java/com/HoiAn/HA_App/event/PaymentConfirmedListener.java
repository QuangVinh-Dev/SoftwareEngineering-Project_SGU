package com.HoiAn.HA_App.event;


import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.HoiAn.HA_App.service.AccessTokenService;
import com.HoiAn.HA_App.service.AppConfigService;

import java.time.Duration;

@Component
public class PaymentConfirmedListener {

    private final AccessTokenService tokenService;
    private final AppConfigService configService;

    public PaymentConfirmedListener(
            AccessTokenService tokenService,
            AppConfigService configService
    ) {
        this.tokenService = tokenService;
        this.configService = configService;
    }

    /**
     * Chỉ chạy sau khi transaction PostgreSQL commit thành công.
     */
    @TransactionalEventListener(
            phase = TransactionPhase.AFTER_COMMIT
    )
    public void onPaymentConfirmed(
            PaymentConfirmedEvent event
    ) {
        int hours = configService.getUnlockDurationHours();
        Duration tokenTtl = Duration.ofHours(hours);

        // Tạo token truy cập có entropy cao.
        String token = tokenService.generateToken();

        // Token dùng để truy cập dịch vụ trong thời hạn quy định.
        tokenService.saveToken(
                token,
                event.txnRef(),
                tokenTtl
        );

        // Token handoff có thời hạn ngắn để frontend nhận sau thanh toán.
        tokenService.saveHandoff(
                event.txnRef(),
                token,
                Duration.ofMinutes(15)
        );
    }
}
