-- ========================================
-- BALANCE SYNC SCRIPT
-- Updates users table balance from wallets table
-- ========================================

-- Single User Balance Sync
-- This query updates one user's balance by summing all their wallet balances
UPDATE users 
SET balance = (
  SELECT COALESCE(SUM(w.balance), 0) 
  FROM wallets w 
  WHERE w.user_id = users.id 
    AND w.is_active = true
),
updated_at = NOW()
WHERE users.id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb'; -- Replace with specific user ID

-- ========================================
-- ALL USERS BALANCE SYNC
-- This query updates ALL users' balances by summing their wallet balances
-- ========================================

UPDATE users 
SET balance = (
  SELECT COALESCE(SUM(w.balance), 0) 
  FROM wallets w 
  WHERE w.user_id = users.id 
    AND w.is_active = true
),
updated_at = NOW();

-- ========================================
-- VERIFY THE SYNC
-- Check the updated balances
-- ========================================

-- Show users with their updated balances
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.balance as users_balance,
  (SELECT COALESCE(SUM(w.balance), 0) 
   FROM wallets w 
   WHERE w.user_id = u.id 
     AND w.is_active = true) as calculated_wallet_balance,
  u.updated_at
FROM users u
ORDER BY u.email;

-- ========================================
-- SPECIFIC USER VERIFICATION
-- Check a specific user's balance sync
-- ========================================

SELECT 
  u.id,
  u.email,
  u.balance as users_balance,
  wt.calculated_wallet_balance,
  wt.calculated_wallet_balance - u.balance as difference
FROM users u
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(w.balance), 0) as calculated_wallet_balance
  FROM wallets w 
  WHERE w.user_id = u.id 
    AND w.is_active = true
) wt ON true
WHERE u.id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb'; -- Replace with specific user ID

-- ========================================
-- WALLET BREAKDOWN BY USER
-- Show detailed wallet breakdown for each user
-- ========================================

SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.balance as users_balance,
  w.currency,
  w.balance as wallet_balance,
  w.is_active,
  w.created_at as wallet_created_at
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
WHERE u.id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb' -- Replace with specific user ID
ORDER BY w.currency;

-- ========================================
-- USERS WITH BALANCE DIFFERENCES
-- Find users where users.balance != calculated wallet balance
-- ========================================

WITH wallet_totals AS (
  SELECT 
    user_id,
    COALESCE(SUM(balance), 0) as total_balance
  FROM wallets 
  WHERE is_active = true
  GROUP BY user_id
)
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.balance as users_balance,
  wt.total_balance as calculated_wallet_balance,
  wt.total_balance - u.balance as difference,
  CASE 
    WHEN u.balance = wt.total_balance THEN 'Synced'
    ELSE 'Out of Sync'
  END as sync_status
FROM users u
LEFT JOIN wallet_totals wt ON wt.user_id = u.id
WHERE u.balance != wt.total_balance
   OR u.balance IS NULL
   OR wt.total_balance IS NULL
ORDER BY ABS(wt.total_balance - u.balance) DESC;

-- ========================================
-- CREATE A FUNCTION FOR REUSABLE SYNC
-- Create a function to sync a single user's balance
-- ========================================

CREATE OR REPLACE FUNCTION sync_user_balance(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET balance = (
    SELECT COALESCE(SUM(w.balance), 0) 
    FROM wallets w 
    WHERE w.user_id = user_uuid 
      AND w.is_active = true
  ),
  updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE A FUNCTION FOR ALL USERS SYNC
-- Create a function to sync all users' balances
-- ========================================

CREATE OR REPLACE FUNCTION sync_all_users_balances()
RETURNS INTEGER AS $$
DECLARE
  synced_count INTEGER;
BEGIN
  UPDATE users 
  SET balance = (
    SELECT COALESCE(SUM(w.balance), 0) 
    FROM wallets w 
    WHERE w.user_id = users.id 
      AND w.is_active = true
  ),
  updated_at = NOW();
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RETURN synced_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- USAGE EXAMPLES
-- How to use the sync functions
-- ========================================

-- Sync a single user
-- SELECT sync_user_balance('6ef846d4-8edb-42f0-b386-08bdc67d93eb');

-- Sync all users and get count
-- SELECT sync_all_users_balances();

-- ========================================
-- AUTOMATED SYNC TRIGGER (OPTIONAL)
-- Create a trigger to automatically sync balance when wallets change
-- ========================================

-- Create a function for the trigger
CREATE OR REPLACE FUNCTION auto_sync_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync the user's balance when their wallet changes
  PERFORM sync_user_balance(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (commented out - enable if needed)
/*
CREATE TRIGGER trigger_auto_sync_balance
  AFTER INSERT OR UPDATE OR DELETE
  ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_user_balance();
*/

-- ========================================
-- CLEANUP FUNCTIONS (OPTIONAL)
-- Remove the functions if no longer needed
-- ========================================

-- DROP FUNCTION IF EXISTS sync_user_balance(UUID);
-- DROP FUNCTION IF EXISTS sync_all_users_balances();
-- DROP FUNCTION IF EXISTS auto_sync_user_balance();
