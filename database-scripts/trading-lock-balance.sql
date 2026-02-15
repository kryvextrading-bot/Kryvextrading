-- =====================================================
-- TRADING LOCK BALANCE SYSTEM
-- =====================================================
-- This script creates the database structure for locking
-- balances during trades to prevent double-spending and
-- ensure proper fund allocation

-- =====================================================
-- 1. CREATE TRADING LOCKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS trading_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('spot', 'futures', 'options', 'arbitrage', 'staking')),
  reference_id TEXT NOT NULL, -- Trade ID, Order ID, etc.
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT trading_locks_user_asset_check UNIQUE (user_id, asset, reference_id)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_trading_locks_user_id ON trading_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_locks_asset ON trading_locks(asset);
CREATE INDEX IF NOT EXISTS idx_trading_locks_status ON trading_locks(status);
CREATE INDEX IF NOT EXISTS idx_trading_locks_expires_at ON trading_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_trading_locks_reference_id ON trading_locks(reference_id);

-- =====================================================
-- 3. CREATE LOCK BALANCE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION lock_trading_balance(
  p_user_id UUID,
  p_asset TEXT,
  p_amount DECIMAL,
  p_lock_type TEXT,
  p_reference_id TEXT,
  p_expires_minutes INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
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
  
  IF p_lock_type NOT IN ('spot', 'futures', 'options', 'arbitrage', 'staking') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid lock type');
  END IF;
  
  -- Get current balances
  SELECT balance, locked_balance INTO v_current_balance, v_current_locked
  FROM wallets
  WHERE user_id = p_user_id AND currency = p_asset
  FOR UPDATE;
  
  -- Check if balance exists
  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Balance not found for asset');
  END IF;
  
  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient balance',
      'available', v_current_balance,
      'requested', p_amount
    );
  END IF;
  
  -- Calculate expiration time
  v_expires_at := NOW() + (p_expires_minutes || 30) * INTERVAL '1 MINUTE';
  
  -- Create lock record
  INSERT INTO trading_locks (
    user_id, asset, amount, lock_type, reference_id, expires_at, metadata
  ) VALUES (
    p_user_id, p_asset, p_amount, p_lock_type, p_reference_id, v_expires_at,
    json_build_object(
      'original_balance', v_current_balance,
      'original_locked', v_current_locked,
      'lock_reason', 'trade_execution'
    )
  ) RETURNING id INTO v_lock_id;
  
  -- Update wallet balance (move from balance to locked_balance)
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    locked_balance = locked_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id AND currency = p_asset;
  
  -- Record in ledger
  INSERT INTO wallet_transactions (
    id, user_id, type, amount, currency, balance_before, balance_after, reference_id, description, created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'freeze',
    p_amount,
    p_asset,
    v_current_balance,
    v_current_balance - p_amount,
    v_lock_id::TEXT,
    'Trading lock for ' || p_lock_type || ' trade',
    NOW()
  );
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'lock_id', v_lock_id,
    'locked_amount', p_amount,
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
-- 4. CREATE RELEASE LOCK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION release_trading_lock(
  p_lock_id UUID,
  p_release_amount DECIMAL DEFAULT NULL, -- NULL to release full amount
  p_success BOOLEAN DEFAULT true,
  p_reason TEXT DEFAULT 'trade_completed'
) RETURNS JSON AS $$
DECLARE
  v_lock RECORD;
  v_release_amount DECIMAL;
  v_result JSON;
