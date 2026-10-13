# API quản trị nội dung đa ngôn ngữ và audio

Các endpoint bên dưới cần JWT có role `POI_ADMIN`. `ADMIN` và `SUPER_ADMIN` cũng được cấp authority này vì các role hiện có trong `role_permission` đều mang `POI_EDIT`; role `MERCHANT` không được cấp quyền module POI. Header:

```http
Authorization: Bearer <token>
```

`preview.sourceText` được hiểu là tiếng Việt vì payload hiện không có trường source language. Preview chỉ gọi LibreTranslate và không ghi DB. `zh` được đổi thành mã `zh-Hans` khi gọi LibreTranslate; API vẫn nhận/trả `zh`.

## Preview bản dịch

```http
POST /api/admin/pois/1/translations/preview
Content-Type: application/json

{"sourceText":"Chùa Cầu là một biểu tượng của Hội An.","targetLanguages":["en","ja","ko","zh"]}
```

Kết quả có `translations[code].success`, `translatedText` hoặc `error` theo từng ngôn ngữ.

## Lưu và duyệt bản dịch

```http
PUT /api/admin/pois/1/translations/en
Content-Type: application/json

{"translatedText":"The Japanese Covered Bridge is a symbol of Hoi An."}
```

Lưu mới/cập nhật dùng `ON CONFLICT (poi_id, language_code)` và đặt status `PENDING`. Sau khi rà soát:

```http
POST /api/admin/pois/1/translations/en/approve
```

Khi nội dung tiếng Việt đổi, các bản dịch đích chuyển về `PENDING` và audio gắn với nội dung cũ bị gỡ khỏi metadata/storage. Khi sửa mô tả gốc qua API POI, backend đồng bộ bản tiếng Việt và áp dụng cùng quy tắc.

## POI

```http
GET /api/admin/pois
GET /api/admin/pois/1
POST /api/admin/pois
PUT /api/admin/pois/1
```

`POST`/`PUT` nhận các trường schema hiện có: `name`, `latitude`, `longitude`, `radius`, `priorityLevel`, `originalDescription`, `directionLink`, `status`. Không có mã POI riêng trong bảng hiện tại.

## Tạo audio và xem trạng thái

```http
POST /api/admin/pois/1/audio/generate
Content-Type: application/json

{"languageCodes":["vi","en","ja","ko","zh"]}
```

Mỗi phần tử trả `success`, `audioId`, `audioUrl`, `durationSeconds`, `message`. Bản dịch chưa duyệt, voice inactive/thiếu, lỗi model hoặc lỗi Piper chỉ làm thất bại ngôn ngữ tương ứng. Audio TTS hiện hữu được bỏ qua nếu file MP3 hợp lệ, voice phù hợp và audio được tạo sau lần cập nhật bản dịch; nếu không thì thay metadata/file TTS hiện tại. Audio do người dùng upload không bị thay thế.

```http
GET /api/admin/pois/1/content
```

Trả thông tin POI và trạng thái translation/audio cho từng language. URL audio là URL public `/uploads/audio/...`; không trả đường dẫn filesystem.

## Vận hành

Compose mount `./Data_Storage` tại `/app/uploads/audio`, giữ port API `9999:8080`, PostgreSQL và Redis volumes. Piper models nằm dưới `tts-service/models`; Japanese cần `pyopenjtalk-plus` để Piper phân âm tiếng Nhật. Java HTTP client dùng HTTP/1.1 với Piper vì Uvicorn không nhận HTTP/2 upgrade, vốn làm mất JSON body và trả 422. LibreTranslate đang chạy với `vi`, `en`, `ja`, `ko`, `zh-Hans`; khả năng dịch từng cặp cần được xác minh trên model đã cài.

Model files và `.onnx.json` đang có trong working tree nhưng model ONNX được Git/Docker context loại trừ và cần provision riêng. Kiểm tra metadata upstream trước khi phân phối/deploy: repo `piper-voices` gắn MIT, nhưng model cards nêu điều kiện dataset riêng. [`vais1000`](https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD) ghi CC BY 4.0; [`kss`](https://huggingface.co/rhasspy/piper-voices/blob/main/ko/ko_KR/kss/medium/MODEL_CARD) ghi CC BY-NC-SA 4.0; [`huayan`](https://huggingface.co/rhasspy/piper-voices/blob/main/zh/zh_CN/huayan/medium/MODEL_CARD) ghi unknown; [`lessac`](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD) tham chiếu Blizzard Challenge license. Japanese hi_fi_captain dùng dữ liệu Hi-Fi Captain; cần xác minh license nguồn trước khi dùng thương mại. Cần rà soát điều kiện dataset trước khi dùng thương mại; model tải/chạy được không xác nhận quyền sử dụng.
