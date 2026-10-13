package com.HoiAn.HA_App.service;



import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AudioFileStorageService {

    private final Path storageDirectory;
    private final String publicUrlPrefix;

    public AudioFileStorageService(
            @Value("${app.audio.storage-path:${AUDIO_STORAGE_PATH:/tmp/ha-audio}}") String storagePath,
            @Value("${audio.public-url-prefix:/uploads/audio}") String publicUrlPrefix) {

        this.storageDirectory = Path.of(storagePath)
                .toAbsolutePath()
                .normalize();

        this.publicUrlPrefix =
                publicUrlPrefix.replaceAll("/+$", "");
    }

    public StoredAudio saveMp3(byte[] content, String languageCode) {
        if (content == null || content.length == 0) {
            throw new IllegalArgumentException("Audio rỗng");
        }

        String safeLanguage = languageCode.toLowerCase()
                .replaceAll("[^a-z0-9_-]", "");

        if (safeLanguage.isBlank()) {
            throw new IllegalArgumentException(
                    "Mã ngôn ngữ không hợp lệ");
        }

        String filename = safeLanguage + "-"
                + UUID.randomUUID() + ".mp3";

        try {
            Files.createDirectories(storageDirectory);

            Path destination = storageDirectory.resolve(filename)
                    .normalize();

            if (!destination.startsWith(storageDirectory)) {
                throw new IllegalArgumentException(
                        "Đường dẫn file không hợp lệ");
            }

            Files.write(
                    destination,
                    content,
                    StandardOpenOption.CREATE_NEW,
                    StandardOpenOption.WRITE
            );

            return new StoredAudio(
                    destination.toString(),
                    publicUrlPrefix + "/" + filename,
                    filename
            );

        } catch (IOException ex) {
            throw new IllegalStateException(
                    "Không lưu được file audio", ex);
        }
    }

    public record StoredAudio(
            String absolutePath,
            String publicUrl,
            String filename
    ) {}

    public boolean isValidMp3(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith(publicUrlPrefix + "/")) return false;
        Path path = storageDirectory.resolve(publicUrl.substring((publicUrlPrefix + "/").length())).normalize();
        try {
            if (!path.startsWith(storageDirectory) || !Files.isRegularFile(path) || Files.size(path) <= 128) return false;
            durationSeconds(Files.readAllBytes(path));
            return true;
        } catch (IOException | IllegalArgumentException ex) { return false; }
    }

    public void delete(StoredAudio stored) {
        try { Files.deleteIfExists(Path.of(stored.absolutePath())); }
        catch (IOException ignored) { }
    }
    public void deletePublicUrl(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith(publicUrlPrefix + "/")) return;
        String name=publicUrl.substring((publicUrlPrefix + "/").length());
        if(name.isBlank()||name.contains("/")||name.contains("\\")) return;
        try { Files.deleteIfExists(storageDirectory.resolve(name).normalize()); }
        catch(IOException ignored) { }
    }

    /** Calculates duration by counting MPEG audio frame samples, not file size assumptions. */
    public int durationSeconds(byte[] bytes) {
        int offset = 0, frames = 0;
        if (bytes.length > 10 && bytes[0]=='I' && bytes[1]=='D' && bytes[2]=='3') {
            offset = 10 + ((bytes[6]&0x7f)<<21) + ((bytes[7]&0x7f)<<14) + ((bytes[8]&0x7f)<<7) + (bytes[9]&0x7f);
        }
        double seconds = 0;
        while (offset + 4 <= bytes.length) {
            int h = ((bytes[offset]&255)<<24)|((bytes[offset+1]&255)<<16)|((bytes[offset+2]&255)<<8)|(bytes[offset+3]&255);
            if ((h & 0xffe00000) != 0xffe00000) { offset++; continue; }
            int version=(h>>>19)&3, layer=(h>>>17)&3, rateIndex=(h>>>10)&3, bitrateIndex=(h>>>12)&15;
            if (version==1 || layer==0 || rateIndex==3 || bitrateIndex==0 || bitrateIndex==15) { offset++; continue; }
            int[] rates={44100,48000,32000}; int rate=rates[rateIndex];
            if (version==2) rate/=2; else if(version==0) rate/=4;
            int[] mpeg1L3={0,32,40,48,56,64,80,96,112,128,160,192,224,256,320};
            int[] mpeg2L3={0,8,16,24,32,40,48,56,64,80,96,112,128,144,160};
            int bitrate=(version==3?mpeg1L3[bitrateIndex]:mpeg2L3[bitrateIndex])*1000;
            int samples=(version==3?1152:576);
            int frameLength=(version==3?144:72)*bitrate/rate+((h>>>9)&1);
            if(frameLength<4 || offset+frameLength>bytes.length) { offset++; continue; }
            seconds+=(double)samples/rate; frames++; offset+=frameLength;
        }
        if(frames==0 || seconds<=0) throw new IllegalArgumentException("Piper output is not a valid MPEG audio stream");
        return Math.max(1,(int)Math.round(seconds));
    }
}
