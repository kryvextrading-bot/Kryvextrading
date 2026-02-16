-- Quick sync script - Run this first to fix immediate issue
-- This will create wallet balances for all active users who don't have them

-- Step 1: Check which users need wallet balances
SELECT 
    'Users needing wallet balances:' as status,
    COUNT(*) as count
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE wb.user_id IS NULL AND u.status = 'Active';

-- Step 2: Create wallet balances for missing users
INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
    u.id,
    asset.asset,
    0.00 as available,
    0.00 as locked,
    GREATEST(u.created_at, NOW() - INTERVAL '1 day') as created_at, -- Use user creation time or yesterday
    NOW() as updated_at
FROM users u
CROSS JOIN (
    SELECT unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']) as asset
) asset
LEFT JOIN wallet_balances wb ON u.id = wb.user_id AND asset.asset = wb.asset
WHERE wb.user_id IS NULL
AND u.status = 'Active'
ON CONFLICT (user_id, asset) DO NOTHING;

-- Step 3: Verify the results
SELECT 
    'After sync - Users with wallet balances:' as status,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT wb.user_id) as users_with_balances,
    COUNT(wb.id) as total_balance_records
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';

-- Step 4: Show detailed breakdown
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    COUNT(wb.id) as wallet_count,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as assets
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active'
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY u.email;
