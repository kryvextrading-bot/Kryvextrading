-- Sync all users to wallet_balances table
-- This script creates wallet balance entries for users who don't have them

-- First, let's see which users don't have wallet balances
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at as user_created_at
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE wb.user_id IS NULL
ORDER BY u.created_at;

-- Create wallet balances for all users who don't have them
-- We'll create entries for common cryptocurrencies

INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
    u.id,
    asset.asset,
    0.00 as available,  -- Start with zero balance
    0.00 as locked,    -- Start with zero locked balance
    u.created_at as created_at,
    NOW() as updated_at
FROM users u
CROSS JOIN (
    SELECT unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']) as asset
) asset
LEFT JOIN wallet_balances wb ON u.id = wb.user_id AND asset.asset = wb.asset
WHERE wb.user_id IS NULL
AND u.status = 'Active'  -- Only create for active users
ON CONFLICT (user_id, asset) DO NOTHING;

-- Verify the results
SELECT 
    u.email,
    COUNT(wb.id) as wallet_balance_count,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as assets
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
GROUP BY u.id, u.email
ORDER BY u.email;

-- Check for any users that still don't have wallet balances
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.status
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE wb.user_id IS NULL
ORDER BY u.email;
