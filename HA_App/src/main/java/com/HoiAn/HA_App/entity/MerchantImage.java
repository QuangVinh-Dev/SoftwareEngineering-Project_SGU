package com.HoiAn.HA_App.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "merchant_image")
public class MerchantImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "merchant_id", nullable = false)
    private Integer merchantId;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "order_num", nullable = false)
    private Integer orderNum;

    public Integer getId() { return id; }
    public Integer getMerchantId() { return merchantId; }
    public void setMerchantId(Integer merchantId) { this.merchantId = merchantId; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public Integer getOrderNum() { return orderNum; }
    public void setOrderNum(Integer orderNum) { this.orderNum = orderNum; }
}
