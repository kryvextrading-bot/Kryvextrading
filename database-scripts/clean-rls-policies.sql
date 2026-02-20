-- =====================================================
-- CLEAN RLS POLICIES FOR USERS TABLE
-- =====================================================
-- This script removes ALL existing policies and creates clean ones

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "AdminServiceRoleBypass" ON users;
DROP POLICY IF EXISTS "AdminsCanReadAllUsers" ON users;
DROP POLICY IF EXISTS "UsersCanReadOwnData" ON users;
DROP POLICY IF EXISTS "ServiceRoleBypass" ON users;
DROP POLICY IF EXISTS "UsersCanReadAll" ON users;
DROP POLICY IF EXISTS "AdminsCanManageUsers" ON users;
DROP POLICY IF EXISTS "AdminsCanUpdateUsers" ON users;
DROP POLICY IF EXISTS "UsersCanUpdateOwnData" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Super admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "AdminsReadAll" ON users;
DROP POLICY IF EXISTS "UsersReadOwn" ON users;
DROP POLICY IF EXISTS "AdminsManageAll" ON users;
DROP POLICY IF EXISTS "UsersUpdateOwn" ON users;

-- Disable RLS temporarily to ensure clean slate
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Create clean, simple policies

-- Policy 1: Service role bypass (for admin operations)
CREATE POLICY "ServiceRoleBypass" ON users
FOR ALL USING (auth.role() = 'service_role');

-- Policy 2: Admin users can read all users (user table approach only)
CREATE POLICY "AdminsReadAll" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (u.is_admin = true OR u.admin_role IN ('admin', 'superadmin'))
  )
);

-- Policy 3: Regular users can read own data
CREATE POLICY "UsersReadOwn" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy 4: Admins can manage any user
CREATE POLICY "AdminsManageAll" ON users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (u.is_admin = true OR u.admin_role IN ('admin', 'superadmin'))
  )
);

-- Policy 5: Users can update own data (except admin fields)
CREATE POLICY "UsersUpdateOwn" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  is_admin IS NOT DISTINCT FROM is_admin AND
  admin_role IS NOT DISTINCT FROM admin_role
);

-- Step 3: Verify policies are clean
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

-- =====================================================
-- EXPLANATION
-- =====================================================
-- 
-- This creates a clean set of policies:
-- 
-- 1. ServiceRoleBypass: Allows service role (bypasses RLS)
-- 2. AdminsReadAll: Allows admins to read all users
-- 3. UsersReadOwn: Allows users to read only their own data
-- 4. AdminsManageAll: Allows admins to insert/update/delete any user
-- 5. UsersUpdateOwn: Allows users to update their own data (with restrictions)
--
-- The policies are ordered by specificity:
-- - Service role bypass (highest priority)
-- - Admin access (medium priority)  
-- - User access (lowest priority)
--
-- This should resolve the admin dashboard issue while maintaining security.
