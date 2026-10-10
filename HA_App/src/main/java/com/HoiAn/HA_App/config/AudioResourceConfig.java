package com.HoiAn.HA_App.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
public class AudioResourceConfig implements WebMvcConfigurer {
    private final String storagePath;

    public AudioResourceConfig(
            @Value("${app.audio.storage-path:/home/qvinh/Workspace/SoftwareEngineering-Project_SGU/Test}") String storagePath) {
        this.storagePath = storagePath;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path root = Path.of(storagePath).toAbsolutePath().normalize();
            Files.createDirectories(root);
            registry.addResourceHandler("/uploads/audio/**")
                    .addResourceLocations(root.toRealPath().toUri().toString());
        } catch (Exception e) {
            throw new IllegalStateException("Cannot configure audio resource directory", e);
        }
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/uploads/audio/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "HEAD", "OPTIONS")
                .allowedHeaders("*");
    }
}
