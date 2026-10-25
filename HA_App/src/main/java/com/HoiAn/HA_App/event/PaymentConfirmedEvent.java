package com.HoiAn.HA_App.event;


/**
 * Sự kiện nội bộ báo một payment vừa chuyển sang PAID.
 *
 * Chỉ mang mã giao dịch, không mang token hoặc claimSecret.
 */
public record PaymentConfirmedEvent(String txnRef) {
}
