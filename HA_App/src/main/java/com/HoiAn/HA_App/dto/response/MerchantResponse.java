package com.HoiAn.HA_App.dto.response;

import java.time.LocalDateTime;

public record MerchantResponse(
        Integer id,
        Integer accountId,
        String username,
        String email,
        String name,
        String phoneNumber,
        String address,
        String approvalStatus,
        LocalDateTime registeredAt,
        LocalDateTime approvedAt
) {
}
