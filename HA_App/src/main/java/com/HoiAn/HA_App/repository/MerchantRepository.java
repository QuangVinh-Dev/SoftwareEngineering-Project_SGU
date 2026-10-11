package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.Merchant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MerchantRepository extends JpaRepository<Merchant, Integer> {

    Optional<Merchant> findByAccountId(Integer accountId);

    List<Merchant> findAllByOrderByRegisteredAtDesc();

    List<Merchant> findByApprovalStatusOrderByRegisteredAtDesc(String approvalStatus);
}
