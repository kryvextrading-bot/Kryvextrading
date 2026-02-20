-- Align Database with Options Trading System (FIXED VERSION)
-- This script updates the database to support options trading with correct profit rates

-- 1. Add metadata column to trading_settings if it doesn't exist
ALTER TABLE public.trading_settings 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. Add pnl column to transactions if it doesn't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS pnl NUMERIC DEFAULT 0;

-- 3. Update trading_settings with options profit rates (FIXED JSON SYNTAX)
UPDATE public.trading_settings 
SET 
  metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{options_profit_rates}',
    '{"60": 115, "120": 118, "240": 122, "360": 125, "600": 130}'::jsonb
  ),
  updated_at = NOW()
WHERE id = (SELECT id FROM public.trading_settings LIMIT 1);

-- 4. Create function to get options profit rate
CREATE OR REPLACE FUNCTION public.get_options_profit_rate(p_time_frame INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  v_profit_rate NUMERIC;
BEGIN
  -- Return profit rate based on time frame
  CASE p_time_frame
    WHEN 60 THEN v_profit_rate := 115;   -- 15% profit
    WHEN 120 THEN v_profit_rate := 118;  -- 18% profit
    WHEN 240 THEN v_profit_rate := 122;  -- 22% profit
    WHEN 360 THEN v_profit_rate := 125;  -- 25% profit
    WHEN 600 THEN v_profit_rate := 130;  -- 30% profit
    ELSE v_profit_rate := 115;           -- Default to 15%
  END CASE;
  
  RETURN v_profit_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_options_profit_rate(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_options_profit_rate(INTEGER) TO service_role;

-- 6. Create enhanced options transaction function
CREATE OR REPLACE FUNCTION public.create_options_transaction(
  p_user_id UUID,
  p_pair TEXT,
  p_direction TEXT,
  p_amount NUMERIC,
  p_time_frame INTEGER,
  p_should_win BOOLEAN,
  p_profit_rate NUMERIC
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_payout NUMERIC;
  v_pnl NUMERIC;
BEGIN
  -- Calculate payout and PnL
  v_payout := CASE WHEN p_should_win THEN p_amount * (p_profit_rate / 100) ELSE 0 END;
  v_pnl := CASE WHEN p_should_win THEN v_payout - p_amount ELSE -p_amount END;
  
  -- Create transaction
  INSERT INTO public.transactions (
    user_id,
    type,
    asset,
    amount,
    price,
    total,
    side,
    status,
    pnl,
    metadata,
    created_at
  ) VALUES (
    p_user_id,
    'option',
    p_pair,
    p_amount,
    v_payout,
    p_amount,
    CASE WHEN p_direction = 'up' THEN 'buy' ELSE 'sell' END,
    'completed',
    v_pnl,
    jsonb_build_object(
      'direction', p_direction,
      'timeFrame', p_time_frame,
      'profitRate', p_profit_rate,
      'profitPercentage', p_profit_rate - 100,
      'shouldWin', p_should_win,
      'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions for options transaction function
GRANT EXECUTE ON FUNCTION public.create_options_transaction(
  UUID, TEXT, TEXT, NUMERIC, INTEGER, BOOLEAN, NUMERIC
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_options_transaction(
  UUID, TEXT, TEXT, NUMERIC, INTEGER, BOOLEAN, NUMERIC
) TO service_role;

-- 8. Create view for options trading statistics
CREATE OR REPLACE VIEW public.options_trading_stats AS
SELECT 
  COUNT(*) as total_options,
  COUNT(*) FILTER (WHERE metadata->>'shouldWin' = 'true') as winning_options,
  COUNT(*) FILTER (WHERE metadata->>'shouldWin' = 'false') as losing_options,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->>'shouldWin' = 'true')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as win_rate_percentage,
  SUM(pnl) FILTER (WHERE pnl > 0) as total_profits,
  SUM(pnl) FILTER (WHERE pnl < 0) as total_losses,
  SUM(pnl) as net_pnl
FROM public.transactions 
WHERE type = 'option';

-- 9. Grant select permissions on the view
GRANT SELECT ON public.options_trading_stats TO authenticated;
GRANT SELECT ON public.options_trading_stats TO service_role;

-- 10. Update existing options transactions to have correct structure (ONLY if metadata exists)
DO $$
BEGIN
  -- Check if there are any option transactions with metadata
  IF EXISTS (SELECT 1 FROM public.transactions WHERE type = 'option' AND metadata IS NOT NULL LIMIT 1) THEN
    UPDATE public.transactions 
    SET 
      pnl = CASE 
        WHEN metadata->>'shouldWin' = 'true' AND metadata->>'profitRate' IS NOT NULL THEN
          (metadata->>'amount')::NUMERIC * ((metadata->>'profitRate')::NUMERIC / 100) - (metadata->>'amount')::NUMERIC
        WHEN metadata->>'shouldWin' = 'true' THEN
          (metadata->>'amount')::NUMERIC * 0.15 -- Default 15% profit
        ELSE 
          -(metadata->>'amount')::NUMERIC
        END,
      price = CASE 
        WHEN metadata->>'shouldWin' = 'true' AND metadata->>'profitRate' IS NOT NULL THEN
          (metadata->>'amount')::NUMERIC * ((metadata->>'profitRate')::NUMERIC / 100)
        WHEN metadata->>'shouldWin' = 'true' THEN
          (metadata->>'amount')::NUMERIC * 1.15 -- Default 115% payout
        ELSE 
          0
        END
    WHERE type = 'option' AND metadata IS NOT NULL AND (pnl IS NULL OR price IS NULL);
  END IF;
END $$;

COMMIT;
