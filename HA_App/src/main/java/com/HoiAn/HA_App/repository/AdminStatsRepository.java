package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.dto.response.AdminExtendedStatsResponse.AnalyticsStatsResponse;
import com.HoiAn.HA_App.dto.response.AdminExtendedStatsResponse.HeatmapAreaResponse;
import com.HoiAn.HA_App.dto.response.AdminExtendedStatsResponse.ListeningHistoryItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    /** Danh sách lịch sử nghe chi tiết */
    public List<ListeningHistoryItem> listeningHistory(int limit) {
        String sql = """
                SELECT ll.id,
                       TO_CHAR(ll.listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD HH24:MI:SS') AS datetime,
                       p.name AS poi,
                       COALESCE(l.name, ll.language_code, 'Tiếng Việt') AS language,
                       CONCAT(COALESCE(ll.duration_seconds, 0) / 60, 'm ', COALESCE(ll.duration_seconds, 0) % 60, 's') AS duration,
                       COALESCE(gs.device, 'Mobile') AS device,
                       CASE WHEN ll.is_completed THEN 'completed'
                            WHEN COALESCE(ll.duration_seconds, 0) > 10 THEN 'partial'
                            ELSE 'skipped' END AS status
                FROM listen_log ll
                JOIN poi p ON p.id = ll.poi_id
                LEFT JOIN language l ON l.code = ll.language_code
                LEFT JOIN guest_session gs ON gs.id = ll.session_id
                ORDER BY ll.listened_at DESC
                LIMIT ?
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> new ListeningHistoryItem(
                        rs.getInt("id"),
                        rs.getString("datetime"),
                        rs.getString("poi"),
                        rs.getString("language"),
                        rs.getString("duration"),
                        rs.getString("device"),
                        rs.getString("status")),
                limit);
    }

    /** Top POI theo số lượt nghe */
    public List<AnalyticsStatsResponse.TopPoiItem> topPois(int limit) {
        String sql = """
                SELECT p.name,
                       COUNT(ll.id) AS sessions,
                       COALESCE(ROUND(AVG(COALESCE(ll.duration_seconds, 0)) / 60.0, 1), 0.0) AS avg_min
                FROM poi p
                LEFT JOIN listen_log ll ON ll.poi_id = p.id
                WHERE p.status = 'ACTIVE'
                GROUP BY p.id, p.name
                ORDER BY sessions DESC
                LIMIT ?
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> {
                    double avgMin = rs.getDouble("avg_min");
                    int mins = (int) avgMin;
                    int secs = (int) Math.round((avgMin - mins) * 60);
                    String avgTimeStr = mins + "m " + (secs < 10 ? "0" : "") + secs + "s";
                    return new AnalyticsStatsResponse.TopPoiItem(
                            rs.getString("name"),
                            rs.getLong("sessions"),
                            avgTimeStr);
                },
                limit);
    }

    /** Thời gian nghe trung bình theo POI */
    public List<AnalyticsStatsResponse.NamedTimeItem> avgTimeByPoi(int limit) {
        String sql = """
                SELECT p.name,
                       COALESCE(ROUND(AVG(COALESCE(ll.duration_seconds, 0)) / 60.0, 1), 0.0) AS time_min
                FROM poi p
                LEFT JOIN listen_log ll ON ll.poi_id = p.id
                WHERE p.status = 'ACTIVE'
                GROUP BY p.id, p.name
                ORDER BY time_min DESC
                LIMIT ?
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> new AnalyticsStatsResponse.NamedTimeItem(
                        rs.getString("name"),
                        rs.getDouble("time_min")),
                limit);
    }

    /** Thời gian nghe trung bình theo ngôn ngữ */
    public List<AnalyticsStatsResponse.NamedTimeItem> avgTimeByLanguage() {
        String sql = """
                SELECT COALESCE(l.name, ll.language_code, 'Khác') AS lang_name,
                       COALESCE(ROUND(AVG(COALESCE(ll.duration_seconds, 0)) / 60.0, 1), 0.0) AS time_min
                FROM listen_log ll
                LEFT JOIN language l ON l.code = ll.language_code
                GROUP BY 1
                ORDER BY time_min DESC
                """;
        return jdbc.query(sql,
                (rs, rowNum) -> new AnalyticsStatsResponse.NamedTimeItem(
                        rs.getString("lang_name"),
                        rs.getDouble("time_min")));
    }

    /** Chuỗi điểm thống kê theo ngày */
    public List<AnalyticsStatsResponse.TrendPointItem> trendPoints(int days) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime from = today.minusDays(days - 1L).atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();

        String sql = """
                SELECT TO_CHAR(
                           date_trunc('day', listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'),
                           'DD/MM') AS date_label,
                       COUNT(*) AS sessions
                FROM listen_log
                WHERE (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') >= ?
                  AND (listened_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh') < ?
                GROUP BY 1
                """;
        Map<String, Long> countMap = new HashMap<>();
        jdbc.query(sql, rs -> {
            countMap.put(rs.getString("date_label"), rs.getLong("sessions"));
        }, from, to);

        List<AnalyticsStatsResponse.TrendPointItem> items = new ArrayList<>(days);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM");
        for (int i = days - 1; i >= 0; i--) {
            String label = today.minusDays(i).format(fmt);
            items.add(new AnalyticsStatsResponse.TrendPointItem(label, countMap.getOrDefault(label, 0L)));
        }
        return items;
    }

    private record HeatmapRaw(int id, String name, double lat, double lng, long sessions) {}

    /** Bản đồ nhiệt độ phân bố mật độ nghe của các POI */
    public List<HeatmapAreaResponse> heatmapAreas() {
        String sql = """
                SELECT p.id,
                       p.name,
                       p.latitude,
                       p.longitude,
                       COUNT(ll.id) AS sessions
                FROM poi p
                LEFT JOIN listen_log ll ON ll.poi_id = p.id
                WHERE p.status = 'ACTIVE'
                GROUP BY p.id, p.name, p.latitude, p.longitude
                ORDER BY sessions DESC
                """;
        List<HeatmapRaw> rawList = jdbc.query(sql, (rs, rowNum) -> new HeatmapRaw(
                rs.getInt("id"),
                rs.getString("name"),
                rs.getDouble("latitude"),
                rs.getDouble("longitude"),
                rs.getLong("sessions")));

        if (rawList.isEmpty()) {
            return List.of();
        }

        double minLat = rawList.stream().mapToDouble(HeatmapRaw::lat).min().orElse(15.87);
        double maxLat = rawList.stream().mapToDouble(HeatmapRaw::lat).max().orElse(15.89);
        double minLng = rawList.stream().mapToDouble(HeatmapRaw::lng).min().orElse(108.32);
        double maxLng = rawList.stream().mapToDouble(HeatmapRaw::lng).max().orElse(108.34);

        double latSpan = Math.max(maxLat - minLat, 0.005);
        double lngSpan = Math.max(maxLng - minLng, 0.005);

        return rawList.stream().map(r -> {
            double x = 15.0 + ((r.lng() - minLng) / lngSpan) * 70.0;
            double y = 15.0 + ((maxLat - r.lat()) / latSpan) * 70.0;
            return new HeatmapAreaResponse(
                    r.id(),
                    r.name(),
                    Math.round(x * 10.0) / 10.0,
                    Math.round(y * 10.0) / 10.0,
                    r.sessions(),
                    List.of("Tiếng Việt", "English"),
                    "15:00 - 17:00");
        }).toList();
    }
}
