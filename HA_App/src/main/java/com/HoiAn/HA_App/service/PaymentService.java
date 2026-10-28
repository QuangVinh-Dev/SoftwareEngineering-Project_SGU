package com.HoiAn.HA_App.service;




import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.HoiAn.HA_App.config.VnPayProperties;
import com.HoiAn.HA_App.dto.response.CreatePaymentResponse;
import com.HoiAn.HA_App.dto.response.PaymentStatusResponse;
import com.HoiAn.HA_App.dto.response.VnPayIpnResponse;
import com.HoiAn.HA_App.dto.response.VnPayReturnResponse;
import com.HoiAn.HA_App.entity.Payment;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.event.PaymentConfirmedEvent;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.PaymentRepository;
import com.HoiAn.HA_App.util.VnPayUtil;

import java.math.BigDecimal;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final ApplicationEventPublisher eventPublisher;

    private static final ZoneId VN_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter VNPAY_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private static final SecureRandom SECURE_RANDOM =
            new SecureRandom();

    private final PaymentRepository paymentRepository;
    private final GuestSessionService guestSessionService;
    private final AppConfigService configService;
    private final VnPayProperties vnpayProperties;
    private final AccessTokenService accessTokenService;

    public PaymentService(
            PaymentRepository paymentRepository,
            GuestSessionService guestSessionService,
            AppConfigService configService,
            VnPayProperties vnpayProperties,
            AccessTokenService accessTokenService,
            ApplicationEventPublisher eventPublisher
    ) {
        this.paymentRepository = paymentRepository;
        this.guestSessionService = guestSessionService;
        this.configService = configService;
        this.vnpayProperties = vnpayProperties;
        this.accessTokenService = accessTokenService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Tạo đơn thanh toán mới.
     *
     * Giá được lấy từ database, không tin giá từ frontend.
     * Đơn được lưu PENDING trước khi frontend chuyển sang VNPay.
     */
    @Transactional
    public CreatePaymentResponse createPayment(
            String clientIp, String anonymousDeviceId, String languageCode, String device) {
        return createPayment(clientIp, anonymousDeviceId, languageCode, device, null);
    }

    @Transactional
    public CreatePaymentResponse createPayment(
            String clientIp, String anonymousDeviceId, String languageCode, String device, String customReturnUrl) {
        validatePaymentConfiguration();
        var guestSession = guestSessionService.registerOrUpdate(
                anonymousDeviceId, languageCode, device);

        // 1. Lấy giá và loại tiền từ cấu hình hệ thống.
        BigDecimal amount = configService.getUnlockPrice();
        String currency = configService.getRequiredValue(
                "UNLOCK_CURRENCY"
        );

        if (!"VND".equals(currency)) {
            throw new IllegalStateException(
                    "Cấu hình thanh toán VNPay hiện chỉ hỗ trợ VND"
            );
        }

        // 2. Tạo mã giao dịch nội bộ đủ duy nhất.
        String txnRef = generateTxnRef();

        // 3. Tạo bí mật để frontend nhận token sau khi thanh toán.
        String claimSecret = generateClaimSecret();
        String claimSecretHash = VnPayUtil.sha256Hex(claimSecret);

        // 4. Tạo Payment khớp với bảng payment hiện có.
        Payment payment = new Payment();
        payment.setProvider("VNPAY");
        payment.setProviderTxnId(txnRef);
        payment.setSessionId(guestSession.getId());
        payment.setClaimSecretHash(claimSecretHash);
        payment.setAmount(amount);
        payment.setCurrency(currency);
        payment.setStatus(PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now(VN_ZONE));

        // Giao dịch luôn được gắn với guest session đã upsert ở trên.
        paymentRepository.save(payment);

        // 5. Tạo các tham số yêu cầu thanh toán.
        Map<String, String> params = buildPaymentParams(
                txnRef,
                amount,
                clientIp,
                customReturnUrl
        );

        // 6. Ký tham số và tạo URL thanh toán.
        String hashData = VnPayUtil.buildHashData(params);

        String secureHash = VnPayUtil.hmacSha512(
                vnpayProperties.hashSecret(),
                hashData
        );

        String query = VnPayUtil.buildQueryString(params);

        String paymentUrl = vnpayProperties.payUrl()
                + "?"
                + query
                + "&vnp_SecureHash="
                + secureHash;

        // 7. Trả dữ liệu cần thiết cho frontend.
        // claimSecret chỉ được trả cho bên đã tạo đơn.
        return new CreatePaymentResponse(
                txnRef,
                paymentUrl,
                claimSecret
        );
    }

    /**
     * Tạo các tham số yêu cầu thanh toán theo VNPay 2.1.0.
     */
    private Map<String, String> buildPaymentParams(
            String txnRef,
            BigDecimal amount,
            String clientIp,
            String customReturnUrl
    ) {
        long vnpAmount = amount
                .multiply(new BigDecimal("100"))
                .longValueExact();

        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        LocalDateTime expireAt = now.plusDays(2);

        Map<String, String> params = new HashMap<>();

        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnpayProperties.tmnCode());
        params.put("vnp_Amount", Long.toString(vnpAmount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Mo khoa dich vu thuyet minh");
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_CreateDate",
                now.format(VNPAY_DATE_FORMAT));
        params.put("vnp_ExpireDate",
                expireAt.format(VNPAY_DATE_FORMAT));
        params.put("vnp_IpAddr", normalizeIp(clientIp));

        String effectiveReturnUrl = (customReturnUrl != null && !customReturnUrl.isBlank() && isAbsolutePaymentUrl(customReturnUrl, false))
                ? customReturnUrl
                : vnpayProperties.returnUrl();
        params.put("vnp_ReturnUrl", effectiveReturnUrl);

        return params;
    }

    private void validatePaymentConfiguration() {
        if (vnpayProperties.tmnCode() == null || vnpayProperties.tmnCode().isBlank()
                || vnpayProperties.hashSecret() == null || vnpayProperties.hashSecret().isBlank()) {
            throw new IllegalStateException("Thiếu cấu hình merchant VNPay");
        }
        if (!isAbsolutePaymentUrl(vnpayProperties.payUrl(), true)) {
            throw new IllegalStateException("VNPAY_PAYMENT_URL phải là URL HTTPS hợp lệ, không có query hoặc fragment");
        }
        String returnUrl = vnpayProperties.returnUrl();
        if (returnUrl == null || returnUrl.length() < 10 || returnUrl.length() > 255
                || !isAbsolutePaymentUrl(returnUrl, false)) {
            throw new IllegalStateException("VNPAY_RETURN_URL phải là URL HTTP/HTTPS hợp lệ dài 10–255 ký tự");
        }
    }

    private static boolean isAbsolutePaymentUrl(String value, boolean gateway) {
        if (value == null || value.isBlank()) return false;
        try {
            URI uri = URI.create(value);
            boolean allowedScheme = "https".equalsIgnoreCase(uri.getScheme())
                    || (!gateway && "http".equalsIgnoreCase(uri.getScheme()));
            return allowedScheme && uri.getHost() != null && uri.getUserInfo() == null
                    && (!gateway || (uri.getRawQuery() == null && uri.getRawFragment() == null));
        } catch (IllegalArgumentException invalidUrl) {
            return false;
        }
    }

    /**
     * Sinh mã giao dịch nội bộ.
     * Database còn có UNIQUE để ngăn mã trùng.
     */
    private String generateTxnRef() {
        byte[] bytes = new byte[16];
        SECURE_RANDOM.nextBytes(bytes);

        return "HA"
                + LocalDateTime.now(VN_ZONE)
                    .format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + HexFormat.of().formatHex(bytes);
    }

    /**
     * Sinh bí mật ngẫu nhiên dùng để claim token.
     */
    private String generateClaimSecret() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    /**
     * Chuẩn hóa địa chỉ IP.
     *
     * Không được tin X-Forwarded-For do client tự gửi.
     * Khi chạy sau Nginx, phải cấu hình proxy tin cậy đúng cách.
     */
    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "127.0.0.1";
        }

        // VNPay giới hạn độ dài vnp_IpAddr.
        if (ip.length() > 45) {
            throw new IllegalArgumentException(
                    "Địa chỉ IP không hợp lệ"
            );
        }

        return ip;
    }

    /**
     * Xử lý IPN từ VNPay.
     * Chỉ đánh dấu PAID sau khi xác minh chữ ký và đối chiếu đơn hàng.
     */
    @Transactional
    public VnPayIpnResponse handleIpn(
            Map<String, String> receivedParams
    ) {
        // 1. Sao chép các tham số vnp_ và loại chữ ký ra khỏi dữ liệu ký.
        Map<String, String> params = new HashMap<>();

        receivedParams.forEach((key, value) -> {
            if (key != null && key.startsWith("vnp_")) {
                params.put(key, value);
            }
        });

        String receivedHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        // 2. Xác minh chữ ký trước khi xử lý nghiệp vụ.
        String expectedHash = VnPayUtil.hmacSha512(
                vnpayProperties.hashSecret(),
                VnPayUtil.buildHashData(params)
        );

        if (!VnPayUtil.constantTimeEquals(
                expectedHash, receivedHash)) {
            return ipnResult(
                    "97", "Invalid Checksum"
            );
        }

        // 3. Kiểm tra mã merchant.
        if (!vnpayProperties.tmnCode().equals(
                params.get("vnp_TmnCode"))) {
            return ipnResult(
                    "97", "Invalid Merchant"
            );
        }

        // 4. Tìm và khóa đơn hàng trong transaction.
        String txnRef = params.get("vnp_TxnRef");

        if (txnRef == null || txnRef.isBlank()) {
            return ipnResult(
                    "01", "Order not found"
            );
        }

        Optional<Payment> found =
                paymentRepository.findByProviderTxnIdForUpdate(
                        txnRef
                );

        if (found.isEmpty()) {
            return ipnResult(
                    "01", "Order not found"
            );
        }

        Payment payment = found.get();

        // 5. Đối chiếu tiền: VNPay gửi số tiền nhân 100.
        final long receivedAmount;

        try {
            receivedAmount = Long.parseLong(
                    params.get("vnp_Amount")
            );
        } catch (Exception ex) {
            return ipnResult(
                    "04", "Invalid amount"
            );
        }

        long expectedAmount = payment.getAmount()
                .multiply(new BigDecimal("100"))
                .longValueExact();

        if (receivedAmount != expectedAmount) {
            return ipnResult(
                    "04", "Invalid amount"
            );
        }

        // Thiếu/malformed kết quả không phải là bằng chứng giao dịch thất bại.
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        if (responseCode == null || !responseCode.matches("[0-9]{2}")
                || transactionStatus == null || !transactionStatus.matches("[0-9]{2}")) {
            return ipnResult("99", "Invalid transaction result");
        }
        boolean success = "00".equals(responseCode) && "00".equals(transactionStatus);
        String transactionNo = params.get("vnp_TransactionNo");
        if (success && (transactionNo == null || transactionNo.isBlank())) {
            return ipnResult("99", "Missing transaction number");
        }
        log.info("VNPay IPN validated paymentId={} signatureValid=true amountMatch=true", payment.getId());

        // 6. Đơn đã xử lý thì không cấp quyền lần nữa.
        if (payment.getStatus() == PaymentStatus.PAID) {
            return ipnResult(
                    "00", "Confirm Success"
            );
        }

        // Không tự chuyển trạng thái kết thúc FAILED trở lại PAID nếu chưa có
        // quy trình đối soát và phục hồi được thiết kế rõ ràng.
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return ipnResult(
                    "02", "Order already processed"
            );
        }

        // 7. Chỉ thành công nếu cả hai mã kết quả đều là 00.
        if (!success) {
            // Chỉ cập nhật FAILED khi chữ ký hợp lệ,
            // đơn và số tiền khớp, và VNPay xác nhận giao dịch thất bại.
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            log.info("VNPay IPN paymentId={} status=PENDING->FAILED (transaction commit pending)", payment.getId());

            return ipnResult(
                    "00", "Confirm Success"
            );
        }

        // 8. Lưu kết quả thanh toán đã xác minh.
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now(VN_ZONE));
        payment.setProviderTransactionNo(transactionNo);

        paymentRepository.save(payment);
        log.info("VNPay IPN paymentId={} status=PENDING->PAID (transaction commit pending)", payment.getId());

        // Chưa gọi Redis trực tiếp tại đây.
        // Phần cấp quyền cần được xử lý có khả năng retry nếu Redis lỗi.
        // Listener sẽ xử lý sau khi transaction commit.
        eventPublisher.publishEvent(
                new PaymentConfirmedEvent(payment.getProviderTxnId())
        );
        return ipnResult(
                "00", "Confirm Success"
        );
    }

    /**
     * Xác minh Return URL do trình duyệt chuyển tiếp về frontend.
     *
     * Return không thay thế IPN: nó dùng cùng phép xác minh và cập nhật
     * idempotent để người dùng không bị treo PENDING khi IPN đến chậm hoặc
     * merchant Sandbox chưa gửi callback. IPN gọi sau đó vẫn nhận kết quả đã xử lý.
     */
    @Transactional
    public VnPayReturnResponse handleReturn(Map<String, String> receivedParams) {
        VnPayIpnResponse verification = handleIpn(receivedParams);
        String txnRef = receivedParams.get("vnp_TxnRef");
        boolean verified = "00".equals(verification.RspCode())
                || "02".equals(verification.RspCode());

        if (!verified || txnRef == null || txnRef.isBlank()) {
            return new VnPayReturnResponse(txnRef, null, false, verification.Message());
        }

        Payment payment = paymentRepository.findByProviderTxnId(txnRef).orElse(null);
        if (payment == null) {
            return new VnPayReturnResponse(txnRef, null, false, "Order not found");
        }

        return new VnPayReturnResponse(
                txnRef,
                payment.getStatus().name(),
                true,
                verification.Message()
        );
    }

    private VnPayIpnResponse ipnResult(String code, String message) {
        log.info("VNPay IPN result code={} reason={}", code, message);
        return new VnPayIpnResponse(code, message);
    }

    /**
     * Lấy trạng thái đơn theo mã giao dịch.
     */
    @Transactional(readOnly = true)
    public PaymentStatusResponse getPaymentStatus(
            String txnRef, String claimSecret, String serviceAccessToken
    ) {
        Payment payment = paymentRepository.findByProviderTxnId(txnRef)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy giao dịch"));

        String suppliedHash = claimSecret == null ? "" : VnPayUtil.sha256Hex(claimSecret);
        boolean claimAuthorized = MessageDigest.isEqual(
                payment.getClaimSecretHash().getBytes(StandardCharsets.US_ASCII),
                suppliedHash.getBytes(StandardCharsets.US_ASCII));

        Instant expiresAt = null;
        Long secondsRemaining = null;
        if (!claimAuthorized && serviceAccessToken != null) {
            String authorizedTxn = accessTokenService.resolveToken(serviceAccessToken).orElse(null);
            if (authorizedTxn != null && authorizedTxn.equals(payment.getProviderTxnId())) {
                claimAuthorized = true;
                expiresAt = accessTokenService.getExpiresAt(serviceAccessToken);
                secondsRemaining = Math.max(0, Duration.between(Instant.now(), expiresAt).toSeconds());
            }
        }
        if (!claimAuthorized) {
            throw new NoSuchElementException("Không tìm thấy giao dịch");
        }

        return new PaymentStatusResponse(
                payment.getProviderTxnId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus().name(),
                payment.getCreatedAt(),
                payment.getPaidAt(),
                expiresAt,
                secondsRemaining
        );
    }

    /**
     * Cho phép trình duyệt nhận token sau khi giao dịch được xác nhận.
     *
     * claimSecret là bí mật đã được cấp khi tạo đơn.
     * Database chỉ lưu SHA-256 của claimSecret.
     */
    @Transactional(readOnly = true)
    public String claimAccess(String claimSecret) {

        if (claimSecret == null || claimSecret.isBlank()) {
            throw new IllegalArgumentException(
                    "Thiếu claimSecret"
            );
        }

        // 1. Băm secret nhận từ frontend.
        String secretHash = VnPayUtil.sha256Hex(claimSecret);

        // 2. Tìm payment bằng hash.
        Payment payment = paymentRepository
                .findByClaimSecretHash(secretHash)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Không tìm thấy giao dịch"
                        )
                );

        // 3. Chỉ đơn PAID mới được nhận token.
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Giao dịch chưa được xác nhận thanh toán"
            );
        }

        // 4. Nhận token đã được tạo sau khi IPN thành công.
        return accessTokenService
                .claimHandoff(payment.getProviderTxnId())
                .orElseThrow(() ->
                        new ApiException(
                                HttpStatus.SERVICE_UNAVAILABLE,
                                "Token chưa sẵn sàng hoặc đã được nhận"
                        )
                );
    }
}
