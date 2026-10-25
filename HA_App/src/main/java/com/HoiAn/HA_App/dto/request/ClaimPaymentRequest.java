package com.HoiAn.HA_App.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClaimPaymentRequest(
        @NotBlank
        @Size(max = 200)
        String claimSecret
) {
}
