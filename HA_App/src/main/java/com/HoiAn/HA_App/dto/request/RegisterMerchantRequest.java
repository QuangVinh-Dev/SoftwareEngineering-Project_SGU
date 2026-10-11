package com.HoiAn.HA_App.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterMerchantRequest(

        @NotBlank(message = "Vui lòng nhập tên đăng nhập")
        @Size(min = 3, max = 50, message = "Tên đăng nhập dài 3-50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu . _ -")
        String username,

        @NotBlank(message = "Vui lòng nhập mật khẩu")
        @Size(min = 8, max = 72, message = "Mật khẩu dài 8-72 ký tự")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mật khẩu phải có cả chữ và số")
        String password,

        @NotBlank(message = "Vui lòng nhập họ tên")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String fullName,

        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 150, message = "Email tối đa 150 ký tự")
        String email,

        @NotBlank(message = "Vui lòng nhập tên gian hàng")
        @Size(max = 150, message = "Tên gian hàng tối đa 150 ký tự")
        String merchantName,

        @Pattern(regexp = "^[0-9+()\\-\\s]{8,20}$", message = "Số điện thoại không hợp lệ")
        String phoneNumber,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address
) {
}
