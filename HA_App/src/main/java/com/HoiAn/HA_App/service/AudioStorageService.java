package com.HoiAn.HA_App.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class AudioStorageService {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("mp3", "wav", "ogg", "m4a");
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024;
    private final Path storageRoot;

    public AudioStorageService(
            @Value("${app.audio.storage-path:/home/qvinh/Workspace/SoftwareEngineering-Project_SGU/Test}") String storagePath) {
        try {
            Path configuredRoot = Path.of(storagePath).toAbsolutePath().normalize();
            Files.createDirectories(configuredRoot);
            this.storageRoot = configuredRoot.toRealPath();
        } catch (IOException | RuntimeException e) {
            throw new IllegalStateException("Cannot initialize audio storage", e);
        }
    }

    public StoredAudio store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUDIO_FILE_REQUIRED");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "AUDIO_FILE_TOO_LARGE");
        }
        String originalName = file.getOriginalFilename();
        String extension = extensionOf(originalName);
        String filename = UUID.randomUUID() + "." + extension;
        Path target = storageRoot.resolve(filename).normalize();
        if (!target.startsWith(storageRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "INVALID_AUDIO_PATH");
        }
        try {
            Files.copy(file.getInputStream(), target);
            return new StoredAudio(filename, "/uploads/audio/" + filename);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AUDIO_STORAGE_FAILED", e);
        }
    }

    public void delete(String filePath) {
        if (filePath == null || !filePath.startsWith("/uploads/audio/")) {
            return;
        }
        String filename = filePath.substring("/uploads/audio/".length());
        if (filename.isBlank() || filename.contains("/") || filename.contains("\\")) {
            return;
        }
        Path target = storageRoot.resolve(filename).normalize();
        if (!target.startsWith(storageRoot)) {
            return;
        }
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "AUDIO_DELETE_FAILED", e);
        }
    }

    private String extensionOf(String originalName) {
        if (originalName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUDIO_EXTENSION_REQUIRED");
        }
        int dot = originalName.lastIndexOf('.');
        if (dot < 0 || dot == originalName.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "AUDIO_EXTENSION_REQUIRED");
        }
        String extension = originalName.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "UNSUPPORTED_AUDIO_FORMAT");
        }
        return extension;
    }

    public record StoredAudio(String filename, String filePath) {
    }
}
