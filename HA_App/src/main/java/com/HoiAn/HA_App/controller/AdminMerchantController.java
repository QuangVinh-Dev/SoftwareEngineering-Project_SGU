package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.response.MerchantResponse;
import com.HoiAn.HA_App.service.MerchantAdminService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/merchants")
public class AdminMerchantController {

    private final MerchantAdminService merchantAdminService;

    public AdminMerchantController(MerchantAdminService merchantAdminService) {
        this.merchantAdminService = merchantAdminService;
    }

    /** GET /api/admin/merchants?status=PENDING */
    @GetMapping
    public List<MerchantResponse> list(@RequestParam(required = false) String status) {
        return merchantAdminService.list(status);
    }

    @PatchMapping("/{id}/approve")
    public MerchantResponse approve(@PathVariable Integer id) {
        return merchantAdminService.approve(id);
    }

    @PatchMapping("/{id}/reject")
    public MerchantResponse reject(@PathVariable Integer id) {
        return merchantAdminService.reject(id);
    }
}
