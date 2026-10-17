package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PoiImageStorageService {
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private final Path storagePath;

    public PoiImageStorageService(@Value("${app.poi-image.storage-path:./Data_Storage/poi-images}") String storagePath) {
        this.storagePath = Path.of(storagePath).toAbsolutePath().normalize();
    }

    public List<StoredImage> storeAll(List<MultipartFile> files) {
        List<StoredImage> stored = new ArrayList<>();
        try {
            Files.createDirectories(storagePath);
            for (MultipartFile file : files) {
                String extension = validate(file);
                String fileName = UUID.randomUUID() + extension;
                Path target = storagePath.resolve(fileName).normalize();
                if (!target.startsWith(storagePath)) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Tên tệp hình ảnh không hợp lệ");
                }
                file.transferTo(target);
                stored.add(new StoredImage(target, "/uploads/poi-images/" + fileName));
            }
            return stored;
        } catch (IOException e) {
            deleteAll(stored);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu hình ảnh POI");
        } catch (RuntimeException e) {
            deleteAll(stored);
            throw e;
        }
    }

    public void deleteAll(List<StoredImage> images) {
        for (StoredImage image : images) {
            try {
                Files.deleteIfExists(image.path());
            } catch (IOException ignored) {
                // A failed cleanup must not hide the original upload or database error.
            }
        }
    }

    private String validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Tệp hình ảnh không được để trống");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mỗi hình ảnh tối đa 10 MB");
        }

        String extension = switch (String.valueOf(file.getContentType()).toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/bmp" -> ".bmp";
            default -> throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận ảnh JPG, PNG, GIF hoặc BMP");
        };
        try (var input = file.getInputStream()) {
            if (ImageIO.read(input) == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Tệp tải lên không phải hình ảnh hợp lệ");
            }
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Không thể đọc tệp hình ảnh");
        }
        return extension;
    }

    public record StoredImage(Path path, String publicUrl) {}
}
