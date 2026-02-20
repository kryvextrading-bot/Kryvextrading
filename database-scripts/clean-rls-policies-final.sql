-- =====================================================
-- CLEAN RLS POLICIES - REMOVE ALL CONFLICTS
-- =====================================================
-- This removes ALL policies and creates clean, non-recursive ones

-- Step 1: Disable RLS immediately
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive cleanup)
DROP POLICY IF EXISTS "AdminsManageAll" ON users;
DROP POLICY IF EXISTS "AdminsReadAll" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;
DROP POLICY IF EXISTS "Allow superadmins full access" ON users;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON users;
DROP POLICY IF EXISTS "Allow users to update own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "ServiceRoleBypass" ON users;
DROP POLICY IF EXISTS "UsersReadOwn" ON users;
DROP POLICY IF EXISTS "UsersUpdateOwn" ON users;

-- Step 3: Create simple, clean policies without recursion

-- Policy 1: Authenticated users can read all users
-- This allows admin functions to work properly
CREATE POLICY "Users can read all data" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Service role can bypass all restrictions (for system operations)
CREATE POLICY "Service role bypass" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Step 4: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the policies are working
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

-- Step 6: Test queries that were failing
-- Test 1: Simple count
SELECT COUNT(*) as total_users FROM users;

-- Test 2: Get specific user
SELECT id, email, is_admin, admin_role 
FROM users 
WHERE email = 'kryvextrading@gmail.com';

-- Test 3: Get all users (admin function)
SELECT id, email, status 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
