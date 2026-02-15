-- Quick query to check wallet_balances table structure and data
SELECT 
    user_id,
    asset,
    available,
    locked,
    created_at,
    updated_at
FROM wallet_balances 
WHERE asset IN ('USDT', 'USDT_TRADING')
ORDER BY user_id, asset;

-- Also check if trading_locks table exists and has recent data
SELECT 
    user_id,
    asset,
    amount,
    lock_type,
    status,
    created_at
FROM trading_locks 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
