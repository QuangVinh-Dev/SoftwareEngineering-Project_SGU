package com.HoiAn.HA_App.dto.response;

public record AdminAccountResponse(
        Integer id,
        String username,
        String fullName,
        String email,
        String role,
        String accountType,
        String status,
        String createdAt,
        String lastLogin
) {
}
