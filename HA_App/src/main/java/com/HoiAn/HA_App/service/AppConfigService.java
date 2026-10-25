package com.HoiAn.HA_App.service;


import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.HoiAn.HA_App.entity.AppConfig;
import com.HoiAn.HA_App.repository.AppConfigRepository;

import java.math.BigDecimal;

@Service
public class AppConfigService {

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

    @Transactional(readOnly = true)
    public BigDecimal getUnlockPrice() {
        BigDecimal price = new BigDecimal(
                getRequiredValue("UNLOCK_PRICE")
        );

        // Giá phải dương và là số nguyên VND.
        if (price.signum() <= 0
                || price.stripTrailingZeros().scale() > 0) {
            throw new IllegalStateException(
                    "UNLOCK_PRICE phải là số nguyên VND dương"
            );
        }

        return price;
    }

    @Transactional(readOnly = true)
    public int getUnlockDurationHours() {
        int hours = Integer.parseInt(
                getRequiredValue("UNLOCK_DURATION_HOURS")
        );

        if (hours <= 0) {
            throw new IllegalStateException(
                    "UNLOCK_DURATION_HOURS phải lớn hơn 0"
            );
        }

        return hours;
    }
}
