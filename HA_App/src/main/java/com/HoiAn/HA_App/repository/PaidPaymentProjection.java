package com.HoiAn.HA_App.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Projection chỉ gồm 2 cột cần thiết để tính doanh thu theo ngày/giờ.
 */
public interface PaidPaymentProjection {

    LocalDateTime getPaidAt();

    BigDecimal getAmount();
}
