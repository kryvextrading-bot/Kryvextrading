-- Diagnostic script to check current wallet table structure
-- Run this first to understand what exists

-- Check if wallet_balances table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'wallet_balances'
ORDER BY ordinal_position;

-- Check if wallets table exists and its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'wallets'
ORDER BY ordinal_position;

-- Check if trading_locks table exists and its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'trading_locks'
ORDER BY ordinal_position;

-- Show sample data from wallets table (if exists)
SELECT 'Sample wallets data:' as info;
SELECT * FROM wallets LIMIT 3;

-- Show sample data from trading_locks table (if exists)
SELECT 'Sample trading_locks data:' as info;
SELECT * FROM trading_locks LIMIT 3;

-- Check existing constraints on wallet_balances
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'wallet_balances';
