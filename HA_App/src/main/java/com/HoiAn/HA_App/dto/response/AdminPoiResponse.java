package com.HoiAn.HA_App.dto.response;

import java.math.BigDecimal;

public record AdminPoiResponse(
        Integer id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer radius,
        Integer priorityLevel,
        String originalDescription,
        String directionLink,
        String status
) {}
