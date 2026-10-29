package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.EngagementStatsResponse;
import com.HoiAn.HA_App.dto.response.RevenueStatsResponse;
import com.HoiAn.HA_App.service.EngagementStatsService;
import com.HoiAn.HA_App.service.RevenueStatsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API thống kê cho Dashboard quản trị.
 *
 * GET /api/admin/stats/revenue     — tiền khách tham quan đã trả (VNPay PAID)
 * GET /api/admin/stats/engagement  — lượt nghe thuyết minh, lượt khách, ngôn ngữ
 *
 * Yêu cầu ROLE_ADMIN (đã cấu hình chung cho /api/admin/**).
 */
@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final RevenueStatsService revenueStatsService;
    private final EngagementStatsService engagementStatsService;

    public AdminStatsController(RevenueStatsService revenueStatsService,
                                EngagementStatsService engagementStatsService) {
        this.revenueStatsService = revenueStatsService;
        this.engagementStatsService = engagementStatsService;
    }

    @GetMapping("/revenue")
    public RevenueStatsResponse getRevenueStats() {
        return revenueStatsService.getStats();
    }

    @GetMapping("/engagement")
    public EngagementStatsResponse getEngagementStats() {
        return engagementStatsService.getStats();
    }
}
