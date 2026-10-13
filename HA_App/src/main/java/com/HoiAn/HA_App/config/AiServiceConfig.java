package com.HoiAn.HA_App.config;



import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import java.time.Duration;
import java.net.http.HttpClient;

@Configuration
public class AiServiceConfig {

    @Bean("libreTranslateClient")
    RestClient libreTranslateClient(
            @Value("${services.libretranslate-url:http://localhost:5000}") String url) {
        var factory = new org.springframework.http.client.JdkClientHttpRequestFactory(
                HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(30));
        return RestClient.builder()
                .requestFactory(factory)
                .baseUrl(url)
                .build();
    }

    @Bean("piperTtsClient")
    RestClient piperTtsClient(
            @Value("${services.piper-tts-url:http://localhost:5001}") String url) {
        var factory = new org.springframework.http.client.JdkClientHttpRequestFactory(
                HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1)
                        .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(210));
        return RestClient.builder().requestFactory(factory)
                .baseUrl(url)
                .build();
    }
}
