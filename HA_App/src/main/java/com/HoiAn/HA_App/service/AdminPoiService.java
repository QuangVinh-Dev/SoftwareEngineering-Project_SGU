package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.AdminPoiResponse;
import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class AdminPoiService {
    private final PoiRepository pois;
    private final AdminPoiContentService contentService;

    public AdminPoiService(PoiRepository pois, AdminPoiContentService contentService) {
        this.pois = pois;
        this.contentService = contentService;
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
        Poi poi = new Poi();
        apply(poi, request);
        poi.setCreatedAt(LocalDateTime.now());
        poi.setUpdatedAt(poi.getCreatedAt());
        return response(pois.save(poi));
    }

    @Transactional
    public AdminPoiResponse update(int id, PoiMutationRequest request) {
        Poi poi = requirePoi(id);
        if (!Objects.equals(normalize(poi.getOriginalDescription()), normalize(request.originalDescription()))) {
            contentService.synchronizeOriginalDescription(id, request.originalDescription());
        }
        apply(poi, request);
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
                poi.getRadius(), poi.getPriorityLevel(), poi.getOriginalDescription(), poi.getDirectionLink(), poi.getStatus());
    }

    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String normalize(String value) { return blankToNull(value); }

    public record PoiMutationRequest(String name, java.math.BigDecimal latitude, java.math.BigDecimal longitude,
                                     Integer radius, Integer priorityLevel, String originalDescription,
                                     String directionLink, String status) {}
}
