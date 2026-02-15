-- =====================================================
-- ARBITRAGE LOCK BALANCE SYSTEM
-- =====================================================
-- This script creates specialized functions for arbitrage trading
-- with multi-step locking and profit/loss management

-- =====================================================
-- 1. CREATE ARBITRAGE CONTRACTS TABLE
-- =====================================================

-- First, create the table without the trigger
CREATE TABLE IF NOT EXISTS arbitrage_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_label TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  duration INTEGER NOT NULL, -- Duration in hours
  apy DECIMAL(5,2) NOT NULL, -- Annual Percentage Yield
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  profit_amount DECIMAL(20,8) DEFAULT 0,
  actual_apy DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT arbitrage_contracts_user_product UNIQUE (user_id, product_id, created_at)
);

-- =====================================================
-- 2. CREATE ARBITRAGE LOCKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS arbitrage_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES arbitrage_contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('investment', 'profit_release', 'refund')),
  reference_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT arbitrage_locks_contract_asset UNIQUE (contract_id, asset, lock_type)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_user_id ON arbitrage_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_status ON arbitrage_contracts(status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_expires_at ON arbitrage_contracts(expires_at);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_product_id ON arbitrage_contracts(product_id);

CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_contract_id ON arbitrage_locks(contract_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_user_id ON arbitrage_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_status ON arbitrage_locks(status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_asset ON arbitrage_locks(asset);

-- =====================================================
-- 4. CREATE ARBITRAGE INVESTMENT LOCK FUNCTION
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
  v_current_available DECIMAL;
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
  SELECT balance, locked_balance INTO v_current_available, v_current_locked
  FROM public.wallets
  WHERE user_id = p_user_id AND currency = p_asset
  FOR UPDATE;
  
  -- Check if balance exists
  IF v_current_available IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Balance not found for asset: ' || p_asset);
  END IF;
  
  -- Check sufficient balance
  IF v_current_available < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient balance',
      'available', v_current_available,
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
      'original_balance', v_current_available,
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
  
  -- Record in ledger
  INSERT INTO ledger_entries (
    id, user_id, asset, amount, type, reference, metadata, timestamp
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_asset,
    -p_amount,
    'arbitrage_investment',
    v_contract_id::TEXT,
    json_build_object(
      'product_id', p_product_id,
      'product_label', p_product_label,
      'duration', p_duration,
      'apy', p_apy,
      'contract_id', v_contract_id,
      'expires_at', v_expires_at
    ),
    NOW()
  );
  
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
    'remaining_available', v_current_available - p_amount,
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
-- 5. CREATE ARBITRAGE COMPLETION FUNCTION
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
    actual_apy = COALESCE(p_actual_apy, (v_profit_amount / v_contract.amount) * (8760 / v_contract.duration) * 100),
    metadata = jsonb_set(
      metadata,
      '{completion_details}',
      json_build_object(
        'final_profit', v_profit_amount,
        'actual_apy', COALESCE(p_actual_apy, (v_profit_amount / v_contract.amount) * (8760 / v_contract.duration) * 100),
        'completion_status', p_status
      )
    )
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
    released_at = NOW(),
    metadata = jsonb_set(
      metadata,
      '{release_details}',
      json_build_object(
        'profit_amount', v_profit_amount,
        'final_status', p_status,
        'released_amount', v_contract.amount + v_profit_amount
      )
    )
  WHERE id = v_investment_lock.id;
  
  -- Record profit in ledger
  INSERT INTO ledger_entries (
    id, user_id, asset, amount, type, reference, metadata, timestamp
  ) VALUES (
    gen_random_uuid(),
    v_contract.user_id,
    v_investment_lock.asset,
    v_contract.amount + v_profit_amount,
    'arbitrage_profit',
    p_contract_id::TEXT,
    json_build_object(
      'product_id', v_contract.product_id,
      'product_label', v_contract.product_label,
      'investment_amount', v_contract.amount,
      'profit_amount', v_profit_amount,
      'apy', v_contract.apy,
      'duration', v_contract.duration,
      'actual_apy', COALESCE(p_actual_apy, (v_profit_amount / v_contract.amount) * (8760 / v_contract.duration) * 100)
    ),
    NOW()
  );
  
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
-- 6. CREATE ARBITRAGE CANCELLATION FUNCTION
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
    completed_at = NOW(),
    metadata = jsonb_set(
      metadata,
      '{cancellation_details}',
      json_build_object(
        'reason', p_reason,
        'cancelled_at', NOW()
      )
    )
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
    released_at = NOW(),
    metadata = jsonb_set(
      metadata,
      '{release_details}',
      json_build_object(
        'refund_amount', v_contract.amount,
        'cancellation_reason', p_reason
      )
    )
  WHERE id = v_investment_lock.id;
  
  -- Record refund in ledger
  INSERT INTO ledger_entries (
    id, user_id, asset, amount, type, reference, metadata, timestamp
  ) VALUES (
    gen_random_uuid(),
    v_contract.user_id,
    v_investment_lock.asset,
    v_contract.amount,
    'arbitrage_refund',
    p_contract_id::TEXT,
    json_build_object(
      'product_id', v_contract.product_id,
      'product_label', v_contract.product_label,
      'refund_amount', v_contract.amount,
      'cancellation_reason', p_reason
    ),
    NOW()
  );
  
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
-- 7. CREATE GET USER ARBITRAGE CONTRACTS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_arbitrage_contracts(
  p_user_id UUID,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Get user's arbitrage contracts
  SELECT json_build_object(
    'user_id', p_user_id,
    'contracts', json_agg(
      json_build_object(
        'id', id,
        'product_id', product_id,
        'product_label', product_label,
        'amount', amount,
        'duration', duration,
        'apy', apy,
        'status', status,
        'created_at', created_at,
        'expires_at', expires_at,
        'completed_at', completed_at,
        'profit_amount', profit_amount,
        'actual_apy', actual_apy,
        'metadata', metadata,
        'time_remaining', EXTRACT(EPOCH FROM (expires_at - NOW()))::INTEGER,
        'is_expired', expires_at < NOW(),
        'days_active', EXTRACT(DAYS FROM (NOW() - created_at))::INTEGER
      )
    ),
    'total_invested', COALESCE(SUM(amount), 0),
    'total_profit', COALESCE(SUM(profit_amount), 0),
    'active_contracts', COUNT(*) FILTER (WHERE status = 'active'),
    'completed_contracts', COUNT(*) FILTER (WHERE status = 'completed'),
    'cancelled_contracts', COUNT(*) FILTER (WHERE status = 'cancelled')
  ) INTO v_result
  FROM arbitrage_contracts
  WHERE user_id = p_user_id 
    AND (p_status IS NULL OR status = p_status)
  ORDER BY created_at DESC
  LIMIT p_limit;
  
  RETURN COALESCE(v_result, json_build_object('user_id', p_user_id, 'contracts', '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE ARBITRAGE CLEANUP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_arbitrage() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Update expired contracts
  UPDATE arbitrage_contracts
  SET status = 'expired', completed_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
  
  v_expired_count := ROW_COUNT;
  
  -- Refund expired contracts
  UPDATE public.wallets wb
  SET 
    balance = wb.balance + ac.amount,
    locked_balance = wb.locked_balance - ac.amount,
    updated_at = NOW()
  FROM arbitrage_contracts ac
  JOIN arbitrage_locks al ON ac.id = al.contract_id
  WHERE ac.user_id = wb.user_id 
    AND ac.status = 'expired'
    AND al.lock_type = 'investment'
    AND al.status = 'locked'
    AND ac.asset = al.currency;
  
  -- Update expired locks
  UPDATE arbitrage_locks
  SET status = 'released', released_at = NOW()
  WHERE contract_id IN (
    SELECT id FROM arbitrage_contracts WHERE status = 'expired'
  ) AND status = 'locked';
  
  -- Record expirations in ledger
  INSERT INTO ledger_entries (
    id, user_id, asset, amount, type, reference, metadata, timestamp
  )
  SELECT 
    gen_random_uuid(),
    ac.user_id,
    al.asset,
    ac.amount,
    'arbitrage_expiry',
    ac.id::TEXT,
    json_build_object(
      'product_id', ac.product_id,
      'product_label', ac.product_label,
      'expired_at', ac.expires_at,
      'original_duration', ac.duration
    ),
    NOW()
  FROM arbitrage_contracts ac
  JOIN arbitrage_locks al ON ac.id = al.contract_id
  WHERE ac.status = 'expired' AND al.lock_type = 'investment';
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE MONITORING VIEWS
-- =====================================================

CREATE OR REPLACE VIEW active_arbitrage_contracts AS
SELECT 
  ac.id,
  ac.user_id,
  u.email as user_email,
  ac.product_id,
  ac.product_label,
  ac.amount,
  ac.duration,
  ac.apy,
  ac.status,
  ac.created_at,
  ac.expires_at,
  ac.profit_amount,
  ac.actual_apy,
  ac.metadata,
  wb.balance as remaining_balance,
  wb.locked_balance as total_locked,
  EXTRACT(EPOCH FROM (ac.expires_at - NOW())) as seconds_until_expiry,
  EXTRACT(DAYS FROM (ac.expires_at - ac.created_at)) as total_days,
  EXTRACT(DAYS FROM (NOW() - ac.created_at)) as days_active,
  (ac.amount * (ac.apy / 100) * (ac.duration / 8760)) as expected_profit
FROM arbitrage_contracts ac
JOIN public.users u ON ac.user_id = u.id
LEFT JOIN public.wallets wb ON ac.user_id = wb.user_id AND ac.asset = wb.currency
WHERE ac.status = 'active' AND ac.expires_at > NOW()
ORDER BY ac.created_at DESC;

CREATE OR REPLACE VIEW arbitrage_summary AS
SELECT 
  COUNT(*) as total_contracts,
  COUNT(*) FILTER (WHERE status = 'active') as active_contracts,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_contracts,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_contracts,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_contracts,
  COALESCE(SUM(amount), 0) as total_invested,
  COALESCE(SUM(profit_amount), 0) as total_profit,
  COALESCE(AVG(apy), 0) as average_apy,
  COALESCE(AVG(actual_apy), 0) as average_actual_apy,
  COUNT(DISTINCT user_id) as unique_users
FROM arbitrage_contracts;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION lock_arbitrage_investment TO authenticated;
GRANT EXECUTE ON FUNCTION complete_arbitrage_contract TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_arbitrage_contract TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_arbitrage_contracts TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_arbitrage TO authenticated;

-- Grant select permissions on tables
GRANT SELECT ON arbitrage_contracts TO authenticated;
GRANT SELECT ON arbitrage_locks TO authenticated;
GRANT SELECT ON active_arbitrage_contracts TO authenticated;
GRANT SELECT ON arbitrage_summary TO authenticated;

-- =====================================================
-- 11. SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Lock funds for arbitrage investment
-- SELECT lock_arbitrage_investment(
--   'user-uuid-here',
--   'product-123',
--   'High Yield Arbitrage',
--   1000.0,
--   168, -- 7 days
--   15.5, -- 15.5% APY
--   'USDT'
-- );

-- Complete arbitrage contract with profit
-- SELECT complete_arbitrage_contract(
--   'contract-uuid-here',
--   125.50, -- Actual profit
--   16.2, -- Actual APY
--   'completed'
-- );

-- Cancel arbitrage contract
-- SELECT cancel_arbitrage_contract(
--   'contract-uuid-here',
--   'user_requested'
-- );

-- Get user's arbitrage contracts
-- SELECT get_user_arbitrage_contracts('user-uuid-here');

-- Clean up expired contracts
-- SELECT cleanup_expired_arbitrage();

-- View active contracts
-- SELECT * FROM active_arbitrage_contracts LIMIT 10;

-- View arbitrage summary
-- SELECT * FROM arbitrage_summary;

-- =====================================================
-- 12. USAGE NOTES:
-- =====================================================
-- 
-- 1. Lock funds before creating arbitrage contract
-- 2. Use contract_id for all subsequent operations
-- 3. Complete contracts when they mature or manually
-- 4. Cancel contracts if needed (full refund)
-- 5. Expired contracts are automatically refunded
-- 6. Use views for monitoring and reporting
-- 7. APY calculations are automatically computed
-- 8. All operations are recorded in ledger for audit trail
--
