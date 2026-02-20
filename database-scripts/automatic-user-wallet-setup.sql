-- Complete automatic user wallet setup system
-- This ensures all new users get wallet balances immediately upon registration

-- Step 1: Create a robust trigger function that handles all scenarios
DROP FUNCTION IF EXISTS auto_create_user_wallets() CASCADE;
DROP TRIGGER IF EXISTS on_user_insert_auto_wallets ON users;

CREATE OR REPLACE FUNCTION auto_create_user_wallets()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert standard wallet balances for new user immediately
    -- Use INSERT ... ON CONFLICT to handle any edge cases
    INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
    SELECT 
        NEW.id,
        unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']),
        0.00,
        0.00,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    ON CONFLICT (user_id, asset) DO NOTHING;
    
    -- Log the automatic wallet creation (optional)
    INSERT INTO admin_action_logs (admin_id, action_type, action_details, created_at)
    VALUES (
        NEW.id,
        'user_creation',  -- Use a valid action_type that should be allowed
        json_build_object(
            'user_id', NEW.id,
            'email', NEW.email,
            'assets_created', 8,
            'auto_created', true,
            'wallet_setup', 'automatic'
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger to fire immediately after user insertion
CREATE TRIGGER on_user_insert_auto_wallets
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_user_wallets();

-- Step 3: Also create a trigger for user updates (in case status changes to Active)
DROP FUNCTION IF EXISTS auto_create_wallets_on_status_change() CASCADE;
DROP TRIGGER IF EXISTS on_user_update_auto_wallets ON users;

CREATE OR REPLACE FUNCTION auto_create_wallets_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create wallets if user status changed to 'Active' and doesn't have wallets yet
    IF NEW.status = 'Active' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.status IS NULL) THEN
        INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
        SELECT 
            NEW.id,
            unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']),
            0.00,
            0.00,
            COALESCE(NEW.created_at, NOW()),
            NOW()
        ON CONFLICT (user_id, asset) DO NOTHING;
        
        -- Log the status change and wallet creation
        INSERT INTO admin_action_logs (admin_id, action_type, action_details, created_at)
        VALUES (
            NEW.id,
            'user_update',  -- Use a valid action_type
            json_build_object(
                'user_id', NEW.id,
                'email', NEW.email,
                'status_change', OLD.status || ' -> ' || NEW.status,
                'wallets_created', 8,
                'auto_created', true
            ),
            NOW()
        ) ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_update_auto_wallets
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_wallets_on_status_change();

-- Step 4: Create a backup function for manual sync (just in case)
CREATE OR REPLACE FUNCTION ensure_user_has_wallets(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    wallet_count INTEGER;
BEGIN
    -- Count existing wallets
    SELECT COUNT(*) INTO wallet_count
    FROM wallet_balances 
    WHERE user_id = p_user_id;
    
    -- If user has less than 8 wallets, create missing ones
    IF wallet_count < 8 THEN
        INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
        SELECT 
            p_user_id,
            unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']),
            0.00,
            0.00,
            NOW(),
            NOW()
        ON CONFLICT (user_id, asset) DO NOTHING;
        
        RETURN 'Created missing wallet balances for user';
    ELSE
        RETURN 'User already has complete wallet balances';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Test the trigger with a sample user (commented out - uncomment to test)
/*
INSERT INTO users (id, email, first_name, last_name, status, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'test-auto@example.com',
    'Test',
    'Auto',
    'Active',
    NOW(),
    NOW()
);

-- Check if wallets were created automatically
SELECT 
    u.email,
    COUNT(wb.id) as wallet_count,
    STRING_AGG(wb.asset, ', ' ORDER BY wb.asset) as assets
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.email = 'test-auto@example.com'
GROUP BY u.email;
*/

-- Step 6: Verification query to check the system
SELECT 
    'Trigger System Status' as status,
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT wb.user_id) as users_with_wallets,
    COUNT(wb.id) as total_wallet_records,
    CASE 
        WHEN COUNT(DISTINCT u.id) = COUNT(DISTINCT wb.user_id) THEN '✅ System Working'
        ELSE '⚠️ Needs Attention'
    END as system_health
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';
