package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.PoiLocationResponse;
import com.HoiAn.HA_App.service.PoiService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/poi")
@CrossOrigin
public class PoiController {

    private final PoiService poiService;

    public PoiController(PoiService poiService) {
        this.poiService = poiService;
    }

    @GetMapping("/locations")
    public List<PoiLocationResponse> getActivePois() {
        return poiService.getActivePois();
    }
}