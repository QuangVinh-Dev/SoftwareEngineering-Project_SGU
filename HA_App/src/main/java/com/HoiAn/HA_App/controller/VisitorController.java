package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.service.VisitorTrackingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/public/visitor")
public class VisitorController {

    private final VisitorTrackingService trackingService;

    public VisitorController(VisitorTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /**
     * Du khách gửi heartbeat khi truy cập trang (+1 nếu chưa có).
     */
    @RequestMapping(value = "/heartbeat", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> heartbeat(
            @RequestParam(required = false) String deviceId,
            HttpServletRequest request
    ) {
        String id = resolveDeviceId(deviceId, request);
        long count = trackingService.recordHeartbeat(id);
        return ResponseEntity.ok(Map.of(
                "deviceId", id,
                "onlineCount", count
        ));
    }

    /**
     * Du khách rời khỏi trang/đóng tab (-1 ngay lập tức).
     */
    @RequestMapping(value = "/leave", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, Object>> leave(
            @RequestParam(required = false) String deviceId,
            HttpServletRequest request
    ) {
        String id = resolveDeviceId(deviceId, request);
        long count = trackingService.removeVisitor(id);
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "onlineCount", count
        ));
    }

    /**
     * Admin hoặc hệ thống lấy số lượng du khách trực tuyến thực tế.
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getOnlineCount() {
        long count = trackingService.getOnlineCount();
        return ResponseEntity.ok(Map.of(
                "onlineCount", count
        ));
    }

    private String resolveDeviceId(String queryParam, HttpServletRequest request) {
        if (queryParam != null && !queryParam.isBlank()) {
            return queryParam.trim();
        }
        String headerId = request.getHeader("X-Device-Id");
        if (headerId != null && !headerId.isBlank()) {
            return headerId.trim();
        }
        return "anon_" + UUID.randomUUID().toString().substring(0, 8);
    }
}
