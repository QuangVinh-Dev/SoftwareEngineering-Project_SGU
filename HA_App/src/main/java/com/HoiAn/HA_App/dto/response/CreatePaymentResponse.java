package com.HoiAn.HA_App.dto.response;


/**
 * Dữ liệu trả cho frontend sau khi backend tạo đơn thanh toán.
 *
 * claimSecret được trả một lần để frontend giữ tạm và dùng nhận token.
 * Không ghi claimSecret vào log hoặc đưa nó vào URL.
 */
public record CreatePaymentResponse(
        String txnRef,
        String paymentUrl,
        String claimSecret
) {
}