-- Create wallet_balances view to match application expectations
-- This view maps the wallets table to the wallet_balances table name that the application expects

CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT 
    id,
    user_id,
    currency as asset,
    balance as available,
    locked_balance,
    deposit_address,
    is_active,
    created_at,
    updated_at
FROM public.wallets;

-- Add comment for documentation
COMMENT ON VIEW public.wallet_balances IS 'View mapping wallets table to wallet_balances for application compatibility';

-- Create trigger to sync wallets table to wallet_balances view
-- This ensures that when admin adds funds to wallets table, wallet_balances view is also updated

CREATE OR REPLACE FUNCTION sync_wallet_to_wallet_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update wallet_balances view when wallets table changes
  INSERT INTO public.wallet_balances (id, user_id, asset, available, locked_balance, deposit_address, is_active, created_at, updated_at)
  SELECT 
    id,
    user_id,
    currency as asset,
    balance as available,
    locked_balance,
    deposit_address,
    is_active,
    created_at,
    updated_at
  FROM public.wallets
  ON CONFLICT (user_id, asset) 
  DO UPDATE SET
    available = EXCLUDED.available,
    locked_balance = EXCLUDED.locked_balance,
    updated_at = NOW()
  WHERE wallet_balances.user_id = EXCLUDED.user_id AND wallet_balances.asset = EXCLUDED.asset;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync wallet changes
CREATE TRIGGER sync_wallet_to_wallet_balances_trigger
AFTER INSERT OR UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION sync_wallet_to_wallet_balances();

-- Add comment for documentation
COMMENT ON TRIGGER sync_wallet_to_wallet_balances_trigger IS 'Automatically sync wallet table changes to wallet_balances view for application compatibility';
