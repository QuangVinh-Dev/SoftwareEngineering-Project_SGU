package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.AudioMutationResponse;
import com.HoiAn.HA_App.dto.response.PoiAudioResponse;
import com.HoiAn.HA_App.dto.response.PoiLocationResponse;
import com.HoiAn.HA_App.entity.Language;
import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.repository.AudioRepository;
import com.HoiAn.HA_App.repository.LanguageRepository;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PoiService {
    private final PoiRepository poiRepository;
    private final LanguageRepository languageRepository;
    private final AudioRepository audioRepository;
    private final AudioStorageService audioStorageService;

    public PoiService(PoiRepository poiRepository,
                      LanguageRepository languageRepository,
                      AudioRepository audioRepository,
                      AudioStorageService audioStorageService) {
        this.poiRepository = poiRepository;
        this.languageRepository = languageRepository;
        this.audioRepository = audioRepository;
        this.audioStorageService = audioStorageService;
    }

    public List<PoiLocationResponse> getActivePois() {
        return poiRepository.findByStatus("ACTIVE").stream().map(this::toLocationResponse).toList();
    }

    public List<PoiAudioResponse> getAudios(Integer poiId, String languageCode) {
        requirePoi(poiId);
        requireActiveLanguage(languageCode);
        return audioRepository.findApprovedAudios(poiId, languageCode);
    }

    public AudioMutationResponse createAudio(Integer poiId, String languageCode, Integer voiceId,
                                             Integer durationSeconds, MultipartFile file) {
        requirePoi(poiId);
        Integer translationId = requireTranslation(poiId, languageCode);
        requireActiveVoice(voiceId, languageCode);
        validateDuration(durationSeconds);

        AudioStorageService.StoredAudio stored = audioStorageService.store(file);
        try {
            Integer audioId = audioRepository.insert(translationId, voiceId, "UPLOAD",
                    stored.filePath(), durationSeconds);
            return new AudioMutationResponse(audioId, stored.filePath());
        } catch (RuntimeException e) {
            audioStorageService.delete(stored.filePath());
            throw e;
        }
    }

    public AudioMutationResponse updateAudio(Integer poiId, Integer audioId, String languageCode,
                                             Integer voiceId, Integer durationSeconds, MultipartFile file) {
        requirePoi(poiId);
        String oldFilePath = audioRepository.findFilePathForPoi(poiId, audioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDIO_NOT_FOUND_FOR_POI"));
        Integer translationId = requireTranslation(poiId, languageCode);
        requireActiveVoice(voiceId, languageCode);
        validateDuration(durationSeconds);

        AudioStorageService.StoredAudio stored = audioStorageService.store(file);
        try {
            int updated = audioRepository.update(audioId, poiId, translationId, voiceId,
                    stored.filePath(), durationSeconds);
            if (updated != 1) {
                audioStorageService.delete(stored.filePath());
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDIO_NOT_FOUND_FOR_POI");
            }
        } catch (RuntimeException e) {
            audioStorageService.delete(stored.filePath());
            throw e;
        }
        if (!audioRepository.isFileUsedByAnotherAudio(oldFilePath, audioId)) {
            audioStorageService.delete(oldFilePath);
        }
        return new AudioMutationResponse(audioId, stored.filePath());
    }

    public void deleteAudio(Integer poiId, Integer audioId) {
        requirePoi(poiId);
        String filePath = audioRepository.findFilePathForPoi(poiId, audioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDIO_NOT_FOUND_FOR_POI"));
        if (audioRepository.delete(poiId, audioId) != 1) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AUDIO_NOT_FOUND_FOR_POI");
        }
        if (!audioRepository.isFileUsedByAnotherAudio(filePath, audioId)) {
            audioStorageService.delete(filePath);
        }
    }

    private void requirePoi(Integer poiId) {
        if (!poiRepository.existsById(poiId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "POI_NOT_FOUND");
        }
    }

    private Language requireActiveLanguage(String languageCode) {
        Language language = languageRepository.findById(languageCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "LANGUAGE_NOT_FOUND"));
        if (!language.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "LANGUAGE_INACTIVE");
        }
        return language;
    }

    private Integer requireTranslation(Integer poiId, String languageCode) {
        requireActiveLanguage(languageCode);
        return audioRepository.findTranslationId(poiId, languageCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "TRANSLATION_NOT_FOUND_FOR_POI"));
    }

    private void requireActiveVoice(Integer voiceId, String languageCode) {
        AudioRepository.VoiceInfo voice = audioRepository.findVoice(voiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "VOICE_NOT_FOUND"));
        if (!voice.active() || !voice.languageCode().equals(languageCode)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "VOICE_INACTIVE_OR_LANGUAGE_MISMATCH");
        }
    }

    private void validateDuration(Integer durationSeconds) {
        if (durationSeconds != null && durationSeconds < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DURATION_MUST_NOT_BE_NEGATIVE");
        }
    }

    private PoiLocationResponse toLocationResponse(Poi poi) {
        return new PoiLocationResponse(poi.getId(), poi.getName(), poi.getLatitude(),
                poi.getLongitude(), poi.getRadius());
    }
}
