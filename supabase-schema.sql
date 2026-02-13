-- Kryvextrading.com Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    status TEXT CHECK (status IN ('Active', 'Pending', 'Suspended')) DEFAULT 'Pending',
    kyc_status TEXT CHECK (kyc_status IN ('Verified', 'Pending', 'Rejected')) DEFAULT 'Pending',
    account_type TEXT CHECK (account_type IN ('Traditional IRA', 'Roth IRA')) DEFAULT 'Traditional IRA',
    account_number TEXT,
    balance DECIMAL(20,8) DEFAULT 0,
    last_login TIMESTAMPTZ,
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    two_factor_enabled BOOLEAN DEFAULT false,
    risk_tolerance TEXT CHECK (risk_tolerance IN ('Conservative', 'Moderate', 'Aggressive')) DEFAULT 'Moderate',
    investment_goal TEXT CHECK (investment_goal IN ('Retirement', 'Wealth Building', 'Tax Savings')) DEFAULT 'Retirement',
    is_admin BOOLEAN DEFAULT false,
    admin_role TEXT CHECK (admin_role IN ('admin', 'superadmin', 'finance', 'support')),
    credit_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    type TEXT CHECK (type IN ('Buy', 'Sell', 'Deposit', 'Withdrawal', 'Trade')) NOT NULL,
    asset TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    status TEXT CHECK (status IN ('Completed', 'Pending', 'Failed')) DEFAULT 'Pending',
    date TIMESTAMPTZ DEFAULT NOW(),
    fee DECIMAL(20,8) DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    status TEXT CHECK (status IN ('Pending', 'Verified', 'Rejected')) DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading pairs
CREATE TABLE IF NOT EXISTS public.trading_pairs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    base_asset TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    symbol TEXT UNIQUE NOT NULL,
    min_order_size DECIMAL(20,8) NOT NULL,
    max_order_size DECIMAL(20,8) NOT NULL,
    price_precision INTEGER DEFAULT 2,
    amount_precision INTEGER DEFAULT 6,
    min_notional DECIMAL(20,8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(base_asset, quote_asset)
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pair_id UUID REFERENCES public.trading_pairs(id),
    
    -- Order details
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('market', 'limit', 'stop', 'stop_limit')),
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    
    -- Amounts
    amount DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8),
    stop_price DECIMAL(20,8),
    filled_amount DECIMAL(20,8) DEFAULT 0,
    
    -- Status
    status TEXT CHECK (status IN ('open', 'closed', 'cancelled', 'expired')) DEFAULT 'open',
    
    -- Execution
    executed_price DECIMAL(20,8),
    executed_value DECIMAL(20,8),
    fee DECIMAL(20,8) DEFAULT 0,
    fee_asset TEXT,
    
    -- Leverage (for futures/margin)
    leverage INTEGER DEFAULT 1,
    margin DECIMAL(20,8),
    liquidation_price DECIMAL(20,8),
    
    -- TP/SL
    take_profit DECIMAL(20,8),
    stop_loss DECIMAL(20,8),
    
    -- Timestamps
    expires_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_amount CHECK (amount > 0),
    CONSTRAINT positive_price CHECK (price > 0),
    CONSTRAINT filled_not_exceed CHECK (filled_amount <= amount)
);

-- Positions table (for futures/margin)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    entry_price DECIMAL(20,8) NOT NULL,
    current_price DECIMAL(20,8),
    liquidation_price DECIMAL(20,8),
    margin DECIMAL(20,8) NOT NULL,
    leverage INTEGER NOT NULL,
    unrealized_pnl DECIMAL(20,8) DEFAULT 0,
    realized_pnl DECIMAL(20,8) DEFAULT 0,
    status TEXT CHECK (status IN ('open', 'closed', 'liquidated')) DEFAULT 'open',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment products table
