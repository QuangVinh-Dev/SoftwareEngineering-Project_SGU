package com.HoiAn.HA_App.dto.response;


/**
 * Định dạng phản hồi cho endpoint IPN của VNPay.
 */
public record VnPayIpnResponse(
        String RspCode,
        String Message
) {
}
