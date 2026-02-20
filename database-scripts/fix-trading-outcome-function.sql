-- Fix trading outcome function permissions
-- This script grants execute permissions to the trading outcome function

-- Grant execute permissions to authenticated users for the trading outcome function
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_trading_admin_action(UUID, TEXT, UUID, JSONB) TO authenticated;

-- Also grant to service role for backend operations
GRANT EXECUTE ON FUNCTION public.check_trade_outcome(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_trading_admin_action(UUID, TEXT, UUID, JSONB) TO service_role;
