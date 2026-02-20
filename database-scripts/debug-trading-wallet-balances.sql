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

-- Step 3: Only create trading wallet balances if users explicitly transfer funds (no automatic creation)
-- This step is removed to ensure only real transferred amounts are shown
-- Trading wallets should only be created when users actually transfer funds

-- Step 4: Verify the trading wallet creation
SELECT 
    'After trading wallet creation' as step,
    user_id,
    COUNT(*) as total_balances,
    SUM(CASE WHEN asset LIKE '%_TRADING' THEN 1 ELSE 0 END) as trading_balances,
    SUM(CASE WHEN asset NOT LIKE '%_TRADING' THEN 1 ELSE 0 END) as regular_balances
FROM wallet_balances 
GROUP BY user_id;

-- Step 5: Show detailed breakdown for all users (no hardcoded user ID needed)
SELECT 
    'Detailed balance breakdown for all users' as step,
    u.email,
    wb.asset,
    wb.available,
    wb.locked,
    CASE 
        WHEN wb.asset LIKE '%_TRADING' THEN 'Trading'
        ELSE 'Funding'
    END as wallet_type
FROM wallet_balances wb
JOIN users u ON wb.user_id = u.id
ORDER BY 
    u.email,
    CASE 
        WHEN wb.asset LIKE '%_TRADING' THEN 2
        ELSE 1
    END,
    wb.asset;
