package com.HoiAn.HA_App.config;


import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AudioResourceConfig implements WebMvcConfigurer {

    private final String location;

    public AudioResourceConfig(
            @Value("${audio.storage-path}") String storagePath) {
        this.location = Path.of(storagePath)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/audio/**")
                .addResourceLocations(
                        location.endsWith("/") ? location : location + "/"
                );
    }
}
