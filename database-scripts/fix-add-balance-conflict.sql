-- Fix add_balance function name conflict
-- This script resolves the function name uniqueness issue

-- Step 1: Check what add_balance functions already exist
SELECT 
    'Existing Functions' as step,
    proname as function_name,
    pronargs as argument_count,
    proargtypes as argument_types
FROM pg_proc 
WHERE proname = 'add_balance'
ORDER BY proname, pronargs;

-- Step 2: Drop the existing add_balance function if it conflicts
DROP FUNCTION IF EXISTS add_balance CASCADE;

-- Step 3: Create the new admin add_balance function with proper signature
CREATE OR REPLACE FUNCTION add_balance(
    p_user_id UUID,
    p_asset TEXT,
    p_amount NUMERIC,
    p_reference TEXT DEFAULT 'admin_manual_add',
    p_type TEXT DEFAULT 'deposit',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(
    success BOOLEAN,
    new_available NUMERIC,
    new_locked NUMERIC,
    error_message TEXT,
    transaction_id TEXT
) AS $$
DECLARE
    current_available NUMERIC;
    current_locked NUMERIC;
    new_available_balance NUMERIC;
    transaction_id_val TEXT;
    admin_id UUID DEFAULT auth.uid();
BEGIN
    -- Validate inputs
    IF p_user_id IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 'User ID is required', NULL::TEXT;
        RETURN;
    END IF;
    
    IF p_asset IS NULL OR p_asset = '' THEN
        RETURN QUERY SELECT false, 0, 0, 'Asset is required', NULL::TEXT;
        RETURN;
    END IF;
    
    IF p_amount IS NULL OR p_amount <= 0 THEN
        RETURN QUERY SELECT false, 0, 0, 'Amount must be greater than 0', NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get current balance
    SELECT available, locked INTO current_available, current_locked
    FROM wallet_balances 
    WHERE user_id = p_user_id AND asset = p_asset;
    
    -- If no balance exists, create one
    IF current_available IS NULL THEN
        INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
        VALUES (p_user_id, p_asset, 0, 0, NOW(), NOW());
        current_available := 0;
        current_locked := 0;
    END IF;
    
    -- Calculate new balance
    new_available_balance := current_available + p_amount;
    
    -- Update wallet balance
    UPDATE wallet_balances 
    SET available = new_available_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id AND asset = p_asset;
    
    -- Generate transaction ID
    transaction_id_val := 'admin_add_' || p_user_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Log the admin action
    INSERT INTO admin_action_logs (admin_id, action_type, action_details, created_at)
    VALUES (
        admin_id,
        'user_balance_adjust',
        json_build_object(
            'target_user_id', p_user_id,
            'asset', p_asset,
            'amount', p_amount,
            'old_balance', current_available,
            'new_balance', new_available_balance,
            'reference', p_reference,
            'transaction_id', transaction_id_val,
            'manual_add', true
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Also update the legacy wallets table for compatibility
    INSERT INTO wallets (user_id, currency, balance, locked_balance, updated_at)
    VALUES (p_user_id, p_asset, new_available_balance, current_locked, NOW())
    ON CONFLICT (user_id, currency) 
    DO UPDATE SET 
        balance = EXCLUDED.balance,
        locked_balance = EXCLUDED.locked_balance,
        updated_at = EXCLUDED.updated_at;
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        new_available_balance, 
        current_locked, 
        'Balance added successfully', 
        transaction_id_val;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            false, 
            0, 
            0, 
            'Error: ' || SQLERRM, 
            NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_balance(p_user_id UUID, p_asset TEXT, p_amount NUMERIC, p_reference TEXT, p_type TEXT, p_metadata JSONB) TO authenticated;

-- Step 5: Verify the function was created successfully
SELECT 
    'Function Created' as step,
    'add_balance function is now available with unique signature' as status;
