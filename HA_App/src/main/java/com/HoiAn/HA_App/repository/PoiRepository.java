package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface PoiRepository extends JpaRepository<Poi, Integer> {
    List<Poi> findByStatus(String status);
    List<Poi> findByStatusAndApprovalStatus(String status, String approvalStatus);
    List<Poi> findByMerchantIdOrderByCreatedAtDesc(Integer merchantId);

    /** Serializes POI submissions across app instances until the transaction ends. */
    @Query(value = "SELECT pg_advisory_xact_lock(731904218)", nativeQuery = true)
    Object lockPoiSubmissions();

    /**
     * Tìm POI trùng tên (không phân biệt hoa/thường), loại trừ chính nó khi update.
     * Truyền excludeId = -1 khi tạo mới (không có POI nào bị loại trừ).
     */
    List<Poi> findByNameIgnoreCaseAndIdNot(String name, Integer excludeId);

    /**
     * Tìm POI trùng toạ độ chính xác, loại trừ chính nó khi update.
     * Truyền excludeId = -1 khi tạo mới.
     */
    List<Poi> findByLatitudeAndLongitudeAndIdNot(BigDecimal latitude, BigDecimal longitude, Integer excludeId);
}
