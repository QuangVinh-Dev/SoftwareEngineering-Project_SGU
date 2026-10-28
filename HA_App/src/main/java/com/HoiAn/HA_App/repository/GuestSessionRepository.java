package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.GuestSession;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface GuestSessionRepository extends JpaRepository<GuestSession, Integer> {
    Optional<GuestSession> findByAnonymousDeviceId(String anonymousDeviceId);

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO guest_session (anonymous_device_id, language_code, device, created_at, last_active_at) "
            + "VALUES (:deviceId, :languageCode, :device, NOW(), NOW()) "
            + "ON CONFLICT (anonymous_device_id) DO UPDATE SET "
            + "language_code = COALESCE(EXCLUDED.language_code, guest_session.language_code), "
            + "device = COALESCE(EXCLUDED.device, guest_session.device), last_active_at = NOW()",
            nativeQuery = true)
    void upsert(@Param("deviceId") String deviceId,
                @Param("languageCode") String languageCode,
                @Param("device") String device);

    @Query("SELECT COUNT(g) FROM GuestSession g WHERE g.lastActiveAt >= :since")
    long countActiveVisitors(@Param("since") LocalDateTime since);

    @Modifying
    @Transactional
    @Query("UPDATE GuestSession g SET g.lastActiveAt = :offlineTime WHERE g.anonymousDeviceId = :deviceId")
    void markOffline(@Param("deviceId") String deviceId, @Param("offlineTime") LocalDateTime offlineTime);
}
