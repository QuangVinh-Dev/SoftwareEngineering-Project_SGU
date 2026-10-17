package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.AdminPoiResponse;
import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PoiRepository;
import com.HoiAn.HA_App.repository.PoiImageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Collections;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AdminPoiService {
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
        addImages(poi.getId(), images);
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
        addImages(poi.getId(), images);
        return response(poi);
    }

    @Transactional(readOnly = true)
    public List<AdminPoiResponse> listForMerchant(int merchantId) {
        return pois.findByMerchantIdOrderByCreatedAtDesc(merchantId).stream().map(this::response).toList();
    }

    @Transactional
    public AdminPoiResponse createForMerchant(int merchantId, PoiMutationRequest request, List<MultipartFile> images) {
        Poi poi = new Poi();
        apply(poi, request);
        poi.setMerchantId(merchantId);
        poi.setStatus("ACTIVE");
        poi.setApprovalStatus("PENDING");
        poi.setRejectionReason(null);
        poi.setCreatedAt(LocalDateTime.now());
        poi.setUpdatedAt(poi.getCreatedAt());
        poi = pois.save(poi);
        addImages(poi.getId(), images);
        return response(poi);
    }

    @Transactional
    public AdminPoiResponse review(int id, String approvalStatus, String rejectionReason) {
        Poi poi = requirePoi(id);
        poi.setApprovalStatus(approvalStatus);
        poi.setRejectionReason("REJECTED".equals(approvalStatus) ? blankToNull(rejectionReason) : null);
        poi.setUpdatedAt(LocalDateTime.now());
        return response(pois.save(poi));
    }

    private Poi requirePoi(int id) {
        return pois.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy POI"));
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

    private void addImages(int poiId, List<MultipartFile> requestedImages) {
        List<MultipartFile> images = requestedImages == null ? Collections.emptyList()
                : requestedImages.stream().filter(file -> file != null && !file.isEmpty()).toList();
        if (images.isEmpty()) return;

        poiImages.lockPoi(poiId);
        int currentCount = poiImages.count(poiId);
        if (currentCount + images.size() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mỗi POI được tải tối đa 5 hình ảnh");
        }

        List<PoiImageStorageService.StoredImage> stored = imageStorage.storeAll(images);
        try {
            for (int index = 0; index < stored.size(); index++) {
                poiImages.add(poiId, stored.get(index).publicUrl(), currentCount + index + 1);
            }
        } catch (RuntimeException e) {
            imageStorage.deleteAll(stored);
            throw e;
        }
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalize(String value) { return blankToNull(value); }

    public record PoiMutationRequest(String name, java.math.BigDecimal latitude, java.math.BigDecimal longitude,
                                     Integer radius, Integer priorityLevel, String originalDescription,
                                     String directionLink, String status) {}
}
