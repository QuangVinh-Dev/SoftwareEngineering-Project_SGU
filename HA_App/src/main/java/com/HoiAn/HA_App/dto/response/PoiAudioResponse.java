package com.HoiAn.HA_App.dto.response;

public record PoiAudioResponse(
        Integer id,
        String languageCode,
        String languageName,
        String filePath,
        Integer durationSeconds,
        String voiceName
) {}
