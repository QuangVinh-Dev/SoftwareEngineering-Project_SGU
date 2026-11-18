package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.request.ListeningStartRequest;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.repository.AudioRepository;
import com.HoiAn.HA_App.repository.ListeningLogRepository;
import com.HoiAn.HA_App.repository.PaymentRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/poi/{poiId}/listening")
public class PoiListeningController {
    private final PaymentRepository paymentRepository;
    private final AudioRepository audioRepository;
    private final ListeningLogRepository listeningLogRepository;

    public PoiListeningController(PaymentRepository paymentRepository,
                                  AudioRepository audioRepository,
                                  ListeningLogRepository listeningLogRepository) {
        this.paymentRepository = paymentRepository;
        this.audioRepository = audioRepository;
        this.listeningLogRepository = listeningLogRepository;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void recordListeningStart(@PathVariable int poiId,
                                     @AuthenticationPrincipal String transactionRef,
                                     @Valid @RequestBody ListeningStartRequest request) {
        var payment = paymentRepository.findByProviderTxnId(transactionRef)
                .filter(value -> value.getStatus() == PaymentStatus.PAID)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Quyền sử dụng dịch vụ không hợp lệ"));

        if (!audioRepository.isApprovedAudioForPoi(poiId, request.audioId(), request.languageCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy audio đã duyệt cho POI này");
        }

        listeningLogRepository.recordStart(payment.getSessionId(), poiId, request.audioId(),
                request.languageCode(), request.triggerMethod());
    }
}
