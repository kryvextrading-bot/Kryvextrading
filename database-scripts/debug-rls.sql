-- =====================================================
-- DEBUG RLS POLICIES
-- =====================================================
-- This script helps debug the RLS policy issues

-- Step 1: Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- Step 2: Test direct query (bypass RLS temporarily)
SET LOCAL row_security = OFF;
SELECT COUNT(*) as total_users, 
       COUNT(CASE WHEN is_admin = true OR admin_role IN ('admin', 'superadmin') THEN 1 END) as admin_users
FROM users;

-- Step 3: Test with RLS enabled
SET LOCAL row_security = ON;
SELECT COUNT(*) as total_users_rls, 
       COUNT(CASE WHEN is_admin = true OR admin_role IN ('admin', 'superadmin') THEN 1 END) as admin_users_rls
FROM users;

-- Step 4: Check current user's role
-- This will help us understand what the current user looks like
SELECT 
  id,
  email,
  is_admin,
  admin_role,
  created_at
FROM users 
WHERE email = 'kryvextrading@gmail.com';

-- Step 5: Check if RLS is working correctly
-- Test what the current user can see
SELECT 
  u.id,
  u.email,
  u.admin_role
FROM users u
WHERE EXISTS (
  SELECT 1 FROM users u2 
  WHERE u2.id = auth.uid() 
  AND (u2.is_admin = true OR u2.admin_role IN ('admin', 'superadmin'))
);
