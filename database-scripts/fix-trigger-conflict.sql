-- Quick fix for trigger conflict
-- Run this if you get "trigger already exists" error

-- Drop the conflicting trigger
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;

-- Recreate the trigger
CREATE TRIGGER handle_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW 
EXECUTE FUNCTION handle_updated_at ();

-- Verify the trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table = 'users'
    AND trigger_name = 'handle_users_updated_at';
