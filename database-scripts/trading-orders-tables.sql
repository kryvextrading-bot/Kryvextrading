-- Trading Orders Tables
-- Create necessary tables for spot orders, futures positions, and options contracts

-- Create spot_orders table
CREATE TABLE IF NOT EXISTS spot_orders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  filled DECIMAL(20,8) DEFAULT 0,
  remaining DECIMAL(20,8) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('open', 'filled', 'cancelled', 'expired')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create futures_positions table
CREATE TABLE IF NOT EXISTS futures_positions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
  status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'liquidated')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create options_contracts table
CREATE TABLE IF NOT EXISTS options_contracts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'put')),
  strike DECIMAL(20,8) NOT NULL,
  expiration TIMESTAMP WITH TIME ZONE NOT NULL,
  premium DECIMAL(20,8) NOT NULL,
  quantity INTEGER NOT NULL,
  payout DECIMAL(20,8),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'exercised')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spot_orders_user_id ON spot_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_orders_status ON spot_orders(status);
CREATE INDEX IF NOT EXISTS idx_spot_orders_pair ON spot_orders(pair);
CREATE INDEX IF NOT EXISTS idx_futures_positions_user_id ON futures_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_futures_positions_status ON futures_positions(status);
CREATE INDEX IF NOT EXISTS idx_futures_positions_symbol ON futures_positions(symbol);
CREATE INDEX IF NOT EXISTS idx_options_contracts_user_id ON options_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_options_contracts_status ON options_contracts(status);
CREATE INDEX IF NOT EXISTS idx_options_contracts_symbol ON options_contracts(symbol);

-- Enable RLS
ALTER TABLE spot_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE futures_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for spot_orders
CREATE POLICY "Users can view their own spot orders" ON spot_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spot orders" ON spot_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spot orders" ON spot_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spot orders" ON spot_orders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for futures_positions
CREATE POLICY "Users can view their own futures positions" ON futures_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own futures positions" ON futures_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own futures positions" ON futures_positions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own futures positions" ON futures_positions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for options_contracts
CREATE POLICY "Users can view their own options contracts" ON options_contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own options contracts" ON options_contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own options contracts" ON options_contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own options contracts" ON options_contracts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON spot_orders TO authenticated;
GRANT ALL ON futures_positions TO authenticated;
GRANT ALL ON options_contracts TO authenticated;
