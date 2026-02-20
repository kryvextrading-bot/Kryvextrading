-- =====================================================
-- TRADING SYSTEM CRITICAL TABLES VERIFICATION
-- =====================================================
-- Quick check for essential tables and configurations

-- 1. Check if critical tables exist
SELECT 
  'TABLE_EXISTENCE' as check_type,
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('trades', 'trading_locks', 'wallet_balances')
ORDER BY table_name;

-- 2. Check RLS is enabled on critical tables
SELECT 
  'RLS_STATUS' as check_type,
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED (Security Risk!)'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'trading_locks', 'wallet_balances')
ORDER BY tablename;

-- 3. Check if RLS policies exist
SELECT 
  'RLS_POLICIES' as check_type,
  tablename as table_name,
  CASE 
    WHEN policy_count > 0 THEN '✅ ' || policy_count || ' policies'
    ELSE '❌ NO POLICIES (Security Risk!)'
  END as policy_status
FROM pg_tables pt
LEFT JOIN (
  SELECT tablename, COUNT(*) as policy_count
  FROM pg_policies
  GROUP BY tablename
) pp ON pt.tablename = pp.tablename
WHERE pt.schemaname = 'public'
  AND pt.tablename IN ('trades', 'trading_locks', 'wallet_balances')
ORDER BY pt.tablename;

-- 4. Check table structures (critical columns)
SELECT 
  'CRITICAL_COLUMNS' as check_type,
  table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name IN ('id', 'user_id', 'created_at') AND is_nullable = 'YES' 
    THEN '⚠️  Should be NOT NULL'
    ELSE '✅ OK'
  END as column_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('trades', 'trading_locks', 'wallet_balances')
  AND column_name IN ('id', 'user_id', 'amount', 'status', 'created_at')
ORDER BY table_name, ordinal_position;

-- 5. Check for data issues
SELECT 
  'DATA_INTEGRITY' as check_type,
  issue_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No issues'
    ELSE '⚠️  Needs attention'
  END as status
FROM (
  -- Check for negative balances
  SELECT 'Negative balances' as issue_type
  FROM wallet_balances
  WHERE available < 0 OR locked < 0 OR total < 0
  
  UNION ALL
  
  -- Check for orphaned locks
  SELECT 'Orphaned locks' as issue_type
  FROM trading_locks tl
  LEFT JOIN trades t ON tl.reference_id = t.id::text
  WHERE t.id IS NULL
  
  UNION ALL
  
  -- Check for active trades without locks
  SELECT 'Active trades without locks' as issue_type
  FROM trades t
  LEFT JOIN trading_locks tl ON t.id::text = tl.reference_id
  WHERE t.type = 'options' 
    AND t.status = 'active'
    AND tl.id IS NULL
) issues
GROUP BY issue_type
ORDER BY issue_type;

-- 6. Quick summary
SELECT 
  'SUMMARY' as check_type,
  'Trading System Verification' as description,
  CASE 
    WHEN (
      -- Check if all critical tables exist
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('trades', 'trading_locks', 'wallet_balances')) = 3
      AND
      -- Check if RLS is enabled on all tables
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('trades', 'trading_locks', 'wallet_balances') AND rowsecurity) = 3
    ) THEN '✅ READY FOR DEPLOYMENT'
    ELSE '❌ NEEDS FIXES BEFORE DEPLOYMENT'
  END as deployment_status;

-- =====================================================
-- QUICK FIX RECOMMENDATIONS
-- =====================================================

-- Show what needs to be fixed
SELECT 
  'FIXES_NEEDED' as check_type,
  'Create missing tables' as recommendation,
  CASE 
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('trades', 'trading_locks', 'wallet_balances')) < 3
    THEN 'RUN: unified-trading-tables.sql'
    ELSE 'Already exists'
  END as action
UNION ALL
SELECT 
  'FIXES_NEEDED' as check_type,
  'Enable RLS on tables' as recommendation,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('trades', 'trading_locks', 'wallet_balances') AND rowsecurity) < 3
    THEN 'RUN: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;'
    ELSE 'Already enabled'
  END as action
UNION ALL
SELECT 
  'FIXES_NEEDED' as check_type,
  'Create RLS policies' as recommendation,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('trades', 'trading_locks', 'wallet_balances')) < 3
    THEN 'RUN: unified-trading-tables.sql (policy section)'
    ELSE 'Already created'
  END as action;
