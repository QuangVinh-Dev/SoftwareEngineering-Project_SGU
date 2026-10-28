package com.HoiAn.HA_App.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ListeningStartRequest(
        @NotNull Integer audioId,
        @NotBlank @Pattern(regexp = "vi|en|zh|ja|ko") String languageCode,
        @NotBlank @Pattern(regexp = "AUTO_GPS|TAP") String triggerMethod
) {}
