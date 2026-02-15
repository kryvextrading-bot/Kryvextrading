# SQL Function Naming Fix

## Issue
The PostgreSQL function `check_trade_outcome` had a naming conflict, causing the error:
```
ERROR: 42725: function name "check_trade_outcome" is not unique
```

## Solution
Renamed the function to `check_user_trade_outcome` to avoid conflicts.

## Files Updated

### 1. Database Migration
**File**: `backend/migrations/001_trading_controls.sql`
- Changed function name from `check_trade_outcome` to `check_user_trade_outcome`
- Updated GRANT statement accordingly

### 2. Backend Service
**File**: `backend/services/tradingControlService.js`
- Updated RPC call to use new function name

### 3. Admin Routes
**File**: `backend/routes/admin/tradingControlRoutes.js`
- Fixed syntax error and updated to use service method instead of direct RPC call

### 4. Frontend API
**File**: `src/services/tradingControlApi.ts`
- Updated RPC call to use new function name

## How to Apply Fix

```bash
# If you already ran the migration, run this to update the function:
DROP FUNCTION IF EXISTS check_trade_outcome(UUID, VARCHAR);

# Then re-run the migration:
psql -U your_user -d your_database -f backend/migrations/001_trading_controls.sql
```

## Verification
After applying the fix, test with:

```bash
# Test the diagnostic tool
python backend/scripts/trading_system_repair.py diagnose

# Test API endpoint
curl -X POST http://localhost:3000/api/admin/trading-control/check-outcome \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id", "tradeType": "spot"}'
```

The function naming conflict is now resolved and the trading control system should work correctly.
