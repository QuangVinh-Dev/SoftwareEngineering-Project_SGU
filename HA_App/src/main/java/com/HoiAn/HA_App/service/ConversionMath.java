package com.HoiAn.HA_App.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility for currency conversion calculations.
 */
public final class ConversionMath {
    private ConversionMath() { }

    /**
     * Convert {@code amount} using {@code rate} and round up to the nearest whole VND.
     * The result has scale 0 (no decimal) and uses CEILING rounding.
     */
    public static BigDecimal toVnd(BigDecimal amount, BigDecimal rate) {
        if (amount == null || rate == null) {
            throw new IllegalArgumentException("Amount and rate must not be null");
        }
        return amount.multiply(rate).setScale(0, RoundingMode.CEILING);
    }
}
