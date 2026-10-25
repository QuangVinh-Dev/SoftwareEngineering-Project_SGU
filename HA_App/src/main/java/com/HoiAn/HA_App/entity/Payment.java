package com.HoiAn.HA_App.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Liên kết bắt buộc tới guest_session.id.
    @Column(name = "session_id", nullable = false)
    private Integer sessionId;

    // Ví dụ: VNPAY.
    @Column(name = "provider", nullable = false, length = 30)
    private String provider = "VNPAY";

    // Mã giao dịch do hệ thống tạo và gửi sang VNPay.
    // Đây là vnp_TxnRef, không phải vnp_TransactionNo.
    @Column(name = "provider_txn_id",
            nullable = false, unique = true, length = 100)
    private String providerTxnId;

    // Mã giao dịch do VNPay cấp sau khi xử lý thanh toán.
    @Column(name = "provider_transaction_no", length = 32)
    private String providerTransactionNo;

    // Chỉ lưu SHA-256 của claimSecret, không lưu secret nguyên bản.
    @Column(name = "claim_secret_hash",
            nullable = false, unique = true, length = 64)
    private String claimSecretHash;

    @Column(name = "amount",
            nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "VND";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // ---------- Getter và Setter ----------

    public Integer getId() {
        return id;
    }

    public Integer getSessionId() {
        return sessionId;
    }

    public void setSessionId(Integer sessionId) {
        this.sessionId = sessionId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderTxnId() {
        return providerTxnId;
    }

    public void setProviderTxnId(String providerTxnId) {
        this.providerTxnId = providerTxnId;
    }

    public String getProviderTransactionNo() {
        return providerTransactionNo;
    }

    public void setProviderTransactionNo(String value) {
        this.providerTransactionNo = value;
    }

    public String getClaimSecretHash() {
        return claimSecretHash;
    }

    public void setClaimSecretHash(String value) {
        this.claimSecretHash = value;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }
}
