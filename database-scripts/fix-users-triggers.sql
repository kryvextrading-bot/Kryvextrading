-- Fix users table triggers - handle existing triggers
-- This script safely updates the users table without breaking existing functionality

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS on_user_created_create_wallet_balances ON public.users;
DROP TRIGGER IF EXISTS on_user_insert_auto_wallets ON public.users;
DROP TRIGGER IF EXISTS on_user_update_auto_wallets ON public.users;

-- Recreate triggers with proper names and functions
CREATE TRIGGER handle_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION handle_updated_at ();

CREATE TRIGGER on_user_created_create_wallet_balances 
AFTER INSERT ON users 
FOR EACH ROW 
EXECUTE FUNCTION create_user_wallet_balances ();

CREATE TRIGGER on_user_insert_auto_wallets 
AFTER INSERT ON users 
FOR EACH ROW 
EXECUTE FUNCTION auto_create_user_wallets ();

CREATE TRIGGER on_user_update_auto_wallets 
AFTER UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION auto_create_wallets_on_status_change ();

-- Verify triggers were created successfully
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table = 'users'
ORDER BY trigger_name;
