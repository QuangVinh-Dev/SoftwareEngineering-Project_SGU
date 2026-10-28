package com.HoiAn.HA_App.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ListeningLogRepository {
    private final JdbcTemplate jdbc;

    public ListeningLogRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void recordStart(int sessionId, int poiId, int audioId, String languageCode, String triggerMethod) {
        jdbc.update("""
                INSERT INTO listen_log (session_id, poi_id, audio_id, language_code, trigger_method, listened_at, is_completed)
                VALUES (?, ?, ?, ?, ?, NOW(), FALSE)
                """, sessionId, poiId, audioId, languageCode, triggerMethod);
    }
}