BEGIN
  -- Get lock record
  SELECT * INTO v_lock
  FROM trading_locks
  WHERE id = p_lock_id AND status = 'locked'
  FOR UPDATE;
  
  -- Check if lock exists and is still locked
  IF v_lock IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lock not found or already released');
  END IF;
  
  -- Check if lock has expired
  IF v_lock.expiresAt < NOW() THEN
    UPDATE trading_locks
    SET status = 'expired', releasedAt = NOW()
    WHERE id = p_lock_id;
    
    RETURN json_build_object('success', false, 'error', 'Lock has expired');
  END IF;
  
  -- Determine release amount
  v_release_amount := COALESCE(p_release_amount, v_lock.amount);
  
  -- Validate release amount
  IF v_release_amount <= 0 OR v_release_amount > v_lock.amount THEN
    RETURN json_build_object('success', false, 'error', 'Invalid release amount');
  END IF;
  
  -- Update wallet balance (move from locked back to available or deduct)
  IF p_success THEN
    -- Successful trade - move remaining locked back to available
    UPDATE wallet_balances
    SET 
      available = available + (v_lock.amount - v_release_amount),
      locked = locked - v_lock.amount,
      updatedAt = NOW()
    WHERE userId = v_lock.userId AND asset = v_lock.asset;
  ELSE
    -- Failed trade - return full amount to available
    UPDATE wallet_balances
    SET 
      available = available + v_lock.amount,
      locked = locked - v_lock.amount,
      updatedAt = NOW()
    WHERE userId = v_lock.userId AND asset = v_lock.asset;
  END IF;
  
  -- Update lock status
  UPDATE trading_locks
  SET 
    status = 'released',
    releasedAt = NOW(),
    metadata = jsonb_set(
      metadata,
      '{release_reason}',
      to_jsonb(p_reason)
    )
  WHERE id = p_lock_id;
  
  -- Record in ledger
  INSERT INTO ledger_entries (
    id, userId, asset, amount, type, reference, metadata, timestamp
  ) VALUES (
    gen_random_uuid(),
    v_lock.userId,
    v_lock.asset,
    v_release_amount,
    CASE WHEN p_success THEN 'trade_execution' ELSE 'trade_refund' END,
    p_lock_id::TEXT,
    json_build_object(
      'lockType', v_lock.lockType,
      'referenceId', v_lock.referenceId,
      'success', p_success,
      'reason', p_reason
    ),
    NOW()
  );
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'lockId', p_lock_id,
    'releasedAmount', v_release_amount,
    'remainingLocked', 0,
    'status', CASE WHEN p_success THEN 'trade_completed' ELSE 'trade_refunded' END
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
-- 5. CREATE CLEANUP EXPIRED LOCKS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_locks() RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  -- Update expired locks
  UPDATE trading_locks
  SET status = 'expired', released_at = NOW()
  WHERE status = 'locked' AND expires_at < NOW();
  
  v_expired_count := ROW_COUNT;
  
  -- Return expired locks to available balance
  UPDATE wallet_balances wb
  SET 
    available = wb.available + tl.amount,
    locked = wb.locked - tl.amount,
    updated_at = NOW()
  FROM trading_locks tl
  WHERE tl.user_id = wb.user_id 
    AND tl.asset = wb.asset 
    AND tl.status = 'expired'
    AND tl.expires_at < NOW();
  
  -- Record cleanup in ledger
  INSERT INTO ledger_entries (
    id, user_id, asset, amount, type, reference, metadata, timestamp
  )
  SELECT 
    gen_random_uuid(),
    tl.user_id,
    tl.asset,
    tl.amount,
    'lock_expiry',
    tl.id::TEXT,
    json_build_object(
      'lock_type', tl.lock_type,
      'reference_id', tl.reference_id,
      'expired_at', tl.expires_at
    ),
    NOW()
  FROM trading_locks tl
  WHERE tl.status = 'expired' AND tl.expires_at < NOW();
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE GET USER LOCKED BALANCE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_locked_balance(
  p_user_id UUID,
  p_asset TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  IF p_asset IS NOT NULL THEN
    -- Get locked balance for specific asset
    SELECT json_build_object(
      'user_id', p_user_id,
      'asset', p_asset,
      'total_locked', COALESCE(SUM(amount), 0),
      'active_locks', COUNT(*),
      'locks', json_agg(
        json_build_object(
          'id', id,
          'amount', amount,
          'lock_type', lock_type,
          'reference_id', reference_id,
          'status', status,
          'created_at', created_at,
          'expires_at', expires_at
        )
      )
    ) INTO v_result
    FROM trading_locks
    WHERE user_id = p_user_id 
      AND asset = p_asset 
      AND status = 'locked'
      AND expires_at > NOW();
  ELSE
    -- Get all locked balances for user
    SELECT json_build_object(
      'user_id', p_user_id,
      'total_locked', COALESCE(SUM(amount), 0),
      'active_locks', COUNT(*),
      'locks_by_asset', json_object_agg(asset, json_build_object(
        'locked_amount', SUM(amount),
        'lock_count', COUNT(*)
      ))
    ) INTO v_result
    FROM trading_locks
    WHERE user_id = p_user_id 
      AND status = 'locked' 
      AND expires_at > NOW()
    GROUP BY user_id;
  END IF;
  
  RETURN COALESCE(v_result, json_build_object('user_id', p_user_id, 'total_locked', 0, 'active_locks', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE AUTOMATIC CLEANUP JOB (Optional)
-- =====================================================

-- This would be set up as a cron job or scheduled task
-- Run every 5 minutes to clean up expired locks
-- SELECT cleanup_expired_locks();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION lock_trading_balance TO authenticated;
GRANT EXECUTE ON FUNCTION release_trading_lock TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_locked_balance TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_locks TO authenticated;

-- Grant select permissions on trading_locks table
GRANT SELECT ON trading_locks TO authenticated;

-- =====================================================
-- 9. SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Lock balance for a spot trade
-- SELECT lock_trading_balance(
--   'user-uuid-here',
--   'USDT', 
--   100.0,
--   'spot',
--   'trade-12345',
--   30
-- );

-- Release lock after successful trade
-- SELECT release_trading_lock(
--   'lock-uuid-here',
--   100.0,
--   true,
--   'trade_completed_successfully'
-- );

-- Get user's locked balances
-- SELECT get_user_locked_balance('user-uuid-here');

-- Clean up expired locks
-- SELECT cleanup_expired_locks();

-- =====================================================
-- 10. VIEWS FOR MONITORING
-- =====================================================

CREATE OR REPLACE VIEW active_trading_locks AS
SELECT 
  tl.id,
  tl.user_id,
  u.email as user_email,
  tl.asset,
  tl.amount,
  tl.lock_type,
  tl.reference_id,
  tl.status,
  tl.created_at,
  tl.expires_at,
  tl.released_at,
  tl.metadata,
  wb.balance as remaining_balance,
  wb.locked_balance as total_locked,
  EXTRACT(EPOCH FROM (tl.expires_at - NOW())) as seconds_until_expiry
FROM trading_locks tl
JOIN public.users u ON tl.user_id = u.id
LEFT JOIN public.wallets wb ON tl.user_id = wb.user_id AND tl.asset = wb.currency
WHERE tl.status = 'locked' AND tl.expires_at > NOW()
ORDER BY tl.created_at DESC;

CREATE OR REPLACE VIEW lock_summary_by_asset AS
SELECT 
  asset,
  COUNT(*) as active_locks,
  SUM(amount) as total_locked_amount,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (expires_at - NOW()))) as avg_seconds_until_expiry
FROM trading_locks
WHERE status = 'locked' AND expires_at > NOW()
GROUP BY asset
ORDER BY total_locked_amount DESC;

-- =====================================================
-- USAGE NOTES:
-- =====================================================
-- 
-- 1. Always lock balance before executing a trade
-- 2. Use the returned lock_id for reference
-- 3. Release lock after trade completion (success or failure)
-- 4. Locks automatically expire after specified time
-- 5. Expired locks are automatically refunded to available balance
-- 6. Use the views for monitoring and debugging
--
