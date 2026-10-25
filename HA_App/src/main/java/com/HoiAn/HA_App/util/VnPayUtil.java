package com.HoiAn.HA_App.util;



import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;
import java.util.StringJoiner;

public final class VnPayUtil {

    private VnPayUtil() {
        // Không cho tạo instance của lớp tiện ích.
    }

    /**
     * URL-encode một giá trị theo UTF-8.
     * Dùng khi xây dựng chuỗi tham số ký và query string.
     */
    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /**
     * Tạo chuỗi dữ liệu theo thứ tự key tăng dần.
     *
     * Lưu ý:
     * - Phải loại bỏ các trường chữ ký trước khi gọi hàm này.
     * - Quy tắc encode phải thống nhất với phiên bản VNPay đang dùng.
     */
    public static String buildHashData(
            Map<String, String> params
    ) {
        SortedMap<String, String> sorted = new TreeMap<>(params);
        StringJoiner joiner = new StringJoiner("&");

        sorted.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                joiner.add(encode(key) + "=" + encode(value));
            }
        });

        return joiner.toString();
    }

    /**
     * Tạo HMAC-SHA512 và trả về chuỗi hexadecimal.
     */
    public static String hmacSha512(
            String secret,
            String data
    ) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");

            SecretKeySpec key = new SecretKeySpec(
                    secret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"
            );

            mac.init(key);

            byte[] result = mac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(result);

        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException(
                    "Không thể tạo chữ ký VNPay", ex
            );
        }
    }

    /**
     * Tạo URL query string từ các tham số đã được sắp xếp.
     */
    public static String buildQueryString(
            Map<String, String> params
    ) {
        SortedMap<String, String> sorted = new TreeMap<>(params);
        StringJoiner joiner = new StringJoiner("&");

        sorted.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                joiner.add(encode(key) + "=" + encode(value));
            }
        });

        return joiner.toString();
    }

    /**
     * Tạo SHA-256 dạng hexadecimal để lưu hash của claimSecret.
     * Không dùng hàm này để ký giao dịch VNPay.
     */
    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] result = digest.digest(
                    value.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(result);

        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException(
                    "Không thể tạo SHA-256", ex
            );
        }
    }

    /**
     * So sánh chữ ký theo cách không tự viết vòng lặp so sánh ký tự.
     */
    public static boolean constantTimeEquals(
            String expected,
            String received
    ) {
        if (expected == null || received == null) {
            return false;
        }

        return MessageDigest.isEqual(
                expected.toLowerCase(Locale.ROOT)
                        .getBytes(StandardCharsets.US_ASCII),
                received.toLowerCase(Locale.ROOT)
                        .getBytes(StandardCharsets.US_ASCII)
        );
    }
}
