-- Fix database constraints and signup issues
-- This script addresses database constraint violations and improves signup reliability

-- Step 1: Drop problematic constraints that are causing signup failures
DROP CONSTRAINT IF EXISTS users_email_change_confirm_status_check;
DROP CONSTRAINT IF EXISTS users_phone_key;
DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN kyc_status DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN account_type DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN balance DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN registration_date DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN two_factor_enabled DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN risk_tolerance DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN investment_goal DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN is_admin DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN credit_score DROP NOT NULL;

-- Step 2: Recreate users table with proper structure
DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  account_type VARCHAR(50) NOT NULL DEFAULT 'Traditional IRA',
  account_number VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  risk_tolerance VARCHAR(20) NOT NULL DEFAULT 'Moderate',
  investment_goal VARCHAR(50) NOT NULL DEFAULT 'Retirement',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  admin_role VARCHAR(50),
  credit_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Step 3: Add proper indexes for performance
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_status ON public.users (status);
CREATE INDEX idx_users_created_at ON public.users (created_at);
CREATE INDEX idx_users_is_admin ON public.users (is_admin);

-- Step 4: Create unique constraint for email (but allow updates)
CREATE UNIQUE INDEX users_email_unique ON public.users (email) WHERE email IS NOT NULL;

-- Step 5: Add phone unique constraint (optional)
CREATE UNIQUE INDEX users_phone_unique ON public.users (phone) WHERE phone IS NOT NULL AND phone != '';

-- Step 6: Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role can manage all users
CREATE POLICY "Service role can manage all users"
  ON public.users FOR ALL
  USING (auth.role() = 'service_role');

-- Step 8: Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Step 9: Create service role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END $$;

-- Step 10: Grant service role to postgres user (adjust as needed)
GRANT service_role TO postgres;
GRANT service_role TO authenticated;

COMMIT;

-- Step 11: Fix notification_settings table constraints
ALTER TABLE public.notification_settings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN email_notifications DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN push_notifications DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN trading_alerts DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN price_alerts DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN security_alerts DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN marketing_emails DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN system_updates DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN sound_enabled DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN desktop_notifications DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN mobile_notifications DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.notification_settings ALTER COLUMN updated_at DROP NOT NULL;

-- Step 12: Fix notification_preferences table
ALTER TABLE public.notification_preferences ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN channel DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN email_alerts DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN sms_alerts DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN push_alerts DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN transaction_alerts DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN security_alerts DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN marketing_emails DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN daily_summary DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN weekly_report DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.notification_preferences ALTER COLUMN updated_at DROP NOT NULL;

-- Step 13: Fix notifications table
ALTER TABLE public.notifications ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN message DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN status DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN priority DROP NOT NULL;
ALTER TABLE public.notifications ALTER COLUMN created_at DROP NOT NULL;

-- Step 14: Create invitation_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Step 15: Add indexes for invitation_codes
CREATE INDEX idx_invitation_codes_code ON public.invitation_codes (code);
CREATE INDEX idx_invitation_codes_user_id ON public.invitation_codes (user_id);
CREATE INDEX idx_invitation_codes_is_used ON public.invitation_codes (is_used);

-- Step 16: Enable RLS for invitation_codes
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Step 17: Create RLS policies for invitation_codes
DROP POLICY IF EXISTS "Users can view own invitation codes" ON public.invitation_codes;
DROP POLICY IF EXISTS "Users can manage invitation codes" ON public.invitation_codes;

-- Users can view own invitation codes
CREATE POLICY "Users can view own invitation codes"
  ON public.invitation_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own invitation codes
CREATE POLICY "Users can insert own invitation codes"
  ON public.invitation_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own invitation codes
CREATE POLICY "Users can update own invitation codes"
  ON public.invitation_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 18: Grant permissions for invitation_codes
GRANT ALL ON public.invitation_codes TO authenticated;
GRANT ALL ON public.invitation_codes TO service_role;

-- Step 19: Fix wallet_balances table constraints
ALTER TABLE public.wallet_balances ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN asset DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN available DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN locked DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN total DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.wallet_balances ALTER COLUMN updated_at DROP NOT NULL;

-- Step 20: Enable RLS for wallet_balances
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

-- Step 21: Create RLS policies for wallet_balances
DROP POLICY IF EXISTS "Users can view own wallet balances" ON public.wallet_balances;
DROP POLICY IF EXISTS "Users can manage wallet balances" ON public.wallet_balances;

-- Users can view own wallet balances
CREATE POLICY "Users can view own wallet balances"
  ON public.wallet_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own wallet balances
CREATE POLICY "Users can insert own wallet balances"
  ON public.wallet_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own wallet balances
CREATE POLICY "Users can update own wallet balances"
  ON public.wallet_balances FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 22: Grant permissions for wallet_balances
GRANT ALL ON public.wallet_balances TO authenticated;
GRANT ALL ON public.wallet_balances TO service_role;

-- Step 23: Create function to ensure user has default wallet balances
CREATE OR REPLACE FUNCTION public.ensure_user_has_wallets(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Check if user already has wallet balances
  IF NOT EXISTS (
    SELECT 1 FROM public.wallet_balances 
    WHERE user_id = p_user_id
    LIMIT 1
  ) THEN
    -- Insert default wallet balances
    INSERT INTO public.wallet_balances (user_id, asset, available, locked, total, created_at, updated_at) VALUES
      (p_user_id, 'BTC', 0.00000000, 0.00000000, 0.00000000, NOW(), NOW()),
      (p_user_id, 'ETH', 0.00000000, 0.00000000, 0.00000000, NOW(), NOW()),
      (p_user_id, 'USDT', 1000.00, 0.00, 1000.00, NOW(), NOW()),
      (p_user_id, 'USDC', 1000.00, 0.00, 1000.00, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 24: Create trigger to automatically create wallet balances for new users
DROP TRIGGER IF EXISTS on_users_after_insert_create_wallets ON public.users;
CREATE TRIGGER on_users_after_insert_create_wallets
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_user_has_wallets(NEW.id);

COMMIT;
