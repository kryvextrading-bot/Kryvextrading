import { supabase } from '@/lib/supabase';
import { PriceCacheService } from './price-cache-service';
import { unifiedWalletService } from './unified-wallet-service';
import { TradingControlService } from './trading-control-service-new';

export interface CreateOptionOrderDTO {
  userId: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  duration: number; // in seconds
  fluctuationRange: number;
  payoutRate: number;
  entryPrice: number;
  scheduledTime?: Date; // optional, for scheduled trades
}

export interface ScheduleOptionTradeDTO {
  userId: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  duration: number;
  fluctuationRange: number;
  payoutRate: number;
  scheduledTime: Date; // UTC+0
}

export interface OptionOrder {
  id: string;
  userId: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  expiryPrice: number | null;
  profit: number;
  fee: number;
  duration: number;
  fluctuationRange: number;
  payoutRate: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pnl: number | null;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  completedAt: Date | null;
}

export interface ScheduledOptionTrade {
  id: string;
  userId: string;
  pairId: string;
  direction: string;
  stake: number;
  duration: number;
  fluctuationRange: number;
  payoutRate: number;
  scheduledTime: Date;
  status: string;
  executedOrderId?: string;
  failureReason?: string;
  createdAt: Date;
  executedAt?: Date;
}

export class OptionsTradingService {
  private static instance: OptionsTradingService;
  private priceCache: PriceCacheService;
  private walletService: typeof unifiedWalletService;
  private tradingControl: TradingControlService;

  private constructor() {
    this.priceCache = PriceCacheService.getInstance();
    this.walletService = unifiedWalletService;
    this.tradingControl = TradingControlService.getInstance();
  }

  static getInstance(): OptionsTradingService {
    if (!OptionsTradingService.instance) {
      OptionsTradingService.instance = new OptionsTradingService();
    }
    return OptionsTradingService.instance;
  }

  /**
   * Create and execute an option order immediately
   */
  async createOptionOrder(dto: CreateOptionOrderDTO): Promise<OptionOrder> {
    const { userId, pairId, direction, stake, duration, fluctuationRange, payoutRate, entryPrice } = dto;

    // Validate user balance
    const balance = await this.walletService.getBalance(userId, 'USDT');
    const totalRequired = stake + (stake * 0.001); // Include fee
    if (balance < totalRequired) {
      throw new Error(`Insufficient balance. Required: $${totalRequired.toFixed(2)} USDT`);
    }

    // Check if user should win based on trading windows
    const shouldWin = await this.tradingControl.shouldUserWin(userId, 'options');

    // Calculate profit (if win) or loss
    const profit = shouldWin ? stake * payoutRate : 0;
    const fee = stake * 0.001; // 0.1% fee

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 1000);

