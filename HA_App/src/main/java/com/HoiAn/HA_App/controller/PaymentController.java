package com.HoiAn.HA_App.controller;



import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.security.web.util.matcher.IpAddressMatcher;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.HoiAn.HA_App.dto.request.ClaimPaymentRequest;
import com.HoiAn.HA_App.dto.response.CreatePaymentResponse;
import com.HoiAn.HA_App.dto.response.PaymentStatusResponse;
import com.HoiAn.HA_App.dto.response.VnPayIpnResponse;
import com.HoiAn.HA_App.service.PaymentService;

import java.net.InetAddress;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private static final String IPV4_LITERAL = "(?:[0-9]{1,3}\\.){3}[0-9]{1,3}";
    private static final String IPV6_LITERAL = "[0-9a-fA-F:.]+";
    private static final String GUEST_SESSION_COOKIE = "hoian_guest_session";

    private final PaymentService paymentService;
    private final List<IpAddressMatcher> trustedProxyMatchers;

    public PaymentController(
            PaymentService paymentService,
            @Value("${app.proxy.trusted-proxies:}") String trustedProxyAddresses) {
        this.paymentService = paymentService;
        this.trustedProxyMatchers = parseTrustedProxyAddresses(trustedProxyAddresses);
    }

    /**
     * API tạo đơn thanh toán.
     * Frontend gọi POST /api/payments.
     */
    @PostMapping
    public CreatePaymentResponse createPayment(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String clientIp = resolveClientIp(request);
        String guestId = resolveGuestSessionId(request, response);
        return paymentService.createPayment(
                clientIp,
                guestId,
                resolveLanguage(request.getHeader("Accept-Language")),
                classifyDevice(request.getHeader("User-Agent"))
        );
    }

    /**
     * VNPay gọi endpoint IPN trực tiếp từ máy chủ của họ.
     *
     * Dùng GET theo tài liệu tích hợp VNPay.
     */
    @GetMapping("/vnpay/ipn")
    public ResponseEntity<VnPayIpnResponse> ipn(
            @RequestParam MultiValueMap<String, String> query
    ) {
        log.info("VNPay IPN received");
        boolean duplicateVnpParameter = query.entrySet().stream()
                .anyMatch(entry -> entry.getKey().startsWith("vnp_")
                        && (entry.getValue() == null || entry.getValue().size() != 1));
        if (duplicateVnpParameter) {
            log.warn("VNPay IPN rejected: ambiguous parameters");
            return ResponseEntity.ok(new VnPayIpnResponse("97", "Ambiguous parameters"));
        }
        Map<String, String> params = new HashMap<>();

        query.forEach((key, values) -> {
            if (values != null && values.size() == 1) {
                params.put(key, values.get(0));
            }
        });

        try {
            return ResponseEntity.ok(paymentService.handleIpn(params));
        } catch (RuntimeException failure) {
            // Không trả chi tiết DB/Redis hoặc dữ liệu callback ra ngoài.
            log.error("VNPay IPN processing failed errorType={}", failure.getClass().getSimpleName());
            return ResponseEntity.ok(new VnPayIpnResponse("99", "Processing error"));
        }
    }

    /**
     * Status chỉ được trả khi claim secret đúng hoặc service token thuộc giao dịch.
     */
    @GetMapping("/{txnRef}/status")
    public PaymentStatusResponse getStatus(
            @PathVariable String txnRef,
            @RequestHeader(value = "X-Payment-Claim-Secret", required = false) String claimSecret,
            @RequestHeader(value = "X-Service-Token", required = false) String serviceAccessToken
    ) {
        return paymentService.getPaymentStatus(txnRef, claimSecret, serviceAccessToken);
    }

    /**
     * API nhận token sau thanh toán.
     */
    @PostMapping("/claim")
    public Map<String, String> claim(
            @Valid @RequestBody ClaimPaymentRequest request
    ) {
        String token = paymentService.claimAccess(
                request.claimSecret()
        );

        return Map.of("accessToken", token);
    }

    private String resolveGuestSessionId(HttpServletRequest request, HttpServletResponse response) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (GUEST_SESSION_COOKIE.equals(cookie.getName())) {
                    try {
                        String candidate = UUID.fromString(cookie.getValue()).toString();
                        if (candidate.equalsIgnoreCase(cookie.getValue())) return candidate;
                    } catch (IllegalArgumentException ignored) {
                        // Replace malformed cookie with a fresh server-generated identity.
                    }
                }
            }
        }
        String deviceId = UUID.randomUUID().toString();
        ResponseCookie cookie = ResponseCookie.from(GUEST_SESSION_COOKIE, deviceId)
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofDays(30))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return deviceId;
    }

    private static String resolveLanguage(String acceptLanguage) {
        if (acceptLanguage == null || acceptLanguage.isBlank()) return null;
        String first = acceptLanguage.split(",", 2)[0].trim().toLowerCase();
        String code = first.split("-", 2)[0];
        return List.of("vi", "en", "ja", "ko", "zh").contains(code) ? code : null;
    }

    private static String classifyDevice(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "unknown";
        String value = userAgent.toLowerCase();
        if (value.contains("ipad") || value.contains("tablet")) return "tablet";
        if (value.contains("mobile") || value.contains("iphone") || value.contains("android")) return "mobile";
        return "desktop";
    }

    /**
     * Lấy IP client.
     *
     * Chỉ đọc X-Forwarded-For nếu peer kết nối trực tiếp nằm trong danh sách
     * app.proxy.trusted-proxies. Danh sách chỉ nhận IP literal/CIDR, không nhận hostname.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String remoteAddress = normalizeIpAddress(request.getRemoteAddr());
        if (remoteAddress == null) {
            return request.getRemoteAddr();
        }

        if (!isTrustedProxy(remoteAddress)) {
            return remoteAddress;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return remoteAddress;
        }

        String[] forwardedAddresses = forwardedFor.split(",", -1);
        String currentAddress = remoteAddress;

        // Walk from the application toward the client. Stop at the first
        // address that is not a trusted proxy; earlier header entries can be
        // supplied by an untrusted client and are therefore ignored.
        for (int i = forwardedAddresses.length - 1; i >= 0; i--) {
            if (!isTrustedProxy(currentAddress)) {
                return currentAddress;
            }

            String nextAddress = normalizeIpAddress(forwardedAddresses[i]);
            if (nextAddress == null) {
                return remoteAddress;
            }
            currentAddress = nextAddress;
        }

        // If the chain contains only trusted proxy addresses, it does not
        // identify an untrusted client. Fall back to the socket peer.
        return isTrustedProxy(currentAddress) ? remoteAddress : currentAddress;
    }

    private boolean isTrustedProxy(String address) {
        return trustedProxyMatchers.stream().anyMatch(matcher -> matcher.matches(address));
    }

    private static List<IpAddressMatcher> parseTrustedProxyAddresses(String configuredAddresses) {
        if (configuredAddresses == null || configuredAddresses.isBlank()) {
            return List.of();
        }

        List<IpAddressMatcher> matchers = new ArrayList<>();
        Arrays.stream(configuredAddresses.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .forEach(value -> matchers.add(toIpAddressMatcher(value)));
        return List.copyOf(matchers);
    }

    private static IpAddressMatcher toIpAddressMatcher(String configuredAddress) {
        String[] parts = configuredAddress.split("/", -1);
        if (parts.length > 2) {
            throw new IllegalArgumentException("Invalid trusted proxy IP/CIDR: " + configuredAddress);
        }

        String ip = normalizeIpAddress(parts[0]);
        if (ip == null) {
            throw new IllegalArgumentException("Trusted proxy must be an IP literal/CIDR: " + configuredAddress);
        }

        if (parts.length == 2) {
            try {
                int prefixLength = Integer.parseInt(parts[1]);
                int maxPrefixLength = ip.contains(":") ? 128 : 32;
                if (prefixLength < 0 || prefixLength > maxPrefixLength) {
                    throw new IllegalArgumentException("Invalid trusted proxy CIDR prefix: " + configuredAddress);
                }
            } catch (NumberFormatException ex) {
                throw new IllegalArgumentException("Invalid trusted proxy CIDR prefix: " + configuredAddress, ex);
            }
        }

        try {
            return new IpAddressMatcher(configuredAddress);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid trusted proxy IP/CIDR: " + configuredAddress, ex);
        }
    }

    private static String normalizeIpAddress(String value) {
        if (value == null) {
            return null;
        }

        String candidate = value.trim();
        if (candidate.isEmpty()) {
            return null;
        }

        boolean ipv6 = candidate.indexOf(':') >= 0;
        if (ipv6 ? !candidate.matches(IPV6_LITERAL) : !candidate.matches(IPV4_LITERAL)) {
            return null;
        }

        try {
            InetAddress address = InetAddress.getByName(candidate);
            return address.getHostAddress();
        } catch (Exception ex) {
            return null;
        }
    }
}
