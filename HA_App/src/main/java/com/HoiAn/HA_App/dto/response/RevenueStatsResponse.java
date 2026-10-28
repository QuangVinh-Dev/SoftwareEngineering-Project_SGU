package com.HoiAn.HA_App.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Thống kê doanh thu từ các giao dịch VNPay đã thanh toán (status = PAID).
 *
 * Dùng cho Dashboard quản trị: tổng doanh thu, doanh thu hôm nay / tháng này,
 * số giao dịch và chuỗi 7 ngày gần nhất.
 */
public record RevenueStatsResponse(
        BigDecimal totalRevenue,
        BigDecimal todayRevenue,
        BigDecimal monthRevenue,
        BigDecimal previousMonthRevenue,
        double growthPercent,
        long paidTransactions,
        long todayTransactions,
        long pendingTransactions,
        long failedTransactions,
        BigDecimal averageOrderValue,
        List<DailyRevenue> daily
) {
    public record DailyRevenue(
            String date,
            BigDecimal revenue,
            long transactions
    ) {
    }
}
