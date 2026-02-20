-- Sample data for trade_outcomes table
-- Run this AFTER setting up the table with setup-trade-outcomes-table-only.sql
-- Replace the UUID placeholders with actual user UUIDs from your public.users table

-- To get actual user UUIDs, run this query first:
-- SELECT id, email, first_name, last_name FROM public.users LIMIT 5;

-- Force WIN for a specific user (VIP user)
-- Replace 'ACTUAL_USER_UUID_HERE' with real UUID from your users table
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
    'ACTUAL_USER_UUID_HERE', -- Replace with actual user UUID
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
-- Replace 'ACTUAL_USER_UUID_HERE' with real UUID from your users table
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
    'ACTUAL_USER_UUID_HERE', -- Replace with actual user UUID
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
-- Replace 'ACTUAL_USER_UUID_HERE' with real UUID from your users table
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
    'ACTUAL_USER_UUID_HERE', -- Replace with actual user UUID
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

-- Test queries to verify the setup:
-- Test if a user should win (replace with actual UUID)
-- SELECT * FROM test_user_outcome('ACTUAL_USER_UUID_HERE', 'options');

-- View all active outcomes
-- SELECT * FROM active_trade_outcomes;

-- View all outcomes (including inactive)
-- SELECT * FROM all_trade_outcomes;

-- Check if function works directly
-- SELECT should_user_win('ACTUAL_USER_UUID_HERE', 'options');
