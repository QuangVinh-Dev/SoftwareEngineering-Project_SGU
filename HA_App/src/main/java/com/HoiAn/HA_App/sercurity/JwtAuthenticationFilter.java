package com.HoiAn.HA_App.sercurity;

import com.HoiAn.HA_App.service.AccessTokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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
    private final AccessTokenService accessTokenService;

    public JwtAuthenticationFilter(JwtService jwtService, AccessTokenService accessTokenService) {
        this.jwtService = jwtService;
        this.accessTokenService = accessTokenService;
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

        if (isServiceProtectedRequest(request)) {
            String serviceToken = request.getHeader("X-Service-Token");
            if (serviceToken != null && !serviceToken.isBlank()) {
                try {
                    accessTokenService.resolveToken(serviceToken).ifPresent(txnRef -> {
                        var authentication = new UsernamePasswordAuthenticationToken(
                                txnRef, null,
                                java.util.List.of(new SimpleGrantedAuthority("SERVICE_ACCESS")));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    });
                } catch (DataAccessException unavailable) {
                    response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private static boolean isServiceProtectedRequest(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        boolean protectedApi = "GET".equals(request.getMethod())
                && ("/api/poi/locations".equals(path)
                    || path.matches("/api/poi/[^/]+/audio"));
        boolean protectedAudio = path.startsWith("/uploads/audio/")
                && !path.startsWith("/uploads/audio/merchant-images/");
        return protectedApi || protectedAudio;
    }
}
