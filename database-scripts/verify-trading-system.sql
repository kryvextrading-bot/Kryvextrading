-- =====================================================
-- COMPREHENSIVE TRADING SYSTEM VERIFICATION SCRIPT
-- =====================================================
-- This script checks all necessary tables, policies, and potential issues
-- that could affect the trading system functionality

-- Set search path to include public schema
SET search_path TO public, auth;

-- =====================================================
-- 1. CHECK EXISTENCE OF REQUIRED TABLES
-- =====================================================

SELECT 'TABLE_CHECK' as check_type, 
       table_name, 
       table_type,
       CASE WHEN table_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'trades', 'spot_orders', 'futures_positions', 'options_contracts', 
    'arbitrage_contracts', 'trading_locks', 'order_history', 'orders',
    'wallet_balances', 'user_wallet_balances', 'trade_outcomes',
    'trading_windows', 'trade_windows', 'scheduled_options_trades',
    'investment_products', 'investments', 'staking_positions',
    'trading_pairs'
  )
ORDER BY table_name;

-- =====================================================
-- 2. CHECK TABLE STRUCTURES AND COLUMNS
-- =====================================================

-- Check trades table structure
SELECT 'TRADES_COLUMNS' as check_type, 
       column_name, 
       data_type, 
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'trades'
ORDER BY ordinal_position;

-- Check trading_locks table structure  
SELECT 'TRADING_LOCKS_COLUMNS' as check_type,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'trading_locks'
ORDER BY ordinal_position;

-- Check wallet_balances table structure
SELECT 'WALLET_BALANCES_COLUMNS' as check_type,
       column_name,
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'wallet_balances'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK ROW LEVEL SECURITY (RLS) STATUS
-- =====================================================

SELECT 'RLS_STATUS' as check_type,
       tablename as table_name,
       rowsecurity as rls_enabled,
       CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'trades', 'spot_orders', 'futures_positions', 'options_contracts',
    'arbitrage_contracts', 'trading_locks', 'wallet_balances'
  )
ORDER BY tablename;

-- =====================================================
-- 4. CHECK RLS POLICIES FOR EACH TABLE
-- =====================================================

-- Check policies for trades table
SELECT 'TRADES_POLICIES' as check_type,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'trades';

-- Check policies for trading_locks table
SELECT 'TRADING_LOCKS_POLICIES' as check_type,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'trading_locks';

-- Check policies for wallet_balances table
SELECT 'WALLET_BALANCES_POLICIES' as check_type,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'wallet_balances';

-- =====================================================
-- 5. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================

SELECT 'FOREIGN_KEYS' as check_type,
       tc.table_name,
       tc.constraint_name,
       kcu.column_name,
       ccu.table_name AS foreign_table_name,
       ccu.column_name AS foreign_column_name,
       tc.update_rule,
       tc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('trades', 'trading_locks', 'wallet_balances')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 6. CHECK INDEXES FOR PERFORMANCE
-- =====================================================

SELECT 'INDEXES' as check_type,
       schemaname,
       tablename,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'trades', 'trading_locks', 'wallet_balances', 'spot_orders',
    'futures_positions', 'options_contracts', 'arbitrage_contracts'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 7. CHECK TRIGGERS
-- =====================================================

SELECT 'TRIGGERS' as check_type,
       event_object_table as table_name,
       trigger_name,
       event_manipulation as event_type,
       action_timing as timing,
       action_condition as condition,
       action_statement as definition
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('wallet_balances', 'trades', 'trading_locks')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 8. CHECK TABLE SIZES AND ROW COUNTS
-- =====================================================

SELECT 'TABLE_SIZES' as check_type,
       schemaname,
       tablename,
       attname as column_name,
       n_distinct,
       correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND tablename IN (
    'trades', 'trading_locks', 'wallet_balances', 'spot_orders',
    'futures_positions', 'options_contracts', 'arbitrage_contracts'
  )
ORDER BY tablename, attname;

-- =====================================================
-- 9. CHECK FOR COMMON DATA INCONSISTENCIES
-- =====================================================

-- Check for orphaned trading locks (no corresponding trade)
SELECT 'ORPHANED_LOCKS' as check_type,
       COUNT(*) as count,
       'Locks without corresponding trades' as description
FROM trading_locks tl
LEFT JOIN trades t ON tl.reference_id = t.id::text
WHERE t.id IS NULL;

