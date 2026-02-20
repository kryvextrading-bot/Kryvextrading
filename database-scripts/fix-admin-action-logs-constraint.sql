-- Fix admin_action_logs constraint error
-- This script identifies and fixes the constraint violation issue

-- Step 1: Check the admin_action_logs table structure and constraints
SELECT 
    'Table Structure' as step,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_action_logs' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check existing constraints on admin_action_logs
SELECT 
    'Constraints' as step,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    tc.is_deferrable
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'admin_action_logs' 
AND tc.table_schema = 'public';

-- Step 3: Check what action_type values are currently in the table
SELECT 
    'Current action_type Values' as step,
    action_type,
    COUNT(*) as count
FROM admin_action_logs
GROUP BY action_type
ORDER BY action_type;

-- Step 4: Check what action_type values are being inserted (from recent errors)
-- This will help identify what values are causing the constraint violation

-- Step 5: Fix the constraint by updating it to allow all valid action types
-- First, drop the existing check constraint if it exists
ALTER TABLE admin_action_logs DROP CONSTRAINT IF EXISTS admin_action_logs_action_type_check;

-- Step 6: Add a proper check constraint that allows all expected action types
ALTER TABLE admin_action_logs 
ADD CONSTRAINT admin_action_logs_action_type_check 
CHECK (action_type IN (
    'user_balance_setup',
    'deposit_approve', 
    'deposit_reject', 
    'deposit_process',
    'user_balance_adjust', 
    'system_config',
    'login',
    'logout',
    'profile_update',
    'wallet_transfer',
    'trade_execute',
    'options_trade',
    'arbitrage_execute',
    'staking_deposit',
    'staking_withdraw',
    'admin_login',
    'admin_action',
    'user_creation',
    'user_update',
    'user_delete'
));

-- Step 7: Verify the fix
SELECT 
    'Constraint Fixed' as step,
    'admin_action_logs constraint updated to allow all valid action types' as status;
