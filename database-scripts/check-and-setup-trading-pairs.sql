-- Check existing trading pairs and add sample data if needed
-- Run this in Supabase SQL Editor

-- First, check what trading pairs exist
SELECT * FROM trading_pairs LIMIT 10;

-- If no trading pairs exist, add some common ones
INSERT INTO trading_pairs (symbol, base_asset, quote_asset) VALUES 
('BTCUSDT', 'BTC', 'USDT'),
('ETHUSDT', 'ETH', 'USDT'),
('XAUUSDT', 'XAU', 'USDT'),
('EURUSDT', 'EUR', 'USDT'),
('GBPUSDT', 'GBP', 'USDT')
ON CONFLICT (symbol) DO NOTHING;

-- Check trade_outcomes table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trade_outcomes' 
ORDER BY ordinal_position;

-- Check if there are any existing trade outcomes
SELECT * FROM trade_outcomes LIMIT 5;

-- Add a sample trade outcome for testing (replace USER_UUID with actual user UUID)
-- First get a user UUID
SELECT id, email FROM public.users LIMIT 1;

-- Then add a sample outcome (replace the UUID below with the actual user ID)
INSERT INTO trade_outcomes (
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
    'USER_UUID_HERE', -- Replace with actual user UUID from the query above
    true,
    'win',
    false,
    false,
    true,
    false,
    'Options trading only - Force WIN enabled',
    1,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    outcome_type = EXCLUDED.outcome_type,
    options_enabled = EXCLUDED.options_enabled,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Check trade_windows table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'trade_windows' 
ORDER BY ordinal_position;

-- Add a sample trade window for testing
INSERT INTO trade_windows (
    outcome_type,
    win_rate,
    start_time,
    end_time,
    description,
    active,
    created_at
) VALUES (
    'win',
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() + INTERVAL '1 hour',
    'Global WIN window for testing',
    true,
    NOW()
);

-- Verify the data was added
SELECT 'Trading Pairs:' as table_name, COUNT(*) as record_count FROM trading_pairs
UNION ALL
SELECT 'Trade Outcomes:', COUNT(*) FROM trade_outcomes
UNION ALL  
SELECT 'Trade Windows:', COUNT(*) FROM trade_windows;
