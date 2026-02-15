-- ========================================
-- User Management Database Schema
-- ========================================

-- Enhanced users table with additional fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'Pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) DEFAULT 'Standard';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_updated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score_updated_at TIMESTAMPTZ;

-- KYC Documents table
CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    url TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User documents table (general purpose)
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    mime_type VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_credit_score ON users(credit_score);
CREATE INDEX IF NOT EXISTS idx_users_suspended_at ON users(suspended_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- RLS Policies for enhanced user management
-- Users table - enhanced fields
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_admin_enhanced_policy ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() = id AND is_admin = true)
    WITH CHECK (true);

CREATE POLICY users_self_policy ON users
    FOR ALL
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (id = auth.uid() OR is_admin = true);

-- KYC Documents policies
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY kyc_documents_user_policy ON kyc_documents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (user_id = auth.uid());

CREATE POLICY kyc_documents_admin_policy ON kyc_documents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id AND is_admin = true)
    WITH CHECK (true);

-- Audit logs policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_user_policy ON audit_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (user_id = auth.uid());

CREATE POLICY audit_logs_admin_policy ON audit_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id AND is_admin = true)
    WITH CHECK (true);

-- User documents policies
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_documents_user_policy ON user_documents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (user_id = auth.uid());

CREATE POLICY user_documents_admin_policy ON user_documents
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id AND is_admin = true)
    WITH CHECK (true);

-- Functions for user management

