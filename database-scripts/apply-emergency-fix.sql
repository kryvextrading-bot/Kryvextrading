-- =====================================================
-- APPLY EMERGENCY RLS FIX
-- =====================================================
-- This will fix the RLS policies that are causing the 500 error

-- Step 1: Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;

-- Step 3: Create simple, working RLS policies
-- Allow authenticated users to read all user data (for now)
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

-- Step 5: Test the fix
-- This should now return all users for authenticated users
SELECT COUNT(*) as total_users FROM users;

-- Test specific user lookup (this should work now)
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';
