package com.HoiAn.HA_App.sercurity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.List;

/**
 * Thông tin người dùng lấy từ JWT, đặt làm principal trong SecurityContext.
 *
 * @param role        tên role trong DB: SUPER_ADMIN / ADMIN / POI_ADMIN / MERCHANT
 * @param accountType ADMIN / MERCHANT
 * @param merchantId  chỉ có giá trị với chủ gian hàng
 */
public record AuthUser(Integer id, String username, String role, String accountType, Integer merchantId) {

    public List<GrantedAuthority> authorities() {
        List<GrantedAuthority> list = new ArrayList<>();
        list.add(new SimpleGrantedAuthority("ROLE_" + role));
        // SUPER_ADMIN có mọi quyền của ADMIN
        if ("SUPER_ADMIN".equals(role)) {
            list.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        // The current role_permission seed grants POI_EDIT to SUPER_ADMIN and
        // ADMIN. POI_ADMIN is the dedicated role for this module.
        if ("SUPER_ADMIN".equals(role) || "ADMIN".equals(role)) {
            list.add(new SimpleGrantedAuthority("ROLE_POI_ADMIN"));
        }
        return list;
    }
}
