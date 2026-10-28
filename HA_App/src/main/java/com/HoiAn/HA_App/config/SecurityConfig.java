package com.HoiAn.HA_App.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.HoiAn.HA_App.sercurity.JwtAuthenticationFilter;
import com.HoiAn.HA_App.sercurity.JwtService;
import com.HoiAn.HA_App.service.AccessTokenService;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
                                            AccessTokenService accessTokenService) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((request, response, exception) ->
                                writeJson(response, HttpServletResponse.SC_UNAUTHORIZED,
                                        "Chưa đăng nhập hoặc token không hợp lệ/đã hết hạn"))
                        .accessDeniedHandler((request, response, exception) ->
                                writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                                        "Bạn không có quyền thực hiện thao tác này")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error", "/uploads/poi-images/**", "/poi-images/**").permitAll()
                        .requestMatchers("/uploads/audio/merchant-images/**").permitAll()
                        .requestMatchers("/uploads/audio/**")
                            .hasAnyAuthority("SERVICE_ACCESS", "ROLE_ADMIN")
                        .requestMatchers("/api/public/visitor/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register/merchant").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/payments", "/api/payments/claim",
                                "/api/payments/vnpay/return").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/vnpay/ipn").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/payments/*/status").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/poi/locations", "/api/poi/*/audio")
                            .hasAnyAuthority("SERVICE_ACCESS", "ROLE_ADMIN")
                        .requestMatchers("/api/merchant/pois", "/api/merchant/pois/**").hasRole("MERCHANT")
                        .requestMatchers("/api/auth/register/admin").hasRole("ADMIN")
                        .requestMatchers("/api/admin/pois", "/api/admin/pois/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/poi/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtAuthenticationFilter(jwtService, accessTokenService),
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("Không dùng UserDetailsService");
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174}") String allowedOrigins) {
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private static void writeJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\",\"errors\":{}}");
    }
}
