# HỘI AN HERITAGE - HỆ THỐNG THUYẾT MINH DU LỊCH TỰ ĐỘNG ĐA NGÔN NGỮ
<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/54bb6df8-b97d-4765-85a3-f826b4e4583d" />

[![Backend & Services CI/CD Pipeline](https://github.com/QuangVinh-Dev/SoftwareEngineering-Project_SGU/actions/workflows/backend-services-ci-cd.yml/badge.svg)](https://github.com/QuangVinh-Dev/SoftwareEngineering-Project_SGU/actions/workflows/backend-services-ci-cd.yml)
[![Frontend CI Pipeline](https://github.com/QuangVinh-Dev/SoftwareEngineering-Project_SGU/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/QuangVinh-Dev/SoftwareEngineering-Project_SGU/actions/workflows/frontend-ci.yml)
[![Live Demo - User](https://img.shields.io/badge/Live_Demo-Khách_Du_Lịch-success?logo=googlechrome&logoColor=white)](https://ha-user.buivietquangvinh.xyz)
[![Live Demo - Admin](https://img.shields.io/badge/Live_Demo-Quản_Trị_Viên-blue?logo=googlechrome&logoColor=white)](https://ha-admin.buivietquangvinh.xyz)
[![Live Demo - Owner](https://img.shields.io/badge/Live_Demo-Chủ_Gian_Hàng-orange?logo=googlechrome&logoColor=white)](https://ha-owner.buivietquangvinh.xyz)
![Java 21](https://img.shields.io/badge/Java-21-orange.svg)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-brightgreen.svg)
![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED.svg)
![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)
![Redis 7](https://img.shields.io/badge/Redis-7-red.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)

> **Đồ án môn học**: Công nghệ phần mềm (Software Engineering Project - SGU)  
> **Giảng viên hướng dẫn**: Thầy Nguyễn Quốc Huy  
> **Phân công đề tài**: **Mục 3 - BE Dev: Tạo các services giao tiếp với nhau bao gồm CI/CD**  
> 
>  **Hệ thống đã triển khai trực tuyến (Live Production)**:
> - **Cổng Khách du lịch (`HA.USER`)**: [https://ha-user.buivietquangvinh.xyz](https://ha-user.buivietquangvinh.xyz)
> - **Cổng Quản trị viên (`HA_ADMIN`)**: [https://ha-admin.buivietquangvinh.xyz](https://ha-admin.buivietquangvinh.xyz)
> - **Cổng Chủ gian hàng (`HA_Store Owner`)**: [https://ha-owner.buivietquangvinh.xyz](https://ha-owner.buivietquangvinh.xyz)

---

##  THÀNH VIÊN NHÓM THỰC HIỆN

| STT | Họ và tên | GitHub Account | MSSV |
| :---: | :--- | :--- | :--- |
| 1 | **Võ Thị Thảo Vy** | [@VOTHITHAOVY](https://github.com/VOTHITHAOVY) | `3124411356` |
| 2 | **Bùi Viết Quang Vinh** | [@QuangVinh-Dev](https://github.com/QuangVinh-Dev) | `3124411347` |
| 3 | **Nguyễn Như Thảo** | [@Nhuthaonguyen26](https://github.com/Nhuthaonguyen26) | `3124411281` |

---

##  ĐƯỜNG DẪN TRUY CẬP HỆ THỐNG TRỰC TUYẾN (PRODUCTION LIVE)

Toàn bộ hệ thống Multi-Services và các ứng dụng Frontend đã được đóng gói container hóa và triển khai thành công trên môi trường Server Production với tên miền trực tuyến có HTTPS an toàn:

| Phân hệ / Cổng ứng dụng | Tên miền trực tuyến (Live Domain) | Môi trường Local (Dev) | Đối tượng & Chức năng cốt lõi |
| :--- | :--- | :--- | :--- |
| **Cổng Khách du lịch (`HA.USER`)** | [https://ha-user.buivietquangvinh.xyz](https://ha-user.buivietquangvinh.xyz) | `http://localhost:5173` | Du khách tham quan, bản đồ số di động, định vị GPS Geofencing tự động phát thuyết minh đa ngôn ngữ, thanh toán mở khóa |
| **Cổng Quản trị viên (`HA_ADMIN`)** | [https://ha-admin.buivietquangvinh.xyz](https://ha-admin.buivietquangvinh.xyz) | `http://localhost:5174` | Duyệt hồ sơ gian hàng, phê duyệt nội dung POI, dịch thuật AI, sinh audio TTS, thống kê Heatmap & doanh thu |
| **Cổng Chủ gian hàng (`HA_Store Owner`)** | [https://ha-owner.buivietquangvinh.xyz](https://ha-owner.buivietquangvinh.xyz) | `http://localhost:5175` | Đăng ký gian hàng, tạo & sửa POI quán, nhập tọa độ GPS tự động/tay, xem thống kê lượt nghe du khách theo thời gian thực |

---

##🏛️ TỔNG QUAN HỆ THỐNG (MỤC 3: MULTI-SERVICES & CI/CD)

Dự án áp dụng kiến trúc **Multi-Services (Nhiều dịch vụ độc lập)** được điều phối và đóng gói tự động bằng **Docker Compose**, phục vụ nền tảng thuyết minh di sản du lịch thông minh tại phố cổ Hội An:

```mermaid
flowchart TD
    subgraph DOCKER["CỤM MULTI-SERVICES (Mạng nội bộ Docker)"]
        direction TB
        APP["1. HA_App (Spring Boot API Chính - Port 8080/9999)<br/>Điều phối nghiệp vụ, phân quyền JWT, quản lý POI"]
        TTS["2. Piper-TTS Service (FastAPI / Python - Port 5001)<br/>AI Speech Synthesis (Tổng hợp giọng đọc audio)"]
        TRANS["3. LibreTranslate Service (Port 5000)<br/>Dịch thuật thần kinh đa ngôn ngữ Offline"]
        REDIS["4. Redis Cache Service (Port 6380)<br/>Bộ nhớ đệm audio, quản lý phiên và token"]
        DB[("5. PostgreSQL 16 Service (Port 5433)<br/>Cơ sở dữ liệu quan hệ lưu trữ hệ thống")]
        TUNNEL["6. Cloudflare Tunnel Service<br/>Tạo đường truyền an toàn ra Internet"]
    end

    CLIENTS["3 Cổng Giao diện Web (Khách du lịch, Admin, Chủ gian hàng)"]
    EXT_MAIL["Dịch vụ ngoài: Gmail SMTP Server (Port 587)"]
    EXT_VNPAY["Dịch vụ ngoài: VNPay Payment Gateway"]

    CLIENTS --> APP
    APP -- "REST API (HTTP POST)" --> TTS
    APP -- "REST API (HTTP POST)" --> TRANS
    APP -- "TCP / Redis Protocol" --> REDIS
    APP -- "JDBC / SQL Protocol" --> DB
    APP -- "TLS SMTP Port 587" --> EXT_MAIL
    APP -- "HMAC-SHA512 API" --> EXT_VNPAY
    TUNNEL --> APP
```

### 1. Chi tiết các Services và cơ chế giao tiếp
1. **`ha-app` (Spring Boot 4.1.1 - Java 21)**:
   - Dịch vụ trung tâm (Core Service) điều phối toàn bộ luồng nghiệp vụ.
   - Quản lý xác thực phân quyền Spring Security & JWT Token.
   - Gọi HTTP REST sang Service `piper-tts` và `libretranslate` để xử lý audio và dịch thuật.
2. **`piper-tts` (Python 3.11 - FastAPI / Uvicorn)**:
   - Service AI chuyên biệt chạy trên cổng `5001`.
   - Nhận văn bản và tạo giọng đọc tự nhiên đa ngôn ngữ bằng mô hình ONNX Neural TTS chất lượng cao (`vi`, `en`, `ja`, `ko`, `zh`).
3. **`libretranslate`**:
   - Dịch vụ dịch máy học thần kinh (Machine Translation) chạy offline trên cổng `5000`.
   - Tự động chuyển ngữ nội dung giới thiệu điểm đến (POI) từ Tiếng Việt sang các thứ tiếng phục vụ khách quốc tế.
4. **`redis` (Redis 7 Alpine)**:
   - Hoạt động trên cổng `6380`.
   - Lưu trữ cache kết quả audio, trạng thái phiên thanh toán và tối ưu tốc độ phản hồi.
5. **`postgres` (PostgreSQL 16)**:
   - Hoạt động trên cổng `5433` (ánh xạ từ 5432).
   - Quản trị dữ liệu quan hệ với ràng buộc toàn vẹn, chỉ mục không gian toạ độ và bảo vệ giao dịch ACID.
6. **Dịch vụ tích hợp bên ngoài**:
   - **VNPay Payment Gateway**: Xử lý giao dịch thanh toán mở khóa quyền nghe trực tuyến của du khách.
   - **Google Mail SMTP**: Tự động gửi thư điện tử thông báo kết quả kiểm duyệt hồ sơ cho chủ gian hàng.

---

##  QUY TRÌNH CI/CD TỰ ĐỘNG HÓA (GITHUB ACTIONS)

Hệ thống CI/CD được thiết lập hoàn chỉnh với 2 workflows chạy độc lập và song song nhằm kiểm tra chất lượng mã nguồn trước khi hợp nhất và triển khai:

```mermaid
flowchart LR
    A["Mã nguồn push lên GitHub"] --> B["GitHub Actions Trigger"]
    
    subgraph BACKEND_CI["Backend & Services CI/CD Pipeline"]
        direction TB
        B1["Job 1: ci-spring-boot<br/>(JDK 21 Temurin / Maven Compile)"]
        B2["Job 2: ci-python-tts-service<br/>(Python 3.11 / Syntax Verification)"]
        B3["Job 3: cd-docker-services-build<br/>(Docker Compose Build multi-services)"]
        B1 & B2 --> B3
    end

    subgraph FRONTEND_CI["Frontend CI Pipeline"]
        direction TB
        C1["Job 4: ci-store-owner<br/>(Node 20 / npm ci & build Store Owner)"]
        C2["Job 5: ci-admin-portal<br/>(Node 20 / npm ci & build Admin Portal)"]
    end

    B --> BACKEND_CI
    B --> FRONTEND_CI
    
    subgraph DEPLOY["Continuous Deployment (CD)"]
        D1["Tự động cập nhật Production Server"]
        D2["Docker Compose redeploy cho cụm Services"]
    end
    
    B3 & C1 & C2 --> DEPLOY
    DEPLOY --> E["✅ All Checks Passed & Deployed"]
```

- **Quy trình CI Backend & Services (`backend-services-ci-cd.yml`)**:
  - Tự động kích hoạt khi có commit hoặc pull request vào các nhánh `main`, `feature`, `develop`.
  - Tự động build và biên dịch Java 21 với Maven Wrapper (`./mvnw clean compile`).
  - Tự động kiểm tra cú pháp Python cho Service `piper-tts`.
  - Kiểm tra tính tương thích của file `docker-compose.yml`.
  - Đóng gói Docker Images cho các services (`ha_app-app`, `ha_app-piper-tts`).
- **Quy trình CI Frontend (`frontend-ci.yml`)**:
  - Tự động kiểm tra cài đặt dependencies và chạy `npm run build` cho các giao diện React.
- **Quy trình CD Production (`cd-production-deploy.yml`)**:
  - Tự động deploy mã nguồn lên Production Server khi có cập nhật trên nhánh `main`.

---

##  CÁC TÍNH NĂNG NỔI BẬT CỦA HỆ THỐNG

1. **Định vị Geofencing & Tự động phát thuyết minh**:
   - Khi du khách tiến vào bán kính quét (Radius) của điểm tham quan (POI), hệ thống tự động kích hoạt bài thuyết minh đúng vị trí toạ độ GPS.
2. **Hỗ trợ đa ngôn ngữ linh hoạt**:
   - Tự động chuyển ngữ và tạo audio giọng đọc theo 5 ngôn ngữ: Tiếng Việt, Tiếng Anh, Tiếng Nhật, Tiếng Hàn và Tiếng Trung.
3. **Hệ thống 3 Cổng tương tác chuyên nghiệp**:
   - **Cổng Khách du lịch (`HA.USER`)**: Bản đồ số di động, định vị người dùng, trình phát Audio Player nổi, thanh toán vé.
   - **Cổng Quản trị viên (`HA_ADMIN`)**: Duyệt hồ sơ gian hàng, phê duyệt nội dung POI, biểu đồ thống kê doanh thu và lượt nghe.
   - **Cổng Chủ gian hàng (`HA_Store Owner`)**: Thiết lập hồ sơ POI duy nhất (nhập GPS tự động hoặc toạ độ tay), theo dõi thống kê lượt nghe du khách theo thời gian thực.
4. **Hệ thống gửi Email thông báo tự động**:
   - Tự động gửi email giao diện HTML thương hiệu Hội An Heritage tới hộp thư chủ gian hàng khi Admin duyệt hoặc từ chối hồ sơ.

---

## 🛠️ HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG (QUICK START)

### 1. Yêu cầu môi trường
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [Java 21 (JDK)](https://adoptium.net/) (nếu chạy local không dùng Docker)
- [Node.js 20+](https://nodejs.org/) & `npm`

### 2. Khởi chạy cụm Multi-Services bằng Docker Compose (Khuyên dùng)
Tại thư mục `HA_App`:
```bash
# 1. Di chuyển vào thư mục backend
cd HA_App

# 2. Khởi tạo cấu hình môi trường từ mẫu
cp .env.example .env

# 3. Khởi chạy toàn bộ cụm Services
docker compose up -d --build
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```

### 3. Khởi chạy các giao diện Frontend
Mở từng thư mục frontend và chạy lệnh:
```bash
# Cổng Khách du lịch (Port 5173)
cd HA.USER/hoi-an-app && npm install && npm run dev

# Cổng Quản trị viên Admin (Port 5174)
cd HA_ADMIN && npm install && npm run dev

# Cổng Chủ gian hàng Store Owner (Port 5175)
cd "HA_Store Owner" && npm install && npm run dev
```

---

##  TÀI KHOẢN TRUY CẬP & THÔNG TIN THANH TOÁN THỬ NGHIỆM

### 1. Tài khoản đăng nhập hệ thống

| Phân hệ | Đường dẫn truy cập trực tuyến (Production) | Đường dẫn Local (Dev) | Tên đăng nhập | Mật khẩu mặc định |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | [https://ha-admin.buivietquangvinh.xyz/login](https://ha-admin.buivietquangvinh.xyz/login) | `http://localhost:5174/login` | `admin` | `Admin@123` |
| **Chủ gian hàng (Store Owner)** | [https://ha-owner.buivietquangvinh.xyz/login](https://ha-owner.buivietquangvinh.xyz/login) | `http://localhost:5175/login` | `chugianhang` | `Mc-d9280d239f` *(hoặc `123456`)* |
| **Khách du lịch (User Web)** | [https://ha-user.buivietquangvinh.xyz](https://ha-user.buivietquangvinh.xyz) | `http://localhost:5173` | *(Truy cập trực tiếp không cần đăng nhập)* | — |

---

### 2. Thông tin thẻ Test thanh toán VNPAY Sandbox

Dùng để thử nghiệm tính năng du khách thanh toán mở khóa thuyết minh du lịch không giới hạn qua cổng VNPay:

| Thông tin trường | Dữ liệu thử nghiệm (Sandbox Test Data) |
| :--- | :--- |
| **Ngân hàng** | `NCB` |
| **Số thẻ** | `9704198526191432198` |
| **Tên chủ thẻ** | `NGUYEN VAN A` |
| **Ngày phát hành** | `07/15` |
| **Mật khẩu OTP** | `123456` |

---

## 📂 CẤU TRÚC THƯ MỤC DỰ ÁN

```text
├── .github/
│   └── workflows/                # Cấu hình GitHub Actions CI/CD Pipeline
│       ├── backend-services-ci-cd.yml
│       ├── frontend-ci.yml
│       └── cd-production-deploy.yml
├── HA_App/                       # Backend Spring Boot & Cụm Services Docker
│   ├── src/main/java/            # Mã nguồn Java 21 (Mô hình 3 lớp Controller - Service - Repository)
│   ├── tts-service/              # Microservice AI Text-To-Speech (FastAPI Python)
│   ├── docker-compose.yml        # Định nghĩa liên kết cụm Multi-services
│   └── Dockerfile                # Multi-stage build Dockerfile cho backend
├── HA_ADMIN/                     # Cổng thông tin Quản trị viên (React + TypeScript + Tailwind)
├── HA_Store Owner/               # Cổng thông tin Quản lý Gian hàng (React + TypeScript + Tailwind)
├── HA.USER/                      # Cổng ứng dụng Du khách di động (React + Leaflet Map)
└── Document/                     # Tài liệu đặc tả và báo cáo đồ án
```

---
*© 2026 - Đồ án Công nghệ phần mềm | Trường Đại học Sài Gòn (SGU)*
