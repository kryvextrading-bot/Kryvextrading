-- SQL Query to Check RLS Policies --
-- This query will help identify RLS policies that might be blocking user visibility

-- Check all RLS policies on all tables
SELECT 
    schemaname,
    tablename,
    policyname,
    definition,
    roles,
    usingcheck,
    checkoption
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
ORDER BY 
    tablename, policyname;

-- Check specific policies on users table
SELECT 
    definition,
    roles,
    check_option
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
    AND tablename = 'users' 
ORDER BY 
    policyname;

-- Check if there are any service role keys
SELECT 
    *
FROM 
    pg_settings 
WHERE 
    name LIKE '%service_role%';

-- Check authentication configuration
SELECT 
    *
FROM 
    pg_settings 
WHERE 
    name LIKE '%auth%';

-- Check for any RLS issues in users table
SELECT 
    pg_get_policydef('public.users'::permissive')
    AS policy_def;

-- This will show the actual policy definition
