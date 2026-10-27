-- =====================================================================
-- hoian_database.sql  (BẢN VIẾT LẠI)
-- HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ - PHỐ CỔ HỘI AN
-- PostgreSQL 16 | 19 bảng | khớp ERD (đã gồm 5 cột hiển thị của poi/poi_revision)
--
-- So với bản trước: các bảng khác giữ nguyên; chỉ bảng payment và config UNLOCK_DURATION_HOURS thay đổi.
-- Bản này gồm:
--   * CHECK cho các cột trạng thái / phạm vi giá trị
--   * Index cho các khóa ngoại còn thiếu (đặc biệt poi_image.poi_id)
--   * Unique có điều kiện: 1 audio TTS / (translation, voice), 1 ngôn ngữ mặc định
--   * poi (+ poi_revision) có thêm 5 cột hiển thị: category, tagline, opening_hours, price_info, address
--     (lấy từ pois.js của app du khách) -> ERD cần thêm 5 cột này vào 2 bảng
--   * Gỡ 2 index thừa (đã được unique index khác bao phủ)
--   * Seed: thêm role POI_ADMIN (code cần), bỏ quyền MENU_EDIT_OWN (menu_item đã xóa),
--           seed bản dịch 'vi' từ poi.original_description
--   * payment (thanh toán VNPay): thêm claim_secret_hash và provider_transaction_no,
--     session_id cho phép NULL, BỎ access_expires_at. Hạn 12 giờ do Redis quản lý
--     (auth:{token}, TTL = UNLOCK_DURATION_HOURS = 12). Token không lưu trong Postgres.
--     -> ERD: sửa bảng payment theo các cột này
--   * Bọc trong một transaction: lỗi giữa chừng thì không để lại DB dở dang
--
-- Giữ nguyên TIMESTAMP (không đổi sang TIMESTAMPTZ) để khớp ERD và
-- spring.jpa.hibernate.ddl-auto=validate với LocalDateTime.
--
-- DÙNG CHO DATABASE MỚI (docker-entrypoint-initdb.d chỉ chạy 1 lần khi volume trống).
-- CẢNH BÁO: đầu file có DROP TABLE ... CASCADE, KHÔNG chạy lên DB đang có dữ liệu thật.
-- =====================================================================

BEGIN;

-- ---------- XÓA BẢNG CŨ (cho phép chạy lại nhiều lần) ----------
DROP TABLE IF EXISTS
    payment, listen_log, audio, voice, translation, poi_image, poi_revision, poi,
    merchant_image, guest_session, language, action_log,
    merchant, account, role_permission, role, config, daily_statistic,
    -- các bảng không còn trong thiết kế
    users_online, access_session, qr_code, menu_item
CASCADE;

-- =====================================================================
-- 1. TẠO BẢNG
-- =====================================================================

-- ----- Phân quyền & tài khoản -----
CREATE TABLE role (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    priority    INT NOT NULL DEFAULT 0
);

