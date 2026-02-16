-- Create ledger_entries table for transaction logging
-- This table is used to track all wallet transactions and ledger entries

-- Step 1: Create the ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    asset TEXT NOT NULL,
    amount NUMERIC(20, 8) NOT NULL,
    balance_before NUMERIC(20, 8) NOT NULL DEFAULT 0,
    balance_after NUMERIC(20, 8) NOT NULL DEFAULT 0,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'deposit', 'withdrawal', 'transfer_in', 'transfer_out', 
        'trade', 'fee', 'lock', 'unlock', 'profit', 'loss', 
        'arbitrage', 'staking', 'options', 'refund', 'adjustment'
    )),
    reference TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    related_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_asset ON ledger_entries(asset);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_type ON ledger_entries(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_asset ON ledger_entries(user_id, asset);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference ON ledger_entries(reference);

-- Step 3: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ledger_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ledger_entries_updated_at
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_ledger_entries_updated_at();

-- Step 4: Create a function to add ledger entries (for use in other functions)
CREATE OR REPLACE FUNCTION add_ledger_entry(
    p_user_id UUID,
    p_asset TEXT,
    p_amount NUMERIC,
    p_balance_before NUMERIC,
    p_balance_after NUMERIC,
    p_transaction_type TEXT,
    p_reference TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_related_transaction_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    entry_id UUID;
BEGIN
    INSERT INTO ledger_entries (
        user_id, asset, amount, balance_before, balance_after,
        transaction_type, reference, description, metadata, related_transaction_id
    )
    VALUES (
        p_user_id, p_asset, p_amount, p_balance_before, p_balance_after,
        p_transaction_type, p_reference, p_description, p_metadata, p_related_transaction_id
    )
    RETURNING id INTO entry_id;
    
    RETURN entry_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create ledger entry: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Grant permissions
GRANT SELECT, INSERT, UPDATE ON ledger_entries TO authenticated;

-- Step 6: Verify table creation
SELECT 
    'Table Created' as step,
    'ledger_entries table is now available for transaction logging' as status;
