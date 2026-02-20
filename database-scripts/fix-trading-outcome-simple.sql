-- Simple fix for trading outcome function
-- Drop and recreate the function with correct handling for NULL values

DROP FUNCTION IF EXISTS public.check_trade_outcome(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.check_trade_outcome(
  p_user_id UUID,
  p_trade_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
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
    -- Check if this trade type is enabled in window
    IF (p_trade_type = 'spot' AND COALESCE(v_window.spot_enabled, false)) OR
       (p_trade_type = 'futures' AND COALESCE(v_window.futures_enabled, false)) OR
       (p_trade_type = 'options' AND COALESCE(v_window.options_enabled, false)) OR
       (p_trade_type = 'arbitrage' AND COALESCE(v_window.arbitrage_enabled, false)) THEN
      RETURN v_window.outcome_type = 'win';
    END IF;
  END IF;
  
  -- Check if user has a permanent outcome setting
  SELECT * INTO v_user_outcome FROM public.trade_outcomes
  WHERE user_id = p_user_id AND enabled = true;
  
  IF FOUND THEN
    -- Check if this trade type is enabled (handle NULL values as false)
    IF (p_trade_type = 'spot' AND COALESCE(v_user_outcome.spot_enabled, false)) OR
       (p_trade_type = 'futures' AND COALESCE(v_user_outcome.futures_enabled, false)) OR
       (p_trade_type = 'options' AND COALESCE(v_user_outcome.options_enabled, false)) OR
       (p_trade_type = 'arbitrage' AND COALESCE(v_user_outcome.arbitrage_enabled, false)) THEN
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO service_role;