CREATE TABLE IF NOT EXISTS public.investment_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('quant-trading', 'node-staking', 'ai-arbitrage', 'defi', 'mining', 'real-estate', 'private-equity')),
    name TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    
    -- Investment details
    min_investment DECIMAL(20,8) NOT NULL,
    max_investment DECIMAL(20,8),
    expected_return DECIMAL(5,2) NOT NULL,
    actual_return DECIMAL(5,2),
    duration TEXT NOT NULL,
    duration_days INTEGER,
    
    -- Risk & fees
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'very-high')) DEFAULT 'medium',
    management_fee DECIMAL(5,2) DEFAULT 1.0,
    performance_fee DECIMAL(5,2) DEFAULT 20.0,
    early_withdrawal_penalty DECIMAL(5,2),
    lockup_period TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive', 'coming-soon', 'ended', 'paused')) DEFAULT 'active',
    
    -- Metadata
    icon TEXT,
    image_url TEXT,
    tags TEXT[],
    featured BOOLEAN DEFAULT false,
    popular BOOLEAN DEFAULT false,
    
    -- Stats
    total_invested DECIMAL(20,8) DEFAULT 0,
    investors_count INTEGER DEFAULT 0,
    
    -- Availability
    available_from DATE,
    available_to DATE,
    max_capacity DECIMAL(20,8),
    
    -- Documents
    documents JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    
    CONSTRAINT positive_min_investment CHECK (min_investment > 0),
    CONSTRAINT valid_expected_return CHECK (expected_return >= 0 AND expected_return <= 100)
);

-- User investments table
CREATE TABLE IF NOT EXISTS public.user_investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.investment_products(id) ON DELETE CASCADE,
    
    -- Investment details
    amount DECIMAL(20,8) NOT NULL,
    current_value DECIMAL(20,8) NOT NULL,
    returns DECIMAL(20,8) DEFAULT 0,
    returns_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'pending', 'completed', 'cancelled')) DEFAULT 'active',
    
    -- Dates
    start_date TIMESTAMPTZ DEFAULT NOW(),
    maturity_date TIMESTAMPTZ,
    last_distribution_date TIMESTAMPTZ,
    
    -- Distribution
    distribution_frequency TEXT CHECK (distribution_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'at_maturity')),
    total_distributions DECIMAL(20,8) DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- Arbitrage contracts table
CREATE TABLE IF NOT EXISTS public.arbitrage_contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    daily_rate DECIMAL(5,2) NOT NULL,
    duration INTEGER NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    pnl DECIMAL(20,8),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staking positions table
CREATE TABLE IF NOT EXISTS public.staking_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    apy DECIMAL(5,2) NOT NULL,
    duration INTEGER NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    rewards DECIMAL(20,8) DEFAULT 0,
    claimed_rewards DECIMAL(20,8) DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User loans table
CREATE TABLE IF NOT EXISTS public.user_loans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Loan details
    amount DECIMAL(20,8) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_days INTEGER NOT NULL,
    collateral_amount DECIMAL(20,8),
    collateral_asset TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('pending', 'active', 'repaid', 'defaulted', 'liquidated')) DEFAULT 'pending',
    
    -- Dates
    issued_at TIMESTAMPTZ,
    due_at TIMESTAMPTZ,
    repaid_at TIMESTAMPTZ,
    
    -- Payments
    total_paid DECIMAL(20,8) DEFAULT 0,
    total_interest DECIMAL(20,8) DEFAULT 0,
    last_payment_date TIMESTAMPTZ,
    
    -- Risk
    risk_score INTEGER,
    
    -- Metadata
    notes TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Loan repayments table
CREATE TABLE IF NOT EXISTS public.loan_repayments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES public.user_loans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    principal DECIMAL(20,8) NOT NULL,
    interest DECIMAL(20,8) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in-app')),
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in-app')),
    email_alerts BOOLEAN DEFAULT true,
    sms_alerts BOOLEAN DEFAULT false,
    push_alerts BOOLEAN DEFAULT true,
    transaction_alerts BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    daily_summary BOOLEAN DEFAULT true,
    weekly_report BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, channel)
);

