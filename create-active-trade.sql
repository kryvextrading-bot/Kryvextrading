-- Create a test active trade that will expire in 2 minutes
INSERT INTO public.options_orders (
    id,
    user_id,
    symbol,
    direction,
    stake,
    entry_price,
    expiry_price,
    profit,
    fee,
    duration,
    start_time,
    end_time,
    status,
    payout_rate,
    fluctuation_range,
    created_at,
    completed_at,
    pnl,
    metadata
) VALUES (
    'test-active-' || EXTRACT(EPOCH FROM NOW())::text,
    '6ef846d4-8edb-42f0-b386-08bdc67d93eb', -- Your user ID
    'BTCUSDT',
    'UP',
    100.00,
    67000.00,
    NULL,
    NULL,
    0.15,
    120, -- 2 minutes
    NOW(),
    NOW() + INTERVAL '2 minutes',
    'ACTIVE',
    0.176,
    0.01,
    NOW(),
    NULL,
    NULL,
    '{"isTest": true, "createdAt": "' || NOW() || '"}'
);

-- Verify the active trade was created
SELECT 
    id, 
    status, 
    stake,
    start_time,
    end_time,
    NOW() as current_time,
    (EXTRACT(EPOCH FROM (end_time - NOW())) as seconds_until_expiry
FROM public.options_orders 
WHERE status = 'ACTIVE' AND user_id = '6ef846d4-8edb-42f0-b386-08bdc67d93eb';
