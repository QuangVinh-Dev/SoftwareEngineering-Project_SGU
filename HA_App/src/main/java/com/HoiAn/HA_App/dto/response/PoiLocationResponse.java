package com.HoiAn.HA_App.dto.response;



import java.math.BigDecimal;

public record PoiLocationResponse(
        Integer id,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
        Integer radius
) {
}