-- API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    permissions TEXT[],
    allowed_ips INET[],
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS public.daily_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    new_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_volume DECIMAL(20,8) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    total_trades INTEGER DEFAULT 0,
    total_deposits DECIMAL(20,8) DEFAULT 0,
    total_withdrawals DECIMAL(20,8) DEFAULT 0,
    total_fees DECIMAL(20,8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order history table
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'filled', 'cancelled', 'expired')),
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investment performance table
CREATE TABLE IF NOT EXISTS public.investment_performance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    investment_id UUID NOT NULL REFERENCES public.user_investments(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value DECIMAL(20,8) NOT NULL,
    return_amount DECIMAL(20,8) DEFAULT 0,
    return_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES public.users(id),
    user_email TEXT,
    admin_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'IMPORT')),
    target_type TEXT NOT NULL,
    target_id UUID,
    target_name TEXT,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_failed', 'login_success', 'password_changed', 'email_changed', 'phone_changed', 'two_factor_enabled', 'two_factor_disabled', 'withdrawal_requested', 'withdrawal_approved', 'kyc_submitted', 'kyc_approved', 'kyc_rejected', 'suspicious_activity')),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    metadata JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT CHECK (category IN ('general', 'security', 'trading', 'backup', 'api', 'database', 'integrations', 'monitoring', 'compliance', 'notifications')) NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id),
    UNIQUE(category, key)
);

-- Ensure description column exists (for existing tables)
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Ensure is_public column exists (for existing tables)
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Ensure updated_by column exists (for existing tables)
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id);

-- User wallets (multi-currency support)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'LINK', 'MATIC')),
    balance DECIMAL(20,8) DEFAULT 0,
    locked_balance DECIMAL(20,8) DEFAULT 0,
    deposit_address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- Investments table
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    min_investment DECIMAL(20,8) NOT NULL,
    expected_return DECIMAL(5,2) NOT NULL,
    duration TEXT NOT NULL,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_transactions_updated_at ON public.transactions;
CREATE TRIGGER handle_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_kyc_documents_updated_at ON public.kyc_documents;
CREATE TRIGGER handle_kyc_documents_updated_at
    BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER handle_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_investments_updated_at ON public.investments;
CREATE TRIGGER handle_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_wallets_updated_at ON public.wallets;
CREATE TRIGGER handle_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_trading_pairs_updated_at ON public.trading_pairs;
CREATE TRIGGER handle_trading_pairs_updated_at
    BEFORE UPDATE ON public.trading_pairs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_orders_updated_at ON public.orders;
CREATE TRIGGER handle_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_positions_updated_at ON public.positions;
CREATE TRIGGER handle_positions_updated_at
    BEFORE UPDATE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_investment_products_updated_at ON public.investment_products;
CREATE TRIGGER handle_investment_products_updated_at
    BEFORE UPDATE ON public.investment_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_investments_updated_at ON public.user_investments;
CREATE TRIGGER handle_user_investments_updated_at
    BEFORE UPDATE ON public.user_investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_arbitrage_contracts_updated_at ON public.arbitrage_contracts;
CREATE TRIGGER handle_arbitrage_contracts_updated_at
    BEFORE UPDATE ON public.arbitrage_contracts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_staking_positions_updated_at ON public.staking_positions;
CREATE TRIGGER handle_staking_positions_updated_at
    BEFORE UPDATE ON public.staking_positions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_loans_updated_at ON public.user_loans;
CREATE TRIGGER handle_user_loans_updated_at
    BEFORE UPDATE ON public.user_loans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_loan_repayments_updated_at ON public.loan_repayments;
CREATE TRIGGER handle_loan_repayments_updated_at
    BEFORE UPDATE ON public.loan_repayments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_notifications_updated_at ON public.notifications;
