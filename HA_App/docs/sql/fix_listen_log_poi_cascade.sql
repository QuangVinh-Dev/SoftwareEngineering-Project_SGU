BEGIN;

ALTER TABLE listen_log
    DROP CONSTRAINT IF EXISTS listen_log_poi_id_fkey;

ALTER TABLE listen_log
    ADD CONSTRAINT listen_log_poi_id_fkey
    FOREIGN KEY (poi_id) REFERENCES poi(id) ON DELETE CASCADE;

COMMIT;
