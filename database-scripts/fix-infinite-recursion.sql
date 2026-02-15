-- =====================================================
-- EMERGENCY FIX FOR INFINITE RECURSION IN RLS POLICIES
-- =====================================================
-- Error: infinite recursion detected in policy for relation "users"
-- This happens when RLS policies reference the same table in a circular way

-- Step 1: IMMEDIATELY DISABLE RLS to stop the error
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for own profile" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Enable update for admins" ON users;
DROP POLICY IF EXISTS "Enable delete for admins" ON users;

-- Step 3: Create simple, NON-RECURSIVE policies
-- Policy 1: Allow authenticated users to read all data (simple, no self-reference)
CREATE POLICY "Allow authenticated users to read users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to insert their own record (check auth.uid() = id)
CREATE POLICY "Allow users to insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own record (no subquery)
CREATE POLICY "Allow users to update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Allow superadmins to do anything (simple check)
CREATE POLICY "Allow superadmins full access" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'admin_role' = 'superadmin'
    )
  );

-- Step 5: Re-enable RLS with the new policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 6: Test the fix
-- This should work without recursion errors
SELECT COUNT(*) as test_count FROM users;

-- Test specific user lookup
SELECT id, email, is_admin FROM users WHERE email = 'kryvextrading@gmail.com';

-- Step 7: Show current policies to verify
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
