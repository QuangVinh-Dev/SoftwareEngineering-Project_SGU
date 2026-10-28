package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.ListeningStatsResponse;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.service.ListeningStatsService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * API thống kê lượt nghe audio cho chủ gian hàng (MERCHANT).
 *
 * GET /api/merchant/stats/listening?range=day|week|month
 */
@RestController
@RequestMapping("/api/merchant/stats")
public class MerchantStatsController {

    private final ListeningStatsService statsService;

    public MerchantStatsController(ListeningStatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/listening")
    public ListeningStatsResponse getListeningStats(
            @AuthenticationPrincipal AuthUser current,
            @RequestParam(defaultValue = "week") String range) {

        int merchantId = requireMerchantId(current);

        // Validate range parameter
        if (!range.equals("day") && !range.equals("week") && !range.equals("month")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tham số range không hợp lệ. Chỉ chấp nhận: day, week, month");
        }

        return statsService.getStats(merchantId, range);
    }

    private int requireMerchantId(AuthUser current) {
        if (current == null || current.merchantId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản không gắn với gian hàng đã được duyệt");
        }
        return current.merchantId();
    }
}
