package com.HoiAn.HA_App.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public class PoiContentRepository {
    private final JdbcTemplate jdbc;
    public PoiContentRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<LanguageContent> content(Integer poiId) {
        return jdbc.query("""
            SELECT l.code, l.name, l.is_active, t.content, t.status,
                   a.file_path, a.duration_seconds
            FROM language l
            LEFT JOIN translation t ON t.language_code=l.code AND t.poi_id=?
            LEFT JOIN LATERAL (SELECT file_path,duration_seconds FROM audio
                WHERE translation_id=t.id
                ORDER BY CASE WHEN source='TTS' THEN 0 ELSE 1 END,id LIMIT 1) a ON TRUE
            ORDER BY l.code
            """, (rs, n) -> new LanguageContent(rs.getString("code"),rs.getString("name"),
                rs.getBoolean("is_active"),rs.getString("content"),rs.getString("status"),
                rs.getString("file_path"),(Integer)rs.getObject("duration_seconds")), poiId);
    }
    public Optional<TranslationRow> translation(Integer poiId,String code) {
        return jdbc.query("SELECT id,content,status FROM translation WHERE poi_id=? AND language_code=?",
            rs -> rs.next()?Optional.of(new TranslationRow(rs.getInt("id"),rs.getString("content"),rs.getString("status"))):Optional.empty(), poiId,code);
    }
    public boolean activeLanguage(String code) {
        Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM language WHERE code=? AND is_active=TRUE",Integer.class,code);
        return n!=null&&n>0;
    }
    public int upsertPending(Integer poiId,String code,String content) {
        return jdbc.queryForObject("""
            INSERT INTO translation(poi_id,language_code,content,status,updated_at)
            VALUES(?,?,?,'PENDING',NOW())
            ON CONFLICT(poi_id,language_code) DO UPDATE
            SET content=EXCLUDED.content,status='PENDING',updated_at=NOW()
            RETURNING id
            """,Integer.class,poiId,code,content);
    }
    public int approve(Integer poiId,String code) {
        return jdbc.update("UPDATE translation SET status='APPROVED',updated_at=NOW() WHERE poi_id=? AND language_code=?",poiId,code);
    }
    public int updatePoiOriginalDescription(Integer poiId, String description) {
        return jdbc.update("UPDATE poi SET original_description=?,updated_at=NOW() WHERE id=?", description, poiId);
    }
    public List<Integer> markTranslationsPendingExcept(Integer poiId, String languageCode) {
        List<Integer> ids = jdbc.query("SELECT id FROM translation WHERE poi_id=? AND language_code<>?",
                (rs, n) -> rs.getInt(1), poiId, languageCode);
        jdbc.update("UPDATE translation SET status='PENDING',updated_at=NOW() WHERE poi_id=? AND language_code<>?",
                poiId, languageCode);
        return ids;
    }
    public Optional<Integer> markTranslationPending(Integer poiId, String languageCode) {
        return jdbc.query("UPDATE translation SET status='PENDING',updated_at=NOW() WHERE poi_id=? AND language_code=? RETURNING id",
                rs -> rs.next() ? Optional.of(rs.getInt(1)) : Optional.empty(), poiId, languageCode);
    }
    public List<String> deleteAudiosForTranslation(Integer translationId) {
        List<String> paths = jdbc.query("SELECT file_path FROM audio WHERE translation_id=?", (rs, n) -> rs.getString(1), translationId);
        jdbc.update("DELETE FROM audio WHERE translation_id=?", translationId);
        return paths;
    }
    public List<VoiceRow> activeVoices(String code) {
        return jdbc.query("SELECT id,language_code,is_active FROM voice WHERE language_code=? AND is_active=TRUE ORDER BY id",
            (rs,n)->new VoiceRow(rs.getInt("id"),rs.getString("language_code"),rs.getBoolean("is_active")),code);
    }
    public Optional<AudioRow> ttsAudio(int translationId) {
        return jdbc.query("SELECT id,voice_id,file_path,duration_seconds FROM audio WHERE translation_id=? AND source='TTS' ORDER BY id LIMIT 1",
            rs -> rs.next()?Optional.of(new AudioRow(rs.getInt("id"),rs.getInt("voice_id"),rs.getString("file_path"),(Integer)rs.getObject("duration_seconds"))):Optional.empty(),translationId);
    }
    public boolean ttsAudioMatchesTranslation(int translationId) {
        Integer n=jdbc.queryForObject("""
            SELECT COUNT(*) FROM audio a JOIN translation t ON t.id=a.translation_id
            WHERE a.translation_id=? AND a.source='TTS' AND a.created_at>=t.updated_at
            """,Integer.class,translationId);
        return n!=null&&n>0;
    }
    public void updateAudio(int id,int voiceId,String url,int duration) {
        jdbc.update("UPDATE audio SET voice_id=?,file_path=?,duration_seconds=?,created_at=NOW() WHERE id=?",voiceId,url,duration,id);
    }
    public boolean fileUsedByOtherAudio(String path,int id) {
        Integer n=jdbc.queryForObject("SELECT COUNT(*) FROM audio WHERE file_path=? AND id<>?",Integer.class,path,id);
        return n!=null&&n>0;
    }
    public int insertAudio(int translationId,int voiceId,String url,int duration) {
        return jdbc.queryForObject("INSERT INTO audio(translation_id,voice_id,source,file_path,duration_seconds) VALUES(?,?,'TTS',?,?) RETURNING id",Integer.class,translationId,voiceId,url,duration);
    }
    public record LanguageContent(String code,String name,boolean active,String content,String status,String audioUrl,Integer durationSeconds) {}
    public record TranslationRow(int id,String content,String status) {}
    public record VoiceRow(int id,String languageCode,boolean active) {}
    public record AudioRow(int id,int voiceId,String filePath,Integer durationSeconds) {}
}
