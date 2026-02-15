-- =====================================================
-- DIAGNOSE 500 ERROR ON USER FETCH
-- =====================================================
-- Run these queries in Supabase SQL Editor to debug the issue

-- 1. Check if the users table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the specific user exists
SELECT id, email, is_admin, admin_role, created_at
FROM users 
WHERE email = 'kryvextrading@gmail.com';

-- 3. Check current RLS policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- 4. Check for triggers on users table
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND trigger_schema = 'public';

-- 5. Test the exact query that's failing
-- First, try without RLS
SET LOCAL row_security = OFF;
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';

-- Then try with RLS enabled
SET LOCAL row_security = ON;
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';

-- 6. Check for any functions that might be used in RLS policies
SELECT 
    proname,
    prosrc,
    prolang
FROM pg_proc 
WHERE proname LIKE '%user%' 
OR proname LIKE '%auth%'
OR proname LIKE '%admin%'
ORDER BY proname;

-- 7. Check database role permissions
SELECT 
    rolname,
    rolsuper,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls,
    rolconnlimit,
    rolpassword,
    rolvaliduntil
FROM pg_roles 
WHERE rolcanlogin = true
ORDER BY rolname;

-- 8. Test a simple query to see if basic connectivity works
SELECT 1 as test_connection;

-- 9. Check for any broken dependencies
SELECT 
    dependent_ns.nspname AS dependent_schema,
    dependent_view.relname AS dependent_view,
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table
FROM pg_depend
JOIN pg_rewrite AS dependent_rewrite ON dependent_rewrite.oid = pg_depend.objid
JOIN pg_class AS dependent_view ON dependent_view.oid = dependent_rewrite.ev_class
JOIN pg_class AS source_table ON source_table.oid = pg_depend.refobjid
JOIN pg_namespace AS dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace AS source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'users'
AND dependent_ns.nspname = 'public';
