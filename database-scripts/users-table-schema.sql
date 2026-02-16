-- Users Table Schema
-- This file defines the complete structure of the public.users table

-- Drop existing table if it exists (for development/reset purposes)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  first_name text NULL,
  last_name text NULL,
  phone text NULL,
  status text NULL DEFAULT 'Pending'::text,
  kyc_status text NULL DEFAULT 'Pending'::text,
  account_type text NULL DEFAULT 'Traditional IRA'::text,
  account_number text NULL,
  balance numeric(20, 8) NULL DEFAULT 0,
  last_login timestamp with time zone NULL,
  registration_date timestamp with time zone NULL DEFAULT now(),
  two_factor_enabled boolean NULL DEFAULT false,
  risk_tolerance text NULL DEFAULT 'Moderate'::text,
  investment_goal text NULL DEFAULT 'Retirement'::text,
  is_admin boolean NULL DEFAULT false,
  admin_role text NULL,
  credit_score integer NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  
  -- Check constraints for data integrity
  CONSTRAINT users_kyc_status_check CHECK (
    kyc_status = ANY (ARRAY['Verified'::text, 'Pending'::text, 'Rejected'::text])
  ),
  CONSTRAINT users_risk_tolerance_check CHECK (
    risk_tolerance = ANY (ARRAY['Conservative'::text, 'Moderate'::text, 'Aggressive'::text, 'Admin'::text])
  ),
  CONSTRAINT users_account_type_check CHECK (
    account_type = ANY (ARRAY['Traditional IRA'::text, 'Roth IRA'::text, 'Admin'::text])
  ),
  CONSTRAINT users_status_check CHECK (
    status = ANY (ARRAY['Active'::text, 'Pending'::text, 'Suspended'::text])
  ),
  CONSTRAINT users_admin_role_check CHECK (
    admin_role = ANY (ARRAY['admin'::text, 'superadmin'::text, 'finance'::text, 'support'::text])
  ),
  CONSTRAINT users_investment_goal_check CHECK (
    investment_goal = ANY (ARRAY['Retirement'::text, 'Wealth Building'::text, 'Tax Savings'::text, 'Admin'::text])
  )
) TABLESPACE pg_default;

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON public.users USING btree (kyc_status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users USING btree (is_admin) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_admin_role ON public.users USING btree (admin_role) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users USING btree (created_at) TABLESPACE pg_default;

-- Triggers for automatic operations
CREATE TRIGGER handle_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION handle_updated_at ();

CREATE TRIGGER on_user_created_create_wallet_balances 
AFTER INSERT ON users 
FOR EACH ROW 
EXECUTE FUNCTION create_user_wallet_balances ();

CREATE TRIGGER on_user_insert_auto_wallets 
AFTER INSERT ON users 
FOR EACH ROW 
EXECUTE FUNCTION auto_create_user_wallets ();

CREATE TRIGGER on_user_update_auto_wallets 
AFTER UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION auto_create_wallets_on_status_change ();

-- Row Level Security (RLS) - Enable if needed
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE public.users IS 'Main user accounts table with profile and account information';
COMMENT ON COLUMN public.users.id IS 'UUID from auth.users table';
COMMENT ON COLUMN public.users.email IS 'User email address (unique)';
COMMENT ON COLUMN public.users.status IS 'Account status: Active, Pending, Suspended';
COMMENT ON COLUMN public.users.kyc_status IS 'KYC verification status: Verified, Pending, Rejected';
COMMENT ON COLUMN public.users.account_type IS 'Account type: Traditional IRA, Roth IRA, Admin';
COMMENT ON COLUMN public.users.balance IS 'Account balance (legacy - use wallet_balances table)';
COMMENT ON COLUMN public.users.is_admin IS 'Boolean flag for admin users';
COMMENT ON COLUMN public.users.admin_role IS 'Admin role: admin, superadmin, finance, support';
COMMENT ON COLUMN public.users.risk_tolerance IS 'Investment risk tolerance: Conservative, Moderate, Aggressive';
COMMENT ON COLUMN public.users.investment_goal IS 'Investment goal: Retirement, Wealth Building, Tax Savings';
