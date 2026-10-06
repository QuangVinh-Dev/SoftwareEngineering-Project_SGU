package com.HoiAn.HA_App.repository;

import com.HoiAn.HA_App.entity.Poi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoiRepository extends JpaRepository<Poi, Integer> {

    List<Poi> findByStatus(String status);
}