CREATE TRIGGER handle_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER handle_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER handle_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_user_activity_updated_at ON public.user_activity;
CREATE TRIGGER handle_user_activity_updated_at
    BEFORE UPDATE ON public.user_activity
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_daily_stats_updated_at ON public.daily_stats;
CREATE TRIGGER handle_daily_stats_updated_at
    BEFORE UPDATE ON public.daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_order_history_updated_at ON public.order_history;
CREATE TRIGGER handle_order_history_updated_at
    BEFORE UPDATE ON public.order_history
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_investment_performance_updated_at ON public.investment_performance;
CREATE TRIGGER handle_investment_performance_updated_at
    BEFORE UPDATE ON public.investment_performance
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_audit_logs_updated_at ON public.audit_logs;
CREATE TRIGGER handle_audit_logs_updated_at
    BEFORE UPDATE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_security_events_updated_at ON public.security_events;
CREATE TRIGGER handle_security_events_updated_at
    BEFORE UPDATE ON public.security_events
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arbitrage_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_performance ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

-- Transactions RLS policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;
CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

-- KYC Documents RLS policies
DROP POLICY IF EXISTS "Users can view own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upload own KYC documents" ON public.kyc_documents;
CREATE POLICY "Users can upload own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON public.kyc_documents;
CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Storage policies
DROP POLICY IF EXISTS "Users can upload own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view own KYC documents" ON storage.objects;
CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Admins can view all KYC documents" ON storage.objects;
CREATE POLICY "Admins can view all KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin')
    );

-- Wallets RLS policies
DROP POLICY IF EXISTS "Users can view own wallets" ON public.wallets;
CREATE POLICY "Users can view own wallets" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallets" ON public.wallets;
CREATE POLICY "Users can update own wallets" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
CREATE POLICY "Admins can view all wallets" ON public.wallets
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallets;
CREATE POLICY "Admins can update all wallets" ON public.wallets
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Orders RLS policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders" ON public.orders
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Positions RLS policies
DROP POLICY IF EXISTS "Users can view own positions" ON public.positions;
CREATE POLICY "Users can view own positions" ON public.positions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own positions" ON public.positions;
CREATE POLICY "Users can create own positions" ON public.positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own positions" ON public.positions;
CREATE POLICY "Users can update own positions" ON public.positions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all positions" ON public.positions;
CREATE POLICY "Admins can view all positions" ON public.positions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all positions" ON public.positions;
CREATE POLICY "Admins can update all positions" ON public.positions
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Investment Products RLS policies (public read, admin write)
DROP POLICY IF EXISTS "Public can view investment products" ON public.investment_products;
CREATE POLICY "Public can view investment products" ON public.investment_products
    FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage investment products" ON public.investment_products;
