package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.config.ExchangeRateProperties;
import com.HoiAn.HA_App.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Implementation of {@link ExchangeRateProvider} using the OpenER API (https://open.er-api.com).
 * The provider returns a map of currency code → rate relative to the requested base currency.
 */
@Component("openErApiProvider")
public class OpenErApiProvider implements ExchangeRateProvider {
    private static final Logger log = LoggerFactory.getLogger(OpenErApiProvider.class);

    private final ExchangeRateProperties properties;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public OpenErApiProvider(ExchangeRateProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(properties.getConnectTimeout()))
                .build();
    }

    @Override
    public Map<String, BigDecimal> getRates(String baseCurrency) throws IOException {
        String url = String.format("%s/%s", properties.getBaseUrl().replaceAll("/+$", ""), baseCurrency);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(properties.getReadTimeout()))
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("OpenErApiProvider received non‑200 status {} for URL {}", response.statusCode(), url);
                throw new IOException("Unexpected HTTP status: " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode resultNode = root.path("result");
            if (!"success".equalsIgnoreCase(resultNode.asText())) {
                log.warn("OpenErApiProvider API indicated failure: {}", root.path("error-type").asText("unknown"));
                throw new IOException("API result not success");
            }
            JsonNode ratesNode = root.path("rates");
            if (!ratesNode.isObject()) {
                throw new IOException("Missing 'rates' object in API response");
            }
            Map<String, BigDecimal> rates = new HashMap<>();
            Iterator<Map.Entry<String, JsonNode>> fields = ratesNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                try {
                    BigDecimal value = new BigDecimal(entry.getValue().asText());
                    rates.put(entry.getKey(), value);
                } catch (Exception ex) {
                    log.debug("Skipping invalid rate for currency {}: {}", entry.getKey(), entry.getValue().asText());
                }
            }
            return rates;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted while fetching exchange rates", e);
        } catch (IOException e) {
            // Wrap IOException for callers; they may decide to fallback to cache.
            log.warn("Failed to fetch exchange rates from OpenER API: {}", e.getMessage());
            throw e;
        }
    }
}
