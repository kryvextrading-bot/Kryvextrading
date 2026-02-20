-- =====================================================
-- FIXED RLS POLICIES FOR USERS TABLE
-- =====================================================
-- This file contains proper RLS policies that allow:
-- 1. Admin users to view ALL users
-- 2. Regular users to view only their own data
-- 3. Service role to bypass all restrictions

-- First, drop all existing policies on users table
DROP POLICY IF EXISTS "AdminsCanReadAllUsers" ON users;
DROP POLICY IF EXISTS "UsersCanReadOwnData" ON users;
DROP POLICY IF EXISTS "ServiceRoleBypass" ON users;
DROP POLICY IF EXISTS "UsersCanReadAll" ON users;

-- =====================================================
-- OPTION 1: SERVICE ROLE BYPASS (RECOMMENDED FOR ADMIN)
-- =====================================================
-- This policy allows admin operations using service role key
-- to bypass RLS entirely

CREATE POLICY "AdminServiceRoleBypass" ON users
FOR ALL USING (
  -- Allow service role (bypasses RLS completely)
  auth.role() = 'service_role'
);

-- =====================================================
-- OPTION 2: ADMIN USERS CAN READ ALL USERS
-- =====================================================
-- This policy allows authenticated admin users to read all users
-- Use this if you don't have service role key configured

CREATE POLICY "AdminsCanReadAllUsers" ON users
FOR SELECT USING (
  -- Check if user is admin via custom claim or user table field
  (
    -- Method 1: Check JWT custom claims (proper boolean handling)
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::text = 'true'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin')
  )
  OR
  (
    -- Method 2: Check user table (requires self-join)
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (u.is_admin = true OR u.admin_role IN ('admin', 'superadmin'))
    )
  )
);

-- =====================================================
-- OPTION 3: REGULAR USERS CAN READ OWN DATA
-- =====================================================
-- This policy allows regular users to read only their own data

CREATE POLICY "UsersCanReadOwnData" ON users
FOR SELECT USING (
  auth.uid() = id
);

-- =====================================================
-- INSERT/UPDATE POLICIES
-- =====================================================

-- Admins can insert/update any user
CREATE POLICY "AdminsCanManageUsers" ON users
FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::text = 'true'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin')
  )
);

CREATE POLICY "AdminsCanUpdateUsers" ON users
FOR UPDATE USING (
  auth.role() = 'service_role' OR
  (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::text = 'true'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'superadmin')
  )
);

-- Users can update their own data (except admin fields)
CREATE POLICY "UsersCanUpdateOwnData" ON users
FOR UPDATE USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent users from escalating their own privileges
  is_admin IS NOT DISTINCT FROM is_admin AND
  admin_role IS NOT DISTINCT FROM admin_role
);

-- =====================================================
-- ENABLE RLS ON USERS TABLE
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test the policies
-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 2. Check all policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;

-- 3. Test with different user contexts
-- Run these tests in your Supabase SQL editor:

-- Test as service role (should return all users):
-- SET LOCAL auth.role = 'service_role';
-- SELECT COUNT(*) FROM users;

-- Test as admin user (replace with actual admin user ID):
-- SET LOCAL auth.uid = 'YOUR_ADMIN_USER_ID';
-- SELECT COUNT(*) FROM users;

-- Test as regular user (replace with actual user ID):
-- SET LOCAL auth.uid = 'YOUR_REGULAR_USER_ID';
-- SELECT COUNT(*) FROM users;

-- =====================================================
-- FRONTEND CONFIGURATION NEEDED
-- =====================================================

-- Make sure your .env file contains:
-- VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

-- The service role key can be found in:
-- Supabase Dashboard > Project Settings > API > service_role (secret)

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If users are still not showing up:

-- 1. Check browser console for debug logs from AdminAPI
-- 2. Verify service role key is properly configured in .env
-- 3. Check Supabase logs for any RLS policy violations
-- 4. Ensure the admin user has proper admin flags set in database

-- Quick fix test - temporarily disable RLS:
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- If users appear after this, the issue is definitely RLS policies

-- =====================================================
-- IMPLEMENTATION STEPS
-- =====================================================

-- 1. Run this SQL file in your Supabase SQL editor
-- 2. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file
-- 3. Restart your development server
-- 4. Test the admin dashboard
-- 5. Check browser console for debug logs
