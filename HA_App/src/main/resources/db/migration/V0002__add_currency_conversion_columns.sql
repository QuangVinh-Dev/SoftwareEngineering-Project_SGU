-- Migration to add currency conversion columns to payment table
ALTER TABLE payment
    ADD COLUMN original_amount NUMERIC(18,2),
    ADD COLUMN original_currency VARCHAR(3),
    ADD COLUMN exchange_rate NUMERIC(18,6),
    ADD COLUMN exchange_rate_fetched_at TIMESTAMP;
