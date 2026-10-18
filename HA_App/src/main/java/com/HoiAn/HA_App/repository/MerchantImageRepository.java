package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.MerchantImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MerchantImageRepository extends JpaRepository<MerchantImage, Integer> {

    List<MerchantImage> findByMerchantIdOrderByOrderNumAsc(Integer merchantId);
}
