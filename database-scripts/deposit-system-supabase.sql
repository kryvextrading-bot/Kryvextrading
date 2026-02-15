-- ========================================
-- DEPOSIT SYSTEM SUPABASE TABLES & POLICIES
-- ========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- DEPOSIT REQUESTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deposit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    network TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Processing', 'Completed')),
    proof_url TEXT,
    proof_file_name TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- DEPOSIT TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS deposit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deposit_request_id UUID NOT NULL REFERENCES deposit_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    currency TEXT NOT NULL,
    transaction_type TEXT NOT NULL DEFAULT 'deposit',
    status TEXT NOT NULL DEFAULT 'Completed' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    balance_before DECIMAL(20, 8),
    balance_after DECIMAL(20, 8),
    transaction_hash TEXT,
    network_fee DECIMAL(20, 8) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- USER WALLET BALANCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS user_wallet_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    locked_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_deposited DECIMAL(20, 8) NOT NULL DEFAULT 0,
    total_withdrawn DECIMAL(20, 8) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- ========================================
-- ADMIN ACTION LOG TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('deposit_approve', 'deposit_reject', 'deposit_process', 'user_balance_adjust', 'system_config')),
    target_user_id UUID REFERENCES auth.users(id),
    target_resource_id UUID,
    resource_type TEXT,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_deposit_requests_user_id ON deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposit_requests_created_at ON deposit_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_user_id ON deposit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_transactions_deposit_request_id ON deposit_transactions(deposit_request_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_balances_user_id ON user_wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallet_balances_currency ON user_wallet_balances(currency);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at);

-- ========================================
-- FUNCTIONS AND TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_deposit_requests_updated_at BEFORE UPDATE ON deposit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposit_transactions_updated_at BEFORE UPDATE ON deposit_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_wallet_balances_updated_at BEFORE UPDATE ON user_wallet_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create user wallet balance
CREATE OR REPLACE FUNCTION get_or_create_wallet_balance(
    p_user_id UUID,
    p_currency TEXT
)
RETURNS TABLE(id UUID, balance DECIMAL, locked_balance DECIMAL) AS $$
BEGIN
    INSERT INTO user_wallet_balances (user_id, currency, balance, locked_balance)
    VALUES (p_user_id, p_currency, 0, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;
    
    RETURN QUERY
    SELECT wb.id, wb.balance, wb.locked_balance
    FROM user_wallet_balances wb
    WHERE wb.user_id = p_user_id AND wb.currency = p_currency;
END;
$$ LANGUAGE plpgsql;

-- Function to add funds to user wallet
CREATE OR REPLACE FUNCTION add_funds_to_wallet(
    p_user_id UUID,
    p_currency TEXT,
    p_amount DECIMAL,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_balance DECIMAL, error_message TEXT) AS $$
DECLARE
    current_balance DECIMAL;
    wallet_record RECORD;
BEGIN
    -- Get or create wallet balance
    SELECT * INTO wallet_record FROM get_or_create_wallet_balance(p_user_id, p_currency);
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0::DECIMAL, 'Failed to create wallet record'::TEXT;
        RETURN;
    END IF;
    
    -- Update balance
    UPDATE user_wallet_balances 
    SET 
        balance = balance + p_amount,
        total_deposited = total_deposited + p_amount
    WHERE user_id = p_user_id AND currency = p_currency
    RETURNING balance INTO current_balance;
    
    -- Log transaction
    INSERT INTO deposit_transactions (
        user_id, amount, currency, balance_before, balance_after, description
    ) VALUES (
        p_user_id, p_amount, p_currency, 
        current_balance - p_amount, current_balance, p_description
    );
    
    RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Deposit Requests Policies
CREATE POLICY "Users can view their own deposit requests" ON deposit_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit requests" ON deposit_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE POLICY "Users can insert their own deposit requests" ON deposit_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all deposit requests" ON deposit_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- Deposit Transactions Policies
CREATE POLICY "Users can view their own deposit transactions" ON deposit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deposit transactions" ON deposit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- User Wallet Balances Policies
CREATE POLICY "Users can view their own wallet balances" ON user_wallet_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet balances" ON user_wallet_balances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE POLICY "System can update wallet balances" ON user_wallet_balances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- Admin Action Logs Policies
CREATE POLICY "Admins can view all admin action logs" ON admin_action_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE POLICY "Admins can insert admin action logs" ON admin_action_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Insert sample admin user if not exists
-- This would typically be done through user management
-- INSERT INTO auth.users (id, email, raw_user_meta_data)
-- VALUES ('admin-uuid', 'admin@swan-ira.com', '{"isAdmin": "true"}')
-- ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VIEWS FOR COMMON QUERIES
-- ========================================

-- View for pending deposit requests with user details
CREATE OR REPLACE VIEW pending_deposit_requests AS
SELECT 
    dr.*,
    au.email as user_email,
    au.raw_user_meta_data->>'firstName' as first_name,
    au.raw_user_meta_data->>'lastName' as last_name
FROM deposit_requests dr
JOIN auth.users au ON dr.user_id = au.id
WHERE dr.status = 'Pending'
ORDER BY dr.created_at DESC;

-- View for user wallet summary
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT 
    uwb.user_id,
    au.email,
    uwb.currency,
    uwb.balance,
    uwb.locked_balance,
    uwb.total_deposited,
    uwb.total_withdrawn,
    (uwb.balance + uwb.locked_balance) as total_balance
FROM user_wallet_balances uwb
JOIN auth.users au ON uwb.user_id = au.id
ORDER BY uwb.currency;

-- ========================================
-- COMPLETION MESSAGE
-- ========================================

-- This script creates a complete deposit system with:
-- 1. Deposit requests tracking
-- 2. Transaction history
-- 3. User wallet balances
-- 4. Admin action logging
-- 5. Row Level Security
-- 6. Automated functions for wallet operations
-- 7. Performance indexes
-- 8. Useful views for reporting

SELECT 'Deposit system tables and policies created successfully!' as status;
