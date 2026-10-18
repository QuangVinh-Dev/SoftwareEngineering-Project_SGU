package com.HoiAn.HA_App.dto.request;

import jakarta.validation.constraints.Size;

public record RejectMerchantRequest(
        @Size(max = 500, message = "Lý do tối đa 500 ký tự") String reason
) {
}
