-- Fix RLS policies for deposit_requests table
-- Run this in your Supabase SQL editor

-- 1. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own deposit requests" ON deposit_requests;
DROP POLICY IF EXISTS "Users can view their own deposit requests" ON deposit_requests;
DROP POLICY IF EXISTS "Admins can view all deposit requests" ON deposit_requests;
DROP POLICY IF EXISTS "Admins can update deposit requests" ON deposit_requests;

-- 2. Create policy for users to insert their own deposit requests
CREATE POLICY "Users can insert their own deposit requests" ON deposit_requests
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- 3. Create policy for users to view their own deposit requests
CREATE POLICY "Users can view their own deposit requests" ON deposit_requests
FOR SELECT USING (
  auth.uid() = user_id
);

-- 4. Create policy for admins to view all deposit requests
-- Note: Using proper JSON extraction for JWT claims
CREATE POLICY "Admins can view all deposit requests" ON deposit_requests
FOR SELECT USING (
  (auth.jwt() ->> 'role') = 'service_role' OR
  (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = true)
);

-- 5. Create policy for admins to update deposit requests
CREATE POLICY "Admins can update deposit requests" ON deposit_requests
FOR UPDATE USING (
  (auth.jwt() ->> 'role') = 'service_role' OR
  (auth.jwt() ->> 'user_metadata' ->> 'is_admin' = true)
);

-- 6. Enable RLS on the table
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
