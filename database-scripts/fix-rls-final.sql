-- =====================================================
-- FINAL RLS FIX - Handle Existing Policies
-- =====================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (comprehensive list)
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for own profile" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Enable update for admins" ON users;
DROP POLICY IF EXISTS "Enable delete for admins" ON users;

-- Step 3: Create clean, simple RLS policies
-- Allow authenticated users to read all user data
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile
CREATE POLICY "Enable insert for own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to update any user
CREATE POLICY "Enable update for admins" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u2 
      WHERE u2.id = auth.uid() 
      AND (u2.is_admin = true OR u2.admin_role IN ('admin', 'superadmin'))
    )
  );

-- Allow admins to delete users
CREATE POLICY "Enable delete for admins" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u2 
      WHERE u2.id = auth.uid() 
      AND (u2.is_admin = true OR u2.admin_role IN ('admin', 'superadmin'))
    )
  );

-- Step 4: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the fix
-- Check current policies
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

-- Test query (should return all users for authenticated users)
SELECT COUNT(*) as total_users FROM users;
