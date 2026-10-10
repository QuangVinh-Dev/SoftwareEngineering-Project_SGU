package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.AudioMutationResponse;
import com.HoiAn.HA_App.dto.response.PoiAudioResponse;
import com.HoiAn.HA_App.dto.response.PoiLocationResponse;
import com.HoiAn.HA_App.service.PoiService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/poi")
@CrossOrigin
public class PoiController {
    private final PoiService poiService;

    public PoiController(PoiService poiService) {
        this.poiService = poiService;
    }

    @GetMapping("/locations")
    public List<PoiLocationResponse> getActivePois() {
        return poiService.getActivePois();
    }

    @GetMapping("/{poiId}/audio")
    public List<PoiAudioResponse> getPoiAudios(@PathVariable Integer poiId,
                                               @RequestParam String languageCode) {
        return poiService.getAudios(poiId, languageCode);
    }

    @PostMapping(value = "/{poiId}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AudioMutationResponse> createAudio(
            @PathVariable Integer poiId,
            @RequestParam String languageCode,
            @RequestParam Integer voiceId,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(poiService.createAudio(poiId, languageCode, voiceId, durationSeconds, file));
    }

    @PutMapping(value = "/{poiId}/audio/{audioId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AudioMutationResponse updateAudio(
            @PathVariable Integer poiId,
            @PathVariable Integer audioId,
            @RequestParam String languageCode,
            @RequestParam Integer voiceId,
            @RequestParam(required = false) Integer durationSeconds,
            @RequestPart("file") MultipartFile file) {
        return poiService.updateAudio(poiId, audioId, languageCode, voiceId, durationSeconds, file);
    }

    @DeleteMapping("/{poiId}/audio/{audioId}")
    public ResponseEntity<Void> deleteAudio(@PathVariable Integer poiId, @PathVariable Integer audioId) {
        poiService.deleteAudio(poiId, audioId);
        return ResponseEntity.noContent().build();
    }
}