    // Create order in database
    const { data: order, error } = await supabase
      .from('options_orders')
      .insert({
        user_id: userId,
        pair_id: pairId,
        direction,
        stake,
        entry_price: entryPrice,
        profit,
        fee,
        duration,
        fluctuation_range: fluctuationRange,
        payout_rate: payoutRate,
        status: 'ACTIVE',
        start_time: now.toISOString(),
        end_time: endTime.toISOString(),
        metadata: {
          shouldWin,
          createdAt: now.toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating option order:', error);
      throw new Error('Failed to create option order');
    }

    // Lock funds in wallet
    await this.walletService.lockBalance({
      userId,
      asset: 'USDT',
      amount: stake + fee,
      reference: order.id,
      type: 'lock',
      metadata: { orderId: order.id }
    });

    return this.mapToOrder(order);
  }

  /**
   * Schedule an option trade for future execution
   */
  async scheduleOptionTrade(dto: ScheduleOptionTradeDTO): Promise<ScheduledOptionTrade> {
    const { userId, pairId, direction, stake, duration, fluctuationRange, payoutRate, scheduledTime } = dto;

    // Validate scheduled time
    const now = new Date();
    const minExecutionTime = new Date(now.getTime() + 5000); // 5 second buffer
    
    if (scheduledTime <= minExecutionTime) {
      throw new Error('Scheduled time must be at least 5 seconds in the future');
    }

    if (scheduledTime > new Date(now.getTime() + 24 * 60 * 60 * 1000)) {
      throw new Error('Scheduled time cannot be more than 24 hours in the future');
    }

    // Validate user balance
    const balance = await this.walletService.getBalance(userId, 'USDT');
    const totalRequired = stake + (stake * 0.001);
    if (balance < totalRequired) {
      throw new Error(`Insufficient balance. Required: $${totalRequired.toFixed(2)} USDT`);
    }

    // Create scheduled trade
    const { data: scheduledTrade, error } = await supabase
      .from('scheduled_options_trades')
      .insert({
        user_id: userId,
        pair_id: pairId,
        direction,
        stake,
        duration,
        fluctuation_range: fluctuationRange,
        payout_rate: payoutRate,
        scheduled_time: scheduledTime.toISOString(),
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('Error scheduling option trade:', error);
      throw new Error('Failed to schedule option trade');
    }

    // Lock funds immediately (they'll be used at execution)
    await this.walletService.lockBalance({
      userId,
      asset: 'USDT',
      amount: stake + (stake * 0.001),
      reference: scheduledTrade.id,
      type: 'lock',
      metadata: { scheduledTradeId: scheduledTrade.id }
    });

    return this.mapToScheduledTrade(scheduledTrade);
  }

  /**
   * Cancel a scheduled trade before execution
   */
  async cancelScheduledTrade(tradeId: string, userId: string): Promise<void> {
    const { data: trade, error } = await supabase
      .from('scheduled_options_trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .single();

    if (error || !trade) {
      throw new Error('Scheduled trade not found or already executed');
    }

    // Update status
    const { error: updateError } = await supabase
      .from('scheduled_options_trades')
      .update({ status: 'CANCELLED' })
      .eq('id', tradeId);

    if (updateError) {
      throw new Error('Failed to cancel scheduled trade');
    }

    // Release locked funds
    await this.walletService.unlockBalance({
      userId,
      asset: 'USDT',
      amount: 0,
      reference: tradeId,
      type: 'unlock'
    });
  }

  /**
   * Get user's active options
   */
  async getUserActiveOptions(userId: string): Promise<OptionOrder[]> {
    const { data: orders, error } = await supabase
      .from('options_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .order('end_time', { ascending: true });

    if (error) {
      console.error('Error fetching active options:', error);
      return [];
    }

    return orders.map(this.mapToOrder);
  }

  /**
   * Get user's completed options
   */
  async getUserCompletedOptions(userId: string, limit: number = 50): Promise<OptionOrder[]> {
    const { data: orders, error } = await supabase
      .from('options_orders')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching completed options:', error);
      return [];
    }

    return orders.map(this.mapToOrder);
  }

  /**
   * Get user's scheduled trades
   */
  async getUserScheduledTrades(userId: string): Promise<ScheduledOptionTrade[]> {
    const { data: trades, error } = await supabase
      .from('scheduled_options_trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'PENDING')
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled trades:', error);
      return [];
    }

    return trades.map(this.mapToScheduledTrade);
  }

  /**
   * Execute scheduled trades (called by cron job every second)
   */
  async executeScheduledTrades(): Promise<void> {
    const now = new Date().toISOString();
    
    // Find all pending scheduled trades that are due
    const { data: pendingTrades, error } = await supabase
      .from('scheduled_options_trades')
      .select(`
        *,
        trading_pairs!inner(
          id,
          symbol,
          base_asset,
          quote_asset
        )
      `)
      .eq('status', 'PENDING')
      .lte('scheduled_time', now);

    if (error) {
      console.error('Error fetching pending scheduled trades:', error);
      return;
    }

    for (const trade of pendingTrades) {
      try {
        // Get current price for the pair
        const currentPrice = await this.priceCache.getLastPrice(trade.pair_id);
        
        if (!currentPrice) {
          throw new Error('Unable to get current price');
        }

        // Check if user still has sufficient balance
        const balance = await this.walletService.getBalance(trade.user_id, 'USDT');
        const totalRequired = trade.stake + (trade.stake * 0.001);
        
        if (balance < totalRequired) {
          // Cancel trade and release funds
          await supabase
            .from('scheduled_options_trades')
            .update({ 
              status: 'FAILED',
              failure_reason: 'Insufficient balance at execution time'
            })
            .eq('id', trade.id);
          
          await this.walletService.unlockBalance({
            userId: trade.user_id,
            asset: 'USDT',
            amount: 0,
            reference: trade.id,
            type: 'unlock'
          });
          continue;
        }

        // Execute the trade
        const order = await this.createOptionOrder({
          userId: trade.user_id,
          pairId: trade.pair_id,
          direction: trade.direction as 'UP' | 'DOWN',
          stake: Number(trade.stake),
          duration: trade.duration,
          fluctuationRange: Number(trade.fluctuation_range),
          payoutRate: Number(trade.payout_rate),
          entryPrice: currentPrice
        });

        // Update scheduled trade status
        await supabase
          .from('scheduled_options_trades')
          .update({
            status: 'EXECUTED',
            executed_order_id: order.id,
            executed_at: new Date().toISOString()
          })
          .eq('id', trade.id);

        // Funds are now locked in the active order
        console.log(`Executed scheduled trade ${trade.id} for user ${trade.user_id}`);

      } catch (error: any) {
        console.error(`Failed to execute scheduled trade ${trade.id}:`, error);
        
        // Mark as failed but keep funds locked? Or release?
        await supabase
          .from('scheduled_options_trades')
          .update({
            status: 'FAILED',
            failure_reason: error.message
          })
          .eq('id', trade.id);
        
        // Release locked funds on failure
        await this.walletService.unlockBalance(trade.id);
      }
    }
  }

  /**
   * Check for expired options and settle them
   */
  async checkExpiredOptions(): Promise<void> {
    const now = new Date().toISOString();
    
    // Find all active options that have expired
    const { data: expiredOrders, error } = await supabase
      .from('options_orders')
      .select(`
        *,
        trading_pairs!inner(
          id,
          symbol,
          base_asset,
          quote_asset
        )
      `)
      .eq('status', 'ACTIVE')
      .lte('end_time', now);

    if (error) {
      console.error('Error fetching expired options:', error);
      return;
    }

    for (const order of expiredOrders) {
      try {
        await this.settleOption(order.id);
      } catch (error) {
        console.error(`Failed to settle option ${order.id}:`, error);
      }
    }
  }

  /**
   * Settle a single option at expiration
   */
  private async settleOption(orderId: string): Promise<void> {
    const { data: order, error } = await supabase
      .from('options_orders')
      .select(`
        *,
        trading_pairs!inner(
          id,
          symbol,
          base_asset,
          quote_asset
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order || order.status !== 'ACTIVE') {
      return;
    }

    // Get price at exact end time from cache
    const closePrice = await this.priceCache.getPriceAt(
      order.pair_id,
      new Date(order.end_time)
    );

    if (!closePrice) {
      // Fallback to last known price
      const lastPrice = await this.priceCache.getLastPrice(order.pair_id);
      if (!lastPrice) {
        throw new Error('Unable to determine settlement price');
      }
    }

    // Determine win/loss
    const entryPrice = Number(order.entry_price);
    const win = order.direction === 'UP' 
      ? closePrice > entryPrice
      : closePrice < entryPrice;

    // Calculate PnL
    const stake = Number(order.stake);
    const profit = win ? stake * Number(order.payout_rate) : 0;
    const pnl = win ? profit : -stake;

    // Update order
    const { error: updateError } = await supabase
      .from('options_orders')
      .update({
        status: 'COMPLETED',
        expiry_price: closePrice,
        pnl,
        completed_at: new Date().toISOString(),
        metadata: {
          ...order.metadata,
          closePrice,
          win,
          settledAt: new Date().toISOString()
        }
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error('Failed to update settled option');
    }

    // Unlock and credit funds
    await this.walletService.unlockBalance({
      userId: order.user_id,
      asset: 'USDT',
      amount: 0,
      reference: orderId,
      type: 'unlock'
    });
    
    if (win) {
      // Credit winnings + original stake
      const creditAmount = stake + profit;
      await this.walletService.addBalance({
        userId: order.user_id,
        asset: 'USDT',
        amount: creditAmount,
        reference: orderId,
        type: 'profit',
        metadata: { optionWin: true, orderId }
      });
    } else {
      // Loss - funds already deducted, no credit
      console.log(`Option loss: ${orderId}, stake: ${stake}`);
    }
  }

  /**
   * Map database record to OptionOrder type
   */
  private mapToOrder(record: any): OptionOrder {
    return {
      id: record.id,
      userId: record.user_id,
      pairId: record.pair_id,
      direction: record.direction,
      stake: Number(record.stake),
      entryPrice: Number(record.entry_price),
      expiryPrice: record.expiry_price ? Number(record.expiry_price) : null,
      profit: Number(record.profit),
      fee: Number(record.fee),
      duration: record.duration,
      fluctuationRange: Number(record.fluctuation_range),
      payoutRate: Number(record.payout_rate),
      status: record.status,
      pnl: record.pnl ? Number(record.pnl) : null,
      startTime: new Date(record.start_time),
      endTime: new Date(record.end_time),
      createdAt: new Date(record.created_at),
      completedAt: record.completed_at ? new Date(record.completed_at) : null
    };
  }

  /**
   * Map database record to ScheduledOptionTrade type
   */
  private mapToScheduledTrade(record: any): ScheduledOptionTrade {
    return {
      id: record.id,
      userId: record.user_id,
      pairId: record.pair_id,
      direction: record.direction,
      stake: Number(record.stake),
      duration: record.duration,
      fluctuationRange: Number(record.fluctuation_range),
      payoutRate: Number(record.payout_rate),
      scheduledTime: new Date(record.scheduled_time),
      status: record.status,
      executedOrderId: record.executed_order_id,
      failureReason: record.failure_reason,
      createdAt: new Date(record.created_at),
      executedAt: record.executed_at ? new Date(record.executed_at) : undefined
    };
  }
}
