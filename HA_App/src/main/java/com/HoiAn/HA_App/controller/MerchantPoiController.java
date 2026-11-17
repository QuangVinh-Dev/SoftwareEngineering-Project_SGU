package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.AdminPoiResponse;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.service.AdminPoiService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/merchant/pois")
public class MerchantPoiController {
    private final AdminPoiService poiService;

    public MerchantPoiController(AdminPoiService poiService) {
        this.poiService = poiService;
    }

    @GetMapping
    public List<AdminPoiResponse> list(@AuthenticationPrincipal AuthUser current) {
        return poiService.listForMerchant(requireMerchantId(current));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AdminPoiResponse create(@AuthenticationPrincipal AuthUser current,
                                  @Valid @RequestPart("poi") AdminPoiController.PoiRequest request,
                                  @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return poiService.createForMerchant(requireMerchantId(current), request.toServiceRequest(), images);
    }

    @PutMapping(value = "/{poiId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AdminPoiResponse update(@AuthenticationPrincipal AuthUser current,
                                  @PathVariable int poiId,
                                  @Valid @RequestPart("poi") AdminPoiController.PoiRequest request,
                                  @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        return poiService.updateForMerchant(requireMerchantId(current), poiId, request.toServiceRequest(), images);
    }

    private Integer requireMerchantId(AuthUser current) {
        if (current == null || current.merchantId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Tài khoản không gắn với gian hàng đã được duyệt");
        }
        return current.merchantId();
    }
}
