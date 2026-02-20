-- =====================================================
-- EMERGENCY FIX FOR 500 ERROR
-- =====================================================
-- Run this if the diagnostic shows RLS policy issues

-- 1. Temporarily disable RLS to test if this is the cause
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Test the query
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';

-- 3. If the query works above, the issue is RLS policies
-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- 4. Create simple, working RLS policies
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for admins" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u2 
      WHERE u2.id = auth.uid() 
      AND (u2.is_admin = true OR u2.admin_role IN ('admin', 'superadmin'))
    )
  );

-- 5. Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Test the final query
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';
