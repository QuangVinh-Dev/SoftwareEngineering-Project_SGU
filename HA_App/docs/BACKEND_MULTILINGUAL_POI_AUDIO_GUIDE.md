# Backend multilingual POI audio

Tài liệu này mô tả implementation hiện tại của luồng:

`GPS → POI → language → audio → play`

API được để public cho demo. Không có bước đăng nhập/token. Backend lưu quan hệ dùng schema sẵn có `poi → translation → audio`, với language và voice được kiểm tra qua khóa ngoại.

## 1. Phân tích schema và những lỗi trong guide cũ

`version_1.0.sql` đã có đủ `poi`, `translation`, `language`, `audio`, `voice`; không tạo bảng nối mới. `translation` có `UNIQUE(poi_id, language_code)`, status; `audio` tham chiếu translation và voice, lưu `file_path`, `duration_seconds`. Voice có language và active flag. Index `idx_audio_translation_id` và `idx_translation_poi_language_status` được giữ trong SQL và đã có trên database đang chạy.

Backend ban đầu chỉ có `GET /api/poi/locations`; response GPS là mảng `{id,name,latitude,longitude,radius}`. Audio API, audio CRUD, các entity/repository tương ứng và storage/static resource chưa tồn tại. `SecurityConfig` có Spring Security, nên mặc định các API cần được permitAll để demo chạy public.

Guide cũ có các vấn đề đã loại bỏ:

- Thừa nội dung đăng nhập, role protection và các bước kiểm tra account; không phù hợp scope demo.
- Trạng thái SQL ban đầu mô tả thiếu index nhưng không nói database volume đang dùng; chạy lại `version_1.0.sql` nguy hiểm vì đầu file `DROP TABLE ... CASCADE`.
- Chỉ hướng dẫn GET, chưa triển khai API CRUD và file storage; API chỉ trả path nhưng không có nơi phục vụ file.
- Một số đoạn code chỉ là method fragment và import/package projection không nhất quán.
- Dữ liệu mẫu tham chiếu `/uploads/audio/poi*.mp3`, nhưng storage không có các file đó. Đây là path metadata, chưa phải audio có thể phát.

## 2. API đã implement

| Method | URL | Input | Kết quả |
|---|---|---|---|
| GET | `/api/poi/locations` | — | POI active; response GPS giữ nguyên |
| GET | `/api/poi/{poiId}/audio?languageCode=en` | Path POI, language code | List audio đã duyệt, language/voice active và cùng ngôn ngữ |
| POST | `/api/poi/{poiId}/audio` | multipart: `languageCode`, `voiceId`, optional `durationSeconds`, `file` | 201 + id/path |
| PUT | `/api/poi/{poiId}/audio/{audioId}` | multipart cùng fields POST | 200 + id/path |
| DELETE | `/api/poi/{poiId}/audio/{audioId}` | Path POI/audio | 204; xóa file mới do backend quản lý |

Status: POI không tồn tại 404; language không tồn tại 404; language inactive 400; translation không gắn với POI+language 404; voice không tồn tại 404; voice inactive/sai language 400; audio thuộc POI khác 404; không có audio đã duyệt 200 với `[]`.

GET nối `audio → translation → language → voice` và lọc:

```sql
t.status = 'APPROVED'
l.is_active = TRUE
v.is_active = TRUE
v.language_code = t.language_code
```

Vì vậy không trả translation `PENDING` hoặc audio dùng voice khác ngôn ngữ. CRUD yêu cầu translation thuộc đúng POI/language, language active và voice active cùng language. Delete/update xác minh audio qua `audio → translation` trước khi thay đổi.

## 3. File đã thêm/sửa

### Thêm

- `src/main/java/com/HoiAn/HA_App/dto/response/PoiAudioResponse.java`
- `src/main/java/com/HoiAn/HA_App/dto/response/AudioMutationResponse.java`
- `src/main/java/com/HoiAn/HA_App/entity/Language.java`
- `src/main/java/com/HoiAn/HA_App/repository/LanguageRepository.java`
- `src/main/java/com/HoiAn/HA_App/repository/AudioRepository.java`
- `src/main/java/com/HoiAn/HA_App/service/AudioStorageService.java`
- `src/main/java/com/HoiAn/HA_App/config/AudioResourceConfig.java`

### Sửa

- `src/main/java/com/HoiAn/HA_App/config/SecurityConfig.java` — routes demo public, no role/token requirement.
- `src/main/java/com/HoiAn/HA_App/controller/PoiController.java` — GET audio + multipart POST/PUT + DELETE.
- `src/main/java/com/HoiAn/HA_App/service/PoiService.java` — validation, mapping and storage lifecycle.
- `src/main/java/com/HoiAn/HA_App/repository/PoiRepository.java` — retained active POI query.
- `src/main/resources/application.properties` — audio storage path and multipart limits.
- `docker-compose.yml` — audio path env and bind mount; PostgreSQL volume remains untouched.
- `version_1.0.sql` — retained two audio lookup indexes.

No dependency was added. Spring JDBC was already present and is used for audio table operations; JPA repositories remain for POI/language.

## 4. Upload contract and storage safety

Upload is `multipart/form-data`; the client sends audio bytes, not a filesystem path:

```text
languageCode=en
voiceId=3
durationSeconds=29
file=<audio bytes>
```

