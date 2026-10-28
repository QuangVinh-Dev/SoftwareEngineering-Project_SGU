package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.repository.GuestSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class VisitorTrackingService {

    private static final Logger log = LoggerFactory.getLogger(VisitorTrackingService.class);
    private static final long TIMEOUT_SECONDS = 20; // 20 giây không có heartbeat coi như đã thoát

    private final GuestSessionRepository guestSessionRepository;

    public VisitorTrackingService(GuestSessionRepository guestSessionRepository) {
        this.guestSessionRepository = guestSessionRepository;
    }

    /**
     * Ghi nhận thiết bị du khách đang trực tuyến (+1 nếu mới).
     * Lưu trực tiếp vào bảng guest_session trong PostgreSQL.
     */
    public long recordHeartbeat(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) return getOnlineCount();

        try {
            guestSessionRepository.upsert(deviceId.trim(), "vi", "Web");
        } catch (Exception ex) {
            log.warn("SQL upsert guest_session error: {}", ex.getMessage());
        }

        return getOnlineCount();
    }

    /**
     * Ghi nhận thiết bị du khách thoát (-1 ngay lập tức).
     * Đánh dấu last_active_at lùi về trước 2 phút để không còn tính là online.
     */
    public long removeVisitor(String deviceId) {
        if (deviceId == null || deviceId.isBlank()) return getOnlineCount();

        try {
            LocalDateTime offlineTime = LocalDateTime.now().minusMinutes(2);
            guestSessionRepository.markOffline(deviceId.trim(), offlineTime);
        } catch (Exception ex) {
            log.warn("SQL markOffline guest_session error: {}", ex.getMessage());
        }

        return getOnlineCount();
    }

    /**
     * Lấy số lượng du khách trực tuyến thực tế từ PostgreSQL (last_active_at trong vòng 20s).
     */
    public long getOnlineCount() {
        try {
            LocalDateTime activeSince = LocalDateTime.now().minusSeconds(TIMEOUT_SECONDS);
            return guestSessionRepository.countActiveVisitors(activeSince);
        } catch (Exception ex) {
            log.warn("SQL countActiveVisitors error: {}", ex.getMessage());
            return 0L;
        }
    }
}
