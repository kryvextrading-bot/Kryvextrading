-- ========================================
-- Wallet Management Database Schema
-- ========================================

-- Wallet Requests Table
CREATE TABLE wallet_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
    method VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    transaction_hash VARCHAR(255),
    description TEXT,
    fee DECIMAL(20,8) DEFAULT 0,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Wallet Balances Table
CREATE TABLE wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(10) NOT NULL,
    balance DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    frozen_balance DECIMAL(20,8) NOT NULL DEFAULT 0 CHECK (frozen_balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Wallet Transactions Table
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES wallet_requests(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'freeze', 'unfreeze')),
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    balance_before DECIMAL(20,8) NOT NULL,
    balance_after DECIMAL(20,8) NOT NULL,
    reference_id VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet Settings Table
CREATE TABLE wallet_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default wallet settings
INSERT INTO wallet_settings (key, value, description) VALUES
('min_deposit_amount', '10.00', 'Minimum deposit amount'),
('max_deposit_amount', '100000.00', 'Maximum deposit amount'),
('min_withdrawal_amount', '10.00', 'Minimum withdrawal amount'),
('max_withdrawal_amount', '50000.00', 'Maximum withdrawal amount'),
('daily_withdrawal_limit', '10000.00', 'Daily withdrawal limit'),
('auto_approve_threshold', '1000.00', 'Auto-approve requests below this amount'),
('require_kyc_threshold', '5000.00', 'Require KYC for requests above this amount'),
('supported_currencies', 'USD,BTC,ETH,USDT', 'Supported currencies'),
('default_currency', 'USD', 'Default currency'),
('enable_wallet', 'true', 'Enable wallet functionality'),
('maintenance_mode', 'false', 'Wallet maintenance mode');

-- Indexes for better performance
CREATE INDEX idx_wallet_requests_user_id ON wallet_requests(user_id);
CREATE INDEX idx_wallet_requests_status ON wallet_requests(status);
CREATE INDEX idx_wallet_requests_type ON wallet_requests(type);
CREATE INDEX idx_wallet_requests_created_at ON wallet_requests(created_at);
CREATE INDEX idx_wallet_requests_currency ON wallet_requests(currency);
CREATE INDEX idx_wallet_requests_risk_score ON wallet_requests(risk_score);

CREATE INDEX idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX idx_wallet_balances_currency ON wallet_balances(currency);

CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_wallet_transactions_currency ON wallet_transactions(currency);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_requests_updated_at 
    BEFORE UPDATE ON wallet_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_balances_updated_at 
    BEFORE UPDATE ON wallet_balances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_settings_updated_at 
    BEFORE UPDATE ON wallet_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Row Level Security (RLS) Policies
-- ========================================

-- Enable RLS on wallet tables
ALTER TABLE wallet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_settings ENABLE ROW LEVEL SECURITY;

-- Policy for wallet_requests
-- Users can only see their own requests
CREATE POLICY wallet_requests_user_policy ON wallet_requests
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Admins can see all requests
CREATE POLICY wallet_requests_admin_policy ON wallet_requests
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Policy for wallet_balances
-- Users can only see their own balances
CREATE POLICY wallet_balances_user_policy ON wallet_balances
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Admins can see all balances
CREATE POLICY wallet_balances_admin_policy ON wallet_balances
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Policy for wallet_transactions
-- Users can only see their own transactions
CREATE POLICY wallet_transactions_user_policy ON wallet_transactions
    FOR ALL
    USING (auth.uid()::text = user_id::text);

-- Admins can see all transactions
CREATE POLICY wallet_transactions_admin_policy ON wallet_transactions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- Policy for wallet_settings
-- Only admins can view and modify settings
CREATE POLICY wallet_settings_admin_policy ON wallet_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin = true
        )
    );

-- ========================================
-- Functions for Wallet Operations
-- ========================================

