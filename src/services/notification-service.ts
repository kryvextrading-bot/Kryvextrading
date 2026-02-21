import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'system' | 'security' | 'trading' | 'price' | 'account' | 'marketing' | 'referral' | 
        'deposit' | 'withdrawal' | 'convert' | 'send' | 'transfer' | 'trade_win' | 'trade_loss';
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  action_url?: string;
  action_text?: string;
  metadata: {
    icon?: string;
    color?: string;
    transaction_id?: string;
    amount?: number;
    currency?: string;
    from_user?: string;
    to_user?: string;
    profit_loss?: number;
    [key: string]: any;
  };
  created_at: string;
  read_at?: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  trading_alerts: boolean;
  price_alerts: boolean;
  security_alerts: boolean;
  marketing_emails: boolean;
  system_updates: boolean;
  sound_enabled: boolean;
  desktop_notifications: boolean;
  mobile_notifications: boolean;
}

export const notificationService = {
  // Get user notifications with filters
  async getUserNotifications(
    userId: string, 
    options?: {
      limit?: number;
      status?: 'unread' | 'read' | 'all';
      type?: string[];
      priority?: string[];
    }
  ) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options?.type && options.type.length > 0) {
      query = query.in('type', options.type);
    }

    if (options?.priority && options.priority.length > 0) {
      query = query.in('priority', options.priority);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    return { data: data as Notification[], error };
  },

  // Get unread count
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread');

    return { count: count || 0, error };
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    return { data, error };
  },

  // Mark all as read
  async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        status: 'read', 
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'unread');

    return { data, error };
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return { error };
  },

  // Clear all notifications
  async clearAllNotifications(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    return { error };
  },

  // Get notification settings
  async getNotificationSettings(userId: string) {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { data: data as NotificationSettings, error };
  },

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>) {
    const { data, error } = await supabase
      .from('notification_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Create a notification (for system use)
  async createNotification(notification: {
    user_id: string;
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
    action_url?: string;
    action_text?: string;
    metadata?: Record<string, any>;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        status: 'unread',
        priority: notification.priority || 'medium',
        metadata: notification.metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return { data, error };
  },

  // Subscribe to real-time notifications
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}` 
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
};
