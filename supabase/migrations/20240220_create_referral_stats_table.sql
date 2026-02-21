-- Create referral_stats table
-- This table tracks user referral statistics for the enhanced share page

CREATE TABLE IF NOT EXISTS public.referral_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0 NOT NULL,
  active_referrals INTEGER DEFAULT 0 NOT NULL,
  total_earnings DECIMAL(20, 8) DEFAULT 0.00 NOT NULL,
  pending_earnings DECIMAL(20, 8) DEFAULT 0.00 NOT NULL,
  last_referral_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create referral_transactions table to track individual referral earnings
CREATE TABLE IF NOT EXISTS public.referral_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  deposit_amount DECIMAL(20, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_stats_user_id ON public.referral_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_stats_referral_code ON public.referral_stats(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer_id ON public.referral_transactions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred_user_id ON public.referral_transactions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON public.referral_transactions(status);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.referral_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral stats
CREATE POLICY "Users can view own referral stats" ON public.referral_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can view referral transactions they are involved in
CREATE POLICY "Users can view involved referral transactions" ON public.referral_transactions
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Policy: Service role can insert referral transactions
CREATE POLICY "Service role can insert referral transactions" ON public.referral_transactions
  FOR INSERT WITH CHECK (auth.jwt()->>>>'role' = 'service');

-- Policy: Service role can update referral transactions
CREATE POLICY "Service role can update referral transactions" ON public.referral_transactions
  FOR UPDATE WITH CHECK (auth.jwt()->>>>'role' = 'service');

-- Create function to update referral stats when referral is confirmed
CREATE OR REPLACE FUNCTION public.update_referral_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update referrer's stats
  UPDATE public.referral_stats 
  SET 
    total_referrals = total_referrals + 1,
    active_referrals = CASE 
      WHEN NEW.status = 'confirmed' THEN active_referrals + 1
      ELSE active_referrals
    END,
    total_earnings = total_earnings + NEW.amount,
    updated_at = NOW()
  WHERE user_id = NEW.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update referral stats
CREATE TRIGGER update_referral_stats_trigger
  AFTER UPDATE ON public.referral_transactions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed')
  EXECUTE FUNCTION public.update_referral_stats();
