-- Debug and fix trading wallet balance issue
-- This script checks and fixes trading wallet balance fetching

-- Step 1: Check if user has any trading wallet balances (with _TRADING suffix)
SELECT 
    'Trading wallet balances check' as step,
    user_id,
    COUNT(*) as trading_balance_count,
    STRING_AGG(asset, ', ' ORDER BY asset) as trading_assets
FROM wallet_balances 
WHERE asset LIKE '%_TRADING'
GROUP BY user_id;

-- Step 2: Check if user has regular wallet balances
SELECT 
    'Regular wallet balances check' as step,
    user_id,
    COUNT(*) as regular_balance_count,
    STRING_AGG(asset, ', ' ORDER BY asset) as regular_assets
FROM wallet_balances 
WHERE asset NOT LIKE '%_TRADING'
GROUP BY user_id;

-- Step 3: Create trading wallet balances for existing users (if they don't exist)
INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
    wb.user_id,
    wb.asset || '_TRADING' as trading_asset,
    -- Start with 20% of available balance as trading balance
    ROUND(wb.available * 0.2, 8) as trading_available,
    0 as locked,
    wb.created_at,
    NOW() as updated_at
FROM wallet_balances wb
LEFT JOIN wallet_balances wb_trading ON wb.user_id = wb_trading.user_id AND wb_trading.asset = wb.asset || '_TRADING'
WHERE wb_trading.user_id IS NULL  -- Only create if trading wallet doesn't exist
AND wb.asset NOT LIKE '%_TRADING'  -- Skip existing trading wallets
AND wb.available > 0  -- Only if there's available balance
ON CONFLICT (user_id, asset) DO NOTHING;

-- Step 4: Verify the trading wallet creation
SELECT 
    'After trading wallet creation' as step,
    user_id,
    COUNT(*) as total_balances,
    SUM(CASE WHEN asset LIKE '%_TRADING' THEN 1 ELSE 0 END) as trading_balances,
    SUM(CASE WHEN asset NOT LIKE '%_TRADING' THEN 1 ELSE 0 END) as regular_balances
FROM wallet_balances 
GROUP BY user_id;

-- Step 5: Show detailed breakdown for a specific user (replace with actual user_id)
SELECT 
    'Detailed balance breakdown' as step,
    asset,
    available,
    locked,
    CASE 
        WHEN asset LIKE '%_TRADING' THEN 'Trading'
        ELSE 'Funding'
    END as wallet_type
FROM wallet_balances 
WHERE user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user ID
ORDER BY 
    CASE 
        WHEN asset LIKE '%_TRADING' THEN 2
        ELSE 1
    END,
    asset;
