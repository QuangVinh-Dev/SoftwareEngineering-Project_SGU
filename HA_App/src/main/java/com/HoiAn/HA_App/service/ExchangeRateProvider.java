package com.HoiAn.HA_App.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Map;

public interface ExchangeRateProvider {
    /**
     * Returns a map of currency code → rate relative to the base currency used by the provider.
     * The base currency is the one requested in the URL (e.g. USD for open.er-api.com).
     */
    Map<String, BigDecimal> getRates(String baseCurrency) throws IOException;
}