-- Check for trades without locks (should have locks for options)
SELECT 'TRADES_WITHOUT_LOCKS' as check_type,
       COUNT(*) as count,
       'Option trades without corresponding locks' as description
FROM trades t
LEFT JOIN trading_locks tl ON t.id::text = tl.reference_id
WHERE t.type = 'options' 
  AND t.status = 'active'
  AND tl.id IS NULL;

-- Check for negative balances in wallet
SELECT 'NEGATIVE_BALANCES' as check_type,
       user_id,
       asset,
       available,
       locked,
       total
FROM wallet_balances
WHERE available < 0 OR locked < 0 OR total < 0;

-- =====================================================
-- 10. CHECK USER PERMISSIONS
-- =====================================================

SELECT 'USER_PERMISSIONS' as check_type,
       grantee,
       table_schema,
       table_name,
       privilege_type,
       is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN (
    'trades', 'trading_locks', 'wallet_balances', 'spot_orders',
    'futures_positions', 'options_contracts', 'arbitrage_contracts'
  )
ORDER BY table_name, grantee;

-- =====================================================
-- 11. CHECK FOR REQUIRED FUNCTIONS
-- =====================================================

SELECT 'FUNCTIONS_CHECK' as check_type,
       routine_name,
       routine_type,
       data_type as return_type,
       CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'add_balance', 'deduct_balance', 'lock_balance', 'unlock_balance',
    'transfer_to_trading_wallet', 'transfer_to_funding_wallet'
  )
ORDER BY routine_name;

-- =====================================================
-- 12. SAMPLE DATA VERIFICATION
-- =====================================================

-- Check if there are any users in the system
SELECT 'USER_COUNT' as check_type,
       COUNT(*) as count,
       'Total users in auth.users' as description
FROM auth.users;

-- Check sample trading locks data
SELECT 'SAMPLE_LOCKS' as check_type,
       id,
       user_id,
       asset,
       amount,
       status,
       created_at
FROM trading_locks
LIMIT 5;

-- Check sample trades data
SELECT 'SAMPLE_TRADES' as check_type,
       id,
       user_id,
       type,
       status,
       amount,
       created_at
FROM trades
LIMIT 5;

-- =====================================================
-- 13. POTENTIAL ISSUES SUMMARY
-- =====================================================

-- Missing tables that should exist
SELECT 'MISSING_TABLES' as check_type,
       'REQUIRED_TABLE' as item,
       'Table is missing and should be created' as issue
FROM (VALUES 
  ('trades'), ('trading_locks'), ('wallet_balances'), ('spot_orders'),
  ('futures_positions'), ('options_contracts'), ('arbitrage_contracts')
) AS req_tables(table_name)
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = req_tables.table_name
);

-- Tables without RLS (should have RLS enabled)
SELECT 'NO_RLS_TABLES' as check_type,
       tablename as item,
       'RLS should be enabled for security' as issue
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'trading_locks', 'wallet_balances')
  AND NOT rowsecurity;

-- Tables without policies (should have policies)
SELECT 'NO_POLICIES_TABLES' as check_type,
       tablename as item,
       'RLS policies should be defined' as issue
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename IN ('trades', 'trading_locks', 'wallet_balances')
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies pp WHERE pp.tablename = pt.tablename
  );

-- =====================================================
-- 14. RECOMMENDATIONS
-- =====================================================

SELECT 'RECOMMENDATIONS' as check_type,
       recommendation,
       priority
FROM (VALUES 
  ('Enable RLS on all user data tables', 'HIGH'),
  ('Create RLS policies for user isolation', 'HIGH'),
  ('Add indexes on frequently queried columns', 'MEDIUM'),
  ('Set up foreign key constraints', 'MEDIUM'),
  ('Add triggers for balance validation', 'LOW'),
  ('Create audit logging for sensitive operations', 'MEDIUM')
) AS rec(recommendation, priority)
ORDER BY priority DESC, recommendation;

-- =====================================================
-- END OF VERIFICATION SCRIPT
-- =====================================================

-- Usage instructions:
-- 1. Run this script in your Supabase SQL editor
-- 2. Review each section for potential issues
-- 3. Pay special attention to:
--    - MISSING_TABLES (critical)
--    - NO_RLS_TABLES (security issue)
--    - NO_POLICIES_TABLES (security issue)
--    - ORPHANED_LOCKS (data integrity)
--    - NEGATIVE_BALANCES (data integrity)
-- 4. Fix any issues found before deploying the trading system
