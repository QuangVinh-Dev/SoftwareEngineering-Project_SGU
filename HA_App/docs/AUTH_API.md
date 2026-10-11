# Auth API (JWT)

Tất cả body là JSON. Token gửi qua header `Authorization: Bearer <accessToken>`.
Lỗi trả về dạng `{ "message": "...", "errors": { "field": "..." } }`.

| Method | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | công khai | Đăng nhập admin hoặc chủ gian hàng |
| POST | `/api/auth/register/merchant` | công khai | Chủ gian hàng đăng ký (PENDING, chờ duyệt) |
| POST | `/api/auth/register/admin` | SUPER_ADMIN | Tạo tài khoản admin |
| GET | `/api/auth/me` | đã đăng nhập | Thông tin tài khoản hiện tại |
| GET | `/api/admin/merchants?status=PENDING` | ADMIN | Danh sách gian hàng (lọc theo trạng thái) |
| PATCH | `/api/admin/merchants/{id}/approve` | ADMIN | Duyệt gian hàng |
| PATCH | `/api/admin/merchants/{id}/reject` | ADMIN | Từ chối gian hàng |
| GET | `/api/poi/**` | công khai | API POI hiện có |

Mã trạng thái: 400 dữ liệu sai, 401 sai mật khẩu / chưa đăng nhập / token hết hạn,
403 không đủ quyền / tài khoản bị khóa / gian hàng chưa được duyệt, 409 trùng username hoặc email.

## Ví dụ

```bash
# Đăng ký chủ gian hàng
curl -X POST localhost:9999/api/auth/register/merchant -H 'Content-Type: application/json' -d '{
  "username":"comga_bay","password":"Matkhau123","fullName":"Nguyen Van A",
  "email":"a@example.com","merchantName":"Com Ga Ba Bay","phoneNumber":"0905123456","address":"1 Le Loi, Hoi An"}'

# Đăng nhập admin (mật khẩu seed mặc định khi dev: Admin@123, đổi bằng APP_ADMIN_PASSWORD)
curl -X POST localhost:9999/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin@123"}'
# -> { "accessToken":"...", "tokenType":"Bearer", "expiresIn":3600,
#      "user":{ "id":1, "username":"admin", "role":"SUPER_ADMIN", "accountType":"ADMIN", ... } }

# Duyệt gian hàng
curl -X PATCH localhost:9999/api/admin/merchants/3/approve -H "Authorization: Bearer $TOKEN"
```

## Cấu hình (biến môi trường)

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `JWT_SECRET` | giá trị dev | >= 32 ký tự, **bắt buộc đổi khi triển khai thật** |
| `JWT_EXPIRATION_MINUTES` | 60 | thời hạn access token |
| `APP_ADMIN_PASSWORD` | `Admin@123` | mật khẩu cho tài khoản `admin` trong seed |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174` | origin của FE |

Backend dùng cổng `8080` khi chạy trực tiếp và Docker Compose expose cổng `9999`.
Đặt `VITE_API_BASE_URL` ở frontend nếu API sử dụng URL khác.
