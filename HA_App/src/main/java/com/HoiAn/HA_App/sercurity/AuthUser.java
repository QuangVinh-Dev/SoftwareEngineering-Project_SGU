package com.HoiAn.HA_App.sercurity;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.List;

/**
 * Thông tin người dùng lấy từ JWT, đặt làm principal trong SecurityContext.
 *
 * @param role        tên role trong DB: ADMIN / MERCHANT
 * @param accountType ADMIN / MERCHANT
 * @param merchantId  chỉ có giá trị với chủ gian hàng
 */
public record AuthUser(Integer id, String username, String role, String accountType, Integer merchantId) {

    public List<GrantedAuthority> authorities() {
        List<GrantedAuthority> list = new ArrayList<>();
        list.add(new SimpleGrantedAuthority("ROLE_" + role));
        return list;
    }
}
