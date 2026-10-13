package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PoiContentRepository;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import java.util.Optional;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;

class AdminPoiContentServiceTest {
    PoiRepository pois; PoiContentRepository content; TranslationService translation; TtsService tts;
    AudioFileStorageService files; AdminPoiContentService service;
    @BeforeEach void setup() {
        pois=mock(PoiRepository.class);content=mock(PoiContentRepository.class);translation=mock(TranslationService.class);
        tts=mock(TtsService.class);files=mock(AudioFileStorageService.class);
        service=new AdminPoiContentService(pois,content,translation,tts,files);
    }
    @Test void missingPoiReturns404() {
        when(pois.findById(44)).thenReturn(Optional.empty());
        ApiException ex=assertThrows(ApiException.class,()->service.preview(44,"abc",java.util.List.of("en")));
        assertEquals(404,ex.getStatus().value());
    }
    @Test void unsupportedLanguageRejectedBeforeCallingTranslator() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        assertEquals(400,assertThrows(ApiException.class,()->service.preview(1,"Xin chào",java.util.List.of("fr"))).getStatus().value());
        verifyNoInteractions(translation);
    }
    @Test void previewReportsLibreTranslateFailureForEachTarget() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        when(content.activeLanguage("en")).thenReturn(true);
        when(translation.translate("Xin chào","vi","en")).thenThrow(new IllegalStateException("missing pair"));
        var result=service.preview(1,"Xin chào",java.util.List.of("en"));
        assertFalse(result.translations().get("en").success());
        assertTrue(result.translations().get("en").error().contains("missing pair"));
    }
    @Test void savesByUpsertAndLeavesTranslationPendingForApproval() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        when(content.activeLanguage("en")).thenReturn(true);
        when(content.upsertPending(1,"en","Edited text")).thenReturn(9);
        when(content.translation(1,"en")).thenReturn(Optional.of(new PoiContentRepository.TranslationRow(9,"Edited text","PENDING")));
        var result=service.save(1,"en","Edited text");
        assertEquals("PENDING",result.status());
        verify(content).upsertPending(1,"en","Edited text");
    }
    @Test void changingVietnameseSourceInvalidatesTranslationsAndTheirAudio() {
        Poi poi = mock(Poi.class);
        when(poi.getOriginalDescription()).thenReturn("Old Vietnamese");
        when(pois.findById(1)).thenReturn(Optional.of(poi));
        when(content.activeLanguage("vi")).thenReturn(true);
        when(content.translation(1,"vi")).thenReturn(Optional.of(new PoiContentRepository.TranslationRow(7,"Old Vietnamese","APPROVED")),
                Optional.of(new PoiContentRepository.TranslationRow(7,"New Vietnamese","PENDING")));
        when(content.markTranslationsPendingExcept(1,"vi")).thenReturn(List.of(8));
        when(content.deleteAudiosForTranslation(7)).thenReturn(List.of("/uploads/audio/old-vi.mp3"));
        when(content.deleteAudiosForTranslation(8)).thenReturn(List.of("/uploads/audio/old-en.mp3"));
        TransactionSynchronizationManager.initSynchronization();
        try {
            var result = service.save(1,"vi","New Vietnamese");
            assertEquals("PENDING",result.status());
            verify(content).updatePoiOriginalDescription(1,"New Vietnamese");
            verify(content).markTranslationsPendingExcept(1,"vi");
            TransactionSynchronizationManager.getSynchronizations().forEach(sync -> sync.afterCommit());
            verify(files).deletePublicUrl("/uploads/audio/old-vi.mp3");
            verify(files).deletePublicUrl("/uploads/audio/old-en.mp3");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
    @Test void audioCannotBeCreatedUntilTranslationIsApproved() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        when(content.activeLanguage("en")).thenReturn(true);
        when(content.translation(1,"en")).thenReturn(Optional.of(new PoiContentRepository.TranslationRow(9,"Hello","PENDING")));
        var result=service.generate(1,java.util.List.of("en")).getFirst();
        assertFalse(result.success());
        assertTrue(result.message().contains("chưa được duyệt"));
        verifyNoInteractions(tts);
    }
    @Test void databaseFailureDeletesNewAudioFile() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        when(content.activeLanguage("en")).thenReturn(true);
        when(content.translation(1,"en")).thenReturn(Optional.of(new PoiContentRepository.TranslationRow(9,"Hello","APPROVED")));
        when(content.activeVoices("en")).thenReturn(List.of(new PoiContentRepository.VoiceRow(2,"en",true)));
        when(content.ttsAudio(9)).thenReturn(Optional.empty());
        when(tts.synthesize("Hello","en")).thenReturn(new byte[]{1,2});
        when(files.durationSeconds(new byte[]{1,2})).thenReturn(3);
        var stored=new AudioFileStorageService.StoredAudio("/tmp/new.mp3","/uploads/audio/new.mp3","new.mp3");
        when(files.saveMp3(new byte[]{1,2},"en")).thenReturn(stored);
        when(content.insertAudio(9,2,"/uploads/audio/new.mp3",3)).thenThrow(new RuntimeException("DB unavailable"));
        var result=service.generate(1,List.of("en")).getFirst();
        assertFalse(result.success());
        verify(files).delete(stored);
    }
    @Test void validExistingAudioIsNotRegenerated() {
        when(pois.findById(1)).thenReturn(Optional.of(mock(Poi.class)));
        when(content.activeLanguage("en")).thenReturn(true);
        when(content.translation(1,"en")).thenReturn(Optional.of(new PoiContentRepository.TranslationRow(9,"Hello","APPROVED")));
        when(content.activeVoices("en")).thenReturn(List.of(new PoiContentRepository.VoiceRow(2,"en",true)));
        when(content.ttsAudio(9)).thenReturn(Optional.of(new PoiContentRepository.AudioRow(7,2,"/uploads/audio/en.mp3",8)));
        when(content.ttsAudioMatchesTranslation(9)).thenReturn(true);
        when(files.isValidMp3("/uploads/audio/en.mp3")).thenReturn(true);
        var result=service.generate(1,List.of("en")).getFirst();
        assertTrue(result.success());
        assertEquals(7,result.audioId());
        verifyNoInteractions(tts);
    }
}
