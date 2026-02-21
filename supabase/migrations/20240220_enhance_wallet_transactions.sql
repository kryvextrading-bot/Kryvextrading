-- Enhance wallet_transactions table
-- Add missing columns to support enhanced transaction features

ALTER TABLE public.wallet_transactions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'processing')),
ADD COLUMN IF NOT EXISTS network VARCHAR(50),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS tx_hash TEXT,
ADD COLUMN IF NOT EXISTS fee DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON public.wallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_network ON public.wallet_transactions(network);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_address ON public.wallet_transactions(address);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_tx_hash ON public.wallet_transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_from_user ON public.wallet_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_to_user ON public.wallet_transactions(to_user_id);

-- Update existing data to set default status for existing records
UPDATE public.wallet_transactions 
SET status = 'completed' 
WHERE status IS NULL;

-- Update RLS policies to handle new columns
DROP POLICY IF EXISTS "Users can view own wallet transactions";
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Update existing policies to handle new columns
DROP POLICY IF EXISTS "Users can insert own wallet transactions";
CREATE POLICY "Users can insert own wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert wallet transactions";
CREATE POLICY "Service role can insert wallet transactions" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service');
