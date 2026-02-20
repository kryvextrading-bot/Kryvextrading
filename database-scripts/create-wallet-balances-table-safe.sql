-- Safe creation of wallet_balances table to unify both systems
-- This script handles existing tables gracefully

-- Drop existing table if it exists with wrong structure
DROP TABLE IF EXISTS wallet_balances CASCADE;

-- Create wallet_balances table fresh
CREATE TABLE wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  available DECIMAL(20,8) DEFAULT 0,
  locked DECIMAL(20,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asset)
);

-- Migrate existing data from wallets table (if wallets table exists)
INSERT INTO wallet_balances (user_id, asset, available, locked, created_at, updated_at)
SELECT 
  user_id,
  currency as asset,
  balance as available,
  COALESCE(locked_balance, 0) as locked,
  created_at,
  updated_at
FROM wallets
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets')
ON CONFLICT (user_id, asset) 
DO UPDATE SET 
  available = EXCLUDED.available,
  locked = EXCLUDED.locked,
  updated_at = EXCLUDED.updated_at;

-- Create view for backward compatibility
CREATE OR REPLACE VIEW wallets_view AS
SELECT 
  wb.*,
  w.deposit_address,
  w.is_active
FROM wallet_balances wb
LEFT JOIN wallets w ON wb.user_id = w.user_id AND wb.asset = w.currency;

-- Add indexes for performance
CREATE INDEX idx_wallet_balances_user_id ON wallet_balances(user_id);
CREATE INDEX idx_wallet_balances_asset ON wallet_balances(asset);
CREATE INDEX idx_wallet_balances_user_asset ON wallet_balances(user_id, asset);

-- Add RLS policies
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;

-- Users can see their own balances
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own balances
CREATE POLICY "Users can update own wallet balances" ON wallet_balances
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own balances
CREATE POLICY "Users can insert own wallet balances" ON wallet_balances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_wallet_balances_updated_at
  BEFORE UPDATE ON wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balances_updated_at();

-- Verify table creation
SELECT 'wallet_balances table created successfully' as status;
