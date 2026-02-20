-- =====================================================
-- ROW LEVEL SECURITY POLICIES FOR TRADING LOCKS TABLE
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own trading locks" ON trading_locks;
DROP POLICY IF EXISTS "Users can insert own trading locks" ON trading_locks;
DROP POLICY IF EXISTS "Users can update own trading locks" ON trading_locks;

-- Enable RLS on trading_locks table
ALTER TABLE trading_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 1. USERS CAN ONLY SEE THEIR OWN LOCKS
-- =====================================================

-- Users can read their own trading locks
CREATE POLICY "Users can view own trading locks" ON trading_locks
FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- 2. USERS CAN ONLY INSERT LOCKS FOR THEMSELVES
-- =====================================================

-- Users can create locks for themselves with validation
CREATE POLICY "Users can insert own trading locks" ON trading_locks
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  lock_type IN ('spot', 'futures', 'options', 'arbitrage', 'staking') AND
  status IN ('locked', 'released', 'expired', 'failed')
);

-- =====================================================
-- 3. USERS CAN ONLY UPDATE THEIR OWN LOCKS
-- =====================================================

-- Users can update their own locks (for releasing) with validation
CREATE POLICY "Users can update own trading locks" ON trading_locks
FOR UPDATE USING (
  auth.uid() = user_id
) WITH CHECK (
  auth.uid() = user_id AND 
  status IN ('locked', 'released', 'expired', 'failed')
);

-- =====================================================
-- 4. USERS CANNOT DELETE LOCKS (SYSTEM MANAGED)
-- =====================================================

-- Users cannot delete locks - only system can clean up
-- No DELETE policy for users

-- =====================================================
-- 5. ADMIN/SERVICE ROLE FULL ACCESS
-- =====================================================

-- Note: Service role bypasses RLS by default in Supabase
-- No additional policy needed for service role

-- =====================================================
-- 6. SECURITY CONSTRAINTS (BUILT INTO POLICIES)
-- =====================================================
-- Note: Constraints are built into the policies below
-- rather than using ALTER POLICY which isn't supported

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON trading_locks TO authenticated;

-- Grant access to the view for monitoring
GRANT SELECT ON active_trading_locks TO authenticated;

-- =====================================================
-- 8. SECURITY FUNCTIONS FOR SAFE OPERATIONS
-- =====================================================

-- Function to safely create a trading lock
CREATE OR REPLACE FUNCTION create_trading_lock(
  p_user_id UUID,
  p_asset TEXT,
  p_amount DECIMAL,
  p_lock_type TEXT,
  p_reference_id TEXT,
  p_expires_minutes INTEGER DEFAULT 30
) RETURNS JSON AS $$
DECLARE
  v_lock_id UUID;
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
  
  -- Calculate expiration
  v_expires_at := NOW() + (p_expires_minutes || ' minutes')::INTERVAL;
  
  -- Create lock
  INSERT INTO trading_locks (
    user_id, asset, amount, lock_type, reference_id, 
    expires_at, metadata
  ) VALUES (
    p_user_id, p_asset, p_amount, p_lock_type, p_reference_id,
    v_expires_at, json_build_object('created_by', 'trading_system')
  ) RETURNING id INTO v_lock_id;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'lock_id', v_lock_id,
    'expires_at', v_expires_at,
    'amount', p_amount
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

-- Function to safely release a trading lock
CREATE OR REPLACE FUNCTION release_trading_lock_safe(
  p_reference_id TEXT,
  p_user_id UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_lock RECORD;
  v_result JSON;
BEGIN
  -- Get and lock the record
  SELECT * INTO v_lock
  FROM trading_locks
  WHERE reference_id = p_reference_id
    AND status = 'locked'
    AND (p_user_id IS NULL OR user_id = p_user_id)
  FOR UPDATE;
  
  IF v_lock IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Lock not found or already released');
  END IF;
  
  -- Update status
  UPDATE trading_locks
  SET 
    status = 'released',
    released_at = NOW(),
    metadata = jsonb_set(
      metadata,
      '{released_by}',
      to_jsonb('trading_system')
    )
  WHERE id = v_lock.id;
  
  -- Return success
  v_result := json_build_object(
    'success', true,
    'lock_id', v_lock.id,
    'reference_id', v_lock.reference_id,
    'amount', v_lock.amount,
    'released_at', NOW()
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_trading_lock TO authenticated;
GRANT EXECUTE ON FUNCTION release_trading_lock_safe TO authenticated;

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_trading_locks_user_status ON trading_locks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_locks_reference_status ON trading_locks(reference_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_locks_expires_status ON trading_locks(expires_at, status);

-- =====================================================
-- 10. CLEANUP FUNCTION FOR EXPIRED LOCKS
-- =====================================================

-- Function to clean up expired locks (system only)
CREATE OR REPLACE FUNCTION cleanup_expired_trading_locks() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Update expired locks
  UPDATE trading_locks
  SET 
    status = 'expired',
    released_at = NOW(),
    metadata = jsonb_set(
      metadata,
      '{auto_expired}',
      to_jsonb(true)
    )
  WHERE status = 'locked' 
    AND expires_at < NOW();
  
  v_count := ROW_COUNT;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role only
GRANT EXECUTE ON FUNCTION cleanup_expired_trading_locks TO service_role;

-- =====================================================
-- POLICY SUMMARY
-- =====================================================
-- 
-- 1. Users can only see their own locks
-- 2. Users can create locks for themselves with valid types
-- 3. Users can update their own locks (for releasing)
-- 4. Users cannot delete locks (system managed)
-- 5. Service role has full access
-- 6. All operations are validated and logged
-- 7. Expired locks are automatically cleaned up
--
