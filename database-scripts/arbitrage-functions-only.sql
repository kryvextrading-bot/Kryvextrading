-- =====================================================
-- ARBITRAGE FUNCTIONS ONLY (Tables already created)
-- =====================================================
-- This creates the functions for arbitrage trading
-- Assumes arbitrage_contracts and arbitrage_locks tables exist

-- =====================================================
-- 1. CREATE ARBITRAGE INVESTMENT LOCK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION lock_arbitrage_investment(
  p_user_id UUID,
  p_product_id TEXT,
  p_product_label TEXT,
  p_amount DECIMAL,
  p_duration INTEGER,
  p_apy DECIMAL,
  p_asset TEXT DEFAULT 'USDT'
) RETURNS JSON AS $$
DECLARE
  v_contract_id UUID;
  v_lock_id UUID;
  v_current_balance DECIMAL;
  v_current_locked DECIMAL;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_result JSON;
BEGIN
  -- Validate inputs
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;
  
  IF p_duration <= 0 OR p_duration > 8760 THEN -- Max 1 year
    RETURN json_build_object('success', false, 'error', 'Invalid duration (1-8760 hours)');
  END IF;
  
  IF p_apy <= 0 OR p_apy > 100 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid APY (0-100%)');
  END IF;
  
  -- Get current balance
  SELECT balance, locked_balance INTO v_current_balance, v_current_locked
  FROM public.wallets
  WHERE user_id = p_user_id AND currency = p_asset
  FOR UPDATE;
  
  -- Check if balance exists
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Balance not found for asset: ' || p_asset);
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient balance',
      'available', v_current_balance,
      'requested', p_amount,
      'asset', p_asset
    );
  END IF;
  
  -- Calculate expiration time
  v_expires_at := NOW() + (p_duration * INTERVAL '1 HOUR');
  
  -- Create arbitrage contract
  INSERT INTO arbitrage_contracts (
    user_id, product_id, product_label, amount, duration, apy, expires_at, metadata
  ) VALUES (
    p_user_id, p_product_id, p_product_label, p_amount, p_duration, p_apy, v_expires_at,
    json_build_object(
      'original_balance', v_current_balance,
      'investment_asset', p_asset,
      'expected_profit', p_amount * (p_apy / 100) * (p_duration / 8760),
      'lock_reason', 'arbitrage_investment'
    )
  ) RETURNING id INTO v_contract_id;
  
  -- Create investment lock
  INSERT INTO arbitrage_locks (
    contract_id, user_id, asset, amount, lock_type, reference_id, expires_at, metadata
  ) VALUES (
    v_contract_id, p_user_id, p_asset, p_amount, 'investment', v_contract_id::TEXT, v_expires_at,
    json_build_object(
      'product_id', p_product_id,
      'product_label', p_product_label,
      'duration', p_duration,
      'apy', p_apy,
      'expected_profit', p_amount * (p_apy / 100) * (p_duration / 8760)
    )
  ) RETURNING id INTO v_lock_id;
  
  -- Update wallet balance (lock funds)
  UPDATE public.wallets
  SET 
    balance = balance - p_amount,
    locked_balance = locked_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_asset;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'contract_id', v_contract_id,
    'lock_id', v_lock_id,
    'invested_amount', p_amount,
    'duration_hours', p_duration,
    'apy', p_apy,
    'expected_profit', p_amount * (p_apy / 100) * (p_duration / 8760),
    'expires_at', v_expires_at,
    'remaining_balance', v_current_balance - p_amount,
    'total_locked', v_current_locked + p_amount
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE ARBITRAGE COMPLETION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION complete_arbitrage_contract(
  p_contract_id UUID,
  p_final_profit DECIMAL DEFAULT NULL,
  p_actual_apy DECIMAL DEFAULT NULL,
  p_status TEXT DEFAULT 'completed'
) RETURNS JSON AS $$
DECLARE
  v_contract RECORD;
  v_investment_lock RECORD;
  v_profit_amount DECIMAL;
  v_result JSON;
