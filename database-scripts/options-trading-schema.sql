-- Options Trading System Database Schema
-- Complete implementation for options trading with scheduled trades and price caching

-- Options orders table
CREATE TABLE IF NOT EXISTS options_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES trading_pairs(id),
  
  -- Core order data
  direction VARCHAR(10) NOT NULL, -- 'UP' or 'DOWN'
  stake DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  expiry_price DECIMAL(20,8),
  profit DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) DEFAULT 0,
  
  -- Time data
  duration INTEGER NOT NULL, -- in seconds (60, 120, 240, 360, 600)
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  
  -- Fluctuation data
  fluctuation_range DECIMAL(10,4) NOT NULL,
  payout_rate DECIMAL(10,4) NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
  pnl DECIMAL(20,8),
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT fk_options_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_options_orders_pair FOREIGN KEY (pair_id) REFERENCES trading_pairs(id)
);

CREATE INDEX IF NOT EXISTS idx_options_orders_user_id ON options_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_options_orders_status ON options_orders(status);
CREATE INDEX IF NOT EXISTS idx_options_orders_end_time ON options_orders(end_time);
CREATE INDEX IF NOT EXISTS idx_options_orders_scheduled ON options_orders(status, end_time) WHERE status = 'SCHEDULED';

-- Scheduled trades table (for options)
CREATE TABLE IF NOT EXISTS scheduled_options_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pair_id UUID REFERENCES trading_pairs(id),
  
  -- Trade parameters
  direction VARCHAR(10) NOT NULL,
  stake DECIMAL(20,8) NOT NULL,
  duration INTEGER NOT NULL,
  fluctuation_range DECIMAL(10,4) NOT NULL,
  payout_rate DECIMAL(10,4) NOT NULL,
  
  -- Scheduling
  scheduled_time TIMESTAMP NOT NULL, -- UTC+0
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'EXECUTED', 'CANCELLED', 'FAILED'
  
  -- Execution reference
  executed_order_id UUID REFERENCES options_orders(id),
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  executed_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT fk_scheduled_options_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_scheduled_options_pair FOREIGN KEY (pair_id) REFERENCES trading_pairs(id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_options_user_id ON scheduled_options_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_options_scheduled_time ON scheduled_options_trades(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_options_status ON scheduled_options_trades(status);

-- Price cache table (for offline fallback and settlement)
CREATE TABLE IF NOT EXISTS price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID REFERENCES trading_pairs(id),
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8),
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_price_cache_pair FOREIGN KEY (pair_id) REFERENCES trading_pairs(id)
);

CREATE INDEX IF NOT EXISTS idx_price_cache_pair_timestamp ON price_cache(pair_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_price_cache_cleanup ON price_cache(timestamp);

-- User indicator settings
CREATE TABLE IF NOT EXISTS user_indicator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  indicator_name VARCHAR(50) NOT NULL,
  settings JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_indicator_settings_user FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, indicator_name)
);

-- Trading windows (admin control for win/loss rates)
CREATE TABLE IF NOT EXISTS trading_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_type VARCHAR(20) NOT NULL, -- 'win', 'loss', 'random'
  win_rate DECIMAL(5,2), -- percentage for random mode
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_trading_windows_creator FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trading_windows_active ON trading_windows(is_active, start_time, end_time);

-- Insert default trading windows for demo purposes
INSERT INTO trading_windows (outcome_type, win_rate, start_time, end_time, description, created_by) 
VALUES 
  ('random', 60.0, NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour', 'Default 60% win rate window', (SELECT id FROM users LIMIT 1)),
  ('win', NULL, NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '30 minutes', 'Guaranteed win window', (SELECT id FROM users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Function to get current price for a pair
CREATE OR REPLACE FUNCTION get_current_price(pair_uuid UUID)
RETURNS DECIMAL(20,8) AS $$
DECLARE
  current_price DECIMAL(20,8);
BEGIN
  -- Try to get the most recent price from cache
  SELECT price INTO current_price 
  FROM price_cache 
  WHERE pair_id = pair_uuid 
  ORDER BY timestamp DESC 
  LIMIT 1;
  
  -- If no price found, return 0
  IF current_price IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN current_price;
END;
$$ LANGUAGE plpgsql;

-- Function to settle expired options
CREATE OR REPLACE FUNCTION settle_expired_options()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER := 0;
  option_record RECORD;
  settlement_price DECIMAL(20,8);
  is_win BOOLEAN;
  calculated_pnl DECIMAL(20,8);
BEGIN
  -- Loop through all expired active options
  FOR option_record IN 
    SELECT o.*, tp.symbol as pair_symbol
    FROM options_orders o
    JOIN trading_pairs tp ON o.pair_id = tp.id
    WHERE o.status = 'ACTIVE' 
    AND o.end_time <= NOW()
  LOOP
    -- Get settlement price (price at end_time or closest available)
    SELECT price INTO settlement_price
    FROM price_cache
    WHERE pair_id = option_record.pair_id
    AND timestamp >= option_record.end_time - INTERVAL '2 seconds'
    AND timestamp <= option_record.end_time + INTERVAL '2 seconds'
    ORDER BY ABS(EXTRACT(EPOCH FROM (timestamp - option_record.end_time)))
    LIMIT 1;
    
    -- If no exact price, use closest available
    IF settlement_price IS NULL THEN
      SELECT price INTO settlement_price
      FROM price_cache
      WHERE pair_id = option_record.pair_id
      ORDER BY timestamp DESC
      LIMIT 1;
    END IF;
    
    -- If still no price, skip settlement
    IF settlement_price IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Determine if option won
    IF option_record.direction = 'UP' THEN
      is_win := settlement_price > option_record.entry_price;
    ELSE
      is_win := settlement_price < option_record.entry_price;
    END IF;
    
    -- Calculate PnL
    IF is_win THEN
      calculated_pnl := option_record.profit; -- Profit amount
    ELSE
      calculated_pnl := -option_record.stake; -- Loss amount
    END IF;
    
    -- Update the option order
    UPDATE options_orders SET
      status = 'COMPLETED',
      expiry_price = settlement_price,
      pnl = calculated_pnl,
      completed_at = NOW(),
      metadata = COALESCE(metadata, '{}') || jsonb_build_object(
        'settlement_price', settlement_price,
        'is_win', is_win,
        'settled_at', NOW()
      )
    WHERE id = option_record.id;
    
    expired_count := expired_count + 1;
  END LOOP;
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to relevant tables
CREATE TRIGGER update_options_orders_updated_at 
    BEFORE UPDATE ON options_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_options_trades_updated_at 
    BEFORE UPDATE ON scheduled_options_trades 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_indicator_settings_updated_at 
    BEFORE UPDATE ON user_indicator_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
