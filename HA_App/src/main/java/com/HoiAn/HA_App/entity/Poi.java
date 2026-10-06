package com.HoiAn.HA_App.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "poi")
public class Poi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "merchant_id")
    private Integer merchantId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(nullable = false)
    private Integer radius;

    @Column(name = "priority_level", nullable = false)
    private Integer priorityLevel;

    @Column(name = "original_description")
    private String originalDescription;

    @Column(name = "direction_link")
    private String directionLink;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Integer getId() {
        return id;
    }

    public Integer getMerchantId() {
        return merchantId;
    }

    public String getName() {
        return name;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public Integer getRadius() {
        return radius;
    }

    public Integer getPriorityLevel() {
        return priorityLevel;
    }

    public String getOriginalDescription() {
        return originalDescription;
    }

    public String getDirectionLink() {
        return directionLink;
    }

    public String getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}