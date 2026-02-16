-- Create trigger function to automatically create wallet balances for new users
CREATE OR REPLACE FUNCTION create_user_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
    -- Create wallet balance entries for common cryptocurrencies for new users
    INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
    SELECT 
        NEW.id,
        asset.asset,
        0.00 as available,
        0.00 as locked,
        NEW.created_at,
        NOW() as updated_at
    FROM (
        SELECT unnest(ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE']) as asset
    ) asset
    ON CONFLICT (user_id, asset) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after a new user is inserted
DROP TRIGGER IF EXISTS on_user_created_create_wallet_balances ON users;
CREATE TRIGGER on_user_created_create_wallet_balances
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_wallet_balances();

-- Also create a function to manually sync existing users
CREATE OR REPLACE FUNCTION sync_all_users_to_wallet_balances()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    assets_created INTEGER,
    sync_status TEXT
) AS $$
DECLARE
    user_record RECORD;
    assets_to_create TEXT[] := ARRAY['USDT', 'BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'XRP', 'DOGE'];
    asset_record TEXT;
    created_count INTEGER;
BEGIN
    -- Loop through all active users
    FOR user_record IN 
        SELECT id, email FROM users WHERE status = 'Active'
    LOOP
        created_count := 0;
        
        -- Create wallet balances for each asset if they don't exist
        FOREACH asset_record IN ARRAY assets_to_create
        LOOP
            INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
            VALUES (user_record.id, asset_record, 0.00, 0.00, NOW(), NOW())
            ON CONFLICT (user_id, asset) DO NOTHING;
            
            -- Check if we actually inserted a new record
            GET DIAGNOSTICS created_count = ROW_COUNT;
            IF created_count > 0 THEN
                created_count := created_count + 1;
            END IF;
        END LOOP;
        
        -- Return the sync status for this user
        user_id := user_record.id;
        email := user_record.email;
        assets_created := created_count;
        sync_status := CASE 
            WHEN created_count > 0 THEN 'Created new wallet balances'
            ELSE 'Already had wallet balances'
        END;
        
        RETURN NEXT;
    END LOOP;
    
END;
$$ LANGUAGE plpgsql;

-- Run the sync function immediately
SELECT * FROM sync_all_users_to_wallet_balances();

-- Verify the final state
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT wb.user_id) as users_with_wallet_balances,
    COUNT(wb.id) as total_wallet_balance_records
FROM users u
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
WHERE u.status = 'Active';
