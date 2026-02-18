-- Debug wallet_balances table for user 6ef846d4-8edb-42f0-b386-08bdc67d93eb

SELECT 
  user_id,
  asset,
  available,
  funding_balance,
  trading_balance,
  locked,
  total_locked
FROM wallet_balances
WHERE user_id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb'
  AND asset = 'USDT';

-- Check trading_locks table
SELECT 
  id,
  user_id,
  asset,  -- Changed from currency to asset
  amount,
  lock_type,
  reference_id,
  status,
  created_at
FROM trading_locks
WHERE user_id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb'
  AND status = 'locked';
