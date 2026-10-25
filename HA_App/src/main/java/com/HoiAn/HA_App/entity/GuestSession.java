package com.HoiAn.HA_App.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "guest_session")
public class GuestSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "anonymous_device_id", nullable = false, unique = true, length = 100)
    private String anonymousDeviceId;

    @Column(name = "language_code", length = 10)
    private String languageCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "device", length = 30)
    private String device;

    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    protected GuestSession() {}

    public Integer getId() { return id; }
    public String getAnonymousDeviceId() { return anonymousDeviceId; }
    public void setAnonymousDeviceId(String anonymousDeviceId) { this.anonymousDeviceId = anonymousDeviceId; }
    public String getLanguageCode() { return languageCode; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }
    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }
}
