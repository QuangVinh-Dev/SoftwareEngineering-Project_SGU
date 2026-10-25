package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.entity.GuestSession;
import com.HoiAn.HA_App.repository.GuestSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuestSessionService {
    private final GuestSessionRepository repository;

    public GuestSessionService(GuestSessionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public GuestSession registerOrUpdate(String anonymousDeviceId, String languageCode, String device) {
        repository.upsert(anonymousDeviceId, languageCode, device);
        return repository.findByAnonymousDeviceId(anonymousDeviceId)
                .orElseThrow(() -> new IllegalStateException("Không thể lưu phiên khách"));
    }
}
