# Database Column Mapping Fix

## **Problem Identified**
The error `Could not find the 'symbol' column of 'options_orders' in the schema cache` indicated that the `symbol` column doesn't exist in the database table.

## **Root Cause**
The `options_orders` table doesn't have a direct `symbol` column. Instead, the symbol information is stored in the `metadata` JSON column.

## **Fixes Applied**

### **1. executeTrade() - Column Removal**
**File**: `src/services/unified-trading-service.ts`
**Change**: Removed `symbol: data.symbol || 'BTCUSDT'` from the insert object
**Reason**: The column doesn't exist in the database schema

### **2. getActiveOptionsOrders() - Symbol Mapping**
**File**: `src/services/unified-trading-service.ts`
**Change**: `symbol: order.metadata?.symbol || 'BTCUSDT'`
**Reason**: Extract symbol from metadata JSON column with fallback

### **3. getCompletedOptionsOrders() - Symbol Mapping**
**File**: `src/services/unified-trading-service.ts`
**Change**: `symbol: order.metadata?.symbol || 'BTCUSDT'`
**Reason**: Extract symbol from metadata JSON column with fallback

## **Database Schema Understanding**
- **`options_orders` table**: Stores trade data without direct `symbol` column
- **`metadata` JSON column**: Contains additional data including `symbol` and `direction`
- **Symbol storage**: `metadata.symbol` (e.g., "BTCUSDT")
- **Direction storage**: Direct `direction` column ('UP'/'DOWN')

## **Testing Steps**
1. ✅ Build successful - no TypeScript errors
2. ✅ Column mapping fixed to match actual database schema
3. 🔄 Ready for testing trade creation and expiration

## **Expected Behavior**
- Trade creation should now work without column errors
- Symbol information will be correctly retrieved from metadata
- Active and completed orders will display proper symbols
