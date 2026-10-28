package com.HoiAn.HA_App.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.HoiAn.HA_App.entity.Payment;
import com.HoiAn.HA_App.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // Tìm đơn theo mã tham chiếu gửi sang VNPay.
    Optional<Payment> findByProviderTxnId(String providerTxnId);

    // Tìm đơn theo hash của claimSecret.
    Optional<Payment> findByClaimSecretHash(String claimSecretHash);

    // Khóa dòng payment trong transaction để tránh xử lý đồng thời.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p
        FROM Payment p
        WHERE p.providerTxnId = :txnRef
    """)
    Optional<Payment> findByProviderTxnIdForUpdate(
            @Param("txnRef") String txnRef
    );

    // ---------- Tổng hợp doanh thu cho Dashboard quản trị ----------

    /** Tổng tiền của mọi giao dịch ở một trạng thái (PAID = doanh thu thật). */
    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.status = :status
    """)
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

    /** Tổng tiền trong khoảng [from, to). */
    @Query("""
        SELECT COALESCE(SUM(p.amount), 0)
        FROM Payment p
        WHERE p.status = :status
          AND p.paidAt >= :from
          AND p.paidAt < :to
    """)
    BigDecimal sumAmountByStatusBetween(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    long countByStatus(PaymentStatus status);

    long countByStatusAndPaidAtGreaterThanEqualAndPaidAtLessThan(
            PaymentStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    /** Chi tiết các giao dịch đã trả tiền kể từ mốc thời gian (để gộp theo ngày/giờ). */
    @Query("""
        SELECT p.paidAt AS paidAt, p.amount AS amount
        FROM Payment p
        WHERE p.status = :status
          AND p.paidAt >= :from
        ORDER BY p.paidAt ASC
    """)
    List<PaidPaymentProjection> findPaidSince(
            @Param("status") PaymentStatus status,
            @Param("from") LocalDateTime from
    );
}
