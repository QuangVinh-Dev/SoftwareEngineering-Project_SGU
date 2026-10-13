package com.HoiAn.HA_App.service;


import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class TranslationService {

    private final RestClient client;

    public TranslationService(
            @Qualifier("libreTranslateClient") RestClient client) {
        this.client = client;
    }

    private record TranslateRequest(
            String q,
            String source,
            String target,
            String format
    ) {}

    private record TranslateResponse(String translatedText) {}

    public String translate(
            String text,
            String sourceLanguage,
            String targetLanguage) {

        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung cần dịch không được để trống");
        }

        if (sourceLanguage == null || sourceLanguage.isBlank()
                || targetLanguage == null || targetLanguage.isBlank()) {
            throw new IllegalArgumentException(
                    "Thiếu mã ngôn ngữ nguồn hoặc đích");
        }

        if (sourceLanguage.equalsIgnoreCase(targetLanguage)) {
            return text;
        }

        TranslateRequest request = new TranslateRequest(
                text,
                libreCode(sourceLanguage),
                libreCode(targetLanguage),
                "text"
        );

        try {
        TranslateResponse response = client.post()
                .uri("/translate")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(TranslateResponse.class);

        if (response == null
                || response.translatedText() == null
                || response.translatedText().isBlank()) {
            throw new IllegalStateException(
                    "LibreTranslate không trả về bản dịch");
        }

        return response.translatedText();
        } catch (RestClientException ex) {
            throw new IllegalStateException("LibreTranslate không khả dụng hoặc không hỗ trợ cặp "
                    + sourceLanguage + " → " + targetLanguage + ": " + ex.getMessage(), ex);
        }
    }

    private static String libreCode(String code) {
        return "zh".equalsIgnoreCase(code) ? "zh-Hans" : code.toLowerCase();
    }
}
