-- =====================================================
-- ARBITRAGE TABLES ONLY (No functions)
-- =====================================================
-- This creates just the tables needed for arbitrage

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS arbitrage_locks CASCADE;
DROP TABLE IF EXISTS arbitrage_contracts CASCADE;

-- =====================================================
-- 1. CREATE ARBITRAGE CONTRACTS TABLE
-- =====================================================

CREATE TABLE arbitrage_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_label TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  duration INTEGER NOT NULL, -- Duration in hours
  apy DECIMAL(5,2) NOT NULL, -- Annual Percentage Yield
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  profit_amount DECIMAL(20,8) DEFAULT 0,
  actual_apy DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT arbitrage_contracts_user_product UNIQUE (user_id, product_id, created_at)
);

-- =====================================================
-- 2. CREATE ARBITRAGE LOCKS TABLE
-- =====================================================

CREATE TABLE arbitrage_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES arbitrage_contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  lock_type TEXT NOT NULL CHECK (lock_type IN ('investment', 'profit_release', 'refund')),
  reference_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'expired', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  released_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT arbitrage_locks_contract_asset UNIQUE (contract_id, asset, lock_type)
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_user_id ON arbitrage_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_status ON arbitrage_contracts(status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_expires_at ON arbitrage_contracts(expires_at);
CREATE INDEX IF NOT EXISTS idx_arbitrage_contracts_product_id ON arbitrage_contracts(product_id);

CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_contract_id ON arbitrage_locks(contract_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_user_id ON arbitrage_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_status ON arbitrage_locks(status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_locks_asset ON arbitrage_locks(asset);

-- =====================================================
-- 4. TEST QUERY TO VERIFY TABLES
-- =====================================================

-- Test that the tables were created successfully
SELECT 'arbitrage_contracts' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'arbitrage_contracts' 
UNION ALL
SELECT 'arbitrage_locks' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'arbitrage_locks'
ORDER BY table_name, column_name;
