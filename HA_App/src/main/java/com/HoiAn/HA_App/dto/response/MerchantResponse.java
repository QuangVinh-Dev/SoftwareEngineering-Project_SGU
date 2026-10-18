package com.HoiAn.HA_App.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record MerchantResponse(
        Integer id,
        Integer accountId,
        String username,
        String email,
        String name,
        String phoneNumber,
        String address,
        String category,
        String description,
        String planId,
        String billingCycle,
        List<String> images,
        String approvalStatus,
        String rejectReason,
        LocalDateTime registeredAt,
        LocalDateTime approvedAt
) {
}