CREATE POLICY "Admins can manage investment products" ON public.investment_products
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- User Investments RLS policies
DROP POLICY IF EXISTS "Users can view own investments" ON public.user_investments;
CREATE POLICY "Users can view own investments" ON public.user_investments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own investments" ON public.user_investments;
CREATE POLICY "Users can create own investments" ON public.user_investments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investments" ON public.user_investments;
CREATE POLICY "Users can update own investments" ON public.user_investments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all investments" ON public.user_investments;
CREATE POLICY "Admins can view all investments" ON public.user_investments
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all investments" ON public.user_investments;
CREATE POLICY "Admins can update all investments" ON public.user_investments
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Arbitrage Contracts RLS policies
DROP POLICY IF EXISTS "Users can view own arbitrage contracts" ON public.arbitrage_contracts;
CREATE POLICY "Users can view own arbitrage contracts" ON public.arbitrage_contracts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own arbitrage contracts" ON public.arbitrage_contracts;
CREATE POLICY "Users can create own arbitrage contracts" ON public.arbitrage_contracts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own arbitrage contracts" ON public.arbitrage_contracts;
CREATE POLICY "Users can update own arbitrage contracts" ON public.arbitrage_contracts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all arbitrage contracts" ON public.arbitrage_contracts;
CREATE POLICY "Admins can view all arbitrage contracts" ON public.arbitrage_contracts
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Staking Positions RLS policies
DROP POLICY IF EXISTS "Users can view own staking positions" ON public.staking_positions;
CREATE POLICY "Users can view own staking positions" ON public.staking_positions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own staking positions" ON public.staking_positions;
CREATE POLICY "Users can create own staking positions" ON public.staking_positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own staking positions" ON public.staking_positions;
CREATE POLICY "Users can update own staking positions" ON public.staking_positions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all staking positions" ON public.staking_positions;
CREATE POLICY "Admins can view all staking positions" ON public.staking_positions
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- User Loans RLS policies
DROP POLICY IF EXISTS "Users can view own loans" ON public.user_loans;
CREATE POLICY "Users can view own loans" ON public.user_loans
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own loans" ON public.user_loans;
CREATE POLICY "Users can create own loans" ON public.user_loans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own loans" ON public.user_loans;
CREATE POLICY "Users can update own loans" ON public.user_loans
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all loans" ON public.user_loans;
CREATE POLICY "Admins can view all loans" ON public.user_loans
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all loans" ON public.user_loans;
CREATE POLICY "Admins can update all loans" ON public.user_loans
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Notifications RLS policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;
CREATE POLICY "Admins can update all notifications" ON public.notifications
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Notification Preferences RLS policies
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notification preferences" ON public.notification_preferences;
CREATE POLICY "Admins can view all notification preferences" ON public.notification_preferences
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- API Keys RLS policies
DROP POLICY IF EXISTS "Users can manage own API keys" ON public.api_keys;
CREATE POLICY "Users can manage own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all API keys" ON public.api_keys;
CREATE POLICY "Admins can view all API keys" ON public.api_keys
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- User Activity RLS policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity" ON public.user_activity
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own activity" ON public.user_activity;
CREATE POLICY "Users can create own activity" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity" ON public.user_activity;
CREATE POLICY "Admins can view all activity" ON public.user_activity
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Audit Logs RLS policies (admin only)
DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins can manage audit logs" ON public.audit_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Security Events RLS policies (admin only)
DROP POLICY IF EXISTS "Admins can manage security events" ON public.security_events;
CREATE POLICY "Admins can manage security events" ON public.security_events
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Daily Stats RLS policies (admin only)
DROP POLICY IF EXISTS "Admins can manage daily stats" ON public.daily_stats;
CREATE POLICY "Admins can manage daily stats" ON public.daily_stats
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Trading Pairs RLS policies (public read, admin write)
DROP POLICY IF EXISTS "Public can view trading pairs" ON public.trading_pairs;
CREATE POLICY "Public can view trading pairs" ON public.trading_pairs
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage trading pairs" ON public.trading_pairs;
CREATE POLICY "Admins can manage trading pairs" ON public.trading_pairs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Order History RLS policies
DROP POLICY IF EXISTS "Users can view own order history" ON public.order_history;
CREATE POLICY "Users can view own order history" ON public.order_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own order history" ON public.order_history;
CREATE POLICY "Users can create own order history" ON public.order_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all order history" ON public.order_history;
CREATE POLICY "Admins can view all order history" ON public.order_history
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Investment Performance RLS policies
DROP POLICY IF EXISTS "Users can view own investment performance" ON public.investment_performance;
CREATE POLICY "Users can view own investment performance" ON public.investment_performance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_investments ui 
            WHERE ui.id = investment_id AND ui.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create own investment performance" ON public.investment_performance;
CREATE POLICY "Users can create own investment performance" ON public.investment_performance
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_investments ui 
            WHERE ui.id = investment_id AND ui.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all investment performance" ON public.investment_performance;
