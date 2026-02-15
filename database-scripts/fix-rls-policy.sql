-- Fixed RLS Policy for Users Table
-- This policy allows admin users to read all users and regular users to read their own data

-- Policy for Admin Users (can read all users)
CREATE POLICY "AdminsCanReadAllUsers" ON users
FOR SELECT USING (auth.jwt() ->> 'app_metadata'->>'is_admin' = true)
USING (auth.uid() = id);

-- Policy for Regular Users (can read own data only)
CREATE POLICY "UsersCanReadOwnData" ON users
FOR SELECT USING (auth.uid() = id)
USING (auth.jwt() ->> 'app_metadata'->>'is_admin' = true);

-- Alternative: Single policy for both admin and regular users
-- This policy allows both admin and regular users to read all data
-- Uncomment this if you prefer a single policy approach

/*
CREATE POLICY "UsersCanReadAll" ON users
FOR SELECT USING (auth.jwt() ->> 'app_metadata'->>'is_admin' = true)
USING (auth.uid() = id);
*/

-- Policy for service role bypass (if configured)
-- This allows admin API calls to bypass RLS entirely
CREATE POLICY "ServiceRoleBypass" ON users
FOR ALL USING (auth.jwt() ->> 'app_metadata'->>'is_admin' = true)
USING (auth.uid() = id)
WITH CHECK (auth.jwt() ->> 'app_metadata'->>'service_role' IS NOT NULL);

-- Instructions:
-- 1. Choose ONE approach:
--    - Option A: Two separate policies (AdminsCanReadAllUsers + UsersCanReadOwnData)
--    - Option B: Single unified policy (UsersCanReadAll)
--    - Option C: Service role bypass (ServiceRoleBypass)

-- 2. Replace existing policy with chosen option
-- 3. Save and test the policy

-- Recommended: Start with Option A (two policies) for better security
--         If you have service_role_key configured, you can use Option C instead

-- 4. After fixing, test by refreshing UserManagement page
--    - Should show all 3 users in the list
--    - Console should show: "Total users before filtering: 3"

-- 5. If still issues, check:
--    - Authentication settings in Supabase dashboard
--    - Whether service_role_key is configured
--    - JWT token claims in browser localStorage
--    - Network tab for any failed requests
