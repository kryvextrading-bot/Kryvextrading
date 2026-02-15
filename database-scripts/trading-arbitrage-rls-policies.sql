-- =====================================================
-- TRADING & ARBITRAGE RLS POLICIES
-- =====================================================
-- This script creates Row Level Security policies for all trading
-- and arbitrage tables to ensure proper data access control

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

-- Trading Locks Table
ALTER TABLE trading_locks ENABLE ROW LEVEL SECURITY;

-- Arbitrage Tables
ALTER TABLE arbitrage_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_locks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. TRADING LOCKS POLICIES
-- =====================================================

-- Users can only see their own trading locks
CREATE POLICY "Users can view own trading locks" ON trading_locks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own trading locks
CREATE POLICY "Users can insert own trading locks" ON trading_locks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own trading locks
CREATE POLICY "Users can update own trading locks" ON trading_locks
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own trading locks
CREATE POLICY "Users can delete own trading locks" ON trading_locks
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 3. ARBITRAGE CONTRACTS POLICIES
-- =====================================================

-- Users can only see their own arbitrage contracts
CREATE POLICY "Users can view own arbitrage contracts" ON arbitrage_contracts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own arbitrage contracts
CREATE POLICY "Users can insert own arbitrage contracts" ON arbitrage_contracts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own arbitrage contracts (limited fields)
CREATE POLICY "Users can update own arbitrage contracts" ON arbitrage_contracts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Users can only update status and metadata (not financial fields)
  status IS NOT NULL AND 
  metadata IS NOT NULL AND
  -- Prevent changing amount, apy, duration after creation
  amount = (SELECT amount FROM arbitrage_contracts WHERE id = id) AND
  apy = (SELECT apy FROM arbitrage_contracts WHERE id = id) AND
  duration = (SELECT duration FROM arbitrage_contracts WHERE id = id)
);

-- Users cannot delete arbitrage contracts (only cancel through function)
-- No DELETE policy for users

-- =====================================================
-- 4. ARBITRAGE LOCKS POLICIES
-- =====================================================

-- Users can only see their own arbitrage locks
CREATE POLICY "Users can view own arbitrage locks" ON arbitrage_locks
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own arbitrage locks
CREATE POLICY "Users can insert own arbitrage locks" ON arbitrage_locks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users cannot update arbitrage locks directly (handled by functions)
-- No UPDATE policy for users

-- Users cannot delete arbitrage locks directly (handled by functions)
-- No DELETE policy for users

-- =====================================================
-- 5. ADMIN POLICIES
-- =====================================================