CREATE POLICY "Admins can view all investment performance" ON public.investment_performance
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Loan Repayments RLS policies
DROP POLICY IF EXISTS "Users can view own loan repayments" ON public.loan_repayments;
CREATE POLICY "Users can view own loan repayments" ON public.loan_repayments
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own loan repayments" ON public.loan_repayments;
CREATE POLICY "Users can create own loan repayments" ON public.loan_repayments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all loan repayments" ON public.loan_repayments;
CREATE POLICY "Admins can view all loan repayments" ON public.loan_repayments
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin'
    );

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
    'kyc-documents',
    'kyc-documents',
    false
) ON CONFLICT (id) DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
    ('general', 'platformName', '"Swan IRA"', 'Platform name'),
    ('general', 'supportEmail', '"support@swan-ira.com"', 'Support email address'),
    ('general', 'maintenanceMode', 'false', 'Maintenance mode flag'),
    ('general', 'registrationEnabled', 'true', 'Allow new user registrations'),
    ('general', 'maxLoginAttempts', '5', 'Maximum login attempts before lockout'),
    ('general', 'sessionTimeout', '30', 'Session timeout in minutes'),
    ('security', 'twoFactorRequired', 'true', 'Require 2FA for all users'),
    ('security', 'passwordMinLength', '8', 'Minimum password length'),
    ('security', 'requireSpecialChars', 'true', 'Require special characters in passwords'),
    ('security', 'requireNumbers', 'true', 'Require numbers in passwords'),
    ('security', 'requireUppercase', 'true', 'Require uppercase letters in passwords'),
    ('security', 'maxPasswordAge', '90', 'Password expiry in days'),
    ('security', 'rateLimitEnabled', 'true', 'Enable rate limiting'),
    ('security', 'rateLimitRequests', '100', 'Rate limit requests per window'),
    ('security', 'rateLimitWindow', '15', 'Rate limit window in minutes'),
    ('trading', 'tradingEnabled', 'true', 'Enable trading functionality'),
    ('trading', 'minTradeAmount', '10', 'Minimum trade amount'),
    ('trading', 'maxTradeAmount', '100000', 'Maximum trade amount'),
    ('trading', 'autoApprovalLimit', '1000', 'Auto approval limit for trades'),
    ('trading', 'requireKycForLargeTrades', 'true', 'Require KYC for large trades'),
    ('trading', 'largeTradeThreshold', '10000', 'Threshold for large trades')
ON CONFLICT (category, key) DO NOTHING;

-- Insert sample investments
INSERT INTO public.investments (type, name, description, min_investment, expected_return, duration, risk_level) VALUES
    ('quant-trading', 'Crypto Growth Fund', 'A diversified crypto fund with algorithmic trading.', 1000, 8.5, '12 months', 'medium'),
    ('node-staking', 'Stablecoin Staking', 'Stake stablecoins for steady returns.', 500, 5.2, '6 months', 'low'),
    ('ai-arbitrage', 'DeFi Yield Pool', 'AI-powered DeFi arbitrage pool.', 2000, 12.0, '3 months', 'high')
ON CONFLICT DO NOTHING;

-- Create admin user (you should change the password after first login)
INSERT INTO public.users (email, first_name, last_name, status, kyc_status, account_type, account_number, balance, registration_date, two_factor_enabled, risk_tolerance, investment_goal, is_admin, admin_role)
VALUES (
    'admin@kryvextrading.com',
    'Admin',
    'User',
    'Active',
    'Verified',
    'Admin',
    'ADMIN-0001',
    0,
    NOW(),
    true,
    'Moderate',
    'Admin',
    true,
    'superadmin'
) ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant storage permissions
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON public.transactions(asset);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON public.transactions(reference_id);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON public.wallets(currency);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_symbol ON public.orders(symbol);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_symbol ON public.positions(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(status);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON public.kyc_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_status ON public.kyc_documents(status);

CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON public.user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_product_id ON public.user_investments(product_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_status ON public.user_investments(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events(created_at);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify reference_id column exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'reference_id'
    ) THEN
        RAISE NOTICE '✅ reference_id column exists in transactions table';
    ELSE
        RAISE WARNING '❌ reference_id column does NOT exist in transactions table';
    END IF;
END $$;
