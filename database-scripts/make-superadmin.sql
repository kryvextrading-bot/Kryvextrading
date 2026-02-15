-- Make kryvextrading@gmail.com a super admin
UPDATE users 
SET 
    is_admin = true,
    admin_role = 'superadmin',
    status = 'Active',
    kyc_status = 'Verified',
    updated_at = NOW()
WHERE email = 'kryvextrading@gmail.com';

-- Verify the update
SELECT * FROM users WHERE email = 'kryvextrading@gmail.com';
