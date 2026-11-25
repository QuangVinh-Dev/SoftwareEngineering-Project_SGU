package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.request.CreateAdminAccountRequest;
import com.HoiAn.HA_App.dto.request.UpdateAccountStatusRequest;
import com.HoiAn.HA_App.dto.request.UpdateAdminAccountRequest;
import com.HoiAn.HA_App.dto.response.ActionLogResponse;
import com.HoiAn.HA_App.dto.response.AdminAccountResponse;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.service.AdminAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/accounts")
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    public AdminAccountController(AdminAccountService adminAccountService) {
        this.adminAccountService = adminAccountService;
    }

    @GetMapping
    public List<AdminAccountResponse> listAccounts() {
        return adminAccountService.listAccounts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminAccountResponse createAccount(@Valid @RequestBody CreateAdminAccountRequest request,
                                              @AuthenticationPrincipal AuthUser user) {
        String username = user != null ? user.username() : null;
        return adminAccountService.createAccount(request, username);
    }

    @PutMapping("/{id}")
    public AdminAccountResponse updateAccount(@PathVariable Integer id,
                                              @Valid @RequestBody UpdateAdminAccountRequest request,
                                              @AuthenticationPrincipal AuthUser user) {
        String username = user != null ? user.username() : null;
        return adminAccountService.updateAccount(id, request, username);
    }

    @PatchMapping("/{id}/status")
    public AdminAccountResponse updateStatus(@PathVariable Integer id,
                                             @RequestBody(required = false) UpdateAccountStatusRequest request,
                                             @AuthenticationPrincipal AuthUser user) {
        String username = user != null ? user.username() : null;
        String status = request != null ? request.status() : null;
        return adminAccountService.updateStatus(id, status, username);
    }

    @GetMapping("/logs")
    public List<ActionLogResponse> listLogs() {
        return adminAccountService.listLogs();
    }
}
