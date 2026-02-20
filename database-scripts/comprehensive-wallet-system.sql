-- Comprehensive Wallet System Setup
-- Implements the flow: FUNDING → TRADING → LOCKS for different trading types
-- Updates existing wallet_balances table to add funding_balance and trading_balance

-- 1. Add new columns to wallet_balances table
ALTER TABLE wallet_balances 
ADD COLUMN IF NOT EXISTS funding_balance DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS trading_balance DECIMAL(20,8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_locked DECIMAL(20,8) DEFAULT 0;

-- 2. Initialize new columns with existing data
UPDATE wallet_balances SET 
  funding_balance = available,  -- Move available to funding_balance
  trading_balance = 0,          -- Initialize trading_balance to 0
  total_locked = locked           -- Move locked to total_locked
WHERE funding_balance IS NULL OR trading_balance IS NULL;

-- 3. Create comprehensive wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  asset TEXT NOT NULL,
  type varchar(50) NOT NULL, -- 'deposit', 'withdrawal', 'transfer', 'lock', 'release', 'profit', 'loss'
  subtype varchar(50), -- 'funding_to_trading', 'trading_to_funding', 'spot', 'futures', 'options', 'arbitrage', 'staking'
  amount DECIMAL(20,8) NOT NULL,
  balance_after DECIMAL(20,8) NOT NULL,
  reference varchar(100),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create indexes for wallet_transactions
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_asset ON wallet_transactions(asset);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);

-- 5. Update trading_locks table for better tracking
-- First ensure the table exists
CREATE TABLE IF NOT EXISTS trading_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  lock_type TEXT DEFAULT 'options',
  reference_id TEXT NOT NULL,
  status TEXT DEFAULT 'locked',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Then add new columns if they don't exist
ALTER TABLE trading_locks 
ADD COLUMN IF NOT EXISTS lock_type varchar(20) DEFAULT 'options',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- 6. Create RLS policies for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wallet transactions" ON wallet_transactions;
CREATE POLICY "Users can insert their own wallet transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Create function to update total_locked amount
CREATE OR REPLACE FUNCTION update_total_locked_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update the total_locked amount in wallet_balances
    UPDATE wallet_balances 
    SET total_locked = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM trading_locks 
      WHERE user_id = NEW.user_id 
      AND asset = NEW.asset 
      AND status = 'locked'
    ),
    updated_at = NOW()
    WHERE user_id = NEW.user_id AND asset = NEW.asset;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update the total_locked amount
    UPDATE wallet_balances 
    SET total_locked = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM trading_locks 
      WHERE user_id = OLD.user_id 
      AND asset = OLD.asset 
      AND status = 'locked'
    ),
    updated_at = NOW()
    WHERE user_id = OLD.user_id AND asset = OLD.asset;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for trading_locks
DROP TRIGGER IF EXISTS update_locked_balance_trigger ON trading_locks;
CREATE TRIGGER update_locked_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trading_locks
  FOR EACH ROW EXECUTE FUNCTION update_total_locked_balance();

-- 9. Create function for wallet balance validation
CREATE OR REPLACE FUNCTION validate_wallet_balance(
  p_user_id uuid,
  p_asset varchar(20),
  p_required_amount DECIMAL(20,8),
  p_balance_type text
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance DECIMAL(20,8);
BEGIN
  SELECT 
    CASE 
      WHEN p_balance_type = 'funding' THEN funding_balance
      ELSE trading_balance
    END
  INTO current_balance
  FROM wallet_balances
  WHERE user_id = p_user_id AND asset = p_asset;
  
  RETURN current_balance >= p_required_amount;
EXCEPTION
  WHEN NO_DATA_FOUND THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
