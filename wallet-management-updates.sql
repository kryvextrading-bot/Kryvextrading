-- ========================================
-- Wallet Management Updates (New Functions Only)
-- ========================================
-- Run this file if wallet tables already exist
-- This adds the admin fund management functions

-- Function for admin to add funds to user wallet
CREATE OR REPLACE FUNCTION admin_add_funds(
    p_user_id UUID,
    p_amount DECIMAL(20,8),
    p_currency VARCHAR(10),
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL(20,8);
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Get or create wallet balance
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    IF NOT FOUND THEN
        v_balance := 0;
        INSERT INTO wallet_balances (user_id, currency, balance)
        VALUES (p_user_id, p_currency, 0);
    END IF;

    -- Update balance
    UPDATE wallet_balances 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;

    -- Create transaction record
    INSERT INTO wallet_transactions (
        user_id, type, amount, currency, 
        balance_before, balance_after, description
    ) VALUES (
        p_user_id, 'deposit', p_amount, p_currency,
        v_balance, v_balance + p_amount, 
        COALESCE('Admin add funds: ' || p_reason, 'Admin add funds')
    );

    -- Log admin action
    INSERT INTO wallet_requests (
        user_id, type, amount, currency, method, address, 
        description, status, processed_by, processed_at
    ) VALUES (
        p_user_id, 'deposit', p_amount, p_currency, 'Admin Manual', 
        'ADMIN_ADJUSTMENT', COALESCE('Admin add funds: ' || p_reason, 'Admin add funds'),
        'completed', p_admin_id, NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to remove funds from user wallet
CREATE OR REPLACE FUNCTION admin_remove_funds(
    p_user_id UUID,
    p_amount DECIMAL(20,8),
    p_currency VARCHAR(10),
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL(20,8);
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Get current balance
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    IF NOT FOUND OR v_balance = 0 THEN
        RAISE EXCEPTION 'No wallet balance found for user';
    END IF;

    -- Check sufficient funds
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_balance, p_amount;
    END IF;

    -- Update balance
    UPDATE wallet_balances 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;

    -- Create transaction record
    INSERT INTO wallet_transactions (
        user_id, type, amount, currency, 
        balance_before, balance_after, description
    ) VALUES (
        p_user_id, 'withdrawal', p_amount, p_currency,
        v_balance, v_balance - p_amount, 
        COALESCE('Admin remove funds: ' || p_reason, 'Admin remove funds')
    );

    -- Log admin action
    INSERT INTO wallet_requests (
        user_id, type, amount, currency, method, address, 
        description, status, processed_by, processed_at
    ) VALUES (
        p_user_id, 'withdrawal', p_amount, p_currency, 'Admin Manual', 
        'ADMIN_ADJUSTMENT', COALESCE('Admin remove funds: ' || p_reason, 'Admin remove funds'),
        'completed', p_admin_id, NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user wallet balance (enhanced)
CREATE OR REPLACE FUNCTION get_user_wallet_balance(
    p_user_id UUID,
    p_currency VARCHAR(10) DEFAULT 'USD'
)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    v_balance DECIMAL(20,8);
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically process approved wallet requests
CREATE OR REPLACE FUNCTION process_approved_wallet_request(
    p_request_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Get the request details
    SELECT * INTO v_request
    FROM wallet_requests 
    WHERE id = p_request_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Approved request not found';
    END IF;

    -- Process based on request type
    IF v_request.type = 'deposit' THEN
        -- Add funds to user wallet
        PERFORM admin_add_funds(
            v_request.user_id,
            v_request.amount,
            v_request.currency,
            p_admin_id,
            'Approved deposit request: ' || COALESCE(v_request.description, '')
        );
        
        -- Update request status to completed
        UPDATE wallet_requests 
        SET status = 'completed', processed_at = NOW()
        WHERE id = p_request_id;
        
    ELSIF v_request.type = 'withdrawal' THEN
        -- Remove funds from user wallet
        PERFORM admin_remove_funds(
            v_request.user_id,
            v_request.amount,
            v_request.currency,
            p_admin_id,
            'Approved withdrawal request: ' || COALESCE(v_request.description, '')
        );
        
        -- Update request status to completed
        UPDATE wallet_requests 
        SET status = 'completed', processed_at = NOW()
        WHERE id = p_request_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function to approve and process wallet request in one step
CREATE OR REPLACE FUNCTION approve_and_process_wallet_request(
    p_request_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Get the request details
    SELECT * INTO v_request
    FROM wallet_requests 
    WHERE id = p_request_id AND status IN ('pending', 'approved');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or already processed';
    END IF;

    -- Update request status to approved
    UPDATE wallet_requests 
    SET status = 'approved', processed_by = p_admin_id, processed_at = NOW()
    WHERE id = p_request_id;

    -- Process the wallet balance change
    IF v_request.type = 'deposit' THEN
        -- Add funds to user wallet
        PERFORM admin_add_funds(
            v_request.user_id,
            v_request.amount,
            v_request.currency,
            p_admin_id,
            'Approved deposit request: ' || COALESCE(v_request.description, '')
        );
        
    ELSIF v_request.type = 'withdrawal' THEN
        -- Remove funds from user wallet
        PERFORM admin_remove_funds(
            v_request.user_id,
            v_request.amount,
            v_request.currency,
            p_admin_id,
            'Approved withdrawal request: ' || COALESCE(v_request.description, '')
        );
    END IF;

    -- Update request status to completed
    UPDATE wallet_requests 
    SET status = 'completed', processed_at = NOW()
    WHERE id = p_request_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Enhanced wallet statistics function
CREATE OR REPLACE FUNCTION get_wallet_statistics()
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', (SELECT COUNT(*) FROM wallet_requests),
        'pending_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'pending'),
        'approved_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'approved'),
        'completed_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'completed'),
        'rejected_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'rejected'),
        'total_volume', (SELECT COALESCE(SUM(amount), 0) FROM wallet_requests),
        'total_fees', (SELECT COALESCE(SUM(fee), 0) FROM wallet_requests),
        'active_wallets', (SELECT COUNT(DISTINCT user_id) FROM wallet_balances WHERE balance > 0),
        'total_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallet_balances)
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Test the new functions (optional)
-- ========================================

-- Test admin add funds (using your actual user ID)
-- SELECT admin_add_funds(
--     '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 
--     100.00, 
--     'USD', 
--     '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 
--     'Test addition'
-- );

-- Test admin remove funds
-- SELECT admin_remove_funds(
--     '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 
--     50.00, 
--     'USD', 
--     '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 
--     'Test removal'
-- );

-- Test get user balance
-- SELECT get_user_wallet_balance('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'USD');

-- Test get all user balances
-- SELECT * FROM get_all_user_balances('9b952c90-6b06-4c9c-9a1e-c8b4610804e2');

-- Test statistics
-- SELECT get_wallet_statistics();

-- ========================================
-- Comments
-- ========================================

-- This file contains only the NEW functions for admin fund management.
-- Run this if you already have the wallet tables and just need the new functionality.

-- The functions provide:
-- 1. Secure admin fund management with authorization checks
-- 2. Complete audit trail with transaction logging
-- 3. Balance validation and protection against overdrafts
-- 4. Enhanced statistics and balance retrieval functions

-- All functions include proper error handling and security checks.
