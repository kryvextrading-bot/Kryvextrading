-- Add ETFs and US Stocks to trading_pairs table
-- Run this in Supabase SQL Editor

-- Insert ETFs
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
-- Major ETFs
(gen_random_uuid(), 'SPYUSDT', 'SPY', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'IVVUSDT', 'IVV', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'VOOUSDT', 'VOO', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'QQQUSDT', 'QQQ', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'VTIUSDT', 'VTI', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'VEAUSDT', 'VEA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'VWOUSDT', 'VWO', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BNDUSDT', 'BND', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'GLDUSDT', 'GLD', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SLVUSDT', 'SLV', 'USDT', 0.01, 1000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XLFUSDT', 'XLF', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XLEUSDT', 'XLE', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XLKUSDT', 'XLK', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XLIUSDT', 'XLI', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'XLVUSDT', 'XLV', 'USDT', 0.01, 10000, 2, true, NOW(), NOW())

ON CONFLICT (symbol) DO NOTHING;

-- Insert Additional US Stocks (beyond the tech stocks already added)
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
-- Financial Stocks
(gen_random_uuid(), 'JPMUSDT', 'JPM', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BACUSDT', 'BAC', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'WFCUSDT', 'WFC', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'GSUSDT', 'GS', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'MSUSDT', 'MS', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CITUSDT', 'CIT', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Healthcare Stocks
(gen_random_uuid(), 'JNJUSDT', 'JNJ', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'PFEUSDT', 'PFE', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'UNHUSDT', 'UNH', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'ABTUSDT', 'ABT', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TSLAUSDT', 'TSLA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Consumer Stocks
(gen_random_uuid(), 'AMZNUSDT', 'AMZN', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'WMTUSDT', 'WMT', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'COSTUSDT', 'COST', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'HDUSDT', 'HD', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'PGUSDT', 'PG', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'KOUSDT', 'KO', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Energy Stocks
(gen_random_uuid(), 'XOMUSDT', 'XOM', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CVXUSDT', 'CVX', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'COPUSDT', 'COP', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BPUSDT', 'BP', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SHELUSDT', 'SHEL', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Industrial Stocks
(gen_random_uuid(), 'GEUSDT', 'GE', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'BAUSDT', 'BA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CATUSDT', 'CAT', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'MMMUSDT', 'MMM', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'HONUSDT', 'HON', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Telecom Stocks
(gen_random_uuid(), 'VZUSDT', 'VZ', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TUSDT', 'T', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TMUSUSDT', 'TMUS', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'CMCSAUSDT', 'CMCSA', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'DISUSDT', 'DIS', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),

-- Additional Tech Stocks
(gen_random_uuid(), 'CRMUSDT', 'CRM', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'ADBEUSDT', 'ADBE', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'INTCUSDT', 'INTC', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'AMDUSDT', 'AMD', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'PYPLUSDT', 'PYPL', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SQUSDT', 'SQ', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SHOPUSDT', 'SHOP', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'TWTRUSDT', 'TWTR', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'SNAPUSDT', 'SNAP', 'USDT', 0.01, 10000, 2, true, NOW(), NOW()),
(gen_random_uuid(), 'PINSUSDT', 'PINS', 'USDT', 0.01, 10000, 2, true, NOW(), NOW())

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
WHERE symbol LIKE '%USDT' 
  AND (symbol LIKE 'SPY%' OR symbol LIKE 'IVV%' OR symbol LIKE 'QQQ%' OR 
       symbol IN ('JPMUSDT', 'BACUSDT', 'WFCUSDT', 'JNJUSDT', 'WMTUSDT', 'XOMUSDT', 'GEUSDT', 'VZUSDT', 'CRMUSDT'))
ORDER BY symbol;

-- Count by category
SELECT 
    CASE 
        WHEN symbol IN ('SPYUSDT', 'IVVUSDT', 'VOOUSDT', 'QQQUSDT', 'VTIUSDT', 'VEAUSDT', 'VWOUSDT', 'BNDUSDT', 'GLDUSDT', 'SLVUSDT', 'XLFUSDT', 'XLEUSDT', 'XLKUSDT', 'XLIUSDT', 'XLVUSDT') THEN 'ETFs'
        WHEN symbol IN ('AAPLUSDT', 'GOOGLUSDT', 'MSFTUSDT', 'AMZNUSDT', 'TSLAUSDT', 'METAUSDT', 'NVDAUSDT', 'NFLXUSDT', 'CRMUSDT', 'ADBEUSDT', 'INTCUSDT', 'AMDUSDT', 'PYPLUSDT', 'SQUSDT', 'SHOPUSDT', 'TWTRUSDT', 'SNAPUSDT', 'PINSUSDT') THEN 'Tech Stocks'
        WHEN symbol IN ('JPMUSDT', 'BACUSDT', 'WFCUSDT', 'GSUSDT', 'MSUSDT', 'CITUSDT') THEN 'Financial Stocks'
        WHEN symbol IN ('JNJUSDT', 'PFEUSDT', 'UNHUSDT', 'ABTUSDT') THEN 'Healthcare Stocks'
        WHEN symbol IN ('WMTUSDT', 'COSTUSDT', 'HDUSDT', 'PGUSDT', 'KOUSDT', 'DISUSDT') THEN 'Consumer Stocks'
        WHEN symbol IN ('XOMUSDT', 'CVXUSDT', 'COPUSDT', 'BPUSDT', 'SHELUSDT') THEN 'Energy Stocks'
        WHEN symbol IN ('GEUSDT', 'BAUSDT', 'CATUSDT', 'MMMUSDT', 'HONUSDT') THEN 'Industrial Stocks'
        WHEN symbol IN ('VZUSDT', 'TUSDT', 'TMUSUSDT', 'CMCSAUSDT') THEN 'Telecom Stocks'
        ELSE 'Other'
    END as category,
    COUNT(*) as count
FROM trading_pairs 
WHERE symbol LIKE '%USDT'
GROUP BY category 
ORDER BY count DESC;

-- Total count
SELECT COUNT(*) as total_etf_usdt FROM trading_pairs WHERE symbol LIKE '%USDT' AND is_active = true;
