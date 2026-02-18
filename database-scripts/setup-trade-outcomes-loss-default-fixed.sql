-- Setup Trade Outcomes Table with LOSS by Default Logic (FIXED VERSION)
-- This script creates the necessary tables and sample data for the admin force win/loss system

-- First, drop the existing table if it exists to recreate with correct structure
DROP TABLE IF EXISTS public.trade_outcomes CASCADE;

-- Create the trade_outcomes table with the correct structure
CREATE TABLE public.trade_outcomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    outcome_type TEXT NOT NULL CHECK (outcome_type = ANY (ARRAY['win'::text, 'loss'::text, 'default'::text])),
    spot_enabled BOOLEAN DEFAULT false,
    futures_enabled BOOLEAN DEFAULT false,
    options_enabled BOOLEAN DEFAULT false,
    arbitrage_enabled BOOLEAN DEFAULT false,
    description TEXT,
    priority INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_trade_outcomes_user_id ON public.trade_outcomes(user_id);
CREATE INDEX idx_trade_outcomes_enabled ON public.trade_outcomes(enabled);
CREATE INDEX idx_trade_outcomes_priority ON public.trade_outcomes(priority, created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trade_outcomes_updated_at
    BEFORE UPDATE ON public.trade_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.trade_outcomes TO authenticated;
GRANT ALL ON public.trade_outcomes TO service_role;

-- Insert sample data for testing
-- Note: Replace 'USER_UUID_HERE' with actual user UUIDs from your auth.users table

-- 1. Default user (no special outcome) - will LOSE by default
-- No record needed - absence means default behavior (LOSS)

-- 2. Force WIN for a specific user (VIP user)
INSERT INTO public.trade_outcomes (
    user_id,
    enabled,
    outcome_type,
    spot_enabled,
    futures_enabled,
    options_enabled,
    arbitrage_enabled,
    description,
    priority,
    created_at,
    updated_at
) VALUES (
    'USER_UUID_HERE', -- Replace with actual user UUID
    true,
    'win', -- FORCE WIN
    true,  -- Enable for spot
    true,  -- Enable for futures
    true,  -- Enable for options
    true,  -- Enable for arbitrage
    'VIP user - Force WIN enabled',
    1,     -- Higher priority (lower number = higher priority)
    NOW(),
    NOW()
);

-- 3. Force LOSS for a specific user (restricted user)
INSERT INTO public.trade_outcomes (
    user_id,
    enabled,
    outcome_type,
    spot_enabled,
    futures_enabled,
    options_enabled,
    arbitrage_enabled,
    description,
    priority,
    created_at,
    updated_at
) VALUES (
    'USER_UUID_HERE', -- Replace with actual user UUID
    true,
    'loss', -- FORCE LOSS
    true,
    true,
    true,
    true,
    'Restricted user - Force LOSS enabled',
    1,
    NOW(),
    NOW()
);

-- 4. Options-only force WIN user
INSERT INTO public.trade_outcomes (
    user_id,
    enabled,
    outcome_type,
    spot_enabled,
    futures_enabled,
    options_enabled,
    arbitrage_enabled,
    description,
    priority,
    created_at,
    updated_at
) VALUES (
    'USER_UUID_HERE', -- Replace with actual user UUID
    true,
    'win',
    false, -- Disable spot
    false, -- Disable futures
    true,  -- Enable options only
    false, -- Disable arbitrage
    'Options trading only - Force WIN',
    1,
    NOW(),
    NOW()
);

-- Create a function to check active outcome for a user
CREATE OR REPLACE FUNCTION get_active_user_outcome(p_user_id UUID)
RETURNS TABLE (
    outcome_type text,
    priority integer,
    spot_enabled boolean,
    futures_enabled boolean,
    options_enabled boolean,
    arbitrage_enabled boolean,
    description text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to2.outcome_type,
        to2.priority,
        to2.spot_enabled,
        to2.futures_enabled,
        to2.options_enabled,
        to2.arbitrage_enabled,
        to2.description
    FROM trade_outcomes to2
    WHERE to2.user_id = p_user_id
        AND to2.enabled = true
    ORDER BY to2.priority ASC, to2.created_at DESC
    LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_user_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_user_outcome TO service_role;

-- Create a view to easily see active outcomes
CREATE OR REPLACE VIEW active_trade_outcomes AS
SELECT 
    to2.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    CASE
        WHEN to2.outcome_type = 'win' THEN 'FORCE WIN'
        WHEN to2.outcome_type = 'loss' THEN 'FORCE LOSS'
        ELSE 'Default (LOSS)'
    END as outcome_label,
    CASE
        WHEN to2.spot_enabled AND to2.futures_enabled AND to2.options_enabled AND to2.arbitrage_enabled THEN 'All'
        WHEN to2.spot_enabled THEN 'Spot Only'
        WHEN to2.futures_enabled THEN 'Futures Only'
        WHEN to2.options_enabled THEN 'Options Only'
        WHEN to2.arbitrage_enabled THEN 'Arbitrage Only'
        ELSE 'Custom'
    END as enabled_types
FROM trade_outcomes to2
LEFT JOIN auth.users u ON u.id = to2.user_id
WHERE to2.enabled = true 
ORDER BY to2.priority ASC, to2.created_at DESC;

-- Grant access to the view
GRANT SELECT ON active_trade_outcomes TO authenticated;
GRANT SELECT ON active_trade_outcomes TO service_role;

-- Create a function to get the default outcome for a user and trade type
CREATE OR REPLACE FUNCTION get_user_trade_outcome(
    p_user_id UUID,
    p_trade_type TEXT DEFAULT 'options'
)
RETURNS TABLE (
    should_win boolean,
    outcome_source TEXT,
    outcome_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_enabled BOOLEAN;
    v_outcome_type TEXT;
BEGIN
    -- Check if user has an active outcome
    SELECT enabled, outcome_type INTO v_enabled, v_outcome_type
    FROM trade_outcomes
    WHERE user_id = p_user_id
        AND enabled = true
        AND (
            (p_trade_type = 'spot' AND spot_enabled) OR
            (p_trade_type = 'futures' AND futures_enabled) OR
            (p_trade_type = 'options' AND options_enabled) OR
            (p_trade_type = 'arbitrage' AND arbitrage_enabled)
        )
    ORDER BY priority ASC, created_at DESC
    LIMIT 1;
    
    -- Return result based on outcome type
    IF v_enabled THEN
        CASE v_outcome_type
            WHEN 'win' THEN
                RETURN QUERY SELECT true, 'user_force', 'win'::TEXT;
            WHEN 'loss' THEN
                RETURN QUERY SELECT false, 'user_force', 'loss'::TEXT;
            WHEN 'default' THEN
                RETURN QUERY SELECT false, 'default_loss', 'default'::TEXT;
        END CASE;
    END IF;
    
    -- Default: LOSS
    RETURN QUERY SELECT false, 'default_loss', 'default'::TEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_trade_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_trade_outcome TO service_role;

-- Test the function (replace with actual user UUID)
-- SELECT * FROM get_user_trade_outcome('USER_UUID_HERE', 'options');

-- Summary of the system:
-- 
-- DEFAULT BEHAVIOR: LOSS by default
-- WIN CONDITIONS:
-- 1. User has trade_outcomes record with outcome_type = 'win' and enabled = true
-- 2. Global trade_windows with outcome_type = 'win' (if implemented)
-- 3. Random trade_windows with win_rate > 0 (if implemented)
--
-- LOSS CONDITIONS:
-- 1. No trade_outcomes record (default behavior)
-- 2. User has trade_outcomes with outcome_type = 'loss' and enabled = true
-- 3. User has trade_outcomes with outcome_type = 'default' and enabled = true
-- 4. Global trade_windows with outcome_type = 'loss' (if implemented)
--
-- PRIORITY:
-- 1. User-specific trade_outcomes (highest priority)
-- 2. Global trade_windows (medium priority)
-- 3. Default behavior (LOSS) (lowest priority)

COMMIT;
