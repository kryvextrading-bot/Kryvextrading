-- Unified Trading System Database Tables
-- Complete database schema for all trading types with proper locking

-- Create unified trades table
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('spot', 'futures', 'options', 'arbitrage', 'staking')),
  status TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  total DECIMAL(20,8),
  pnl DECIMAL(20,8),
  fee DECIMAL(20,8),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Spot orders table
CREATE TABLE IF NOT EXISTS spot_orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  filled DECIMAL(20,8) DEFAULT 0,
  remaining DECIMAL(20,8) DEFAULT 0,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Futures positions table
CREATE TABLE IF NOT EXISTS futures_positions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  size DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8) NOT NULL,
  mark_price DECIMAL(20,8) NOT NULL,
  leverage INTEGER NOT NULL,
  margin DECIMAL(20,8) NOT NULL,
  pnl DECIMAL(20,8) DEFAULT 0,
  liquidation_price DECIMAL(20,8) NOT NULL,
  take_profit DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Options contracts table
CREATE TABLE IF NOT EXISTS options_contracts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'put')),
  strike DECIMAL(20,8) NOT NULL,
  expiration TIMESTAMP WITH TIME ZONE NOT NULL,
  premium DECIMAL(20,8) NOT NULL,
  quantity INTEGER NOT NULL,
  payout DECIMAL(20,8),
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Arbitrage contracts table
CREATE TABLE IF NOT EXISTS arbitrage_contracts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_label TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  duration INTEGER NOT NULL,
  daily_rate DECIMAL(10,6) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading locks table
CREATE TABLE IF NOT EXISTS trading_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  trade_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  released_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_type ON trades(type);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);

CREATE INDEX IF NOT EXISTS idx_spot_orders_user_id ON spot_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_orders_status ON spot_orders(status);
CREATE INDEX IF NOT EXISTS idx_spot_orders_pair ON spot_orders(pair);

CREATE INDEX IF NOT EXISTS idx_futures_positions_user_id ON futures_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_futures_positions_status ON futures_positions(status);
CREATE INDEX IF NOT EXISTS idx_futures_positions_symbol ON futures_positions(symbol);

CREATE INDEX IF NOT EXISTS idx_options_contracts_user_id ON options_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_options_contracts_status ON options_contracts(status);
CREATE INDEX IF NOT EXISTS idx_options_contracts_symbol ON options_contracts(symbol);

CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_user_id ON arbitrage_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_status ON arbitrage_contracts(status);

CREATE INDEX IF NOT EXISTS idx_trading_locks_user_id ON trading_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_locks_reference_id ON trading_locks(reference_id);
CREATE INDEX IF NOT EXISTS idx_trading_locks_status ON trading_locks(status);

-- Enable RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE futures_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trades
CREATE POLICY "Users can view their own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades" ON trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades" ON trades
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for spot_orders
DROP POLICY IF EXISTS "Users can view their own spot orders" ON spot_orders;
DROP POLICY IF EXISTS "Users can insert their own spot orders" ON spot_orders;
DROP POLICY IF EXISTS "Users can update their own spot orders" ON spot_orders;
DROP POLICY IF EXISTS "Users can delete their own spot orders" ON spot_orders;

CREATE POLICY "Users can view their own spot orders" ON spot_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spot orders" ON spot_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spot orders" ON spot_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spot orders" ON spot_orders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for futures_positions
DROP POLICY IF EXISTS "Users can view their own futures positions" ON futures_positions;
DROP POLICY IF EXISTS "Users can insert their own futures positions" ON futures_positions;
DROP POLICY IF EXISTS "Users can update their own futures positions" ON futures_positions;
DROP POLICY IF EXISTS "Users can delete their own futures positions" ON futures_positions;

CREATE POLICY "Users can view their own futures positions" ON futures_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own futures positions" ON futures_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own futures positions" ON futures_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own futures positions" ON futures_positions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for options_contracts
DROP POLICY IF EXISTS "Users can view their own options contracts" ON options_contracts;
DROP POLICY IF EXISTS "Users can insert their own options contracts" ON options_contracts;
DROP POLICY IF EXISTS "Users can update their own options contracts" ON options_contracts;
DROP POLICY IF EXISTS "Users can delete their own options contracts" ON options_contracts;

CREATE POLICY "Users can view their own options contracts" ON options_contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own options contracts" ON options_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own options contracts" ON options_contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own options contracts" ON options_contracts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for arbitrage_contracts
DROP POLICY IF EXISTS "Users can view their own arbitrage contracts" ON arbitrage_contracts;
DROP POLICY IF EXISTS "Users can insert their own arbitrage contracts" ON arbitrage_contracts;
DROP POLICY IF EXISTS "Users can update their own arbitrage contracts" ON arbitrage_contracts;
DROP POLICY IF EXISTS "Users can delete their own arbitrage contracts" ON arbitrage_contracts;

CREATE POLICY "Users can view their own arbitrage contracts" ON arbitrage_contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own arbitrage contracts" ON arbitrage_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own arbitrage contracts" ON arbitrage_contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own arbitrage contracts" ON arbitrage_contracts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trading_locks
DROP POLICY IF EXISTS "Users can view their own trading locks" ON trading_locks;
DROP POLICY IF EXISTS "Users can insert their own trading locks" ON trading_locks;
DROP POLICY IF EXISTS "Users can update their own trading locks" ON trading_locks;
DROP POLICY IF EXISTS "Users can delete their own trading locks" ON trading_locks;

CREATE POLICY "Users can view their own trading locks" ON trading_locks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading locks" ON trading_locks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading locks" ON trading_locks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trading locks" ON trading_locks
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON trades TO authenticated;
GRANT ALL ON spot_orders TO authenticated;
GRANT ALL ON futures_positions TO authenticated;
GRANT ALL ON options_contracts TO authenticated;
GRANT ALL ON arbitrage_contracts TO authenticated;
GRANT ALL ON trading_locks TO authenticated;
