-- Fix notification trigger RLS violations
-- This script creates proper triggers and policies to handle user notifications

-- Step 1: Create function to handle new user notification setup
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Insert into notification_settings (user preferences)
  INSERT INTO public.notification_settings (
    user_id,
    email_notifications,
    push_notifications,
    trading_alerts,
    price_alerts,
    security_alerts,
    marketing_emails,
    system_updates,
    sound_enabled,
    desktop_notifications,
    mobile_notifications,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    true,  -- email_notifications
    true,  -- push_notifications
    true,  -- trading_alerts
    false, -- price_alerts
    true,  -- security_alerts
    false, -- marketing_emails
    true,  -- system_updates
    true,  -- sound_enabled
    true,  -- desktop_notifications
    true,  -- mobile_notifications
    NOW(),
    NOW()
  );

  -- 2. Insert into notification_preferences (channel preferences)
  -- Email channel
  INSERT INTO public.notification_preferences (
    user_id,
    channel,
    email_alerts,
    sms_alerts,
    push_alerts,
    transaction_alerts,
    security_alerts,
    marketing_emails,
    daily_summary,
    weekly_report,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'email',
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    NOW(),
    NOW()
  );

  -- Push channel
  INSERT INTO public.notification_preferences (
    user_id,
    channel,
    email_alerts,
    sms_alerts,
    push_alerts,
    transaction_alerts,
    security_alerts,
    marketing_emails,
    daily_summary,
    weekly_report,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'push',
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    NOW(),
    NOW()
  );

  -- SMS channel
  INSERT INTO public.notification_preferences (
    user_id,
    channel,
    email_alerts,
    sms_alerts,
    push_alerts,
    transaction_alerts,
    security_alerts,
    marketing_emails,
    daily_summary,
    weekly_report,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'sms',
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    NOW(),
    NOW()
  );

  -- In-app channel
  INSERT INTO public.notification_preferences (
    user_id,
    channel,
    email_alerts,
    sms_alerts,
    push_alerts,
    transaction_alerts,
    security_alerts,
    marketing_emails,
    daily_summary,
    weekly_report,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'in-app',
    true,
    false,
    true,
    true,
    true,
    false,
    true,
    true,
    NOW(),
    NOW()
  );

  -- 3. Create a welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    status,
    priority,
    created_at
  ) VALUES (
    NEW.id,
    'welcome',
    '🎉 Welcome to Kryvex Trading!',
    'Thank you for joining Kryvex. Complete your KYC verification to start trading.',
    'unread',
    'high',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_notification_settings ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_notifications ON auth.users;
DROP TRIGGER IF EXISTS on_users_created_notifications ON public.users;

-- Step 3: Create triggers with elevated privileges
-- Trigger on auth.users table
CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notifications();

-- Also create a trigger for when users are inserted into public.users table
-- (in case auth.users trigger doesn't fire due to RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications_from_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if notification settings already exist to avoid duplicates
  IF NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = NEW.id) THEN
    -- Insert notification settings
    INSERT INTO public.notification_settings (
      user_id,
      email_notifications,
      push_notifications,
      trading_alerts,
      price_alerts,
      security_alerts,
      marketing_emails,
      system_updates,
      sound_enabled,
      desktop_notifications,
      mobile_notifications,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      true, true, true, false, true, false, true, true, true,
      NOW(), NOW()
    );
  END IF;

  -- Check if notification preferences exist
  IF NOT EXISTS (SELECT 1 FROM public.notification_preferences WHERE user_id = NEW.id AND channel = 'email') THEN
    -- Insert all channel preferences
    INSERT INTO public.notification_preferences (
      user_id, channel, email_alerts, sms_alerts, push_alerts,
      transaction_alerts, security_alerts, marketing_emails,
      daily_summary, weekly_report, created_at, updated_at
    ) VALUES
      (NEW.id, 'email', true, false, true, true, true, false, true, true, NOW(), NOW()),
      (NEW.id, 'push', true, false, true, true, true, false, true, true, NOW(), NOW()),
      (NEW.id, 'sms', true, false, true, true, true, false, true, true, NOW(), NOW()),
      (NEW.id, 'in-app', true, false, true, true, true, false, true, true, NOW(), NOW());
  END IF;

  -- Check if welcome notification exists
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = NEW.id AND type = 'welcome') THEN
    INSERT INTO public.notifications (
      user_id, type, title, message, status, priority, created_at
    ) VALUES (
      NEW.id,
      'welcome',
      '🎉 Welcome to Kryvex Trading!',
      'Thank you for joining Kryvex. Complete your KYC verification to start trading.',
      'unread',
      'high',
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on users table
CREATE TRIGGER on_users_created_notifications
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_notifications_from_users();

-- Step 4: Fix RLS policies for all notification tables
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Service role can manage all notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Service role can manage all notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;

-- Create policies for notification_settings
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notification settings"
  ON public.notification_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Create policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.role() = 'service_role');

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications"
  ON public.notifications FOR ALL
  USING (auth.role() = 'service_role');

-- Step 5: Grant necessary permissions
GRANT ALL ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
GRANT ALL ON public.notification_preferences TO service_role;
GRANT ALL ON public.notifications TO service_role;

-- Step 6: Create service role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END
$$;

-- Grant service role to the database owner (this should be the supabase admin)
GRANT service_role TO postgres;
GRANT service_role TO authenticated;

-- Step 7: Add bypass for triggers
-- This allows the SECURITY DEFINER functions to bypass RLS
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT TO service_role;

COMMIT;
