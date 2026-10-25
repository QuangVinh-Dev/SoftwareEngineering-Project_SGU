package com.HoiAn.HA_App.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.HoiAn.HA_App.entity.Payment;

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
}
