package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PoiContentRepository;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminPoiContentService {
    private static final Set<String> LANGUAGES=Set.of("vi","en","ja","ko","zh");
    private final PoiRepository pois; 
    private final PoiContentRepository content;
    private final TranslationService translator; 
    private final TtsService tts; 
    private final AudioFileStorageService files;
    private final Map<String,Object> generationLocks=new ConcurrentHashMap<>();
    public AdminPoiContentService(PoiRepository pois,PoiContentRepository content,TranslationService translator,TtsService tts,AudioFileStorageService files) {
        this.pois=pois;this.content=content;this.translator=translator;this.tts=tts;this.files=files;
    }
    public PreviewResponse preview(int poiId,String sourceText,List<String> targets) {
        requirePoi(poiId); validateText(sourceText);
        if(targets==null||targets.isEmpty()) throw bad("Cần ít nhất một ngôn ngữ đích");
        Map<String,PreviewResult> results=new LinkedHashMap<>();
        for(String raw:targets) {
            String code=normalize(raw);
            if(!LANGUAGES.contains(code)) throw bad("Mã ngôn ngữ không được hỗ trợ: "+raw);
            if(!content.activeLanguage(code)) throw bad("Ngôn ngữ chưa được kích hoạt: "+code);
            try { results.put(code,new PreviewResult(true,translator.translate(sourceText,"vi",code),null)); }
            catch(Exception ex) { results.put(code,new PreviewResult(false,null,safeMessage(ex))); }
        }
        return new PreviewResponse(results);
    }
    @Transactional
    public TranslationResult save(int poiId,String rawCode,String translatedText) {
        Poi poi=requirePoi(poiId); String code=requireLanguage(rawCode); requireActiveLanguage(code); validateText(translatedText);
        String newText = translatedText.trim();
        var oldTranslation = content.translation(poiId,code).orElse(null);
        boolean translationChanged = oldTranslation != null && !Objects.equals(oldTranslation.content(), newText);
        boolean sourceChanged = "vi".equals(code) && !Objects.equals(poi.getOriginalDescription(), newText);
        int id=content.upsertPending(poiId,code,newText);
        if ("vi".equals(code)) content.updatePoiOriginalDescription(poiId, newText);
        List<Integer> invalidatedTranslationIds = new ArrayList<>();
        if (translationChanged) invalidatedTranslationIds.add(oldTranslation.id());
        if ("vi".equals(code) && (sourceChanged || translationChanged)) {
            invalidatedTranslationIds.addAll(content.markTranslationsPendingExcept(poiId, "vi"));
        }
        deleteAudioFilesAfterCommit(invalidatedTranslationIds);
        var row=content.translation(poiId,code).orElseThrow();
        return new TranslationResult(id,code,row.content(),row.status());
    }

    @Transactional
    public void synchronizeOriginalDescription(int poiId, String rawDescription) {
        Poi poi = requirePoi(poiId);
        String description = rawDescription == null || rawDescription.isBlank() ? null : rawDescription.trim();
        if (description != null) validateText(description);
        if (Objects.equals(poi.getOriginalDescription(), description)) return;

        content.updatePoiOriginalDescription(poiId, description);
        List<Integer> invalidatedTranslationIds = new ArrayList<>();
        if (description == null) {
            content.markTranslationPending(poiId, "vi").ifPresent(invalidatedTranslationIds::add);
        } else {
            var oldVietnamese = content.translation(poiId, "vi").orElse(null);
            if (oldVietnamese != null && !Objects.equals(oldVietnamese.content(), description)) {
                invalidatedTranslationIds.add(oldVietnamese.id());
            }
            content.upsertPending(poiId, "vi", description);
        }
        invalidatedTranslationIds.addAll(content.markTranslationsPendingExcept(poiId, "vi"));
        deleteAudioFilesAfterCommit(invalidatedTranslationIds);
    }

    private void deleteAudioFilesAfterCommit(List<Integer> translationIds) {
        if (translationIds.isEmpty()) return;
        List<String> oldFiles = translationIds.stream().distinct()
                .flatMap(id -> content.deleteAudiosForTranslation(id).stream()).toList();
        if (oldFiles.isEmpty()) return;
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { oldFiles.forEach(files::deletePublicUrl); }
        });
    }
    @Transactional
    public TranslationResult approve(int poiId,String rawCode) {
        requirePoi(poiId);String code=requireLanguage(rawCode);requireActiveLanguage(code);
        if(content.approve(poiId,code)==0) throw new ApiException(HttpStatus.NOT_FOUND,"Không tìm thấy bản dịch");
        var row=content.translation(poiId,code).orElseThrow();
        return new TranslationResult(row.id(),code,row.content(),row.status());
    }
    public PoiContentResponse getContent(int poiId) {
        Poi poi=requirePoi(poiId);
        return new PoiContentResponse(poi.getId(),poi.getName(),poi.getOriginalDescription(),content.content(poiId));
    }
    public List<AudioGenerationResult> generate(int poiId,List<String> requested) {
        requirePoi(poiId);
        if(requested==null||requested.isEmpty()) throw bad("Cần ít nhất một ngôn ngữ");
        List<AudioGenerationResult> results=new ArrayList<>();
        for(String raw:requested) {
            String code;
            try { code=requireLanguage(raw); }
            catch(ApiException ex) { results.add(new AudioGenerationResult(raw,false,null,null,null,ex.getMessage()));continue; }
            if(!content.activeLanguage(code)) { results.add(new AudioGenerationResult(code,false,null,null,null,"Ngôn ngữ chưa được kích hoạt"));continue; }
            String lockKey=poiId+":"+code;
            Object lock=generationLocks.computeIfAbsent(lockKey,k->new Object());
            synchronized(lock) {
                try { results.add(generateOne(poiId,code)); }
                catch(Exception ex) { results.add(new AudioGenerationResult(code,false,null,null,null,safeMessage(ex))); }
            }
        }
        return results;
    }
    private AudioGenerationResult generateOne(int poiId,String code) {
        var tr=content.translation(poiId,code).orElseThrow(()->new ApiException(HttpStatus.CONFLICT,"Chưa có bản dịch đã lưu"));
        if(!"APPROVED".equalsIgnoreCase(tr.status())) throw new ApiException(HttpStatus.CONFLICT,"Bản dịch chưa được duyệt");
        var voices=content.activeVoices(code);
        if(voices.isEmpty()) throw new ApiException(HttpStatus.CONFLICT,"Không có voice đang hoạt động cho "+code);
        var existing=content.ttsAudio(tr.id());
        if(existing.isPresent() && content.ttsAudioMatchesTranslation(tr.id()) && Objects.equals(existing.get().voiceId(),voices.get(0).id()) && files.isValidMp3(existing.get().filePath())) {
            var a=existing.get(); return new AudioGenerationResult(code,true,a.id(),a.filePath(),a.durationSeconds(),"Đã có audio hợp lệ; bỏ qua tạo lại");
        }
        byte[] bytes=tts.synthesize(tr.content(),code);
        int duration=files.durationSeconds(bytes);
        var stored=files.saveMp3(bytes,code);
        String oldPath=existing.map(PoiContentRepository.AudioRow::filePath).orElse(null);
        try {
            if(existing.isPresent()) content.updateAudio(existing.get().id(),voices.get(0).id(),stored.publicUrl(),duration);
            else content.insertAudio(tr.id(),voices.get(0).id(),stored.publicUrl(),duration);
        } catch(RuntimeException ex) { files.delete(stored); throw ex; }
        if(existing.isPresent() && oldPath!=null && !oldPath.equals(stored.publicUrl())
                && !content.fileUsedByOtherAudio(oldPath,existing.get().id())) files.deletePublicUrl(oldPath);
        var persisted=content.ttsAudio(tr.id()).orElseThrow();
        return new AudioGenerationResult(code,true,persisted.id(),stored.publicUrl(),duration,"Audio được tạo và lưu");
    }
    private Poi requirePoi(int id) { return pois.findById(id).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"Không tìm thấy POI")); }
    private void requireActiveLanguage(String code) { if(!content.activeLanguage(code)) throw bad("Ngôn ngữ chưa được kích hoạt: "+code); }
    private static String requireLanguage(String raw) { String code=normalize(raw); if(!LANGUAGES.contains(code)) throw bad("Mã ngôn ngữ không được hỗ trợ: "+raw); return code; }
    private static String normalize(String raw) { return raw==null?"":raw.trim().toLowerCase(Locale.ROOT); }
    private static void validateText(String text) { if(text==null||text.isBlank()) throw bad("Nội dung không được để trống"); if(text.length()>10000) throw bad("Nội dung vượt quá 10000 ký tự"); }
    private static ApiException bad(String message) { return new ApiException(HttpStatus.BAD_REQUEST,message); }
    private static String safeMessage(Exception e) { return Optional.ofNullable(e.getMessage()).orElse(e.getClass().getSimpleName()); }
    public record PreviewResult(boolean success,String translatedText,String error){}
    public record PreviewResponse(Map<String,PreviewResult> translations){}
    public record TranslationResult(int id,String languageCode,String translatedText,String status){}
    public record AudioGenerationResult(String languageCode,boolean success,Integer audioId,String audioUrl,Integer durationSeconds,String message){}
    public record PoiContentResponse(Integer poiId,String name,String originalDescription,List<PoiContentRepository.LanguageContent> languages){}
}
