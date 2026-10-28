package com.HoiAn.HA_App.dto.response;

import java.util.List;

public record ListeningStatsResponse(
        long totalSessions,
        long todaySessions,
        long weekSessions,
        long monthSessions,
        List<TrendPoint> trend,
        List<PoiStat> poiStats
) {
    public record TrendPoint(String date, long sessions) {}
    public record PoiStat(int poiId, String poiName, long sessions) {}
}
