import { supabase } from '@/lib/supabase';

export interface TradeOutcome {
  id: string;
  user_id: string;
  enabled: boolean;
  outcome_type: 'win' | 'loss' | 'default';
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeWindow {
  id: string;
  user_id: string;
  outcome_type: 'win' | 'loss' | 'default';
  start_time: string;
  end_time: string;
  spot_enabled: boolean;
  futures_enabled: boolean;
  options_enabled: boolean;
  arbitrage_enabled: boolean;
  reason?: string;
  active: boolean;
  created_at: string;
}

export interface TradingSettings {
  id: string;
  default_outcome: 'win' | 'loss' | 'random';
  win_probability: number;
  spot_default: 'win' | 'loss' | 'random';
  futures_default: 'win' | 'loss' | 'random';
  options_default: 'win' | 'loss' | 'random';
  arbitrage_default: 'win' | 'loss' | 'random';
  updated_at: string;
}

export interface TradingAdminAudit {
  id: string;
  admin_id: string;
  admin_email?: string;
  action: string;
  user_id?: string;
  user_email?: string;
  details: any;
  created_at: string;
}

export interface UserWithTrading {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  created_at: string;
  trade_outcome?: TradeOutcome;
  active_windows?: TradeWindow[];
}

class TradingAdminApi {
  // ==================== USER MANAGEMENT ====================

  async getUsers(): Promise<UserWithTrading[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      // Get trade outcomes for all users
      let outcomes = [];
      try {
        const { data: outcomesData, error: outcomesError } = await supabase
          .from('trade_outcomes')
          .select('*');
        if (!outcomesError) {
          outcomes = outcomesData || [];
        }
      } catch (error) {
        console.log('Trade outcomes table may not exist yet');
      }

      // Get active trade windows
      let windows = [];
      try {
        const { data: windowsData, error: windowsError } = await supabase
          .from('trade_windows')
          .select('*')
          .eq('active', true)
          .gte('end_time', new Date().toISOString());
        if (!windowsError) {
          windows = windowsData || [];
        }
      } catch (error) {
        console.log('Trade windows table may not exist yet');
      }

      // Merge data
      return users.map(user => ({
        ...user,
        trade_outcome: outcomes?.find(o => o.user_id === user.id),
        active_windows: windows?.filter(w => w.user_id === user.id) || []
      }));
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  // ==================== TRADE OUTCOME MANAGEMENT ====================

  async setUserTradeOutcome(
    userId: string,
    outcomeType: 'win' | 'loss' | 'default',
    enabled: boolean = true,
    options: {
      spot?: boolean;
      futures?: boolean;
      options?: boolean;
      arbitrage?: boolean;
    } = {}
  ): Promise<TradeOutcome> {
    const { data: existing } = await supabase
      .from('trade_outcomes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const outcomeData = {
      user_id: userId,
      outcome_type: outcomeType,
      enabled,
      spot_enabled: options.spot ?? true,
      futures_enabled: options.futures ?? true,
      options_enabled: options.options ?? true,
      arbitrage_enabled: options.arbitrage ?? true,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .update(outcomeData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .insert({
          ...outcomeData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'set_trade_outcome',
      p_user_id: userId,
      p_details: { outcomeType, enabled, options }
    });

    return result;
  }

  async clearUserTradeOutcome(userId: string): Promise<void> {
    const { error } = await supabase
      .from('trade_outcomes')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'clear_trade_outcome',
      p_user_id: userId
    });
  }

  // ==================== TRADE WINDOW MANAGEMENT ====================

  async createTradeWindow(
    userId: string,
    outcomeType: 'win' | 'loss' | 'default',
    startTime: string,
    endTime: string,
    options: {
      spot?: boolean;
      futures?: boolean;
      options?: boolean;
      arbitrage?: boolean;
      reason?: string;
    } = {}
  ): Promise<TradeWindow> {
    const { data, error } = await supabase
      .from('trade_windows')
      .insert({
        user_id: userId,
        outcome_type: outcomeType,
        start_time: startTime,
        end_time: endTime,
        spot_enabled: options.spot ?? true,
        futures_enabled: options.futures ?? true,
        options_enabled: options.options ?? true,
        arbitrage_enabled: options.arbitrage ?? true,
        reason: options.reason,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'create_trade_window',
      p_user_id: userId,
      p_details: { outcomeType, startTime, endTime, options }
    });

    return data;
  }

  async updateTradeWindow(
    windowId: string,
    updates: Partial<TradeWindow>
  ): Promise<TradeWindow> {
    const { data, error } = await supabase
      .from('trade_windows')
      .update(updates)
      .eq('id', windowId)
      .select()
      .single();

    if (error) throw error;

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'update_trade_window',
      p_user_id: data.user_id,
      p_details: { windowId, updates }
    });

    return data;
  }

  async cancelTradeWindow(windowId: string): Promise<void> {
    const { error } = await supabase
      .from('trade_windows')
      .update({ active: false })
      .eq('id', windowId);

    if (error) throw error;

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser();

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'cancel_trade_window',
      p_details: { windowId }
    });
  }

  async getUserActiveWindows(userId: string): Promise<TradeWindow[]> {
    const { data, error } = await supabase
      .from('trade_windows')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ==================== SYSTEM SETTINGS ====================

  async getTradingSettings(): Promise<TradingSettings> {
    try {
      const { data, error } = await supabase
        .from('trading_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code === 'PGRST116') {
        // No settings found, create default
        return this.updateTradingSettings({
          default_outcome: 'loss',
          win_probability: 30,
          spot_default: 'loss',
          futures_default: 'loss',
          options_default: 'loss',
          arbitrage_default: 'loss'
        });
      }

      if (error) {
        console.error('Error fetching trading settings:', error);
        // Return default settings if table doesn't exist
        return {
          id: 'default',
          default_outcome: 'loss',
          win_probability: 30,
          spot_default: 'loss',
          futures_default: 'loss',
          options_default: 'loss',
          arbitrage_default: 'loss',
          updated_at: new Date().toISOString()
        };
      }
      
      return data;
    } catch (error) {
      console.error('Failed to get trading settings:', error);
      // Return default settings
      return {
        id: 'default',
        default_outcome: 'loss',
        win_probability: 30,
        spot_default: 'loss',
        futures_default: 'loss',
        options_default: 'loss',
        arbitrage_default: 'loss',
        updated_at: new Date().toISOString()
      };
    }
  }

  async updateTradingSettings(settings: Partial<TradingSettings>): Promise<TradingSettings> {
    const { data: existing } = await supabase
      .from('trading_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    const { data: { user } } = await supabase.auth.getUser();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('trading_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('trading_settings')
        .insert({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Log action
    await supabase.rpc('log_trading_admin_action', {
      p_admin_id: user?.id,
      p_action: 'update_trading_settings',
      p_details: settings
    });

    return result;
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogs(limit: number = 100): Promise<TradingAdminAudit[]> {
    try {
      const { data, error } = await supabase
        .from('trading_admin_audit')
        .select(`
          *,
          admin:admin_id (email),
          user:user_id (email)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching audit logs:', error);
        return [];
      }

      return (data || []).map(log => ({
        ...log,
        admin_email: log.admin?.email,
        user_email: log.user?.email
      }));
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToUserChanges(callback: (payload: any) => void) {
    try {
      return supabase
        .channel('trading-admin-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trade_outcomes' },
          callback
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trade_windows' },
          callback
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up subscription:', error);
      // Return a mock subscription that won't crash
      return {
        unsubscribe: () => {}
      };
    }
  }
}

export const tradingAdminApi = new TradingAdminApi();
