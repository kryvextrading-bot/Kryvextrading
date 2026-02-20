-- Create add_balance RPC function for admin manual fund additions
-- This function allows admins to manually add funds to user wallets

-- Step 1: Create the add_balance function
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

-- Step 2: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_balance TO authenticated;

-- Step 3: Create a similar function for removing funds (for completeness)
CREATE OR REPLACE FUNCTION remove_balance(
    p_user_id UUID,
    p_asset TEXT,
    p_amount NUMERIC,
    p_reference TEXT DEFAULT 'admin_manual_remove',
    p_type TEXT DEFAULT 'withdrawal',
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
    
    -- Check if balance exists and has sufficient funds
    IF current_available IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 'No balance found for this user and asset', NULL::TEXT;
        RETURN;
    END IF;
    
    IF current_available < p_amount THEN
        RETURN QUERY SELECT false, current_available, current_locked, 
            'Insufficient balance. Available: ' || current_available, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new balance
    new_available_balance := current_available - p_amount;
    
    -- Update wallet balance
    UPDATE wallet_balances 
    SET available = new_available_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id AND asset = p_asset;
    
    -- Generate transaction ID
    transaction_id_val := 'admin_remove_' || p_user_id || '_' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Log the admin action
    INSERT INTO admin_action_logs (admin_id, action_type, action_details, created_at)
    VALUES (
        admin_id,
        'user_balance_adjust',
        json_build_object(
            'target_user_id', p_user_id,
            'asset', p_asset,
            'amount', -p_amount,
            'old_balance', current_available,
            'new_balance', new_available_balance,
            'reference', p_reference,
            'transaction_id', transaction_id_val,
            'manual_remove', true
        ),
        NOW()
    ) ON CONFLICT DO NOTHING;
    
    -- Also update the legacy wallets table for compatibility
    UPDATE wallets 
    SET balance = new_available_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_asset;
    
    -- Return success
    RETURN QUERY SELECT 
        true, 
        new_available_balance, 
        current_locked, 
        'Balance removed successfully', 
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

-- Step 4: Grant execute permission for remove function
GRANT EXECUTE ON FUNCTION remove_balance TO authenticated;

-- Step 5: Verify the functions were created
SELECT 
    'Functions Created' as step,
    'add_balance and remove_balance RPC functions are now available for admin use' as status;
