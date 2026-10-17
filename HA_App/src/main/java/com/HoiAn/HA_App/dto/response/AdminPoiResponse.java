package com.HoiAn.HA_App.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminPoiResponse(
        Integer id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer radius,
        Integer priorityLevel,
        String originalDescription,
        String directionLink,
        String status,
        String approvalStatus,
        String rejectionReason,
        List<String> images
) {}
