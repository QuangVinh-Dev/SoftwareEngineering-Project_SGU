ALTER TABLE poi
    ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_poi_merchant_created ON poi(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_poi_public_visibility ON poi(status, approval_status);

UPDATE poi_image image
SET file_path = '/poi-images/chua-cau.jpg'
FROM poi
WHERE image.poi_id = poi.id
  AND poi.name = 'Japanese Covered Bridge'
  AND image.order_num = 1
  AND image.file_path = '/uploads/poi/japanese_bridge_1.jpg';

INSERT INTO poi_image (poi_id, file_path, order_num)
SELECT poi.id, '/poi-images/chua-cau.jpg', 1
FROM poi
WHERE poi.name = 'Japanese Covered Bridge'
  AND NOT EXISTS (
      SELECT 1 FROM poi_image image
      WHERE image.poi_id = poi.id AND image.order_num = 1
  );
