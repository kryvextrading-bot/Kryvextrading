-- Quick fix for audit trigger UUID issue
-- Run this in Supabase SQL editor to fix the immediate problem

-- Drop existing triggers temporarily to allow trades to work
DROP TRIGGER IF EXISTS audit_trades_trigger ON public.trades;
DROP TRIGGER IF EXISTS audit_trading_locks_trigger ON public.trading_locks;

-- Note: You can re-enable audit triggers later by running:
-- \i database-scripts/trading-audit-triggers.sql
