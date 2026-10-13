package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.service.AdminPoiContentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/pois/{poiId}")
public class AdminPoiContentController {
    private final AdminPoiContentService service;
    public AdminPoiContentController(AdminPoiContentService service) { this.service=service; }
    @PostMapping("/translations/preview")
    public AdminPoiContentService.PreviewResponse preview(@PathVariable int poiId,@Valid @RequestBody PreviewRequest request) {
        return service.preview(poiId,request.sourceText(),request.targetLanguages());
    }
    @PutMapping("/translations/{languageCode}")
    public AdminPoiContentService.TranslationResult save(@PathVariable int poiId,@PathVariable String languageCode,@Valid @RequestBody TranslationRequest request) {
        return service.save(poiId,languageCode,request.translatedText());
    }
    @PostMapping("/translations/{languageCode}/approve")
    public AdminPoiContentService.TranslationResult approve(@PathVariable int poiId,@PathVariable String languageCode) {
        return service.approve(poiId,languageCode);
    }
    @PostMapping("/audio/generate")
    public List<AdminPoiContentService.AudioGenerationResult> generate(@PathVariable int poiId,@Valid @RequestBody GenerateRequest request) {
        return service.generate(poiId,request.languageCodes());
    }
    @GetMapping("/content")
    public AdminPoiContentService.PoiContentResponse getContent(@PathVariable int poiId) { return service.getContent(poiId); }

    public record PreviewRequest(@NotBlank @Size(max=10000) String sourceText,@NotEmpty List<@NotBlank String> targetLanguages) {}
    public record TranslationRequest(@NotBlank @Size(max=10000) String translatedText) {}
    public record GenerateRequest(@NotEmpty List<@NotBlank String> languageCodes) {}
}
