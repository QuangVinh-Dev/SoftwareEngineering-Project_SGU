package com.HoiAn.HA_App.dto.response;

public record MerchantRegistrationResponse(
        Integer accountId,
        Integer merchantId,
        String approvalStatus,
        String message
) {
}
