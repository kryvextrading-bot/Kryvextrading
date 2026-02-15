-- ==================== TRADING CONTROL TABLES ====================

-- Users table (already exists, ensure it has is_admin column)
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Trade outcomes table - stores forced win/loss settings for users
CREATE TABLE IF NOT EXISTS public.trade_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT FALSE,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('win', 'loss', 'default')),
  spot_enabled BOOLEAN DEFAULT FALSE,
  futures_enabled BOOLEAN DEFAULT FALSE,
  options_enabled BOOLEAN DEFAULT FALSE,
  arbitrage_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  UNIQUE(user_id)
);

-- Time-based trade control windows
CREATE TABLE IF NOT EXISTS public.trade_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN ('win', 'loss', 'default')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  spot_enabled BOOLEAN DEFAULT FALSE,
  futures_enabled BOOLEAN DEFAULT FALSE,
  options_enabled BOOLEAN DEFAULT FALSE,
  arbitrage_enabled BOOLEAN DEFAULT FALSE,
  reason TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- Default system settings for trading outcomes
CREATE TABLE IF NOT EXISTS public.trading_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_outcome TEXT NOT NULL CHECK (default_outcome IN ('win', 'loss', 'random')) DEFAULT 'loss',
  win_probability INTEGER DEFAULT 30, -- percentage chance of win when random
  spot_default TEXT CHECK (spot_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  futures_default TEXT CHECK (futures_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  options_default TEXT CHECK (options_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  arbitrage_default TEXT CHECK (arbitrage_default IN ('win', 'loss', 'random')) DEFAULT 'loss',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS public.trading_admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_trade_outcomes_user_id ON public.trade_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_windows_user_id ON public.trade_windows(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_windows_active ON public.trade_windows(active);
CREATE INDEX IF NOT EXISTS idx_trade_windows_time_range ON public.trade_windows(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_trading_admin_audit_admin_id ON public.trading_admin_audit(admin_id);
CREATE INDEX IF NOT EXISTS idx_trading_admin_audit_user_id ON public.trading_admin_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_admin_audit_created_at ON public.trading_admin_audit(created_at);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE public.trade_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_admin_audit ENABLE ROW LEVEL SECURITY;

-- Policies for trade_outcomes
CREATE POLICY "Admins can manage trade outcomes" ON public.trade_outcomes
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Trading service can read trade outcomes" ON public.trade_outcomes
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

-- Policies for trade_windows
CREATE POLICY "Admins can manage trade windows" ON public.trade_windows
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Trading service can read trade windows" ON public.trade_windows
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

-- Policies for trading_settings
CREATE POLICY "Admins can manage trading settings" ON public.trading_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Trading service can read trading settings" ON public.trading_settings
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

-- Policies for trading_admin_audit
CREATE POLICY "Admins can view audit logs" ON public.trading_admin_audit
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

CREATE POLICY "Admins can insert audit logs" ON public.trading_admin_audit
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE is_admin = true)
  );

-- ==================== DEFAULT SETTINGS ====================
-- Insert default trading settings if not exists
INSERT INTO public.trading_settings (id, default_outcome, win_probability, spot_default, futures_default, options_default, arbitrage_default)
VALUES (gen_random_uuid(), 'loss', 30, 'loss', 'loss', 'loss', 'loss')
ON CONFLICT DO NOTHING;

-- ==================== FUNCTIONS ====================

-- Function to check if a user should win a trade
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

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_trading_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.trading_admin_audit (admin_id, action, user_id, details)
  VALUES (p_admin_id, p_action, p_user_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_trading_admin_action(UUID, TEXT, UUID, JSONB) TO authenticated;