BEGIN
  -- Get contract details
  SELECT * INTO v_contract
  FROM arbitrage_contracts
  WHERE id = p_contract_id AND status = 'active'
  FOR UPDATE;
  
  -- Check if contract exists and is active
  IF v_contract IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contract not found or already completed');
  END IF;
  
  -- Get investment lock
  SELECT * INTO v_investment_lock
  FROM arbitrage_locks
  WHERE contract_id = p_contract_id AND lock_type = 'investment' AND status = 'locked'
  FOR UPDATE;
  
  -- Calculate final profit
  v_profit_amount := COALESCE(p_final_profit, v_contract.amount * (v_contract.apy / 100) * (v_contract.duration / 8760));
  
  -- Update contract status
  UPDATE arbitrage_contracts
  SET 
    status = p_status,
    completed_at = NOW(),
    profit_amount = v_profit_amount,
    actual_apy = COALESCE(p_actual_apy, (v_profit_amount / v_contract.amount) * (8760 / v_contract.duration) * 100)
  WHERE id = p_contract_id;
  
  -- Release investment lock and add profit
  UPDATE public.wallets
  SET 
    balance = balance + v_contract.amount + v_profit_amount,
    locked_balance = locked_balance - v_contract.amount,
    updated_at = NOW()
  WHERE user_id = v_contract.user_id AND currency = v_investment_lock.asset;
  
  -- Update investment lock status
  UPDATE arbitrage_locks
  SET 
    status = 'released',
    released_at = NOW()
  WHERE id = v_investment_lock.id;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'contract_id', p_contract_id,
    'investment_amount', v_contract.amount,
    'profit_amount', v_profit_amount,
    'total_return', v_contract.amount + v_profit_amount,
    'apy', v_contract.apy,
    'actual_apy', COALESCE(p_actual_apy, (v_profit_amount / v_contract.amount) * (8760 / v_contract.duration) * 100),
    'status', p_status,
    'completed_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. CREATE ARBITRAGE CANCELLATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cancel_arbitrage_contract(
  p_contract_id UUID,
  p_reason TEXT DEFAULT 'user_cancelled'
) RETURNS JSON AS $$
DECLARE
  v_contract RECORD;
  v_investment_lock RECORD;
  v_result JSON;
BEGIN
  -- Get contract details
  SELECT * INTO v_contract
  FROM arbitrage_contracts
  WHERE id = p_contract_id AND status = 'active'
  FOR UPDATE;
  
  -- Check if contract exists and is active
  IF v_contract IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Contract not found or already completed');
  END IF;
  
  -- Get investment lock
  SELECT * INTO v_investment_lock
  FROM arbitrage_locks
  WHERE contract_id = p_contract_id AND lock_type = 'investment' AND status = 'locked'
  FOR UPDATE;
  
  -- Update contract status
  UPDATE arbitrage_contracts
  SET 
    status = 'cancelled',
    completed_at = NOW()
  WHERE id = p_contract_id;
  
  -- Refund investment (release lock)
  UPDATE public.wallets
  SET 
    balance = balance + v_contract.amount,
    locked_balance = locked_balance - v_contract.amount,
    updated_at = NOW()
  WHERE user_id = v_contract.user_id AND currency = v_investment_lock.asset;
  
  -- Update investment lock status
  UPDATE arbitrage_locks
  SET 
    status = 'released',
    released_at = NOW()
  WHERE id = v_investment_lock.id;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'contract_id', p_contract_id,
    'refunded_amount', v_contract.amount,
    'status', 'cancelled',
    'reason', p_reason,
    'cancelled_at', NOW()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION lock_arbitrage_investment TO authenticated;
GRANT EXECUTE ON FUNCTION complete_arbitrage_contract TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_arbitrage_contract TO authenticated;

-- Grant select permissions on tables
GRANT SELECT ON arbitrage_contracts TO authenticated;
GRANT SELECT ON arbitrage_locks TO authenticated;

-- =====================================================
-- 5. TEST QUERIES
-- =====================================================

-- Test function creation
SELECT 
  'lock_arbitrage_investment' as function_name,
  routine_type,
  external_language
FROM information_schema.routines
WHERE routine_name = 'lock_arbitrage_investment'
UNION ALL
SELECT 
  'complete_arbitrage_contract' as function_name,
  routine_type,
  external_language
FROM information_schema.routines
WHERE routine_name = 'complete_arbitrage_contract'
UNION ALL
SELECT 
  'cancel_arbitrage_contract' as function_name,
  routine_type,
  external_language
FROM information_schema.routines
WHERE routine_name = 'cancel_arbitrage_contract';
