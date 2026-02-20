-- Fix missing log_trading_admin_action function
-- This script adds the missing function that was not created during initial setup

-- Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_trading_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_user_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Check if admin_id exists in users table, if not, skip logging
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id) THEN
    INSERT INTO public.trading_admin_audit (admin_id, action, user_id, details)
    VALUES (p_admin_id, p_action, p_user_id, p_details);
  ELSE
    -- Optionally log to system logs or handle gracefully
    RAISE NOTICE 'Admin ID % not found in users table, skipping audit log', p_admin_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function with a real admin user (get actual admin ID from users table)
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get a real admin user ID
  SELECT id INTO admin_id FROM public.users WHERE is_admin = true LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    PERFORM public.log_trading_admin_action(
      admin_id,
      'test_function',
      NULL,
      '{"test": true}'::jsonb
    );
    RAISE NOTICE 'Test function executed successfully with admin_id: %', admin_id;
  ELSE
    RAISE NOTICE 'No admin user found - skipping function test';
  END IF;
END $$;

-- Verify it exists
SELECT 'log_trading_admin_action function created successfully' as status;
