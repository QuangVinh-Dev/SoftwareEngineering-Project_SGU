package com.HoiAn.HA_App.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Body đăng ký chủ gian hàng — khớp với form đăng ký của HA_Store Owner (Login.tsx).
 * FE đăng nhập bằng email nên username là tùy chọn: bỏ trống thì dùng luôn email.
 */
public record RegisterMerchantRequest(

        @Size(min = 3, max = 150, message = "Tên đăng nhập dài 3-150 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9._@+-]+$", message = "Tên đăng nhập chỉ gồm chữ, số, dấu . _ - @ +")
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

        // Cho phép rỗng vì FE gửi "" khi người dùng không nhập số điện thoại.
        @Pattern(regexp = "^$|^[0-9+()\\-\\s]{8,20}$", message = "Số điện thoại không hợp lệ")
        String phoneNumber,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @Size(max = 100, message = "Loại hình tối đa 100 ký tự")
        String category,

        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String description,

        /** Ảnh gian hàng dạng data URI base64 (data:image/png;base64,...), tối đa 5 ảnh. */
        @Size(max = 5, message = "Tối đa 5 ảnh gian hàng")
        List<String> merchantImages,

        /** Gói dịch vụ FE gửi lên: { id, billing, totalPrice } — totalPrice được bỏ qua. */
        PlanInfo plan
) {

    public record PlanInfo(String id, String billing) {
    }
}
