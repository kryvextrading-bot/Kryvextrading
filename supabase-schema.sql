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

-- System Settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category TEXT CHECK (category IN ('general', 'security', 'trading')) NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, key)
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
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_kyc_documents_updated_at
    BEFORE UPDATE ON public.kyc_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_investments_updated_at
    BEFORE UPDATE ON public.investments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

-- Transactions RLS policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

-- KYC Documents RLS policies
CREATE POLICY "Users can view own KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own KYC documents" ON public.kyc_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC documents" ON public.kyc_documents
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

CREATE POLICY "Admins can update KYC documents" ON public.kyc_documents
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin');

-- Storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
    'kyc-documents',
    'kyc-documents',
    false
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kyc-documents' AND
        (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'superadmin')
    );

-- Insert default system settings
INSERT INTO public.system_settings (category, key, value) VALUES
    ('general', 'platformName', '"Swan IRA"'),
    ('general', 'supportEmail', '"support@swan-ira.com"'),
    ('general', 'maintenanceMode', 'false'),
    ('general', 'registrationEnabled', 'true'),
    ('general', 'maxLoginAttempts', '5'),
    ('general', 'sessionTimeout', '30'),
    ('security', 'twoFactorRequired', 'true'),
    ('security', 'passwordMinLength', '8'),
    ('security', 'requireSpecialChars', 'true'),
    ('security', 'requireNumbers', 'true'),
    ('security', 'requireUppercase', 'true'),
    ('security', 'maxPasswordAge', '90'),
    ('security', 'rateLimitEnabled', 'true'),
    ('security', 'rateLimitRequests', '100'),
    ('security', 'rateLimitWindow', '15'),
    ('trading', 'tradingEnabled', 'true'),
    ('trading', 'minTradeAmount', '10'),
    ('trading', 'maxTradeAmount', '100000'),
    ('trading', 'autoApprovalLimit', '1000'),
    ('trading', 'requireKycForLargeTrades', 'true'),
    ('trading', 'largeTradeThreshold', '10000')
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
