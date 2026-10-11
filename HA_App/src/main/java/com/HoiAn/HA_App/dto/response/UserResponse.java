package com.HoiAn.HA_App.dto.response;

public record UserResponse(
        Integer id,
        String username,
        String fullName,
        String email,
        String role,
        String accountType,
        Integer merchantId
) {
}
