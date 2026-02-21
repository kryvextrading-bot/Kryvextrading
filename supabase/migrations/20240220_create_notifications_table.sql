-- Create notifications table
-- This table stores user notifications for the enhanced notification system

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('system', 'security', 'trading', 'price', 'account', 'marketing', 'referral')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  action_url TEXT,
  action_text VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON public.notifications(timestamp DESC);

-- Create RLS (Row Level Security) policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update read_at timestamp
CREATE OR REPLACE FUNCTION public.mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.notifications 
  SET read_at = NOW(), 
      updated_at = NOW(),
      status = 'read'
  WHERE id = NEW.id AND status = 'unread';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update read_at when status changes to 'read'
CREATE TRIGGER mark_notification_read_trigger
  AFTER UPDATE ON public.notifications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'read')
  EXECUTE FUNCTION public.mark_notification_read();
