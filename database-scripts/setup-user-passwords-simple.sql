-- Setup Passwords for Existing Users
-- Run this in your Supabase SQL Editor

-- Set password for admin user (kryvextrading@gmail.com)
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf', 8))
WHERE email = 'kryvextrading@gmail.com';

-- Set password for regular users
UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf', 8))
WHERE email IN (
  'trhrth@gmail.com',
  'laurentjean535@gmail.com',
  'dsfsdf@gmail.com',
  'ergerh5rjuk@gmail.com',
  '123nana@gmail.com',
  'fef34g24vt34gc@gmail.com',
  'maicarstore@gmail.com',
  'qdqwdqwdqwff@gmail.com'
);

-- Verify setup
SELECT 
  email,
  first_name,
  last_name,
  is_admin,
  admin_role,
  balance,
  CASE 
    WHEN email = 'kryvextrading@gmail.com' THEN 'admin123'
    ELSE 'password123'
  END as password
FROM users 
ORDER BY is_admin DESC, created_at DESC;
