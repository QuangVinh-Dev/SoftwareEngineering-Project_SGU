package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.EngagementStatsResponse;
import com.HoiAn.HA_App.repository.AdminStatsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tổng hợp lượt nghe thuyết minh thật từ bảng listen_log và lượt khách từ
 * guest_session cho Dashboard quản trị.
 *
 * "Hôm nay / tuần này / tháng này" tính theo múi giờ Việt Nam; tháng này =
 * 30 ngày gần nhất để biểu đồ luôn có dữ liệu kể cả đầu tháng.
 */
@Service
public class EngagementStatsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd/MM");
    private static final int MONTH_DAYS = 30;
    private static final int WEEK_DAYS = 7;
    private static final int RECENT_LIMIT = 6;

    private final AdminStatsRepository statsRepository;

    public EngagementStatsService(AdminStatsRepository statsRepository) {
        this.statsRepository = statsRepository;
    }

    @Transactional(readOnly = true)
    public EngagementStatsResponse getStats() {
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        LocalDateTime weekStart = today.minusDays(WEEK_DAYS - 1L).atStartOfDay();
        LocalDateTime monthStart = today.minusDays(MONTH_DAYS - 1L).atStartOfDay();

        long totalListens = statsRepository.countListens(null, null);
        long todayListens = statsRepository.countListens(todayStart, tomorrowStart);
        long weekListens = statsRepository.countListens(weekStart, tomorrowStart);
        long monthListens = statsRepository.countListens(monthStart, tomorrowStart);

        List<EngagementStatsResponse.LanguageShare> languages = buildLanguages(totalListens);
        AdminStatsRepository.ListenQuality quality = statsRepository.listenQuality();

        return new EngagementStatsResponse(
                totalListens,
                todayListens,
                weekListens,
                monthListens,
                statsRepository.countListeningDevices(todayStart, tomorrowStart),
                statsRepository.countListeningDevices(null, null),
                statsRepository.countVisitors(null, null),
                statsRepository.countVisitors(todayStart, tomorrowStart),
                quality.completed(),
                quality.autoGps(),
                quality.tap(),
                buildSeries(todayStart, tomorrowStart, "hour", hourlyLabels()),
                buildSeries(weekStart, tomorrowStart, "day",
                        dailyLabels(today.minusDays(WEEK_DAYS - 1L), today)),
                buildSeries(monthStart, tomorrowStart, "day",
                        dailyLabels(today.minusDays(MONTH_DAYS - 1L), today)),
                languages,
                statsRepository.recentListens(RECENT_LIMIT).stream()
                        .map(row -> new EngagementStatsResponse.RecentListen(
                                row.id(), row.poiName(), row.languageCode(), row.listenedAt()))
                        .toList()
        );
    }

    private List<EngagementStatsResponse.TrafficPoint> buildSeries(
            LocalDateTime from, LocalDateTime to, String unit, List<String> labels) {

        Map<String, Long> visitors = toMap(statsRepository.visitorBuckets(from, to, unit));
        Map<String, Long> listens = toMap(statsRepository.listenBuckets(from, to, unit));

        List<EngagementStatsResponse.TrafficPoint> series = new ArrayList<>(labels.size());
        for (String label : labels) {
            series.add(new EngagementStatsResponse.TrafficPoint(
                    label,
                    visitors.getOrDefault(label, 0L),
                    listens.getOrDefault(label, 0L)));
        }
        return series;
    }

    private List<EngagementStatsResponse.LanguageShare> buildLanguages(long totalListens) {
        if (totalListens == 0) {
            return List.of();
        }
        List<EngagementStatsResponse.LanguageShare> shares = new ArrayList<>();
        for (AdminStatsRepository.LanguageCount row : statsRepository.languageCounts()) {
            double percent = BigDecimal.valueOf(row.total())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalListens), 1, RoundingMode.HALF_UP)
                    .doubleValue();
            shares.add(new EngagementStatsResponse.LanguageShare(
                    row.code(), row.total(), percent));
        }
        return shares;
    }

    private static Map<String, Long> toMap(List<AdminStatsRepository.BucketCount> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (AdminStatsRepository.BucketCount row : rows) {
            result.merge(row.label(), row.total(), Long::sum);
        }
        return result;
    }

    private static List<String> hourlyLabels() {
        List<String> labels = new ArrayList<>(24);
        for (int hour = 0; hour < 24; hour++) {
            labels.add(String.format("%02d:00", hour));
        }
        return labels;
    }

    private static List<String> dailyLabels(LocalDate from, LocalDate to) {
        List<String> labels = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            labels.add(day.format(DAY_LABEL));
        }
        return labels;
    }
}
