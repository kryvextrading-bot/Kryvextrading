-- Fixed version - Simple approach without PL/pgSQL conflicts
-- Run this script to sync all users to wallet_balances

-- Step 1: Check current status
SELECT 
    'Current Status' as step,
    COUNT(DISTINCT u.id) as total_active_users,
    COUNT(DISTINCT wb.user_id) as users_with_balances,
    (COUNT(DISTINCT u.id) - COUNT(DISTINCT wb.user_id)) as users_missing_balances
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';

-- Step 2: Create wallet balances for all missing users
INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
    u.id,
    asset.asset,
    0.00 as available,
    0.00 as locked,
    GREATEST(u.created_at, NOW() - INTERVAL '1 day') as created_at,
    NOW() as updated_at
FROM users u
CROSS JOIN (
    SELECT unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']) as asset
) asset
LEFT JOIN wallet_balances wb ON u.id = wb.user_id AND asset.asset = wb.asset
WHERE wb.user_id IS NULL
AND u.status = 'Active'
ON CONFLICT (user_id, asset) DO NOTHING;

-- Step 3: Show results
SELECT 
    'After Sync' as step,
    COUNT(DISTINCT u.id) as total_active_users,
    COUNT(DISTINCT wb.user_id) as users_with_balances,
    COUNT(wb.id) as total_balance_records,
    CASE 
        WHEN COUNT(DISTINCT u.id) = COUNT(DISTINCT wb.user_id) THEN '✅ All users synced!'
        ELSE '❌ Some users still missing balances'
    END as sync_status
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';

-- Step 4: Detailed breakdown by user
SELECT 
    u.email,
    u.first_name,
    u.last_name,
    COUNT(wb.id) as wallet_count,
    CASE 
        WHEN COUNT(wb.id) = 8 THEN '✅ Complete'
        WHEN COUNT(wb.id) > 0 THEN '⚠️ Partial (' || COUNT(wb.id) || '/8)'
        ELSE '❌ Missing'
    END as status,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as assets
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active'
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY u.email;
