// src/services/unified-trading-service.ts
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export type TradeType = 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';

export interface OptionOrder {
  id: string;
  userId: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  expiryPrice?: number;
  profit?: number;
  fee?: number;
  duration: number;
  startTime: string;
  endTime: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  payoutRate: number;
  fluctuationRange: number;
  createdAt: string;
  completedAt?: string;
  pnl?: number;
}

export interface TradeExecutionRequest {
  type: TradeType;
  data: any;
  userId: string;
}

export interface TradeResult {
  success: boolean;
  tradeId?: string;
  error?: string;
  trade?: any;
}

export interface ExpireOptionsResult {
  success: boolean;
  result: 'win' | 'loss';
  profit?: number;
  exitPrice?: number;
  error?: string;
}

// ==================== SERVICE ====================

class UnifiedTradingService {
  private static instance: UnifiedTradingService;

  static getInstance(): UnifiedTradingService {
    if (!UnifiedTradingService.instance) {
      UnifiedTradingService.instance = new UnifiedTradingService();
    }
    return UnifiedTradingService.instance;
  }

  // ==================== OPTIONS TRADING ====================

  async getActiveOptionsOrders(userId: string): Promise<OptionOrder[]> {
    try {
      console.log('🔍 [getActiveOptionsOrders] Fetching for user:', userId);
      
      const { data, error } = await supabase
        .from('options_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [getActiveOptionsOrders] Error:', error);
        return [];
      }

      console.log('✅ [getActiveOptionsOrders] Found:', data?.length || 0, 'orders');
      
      return data?.map(order => ({
        id: order.id,
        userId: order.user_id,
        symbol: order.metadata?.symbol || 'BTCUSDT', // Get symbol from metadata
        direction: order.direction,
        stake: parseFloat(order.stake),
        entryPrice: parseFloat(order.entry_price),
        expiryPrice: order.expiry_price ? parseFloat(order.expiry_price) : undefined,
        profit: order.profit ? parseFloat(order.profit) : undefined,
        fee: parseFloat(order.fee || 0),
        duration: order.duration,
        startTime: order.start_time,
        endTime: order.end_time,
        status: order.status,
        payoutRate: parseFloat(order.payout_rate),
        fluctuationRange: parseFloat(order.fluctuation_range),
        createdAt: order.created_at,
        completedAt: order.completed_at,
        pnl: order.pnl ? parseFloat(order.pnl) : undefined
      })) || [];
    } catch (error) {
      console.error('❌ [getActiveOptionsOrders] Exception:', error);
      return [];
    }
  }

  async getCompletedOptionsOrders(userId: string): Promise<OptionOrder[]> {
    try {
      console.log('🔍 [getCompletedOptionsOrders] Fetching for user:', userId);
      
      const { data, error } = await supabase
        .from('options_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('❌ [getCompletedOptionsOrders] Error:', error);
        return [];
      }

      console.log('✅ [getCompletedOptionsOrders] Found:', data?.length || 0, 'orders');
      
      return data?.map(order => ({
        id: order.id,
        userId: order.user_id,
        symbol: order.metadata?.symbol || 'BTCUSDT', // Get symbol from metadata
        direction: order.direction,
        stake: parseFloat(order.stake),
        entryPrice: parseFloat(order.entry_price),
        expiryPrice: order.expiry_price ? parseFloat(order.expiry_price) : undefined,
        profit: order.profit ? parseFloat(order.profit) : undefined,
        fee: parseFloat(order.fee || 0),
        duration: order.duration,
        startTime: order.start_time,
        endTime: order.end_time,
        status: order.status,
        payoutRate: parseFloat(order.payout_rate),
        fluctuationRange: parseFloat(order.fluctuation_range),
        createdAt: order.created_at,
        completedAt: order.completed_at,
        pnl: order.pnl ? parseFloat(order.pnl) : undefined
      })) || [];
    } catch (error) {
      console.error('❌ [getCompletedOptionsOrders] Exception:', error);
      return [];
    }
  }

  // ==================== OPTIONS EXPIRATION ====================

  async expireOptionsTrade(tradeId: string): Promise<ExpireOptionsResult> {
    try {
      console.log(`⏰ [expireOptionsTrade] Expiring trade:`, { tradeId });

      // Get the option order from database
      const { data: option, error } = await supabase
        .from('options_orders')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error || !option) {
        console.error('❌ [expireOptionsTrade] Option not found:', error);
        return { success: false, result: 'loss', error: 'Option not found' };
      }

      // Determine win/loss outcome
      const wins = await this.determineOptionsOutcome(option.user_id);
      const result = wins ? 'win' : 'loss';

      // Calculate profit/loss
      const stake = parseFloat(option.stake);
      const payoutRate = parseFloat(option.payout_rate) || 1.18;
      const profit = wins ? stake * (payoutRate - 1) : -stake;
      
      console.log('💰 [expireOptionsTrade] Calculation:', { stake, payoutRate, profit, wins });

      // Update option order
      const { error: updateError } = await supabase
        .from('options_orders')
        .update({
          status: 'COMPLETED',
          completed_at: new Date().toISOString(),
          pnl: profit,
          expiry_price: option.entry_price, // Use entry price as expiry price for options
          metadata: {
            ...option.metadata,
            outcome: result,
            settledAt: new Date().toISOString(),
            profit: profit,
            isWin: wins
          }
        })
        .eq('id', tradeId);

      if (updateError) {
        console.error('❌ [expireOptionsTrade] Error updating option:', updateError);
      }

      // Handle balance updates
      if (wins) {
        // Win: Return stake + profit to trading wallet
        const totalReturn = stake + profit;
        
        const { data: currentBalance } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', option.user_id)
          .eq('asset', 'USDT_TRADING')
          .maybeSingle();

        if (currentBalance) {
          const newAvailable = parseFloat(currentBalance.available) + totalReturn;
          const newLocked = parseFloat(currentBalance.locked) - stake;
          
          await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailable,
              locked: Math.max(0, newLocked),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', option.user_id)
            .eq('asset', 'USDT_TRADING');
        }
      } else {
        // Loss: Release locked funds
        const { data: currentBalance } = await supabase
          .from('wallet_balances')
          .select('locked')
          .eq('user_id', option.user_id)
          .eq('asset', 'USDT_TRADING')
          .maybeSingle();

        if (currentBalance) {
          const newLocked = parseFloat(currentBalance.locked) - stake;
          
          await supabase
            .from('wallet_balances')
            .update({ 
              locked: Math.max(0, newLocked),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', option.user_id)
            .eq('asset', 'USDT_TRADING');
        }
      }

      // Release the trading lock
      await supabase
        .from('trading_locks')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('reference_id', tradeId);

      return { 
        success: true, 
        result, 
        profit,
        exitPrice: parseFloat(option.entry_price)
      };

    } catch (error) {
      console.error('❌ [expireOptionsTrade] Error:', error);
      return { 
        success: false, 
        result: 'loss', 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async determineOptionsOutcome(userId: string): Promise<boolean> {
    try {
      console.log(`🔍 [determineOptionsOutcome] Checking for user: ${userId}`);
      
      // Check active_trade_outcomes first (most specific)
      const { data: activeOutcome, error: activeError } = await supabase
        .from('active_trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (activeError) {
        console.error('❌ [determineOptionsOutcome] Error fetching active outcome:', activeError);
      }

      if (activeOutcome && activeOutcome.options_enabled) {
        console.log('✅ [determineOptionsOutcome] Found active outcome:', activeOutcome);
        return activeOutcome.outcome_type === 'win';
      }

      // Check all_trade_outcomes
      const { data: userOutcome, error: outcomeError } = await supabase
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (outcomeError) {
        console.error('❌ [determineOptionsOutcome] Error fetching user outcome:', outcomeError);
      }

      if (userOutcome && userOutcome.enabled && userOutcome.options_enabled) {
        console.log('✅ [determineOptionsOutcome] Found user outcome:', userOutcome);
        return userOutcome.outcome_type === 'win';
      }

      // Check trade_windows
      const { data: activeWindows, error: windowsError } = await supabase
        .from('trade_windows')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .maybeSingle();

      if (windowsError) {
        console.error('❌ [determineOptionsOutcome] Error fetching windows:', windowsError);
      }

      if (activeWindows && activeWindows.options_enabled) {
        console.log('✅ [determineOptionsOutcome] Found active window:', activeWindows);
        return activeWindows.outcome_type === 'win';
      }

      // Default to loss
      console.log('ℹ️ [determineOptionsOutcome] No outcome settings, defaulting to loss');
      return false;
      
    } catch (error) {
      console.error('❌ [determineOptionsOutcome] Error:', error);
      return false;
    }
  }

  // ==================== TRADE EXECUTION ====================

  async executeTrade(request: TradeExecutionRequest): Promise<TradeResult> {
    const { type, data, userId } = request;
    const tradeId = uuidv4();

    console.log(`🚀 [executeTrade] Executing:`, { type, data, userId, tradeId });

    try {
      // Lock funds first
      const lockResult = await this.lockFunds(userId, tradeId, type, data);
      if (!lockResult.success) {
        return {
          success: false,
          tradeId,
          error: lockResult.error
        };
      }

      // Create option order
      if (type === 'options') {
        const now = new Date().toISOString();
        const endTime = new Date(Date.now() + (data.duration || 60) * 1000).toISOString();
        
        const optionOrder = {
          id: tradeId,
          user_id: userId,
          pair_id: 'f1114850-177b-48a7-8298-c7cbb5d75466', // You'll need to get this from trading_pairs
          direction: data.direction || 'UP',
          stake: data.amount,
          entry_price: data.entryPrice || data.price || 67000,
          profit: data.amount * (data.payoutRate ? data.payoutRate - 1 : 0.176),
          fee: data.amount * 0.001,
          duration: data.duration || 60,
          start_time: now,
          end_time: endTime,
          fluctuation_range: data.fluctuation || 0.01,
          payout_rate: data.payoutRate || 1.18,
          status: 'ACTIVE',
          metadata: {
            createdAt: now,
            symbol: data.symbol || 'BTCUSDT',
            direction: data.direction || 'UP'
          }
        };

        const { error: insertError } = await supabase
          .from('options_orders')
          .insert(optionOrder);

        if (insertError) {
          console.error('❌ [executeTrade] Error inserting option:', insertError);
          throw insertError;
        }

        console.log('✅ [executeTrade] Option created:', tradeId);
      }

      return {
        success: true,
        tradeId,
        trade: { id: tradeId }
      };

    } catch (error) {
      console.error('❌ [executeTrade] Error:', error);
      
      // Unlock funds on failure
      await supabase
        .from('trading_locks')
        .update({ status: 'expired', released_at: new Date().toISOString() })
        .eq('reference_id', tradeId);
      
      return {
        success: false,
        tradeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== FUNDS LOCKING ====================

  private async lockFunds(userId: string, referenceId: string, type: TradeType, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      const amount = data.amount || data.premium || 0;
      
      if (!amount || amount <= 0) {
        return { success: false, error: `Invalid amount: ${amount}` };
      }

      // Check available balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('available, locked')
        .eq('user_id', userId)
        .eq('asset', 'USDT_TRADING')
        .maybeSingle();

      if (walletError || !wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      const availableBalance = parseFloat(wallet.available || 0);
      
      if (availableBalance < amount) {
        return { 
          success: false, 
          error: `Insufficient balance. Available: ${availableBalance}, Required: ${amount}` 
        };
      }

      // Create lock record
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      
      const lockData = {
        id: uuidv4(),
        user_id: userId,
        asset: 'USDT',
        amount,
        lock_type: type,
        reference_id: referenceId,
        status: 'locked',
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('trading_locks')
        .insert(lockData);

      if (insertError) {
        console.error('❌ [lockFunds] Error creating lock:', insertError);
        return { success: false, error: 'Failed to lock funds' };
      }

      // Update wallet balance
      const newLocked = parseFloat(wallet.locked || 0) + amount;
      const newAvailable = availableBalance - amount;

      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({ 
          available: newAvailable,
          locked: newLocked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset', 'USDT_TRADING');

      if (updateError) {
        console.error('❌ [lockFunds] Error updating wallet:', updateError);
        return { success: false, error: 'Failed to update wallet' };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [lockFunds] Exception:', error);
      return { success: false, error: 'Lock funds failed' };
    }
  }
}

export const unifiedTradingService = UnifiedTradingService.getInstance();
