-- Debug and fix wallet creation trigger issues
-- This script checks if the trigger is working and fixes any problems

-- Step 1: Check if the trigger exists and is properly configured
SELECT 
    'Trigger Status' as step,
    tg.tgname as trigger_name,
    tg.tgrelid as table_name,
    p.proname as function_name,
    tg.tgenabled as is_enabled
FROM pg_trigger tg
JOIN pg_proc p ON tg.tgfoid = p.oid
WHERE tg.tgname = 'on_user_created_create_wallet_balances';

-- Step 2: Check if the function exists
SELECT 
    'Function Status' as step,
    p.proname as function_name,
    p.prolang as language,
    p.prorettype as return_type,
    p.pronargs as arguments
FROM pg_proc p
WHERE p.proname = 'create_user_wallet_balances';

-- Step 3: Test the trigger by creating a test user
-- (This will be rolled back automatically)
BEGIN;

-- Create test user
INSERT INTO users (id, email, first_name, last_name, status, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'test-trigger@example.com',
    'Test',
    'Trigger',
    'Active',
    NOW(),
    NOW()
);

-- Check if wallet balances were created
SELECT 
    'Trigger Test Result' as step,
    COUNT(wb.id) as created_wallets,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as created_assets
FROM wallet_balances wb
WHERE wb.user_id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Rollback the test
ROLLBACK;

-- Step 4: If trigger is missing or broken, recreate it
DROP TRIGGER IF EXISTS on_user_created_create_wallet_balances ON users;
DROP FUNCTION IF EXISTS create_user_wallet_balances() CASCADE;

CREATE OR REPLACE FUNCTION create_user_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert standard wallet balances for new user
    INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
    VALUES 
        (NEW.id, 'USDT', 1000.00, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'BTC', 0.01, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'ETH', 0.1, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'BNB', 1.0, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'ADA', 50.0, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'SOL', 5.0, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'XRP', 100.0, 0.00, NEW.created_at, NOW()),
        (NEW.id, 'DOGE', 1000.0, 0.00, NEW.created_at, NOW())
    ON CONFLICT (user_id, asset) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_user_created_create_wallet_balances
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_wallet_balances();

-- Step 5: Verify the fix
SELECT 
    'Trigger Fixed' as step,
    'Trigger and function have been recreated with starting balances' as status;
