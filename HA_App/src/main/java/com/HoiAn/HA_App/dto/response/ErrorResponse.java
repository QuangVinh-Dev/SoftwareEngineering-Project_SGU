package com.HoiAn.HA_App.dto.response;

import java.util.Map;

public record ErrorResponse(String message, Map<String, String> errors) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(message, Map.of());
    }
}
