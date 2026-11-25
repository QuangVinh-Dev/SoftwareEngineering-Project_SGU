package com.HoiAn.HA_App.dto.response;

public record ActionLogResponse(
        Integer id,
        String time,
        String date,
        String username,
        String role,
        String action,
        String target,
        String ip
) {
}
