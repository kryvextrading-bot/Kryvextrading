-- Clean up script to fix remaining issues
-- 1. Remove the duplicate USDT_TRADING asset for laurentjean535@gmail.com
-- 2. Create a simple trigger without PL/pgSQL conflicts

-- Step 1: Remove the duplicate USDT_TRADING asset (keep only regular USDT)
DELETE FROM wallet_balances 
WHERE asset = 'USDT_TRADING' 
AND user_id = (SELECT id FROM users WHERE email = 'laurentjean535@gmail.com');

-- Step 2: Verify the cleanup
SELECT 
    u.email,
    COUNT(wb.id) as wallet_count,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as assets
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active'
GROUP BY u.id, u.email
ORDER BY u.email;

-- Step 3: Create a simple trigger function (no naming conflicts)
DROP FUNCTION IF EXISTS create_user_wallet_balances() CASCADE;
DROP TRIGGER IF EXISTS on_user_created_create_wallet_balances ON users;

CREATE OR REPLACE FUNCTION create_user_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert standard wallet balances for new user
    INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
    VALUES 
        (NEW.id, 'USDT', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'BTC', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'ETH', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'BNB', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'ADA', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'SOL', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'XRP', 0.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'DOGE', 0.00, 0.00, NEW.created_at, NOW())
    ON CONFLICT (user_id, asset) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
CREATE TRIGGER on_user_created_create_wallet_balances
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_wallet_balances();

-- Step 5: Final verification
SELECT 
    'Final Status' as step,
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
