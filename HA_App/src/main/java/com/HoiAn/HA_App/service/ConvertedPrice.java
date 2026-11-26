package com.HoiAn.HA_App.service;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Record representing a converted price for display purposes.
 */
public record ConvertedPrice(
        BigDecimal originalAmount,
        String originalCurrency,
        BigDecimal rate,
        BigDecimal vndAmount,
        Instant rateFetchedAt
) {}
