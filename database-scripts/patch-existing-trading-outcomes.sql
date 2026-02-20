-- Patch existing trade_outcomes table and policies
-- This script updates existing structures without conflicts

-- 1. Update existing policies instead of creating new ones
DROP POLICY IF EXISTS "Admins can manage trade outcomes" ON public.trade_outcomes;
DROP POLICY IF EXISTS "Trading service can read trade outcomes" ON public.trade_outcomes;

-- Create updated policies
CREATE POLICY "Admins can manage trade outcomes" ON public.trade_outcomes
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Trading service can read trade outcomes" ON public.trade_outcomes
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

-- 2. Ensure the check_trade_outcome function exists and works with existing table
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
    -- Check if this trade type is enabled in window
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO service_role;

-- 4. Create or update trading_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trading_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_outcome TEXT NOT NULL CHECK (default_outcome IN ('win', 'loss', 'random')) DEFAULT 'loss',
  win_probability INTEGER DEFAULT 30,
  spot_default TEXT CHECK (spot_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  futures_default TEXT CHECK (futures_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  options_default TEXT CHECK (options_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  arbitrage_default TEXT CHECK (arbitrage_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Insert default settings if not exists
INSERT INTO public.trading_settings (id, default_outcome, win_probability, spot_default, futures_default, options_default, arbitrage_default)
VALUES (gen_random_uuid(), 'loss', 30, 'loss', 'loss', 'loss', 'loss')
ON CONFLICT DO NOTHING;

-- 5. Enable RLS on trading_settings if not already enabled
ALTER TABLE public.trading_settings ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for trading_settings
DROP POLICY IF EXISTS "Admins can manage trading settings" ON public.trading_settings;
DROP POLICY IF EXISTS "Trading service can read trading settings" ON public.trading_settings;

CREATE POLICY "Admins can manage trading settings" ON public.trading_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Trading service can read trading settings" ON public.trading_settings
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );
