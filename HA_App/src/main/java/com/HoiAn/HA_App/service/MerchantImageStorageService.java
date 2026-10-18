package com.HoiAn.HA_App.service;

import com.HoiAn.HA_App.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lưu ảnh gian hàng (data URI base64 từ FE) xuống thư mục lưu trữ chung.
 * File nằm trong {storage}/merchant-images và được phục vụ qua /uploads/audio/merchant-images/...
 */
@Service
public class MerchantImageStorageService {

    private static final Pattern DATA_URI = Pattern.compile("^data:(image/[a-z+.-]+);base64,(.+)$", Pattern.DOTALL);
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/png", "png",
            "image/jpeg", "jpg",
            "image/webp", "webp",
            "image/gif", "gif");
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final String SUB_DIR = "merchant-images";

    private final Path directory;
    private final String publicUrlPrefix;

    public MerchantImageStorageService(
            @Value("${app.audio.storage-path:${AUDIO_STORAGE_PATH:/tmp/ha-audio}}") String storagePath,
            @Value("${audio.public-url-prefix:/uploads/audio}") String publicUrlPrefix) {
        this.directory = Path.of(storagePath).toAbsolutePath().normalize().resolve(SUB_DIR);
        this.publicUrlPrefix = publicUrlPrefix.replaceAll("/+$", "");
    }

    /** @return đường dẫn công khai của ảnh vừa lưu, ví dụ /uploads/audio/merchant-images/xxx.png */
    public String save(String dataUri) {
        Matcher m = DATA_URI.matcher(dataUri == null ? "" : dataUri.trim());
        if (!m.matches() || !EXTENSIONS.containsKey(m.group(1))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh gian hàng phải là PNG, JPG, WEBP hoặc GIF");
        }

        byte[] bytes;
        try {
            bytes = Base64.getMimeDecoder().decode(m.group(2));
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ảnh gian hàng không hợp lệ");
        }
        if (bytes.length == 0 || bytes.length > MAX_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mỗi ảnh gian hàng tối đa 5MB");
        }

        String filename = UUID.randomUUID() + "." + EXTENSIONS.get(m.group(1));
        try {
            Files.createDirectories(directory);
            Files.write(directory.resolve(filename), bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Không lưu được ảnh gian hàng", e);
        }
        return publicUrlPrefix + "/" + SUB_DIR + "/" + filename;
    }
}
