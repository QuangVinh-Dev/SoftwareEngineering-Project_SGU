package com.HoiAn.HA_App.dto.response;



import java.math.BigDecimal;
import java.util.List;

public record PoiLocationResponse(
        Integer id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer radius,
        String status,
        String originalDescription,
        String directionLink,
        List<String> images
) {
}