-- Function to create wallet request
CREATE OR REPLACE FUNCTION create_wallet_request(
    p_user_id UUID,
    p_type VARCHAR(20),
    p_amount DECIMAL(20,8),
    p_currency VARCHAR(10),
    p_method VARCHAR(50),
    p_address TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
    v_user_balance DECIMAL(20,8);
    v_daily_total DECIMAL(20,8);
    v_settings RECORD;
BEGIN
    -- Get wallet settings
    SELECT * INTO v_settings FROM wallet_settings WHERE key = 'enable_wallet';
    IF v_settings.value = 'false' THEN
        RAISE EXCEPTION 'Wallet is currently disabled';
    END IF;

    -- Check if user exists and has KYC for large amounts
    SELECT kyc_status INTO v_settings FROM users WHERE id = p_user_id;
    IF v_settings.kyc_status != 'Verified' THEN
        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'require_kyc_threshold';
        IF p_amount >= v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'KYC verification required for amounts >= %', v_settings.value;
        END IF;
    END IF;

    -- Validate amount limits
    IF p_type = 'deposit' THEN
        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'min_deposit_amount';
        IF p_amount < v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'Minimum deposit amount is %', v_settings.value;
        END IF;

        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'max_deposit_amount';
        IF p_amount > v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'Maximum deposit amount is %', v_settings.value;
        END IF;
    ELSIF p_type = 'withdrawal' THEN
        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'min_withdrawal_amount';
        IF p_amount < v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'Minimum withdrawal amount is %', v_settings.value;
        END IF;

        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'max_withdrawal_amount';
        IF p_amount > v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'Maximum withdrawal amount is %', v_settings.value;
        END IF;

        -- Check if user has sufficient balance
        SELECT COALESCE(balance, 0) INTO v_user_balance 
        FROM wallet_balances 
        WHERE user_id = p_user_id AND currency = p_currency;
        
        IF v_user_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance';
        END IF;

        -- Check daily withdrawal limit
        SELECT value INTO v_settings FROM wallet_settings WHERE key = 'daily_withdrawal_limit';
        SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
        FROM wallet_requests
        WHERE user_id = p_user_id 
        AND type = 'withdrawal'
        AND status IN ('approved', 'completed')
        AND created_at >= CURRENT_DATE;
        
        IF v_daily_total + p_amount > v_settings.value::DECIMAL THEN
            RAISE EXCEPTION 'Daily withdrawal limit exceeded';
        END IF;
    END IF;

    -- Create the request
    INSERT INTO wallet_requests (
        user_id, type, amount, currency, method, address, description
    ) VALUES (
        p_user_id, p_type, p_amount, p_currency, p_method, p_address, p_description
    ) RETURNING id INTO v_request_id;

    -- Auto-approve if below threshold
    SELECT value INTO v_settings FROM wallet_settings WHERE key = 'auto_approve_threshold';
    IF p_amount <= v_settings.value::DECIMAL THEN
        UPDATE wallet_requests 
        SET status = 'approved', processed_at = NOW()
        WHERE id = v_request_id;
    END IF;

    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process wallet request
CREATE OR REPLACE FUNCTION process_wallet_request(
    p_request_id UUID,
    p_admin_id UUID,
    p_action VARCHAR(20) -- 'approve', 'reject', 'process'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request wallet_requests%ROWTYPE;
    v_balance DECIMAL(20,8);
    v_frozen_balance DECIMAL(20,8);
BEGIN
    -- Get the request
    SELECT * INTO v_request FROM wallet_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    IF v_request.status NOT IN ('pending', 'approved') THEN
        RAISE EXCEPTION 'Request cannot be processed';
    END IF;

    -- Check if admin is authorized
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_admin_id 
        AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Process based on action
    IF p_action = 'approve' THEN
        UPDATE wallet_requests 
        SET status = 'approved', processed_by = p_admin_id, processed_at = NOW()
        WHERE id = p_request_id;
        
    ELSIF p_action = 'reject' THEN
        UPDATE wallet_requests 
        SET status = 'rejected', processed_by = p_admin_id, processed_at = NOW()
        WHERE id = p_request_id;
        
    ELSIF p_action = 'process' THEN
        IF v_request.status != 'approved' THEN
            RAISE EXCEPTION 'Request must be approved first';
        END IF;

        -- Get or create wallet balance
        SELECT balance, frozen_balance INTO v_balance, v_frozen_balance
        FROM wallet_balances 
        WHERE user_id = v_request.user_id AND currency = v_request.currency;
        
        IF NOT FOUND THEN
            v_balance := 0;
            v_frozen_balance := 0;
            INSERT INTO wallet_balances (user_id, currency, balance, frozen_balance)
            VALUES (v_request.user_id, v_request.currency, 0, 0);
        END IF;

        -- Process the transaction
        IF v_request.type = 'deposit' THEN
            UPDATE wallet_balances 
            SET balance = balance + v_request.amount
            WHERE user_id = v_request.user_id AND currency = v_request.currency;
            
            -- Create transaction record
            INSERT INTO wallet_transactions (
                user_id, request_id, type, amount, currency, 
                balance_before, balance_after, description
            ) VALUES (
                v_request.user_id, v_request.id, 'deposit', v_request.amount, v_request.currency,
                v_balance, v_balance + v_request.amount, 
                'Deposit: ' || COALESCE(v_request.description, '')
            );
            
        ELSIF v_request.type = 'withdrawal' THEN
            IF v_balance < v_request.amount THEN
                RAISE EXCEPTION 'Insufficient balance';
            END IF;
            
            UPDATE wallet_balances 
            SET balance = balance - v_request.amount
            WHERE user_id = v_request.user_id AND currency = v_request.currency;
            
            -- Create transaction record
            INSERT INTO wallet_transactions (
                user_id, request_id, type, amount, currency, 
                balance_before, balance_after, description
            ) VALUES (
                v_request.user_id, v_request.id, 'withdrawal', v_request.amount, v_request.currency,
                v_balance, v_balance - v_request.amount, 
                'Withdrawal: ' || COALESCE(v_request.description, '')
            );
        END IF;

        UPDATE wallet_requests 
        SET status = 'completed', processed_at = NOW()
        WHERE id = p_request_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user wallet balance
CREATE OR REPLACE FUNCTION get_wallet_balance(
    p_user_id UUID,
    p_currency VARCHAR(10) DEFAULT 'USD'
)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    v_balance DECIMAL(20,8);
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get wallet statistics
CREATE OR REPLACE FUNCTION get_wallet_statistics()
RETURNS JSON AS $$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', (SELECT COUNT(*) FROM wallet_requests),
        'pending_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'pending'),
        'approved_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'approved'),
        'completed_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'completed'),
        'rejected_requests', (SELECT COUNT(*) FROM wallet_requests WHERE status = 'rejected'),
        'total_volume', (SELECT COALESCE(SUM(amount), 0) FROM wallet_requests),
        'total_fees', (SELECT COALESCE(SUM(fee), 0) FROM wallet_requests),
        'active_wallets', (SELECT COUNT(DISTINCT user_id) FROM wallet_balances WHERE balance > 0),
        'total_balance', (SELECT COALESCE(SUM(balance), 0) FROM wallet_balances)
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to add funds to user wallet
CREATE OR REPLACE FUNCTION admin_add_funds(
    p_user_id UUID,
    p_amount DECIMAL(20,8),
    p_currency VARCHAR(10),
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL(20,8);
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Get or create wallet balance
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    IF NOT FOUND THEN
        v_balance := 0;
        INSERT INTO wallet_balances (user_id, currency, balance)
        VALUES (p_user_id, p_currency, 0);
    END IF;

    -- Update balance
    UPDATE wallet_balances 
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;

    -- Create transaction record
    INSERT INTO wallet_transactions (
        user_id, type, amount, currency, 
        balance_before, balance_after, description
    ) VALUES (
        p_user_id, 'deposit', p_amount, p_currency,
        v_balance, v_balance + p_amount, 
        COALESCE('Admin add funds: ' || p_reason, 'Admin add funds')
    );

    -- Log admin action
    INSERT INTO wallet_requests (
        user_id, type, amount, currency, method, address, 
        description, status, processed_by, processed_at
    ) VALUES (
        p_user_id, 'deposit', p_amount, p_currency, 'Admin Manual', 
        'ADMIN_ADJUSTMENT', COALESCE('Admin add funds: ' || p_reason, 'Admin add funds'),
        'completed', p_admin_id, NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function for admin to remove funds from user wallet
CREATE OR REPLACE FUNCTION admin_remove_funds(
    p_user_id UUID,
    p_amount DECIMAL(20,8),
    p_currency VARCHAR(10),
    p_admin_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_balance DECIMAL(20,8);
    v_admin_check BOOLEAN;
BEGIN
    -- Check if admin is authorized
    SELECT is_admin INTO v_admin_check FROM users WHERE id = p_admin_id;
    IF NOT FOUND OR v_admin_check = false THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;

    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Get current balance
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    IF NOT FOUND OR v_balance = 0 THEN
        RAISE EXCEPTION 'No wallet balance found for user';
    END IF;

    -- Check sufficient funds
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', v_balance, p_amount;
    END IF;

    -- Update balance
    UPDATE wallet_balances 
    SET balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id AND currency = p_currency;

    -- Create transaction record
    INSERT INTO wallet_transactions (
        user_id, type, amount, currency, 
        balance_before, balance_after, description
    ) VALUES (
        p_user_id, 'withdrawal', p_amount, p_currency,
        v_balance, v_balance - p_amount, 
        COALESCE('Admin remove funds: ' || p_reason, 'Admin remove funds')
    );

    -- Log admin action
    INSERT INTO wallet_requests (
        user_id, type, amount, currency, method, address, 
        description, status, processed_by, processed_at
    ) VALUES (
        p_user_id, 'withdrawal', p_amount, p_currency, 'Admin Manual', 
        'ADMIN_ADJUSTMENT', COALESCE('Admin remove funds: ' || p_reason, 'Admin remove funds'),
        'completed', p_admin_id, NOW()
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user wallet balance (enhanced)
CREATE OR REPLACE FUNCTION get_user_wallet_balance(
    p_user_id UUID,
    p_currency VARCHAR(10) DEFAULT 'USD'
)
RETURNS DECIMAL(20,8) AS $$
DECLARE
    v_balance DECIMAL(20,8);
BEGIN
    SELECT COALESCE(balance, 0) INTO v_balance
    FROM wallet_balances 
    WHERE user_id = p_user_id AND currency = p_currency;
    
    RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get all user wallet balances
CREATE OR REPLACE FUNCTION get_all_user_balances(p_user_id UUID)
RETURNS TABLE (
    currency VARCHAR(10),
    balance DECIMAL(20,8),
    frozen_balance DECIMAL(20,8),
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wb.currency,
        COALESCE(wb.balance, 0) as balance,
        COALESCE(wb.frozen_balance, 0) as frozen_balance,
        wb.updated_at
    FROM wallet_balances wb
    WHERE wb.user_id = p_user_id
    ORDER BY wb.currency;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Views for Reporting
-- ========================================

-- Wallet requests with user details
CREATE VIEW wallet_requests_details AS
SELECT 
    wr.*,
    u.first_name,
    u.last_name,
    u.email,
    u.kyc_status,
    u.is_admin,
    u.admin_role
FROM wallet_requests wr
JOIN users u ON wr.user_id = u.id;

-- Wallet summary by user
CREATE VIEW wallet_summary_by_user AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.kyc_status,
    COALESCE(SUM(CASE WHEN wr.type = 'deposit' AND wr.status = 'completed' THEN wr.amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN wr.type = 'withdrawal' AND wr.status = 'completed' THEN wr.amount ELSE 0 END), 0) as total_withdrawals,
    COALESCE(SUM(wb.balance), 0) as current_balance,
    COUNT(CASE WHEN wr.status = 'pending' THEN 1 END) as pending_requests
FROM users u
LEFT JOIN wallet_requests wr ON u.id = wr.user_id
LEFT JOIN wallet_balances wb ON u.id = wb.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.kyc_status;

-- Daily wallet activity
CREATE VIEW daily_wallet_activity AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN type = 'deposit' THEN 1 END) as deposits,
    COUNT(CASE WHEN type = 'withdrawal' THEN 1 END) as withdrawals,
    COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0) as deposit_volume,
    COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as withdrawal_volume,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
FROM wallet_requests
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ========================================
-- Sample Data (for testing)
-- ========================================

-- Insert sample wallet balances for existing users
-- Using actual user ID from database
INSERT INTO wallet_balances (user_id, currency, balance) VALUES
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'USD', 10000.00),
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'BTC', 0.5);

-- Insert sample wallet requests
INSERT INTO wallet_requests (user_id, type, amount, currency, method, address, description, status) VALUES
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'deposit', 5000.00, 'USD', 'Bank Transfer', '****1234', 'Initial deposit', 'completed'),
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'withdrawal', 1000.00, 'USD', 'Wire Transfer', '****5678', 'Profit withdrawal', 'completed'),
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'deposit', 0.25, 'BTC', 'Crypto Transfer', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'Bitcoin deposit', 'pending');

-- Insert sample transactions
INSERT INTO wallet_transactions (user_id, type, amount, currency, balance_before, balance_after, description) VALUES
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'deposit', 5000.00, 'USD', 5000.00, 10000.00, 'Initial deposit'),
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'withdrawal', 1000.00, 'USD', 10000.00, 9000.00, 'Profit withdrawal'),
('9b952c90-6b06-4c9c-9a1e-c8b4610804e2', 'deposit', 0.25, 'BTC', 0.00, 0.25, 'Bitcoin deposit');

-- ========================================
-- Comments
-- ========================================

-- This schema provides a complete wallet management system with:
-- 1. Request tracking for deposits and withdrawals
-- 2. Balance management with frozen balance support
-- 3. Transaction history and audit trail
-- 4. Risk assessment and KYC integration
-- 5. Row-level security for data protection
-- 6. Comprehensive admin functions
-- 7. Reporting views and statistics
-- 8. Configurable settings and limits

-- The system supports multiple currencies and includes proper
-- validation, error handling, and audit logging for compliance.
