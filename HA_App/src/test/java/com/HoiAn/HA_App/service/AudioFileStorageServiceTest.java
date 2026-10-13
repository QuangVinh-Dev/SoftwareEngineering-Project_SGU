package com.HoiAn.HA_App.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class AudioFileStorageServiceTest {
    @TempDir Path temp;
    @Test void storesMp3WithPublicUrlAndComputesFrameDuration() throws Exception {
        var storage=new AudioFileStorageService(temp.toString(),"/uploads/audio");
        byte[] frame=new byte[417]; frame[0]=(byte)0xff;frame[1]=(byte)0xfb;frame[2]=(byte)0x90;frame[3]=(byte)0x64;
        byte[] mp3=new byte[frame.length*40];
        for(int i=0;i<40;i++) System.arraycopy(frame,0,mp3,i*frame.length,frame.length);
        var saved=storage.saveMp3(mp3,"en");
        assertTrue(Files.isRegularFile(Path.of(saved.absolutePath())));
        assertTrue(storage.isValidMp3(saved.publicUrl()));
        assertEquals(1,storage.durationSeconds(mp3));
        storage.delete(saved);
        assertFalse(Files.exists(Path.of(saved.absolutePath())));
    }
}
