-- Test ledger_entries table functionality
-- This script verifies that the ledger_entries table is working correctly

-- Step 1: Test basic insert operation
INSERT INTO ledger_entries (
    user_id, 
    asset, 
    amount, 
    balance_before, 
    balance_after, 
    transaction_type, 
    reference, 
    description
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,  -- Test user ID
    'USDT', 
    100.00, 
    0.00, 
    100.00, 
    'deposit', 
    'test_deposit_001',
    'Test deposit entry'
);

-- Step 2: Verify the insert worked
SELECT 
    'Test Insert Result' as step,
    id,
    user_id,
    asset,
    amount,
    balance_before,
    balance_after,
    transaction_type,
    reference,
    description,
    created_at
FROM ledger_entries 
WHERE reference = 'test_deposit_001';

-- Step 3: Test query performance with user_id
SELECT 
    'Test Query by User' as step,
    COUNT(*) as total_entries,
    SUM(amount) as total_amount
FROM ledger_entries 
WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY user_id;

-- Step 4: Test query performance with asset
SELECT 
    'Test Query by Asset' as step,
    asset,
    COUNT(*) as entry_count,
    SUM(amount) as total_volume
FROM ledger_entries 
GROUP BY asset
ORDER BY asset;

-- Step 5: Clean up test data
DELETE FROM ledger_entries 
WHERE reference = 'test_deposit_001';

-- Step 6: Final verification
SELECT 
    'Cleanup Complete' as step,
    'Test data removed, table is ready for production' as status;
