-- Comprehensive Wallet System Setup - Compatible with Existing Tables
-- Implements flow: FUNDING → TRADING → LOCKS for different trading types
-- Works with existing wallet_transactions table structure

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

-- 3. Update existing trading_locks table structure if needed
-- Check if table exists and has currency column
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'trading_locks'
    ) THEN
        -- Check if currency column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'trading_locks' AND column_name = 'currency'
        ) THEN
            -- Rename currency to asset
            ALTER TABLE trading_locks RENAME COLUMN currency TO asset;
        END IF;
    END IF;
END $$;

-- 4. Create indexes for trading_locks
CREATE INDEX IF NOT EXISTS idx_trading_locks_user_id ON trading_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_locks_currency ON trading_locks(currency);
CREATE INDEX IF NOT EXISTS idx_trading_locks_status ON trading_locks(status);
CREATE INDEX IF NOT EXISTS idx_trading_locks_reference_id ON trading_locks(reference_id);

-- 5. Create RLS policies for trading_locks
ALTER TABLE trading_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own trading locks" ON trading_locks;
CREATE POLICY "Users can view their own trading locks" ON trading_locks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own trading locks" ON trading_locks;
CREATE POLICY "Users can insert their own trading locks" ON trading_locks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own trading locks" ON trading_locks;
CREATE POLICY "Users can update their own trading locks" ON trading_locks
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Create function to update total_locked amount
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
      AND currency = NEW.currency 
      AND status = 'locked'
    ),
    updated_at = NOW()
    WHERE user_id = NEW.user_id AND asset = NEW.currency;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update the total_locked amount
    UPDATE wallet_balances 
    SET total_locked = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM trading_locks 
      WHERE user_id = OLD.user_id 
      AND currency = OLD.currency 
      AND status = 'locked'
    ),
    updated_at = NOW()
    WHERE user_id = OLD.user_id AND asset = OLD.currency;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for trading_locks
DROP TRIGGER IF EXISTS update_locked_balance_trigger ON trading_locks;
CREATE TRIGGER update_locked_balance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON trading_locks
  FOR EACH ROW EXECUTE FUNCTION update_total_locked_balance();

-- 8. Create function for wallet balance validation
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

-- 9. Add new transaction types to existing wallet_transactions table
-- First drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'wallet_transactions_type_check'
        AND table_name = 'wallet_transactions'
    ) THEN
        ALTER TABLE wallet_transactions DROP CONSTRAINT wallet_transactions_type_check;
    END IF;
END $$;

-- Then add the extended constraint
ALTER TABLE wallet_transactions 
ADD CONSTRAINT wallet_transactions_type_check_extended 
CHECK (
  type IN (
    'deposit', 'withdrawal', 'transfer', 'fee', 'freeze', 'unfreeze',
    'lock', 'release', 'profit', 'loss'
  )
);

-- 10. Create view for wallet balance summary
CREATE OR REPLACE VIEW wallet_balance_summary AS
SELECT 
  wb.user_id,
  wb.asset,
  wb.funding_balance,
  wb.trading_balance,
  wb.total_locked,
  (wb.funding_balance + wb.trading_balance + wb.total_locked) as total_balance,
  wb.updated_at
FROM wallet_balances wb;

-- Grant permissions for the view
GRANT SELECT ON wallet_balance_summary TO authenticated;
GRANT SELECT ON wallet_balance_summary TO anon;
