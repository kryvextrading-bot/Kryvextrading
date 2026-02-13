-- ⚠️  DANGER: This will delete ALL users from your system
-- ⚠️  This action is IRREVERSIBLE
-- ⚠️  Make sure you have backups before running this

-- Delete all users from your public.users table first (foreign key constraint)
DELETE FROM public.users;

-- Delete all users from Supabase Auth
-- This requires service role privileges
DELETE FROM auth.users;

-- Optionally, delete all user-related data
-- Uncomment these lines if you want to clean up everything

-- Delete user transactions
-- DELETE FROM public.transactions;

-- Delete KYC documents
-- DELETE FROM public.kyc_documents;

-- Delete user wallets
-- DELETE FROM public.wallets;

-- Delete user investments
-- DELETE FROM public.user_investments;

-- Delete user activity logs
-- DELETE FROM public.user_activity;

-- Delete notifications
-- DELETE FROM public.notifications;

-- Delete notification preferences
-- DELETE FROM public.notification_preferences;

-- Delete API keys
-- DELETE FROM public.api_keys;

-- Reset any sequences if needed
-- ALTER SEQUENCE public.users_id_seq RESTART WITH 1;

-- Commit the transaction
-- Note: In Supabase SQL Editor, this runs automatically