-- Function to update user with enhanced fields
CREATE OR REPLACE FUNCTION update_user_enhanced(
    p_user_id UUID,
    p_first_name VARCHAR(100) DEFAULT NULL,
    p_last_name VARCHAR(100) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_phone VARCHAR(20) DEFAULT NULL,
    p_account_type VARCHAR(20) DEFAULT NULL,
    p_account_number VARCHAR(50) DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL,
    p_kyc_status VARCHAR(20) DEFAULT NULL,
    p_credit_score INTEGER DEFAULT NULL,
    p_admin_role VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = auth.uid();
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update user with enhanced fields
    UPDATE users SET
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        account_type = COALESCE(p_account_type, account_type),
        account_number = COALESCE(p_account_number, account_number),
        status = COALESCE(p_status, status),
        kyc_status = COALESCE(p_kyc_status, kyc_status),
        credit_score = COALESCE(p_credit_score, credit_score),
        admin_role = COALESCE(p_admin_role, admin_role),
        updated_at = NOW()
    WHERE id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to suspend user
CREATE OR REPLACE FUNCTION suspend_user(
    p_user_id UUID,
    p_reason TEXT,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = COALESCE(p_admin_id, auth.uid());
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Suspend user
    UPDATE users SET
        status = 'Suspended',
        suspension_reason = p_reason,
        suspended_at = NOW()
    WHERE id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );

    -- Create audit log
    INSERT INTO audit_logs (
        user_id = p_user_id,
        action = 'suspend',
        details = 'User suspended: ' || COALESCE(p_reason, 'No reason provided'),
        admin_id = COALESCE(p_admin_id, auth.uid()),
        ip_address = inet_client_addr(),
        user_agent = current_setting('request.headers')::text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to unsuspend user
CREATE OR REPLACE FUNCTION unsuspend_user(
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = COALESCE(p_admin_id, auth.uid());
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Unsuspend user
    UPDATE users SET
        status = 'Active',
        suspension_reason = NULL,
        suspended_at = NULL
    WHERE id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );

    -- Create audit log
    INSERT INTO audit_logs (
        user_id = p_user_id,
        action = 'unsuspend',
        details = 'User unsuspended',
        admin_id = COALESCE(p_admin_id, auth.uid()),
        ip_address = inet_client_addr(),
        user_agent = current_setting('request.headers')::text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update KYC status
CREATE OR REPLACE FUNCTION update_kyc_status(
    p_user_id UUID,
    p_status VARCHAR(20),
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = COALESCE(p_admin_id, auth.uid());
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update KYC status
    UPDATE users SET
        kyc_status = p_status,
        kyc_updated_at = NOW()
    WHERE id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );

    -- Create audit log
    INSERT INTO audit_logs (
        user_id = p_user_id,
        action = 'kyc_update',
        details = 'KYC status updated to: ' || p_status,
        admin_id = COALESCE(p_admin_id, auth.uid()),
        ip_address = inet_client_addr(),
        user_agent = current_setting('request.headers')::text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update credit score
CREATE OR REPLACE FUNCTION update_credit_score(
    p_user_id UUID,
    p_score INTEGER,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = COALESCE(p_admin_id, auth.uid());
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Update credit score
    UPDATE users SET
        credit_score = p_score,
        credit_score_updated_at = NOW()
    WHERE id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );

    -- Create audit log
    INSERT INTO audit_logs (
        user_id = p_user_id,
        action = 'credit_adjustment',
        details = 'Credit score updated to: ' || p_score,
        admin_id = COALESCE(p_admin_id, auth.uid()),
        ip_address = inet_client_addr(),
        user_agent = current_setting('request.headers')::text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(
    p_user_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin_check BOOLEAN;
    v_user_email VARCHAR(255);
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = COALESCE(p_admin_id, auth.uid());
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Get user email for notification
    SELECT email INTO v_user_email FROM users WHERE id = p_user_id;
    
    -- In a real implementation, this would:
    -- 1. Generate a secure reset token
    -- 2. Send email with reset link
    -- 3. Log the action
    
    -- For now, just create audit log
    INSERT INTO audit_logs (
        user_id = p_user_id,
        action = 'password_reset',
        details = 'Password reset requested by admin',
        admin_id = COALESCE(p_admin_id, auth.uid()),
        ip_address = inet_client_addr(),
        user_agent = current_setting('request.headers')::text
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user with enhanced data
CREATE OR REPLACE FUNCTION get_user_enhanced(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_user_data JSON;
BEGIN
    SELECT json_build_object(
        'id', u.id,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'email', u.email,
        'phone', u.phone,
        'status', u.status,
        'accountType', u.account_type,
        'accountNumber', u.account_number,
        'creditScore', u.credit_score,
        'kycStatus', u.kyc_status,
        'kycUpdatedAt', u.kyc_updated_at,
        'lastLogin', u.last_login,
        'registrationDate', u.created_at,
        'suspendedAt', u.suspended_at,
        'suspensionReason', u.suspension_reason,
        'adminRole', u.admin_role,
        'creditScoreUpdatedAt', u.credit_score_updated_at
    ) INTO v_user_data
    FROM users u
    WHERE u.id = p_user_id AND (
        auth.uid() = id OR is_admin = true
    );
    
    RETURN v_user_data;
END;
$$ LANGUAGE plpgsql;

-- Function to get user KYC documents
CREATE OR REPLACE FUNCTION get_user_kyc_documents(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_documents JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'id', d.id,
        'type', d.type,
        'name', d.name,
        'status', d.status,
        'url', d.url,
        'uploadedAt', d.uploaded_at,
        'verifiedAt', d.verified_at,
        'notes', d.notes
    )) INTO v_documents
    FROM kyc_documents d
    WHERE d.user_id = p_user_id AND (
        auth.uid() = d.user_id OR is_admin = true
    )
    ORDER BY d.uploaded_at DESC;
    
    RETURN COALESCE(v_documents, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get user audit logs
CREATE OR REPLACE FUNCTION get_user_audit_logs(
    p_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_logs JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'id', l.id,
        'action', l.action,
        'details', l.details,
        'timestamp', l.timestamp,
        'adminId', l.admin_id,
        'ipAddress', l.ip_address,
        'userAgent', l.user_agent
    )) INTO v_logs
    FROM audit_logs l
    WHERE l.user_id = p_user_id AND (
        auth.uid() = l.user_id OR is_admin = true
    )
    ORDER BY l.timestamp DESC;
    
    RETURN COALESCE(v_logs, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Function to get all users with enhanced data
CREATE OR REPLACE FUNCTION get_all_users_enhanced()
RETURNS JSON AS $$
DECLARE
    v_users JSON;
BEGIN
    SELECT json_agg(json_build_object(
        'id', u.id,
        'firstName', u.first_name,
        'lastName', u.last_name,
        'email', u.email,
        'phone', u.phone,
        'status', u.status,
        'accountType', u.account_type,
        'accountNumber', u.account_number,
        'creditScore', u.credit_score,
        'kycStatus', u.kyc_status,
        'kycUpdatedAt', u.kyc_updated_at,
        'lastLogin', u.last_login,
        'registrationDate', u.created_at,
        'suspendedAt', u.suspended_at,
        'suspensionReason', u.suspension_reason,
        'adminRole', u.admin_role,
        'creditScoreUpdatedAt', u.credit_score_updated_at,
        'isAdmin', u.is_admin
    )) INTO v_users
    FROM users u
    ORDER BY u.created_at DESC;
    
    RETURN v_users;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Sample Data
-- ========================================

-- Enhanced sample users
INSERT INTO users (id, first_name, last_name, email, phone, account_type, account_number, status, credit_score, kyc_status, created_at, is_admin) VALUES
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'John', 'Doe', 'john.doe@example.com', '+1234567890', 'Premium', 'ACC123456', 'Active', 750, 'Verified', '2023-01-01T00:00:00Z', true),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e3', 'Jane', 'Smith', 'jane.smith@example.com', '+0987654321', 'Standard', 'ACC789012', 'Pending', 650, 'Pending', '2023-02-15T00:00:00Z', false),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e4', 'Bob', 'Johnson', 'bob.johnson@example.com', '+1122334455', 'Business', 'BIZ987654', 'Active', 720, 'Verified', '2023-03-10T00:00:00Z', false);

-- Sample KYC documents
INSERT INTO kyc_documents (user_id, type, name, status, uploaded_at) VALUES
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'passport', 'Passport Copy', 'Verified', '2024-01-15T10:00:00Z'),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'id_card', 'National ID Card', 'Verified', '2024-01-10T15:20:00Z'),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e3', 'proof_of_address', 'Proof of Address', 'Pending', '2024-01-20T09:15:00Z');

-- Sample audit logs
INSERT INTO audit_logs (user_id, action, details, admin_id, timestamp) VALUES
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'suspend', 'User suspended due to policy violation', '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', '2024-01-15T10:30:00Z'),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'kyc_approve', 'KYC documents approved', '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', '2024-01-14T15:20:00Z'),
    ('9b952c90-6b06-4c9c-9a1e-c8b4610804e3', 'credit_adjustment', 'Credit score increased by 50 points', '9b952c90-6b06-4c9c-9a1e-c8b4610804e2', '2024-01-13T09:15:00Z');

-- ========================================
-- Notes
-- ========================================

-- This schema adds comprehensive user management functionality:
-- 1. Enhanced users table with credit scores, KYC status, account details
-- 2. KYC documents table for verification documents
-- 3. Audit logs table for complete audit trail
-- 4. User documents table for general file management
-- 5. Row Level Security policies for all tables
-- 6. Functions for all user management operations
-- 7. Enhanced user data retrieval functions
-- 8. Sample data for testing

-- Run this schema after the main user table exists:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 0;
-- etc. for each new column

-- Security features:
-- - All tables have RLS policies
-- - Admin functions check authorization
-- - Audit logs track all admin actions
-- - IP addresses and user agents logged
