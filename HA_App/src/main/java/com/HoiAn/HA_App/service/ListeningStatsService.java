package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.ListeningStatsResponse;
import com.HoiAn.HA_App.repository.ListeningStatsRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ListeningStatsService {

    private final ListeningStatsRepository statsRepository;

    public ListeningStatsService(ListeningStatsRepository statsRepository) {
        this.statsRepository = statsRepository;
    }

    /**
     * Trả về thống kê lượt nghe cho merchant.
     *
     * @param merchantId ID merchant
     * @param range      "day" | "week" | "month"
     */
    public ListeningStatsResponse getStats(int merchantId, String range) {
        long total = statsRepository.totalByMerchant(merchantId);
        long today = statsRepository.todayByMerchant(merchantId);
        long week = statsRepository.weekByMerchant(merchantId);
        long month = statsRepository.monthByMerchant(merchantId);

        List<ListeningStatsResponse.TrendPoint> trend = statsRepository
                .trendByMerchant(merchantId, range)
                .stream()
                .map(row -> new ListeningStatsResponse.TrendPoint(
                        String.valueOf(row.get("date")),
                        toLong(row.get("sessions"))))
                .toList();

        List<ListeningStatsResponse.PoiStat> poiStats = statsRepository
                .poiStatsByMerchant(merchantId, range)
                .stream()
                .map(row -> new ListeningStatsResponse.PoiStat(
                        toInt(row.get("poi_id")),
                        String.valueOf(row.get("poi_name")),
                        toLong(row.get("sessions"))))
                .toList();

        return new ListeningStatsResponse(total, today, week, month, trend, poiStats);
    }

    private long toLong(Object value) {
        if (value == null) return 0L;
        if (value instanceof Number n) return n.longValue();
        try { return Long.parseLong(value.toString()); } catch (NumberFormatException e) { return 0L; }
    }

    private int toInt(Object value) {
        if (value == null) return 0;
        if (value instanceof Number n) return n.intValue();
        try { return Integer.parseInt(value.toString()); } catch (NumberFormatException e) { return 0; }
    }
}
