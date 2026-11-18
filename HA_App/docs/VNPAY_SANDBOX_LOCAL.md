# VNPay Sandbox: Return URL, IPN và kiểm thử local

## Luồng thực tế trong dự án

1. Frontend gọi `POST /api/payments` với `credentials: include`. Backend tạo/khôi phục cookie guest và liên kết payment với `guest_session`; giá lấy từ database.
2. `PaymentService` tạo URL VNPay 2.1.0, nhân số tiền VND với 100, sắp xếp/encode tham số và ký HMAC-SHA512. `vnp_ReturnUrl` lấy từ `VNPAY_RETURN_URL`.
3. VNPay chuyển **trình duyệt** về Frontend. `PaymentGate` chuyển tiếp toàn bộ tham số `vnp_*` tới `POST /api/payments/vnpay/return`, rồi bỏ query khỏi thanh địa chỉ.
4. Backend Return tự xác minh chữ ký, merchant, đơn, số tiền và kết quả bằng cùng quy tắc với IPN. Frontend không tự chuyển payment sang PAID từ `vnp_ResponseCode`; sau đó polling `GET /api/payments/{txnRef}/status` với `X-Payment-Claim-Secret`.
5. **Máy chủ VNPay** gọi `GET /api/payments/vnpay/ipn`. Backend xác minh chữ ký, merchant, mã giao dịch, số tiền và kết quả; khóa dòng payment trước khi cập nhật.
6. Return hoặc IPN hợp lệ có thể chuyển PENDING sang PAID/FAILED theo cách idempotent. IPN vẫn là callback server-to-server độc lập và trả response `RspCode/Message` riêng. Sau commit PAID, listener tạo token trong Redis; Frontend gọi `/api/payments/claim` bằng claim secret để nhận token đã cấp.

Trạng thái hiện có: PENDING, PAID, FAILED. IPN hủy/thất bại có chữ ký hợp lệ được ánh xạ sang FAILED; không có enum CANCELLED riêng. IPN lặp không phát thêm sự kiện cấp quyền.

## Vì sao Return thành công nhưng payment vẫn PENDING?

`http://localhost:5173` dùng được cho Return URL khi trình duyệt thanh toán chạy trên cùng máy phát triển. `http://localhost:9999/api/payments/vnpay/ipn` không thể nhận callback từ VNPay: localhost đó thuộc máy chủ VNPay.

`VNPAY_IPN_URL` hiện chỉ được bind vào `VnPayProperties.ipnUrl`; code không gửi biến này như một tham số trong payment URL và không gọi API đăng ký callback. **Điền biến môi trường không tự đăng ký IPN với VNPay.** Cần cung cấp/đăng ký URL IPN HTTPS công khai trong cấu hình merchant Sandbox hoặc qua kênh hỗ trợ kỹ thuật VNPay.

Các truy vấn Hibernate lặp lại có thể là polling của Frontend; chúng không chứng minh rằng IPN đã đến. Một số payment PAID trong DB cũng không đủ chứng minh callback của giao dịch đang kiểm thử đã đến.

## Phương án A: nhận IPN thật qua tunnel

Chỉ thực hiện sau khi người phát triển chấp thuận việc cài công cụ và công khai Backend. Tài liệu này không cài hay chạy tunnel.

1. Kiểm tra công cụ có sẵn: `command -v cloudflared` hoặc `command -v ngrok`.
2. Nếu đã cài và được phép, Cloudflare Quick Tunnel có thể chuyển tiếp cổng Backend:

   ```bash
   cloudflared tunnel --url http://127.0.0.1:9999
   ```

