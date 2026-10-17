package com.HoiAn.HA_App.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class PoiImageResourceConfig implements WebMvcConfigurer {
    private final String location;

    public PoiImageResourceConfig(@Value("${app.poi-image.storage-path:./Data_Storage/poi-images}") String storagePath) {
        this.location = Path.of(storagePath).toAbsolutePath().normalize().toUri().toString();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/poi-images/**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
