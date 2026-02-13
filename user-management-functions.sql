-- ========================================
-- User Management Functions (Tables Already Exist)
-- ========================================

-- This file contains only the functions for user management.
-- Run this after the user-management-schema.sql has been executed successfully.

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
        user_agent = current_setting('request.headers')::text,
        timestamp = NOW()
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
        user_agent = current_setting('request.headers')::text,
        timestamp = NOW()
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
        user_agent = current_setting('request.headers')::text,
        timestamp = NOW()
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
        user_agent = current_setting('request.headers')::text,
        timestamp = NOW()
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
        user_agent = current_setting('request.headers')::text,
        timestamp = NOW()
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
-- Instructions
-- ========================================

-- 1. First run: user-management-schema.sql to create tables and add columns
-- 2. Then run: user-management-functions.sql to create functions
-- 3. This file assumes tables already exist and only creates functions

-- This approach avoids "table already exists" errors
-- when tables need modifications, use ALTER TABLE statements
