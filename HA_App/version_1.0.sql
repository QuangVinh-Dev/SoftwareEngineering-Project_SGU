-- =====================================================================
-- version_1.0.sql
-- AUTOMATIC MULTILINGUAL ANNOTATION SYSTEM FOR HOI AN ANCIENT TOWN
-- PostgreSQL | Create tables + attributes + sample data
-- =====================================================================

-- ---------- DROP (can be run multiple times) ----------
DROP TABLE IF EXISTS
    users_online, access_session, listen_log, audio, voice,
    translation, poi_image, menu_item, poi, guest_session, qr_code, language,
    action_log, notification, merchant, account,
    role_permission, role, config, daily_statistic
CASCADE;

-- =====================================================================
-- 1. CREATE TABLES
-- =====================================================================

-- ----- Authorization -----
CREATE TABLE role (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    priority    INT NOT NULL DEFAULT 0
);

CREATE TABLE role_permission (
    role_id     INT         NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_code VARCHAR(50) NOT NULL,          -- E.g.: POI_EDIT, USER_MANAGE
    PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE account (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_id         INT          NOT NULL REFERENCES role(id),
    username        VARCHAR(50)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    email           VARCHAR(150) UNIQUE,
    account_type    VARCHAR(20)  NOT NULL DEFAULT 'ADMIN',   -- ADMIN / MERCHANT
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE / LOCKED
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE merchant (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id      INT          NOT NULL UNIQUE REFERENCES account(id),
    name            VARCHAR(150) NOT NULL,
    phone_number    VARCHAR(20),
    address         VARCHAR(255),
    approval_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING', -- PENDING / APPROVED / REJECTED
    registered_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    approved_at     TIMESTAMP
);

CREATE TABLE notification (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id  INT          NOT NULL REFERENCES account(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    content     TEXT,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE action_log (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id  INT          NOT NULL REFERENCES account(id),
    action      VARCHAR(255) NOT NULL,
    object_type VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ----- Language / Voice -----
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
    tts_code        VARCHAR(100) NOT NULL,       -- TTS service voice code
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE
);

-- ----- POI & Content -----
CREATE TABLE poi (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id     INT          REFERENCES merchant(id) ON DELETE SET NULL,
    name            VARCHAR(200) NOT NULL,
    latitude        DECIMAL(9,6) NOT NULL,
    longitude       DECIMAL(9,6) NOT NULL,
    radius          INT          NOT NULL DEFAULT 30,   -- meters, activation radius
    priority_level  INT          NOT NULL DEFAULT 0,
    original_description TEXT,
    direction_link  VARCHAR(500),
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE menu_item (
    id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id  INT          NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    name    VARCHAR(150) NOT NULL,
    price   DECIMAL(12,0) NOT NULL DEFAULT 0,
    description VARCHAR(255)
);

CREATE TABLE poi_image (
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id      INT          NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    file_path   VARCHAR(500) NOT NULL,
    order_num   INT          NOT NULL DEFAULT 1
);

CREATE TABLE translation (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poi_id          INT         NOT NULL REFERENCES poi(id) ON DELETE CASCADE,
    language_code   VARCHAR(10) NOT NULL REFERENCES language(code),
    content         TEXT        NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (poi_id, language_code)
);

CREATE TABLE audio (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    translation_id  INT          NOT NULL REFERENCES translation(id) ON DELETE CASCADE,
    voice_id        INT          NOT NULL REFERENCES voice(id),
    source          VARCHAR(20)  NOT NULL DEFAULT 'TTS',   -- TTS / UPLOAD
    file_path       VARCHAR(500) NOT NULL,
    duration_seconds INT,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ----- Guest / QR / Session -----
CREATE TABLE qr_code (
    id              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(100) NOT NULL UNIQUE,
    image_path      VARCHAR(500),
    expiration_date TIMESTAMP,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE guest_session (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anonymous_device_id     VARCHAR(100) NOT NULL UNIQUE,      -- anonymous device identifier
    language_code           VARCHAR(10)  REFERENCES language(code),
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    qr_code_id              INT          REFERENCES qr_code(id)   -- each QR scan creates a session
);

CREATE TABLE access_session (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anonymous_device_id     VARCHAR(100) NOT NULL REFERENCES guest_session(anonymous_device_id) ON DELETE CASCADE,
    start_time              TIMESTAMP NOT NULL DEFAULT NOW(),
    end_time                TIMESTAMP,
    device                  VARCHAR(30),    -- mobile / desktop / tablet
    browser                 VARCHAR(50),
    operating_system        VARCHAR(50),
    country                 VARCHAR(100),
    language_used           VARCHAR(10),
    ip_hash                 VARCHAR(100)
);

CREATE TABLE users_online (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anonymous_device_id     VARCHAR(100) NOT NULL UNIQUE REFERENCES guest_session(anonymous_device_id) ON DELETE CASCADE,
    last_activity_time      TIMESTAMP    NOT NULL DEFAULT NOW(),
    current_page            VARCHAR(200)
);

CREATE TABLE listen_log (
    id                      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    anonymous_device_id     VARCHAR(100) NOT NULL REFERENCES guest_session(anonymous_device_id) ON DELETE CASCADE,
    poi_id                  INT          NOT NULL REFERENCES poi(id),
    language_code           VARCHAR(10)  REFERENCES language(code),
    activation_method       VARCHAR(30),   -- GPS / QR / MANUAL
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW(),
    duration_seconds        INT,
    is_completed            BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ----- Independent tables (no foreign keys) -----
CREATE TABLE config (
    key     VARCHAR(100) PRIMARY KEY,
    value   TEXT,
    description VARCHAR(255)
);

CREATE TABLE daily_statistic (
    date                    DATE PRIMARY KEY,
    unique_visitors         INT NOT NULL DEFAULT 0,
    total_visits            INT NOT NULL DEFAULT 0,
    total_sessions          INT NOT NULL DEFAULT 0,
    new_visitors            INT NOT NULL DEFAULT 0,
    average_duration_seconds INT NOT NULL DEFAULT 0,
    mobile_percentage       DECIMAL(5,2),
    desktop_percentage      DECIMAL(5,2),
    top_country             VARCHAR(100),
    top_language            VARCHAR(100)
);

-- ----- Index suggestions -----
CREATE INDEX idx_poi_coordinates        ON poi(latitude, longitude);
CREATE INDEX idx_audio_translation_id   ON audio(translation_id);
CREATE INDEX idx_translation_poi_language_status
                                        ON translation(poi_id, language_code, status);
CREATE INDEX idx_listen_log_poi         ON listen_log(poi_id);
CREATE INDEX idx_listen_log_created_at  ON listen_log(created_at);
CREATE INDEX idx_access_session_device  ON access_session(anonymous_device_id);
CREATE INDEX idx_notification_account   ON notification(account_id, is_read);

-- =====================================================================
-- 2. SAMPLE DATA
-- (ids auto-increment from 1, so FKs below assume running on fresh DB)
-- =====================================================================

INSERT INTO role (name, description, priority) VALUES
('SUPER_ADMIN',   'System administrator',                    100),
('ADMIN',         'Content administrator',                   50),
('MERCHANT', 'Merchant / Shop owner in ancient town', 10);

INSERT INTO role_permission (role_id, permission_code) VALUES
(1,'POI_EDIT'),(1,'USER_MANAGE'),(1,'CONFIG_EDIT'),(1,'REPORT_VIEW'),
(2,'POI_EDIT'),(2,'REPORT_VIEW'),
(3,'POI_EDIT_OWN'),(3,'MENU_EDIT_OWN');

INSERT INTO account (role_id, username, password_hash, full_name, email, account_type, status) VALUES
(1,'admin',     '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Administrator',  'admin@hoian.vn',     'ADMIN',    'ACTIVE'),
(2,'editor01', '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234', 'Nguyen Van An',  'an.nv@hoian.vn',     'ADMIN',    'ACTIVE'),
(3,'caolau_bamy','$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234','Tran Thi My',    'my.tt@gmail.com',    'MERCHANT', 'ACTIVE'),
(3,'banhmi_phuong','$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234','Le Thi Phuong','phuong.lt@gmail.com', 'MERCHANT', 'ACTIVE');

INSERT INTO merchant (account_id, name, phone_number, address, approval_status, registered_at, approved_at) VALUES
(3,'Cao Lau Ba My',   '0905123456','26 Thai Phien, Hoi An','APPROVED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
(4,'Banh Mi Phuong',  '0905654321','2 Phan Chau Trinh, Hoi An','APPROVED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days');

INSERT INTO notification (account_id, title, content, is_read) VALUES
(3,'Merchant approved','Your shop Cao Lau Ba My has been approved.', TRUE),
(4,'Merchant approved','Your shop Banh Mi Phuong has been approved.', FALSE),
(2,'New translation','English translation of Japanese Covered Bridge is pending review.', FALSE);

INSERT INTO action_log (account_id, action, object_type) VALUES
(1,'User login','ACCOUNT'),
(2,'Update POI description','POI#1'),
(2,'Add English translation','TRANSLATION#2'),
(3,'Add Cao Lau menu item','MENU_ITEM#1');

INSERT INTO language (code, name, is_active, is_default) VALUES
('vi','Vietnamese', TRUE, TRUE),
('en','English',    TRUE, FALSE),
('ja','Japanese',   TRUE, FALSE),
('ko','Korean',     TRUE, FALSE),
('zh','Chinese',    TRUE, FALSE);

INSERT INTO voice (language_code, name, tts_code, is_active) VALUES
('vi','Hoai My (female)',  'vi-VN-HoaiMyNeural',  TRUE),
('vi','Nam Minh (male)','vi-VN-NamMinhNeural', TRUE),
('en','Jenny (female)','en-US-JennyNeural',   TRUE),
('ja','Nanami (female)','ja-JP-NanamiNeural', TRUE),
('ko','SunHi (female)','ko-KR-SunHiNeural',   TRUE),
('zh','Xiaoxiao (female)','zh-CN-XiaoxiaoNeural', TRUE);

INSERT INTO poi (merchant_id, name, latitude, longitude, radius, priority_level, original_description, direction_link, status) VALUES
(NULL,'Japanese Covered Bridge',15.877413,108.326170,40,10,
 'Built by Japanese in early 17th century, it is a symbol of Hoi An Ancient Town.',
 'https://maps.google.com/?q=15.877413,108.326170','ACTIVE'),
(NULL,'Phuc Kien Assembly Hall',15.877050,108.328160,30,8,
 'Assembly hall of the Fujian Chinese community, dedicated to the Goddess of the Sea.',
 'https://maps.google.com/?q=15.877050,108.328160','ACTIVE'),
(1,'Cao Lau Ba My',15.877900,108.329600,25,5,
 'Long-established cao lau restaurant, serving a specialty found only in Hoi An.',
 'https://maps.google.com/?q=15.877900,108.329600','ACTIVE'),
(2,'Banh Mi Phuong',15.877820,108.328100,20,5,
 'Famous banh mi shop known to many international tourists.',
 'https://maps.google.com/?q=15.877820,108.328100','ACTIVE');

INSERT INTO menu_item (poi_id, name, price, description) VALUES
(3,'Cao Lau Mixed', 45000,'Cao lau noodles, roasted pork, fresh vegetables, pork rinds'),
(3,'Quang Noodles with Chicken',      40000,'Rich quang noodles with broth'),
(3,'Hoi An Chicken Rice',    45000,'Shredded chicken rice, Vietnamese coriander'),
(4,'Special Banh Mi with Pork',35000,'Banh mi with cold cuts, pate, vegetables, special sauce'),
(4,'Banh Mi with Egg',    25000,'Banh mi with fried egg');

INSERT INTO poi_image (poi_id, file_path, order_num) VALUES
(1,'/uploads/poi/japanese_bridge_1.jpg',1),
(1,'/uploads/poi/japanese_bridge_2.jpg',2),
(2,'/uploads/poi/phuc_kien_1.jpg',1),
(3,'/uploads/poi/cao_lau_1.jpg',1),
(4,'/uploads/poi/banh_mi_phuong_1.jpg',1);

INSERT INTO translation (poi_id, language_code, content, status) VALUES
(1,'vi','Chùa Cầu được người Nhật xây dựng vào đầu thế kỷ 17, là biểu tượng của phố cổ Hội An.','APPROVED'),
(1,'en','The Japanese Covered Bridge was built in the early 17th century and is a symbol of Hoi An Ancient Town.','APPROVED'),
(1,'ja','来遠橋は17世紀初頭に日本人によって建てられた、ホイアン旧市街の象徴です。','APPROVED'),
(2,'vi','Hội quán Phúc Kiến là nơi sinh hoạt của cộng đồng người Hoa gốc Phúc Kiến.','APPROVED'),
(2,'en','The Phuc Kien Assembly Hall is the gathering place of the Fujian Chinese community.','APPROVED'),
(3,'vi','Cao lầu là món mì đặc sản chỉ có ở Hội An.','APPROVED'),
(3,'en','Cao lau is a noodle dish found only in Hoi An.','PENDING');

INSERT INTO audio (translation_id, voice_id, source, file_path, duration_seconds) VALUES
(1,1,'TTS','/uploads/audio/poi1_vi.mp3',32),
(2,3,'TTS','/uploads/audio/poi1_en.mp3',29),
(3,4,'TTS','/uploads/audio/poi1_ja.mp3',31),
(4,1,'TTS','/uploads/audio/poi2_vi.mp3',25),
(5,3,'TTS','/uploads/audio/poi2_en.mp3',24);

INSERT INTO qr_code (code, image_path, expiration_date, status) VALUES
('QR-HOIAN-0001','/uploads/qr/qr_0001.png', NOW() + INTERVAL '365 days','ACTIVE'),
('QR-HOIAN-0002','/uploads/qr/qr_0002.png', NOW() + INTERVAL '365 days','ACTIVE'),
('QR-HOIAN-0003','/uploads/qr/qr_0003.png', NOW() - INTERVAL '1 day',   'EXPIRED');

INSERT INTO guest_session (anonymous_device_id, language_code, qr_code_id) VALUES
('dev-a1b2c3','en',1),
('dev-d4e5f6','vi',1),
('dev-g7h8i9','ja',2),
('dev-j0k1l2','ko',NULL);

INSERT INTO access_session (anonymous_device_id, start_time, end_time, device, browser, operating_system, country, language_used, ip_hash) VALUES
('dev-a1b2c3', NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '1 hour 30 minutes','mobile','Chrome','Android','United States','en','h_9f8a1c'),
('dev-d4e5f6', NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '2 hours 40 minutes','mobile','Safari','iOS','Vietnam','vi','h_77be20'),
('dev-g7h8i9', NOW() - INTERVAL '1 hour',   NULL,'mobile','Safari','iOS','Japan','ja','h_c41d90'),
('dev-j0k1l2', NOW() - INTERVAL '30 minutes',NULL,'desktop','Edge','Windows','Korea','ko','h_02ab55');

INSERT INTO users_online (anonymous_device_id, last_activity_time, current_page) VALUES
('dev-g7h8i9', NOW(), '/poi/1'),
('dev-j0k1l2', NOW(), '/poi/2');

INSERT INTO listen_log (anonymous_device_id, poi_id, language_code, activation_method, created_at, duration_seconds, is_completed) VALUES
('dev-a1b2c3',1,'en','GPS',     NOW() - INTERVAL '1 hour 50 minutes', 29, TRUE),
('dev-a1b2c3',2,'en','GPS',     NOW() - INTERVAL '1 hour 40 minutes', 12, FALSE),
('dev-d4e5f6',1,'vi','QR',      NOW() - INTERVAL '2 hours 50 minutes',32, TRUE),
('dev-g7h8i9',1,'ja','QR',      NOW() - INTERVAL '50 minutes',        31, TRUE),
('dev-j0k1l2',2,'ko','MANUAL',NOW() - INTERVAL '20 minutes',        10, FALSE);

INSERT INTO config (key, value, description) VALUES
('GPS_RADIUS_DEFAULT','30','Default activation radius (meters)'),
('TTS_PROVIDER','azure','Text-to-Speech provider'),
('ONLINE_TIMEOUT_SECONDS','120','Timeout to mark user as offline'),
('DEFAULT_LANGUAGE','vi','Default language');

INSERT INTO daily_statistic (date, unique_visitors, total_visits, total_sessions, new_visitors, average_duration_seconds, mobile_percentage, desktop_percentage, top_country, top_language) VALUES
(CURRENT_DATE - 2, 320, 540, 410, 210, 185, 88.50, 11.50, 'Vietnam', 'vi'),
(CURRENT_DATE - 1, 355, 600, 452, 240, 192, 90.10,  9.90, 'Vietnam', 'en'),
(CURRENT_DATE,     120, 190, 150,  70, 170, 87.00, 13.00, 'United States', 'en');

-- Quick check
-- SELECT p.name, t.language_code, a.file_path
-- FROM poi p JOIN translation t ON t.poi_id=p.id LEFT JOIN audio a ON a.translation_id=t.id;
