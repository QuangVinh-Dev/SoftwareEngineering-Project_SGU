package com.HoiAn.HA_App.repository;


import com.HoiAn.HA_App.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LanguageRepository extends JpaRepository<Language, String> {
    Optional<Language> findByCode(String code);
}
