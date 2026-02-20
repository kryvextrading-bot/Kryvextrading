import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface SubscriptionConfig {
  table: string;
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  callback: (payload: any) => void;
}

export class AdminRealtime {
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, SubscriptionConfig[]> = new Map();

  subscribe(config: SubscriptionConfig): string {
    const channelId = `${config.table}_${config.event}_${Date.now()}`;
    
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: config.event,
          schema: 'public',
          table: config.table,
          filter: config.filter
        },
        (payload) => {
          console.log(`[Realtime] ${config.table} ${config.event}:`, payload);
          config.callback(payload);
        }
      )
      .subscribe();

    this.channels.set(channelId, channel);
    
    const subs = this.subscriptions.get(config.table) || [];
    subs.push(config);
    this.subscriptions.set(config.table, subs);

    return channelId;
  }

  unsubscribe(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelId);
    }
  }

  unsubscribeAll(): void {
    this.channels.forEach(channel => channel.unsubscribe());
    this.channels.clear();
    this.subscriptions.clear();
  }

  getSubscriptions(table?: string): SubscriptionConfig[] {
    if (table) {
      return this.subscriptions.get(table) || [];
    }
    return Array.from(this.subscriptions.values()).flat();
  }
}
