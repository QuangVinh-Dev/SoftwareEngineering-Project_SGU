package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.PoiLocationResponse;
import com.HoiAn.HA_App.entity.Poi;
import com.HoiAn.HA_App.repository.PoiRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PoiService {

    private final PoiRepository poiRepository;

    public PoiService(PoiRepository poiRepository) {
        this.poiRepository = poiRepository;
    }

    public List<PoiLocationResponse> getActivePois() {

        return poiRepository.findByStatus("ACTIVE")
                .stream()
                .map(this::toLocationResponse)
                .toList();
    }

    private PoiLocationResponse toLocationResponse(Poi poi) {

        return new PoiLocationResponse(
                poi.getId(),
                poi.getName(),
                poi.getLatitude(),
                poi.getLongitude(),
                poi.getRadius()
        );
    }
}