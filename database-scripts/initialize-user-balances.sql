-- Initialize all users with proper starting balances
-- This script gives all users a starting balance to ensure the wallet system works properly

-- Step 1: Check current balance status
SELECT 
    'Current Balance Status' as step,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN wb.available > 0 THEN wb.user_id END) as users_with_balance,
    COUNT(wb.id) as total_wallet_records,
    SUM(CASE WHEN wb.available > 0 THEN wb.available ELSE 0 END) as total_available_balance
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';

-- Step 2: Initialize all active users with starting balances
-- Give each user 1000 USDT as starting balance for testing
INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
    u.id,
    wb_init.asset,
    wb_init.available,
    wb_init.locked,
    COALESCE(u.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM users u
CROSS JOIN (
    VALUES 
        ('USDT', 1000.00, 0.00),
        ('BTC', 0.01, 0.00),
        ('ETH', 0.1, 0.00),
        ('BNB', 1.0, 0.00),
        ('ADA', 50.0, 0.00),
        ('SOL', 5.0, 0.00),
        ('XRP', 100.0, 0.00),
        ('DOGE', 1000.0, 0.00)
) AS wb_init(asset, available, locked)
LEFT JOIN wallet_balances wb_existing ON u.id = wb_existing.user_id AND wb_existing.asset = wb_init.asset
WHERE u.status = 'Active'
AND wb_existing.user_id IS NULL  -- Only create if balance doesn't exist
ON CONFLICT (user_id, asset) DO NOTHING;

-- Step 3: Verify the initialization
SELECT 
    'After Initialization' as step,
    u.email,
    COUNT(wb.id) as wallet_count,
    SUM(wb.available) as total_available,
    STRING_AGG(
      wb.asset || ':' || COALESCE(wb.available::text, '0'), 
      ', ' 
      ORDER BY wb.asset
    ) as balances
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active'
GROUP BY u.id, u.email
ORDER BY u.email;

-- Step 4: Show users who still need balances (if any)
SELECT 
    'Users Still Need Balances' as step,
    u.email,
    u.first_name,
    u.last_name,
    u.created_at
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active'
AND wb.user_id IS NULL
ORDER BY u.created_at;
