package com.HoiAn.HA_App.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

/** Statistics over the existing listen_log table. */
@Repository
public class ListeningStatsRepository {

    private final JdbcTemplate jdbc;

    public ListeningStatsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long totalByMerchant(int merchantId) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                WHERE p.merchant_id = ?
                """, Long.class, merchantId);
        return count == null ? 0L : count;
    }

    public long todayByMerchant(int merchantId) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                WHERE p.merchant_id = ?
                  AND ll.listened_at >= CURRENT_DATE
                  AND ll.listened_at < CURRENT_DATE + INTERVAL '1 day'
                """, Long.class, merchantId);
        return count == null ? 0L : count;
    }

    public long weekByMerchant(int merchantId) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                WHERE p.merchant_id = ?
                  AND ll.listened_at >= CURRENT_DATE - INTERVAL '6 days'
                """, Long.class, merchantId);
        return count == null ? 0L : count;
    }

    public long monthByMerchant(int merchantId) {
        Long count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                WHERE p.merchant_id = ?
                  AND ll.listened_at >= CURRENT_DATE - INTERVAL '29 days'
                """, Long.class, merchantId);
        return count == null ? 0L : count;
    }

    /** day is hourly for the last 24 hours; week/month are daily. */
    public List<Map<String, Object>> trendByMerchant(int merchantId, String range) {
        boolean hourly = "day".equals(range);
        String start = hourly ? "CURRENT_DATE" :
                "CURRENT_DATE - INTERVAL '" + ("week".equals(range) ? "6 days" : "29 days") + "'";
        String end = hourly ? "DATE_TRUNC('hour', NOW())" : "CURRENT_DATE";
        String step = hourly ? "1 hour" : "1 day";
        String format = hourly ? "DD/MM HH24:00" : "DD/MM";
        String sql = """
                SELECT TO_CHAR(gs.bucket, '%s') AS date, COUNT(ll.id) AS sessions
                FROM (
                    SELECT generate_series(%s, %s, INTERVAL '%s') AS bucket
                ) gs
                LEFT JOIN listen_log ll
                       ON ll.listened_at >= gs.bucket
                      AND ll.listened_at < gs.bucket + INTERVAL '%s'
                      AND ll.poi_id IN (SELECT id FROM poi WHERE merchant_id = ?)
                GROUP BY gs.bucket
                ORDER BY gs.bucket
                """.formatted(format, start, end, step, step);
        return jdbc.queryForList(sql, merchantId);
    }

    public List<Map<String, Object>> poiStatsByMerchant(int merchantId, String range) {
        String start = switch (range) {
            case "day" -> "CURRENT_DATE";
            case "week" -> "CURRENT_DATE - INTERVAL '6 days'";
            default -> "CURRENT_DATE - INTERVAL '29 days'";
        };
        String sql = """
                SELECT p.id AS poi_id, p.name AS poi_name, COUNT(ll.id) AS sessions
                FROM poi p
                LEFT JOIN listen_log ll ON ll.poi_id = p.id AND ll.listened_at >= %s
                WHERE p.merchant_id = ? AND p.approval_status = 'APPROVED'
                GROUP BY p.id, p.name
                ORDER BY sessions DESC
                """.formatted(start);
        return jdbc.queryForList(sql, merchantId);
    }
}
