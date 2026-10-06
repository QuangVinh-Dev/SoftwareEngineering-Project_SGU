package com.HoiAn.HA_App.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // API không sử dụng CSRF token
                .csrf(csrf -> csrf.disable())

                // Không redirect sang trang login của Spring Security
                .formLogin(form -> form.disable())

                // Không sử dụng HTTP Basic authentication
                .httpBasic(basic -> basic.disable())

                // Cho phép truy cập API mà không cần đăng nhập
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/poi/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .anyRequest().permitAll()
                )

                // Không tạo session authentication của Spring Security
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );

        return http.build();
    }
}