-- Admin users can view all trading locks
CREATE POLICY "Admins can view all trading locks" ON trading_locks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can update all trading locks
CREATE POLICY "Admins can update all trading locks" ON trading_locks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can delete all trading locks
CREATE POLICY "Admins can delete all trading locks" ON trading_locks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can view all arbitrage contracts
CREATE POLICY "Admins can view all arbitrage contracts" ON arbitrage_contracts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can update all arbitrage contracts
CREATE POLICY "Admins can update all arbitrage contracts" ON arbitrage_contracts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can delete all arbitrage contracts
CREATE POLICY "Admins can delete all arbitrage contracts" ON arbitrage_contracts
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can view all arbitrage locks
CREATE POLICY "Admins can view all arbitrage locks" ON arbitrage_locks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can update all arbitrage locks
CREATE POLICY "Admins can update all arbitrage locks" ON arbitrage_locks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admin users can delete all arbitrage locks
CREATE POLICY "Admins can delete all arbitrage locks" ON arbitrage_locks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- =====================================================
-- 6. SECURITY FUNCTIONS FOR POLICY CHECKS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(p_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = p_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns the record
CREATE OR REPLACE FUNCTION user_owns_record(p_user_id UUID, p_record_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN p_user_id = p_record_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. POLICY TESTING FUNCTIONS
-- =====================================================

-- Function to test RLS policies (admin only)
CREATE OR REPLACE FUNCTION test_rls_policies() RETURNS JSON AS $$
DECLARE
  v_current_user UUID;
  v_is_admin BOOLEAN;
  v_result JSON;
BEGIN
  v_current_user := auth.uid();
  v_is_admin := is_admin_user(v_current_user);
  
  v_result := json_build_object(
    'current_user', v_current_user,
    'is_admin', v_is_admin,
    'trading_locks_count', (SELECT COUNT(*) FROM trading_locks),
    'arbitrage_contracts_count', (SELECT COUNT(*) FROM arbitrage_contracts),
    'arbitrage_locks_count', (SELECT COUNT(*) FROM arbitrage_locks),
    'user_trading_locks', (SELECT COUNT(*) FROM trading_locks WHERE user_id = v_current_user),
    'user_arbitrage_contracts', (SELECT COUNT(*) FROM arbitrage_contracts WHERE user_id = v_current_user),
    'user_arbitrage_locks', (SELECT COUNT(*) FROM arbitrage_locks WHERE user_id = v_current_user)
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. AUDIT TRIGGERS FOR SECURITY
-- =====================================================

-- Audit trigger for trading locks
CREATE OR REPLACE FUNCTION audit_trading_locks() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('trading_locks', TG_OP, NEW.user_id, NEW.id, NULL, row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('trading_locks', TG_OP, NEW.user_id, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('trading_locks', TG_OP, OLD.user_id, OLD.id, row_to_json(OLD), NULL, NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Audit trigger for arbitrage contracts
CREATE OR REPLACE FUNCTION audit_arbitrage_contracts() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('arbitrage_contracts', TG_OP, NEW.user_id, NEW.id, NULL, row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('arbitrage_contracts', TG_OP, NEW.user_id, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, user_id, record_id, old_data, new_data, timestamp)
    VALUES ('arbitrage_contracts', TG_OP, OLD.user_id, OLD.id, row_to_json(OLD), NULL, NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Apply audit triggers
CREATE TRIGGER audit_trading_locks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trading_locks
  FOR EACH ROW EXECUTE FUNCTION audit_trading_locks();

CREATE TRIGGER audit_arbitrage_contracts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON arbitrage_contracts
  FOR EACH ROW EXECUTE FUNCTION audit_arbitrage_contracts();

-- =====================================================
-- 10. GRANT PERMISSIONS FOR SECURITY FUNCTIONS
-- =====================================================

-- Grant execute permissions for security functions
GRANT EXECUTE ON FUNCTION is_admin_user TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_record TO authenticated;
GRANT EXECUTE ON FUNCTION test_rls_policies TO authenticated, service_role;

-- Grant select permissions on audit_log to admins only
GRANT SELECT ON audit_log TO authenticated;
REVOKE SELECT ON audit_log FROM authenticated;

-- Create role for admin users if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin_users') THEN
    CREATE ROLE admin_users;
  END IF;
END
$$;

-- Grant admin users access to audit_log
GRANT SELECT ON audit_log TO admin_users;

-- Add admin users to admin role (you'll need to run this separately for each admin)
-- GRANT admin_users TO user_id;

-- =====================================================
-- 11. POLICY VERIFICATION
-- =====================================================

-- Function to verify all policies are in place
CREATE OR REPLACE FUNCTION verify_rls_policies() RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  v_result := json_build_object(
    'trading_locks_rls_enabled', (SELECT relrowsecurity FROM pg_class WHERE relname = 'trading_locks'),
    'arbitrage_contracts_rls_enabled', (SELECT relrowsecurity FROM pg_class WHERE relname = 'arbitrage_contracts'),
    'arbitrage_locks_rls_enabled', (SELECT relrowsecurity FROM pg_class WHERE relname = 'arbitrage_locks'),
    'trading_locks_policies', (
      SELECT json_agg(policyname) 
      FROM pg_policies 
      WHERE tablename = 'trading_locks'
    ),
    'arbitrage_contracts_policies', (
      SELECT json_agg(policyname) 
      FROM pg_policies 
      WHERE tablename = 'arbitrage_contracts'
    ),
    'arbitrage_locks_policies', (
      SELECT json_agg(policyname) 
      FROM pg_policies 
      WHERE tablename = 'arbitrage_locks'
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION verify_rls_policies TO authenticated, service_role;
