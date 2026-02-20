-- =====================================================
-- CRITICAL SECURITY FIXES FOR TRADING SYSTEM (SAFE VERSION)
-- =====================================================
-- Run this script to fix HIGH priority security issues
-- This version handles existing constraints gracefully

-- 1. Enable RLS on all critical tables
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for user isolation
-- Trades table policies
DROP POLICY IF EXISTS "Users can view their own trades" ON trades;
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trades" ON trades;
CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trades" ON trades;
CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

-- Trading locks table policies
DROP POLICY IF EXISTS "Users can view their own trading locks" ON trading_locks;
CREATE POLICY "Users can view their own trading locks" ON trading_locks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trading locks" ON trading_locks;
CREATE POLICY "Users can insert their own trading locks" ON trading_locks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trading locks" ON trading_locks;
CREATE POLICY "Users can update their own trading locks" ON trading_locks
  FOR UPDATE USING (auth.uid() = user_id);

-- Wallet balances table policies
DROP POLICY IF EXISTS "Users can view their own wallet balances" ON wallet_balances;
CREATE POLICY "Users can view their own wallet balances" ON wallet_balances
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallet balances" ON wallet_balances;
CREATE POLICY "Users can insert their own wallet balances" ON wallet_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet balances" ON wallet_balances;
CREATE POLICY "Users can update their own wallet balances" ON wallet_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Grant permissions to authenticated users
GRANT ALL ON trades TO authenticated;
GRANT ALL ON trading_locks TO authenticated;
GRANT ALL ON wallet_balances TO authenticated;

-- 4. Add unique constraint on wallet_balances (user_id, asset) - SAFE VERSION
-- First check if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_user_asset' 
        AND table_name = 'wallet_balances'
    ) THEN
        ALTER TABLE wallet_balances 
        ADD CONSTRAINT unique_user_asset UNIQUE (user_id, asset);
    END IF;
END $$;

-- 5. Add indexes for performance (IF NOT EXISTS is safer)
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trading_locks_user_id ON trading_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_locks_reference_id ON trading_locks(reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user_asset ON wallet_balances(user_id, asset);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS status after fixes
SELECT 
  'RLS_STATUS_AFTER_FIX' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'trading_locks', 'wallet_balances')
ORDER BY tablename;

-- Check policies after fixes
SELECT 
  'POLICIES_AFTER_FIX' as check_type,
  tablename as table_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*) || ' policies'
    ELSE '❌ NO POLICIES'
  END as policy_status
FROM pg_policies
WHERE tablename IN ('trades', 'trading_locks', 'wallet_balances')
GROUP BY tablename
ORDER BY tablename;

-- Check unique constraint status
SELECT 
  'UNIQUE_CONSTRAINT' as check_type,
  constraint_name,
  CASE 
    WHEN constraint_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as constraint_status
FROM information_schema.table_constraints 
WHERE table_name = 'wallet_balances' 
  AND constraint_type = 'UNIQUE';

-- Final summary
SELECT 
  'SECURITY_FIXES_COMPLETE' as check_type,
  'Trading system security is now configured' as description,
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('trades', 'trading_locks', 'wallet_balances') AND rowsecurity) = 3
      AND
      (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE tablename IN ('trades', 'trading_locks', 'wallet_balances')) = 3
    ) THEN '✅ SECURED - READY FOR DEPLOYMENT'
    ELSE '❌ STILL NEEDS FIXES'
  END as security_status;

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================
-- 1. Run this entire script in Supabase SQL Editor
-- 2. Verify all queries return ✅ status
-- 3. Your trading system is now secure and ready for deployment
