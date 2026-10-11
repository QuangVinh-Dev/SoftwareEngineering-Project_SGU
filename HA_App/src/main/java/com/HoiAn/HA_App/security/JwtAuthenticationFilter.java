package com.HoiAn.HA_App.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Đọc header "Authorization: Bearer <token>", nếu hợp lệ thì đặt thông tin user vào SecurityContext.
 * Token sai/hết hạn thì bỏ qua (request vẫn là anonymous và sẽ bị chặn ở bước phân quyền nếu cần).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIX = "Bearer ";

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (header != null && header.regionMatches(true, 0, PREFIX, 0, PREFIX.length())) {
            String token = header.substring(PREFIX.length()).trim();

            jwtService.parseToken(token).ifPresent(user -> {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(user, null, user.authorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            });
        }

        chain.doFilter(request, response);
    }
}
