package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.dto.response.PoiAudioResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class AudioRepository {
    private final JdbcTemplate jdbcTemplate;

    public AudioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PoiAudioResponse> findApprovedAudios(Integer poiId, String languageCode) {
        return jdbcTemplate.query("""
                SELECT a.id AS id,
                       t.language_code AS language_code,
                       l.name AS language_name,
                       a.file_path AS file_path,
                       a.duration_seconds AS duration_seconds,
                       v.name AS voice_name
                FROM audio a
                JOIN translation t ON t.id = a.translation_id
                JOIN language l ON l.code = t.language_code
                JOIN voice v ON v.id = a.voice_id
                WHERE t.poi_id = ?
                  AND t.language_code = ?
                  AND t.status = 'APPROVED'
                  AND l.is_active = TRUE
                  AND v.is_active = TRUE
                  AND v.language_code = t.language_code
                ORDER BY a.id
                """, this::mapAudio, poiId, languageCode);
    }

    public Optional<Integer> findTranslationId(Integer poiId, String languageCode) {
        return jdbcTemplate.query("""
                SELECT id FROM translation WHERE poi_id = ? AND language_code = ?
                """, rs -> rs.next() ? Optional.of(rs.getInt("id")) : Optional.empty(), poiId, languageCode);
    }

    public boolean isActiveVoiceForLanguage(Integer voiceId, String languageCode) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM voice
                WHERE id = ? AND language_code = ? AND is_active = TRUE
                """, Integer.class, voiceId, languageCode);
        return count != null && count > 0;
    }

    public Optional<VoiceInfo> findVoice(Integer voiceId) {
        return jdbcTemplate.query("SELECT language_code, is_active FROM voice WHERE id = ?",
                rs -> rs.next() ? Optional.of(new VoiceInfo(
                        rs.getString("language_code"), rs.getBoolean("is_active"))) : Optional.empty(), voiceId);
    }

    public Integer insert(Integer translationId, Integer voiceId, String source,
                          String filePath, Integer durationSeconds) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO audio (translation_id, voice_id, source, file_path, duration_seconds)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """, Integer.class, translationId, voiceId, source, filePath, durationSeconds);
    }

    public Optional<String> findFilePathForPoi(Integer poiId, Integer audioId) {
        return jdbcTemplate.query("""
                SELECT a.file_path
                FROM audio a JOIN translation t ON t.id = a.translation_id
                WHERE a.id = ? AND t.poi_id = ?
                """, rs -> rs.next() ? Optional.of(rs.getString("file_path")) : Optional.empty(), audioId, poiId);
    }

    public int update(Integer audioId, Integer poiId, Integer translationId, Integer voiceId,
                      String filePath, Integer durationSeconds) {
        return jdbcTemplate.update("""
                UPDATE audio a
                SET translation_id = ?, voice_id = ?, source = 'UPLOAD', file_path = ?, duration_seconds = ?
                FROM translation old_translation
                WHERE a.id = ? AND old_translation.id = a.translation_id
                  AND old_translation.poi_id = ?
                """, translationId, voiceId, filePath, durationSeconds, audioId, poiId);
    }

    public int delete(Integer poiId, Integer audioId) {
        return jdbcTemplate.update("""
                DELETE FROM audio a USING translation t
                WHERE a.translation_id = t.id AND t.poi_id = ? AND a.id = ?
                """, poiId, audioId);
    }

    public boolean isFileUsedByAnotherAudio(String filePath, Integer excludedAudioId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM audio WHERE file_path = ? AND id <> ?
                """, Integer.class, filePath, excludedAudioId);
        return count != null && count > 0;
    }

    private PoiAudioResponse mapAudio(ResultSet rs, int rowNum) throws SQLException {
        return new PoiAudioResponse(
                rs.getInt("id"),
                rs.getString("language_code"),
                rs.getString("language_name"),
                rs.getString("file_path"),
                (Integer) rs.getObject("duration_seconds"),
                rs.getString("voice_name"));
    }

    public record VoiceInfo(String languageCode, boolean active) {
    }
}
