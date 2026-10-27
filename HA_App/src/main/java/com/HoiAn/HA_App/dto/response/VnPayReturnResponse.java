package com.HoiAn.HA_App.dto.response;

/**
 * Kết quả backend xác minh các tham số VNPay mà trình duyệt nhận tại Return URL.
 * Response này dành cho frontend, tách biệt với RspCode/Message của IPN.
 */
public record VnPayReturnResponse(
        String txnRef,
        String status,
        boolean verified,
        String message
) {
}
