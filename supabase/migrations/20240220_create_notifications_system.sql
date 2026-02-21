-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'system', 'security', 'trading', 'price', 'account', 
    'marketing', 'referral', 'deposit', 'withdrawal', 
    'convert', 'send', 'transfer', 'trade_win', 'trade_loss'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  action_url TEXT,
  action_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  trading_alerts BOOLEAN DEFAULT true,
  price_alerts BOOLEAN DEFAULT false,
  security_alerts BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  system_updates BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT true,
  mobile_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to auto-create notification settings for new users
CREATE OR REPLACE FUNCTION create_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new users
DROP TRIGGER IF EXISTS create_notification_settings_trigger ON users;
CREATE TRIGGER create_notification_settings_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notification_settings();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own notification settings" ON public.notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to automatically generate notifications for transactions table
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  notification_priority TEXT;
BEGIN
  -- Determine notification type and message based on transaction type
  CASE NEW.type
    WHEN 'Deposit' THEN
      notification_type := 'deposit';
      notification_title := 'Deposit Confirmed';
      notification_message := format('Your deposit of %s %s has been confirmed.', NEW.amount, NEW.asset);
      notification_priority := 'medium';
    WHEN 'Withdrawal' THEN
      notification_type := 'withdrawal';
      notification_title := 'Withdrawal Processed';
      notification_message := format('Your withdrawal of %s %s has been processed.', NEW.amount, NEW.asset);
      notification_priority := 'high';
    WHEN 'Buy' THEN
      notification_type := 'trading';
      notification_title := 'Purchase Completed';
      notification_message := format('Your purchase of %s %s has been completed.', NEW.amount, NEW.asset);
      notification_priority := 'medium';
    WHEN 'Sell' THEN
      notification_type := 'trading';
      notification_title := 'Sale Completed';
      notification_message := format('Your sale of %s %s has been completed.', NEW.amount, NEW.asset);
      notification_priority := 'medium';
    WHEN 'Trade' THEN
      notification_type := 'trading';
      notification_title := 'Trade Executed';
      notification_message := format('Your trade of %s %s has been executed.', NEW.amount, NEW.asset);
      notification_priority := 'medium';
    ELSE
      RETURN NEW;
  END CASE;

  -- Insert notification for user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_priority,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'currency', NEW.asset,
      'type', NEW.type,
      'status', NEW.status,
      'price', NEW.price,
      'fee', NEW.fee
    ),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically generate notifications for wallet transactions
CREATE OR REPLACE FUNCTION create_wallet_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
  notification_priority TEXT;
BEGIN
  -- Determine notification type and message based on transaction type
  CASE NEW.type
    WHEN 'deposit' THEN
      notification_type := 'deposit';
      notification_title := 'Deposit Confirmed';
      notification_message := format('Your deposit of %s %s has been confirmed.', NEW.amount, NEW.currency);
      notification_priority := 'medium';
    WHEN 'withdrawal' THEN
      notification_type := 'withdrawal';
      notification_title := 'Withdrawal Processed';
      notification_message := format('Your withdrawal of %s %s has been processed.', NEW.amount, NEW.currency);
      notification_priority := 'high';
    WHEN 'transfer' THEN
      notification_type := 'transfer';
      notification_title := 'Transfer Complete';
      notification_message := format('Transferred %s %s successfully.', NEW.amount, NEW.currency);
      notification_priority := 'medium';
    WHEN 'profit' THEN
      notification_type := 'trade_win';
      notification_title := 'Trade Profit! 🎉';
      notification_message := format('Your trade earned %s %s profit.', NEW.amount, NEW.currency);
      notification_priority := 'high';
    WHEN 'loss' THEN
      notification_type := 'trade_loss';
      notification_title := 'Trade Loss';
      notification_message := format('Your trade resulted in %s %s loss.', NEW.amount, NEW.currency);
      notification_priority := 'medium';
    WHEN 'fee' THEN
      notification_type := 'system';
      notification_title := 'Fee Charged';
      notification_message := format('A fee of %s %s has been charged.', NEW.amount, NEW.currency);
      notification_priority := 'low';
    ELSE
      -- For freeze, unfreeze, lock, release types
      notification_type := 'system';
      notification_title := 'Account Update';
      notification_message := format('Your account has been updated: %s', NEW.type);
      notification_priority := 'medium';
  END CASE;

  -- Insert notification for user
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    created_at
  ) VALUES (
    NEW.user_id,
    notification_type,
    notification_title,
    notification_message,
    notification_priority,
    jsonb_build_object(
      'transaction_id', NEW.id,
      'amount', NEW.amount,
      'currency', NEW.currency,
      'type', NEW.type,
      'balance_before', NEW.balance_before,
      'balance_after', NEW.balance_after,
      'reference_id', NEW.reference_id
    ),
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sample notifications for existing users (for testing)
INSERT INTO public.notifications (user_id, type, title, message, status, priority, metadata, created_at)
SELECT 
  u.id,
  'welcome'::text,
  'Welcome to Kryvex Trading! 🚀',
  'Your account has been successfully created. Start exploring our advanced trading features.',
  'unread',
  'medium',
  '{"icon": "🎉", "color": "green"}'::jsonb,
  now() - interval '1 day'
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.user_id = u.id AND n.type = 'welcome'
);

-- Create triggers for both transaction tables
DROP TRIGGER IF EXISTS transaction_notification_trigger ON transactions;
CREATE TRIGGER transaction_notification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

DROP TRIGGER IF EXISTS wallet_transaction_notification_trigger ON wallet_transactions;
CREATE TRIGGER wallet_transaction_notification_trigger
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_transaction_notification();

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_settings TO authenticated;
GRANT SELECT ON public.notifications TO anon;
