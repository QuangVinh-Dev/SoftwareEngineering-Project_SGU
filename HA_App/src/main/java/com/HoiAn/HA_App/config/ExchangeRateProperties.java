package com.HoiAn.HA_App.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "exchange.rate")
public class ExchangeRateProperties {
    /** Base URL of the third‑party rate API, e.g. https://open.er-api.com/v6/latest */
    private String baseUrl = "https://open.er-api.com/v6/latest";

    /** Connection timeout in seconds. */
    private int connectTimeout = 3;

    /** Read timeout in seconds. */
    private int readTimeout = 5;

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public int getConnectTimeout() {
        return connectTimeout;
    }

    public void setConnectTimeout(int connectTimeout) {
        this.connectTimeout = connectTimeout;
    }

    public int getReadTimeout() {
        return readTimeout;
    }

    public void setReadTimeout(int readTimeout) {
        this.readTimeout = readTimeout;
    }
}
