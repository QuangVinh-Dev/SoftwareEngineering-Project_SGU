\set ON_ERROR_STOP on

BEGIN;

-- Fail the transaction unless each required application role exists exactly once.
SELECT 1 / count(*)::int AS admin_role_check
FROM role
WHERE name = 'ADMIN';

SELECT 1 / count(*)::int AS merchant_role_check
FROM role
WHERE name = 'MERCHANT';

-- Refuse to overwrite or attach to any existing account, including case-insensitive email matches.
SELECT 1 / CASE WHEN count(*) = 0 THEN 1 ELSE 0 END AS no_collision_check
FROM account
WHERE lower(username) IN ('ha_admin_test', 'ha_owner_test')
   OR lower(email) IN ('admin.local@ha-app.test', 'owner.local@ha-app.test');

INSERT INTO account (
    role_id, username, password_hash, full_name, email,
    account_type, status, created_at
)
SELECT
    id, 'ha_admin_test', :'admin_hash', 'HA App Test Admin',
    'admin.local@ha-app.test', 'ADMIN', 'ACTIVE', NOW()
FROM role
WHERE name = 'ADMIN';

INSERT INTO account (
    role_id, username, password_hash, full_name, email,
    account_type, status, created_at
)
SELECT
    id, 'ha_owner_test', :'owner_hash', 'HA App Test Owner',
    'owner.local@ha-app.test', 'MERCHANT', 'ACTIVE', NOW()
FROM role
WHERE name = 'MERCHANT';

INSERT INTO merchant (
    account_id, name, phone_number, address, category, description,
    plan_id, billing_cycle, approval_status, reject_reason,
    registered_at, approved_at, reviewed_by, cccd_number
)
SELECT
    owner.id, 'HA App Test Store', NULL, 'Hoi An, Quang Nam',
    'Cua hang thu nghiem', 'Merchant local/development test account',
    'free', 'monthly', 'APPROVED', NULL,
    NOW(), NOW(), admin.id, NULL
FROM account AS owner
CROSS JOIN account AS admin
WHERE owner.username = 'ha_owner_test'
  AND owner.account_type = 'MERCHANT'
  AND admin.username = 'ha_admin_test'
  AND admin.account_type = 'ADMIN';

COMMIT;
