package com.HoiAn.HA_App.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

public record PaymentStatusResponse(
        String txnRef,
        BigDecimal amount,
        String currency,
        String status,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        Instant accessExpiresAt,
        Long secondsRemaining
) {
}