Accepted suffixes are `.mp3`, `.wav`, `.ogg`, `.m4a`; maximum is 50 MB. The client filename is used only to validate the suffix. Backend generates a UUID filename, writes it under the configured root, and stores only `/uploads/audio/<uuid>.<ext>` in `audio.file_path`. Normalized paths must remain inside storage root; arbitrary client paths are never accepted. PUT writes a new file before switching DB path and removes the old backend-owned file afterwards. DELETE checks POI ownership and avoids deleting a path still referenced by another audio row.

Configuration in `application.properties`:

```properties
app.audio.storage-path=${AUDIO_STORAGE_PATH:/home/qvinh/Workspace/SoftwareEngineering-Project_SGU/Test}
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=50MB
```

Static mapping is limited to `/uploads/audio/**` and points to that directory. Example:

```text
http://localhost:9999/uploads/audio/<generated-file>.mp3
```

Compose sets `AUDIO_STORAGE_PATH=/app/uploads/audio` and mounts:

```yaml
- /home/qvinh/Workspace/SoftwareEngineering-Project_SGU/Test:/app/uploads/audio
```

This is a bind mount for audio only. It does not mount or remove `postgres_data`.

## 5. Database and existing sample files

Do not run `docker compose down -v`; it would delete PostgreSQL data. Do not rerun `version_1.0.sql` against the existing database because its startup section drops tables. Existing schema already supports this feature; no table/data migration was needed. Indexes retained:

```sql
idx_audio_translation_id ON audio(translation_id)
idx_translation_poi_language_status ON translation(poi_id, language_code, status)
```

The mounted storage directory was empty before smoke tests. Database rows currently point to:

```text
/uploads/audio/poi1_vi.mp3
/uploads/audio/poi1_en.mp3
/uploads/audio/poi1_ja.mp3
/uploads/audio/poi2_vi.mp3
/uploads/audio/poi2_en.mp3
```

None of these five files exists in the configured directory. The GET API returns their current DB metadata, but HTTP GET for those file URLs returns 404 until real audio is uploaded. Do not replace them with fake content; upload recordings using the POST API and update/remove stale seeded rows if the real recordings use different audio IDs.

Inspect DB:

```bash
docker compose exec postgres psql -U hoian -d hoian_db
```

```sql
SELECT a.id, p.name, t.language_code, t.status, a.file_path, v.name, v.is_active
FROM audio a
JOIN translation t ON t.id=a.translation_id
JOIN poi p ON p.id=t.poi_id
JOIN voice v ON v.id=a.voice_id
ORDER BY a.id;
```

## 6. Build, run, and API checks

Build:

```bash
./mvnw clean package -DskipTests
```

Run/rebuild app:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app
```

No authorization header is needed:

```bash
curl -i http://localhost:9999/api/poi/locations
curl -i 'http://localhost:9999/api/poi/1/audio?languageCode=en'
curl -i 'http://localhost:9999/api/poi/1/audio?languageCode=vi'
curl -i 'http://localhost:9999/api/poi/1/audio?languageCode=ja'
curl -i 'http://localhost:9999/api/poi/3/audio?languageCode=en'
```

Expected: locations 200 with old JSON shape; POI 1 languages return their approved rows; POI 3/en returns `[]` because translation is `PENDING`.

Audio file check after upload:

```bash
curl -I http://localhost:9999/uploads/audio/<generated-filename>.mp3
```

Expected 200 and audio content type. A database path without a file returns 404.

## 7. CRUD examples

Create a local test file first (replace with real audio for actual playback), then upload:

```bash
curl -i -F languageCode=en -F voiceId=3 -F durationSeconds=29 \
  -F file=@narration.mp3 \
  http://localhost:9999/api/poi/1/audio
```

Expected 201:

```json
{"id":6,"filePath":"/uploads/audio/<uuid>.mp3"}
```

Replace audio file/metadata:

```bash
curl -i -X PUT \
  -F languageCode=en -F voiceId=3 -F durationSeconds=30 \
  -F file=@narration-updated.mp3 \
  http://localhost:9999/api/poi/1/audio/6
```

Expected 200. Delete only when the audio belongs to that POI:

```bash
curl -i -X DELETE http://localhost:9999/api/poi/1/audio/6
```

Expected 204. Attempting `/api/poi/2/audio/6` for audio 6 owned by POI 1 returns 404 and leaves it intact.

## 8. Verification performed

- `./mvnw clean package -DskipTests`: **PASS**.
- `docker compose up -d --build`: **PASS**; app, PostgreSQL and Redis are up; PostgreSQL volume was preserved.
- `GET /api/poi/locations`: **200**, original GPS response shape.
- GET POI 1/en, vi, ja: **200**, language-specific audio metadata.
- GET POI 3/en: **200 `[]`**.
- Multipart POST: **201**, UUID path created.
- `HEAD /uploads/audio/<created>.mp3`: **200**, `audio/mpeg`.
- Multipart PUT: **200**; replaced file URL served.
- Cross-POI DELETE: **404**.
- Correct DELETE: **204**; subsequent file HEAD **404**.
- Missing language and missing POI: **404**.
- The five old seeded audio files are absent, so their original URLs currently return **404**. Real recordings remain necessary for the sample POIs to play.

## 9. Known constraints

- Demo APIs are public and CRUD has no authentication/authorization, by explicit project scope.
- Upload validates extension and size, but does not decode/inspect audio contents. Only trusted demo clients should upload.
- Seeded database audio rows point to missing local assets. Upload real recordings before expecting playback from those rows.
- Compiler cảnh báo `MultipartFile.getOriginalFilename()` đã deprecated trong Spring hiện tại; implementation chỉ đọc suffix của tên client để kiểm tra định dạng, không dùng tên đó làm path.
