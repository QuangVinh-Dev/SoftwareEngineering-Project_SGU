package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.config.ExchangeRateProperties;
import com.HoiAn.HA_App.exception.ApiException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.MathContext;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ExchangeRateService {
    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);
    private static final Duration CACHE_TTL = Duration.ofMinutes(10);
    private static final Duration CACHE_FALLBACK_TTL = Duration.ofHours(24);

    private final ExchangeRateProvider provider;
    private final ExchangeRateProperties properties;

    // cache key is base currency (always "USD" for our usage)
    private final ConcurrentHashMap<String, CachedRate> cache = new ConcurrentHashMap<>();

    public ExchangeRateService(ExchangeRateProvider provider, ExchangeRateProperties properties) {
        this.provider = provider;
        this.properties = properties;
    }

    /**
     * Record representing a cached set of rates.
     */
    private record CachedRate(Map<String, BigDecimal> rates, Instant fetchedAt) {}

    /**
     * Quote returned to callers.
     */
    public record ExchangeRateQuote(BigDecimal rate, Instant fetchedAt) {}

    /**
     * Get exchange rate from {@code fromCurrency} to VND.
     */
    public ExchangeRateQuote getRate(String fromCurrency, String toCurrency) {
        if (!"VND".equalsIgnoreCase(toCurrency)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Target currency must be VND");
        }
        String base = "USD"; // OpenER API base is USD
        Instant now = Instant.now();
        CachedRate cached = cache.get(base);
        if (cached != null && Duration.between(cached.fetchedAt(), now).compareTo(CACHE_TTL) < 0) {
            // fresh cache
            return buildQuote(fromCurrency, cached.rates(), cached.fetchedAt());
        }
        // Need to fetch new rates
        try {
            Map<String, BigDecimal> rates = provider.getRates(base);
            CachedRate newCache = new CachedRate(rates, now);
            cache.put(base, newCache);
            return buildQuote(fromCurrency, rates, now);
        } catch (IOException e) {
            log.warn("Failed to fetch exchange rates: {}", e.getMessage());
            if (cached != null && Duration.between(cached.fetchedAt(), now).compareTo(CACHE_FALLBACK_TTL) < 0) {
                log.warn("Using stale cached rates ({} ago)", Duration.between(cached.fetchedAt(), now));
                return buildQuote(fromCurrency, cached.rates(), cached.fetchedAt());
            }
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Không lấy được tỷ giá, vui lòng thử lại sau");
        }
    }

    private ExchangeRateQuote buildQuote(String fromCurrency, Map<String, BigDecimal> rates, Instant fetchedAt) {
        BigDecimal vndRate = rates.get("VND");
        BigDecimal fromRate = rates.get(fromCurrency.toUpperCase());
        if (vndRate == null || fromRate == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không hỗ trợ loại tiền");
        }
        if (vndRate.compareTo(BigDecimal.ZERO) <= 0 || fromRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không hỗ trợ loại tiền");
        }
        // rate = VND / FROM
        BigDecimal rate = vndRate.divide(fromRate, MathContext.DECIMAL128);
        return new ExchangeRateQuote(rate, fetchedAt);
    }
}