CREATE TABLE role_permission (
    role_id         INT         NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_code VARCHAR(50) NOT NULL,            -- VD: POI_EDIT, USER_MANAGE
    PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE account (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id         INT          NOT NULL REFERENCES role(id),
    username        VARCHAR(150) NOT NULL UNIQUE,    -- chủ gian hàng đăng nhập bằng email nên cần dài bằng email
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    email           VARCHAR(150) UNIQUE,
    account_type    VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',   -- ADMIN / MERCHANT
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / LOCKED
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_account_type   CHECK (account_type IN ('ADMIN', 'MERCHANT')),
    CONSTRAINT ck_account_status CHECK (status IN ('ACTIVE', 'LOCKED'))
);

-- merchant = ShopOwner trong ERD
CREATE TABLE merchant (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id      INT          NOT NULL UNIQUE REFERENCES account(id),
    name            VARCHAR(150) NOT NULL,
    phone_number    VARCHAR(20),
    address         VARCHAR(255),
    category        VARCHAR(100),                            -- loại hình: Ẩm thực & Đồ uống, Lưu niệm...
    description     VARCHAR(500),                            -- mô tả gian hàng
    plan_id         VARCHAR(20)  NOT NULL DEFAULT 'free',    -- free / standard / premium
    billing_cycle   VARCHAR(10)  NOT NULL DEFAULT 'monthly', -- monthly / yearly
    approval_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED
    reject_reason   VARCHAR(500),                            -- lý do admin từ chối
    registered_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    approved_at     TIMESTAMP,
    reviewed_by     INT          REFERENCES account(id),     -- quản trị viên duyệt hồ sơ
    cccd_number     VARCHAR(20),                             -- số CCCD của chủ gian hàng
    CONSTRAINT ck_merchant_plan     CHECK (plan_id IN ('free', 'standard', 'premium')),
    CONSTRAINT ck_merchant_billing  CHECK (billing_cycle IN ('monthly', 'yearly')),
    CONSTRAINT ck_merchant_approval CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Ảnh của chủ gian hàng khi đăng ký: ảnh gian hàng + 2 ảnh CCCD
CREATE TABLE merchant_image (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id INT          NOT NULL REFERENCES merchant(id) ON DELETE CASCADE,
    file_path   VARCHAR(500) NOT NULL,
    order_num   INT          NOT NULL DEFAULT 1,
    image_type  VARCHAR(20)  NOT NULL DEFAULT 'SHOP',       -- SHOP / CCCD_FRONT / CCCD_BACK
    CONSTRAINT ck_merchant_image_type CHECK (image_type IN ('SHOP', 'CCCD_FRONT', 'CCCD_BACK'))
);

CREATE TABLE notification (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id  INT          NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    channel     VARCHAR(20)  NOT NULL DEFAULT 'EMAIL',
    send_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',     -- PENDING / SENT / FAILED
    sent_at     TIMESTAMP,
    CONSTRAINT ck_notification_send_status CHECK (send_status IN ('PENDING', 'SENT', 'FAILED'))
);

CREATE TABLE action_log (
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id   INT          NOT NULL REFERENCES account(id),
    action       VARCHAR(255) NOT NULL,
    target_type  VARCHAR(100),
    performed_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    target_id    INT                                         -- tham chiếu đa hình theo target_type, không có FK
);

-- ----- Ngôn ngữ & giọng đọc -----
CREATE TABLE language (
    code        VARCHAR(10) PRIMARY KEY,      -- vi, en, ja, ko, zh...
    name        VARCHAR(50) NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE TABLE voice (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    language_code   VARCHAR(10)  NOT NULL REFERENCES language(code),
    name            VARCHAR(100) NOT NULL,
    tts_code        VARCHAR(100) NOT NULL,       -- mã giọng của dịch vụ TTS
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (language_code, tts_code)
);

-- ----- POI & nội dung -----
CREATE TABLE poi (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id     INT          REFERENCES merchant(id) ON DELETE SET NULL,  -- mỗi merchant chỉ tạo 1 POI (uq_poi_one_per_merchant)
    name            VARCHAR(200) NOT NULL,
    latitude        DECIMAL(9,6) NOT NULL,
    longitude       DECIMAL(9,6) NOT NULL,
    radius          INT          NOT NULL DEFAULT 30,   -- mét, bán kính kích hoạt
    priority_level  INT          NOT NULL DEFAULT 0,
    original_description TEXT,
    direction_link  VARCHAR(500),
    category        VARCHAR(30),                                -- mã danh mục: di-san / ton-giao / am-thuc / lang-nghe / gan-hoi-an
    tagline         VARCHAR(200),                               -- câu giới thiệu ngắn (VD: Biểu tượng Hội An)
    opening_hours   VARCHAR(100),                               -- VD: 07:00–21:00, Cả ngày
    price_info      VARCHAR(100),                               -- VD: Vé 120.000đ, Miễn phí, 35.000–55.000đ
    address         VARCHAR(255),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',     -- ACTIVE / INACTIVE
    approval_status VARCHAR(20)  NOT NULL DEFAULT 'APPROVED',   -- PENDING / APPROVED / REJECTED
    rejection_reason TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_poi_latitude   CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT ck_poi_longitude  CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT ck_poi_radius     CHECK (radius BETWEEN 1 AND 10000),
    CONSTRAINT ck_poi_priority   CHECK (priority_level BETWEEN 0 AND 100),
    CONSTRAINT ck_poi_status     CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_poi_approval   CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Bản gửi/chỉnh sửa POI chờ duyệt (code hiện tại chưa dùng)
CREATE TABLE poi_revision (
    id                   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id               INT           NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    name                 VARCHAR(200)  NOT NULL,
    latitude             DECIMAL(9,6)  NOT NULL,
    longitude            DECIMAL(9,6)  NOT NULL,
    original_description TEXT,
    direction_link       VARCHAR(500),
    category             VARCHAR(30),
    tagline              VARCHAR(200),
    opening_hours        VARCHAR(100),
    price_info           VARCHAR(100),
    address              VARCHAR(255),
    status               VARCHAR(20)   NOT NULL DEFAULT 'PENDING',   -- PENDING / APPROVED / REJECTED
    reject_reason        VARCHAR(500),
    submitted_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    reviewed_by          INT           REFERENCES account(id),
    reviewed_at          TIMESTAMP,
    CONSTRAINT ck_poi_revision_latitude  CHECK (latitude  BETWEEN -90  AND 90),
    CONSTRAINT ck_poi_revision_longitude CHECK (longitude BETWEEN -180 AND 180),
    CONSTRAINT ck_poi_revision_status    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE poi_image (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id      INT          NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    file_path   VARCHAR(500) NOT NULL,
    order_num   INT          NOT NULL DEFAULT 1,
    is_approved BOOLEAN      NOT NULL DEFAULT TRUE
    -- Không đặt UNIQUE (poi_id, order_num): code tính order = COUNT(*) + 1, xóa ảnh giữa chừng
    -- sẽ sinh số thứ tự trùng và làm lỗi upload.
);

CREATE TABLE translation (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id          INT         NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    language_code   VARCHAR(10) NOT NULL REFERENCES language(code),
    content         TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',   -- PENDING / APPROVED
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (poi_id, language_code),
    CONSTRAINT ck_translation_status CHECK (status IN ('PENDING', 'APPROVED'))
);

CREATE TABLE audio (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    translation_id  INT          NOT NULL REFERENCES translation(id) ON DELETE CASCADE,
    voice_id        INT          REFERENCES voice(id),        -- rỗng khi audio là file mp3 tải lên
    source          VARCHAR(20)  NOT NULL DEFAULT 'TTS',      -- TTS / UPLOAD
    file_path       VARCHAR(500) NOT NULL,
    duration_seconds INT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_audio_source   CHECK (source IN ('TTS', 'UPLOAD')),
    CONSTRAINT ck_audio_tts_voice CHECK (source <> 'TTS' OR voice_id IS NOT NULL),
    CONSTRAINT ck_audio_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- ----- Du khách, thanh toán, lượt nghe -----
-- guest_session = VisitorSession trong ERD (đã gộp access_session + users_online)
CREATE TABLE guest_session (
    id                  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anonymous_device_id VARCHAR(100) NOT NULL UNIQUE,         -- mã thiết bị ẩn danh
    language_code       VARCHAR(10)  REFERENCES language(code),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    device              VARCHAR(30),                          -- mobile / desktop / tablet
    country             VARCHAR(100),
    last_active_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE payment (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Nullable: luồng token không bắt buộc session. Không CASCADE để giữ chứng từ thanh toán.
    session_id              INT           NOT NULL REFERENCES guest_session(id),
    provider                VARCHAR(30)   NOT NULL DEFAULT 'VNPAY',   -- cổng thanh toán: VNPAY, VIETQR...
    provider_txn_id         VARCHAR(100)  NOT NULL UNIQUE,            -- = vnp_TxnRef (txnRef) gửi cho VNPay
    provider_transaction_no VARCHAR(32),                              -- vnp_TransactionNo, dùng đối soát
    -- Token không lưu trong DB: cấp khi IPN thành công, lưu Redis auth:{token} với TTL 12 giờ.
    -- claim_secret_hash = SHA-256(claimSecret); claimSecret chỉ trình duyệt đã tạo đơn biết.
    claim_secret_hash       VARCHAR(64)   NOT NULL UNIQUE,
    amount                  DECIMAL(12,2) NOT NULL,
    currency                VARCHAR(10)   NOT NULL DEFAULT 'VND',
    status                  VARCHAR(20)   NOT NULL DEFAULT 'PENDING', -- PENDING / PAID / FAILED
    created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
    paid_at                 TIMESTAMP,
    CONSTRAINT ck_payment_amount  CHECK (amount >= 0),
    CONSTRAINT ck_payment_status  CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
    CONSTRAINT ck_payment_paid_at CHECK (status <> 'PAID' OR paid_at IS NOT NULL)
);

-- listen_log = ListeningLog trong ERD
CREATE TABLE listen_log (
    id               INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id           INT         NOT NULL REFERENCES poi(id),
    language_code    VARCHAR(10) REFERENCES language(code),
    trigger_method   VARCHAR(30),                              -- AUTO_GPS / TAP
    listened_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    duration_seconds INT,
    is_completed     BOOLEAN     NOT NULL DEFAULT FALSE,
    session_id       INT         NOT NULL REFERENCES guest_session(id) ON DELETE CASCADE,
    audio_id         INT         REFERENCES audio(id) ON DELETE SET NULL,
    CONSTRAINT ck_listen_log_trigger  CHECK (trigger_method IS NULL OR trigger_method IN ('AUTO_GPS', 'TAP')),
    CONSTRAINT ck_listen_log_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- ----- Cấu hình & thống kê -----
CREATE TABLE config (
    config_key   VARCHAR(100) PRIMARY KEY,
    config_value TEXT,
    description  VARCHAR(255)
);

CREATE TABLE daily_statistic (
    stat_date            DATE PRIMARY KEY,
    unique_visitors      INT NOT NULL DEFAULT 0,
    total_visits         INT NOT NULL DEFAULT 0,
    session_count        INT NOT NULL DEFAULT 0,
    new_visitors         INT NOT NULL DEFAULT 0,
    avg_duration_seconds INT NOT NULL DEFAULT 0,
    mobile_sessions      INT NOT NULL DEFAULT 0,
    desktop_sessions     INT NOT NULL DEFAULT 0
);

-- ----- Chỉ mục -----
-- Postgres KHÔNG tự tạo index cho khóa ngoại, nên khai báo rõ các FK hay join/lọc.

-- Phân quyền & tài khoản
CREATE INDEX idx_account_role            ON account(role_id);
CREATE INDEX idx_merchant_reviewed_by    ON merchant(reviewed_by);
CREATE INDEX idx_merchant_approval       ON merchant(approval_status);
CREATE INDEX idx_merchant_image_merchant ON merchant_image(merchant_id, order_num);

CREATE INDEX idx_action_log_account      ON action_log(account_id, performed_at DESC);

-- POI & nội dung
CREATE INDEX idx_poi_coordinates         ON poi(latitude, longitude);
CREATE INDEX idx_poi_public_visibility   ON poi(status, approval_status);
CREATE INDEX idx_poi_category            ON poi(category) WHERE category IS NOT NULL;
CREATE INDEX idx_poi_image_poi           ON poi_image(poi_id, order_num);   -- code: WHERE poi_id=? ORDER BY order_num
CREATE INDEX idx_poi_revision_reviewed_by ON poi_revision(reviewed_by);
CREATE INDEX idx_translation_language    ON translation(language_code);
CREATE INDEX idx_audio_translation_id    ON audio(translation_id);
CREATE INDEX idx_audio_voice             ON audio(voice_id);
CREATE INDEX idx_voice_language          ON voice(language_code);
-- (đã bỏ idx_poi_merchant_created và idx_translation_poi_language_status:
--  uq_poi_one_per_merchant và UNIQUE(poi_id, language_code) đã bao phủ)

-- Du khách, thanh toán, lượt nghe
CREATE INDEX idx_guest_session_language  ON guest_session(language_code);
CREATE INDEX idx_payment_session         ON payment(session_id);   -- session_id có thể NULL, index vẫn dùng để join
CREATE INDEX idx_listen_log_poi          ON listen_log(poi_id);
CREATE INDEX idx_listen_log_listened_at  ON listen_log(listened_at);
CREATE INDEX idx_listen_log_session      ON listen_log(session_id);
CREATE INDEX idx_listen_log_language     ON listen_log(language_code);
CREATE INDEX idx_listen_log_audio        ON listen_log(audio_id);

-- Quy tắc nghiệp vụ (unique có điều kiện)
-- Mỗi chủ gian hàng chỉ có một POI (POI do admin tạo có merchant_id rỗng nên không bị ảnh hưởng)
CREATE UNIQUE INDEX uq_poi_one_per_merchant ON poi(merchant_id) WHERE merchant_id IS NOT NULL;
-- Mỗi POI chỉ có tối đa một bản chỉnh sửa đang chờ duyệt
CREATE UNIQUE INDEX uq_poi_revision_pending ON poi_revision(poi_id) WHERE status = 'PENDING';
-- Mỗi (bản dịch, giọng) chỉ có một audio TTS; code dùng LIMIT 1 nên trùng sẽ gây chọn nhầm
CREATE UNIQUE INDEX uq_audio_tts_per_voice  ON audio(translation_id, voice_id) WHERE source = 'TTS';
-- Chỉ một ngôn ngữ mặc định
CREATE UNIQUE INDEX uq_language_one_default ON language(is_default) WHERE is_default;

-- =====================================================================
-- 2. DỮ LIỆU MẪU
-- =====================================================================

-- POI_ADMIN: code (SecurityConfig, PoiAdminRoleSeeder) dùng role này cho /api/admin/pois.
-- Seed sẵn để DB tự đầy đủ; seeder dùng findByName nên không tạo trùng.
INSERT INTO role (name, description, priority) VALUES
('SUPER_ADMIN', 'System administrator',                    100),
('ADMIN',       'Content administrator',                   50),
('POI_ADMIN',   'Administrator for POI content and audio', 60),
('MERCHANT',    'Merchant / Shop owner in ancient town',   10);

INSERT INTO role_permission (role_id, permission_code)
SELECT r.id, p.code
FROM (VALUES
    ('SUPER_ADMIN', 'POI_EDIT'), ('SUPER_ADMIN', 'USER_MANAGE'),
    ('SUPER_ADMIN', 'CONFIG_EDIT'), ('SUPER_ADMIN', 'REPORT_VIEW'),
    ('ADMIN',       'POI_EDIT'), ('ADMIN',       'REPORT_VIEW'),
    ('POI_ADMIN',   'POI_EDIT'),
    ('MERCHANT',    'POI_EDIT_OWN')
) AS p(role_name, code)
JOIN role r ON r.name = p.role_name;

-- Tài khoản 'admin': hash giả có tiền tố $2b$10$abcdefghijklmnopqrstuv để AdminAccountSeeder
-- nhận ra và đặt lại mật khẩu thật khi app khởi động. KHÔNG đổi tiền tố này.
-- editor01 / caolau_bamy / banhmi_phuong chỉ là dữ liệu minh họa cho màn hình quản trị,
-- hash giả và không có seeder nào sửa nên KHÔNG đăng nhập được.
INSERT INTO account (role_id, username, password_hash, full_name, email, account_type, status)
SELECT r.id, a.username, a.password_hash, a.full_name, a.email, a.account_type, 'ACTIVE'
FROM (VALUES
    ('SUPER_ADMIN', 'admin',         '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Administrator', 'admin@hoian.vn',     'ADMIN'),
    ('ADMIN',       'editor01',      '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Nguyen Van An', 'an.nv@hoian.vn',     'ADMIN'),
    ('MERCHANT',    'caolau_bamy',   '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Tran Thi My',   'my.tt@gmail.com',    'MERCHANT'),
    ('MERCHANT',    'banhmi_phuong', '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Le Thi Phuong', 'phuong.lt@gmail.com', 'MERCHANT')
) AS a(role_name, username, password_hash, full_name, email, account_type)
JOIN role r ON r.name = a.role_name;

INSERT INTO merchant (account_id, name, phone_number, address, category, description, plan_id, billing_cycle, approval_status, registered_at, approved_at, reviewed_by, cccd_number)
SELECT acc.id, m.name, m.phone, m.address, m.category, m.description, m.plan_id, 'monthly', 'APPROVED',
       NOW() - m.registered_ago, NOW() - m.approved_ago,
       (SELECT id FROM account WHERE username = 'admin'), m.cccd
FROM (VALUES
    ('caolau_bamy',   'Cao Lau Ba My',  '0905123456', '26 Thai Phien, Hoi An',     'Ẩm thực & Đồ uống', 'Quán cao lầu lâu năm tại Hội An.',     'standard', INTERVAL '30 days', INTERVAL '29 days', '049123456789'),
    ('banhmi_phuong', 'Banh Mi Phuong', '0905654321', '2 Phan Chau Trinh, Hoi An', 'Ẩm thực & Đồ uống', 'Tiệm bánh mì nổi tiếng với du khách.', 'free',     INTERVAL '20 days', INTERVAL '19 days', '049987654321')
) AS m(username, name, phone, address, category, description, plan_id, registered_ago, approved_ago, cccd)
JOIN account acc ON acc.username = m.username;

INSERT INTO notification (account_id, title, content, is_read, channel, send_status, sent_at)
SELECT acc.id, n.title, n.content, n.is_read, 'EMAIL', n.send_status, n.sent_at
FROM (VALUES
    ('caolau_bamy',   'Merchant approved', 'Your shop Cao Lau Ba My has been approved.',      TRUE,  'SENT',    NOW() - INTERVAL '29 days'),
    ('banhmi_phuong', 'Merchant approved', 'Your shop Banh Mi Phuong has been approved.',     FALSE, 'SENT',    NOW() - INTERVAL '19 days'),
    ('editor01',      'New translation',   'English translation of Chùa Cầu is pending review.', FALSE, 'PENDING', NULL::TIMESTAMPTZ)
) AS n(username, title, content, is_read, send_status, sent_at)
JOIN account acc ON acc.username = n.username;

INSERT INTO action_log (account_id, action, target_type, target_id)
SELECT acc.id, l.action, l.target_type, l.target_id
FROM (VALUES
    ('admin',    'User login',              'ACCOUNT',     1),
    ('editor01', 'Update POI description',  'POI',         1),
    ('editor01', 'Add English translation', 'TRANSLATION', 2),
    ('admin',    'Approve merchant',        'MERCHANT',    1)
) AS l(username, action, target_type, target_id)
JOIN account acc ON acc.username = l.username;

INSERT INTO language (code, name, is_active, is_default) VALUES
('vi','Vietnamese', TRUE, TRUE),
('en','English',    TRUE, FALSE),
('ja','Japanese',   TRUE, FALSE),
('ko','Korean',     TRUE, FALSE),
('zh','Chinese',    TRUE, FALSE);

INSERT INTO voice (language_code, name, tts_code, is_active) VALUES
('vi','Hoai My (female)',   'vi-VN-HoaiMyNeural',   TRUE),
('vi','Nam Minh (male)',    'vi-VN-NamMinhNeural',  TRUE),
('en','Jenny (female)',     'en-US-JennyNeural',    TRUE),
('ja','Nanami (female)',    'ja-JP-NanamiNeural',   TRUE),
('ko','SunHi (female)',     'ko-KR-SunHiNeural',    TRUE),
('zh','Xiaoxiao (female)',  'zh-CN-XiaoxiaoNeural', TRUE);

INSERT INTO config (config_key, config_value, description) VALUES
('UNLOCK_PRICE',          '20000', 'Giá mở khóa ứng dụng (nguồn của payment.amount)'),
('UNLOCK_CURRENCY',       'VND',   'Đơn vị tiền tệ'),
('UNLOCK_DURATION_HOURS', '12',    'Thời hạn token sau khi thanh toán (giờ), trùng TTL auth:{token} trong Redis'),
('DEFAULT_RADIUS',        '30',    'Bán kính kích hoạt mặc định cho POI mới (mét)'),
('PRIVACY_POLICY',        '',      'Nội dung chính sách quyền riêng tư'),
('TTS_PROVIDER',          'azure', 'Text-to-Speech provider'),
('ONLINE_TIMEOUT_SECONDS','120',   'Timeout to mark user as offline'),
('DEFAULT_LANGUAGE',      'vi',    'Default language');

-- ----- 20 POI mẫu (lấy từ HA.USER/src/data/pois.js) + ảnh trong Data_Storage/poi-images -----
-- category = mã danh mục (di-san, ton-giao, am-thuc, lang-nghe, gan-hoi-an) khớp CATEGORIES.id của app;
-- địa chỉ nay nằm ở cột address, không còn nối vào cuối original_description.
INSERT INTO poi (id, merchant_id, name, latitude, longitude, radius, priority_level, original_description, direction_link,
                 category, tagline, opening_hours, price_info, address, status, approval_status) OVERRIDING SYSTEM VALUE VALUES
(1,NULL,'Chùa Cầu',15.876900,108.326000,50,5,'Cây cầu có mái che thế kỷ XVII do thương nhân Nhật Bản xây, in trên tờ tiền 20.000đ.','https://maps.google.com/?q=15.876900,108.326000','di-san','Biểu tượng Hội An','07:00–21:00','Vé 120.000đ','Nguyễn Thị Minh Khai','ACTIVE','APPROVED'),
(2,NULL,'Nhà cổ Tấn Ký',15.877200,108.326600,50,5,'Ngôi nhà cổ 7 đời họ Lê, kiến trúc Việt – Hoa – Nhật hoà quyện, đã 280+ năm tuổi.','https://maps.google.com/?q=15.877200,108.326600','di-san','Nhà cổ 1741','08:00–18:00','Vé 120.000đ','101 Nguyễn Thái Học','ACTIVE','APPROVED'),
(3,NULL,'Hội quán Phúc Kiến',15.876800,108.327200,50,5,'Hội quán người Hoa gốc Phúc Kiến, thờ Thiên Hậu Thánh Mẫu, kiến trúc chữ "Tam".','https://maps.google.com/?q=15.876800,108.327200','di-san','Hội quán 1690','07:30–18:00','Vé 120.000đ','46 Trần Phú','ACTIVE','APPROVED'),
(4,NULL,'Hội quán Triều Châu',15.877300,108.328300,50,5,'Hội quán người Triều Châu — kiến trúc đắp nổi độc đáo, còn nguyên vẹn đến nay.','https://maps.google.com/?q=15.877300,108.328300','di-san','Hội quán 1776','08:00–17:30','Vé 120.000đ','157 Nguyễn Duy Hiệu','ACTIVE','APPROVED'),
(5,NULL,'Hội quán Quảng Đông',15.876500,108.326900,50,5,'Hội quán người Quảng Đông, thờ Quan Công, kiến trúc trùng thiềm điệp ốc.','https://maps.google.com/?q=15.876500,108.326900','di-san','Hội quán 1885','08:00–18:00','Vé 120.000đ','17 Trần Phú','ACTIVE','APPROVED'),
(6,NULL,'Nhà cổ Phùng Hưng',15.876700,108.327000,50,5,'Nhà cổ hơn 230 năm, kiến trúc 2 tầng gỗ, từng là nơi giao thương thương nhân.','https://maps.google.com/?q=15.876700,108.327000','di-san','Nhà cổ 1780','08:00–18:00','Vé 120.000đ','4 Nguyễn Thị Minh Khai','ACTIVE','APPROVED'),
(7,NULL,'Chùa Quan Âm',15.877000,108.327500,50,5,'Ngôi chùa hơn 350 năm tuổi, kiến trúc Nho giáo triều Thanh, bảo tàng sống của Hội An.','https://maps.google.com/?q=15.877000,108.327500','ton-giao','Chùa cổ 1650','06:00–18:00','Miễn phí','67 Trần Phú','ACTIVE','APPROVED'),
(8,NULL,'Chùa Phước Lâm',15.879000,108.330000,50,5,'Chùa hơn 270 năm tuổi, mái ngói âm dương, chạm khắc rồng tinh xảo.','https://maps.google.com/?q=15.879000,108.330000','ton-giao','Chùa cổ 1750','06:00–18:00','Miễn phí','14 Nguyễn Trường Tộ','ACTIVE','APPROVED'),
(9,NULL,'Cao lầu Bà Phước',15.877000,108.327500,50,5,'Món ăn biểu tượng — sợi mì vàng óng, xá xíu, da heo giòn, nước dùng đậm đà.','https://maps.google.com/?q=15.877000,108.327500','am-thuc','Đặc sản','06:00–22:00','35.000–55.000đ','2 Trần Phú','ACTIVE','APPROVED'),
(10,NULL,'Bánh mì Phượng',15.876300,108.326000,50,5,'Tiệm bánh mì nổi tiếng thế giới — vỏ giòn rụm, pate, chả, thịt nguội và rau thơm.','https://maps.google.com/?q=15.876300,108.326000','am-thuc','Street food','06:30–19:00','20.000–40.000đ','2B Phan Châu Trinh','ACTIVE','APPROVED'),
(11,NULL,'Cơm gà Bà Buội',15.877800,108.328800,50,5,'Cơm vàng nghệ, gà xé phay trộn rau răm, hành phi — hương vị đặc trưng phố cổ.','https://maps.google.com/?q=15.877800,108.328800','am-thuc','Cơm','10:00–21:00','40.000–60.000đ','22 Phan Châu Trinh','ACTIVE','APPROVED'),
(12,NULL,'White Rose',15.878300,108.325300,50,5,'Bánh bao hoa hồng trắng nhân tôm thịt, hấp chín, rắc hành phi — thanh tao, tinh tế.','https://maps.google.com/?q=15.878300,108.325300','am-thuc','Bánh','10:00–20:00','30.000–50.000đ','533 Hai Bà Trưng','ACTIVE','APPROVED'),
(13,NULL,'Chè bắp Cẩm Nam',15.875200,108.330000,50,5,'Chè bắp nấu nước cốt dừa, đậu phộng rang, ăn kèm bánh tráng nướng giòn.','https://maps.google.com/?q=15.875200,108.330000','am-thuc','Tráng miệng','14:00–22:00','10.000–20.000đ','Cẩm Nam','ACTIVE','APPROVED'),
(14,NULL,'Làng gốm Thanh Hà',15.883000,108.338000,50,5,'Làng gốm truyền thống hơn 500 năm, có lớp làm gốm cho du khách trải nghiệm.','https://maps.google.com/?q=15.883000,108.338000','lang-nghe','Làng gốm 500 năm','08:00–17:30','Vé 35.000đ','Phạm Phán, Thanh Hà','ACTIVE','APPROVED'),
(15,NULL,'Làng mộc Kim Bồng',15.872000,108.332000,50,5,'Làng mộc lâu đời bên sông Thu Bồn, có lớp chạm khắc gỗ 3 giờ cho du khách.','https://maps.google.com/?q=15.872000,108.332000','lang-nghe','Làng mộc 400 năm','08:00–17:00','Lớp 200.000đ','Cẩm Kim','ACTIVE','APPROVED'),
(16,NULL,'Làng rau Trà Quế',15.888000,108.335000,50,5,'Làng rau 400 năm, lớp nấu ăn, đạp xe qua ruộng lúa — trải nghiệm xanh mát.','https://maps.google.com/?q=15.888000,108.335000','lang-nghe','Làng rau 400 năm','07:00–17:00','Tour 250.000đ','Trà Quế, Cẩm Hà','ACTIVE','APPROVED'),
(17,NULL,'Thánh địa Mỹ Sơn',15.764000,108.350000,50,5,'Tháp Chăm thế kỷ 4–13, cách Hội An ~1h xe — di sản văn hoá thế giới UNESCO.','https://maps.google.com/?q=15.764000,108.350000','gan-hoi-an','Di sản UNESCO','06:30–17:30','Vé 150.000đ','Duy Phú, Duy Xuyên','ACTIVE','APPROVED'),
(18,NULL,'Cù Lao Chàm',15.952000,108.483000,50,5,'Đảo xanh với làng chài cổ, homestay, lặn ngắm san hô — khu dự trữ sinh quyển UNESCO.','https://maps.google.com/?q=15.952000,108.483000','gan-hoi-an','Đảo · Khu dự trữ sinh quyển','07:00–17:00','Tour 400.000đ','Tân Hiệp','ACTIVE','APPROVED'),
(19,NULL,'Biển An Bàng',15.912000,108.339000,50,5,'Bãi biển cát vàng đẹp nhất gần Hội An, cách phố cổ 4km — hoàng hôn tuyệt đẹp.','https://maps.google.com/?q=15.912000,108.339000','gan-hoi-an','Bãi biển đẹp','Cả ngày','Miễn phí','An Bàng, Cẩm An','ACTIVE','APPROVED'),
(20,NULL,'Rừng dừa Bảy Mẫu',15.883000,108.342000,50,5,'Rừng dừa nước với trò đi thuyền thúng độc đáo — cách phố cổ ~5km.','https://maps.google.com/?q=15.883000,108.342000','gan-hoi-an','Thuyền thúng','07:00–18:00','Tour 150.000đ','Cẩm Thanh','ACTIVE','APPROVED');

SELECT setval(pg_get_serial_sequence('poi','id'), (SELECT MAX(id) FROM poi));

INSERT INTO poi_image (poi_id, file_path, order_num) VALUES
(1,'/uploads/poi-images/poi1/poi1_1.jpg',1),
(1,'/uploads/poi-images/poi1/poi1_2.jpg',2),
(1,'/uploads/poi-images/poi1/poi1_3.jpg',3),
(1,'/uploads/poi-images/poi1/poi1_4.jpg',4),
(1,'/uploads/poi-images/poi1/poi1_5.jpg',5),
(2,'/uploads/poi-images/poi2/poi2_1.jpg',1),
(2,'/uploads/poi-images/poi2/poi2_2.jpg',2),
(2,'/uploads/poi-images/poi2/poi2_3.jpg',3),
(2,'/uploads/poi-images/poi2/poi2_4.jpg',4),
(2,'/uploads/poi-images/poi2/poi2_5.jpg',5),
(3,'/uploads/poi-images/poi3/poi3_1.jpg',1),
(3,'/uploads/poi-images/poi3/poi3_2.jpg',2),
(3,'/uploads/poi-images/poi3/poi3_3.jpg',3),
(3,'/uploads/poi-images/poi3/poi3_4.jpg',4),
(3,'/uploads/poi-images/poi3/poi3_5.jpg',5),
(4,'/uploads/poi-images/poi4/poi4_1.jpg',1),
(4,'/uploads/poi-images/poi4/poi4_2.jpg',2),
(4,'/uploads/poi-images/poi4/poi4_3.jpg',3),
(4,'/uploads/poi-images/poi4/poi4_4.jpg',4),
(4,'/uploads/poi-images/poi4/poi4_5.jpg',5),
(5,'/uploads/poi-images/poi5/poi5_1.jpg',1),
(5,'/uploads/poi-images/poi5/poi5_2.jpg',2),
(5,'/uploads/poi-images/poi5/poi5_3.jpg',3),
(5,'/uploads/poi-images/poi5/poi5_4.jpg',4),
(5,'/uploads/poi-images/poi5/poi5_5.jpg',5),
(6,'/uploads/poi-images/poi6/poi6_1.jpg',1),
(6,'/uploads/poi-images/poi6/poi6_2.jpg',2),
(6,'/uploads/poi-images/poi6/poi6_3.jpg',3),
(6,'/uploads/poi-images/poi6/poi6_4.jpg',4),
(6,'/uploads/poi-images/poi6/poi6_5.jpg',5),
(7,'/uploads/poi-images/poi7/poi7_1.jpg',1),
(7,'/uploads/poi-images/poi7/poi7_2.jpg',2),
(7,'/uploads/poi-images/poi7/poi7_3.jpg',3),
(7,'/uploads/poi-images/poi7/poi7_4.jpg',4),
(7,'/uploads/poi-images/poi7/poi7_5.jpg',5),
(8,'/uploads/poi-images/poi8/poi8_1.jpg',1),
(8,'/uploads/poi-images/poi8/poi8_2.jpg',2),
(8,'/uploads/poi-images/poi8/poi8_3.jpg',3),
(8,'/uploads/poi-images/poi8/poi8_4.jpg',4),
(8,'/uploads/poi-images/poi8/poi8_5.jpg',5),
(9,'/uploads/poi-images/poi9/poi9_1.jpg',1),
(9,'/uploads/poi-images/poi9/poi9_2.jpg',2),
(9,'/uploads/poi-images/poi9/poi9_3.jpg',3),
(9,'/uploads/poi-images/poi9/poi9_4.jpg',4),
(9,'/uploads/poi-images/poi9/poi9_5.jpg',5),
(10,'/uploads/poi-images/poi10/poi10_1.jpg',1),
(10,'/uploads/poi-images/poi10/poi10_2.jpg',2),
(10,'/uploads/poi-images/poi10/poi10_3.jpg',3),
(10,'/uploads/poi-images/poi10/poi10_4.jpg',4),
(10,'/uploads/poi-images/poi10/poi10_5.jpg',5),
(11,'/uploads/poi-images/poi11/poi11_1.jpg',1),
(11,'/uploads/poi-images/poi11/poi11_2.jpg',2),
(11,'/uploads/poi-images/poi11/poi11_3.jpg',3),
(11,'/uploads/poi-images/poi11/poi11_4.jpg',4),
(11,'/uploads/poi-images/poi11/poi11_5.jpg',5),
(12,'/uploads/poi-images/poi12/poi12_1.jpg',1),
(12,'/uploads/poi-images/poi12/poi12_3.jpg',3),
(12,'/uploads/poi-images/poi12/poi12_4.jpg',4),
(12,'/uploads/poi-images/poi12/poi12_5.jpg',5),
(13,'/uploads/poi-images/poi13/poi13_1.jpg',1),
(13,'/uploads/poi-images/poi13/poi13_2.jpg',2),
(13,'/uploads/poi-images/poi13/poi13_3.jpg',3),
(13,'/uploads/poi-images/poi13/poi13_4.jpg',4),
(13,'/uploads/poi-images/poi13/poi13_5.jpg',5),
(14,'/uploads/poi-images/poi14/poi14_1.jpg',1),
(14,'/uploads/poi-images/poi14/poi14_2.jpg',2),
(14,'/uploads/poi-images/poi14/poi14_3.jpg',3),
(14,'/uploads/poi-images/poi14/poi14_4.jpg',4),
(14,'/uploads/poi-images/poi14/poi14_5.jpg',5),
(15,'/uploads/poi-images/poi15/poi15_1.jpg',1),
(15,'/uploads/poi-images/poi15/poi15_2.jpg',2),
(15,'/uploads/poi-images/poi15/poi15_3.jpg',3),
(15,'/uploads/poi-images/poi15/poi15_4.jpg',4),
(15,'/uploads/poi-images/poi15/poi15_5.jpg',5),
(16,'/uploads/poi-images/poi16/poi16_1.jpg',1),
(16,'/uploads/poi-images/poi16/poi16_2.jpg',2),
(16,'/uploads/poi-images/poi16/poi16_3.jpg',3),
(16,'/uploads/poi-images/poi16/poi16_4.jpg',4),
(16,'/uploads/poi-images/poi16/poi16_5.jpg',5),
(17,'/uploads/poi-images/poi17/poi17_1.jpg',1),
(17,'/uploads/poi-images/poi17/poi17_2.jpg',2),
(17,'/uploads/poi-images/poi17/poi17_3.jpg',3),
(17,'/uploads/poi-images/poi17/poi17_4.jpg',4),
(17,'/uploads/poi-images/poi17/poi17_5.jpg',5),
(18,'/uploads/poi-images/poi18/poi18_1.jpg',1),
(18,'/uploads/poi-images/poi18/poi18_2.jpg',2),
(18,'/uploads/poi-images/poi18/poi18_3.jpg',3),
(18,'/uploads/poi-images/poi18/poi18_4.jpg',4),
(18,'/uploads/poi-images/poi18/poi18_5.jpg',5),
(19,'/uploads/poi-images/poi19/poi19_1.jpg',1),
(19,'/uploads/poi-images/poi19/poi19_2.jpg',2),
(19,'/uploads/poi-images/poi19/poi19_3.jpg',3),
(19,'/uploads/poi-images/poi19/poi19_4.jpg',4),
(19,'/uploads/poi-images/poi19/poi19_5.jpg',5),
(20,'/uploads/poi-images/poi20/poi20_1.jpg',1),
(20,'/uploads/poi-images/poi20/poi20_2.jpg',2),
(20,'/uploads/poi-images/poi20/poi20_3.jpg',3),
(20,'/uploads/poi-images/poi20/poi20_4.jpg',4),
(20,'/uploads/poi-images/poi20/poi20_5.jpg',5);

-- ----- Du khách, thanh toán, lượt nghe mẫu (để màn hình thống kê có dữ liệu) -----
INSERT INTO guest_session (anonymous_device_id, language_code, created_at, device, country, last_active_at) VALUES
('dev-a1b2c3', 'vi', NOW() - INTERVAL '3 hours',  'mobile',  'Vietnam',       NOW() - INTERVAL '5 minutes'),
('dev-d4e5f6', 'en', NOW() - INTERVAL '2 hours',  'mobile',  'United States', NOW() - INTERVAL '30 minutes'),
('dev-g7h8i9', 'ja', NOW() - INTERVAL '1 hour',   'desktop', 'Japan',         NOW() - INTERVAL '20 minutes');

-- Dữ liệu demo: claim_secret_hash là hash giả để thỏa NOT NULL/UNIQUE; không claim được token thật.
INSERT INTO payment (session_id, provider, provider_txn_id, amount, currency, status, created_at, paid_at, claim_secret_hash) VALUES
(1,'VNPAY','DEMO-0001',20000,'VND','PAID',    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', encode(sha256('DEMO-0001-claim'::bytea),'hex')),
(2,'VNPAY','DEMO-0002',20000,'VND','PAID',    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', encode(sha256('DEMO-0002-claim'::bytea),'hex')),
(3,'VNPAY','DEMO-0003',20000,'VND','PENDING', NOW() - INTERVAL '1 hour',  NULL,                         encode(sha256('DEMO-0003-claim'::bytea),'hex'));

INSERT INTO listen_log (session_id, poi_id, language_code, trigger_method, listened_at, duration_seconds, is_completed) VALUES
(1, 1, 'vi', 'AUTO_GPS', NOW() - INTERVAL '170 minutes', 62, TRUE),
(1, 2, 'vi', 'TAP',      NOW() - INTERVAL '150 minutes', 40, FALSE),
(2, 1, 'en', 'AUTO_GPS', NOW() - INTERVAL '110 minutes', 75, TRUE),
(2, 3, 'en', 'TAP',      NOW() - INTERVAL '90 minutes',  58, TRUE);

INSERT INTO daily_statistic (stat_date, unique_visitors, total_visits, session_count, new_visitors, avg_duration_seconds, mobile_sessions, desktop_sessions) VALUES
(CURRENT_DATE - 2, 320, 540, 410, 210, 185, 363, 47),
(CURRENT_DATE - 1, 355, 600, 452, 240, 192, 407, 45),
(CURRENT_DATE,     120, 190, 150,  70, 170, 131, 19);


-- ----- Bản dịch tiếng Việt: lấy từ poi.original_description -----
-- App đọc translation 'vi' trước, fallback về original_description (xem AdminPoiContentService).
-- Seed sẵn để màn hình quản trị có nội dung gốc ngay; bản dịch ngôn ngữ khác tạo qua luồng
-- Preview -> Lưu (PENDING) -> Duyệt -> Tạo audio. Xóa khối này nếu không muốn seed.
INSERT INTO translation (poi_id, language_code, content, status)
SELECT id, 'vi', original_description, 'APPROVED'
FROM poi
WHERE original_description IS NOT NULL AND original_description <> '';

COMMIT;

-- Kiểm tra nhanh:
-- SELECT p.name, t.language_code, a.file_path
-- FROM poi p JOIN translation t ON t.poi_id=p.id LEFT JOIN audio a ON a.translation_id=t.id;
