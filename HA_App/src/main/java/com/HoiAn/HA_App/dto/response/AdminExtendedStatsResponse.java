package com.HoiAn.HA_App.dto.response;

import java.util.List;

public class AdminExtendedStatsResponse {

    public record ListeningHistoryItem(
            int id,
            String datetime,
            String poi,
            String language,
            String duration,
            String device,
            String status
    ) {}

    public record AnalyticsStatsResponse(
            List<TopPoiItem> top10Pois,
            List<NamedTimeItem> avgTimeByPoi,
            List<NamedTimeItem> avgTimeByLanguage,
            List<TrendPointItem> listeningTrend30Days,
            List<TrendPointItem> listeningTrend3Months,
            List<TrendPointItem> listeningTrend1Year
    ) {
        public record TopPoiItem(String name, long sessions, String avgTime) {}
        public record NamedTimeItem(String name, double time) {}
        public record TrendPointItem(String date, long sessions) {}
    }

    public record HeatmapAreaResponse(
            int id,
            String name,
            double x,
            double y,
            long sessions,
            List<String> languages,
            String peakHour
    ) {}
}
