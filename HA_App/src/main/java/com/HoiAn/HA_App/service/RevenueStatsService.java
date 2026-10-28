package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.RevenueStatsResponse;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.repository.PaidPaymentProjection;
import com.HoiAn.HA_App.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Tổng hợp tiền khách tham quan đã trả cho gói thuyết minh.
 *
 * Chỉ các giao dịch có status = PAID mới được tính là doanh thu; PENDING và
 * FAILED chỉ dùng để đối soát. Mốc thời gian dùng múi giờ Việt Nam giống
 * PaymentService nên số liệu khớp với thời điểm VNPay ghi nhận thanh toán.
 */
@Service
public class RevenueStatsService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final int TREND_DAYS = 7;

    private final PaymentRepository paymentRepository;

    public RevenueStatsService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public RevenueStatsResponse getStats() {
        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        LocalDate today = now.toLocalDate();

        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime nextMonthStart = monthStart.plusMonths(1);
        LocalDateTime previousMonthStart = monthStart.minusMonths(1);

        BigDecimal totalRevenue = zeroIfNull(
                paymentRepository.sumAmountByStatus(PaymentStatus.PAID));
        BigDecimal todayRevenue = zeroIfNull(
                paymentRepository.sumAmountByStatusBetween(
                        PaymentStatus.PAID, todayStart, tomorrowStart));
        BigDecimal monthRevenue = zeroIfNull(
                paymentRepository.sumAmountByStatusBetween(
                        PaymentStatus.PAID, monthStart, nextMonthStart));
        BigDecimal previousMonthRevenue = zeroIfNull(
                paymentRepository.sumAmountByStatusBetween(
                        PaymentStatus.PAID, previousMonthStart, monthStart));

        long paidTransactions = paymentRepository.countByStatus(PaymentStatus.PAID);
        long todayTransactions = paymentRepository
                .countByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
                        PaymentStatus.PAID, todayStart, tomorrowStart);
        long pendingTransactions = paymentRepository.countByStatus(PaymentStatus.PENDING);
        long failedTransactions = paymentRepository.countByStatus(PaymentStatus.FAILED);

        BigDecimal averageOrderValue = paidTransactions == 0
                ? BigDecimal.ZERO
                : totalRevenue.divide(
                        BigDecimal.valueOf(paidTransactions), 0, RoundingMode.HALF_UP);

        return new RevenueStatsResponse(
                totalRevenue,
                todayRevenue,
                monthRevenue,
                previousMonthRevenue,
                growthPercent(monthRevenue, previousMonthRevenue),
                paidTransactions,
                todayTransactions,
                pendingTransactions,
                failedTransactions,
                averageOrderValue,
                buildDailyTrend(today)
        );
    }

    private List<RevenueStatsResponse.DailyRevenue> buildDailyTrend(LocalDate today) {
        LocalDate firstDay = today.minusDays(TREND_DAYS - 1L);

        Map<LocalDate, BigDecimal> revenueByDay = new LinkedHashMap<>();
        Map<LocalDate, Long> countByDay = new LinkedHashMap<>();
        for (int i = 0; i < TREND_DAYS; i++) {
            LocalDate day = firstDay.plusDays(i);
            revenueByDay.put(day, BigDecimal.ZERO);
            countByDay.put(day, 0L);
        }

        for (PaidPaymentProjection row : paymentRepository.findPaidSince(
                PaymentStatus.PAID, firstDay.atStartOfDay())) {
            if (row.getPaidAt() == null) {
                continue;
            }
            LocalDate day = row.getPaidAt().toLocalDate();
            if (!revenueByDay.containsKey(day)) {
                continue;
            }
            revenueByDay.merge(day, zeroIfNull(row.getAmount()), BigDecimal::add);
            countByDay.merge(day, 1L, Long::sum);
        }

        List<RevenueStatsResponse.DailyRevenue> daily = new ArrayList<>(TREND_DAYS);
        revenueByDay.forEach((day, revenue) -> daily.add(
                new RevenueStatsResponse.DailyRevenue(
                        day.toString(), revenue, countByDay.getOrDefault(day, 0L))));
        return daily;
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    /** % tăng/giảm so với tháng trước; tháng trước bằng 0 thì coi như +100%. */
    private static double growthPercent(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