3. Lấy HTTPS origin thật do tunnel cấp. Giữ nguyên đường dẫn `/api/payments/vnpay/ipn`; không thêm/bỏ prefix trong proxy. Dùng URL có dạng `https://<hostname-thuc-te>/api/payments/vnpay/ipn`. Placeholder này không phải domain đã cấu hình.
4. Người phát triển tự cập nhật `VNPAY_IPN_URL` và đăng ký **cùng URL** ở phía merchant Sandbox. Giữ `VNPAY_RETURN_URL=http://localhost:5173` cho trình duyệt local. Khi hostname tunnel thay đổi, phải cập nhật cả hai nơi; tunnel phải tiếp tục chạy trong lúc thanh toán và chờ callback.
5. Kiểm tra URL công khai từ mạng bên ngoài bằng GET không có query. Endpoint phải trả HTTP 200 với JSON `RspCode=97` vì thiếu chữ ký. Probe này chỉ chứng minh routing/endpoint, không chứng minh VNPay xác nhận giao dịch.
6. Tạo một payment từ giao diện, thanh toán bằng tài khoản/thẻ **Sandbox**, theo dõi log IPN và trạng thái DB. Không gửi IPN tự ký bằng secret thật.

Tunnel này công khai toàn bộ cổng Backend. Các kiểm tra JWT/service token vẫn bắt buộc; không bật debug/access log chứa toàn bộ URL callback, không sao chép request có chữ ký/token/claim secret vào báo cáo.

Tham khảo: [VNPay PAY/IPN](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html), [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

## Phương án B: kiểm thử logic hoàn toàn local

Các test dùng merchant/key giả và mock Repository/Redis; không tạo payment thật trong PostgreSQL và không gọi VNPay:

```bash
./mvnw -Dtest=PaymentServiceSecurityTest,PaymentControllerIpnTest,VnPayUtilTest,AccessTokenServiceTest,GuestSessionServiceTest,ServiceAccessSecurityTest test
./mvnw -DskipTests package
```

Test gồm URL bắt buộc/encoding/HMAC, guest cookie và CORS, quyền tra cứu bằng claim secret, IPN hợp lệ, sai chữ ký/merchant/amount/txn, thiếu kết quả, tham số trùng, thất bại/hủy và IPN lặp. Các fixture hợp lệ không phải bằng chứng của giao dịch Sandbox thật.

## Chạy lại Backend và xem kết quả

Chạy từ `HA_App`. Recreate không kèm build chỉ đổi container/env, có thể vẫn dùng image cũ. Sau khi sửa source, dùng:

```bash
docker compose up -d --build --no-deps app
docker compose ps app
curl -sS http://localhost:9999/api/payments/vnpay/ipn
docker compose logs --since=10m app | rg 'VNPay IPN'
```

GET không có chữ ký trả `97` và không cập nhật payment. Log mới chỉ gồm endpoint đã nhận, kết quả xác minh, ID dòng payment nội bộ, chuyển trạng thái và mã phản hồi; không chứa raw query, chữ ký hay credential. Log chuyển trạng thái trong service được ghi trước commit; cần đối chiếu status API/DB để xác nhận commit thành công.

Theo hướng dẫn VNPay, RspCode 00/02 kết thúc callback; 01/04/97/99 yêu cầu retry. Backend giữ định dạng `{"RspCode":"...","Message":"..."}`. Lỗi xử lý không được trả HTML/stack trace.

## Giới hạn còn lại

- Polling tiếp tục khi DB còn PENDING. Frontend chưa có giới hạn chờ; đây không phải bằng chứng thanh toán thành công/thất bại và không được tự chuyển payment dựa trên timeout trình duyệt.
- Listener cấp token chạy AFTER_COMMIT. Nếu Redis lỗi đúng thời điểm đó, payment có thể đã PAID nhưng handoff chưa được lưu. Hiện chưa có hàng đợi retry bền vững; IPN lặp không tạo lại token. Không tự mint token hoặc kéo dài hạn để khắc phục. Cần thiết kế phục hồi với dấu mốc cấp quyền/hạn dùng bền vững được phê duyệt riêng nếu tình huống này xảy ra.
- Return endpoint là fallback có xác minh để tránh treo PENDING khi IPN đến chậm/không đến; nó không thay thế việc đăng ký IPN HTTPS công khai với VNPay.
- Cần xác minh callback thật, khóa JPA trên PostgreSQL và cấp quyền Redis ở môi trường tích hợp. Unit/MockMvc không thay thế các kiểm tra này.
