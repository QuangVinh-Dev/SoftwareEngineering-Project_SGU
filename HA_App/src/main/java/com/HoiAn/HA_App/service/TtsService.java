package com.HoiAn.HA_App.service;



import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TtsService {

    private static final Set<String> SUPPORTED_LANGUAGES =
            Set.of("vi", "en", "ja", "ko", "zh");

    private final RestClient client;

    public TtsService(
            @Qualifier("piperTtsClient") RestClient client) {
        this.client = client;
    }

    public byte[] synthesize(String text, String languageCode) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException(
                    "Nội dung tạo audio không được để trống");
        }

        if (languageCode == null
                || !SUPPORTED_LANGUAGES.contains(
                        languageCode.toLowerCase())) {
            throw new IllegalArgumentException(
                    "Mã ngôn ngữ TTS không được hỗ trợ");
        }

        Map<String, String> request = Map.of(
                "text", text,
                "language_code", languageCode.toLowerCase()
        );

        byte[] audio = client.post()
                .uri("/synthesize")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.valueOf("audio/mpeg"))
                .body(request)
                .retrieve()
                .body(byte[].class);

        if (audio == null || audio.length == 0) {
            throw new IllegalStateException(
                    "Piper không trả về file MP3");
        }

        return audio;
    }
}
