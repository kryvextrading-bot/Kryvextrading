-- Simple setup for trading_pairs table with only existing columns
-- Run this in Supabase SQL Editor

-- First, check the actual structure of trading_pairs table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'trading_pairs' 
ORDER BY ordinal_position;

-- Insert trading pairs with only the columns that exist
INSERT INTO trading_pairs (
    id,
    symbol, 
    base_asset, 
    quote_asset,
    min_order_size,
    max_order_size,
    price_precision,
    is_active,
    created_at,
    updated_at
) VALUES 
-- Major Cryptocurrencies
(gen_random_uuid(), 'BTCUSDT', 'BTC', 'USDT', 0.00001, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'ETHUSDT', 'ETH', 'USDT', 0.0001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BNBUSDT', 'BNB', 'USDT', 0.001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'ADAUSDT', 'ADA', 'USDT', 1, 1000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SOLUSDT', 'SOL', 'USDT', 0.001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XRPUSDT', 'XRP', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DOGEUSDT', 'DOGE', 'USDT', 1, 10000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DOTUSDT', 'DOT', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'LINKUSDT', 'LINK', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'MATICUSDT', 'MATIC', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),

-- DeFi Tokens
(gen_random_uuid(), 'UNIUSDT', 'UNI', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'AAVEUSDT', 'AAVE', 'USDT', 0.001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'COMPUSDT', 'COMP', 'USDT', 0.001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'MKRUSDT', 'MKR', 'USDT', 0.001, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SUSHIUSDT', 'SUSHI', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),

-- Layer 2 Tokens
(gen_random_uuid(), 'ARBUSDT', 'ARB', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'OPUSDT', 'OP', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'LDOUSDT', 'LDO', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),

-- Meme Coins
(gen_random_uuid(), 'SHIBUSDT', 'SHIB', 'USDT', 1000, 10000000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'PEPEUSDT', 'PEPE', 'USDT', 1000000, 1000000000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'FLOKIUSDT', 'FLOKI', 'USDT', 100, 100000000, 2, true, NOW(), NOW()),

-- Stablecoins
(gen_random_uuid(), 'USDCUSDT', 'USDC', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BUSDUSDT', 'BUSD', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DAIUSDT', 'DAI', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TUSDUSDT', 'TUSD', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),

-- Traditional Markets
(gen_random_uuid(), 'XAUUSDT', 'XAU', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'EURUSDT', 'EUR', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'GBPUSDT', 'GBP', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'JPYUSDT', 'JPY', 'USDT', 0.1, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CHFUSDT', 'CHF', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CADUSDT', 'CAD', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'AUDUSDT', 'AUD', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Asian Markets
(gen_random_uuid(), 'CNYUSDT', 'CNY', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'HKDUSDT', 'HKD', 'USDT', 0.01, 100000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SGDUSDT', 'SGD', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'INRUSDT', 'INR', 'USDT', 0.1, 1000000, 2, true, NOW(), NOW()),

-- Commodities
(gen_random_uuid(), 'OILUSDT', 'OIL', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'GASUSDT', 'GAS', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SILVERUSDT', 'SILVER', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'COPPERUSDT', 'COPPER', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),

-- Stock Indices
(gen_random_uuid(), 'SPXUSDT', 'SPX', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'NDQUSDT', 'NDQ', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DJIAUSDT', 'DJIA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'FTSEUSDT', 'FTSE', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DAXUSDT', 'DAX', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'NIKKEIUSDT', 'NIKKEI', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Tech Stocks
(gen_random_uuid(), 'AAPLUSDT', 'AAPL', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'GOOGLUSDT', 'GOOGL', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'MSFTUSDT', 'MSFT', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'AMZNUSDT', 'AMZN', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TSLAUSDT', 'TSLA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'METAUSDT', 'META', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'NVDAUSDT', 'NVDA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'NFLXUSDT', 'NFLX', 'USDT', 0.01, 10000, 2, true, NOW(), NOW())

ON CONFLICT (symbol) DO NOTHING;

-- Verify the data was inserted successfully
SELECT 
    symbol,
    base_asset,
    quote_asset,
    min_order_size,
    max_order_size,
    price_precision,
    is_active,
    created_at
FROM trading_pairs 
ORDER BY symbol;

-- Count by category
SELECT 
    CASE 
        WHEN symbol IN ('BTCUSDT', 'ETHUSDT', 'BNBUSDT') THEN 'Major Crypto'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('ADA', 'SOL', 'XRP', 'DOGE', 'DOT', 'LINK', 'MATIC') THEN 'Altcoins'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('UNI', 'AAVE', 'COMP', 'MKR', 'SUSHI') THEN 'DeFi'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('ARB', 'OP', 'LDO') THEN 'Layer 2'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('SHIB', 'PEPE', 'FLOKI') THEN 'Meme Coins'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('USDC', 'BUSD', 'DAI', 'TUSD') THEN 'Stablecoins'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('XAU', 'EUR', 'GBP', 'JPY') THEN 'Traditional'
        WHEN symbol LIKE '%USDT' AND base_asset IN ('SPX', 'NDQ', 'DJIA', 'AAPL', 'GOOGL') THEN 'Stocks'
        ELSE 'Other'
    END as category,
    COUNT(*) as count
FROM trading_pairs 
GROUP BY category 
ORDER BY count DESC;

-- Total count
SELECT COUNT(*) as total_trading_pairs FROM trading_pairs WHERE is_active = true;
