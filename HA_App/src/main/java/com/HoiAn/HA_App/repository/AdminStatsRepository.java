package com.HoiAn.HA_App.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Thống kê lượt nghe thuyết minh & lượt khách cho Dashboard quản trị.
 *
 * Lưu ý thời gian: listen_log.listened_at và guest_session.created_at được ghi
 * bằng NOW() của PostgreSQL (timezone UTC), trong khi payment dùng giờ Việt Nam.
 * Vì vậy mọi phép so sánh ở đây đều quy đổi timestamp về giờ Việt Nam trước khi
 * lọc, để "hôm nay" trên Dashboard đúng theo ngày của du khách.
 */
@Repository
public class AdminStatsRepository {

    private static final String VN_LOCAL =
            "(%s AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')";

    private final JdbcTemplate jdbc;

    public AdminStatsRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record BucketCount(String label, long total) {
    }

    public record LanguageCount(String code, long total) {
    }

    public record RecentListen(int id, String poiName, String languageCode, String listenedAt) {
    }

    public record ListenQuality(long completed, long autoGps, long tap) {
    }

    /** Tổng lượt nghe; from/to = null nghĩa là toàn bộ thời gian. */
    public long countListens(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            Long value = jdbc.queryForObject("SELECT COUNT(*) FROM listen_log", Long.class);
            return value == null ? 0L : value;
        }
        Long value = jdbc.queryForObject("""
                SELECT COUNT(*) FROM listen_log
                WHERE (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                """, Long.class, from, to);
        return value == null ? 0L : value;
    }

    /** Số thiết bị (phiên khách) khác nhau đã nghe trong khoảng; null = toàn bộ. */
    public long countListeningDevices(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            Long value = jdbc.queryForObject(
                    "SELECT COUNT(DISTINCT session_id) FROM listen_log", Long.class);
            return value == null ? 0L : value;
        }
        Long value = jdbc.queryForObject("""
                SELECT COUNT(DISTINCT session_id) FROM listen_log
                WHERE (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                """, Long.class, from, to);
        return value == null ? 0L : value;
    }

    /** Số phiên khách mới trong khoảng; null = toàn bộ. */
    public long countVisitors(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            Long value = jdbc.queryForObject("SELECT COUNT(*) FROM guest_session", Long.class);
            return value == null ? 0L : value;
        }
        Long value = jdbc.queryForObject("""
                SELECT COUNT(*) FROM guest_session
                WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                """, Long.class, from, to);
        return value == null ? 0L : value;
    }

    /** Lượt nghe đã gộp theo giờ (unit=hour) hoặc theo ngày (unit=day). */
    public List<BucketCount> listenBuckets(LocalDateTime from, LocalDateTime to, String unit) {
        String format = "hour".equals(unit) ? "HH24:00" : "DD/MM";
        String sql = """
                SELECT TO_CHAR(
                           date_trunc(CAST(? AS text),
                               listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'),
                           CAST(? AS text)) AS label,
                       COUNT(*) AS total
                FROM listen_log
                WHERE (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                GROUP BY 1
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> new BucketCount(rs.getString("label"), rs.getLong("total")),
                unit, format, from, to);
    }

    /** Số phiên khách mới, gộp theo giờ/ngày. */
    public List<BucketCount> visitorBuckets(LocalDateTime from, LocalDateTime to, String unit) {
        String format = "hour".equals(unit) ? "HH24:00" : "DD/MM";
        String sql = """
                SELECT TO_CHAR(
                           date_trunc(CAST(? AS text),
                               created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'),
                           CAST(? AS text)) AS label,
                       COUNT(*) AS total
                FROM guest_session
                WHERE (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                GROUP BY 1
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> new BucketCount(rs.getString("label"), rs.getLong("total")),
                unit, format, from, to);
    }

    /** Tỷ lệ hoàn thành & cách kích hoạt audio (toàn bộ thời gian). */
    public ListenQuality listenQuality() {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FILTER (WHERE is_completed) AS completed,
                       COUNT(*) FILTER (WHERE trigger_method = 'AUTO_GPS') AS auto_gps,
                       COUNT(*) FILTER (WHERE trigger_method = 'TAP') AS tap
                FROM listen_log
                """,
                (rs, rowNum) -> new ListenQuality(
                        rs.getLong("completed"),
                        rs.getLong("auto_gps"),
                        rs.getLong("tap")));
    }

    /** Phân bổ lượt nghe theo ngôn ngữ (toàn bộ thời gian). */    public List<LanguageCount> languageCounts() {
        return jdbc.query("""
                SELECT COALESCE(language_code, 'unknown') AS code, COUNT(*) AS total
                FROM listen_log
                GROUP BY 1
                ORDER BY total DESC
                """,
                (rs, rowNum) -> new LanguageCount(rs.getString("code"), rs.getLong("total")));
    }

    /** Các lượt nghe gần nhất, kèm tên POI, để hiển thị nhật ký nhanh. */
    public List<RecentListen> recentListens(int limit) {
        return jdbc.query("""
                SELECT ll.id,
                       p.name AS poi_name,
                       ll.language_code,
                       TO_CHAR(ll.listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh',
                               'YYYY-MM-DD"T"HH24:MI:SS+07:00') AS listened_at
                FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                ORDER BY ll.listened_at DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new RecentListen(
                        rs.getInt("id"),
                        rs.getString("poi_name"),
                        rs.getString("language_code"),
                        rs.getString("listened_at")),
                limit);
    }
}
