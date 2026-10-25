package com.HoiAn.HA_App.repository;


import org.springframework.data.jpa.repository.JpaRepository;

import com.HoiAn.HA_App.entity.AppConfig;

public interface AppConfigRepository
        extends JpaRepository<AppConfig, String> {
}
