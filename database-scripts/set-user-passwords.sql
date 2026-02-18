-- Set Passwords for Existing Users
-- This script sets passwords for all existing users so they can login

-- Set password for regular users: "password123"
UPDATE auth.users 
SET encrypted_password = crypt('password123', gen_salt('bf', 8))
WHERE email IN (
  'ergerh5rjuk@gmail.com',
  'markantii32@gmail.com', 
  'trhrth@gmail.com',
  'fef34g24vt34gc@gmail.com',
  'qdqwdqwdqwff@gmail.com',
  'dsfsdf@gmail.com',
  '123nana@gmail.com',
  'maicarstore@gmail.com',
  'laurentjean535@gmail.com'
);

-- Set admin password: "admin123"
UPDATE auth.users 
SET encrypted_password = crypt('admin123', gen_salt('bf', 8))
WHERE email = 'kryvextrading@gmail.com';

-- Verify the passwords were set
SELECT 
  u.email,
  u.first_name,
  u.last_name,
  u.is_admin,
  CASE 
    WHEN u.email = 'kryvextrading@gmail.com' THEN 'admin123'
    ELSE 'password123'
  END as password
FROM users u
ORDER BY u.is_admin DESC, u.created_at DESC;
