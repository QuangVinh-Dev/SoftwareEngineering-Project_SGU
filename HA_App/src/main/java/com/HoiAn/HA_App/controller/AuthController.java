package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.request.LoginRequest;
import com.HoiAn.HA_App.dto.request.RegisterAdminRequest;
import com.HoiAn.HA_App.dto.request.RegisterMerchantRequest;
import com.HoiAn.HA_App.dto.response.AuthResponse;
import com.HoiAn.HA_App.dto.response.MerchantRegistrationResponse;
import com.HoiAn.HA_App.dto.response.UserResponse;
import com.HoiAn.HA_App.sercurity.AuthUser;
import com.HoiAn.HA_App.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Đăng nhập cho cả admin và chủ gian hàng. */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Chủ gian hàng tự đăng ký trạng thái PENDING, chờ admin duyệt(). */
    @PostMapping("/register/merchant")
    @ResponseStatus(HttpStatus.CREATED)
    public MerchantRegistrationResponse registerMerchant(@Valid @RequestBody RegisterMerchantRequest request) {
        return authService.registerMerchant(request);
    }

    /** Tạo tài khoản admin mới, chỉ ADMIN được gọi. */
    @PostMapping("/register/admin")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerAdmin(@Valid @RequestBody RegisterAdminRequest request) {
        return authService.registerAdmin(request);
    }

    /** Thông tin tài khoản đang đăng nhập. */
    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthUser user) {
        return authService.me(user);
    }
}
