package com.HoiAn.HA_App.controller;

import com.HoiAn.HA_App.dto.request.ListeningStartRequest;
import com.HoiAn.HA_App.entity.Payment;
import com.HoiAn.HA_App.entity.PaymentStatus;
import com.HoiAn.HA_App.repository.AudioRepository;
import com.HoiAn.HA_App.repository.ListeningLogRepository;
import com.HoiAn.HA_App.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class PoiListeningControllerTest {
    private PaymentRepository payments;
    private AudioRepository audios;
    private ListeningLogRepository logs;
    private PoiListeningController controller;

    @BeforeEach
    void setUp() {
        payments = mock(PaymentRepository.class);
        audios = mock(AudioRepository.class);
        logs = mock(ListeningLogRepository.class);
        controller = new PoiListeningController(payments, audios, logs);
    }

    @Test
    void recordsOnlyAnApprovedAudioForThePaidServiceSession() {
        Payment payment = payment(41, PaymentStatus.PAID);
        when(payments.findByProviderTxnId("txn-1")).thenReturn(Optional.of(payment));
        when(audios.isApprovedAudioForPoi(23, 8, "vi")).thenReturn(true);

        controller.recordListeningStart(23, "txn-1", new ListeningStartRequest(8, "vi", "TAP"));

        verify(logs).recordStart(41, 23, 8, "vi", "TAP");
    }

    @Test
    void rejectsMissingOrUnpaidServiceTransactions() {
        when(payments.findByProviderTxnId("txn-pending"))
                .thenReturn(Optional.of(payment(41, PaymentStatus.PENDING)));

        assertThatThrownBy(() -> controller.recordListeningStart(23, "unknown",
                new ListeningStartRequest(8, "vi", "TAP")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
        assertThatThrownBy(() -> controller.recordListeningStart(23, "txn-pending",
                new ListeningStartRequest(8, "vi", "TAP")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);

        verifyNoInteractions(audios, logs);
    }

    @Test
    void rejectsAudioThatDoesNotBelongToThePoiAndLanguage() {
        when(payments.findByProviderTxnId("txn-1"))
                .thenReturn(Optional.of(payment(41, PaymentStatus.PAID)));
        when(audios.isApprovedAudioForPoi(23, 8, "vi")).thenReturn(false);

        assertThatThrownBy(() -> controller.recordListeningStart(23, "txn-1",
                new ListeningStartRequest(8, "vi", "AUTO_GPS")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);

        verifyNoInteractions(logs);
    }

    private static Payment payment(int sessionId, PaymentStatus status) {
        Payment payment = new Payment();
        payment.setSessionId(sessionId);
        payment.setStatus(status);
        return payment;
    }
}
