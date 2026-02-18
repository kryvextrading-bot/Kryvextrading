-- Quick fix to update trading_locks table structure
-- This will rename 'currency' to 'asset' to match our service

ALTER TABLE trading_locks 
RENAME COLUMN currency TO asset;
