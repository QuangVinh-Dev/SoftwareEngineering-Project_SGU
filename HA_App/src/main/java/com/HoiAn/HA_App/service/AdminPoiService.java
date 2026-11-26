package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.AdminPoiResponse;
import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.AudioRepository;
import com.HoiAn.HA_App.repository.PoiRepository;
import com.HoiAn.HA_App.repository.PoiImageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Collections;
import java.util.Set;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminPoiService {
    private static final double EARTH_RADIUS_METERS = 6_371_000;
    private static final String OVERLAP_REJECTION_REASON = "Vị trí POI bị chồng lấn với một điểm tham quan đã gửi trước đó.";
    private final PoiRepository pois;
    private final AdminPoiContentService contentService;
    private final PoiImageRepository poiImages;
    private final PoiImageStorageService imageStorage;

    public AdminPoiService(PoiRepository pois, AdminPoiContentService contentService,
                           PoiImageRepository poiImages, PoiImageStorageService imageStorage) {
        this.pois = pois;
        this.contentService = contentService;
        this.poiImages = poiImages;
        this.imageStorage = imageStorage;
    }

    @Transactional(readOnly = true)
    public List<AdminPoiResponse> list() {
        return pois.findAll(Sort.by(Sort.Direction.ASC, "name")).stream().map(this::response).toList();
    }

    @Transactional(readOnly = true)
    public AdminPoiResponse get(int id) {
        return response(requirePoi(id));
    }

    @Transactional
    public AdminPoiResponse create(PoiMutationRequest request) {
        return create(request, List.of());
    }

    @Transactional
    public AdminPoiResponse create(PoiMutationRequest request, List<MultipartFile> images) {
        Poi poi = new Poi();
        apply(poi, request);
        poi.setApprovalStatus("APPROVED");
        poi.setCreatedAt(LocalDateTime.now());
        poi.setUpdatedAt(poi.getCreatedAt());
        poi = pois.save(poi);
        addImages(poi.getId(), images, false);
        return response(poi);
    }

    @Transactional
    public AdminPoiResponse update(int id, PoiMutationRequest request) {
        return update(id, request, List.of());
    }

    @Transactional
    public AdminPoiResponse update(int id, PoiMutationRequest request, List<MultipartFile> images) {
        Poi poi = requirePoi(id);
        if (!Objects.equals(normalize(poi.getOriginalDescription()), normalize(request.originalDescription()))) {
            contentService.synchronizeOriginalDescription(id, request.originalDescription());
        }
        apply(poi, request);
        poi.setUpdatedAt(LocalDateTime.now());
        poi = pois.save(poi);
        addImages(poi.getId(), images, true);
        return response(poi);
    }

    @Transactional(readOnly = true)
    public List<AdminPoiResponse> listForMerchant(int merchantId) {
        return pois.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(this::response).toList();
    }

    @Transactional
    public AdminPoiResponse createForMerchant(int merchantId, PoiMutationRequest request, List<MultipartFile> images) {
        pois.lockPoiSubmissions();
        List<Poi> existing = pois.findByMerchantIdOrderByCreatedAtDesc(merchantId);
        if (!existing.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mỗi chủ gian hàng chỉ được tạo duy nhất 1 điểm tham quan (POI)");
        }
        Poi poi = new Poi();
        apply(poi, request);
        poi.setMerchantId(merchantId);
        poi.setStatus("ACTIVE");
        poi.setApprovalStatus("PENDING");
        poi.setRejectionReason(null);
        if (overlapsExistingPoi(poi, null)) {
            poi.setApprovalStatus("REJECTED");
            poi.setRejectionReason(OVERLAP_REJECTION_REASON);
        }
        poi.setCreatedAt(LocalDateTime.now());
        poi.setUpdatedAt(poi.getCreatedAt());
        poi = pois.save(poi);
        addImages(poi.getId(), images, false);
        return response(poi);
    }

    @Transactional
    public AdminPoiResponse updateForMerchant(int merchantId, int poiId, PoiMutationRequest request, List<MultipartFile> images) {
        pois.lockPoiSubmissions();
        Poi poi = requirePoi(poiId);
        if (poi.getMerchantId() == null || poi.getMerchantId() != merchantId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Bạn không có quyền chỉnh sửa POI này");
        }
        apply(poi, request);
        boolean overlaps = overlapsExistingPoi(poi, poiId);
        poi.setApprovalStatus(overlaps ? "REJECTED" : "PENDING");
        poi.setRejectionReason(overlaps ? OVERLAP_REJECTION_REASON : null);
        poi.setUpdatedAt(LocalDateTime.now());
        poi = pois.save(poi);
        addImages(poi.getId(), images, true);
        return response(poi);
    }

    @Transactional
    public AdminPoiResponse review(int id, String approvalStatus, String rejectionReason) {
        if ("APPROVED".equals(approvalStatus)) {
            pois.lockPoiSubmissions();
        }
        Poi poi = requirePoi(id);
        if ("APPROVED".equals(approvalStatus) && overlapsExistingPoi(poi, id)) {
            approvalStatus = "REJECTED";
            rejectionReason = OVERLAP_REJECTION_REASON;
        }
        poi.setApprovalStatus(approvalStatus);
        poi.setRejectionReason("REJECTED".equals(approvalStatus) ? blankToNull(rejectionReason) : null);
        poi.setUpdatedAt(LocalDateTime.now());
        return response(pois.save(poi));
    }

    private Poi requirePoi(int id) {
        return pois.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy POI"));
    }

    private boolean overlapsExistingPoi(Poi candidate, Integer excludedPoiId) {
        return pois.findAll().stream()
                .filter(existing -> !Objects.equals(existing.getId(), excludedPoiId))
                .filter(existing -> !"REJECTED".equals(existing.getApprovalStatus()))
                .anyMatch(existing -> circlesOverlap(candidate, existing));
    }

    private boolean circlesOverlap(Poi first, Poi second) {
        if (first.getLatitude() == null || first.getLongitude() == null || first.getRadius() == null
                || second.getLatitude() == null || second.getLongitude() == null || second.getRadius() == null) {
            return false;
        }
        double lat1 = Math.toRadians(first.getLatitude().doubleValue());
        double lat2 = Math.toRadians(second.getLatitude().doubleValue());
        double deltaLat = lat2 - lat1;
        double deltaLon = Math.toRadians(second.getLongitude().doubleValue() - first.getLongitude().doubleValue());
        double haversine = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(lat1) * Math.cos(lat2)
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        double distance = 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
        return distance <= (long) first.getRadius() + second.getRadius();
    }

    private void apply(Poi poi, PoiMutationRequest request) {
        poi.setName(request.name().trim());
        poi.setLatitude(request.latitude());
        poi.setLongitude(request.longitude());
        poi.setRadius(request.radius());
        poi.setPriorityLevel(request.priorityLevel());
        poi.setOriginalDescription(blankToNull(request.originalDescription()));
        poi.setDirectionLink(blankToNull(request.directionLink()));
        poi.setStatus(request.status());
    }

    private AdminPoiResponse response(Poi poi) {
        return new AdminPoiResponse(poi.getId(), poi.getName(), poi.getLatitude(), poi.getLongitude(),
                poi.getRadius(), poi.getPriorityLevel(), poi.getOriginalDescription(), poi.getDirectionLink(), poi.getStatus(),
                poi.getApprovalStatus(), poi.getRejectionReason(), poiImages.findPaths(poi.getId()));
    }

    private void addImages(int poiId, List<MultipartFile> requestedImages, boolean replaceExisting) {
        List<MultipartFile> images = requestedImages == null ? Collections.emptyList()
                : requestedImages.stream().filter(file -> file != null && !file.isEmpty()).toList();
        if (images.isEmpty()) return;

        poiImages.lockPoi(poiId);
        List<String> replacedImages = replaceExisting ? poiImages.findPaths(poiId) : List.of();
        int currentCount = replaceExisting ? 0 : poiImages.count(poiId);
        if (currentCount + images.size() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mỗi POI được tải tối đa 5 hình ảnh");
        }

        List<PoiImageStorageService.StoredImage> stored = imageStorage.storeAll(images);
        try {
            if (replaceExisting) {
                poiImages.deleteAll(poiId);
            }
            for (int index = 0; index < stored.size(); index++) {
                poiImages.add(poiId, stored.get(index).publicUrl(), currentCount + index + 1);
            }
        } catch (RuntimeException e) {
            imageStorage.deleteAll(stored);
            throw e;
        }
        deleteReplacedImagesAfterCommit(replacedImages);
    }

    private void deleteReplacedImagesAfterCommit(List<String> replacedImages) {
        if (replacedImages.isEmpty()) return;
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            imageStorage.deleteByPublicUrls(replacedImages);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                imageStorage.deleteByPublicUrls(replacedImages);
            }
        });
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalize(String value) { return blankToNull(value); }

    public record PoiMutationRequest(String name, java.math.BigDecimal latitude, java.math.BigDecimal longitude,
                                     Integer radius, Integer priorityLevel, String originalDescription,
                                     String directionLink, String status) {}
}
