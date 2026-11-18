package com.HoiAn.HA_App.dto.response;

import java.util.List;

/**
 * Thống kê tương tác thật cho Dashboard quản trị:
 * lượt nghe thuyết minh, số thiết bị, lượt khách và phân bổ ngôn ngữ.
 *
 * Các chuỗi day/week/month dùng để vẽ biểu đồ cột "Lượt du khách & Lượt nghe".
 */
public record EngagementStatsResponse(
        long totalListens,
        long todayListens,
        long weekListens,
        long monthListens,
        long todayDevices,
        long totalDevices,
        long totalVisitors,
        long todayVisitors,
        long completedListens,
        long autoGpsListens,
        long tapListens,
        List<TrafficPoint> day,
        List<TrafficPoint> week,
        List<TrafficPoint> month,
        List<LanguageShare> languages,
        List<RecentListen> recentListens
) {
    public record TrafficPoint(String label, long visitors, long listens) {
    }

    public record LanguageShare(String code, long listens, double percent) {
    }

    public record RecentListen(int id, String poiName, String languageCode, String listenedAt) {
    }
}
