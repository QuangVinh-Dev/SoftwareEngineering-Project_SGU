package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.dto.response.MerchantResponse;
import com.HoiAn.HA_App.entity.Merchant;
import com.HoiAn.HA_App.entity.MerchantImage;
import com.HoiAn.HA_App.exception.ApiException;
import com.HoiAn.HA_App.repository.MerchantImageRepository;
import com.HoiAn.HA_App.repository.MerchantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Admin duyệt / từ chối đăng ký gian hàng.
 */
@Service
public class MerchantAdminService {

    private static final Set<String> STATUSES = Set.of("PENDING", "APPROVED", "REJECTED");

    private final MerchantRepository merchantRepository;
    private final MerchantImageRepository merchantImageRepository;

    public MerchantAdminService(MerchantRepository merchantRepository,
                                MerchantImageRepository merchantImageRepository) {
        this.merchantRepository = merchantRepository;
        this.merchantImageRepository = merchantImageRepository;
    }

    @Transactional(readOnly = true)
    public List<MerchantResponse> list(String status) {
        List<Merchant> merchants;

        if (status == null || status.isBlank()) {
            merchants = merchantRepository.findAllByOrderByRegisteredAtDesc();
        } else {
            String normalized = status.trim().toUpperCase();
            if (!STATUSES.contains(normalized)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "status phải là PENDING, APPROVED hoặc REJECTED");
            }
            merchants = merchantRepository.findByApprovalStatusOrderByRegisteredAtDesc(normalized);
        }

        return merchants.stream().map(this::toResponse).toList();
    }

    @Transactional
    public MerchantResponse approve(Integer id) {
        Merchant merchant = find(id);
        merchant.setApprovalStatus("APPROVED");
        merchant.setApprovedAt(LocalDateTime.now());
        merchant.setRejectReason(null);
        return toResponse(merchantRepository.save(merchant));
    }

    @Transactional
    public MerchantResponse reject(Integer id, String reason) {
        Merchant merchant = find(id);
        merchant.setApprovalStatus("REJECTED");
        merchant.setApprovedAt(null);
        merchant.setRejectReason(reason == null || reason.isBlank() ? null : reason.trim());
        return toResponse(merchantRepository.save(merchant));
    }

    private Merchant find(Integer id) {
        return merchantRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy gian hàng"));
    }

    private MerchantResponse toResponse(Merchant m) {
        return new MerchantResponse(
                m.getId(),
                m.getAccount().getId(),
                m.getAccount().getUsername(),
                m.getAccount().getEmail(),
                m.getName(),
                m.getPhoneNumber(),
                m.getAddress(),
                m.getCategory(),
                m.getDescription(),
                m.getPlanId(),
                m.getBillingCycle(),
                merchantImageRepository.findByMerchantIdOrderByOrderNumAsc(m.getId())
                        .stream().map(MerchantImage::getFilePath).toList(),
                m.getApprovalStatus(),
                m.getRejectReason(),
                m.getRegisteredAt(),
                m.getApprovedAt()
        );
    }
}
