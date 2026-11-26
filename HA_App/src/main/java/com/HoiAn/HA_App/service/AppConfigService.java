package com.HoiAn.HA_App.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.HoiAn.HA_App.entity.AppConfig;
import com.HoiAn.HA_App.repository.AppConfigRepository;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.Set;

@Service
public class AppConfigService {

    /** Các đơn vị tiền tệ hợp lệ cho thanh toán VNPay. Phải khớp với PaymentService. */
    private static final Set<String> SUPPORTED_CURRENCIES = Set.of("VND");

    private final AppConfigRepository repository;

    public AppConfigService(AppConfigRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public String getRequiredValue(String key) {
        return repository.findById(key)
                .map(AppConfig::getConfigValue)
                .filter(value -> !value.isBlank())
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Thiếu cấu hình hệ thống: " + key
                        )
                );
    }

    /**
     * Lấy giá mở khóa. Giá phải là số nguyên VND dương.
     */
    @Transactional(readOnly = true)
    public BigDecimal getUnlockPrice() {
        String key = "UNLOCK_PRICE";
        String raw = getRequiredValue(key).trim();

        BigDecimal price;
        try {
            price = new BigDecimal(raw);
        } catch (NumberFormatException ex) {
            throw new IllegalStateException(
                    key + " không phải là số hợp lệ: " + raw, ex
            );
        }

        if (price.signum() <= 0) {
            throw new IllegalStateException(key + " phải lớn hơn 0");
        }

        if (price.remainder(BigDecimal.ONE).signum() != 0) {
            throw new IllegalStateException(key + " phải là số nguyên VND");
        }

        return price;
    }

    /**
     * Lấy đơn vị tiền tệ thanh toán. Chỉ chấp nhận các đơn vị trong SUPPORTED_CURRENCIES.
     */
    @Transactional(readOnly = true)
    public String getUnlockCurrency() {
        String key = "UNLOCK_CURRENCY";
        String currency = getRequiredValue(key).trim().toUpperCase(Locale.ROOT);

        if (!SUPPORTED_CURRENCIES.contains(currency)) {
            throw new IllegalStateException(
                    key + " không được hỗ trợ: " + currency
                            + ". Chỉ hỗ trợ: " + SUPPORTED_CURRENCIES
            );
        }

        return currency;
    }

    @Transactional(readOnly = true)
    public int getUnlockDurationHours() {
        String key = "UNLOCK_DURATION_HOURS";
        int hours;
        try {
            hours = Integer.parseInt(getRequiredValue(key).trim());
        } catch (NumberFormatException ex) {
            throw new IllegalStateException(key + " phải là số nguyên", ex);
        }

        if (hours <= 0) {
            throw new IllegalStateException(key + " phải lớn hơn 0");
        }

        return hours;
    }
}