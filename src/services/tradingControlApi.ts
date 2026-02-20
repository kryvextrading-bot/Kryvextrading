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
}

export interface SystemSettings {
  id: string;
  default_outcome: 'win' | 'loss' | 'random';
  win_probability: number;
  spot_default: 'win' | 'loss' | 'random';
  futures_default: 'win' | 'loss' | 'random';
  options_default: 'win' | 'loss' | 'random';
  arbitrage_default: 'win' | 'loss' | 'random';
}

class TradingControlApi {
  async checkTradeOutcome(userId: string, tradeType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_trade_outcome', {
          p_user_id: userId,
          p_trade_type: tradeType
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to check trade outcome:', error);
      return false; // Default to loss on error
    }
  }

  async getUserOutcome(userId: string): Promise<TradeOutcome | null> {
    const { data } = await supabase
      .from('trade_outcomes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return data;
  }

  async getUserWindows(userId: string): Promise<TradeWindow[]> {
    const { data } = await supabase
      .from('trade_windows')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)
      .gte('end_time', new Date().toISOString());
    return data || [];
  }

  async getSystemSettings(): Promise<SystemSettings | null> {
    const { data } = await supabase
      .from('trading_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    return data;
  }
}

export default new TradingControlApi();
