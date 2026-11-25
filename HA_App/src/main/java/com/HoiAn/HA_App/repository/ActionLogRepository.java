package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.ActionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActionLogRepository extends JpaRepository<ActionLog, Integer> {
    List<ActionLog> findAllByOrderByPerformedAtDesc();
}
