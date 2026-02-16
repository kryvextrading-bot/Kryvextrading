import { supabase } from '@/lib/supabase';
import { 
  Order, 
  Transaction, 
  Position, 
  TradeExecution,
  BalanceUpdate 
} from '@/types/trading';
import { OrderSide, OrderType, PositionType } from '@/constants/trading';
import { v4 as uuidv4 } from 'uuid';
import { tradingControlService } from './tradingControlService';

class TradingService {
  // ==================== SPOT TRADING ====================
  
  async createSpotOrder(params: {
    userId: string;
    pair: string;
    side: OrderSide;
    type: OrderType;
    amount: number;
    price: number;
    total: number;
    metadata?: Record<string, any>;
  }): Promise<Order> {
    const orderId = uuidv4();
    
    const order: Order = {
      id: orderId,
      userId: params.userId,
      pair: params.pair,
      type: params.type,
      side: params.side,
      amount: params.amount,
      price: params.price,
      total: params.total,
      filled: 0,
      remaining: params.amount,
      status: params.type === 'market' ? 'filled' : 'open',
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('orders')
      .insert(order);

    if (error) throw error;

    return order;
  }

  // ==================== FUTURES TRADING ====================
  
  async openFuturesPosition(params: {
    userId: string;
    pair: string;
    side: OrderSide;
    type: PositionType;
    orderType: OrderType;
    amount: number;
    price: number;
    leverage: number;
    margin: number;
    takeProfit?: number;
    stopLoss?: number;
    metadata?: Record<string, any>;
  }): Promise<Position & { order: Order }> {
    const positionId = uuidv4();
    const orderId = uuidv4();

    // Calculate liquidation price
    const liquidationPrice = this.calculateLiquidationPrice({
      entryPrice: params.price,
      leverage: params.leverage,
      side: params.side
    });

    const position: Position = {
      id: positionId,
      userId: params.userId,
      pair: params.pair,
      side: params.side,
      size: params.amount,
      entryPrice: params.price,
      markPrice: params.price,
      leverage: params.leverage,
      margin: params.margin,
      unrealizedPnl: 0,
      liquidationPrice,
      takeProfit: params.takeProfit,
      stopLoss: params.stopLoss,
      status: 'open',
      metadata: params.metadata,
      createdAt: new Date().toISOString()
    };

    const order: Order = {
      id: orderId,
      userId: params.userId,
      pair: params.pair,
      type: params.orderType,
      side: params.side,
      amount: params.amount,
      price: params.price,
      total: params.amount,
      filled: params.orderType === 'market' ? params.amount : 0,
      remaining: params.orderType === 'market' ? 0 : params.amount,
      status: params.orderType === 'market' ? 'filled' : 'open',
      metadata: { positionId, ...params.metadata },
      createdAt: new Date().toISOString()
    };

    // Insert into database
    const { error: positionError } = await supabase
      .from('positions')
      .insert(position);

    if (positionError) throw positionError;

    const { error: orderError } = await supabase
      .from('orders')
      .insert(order);

    if (orderError) throw orderError;

    return { ...position, order };
  }

  async closeFuturesPosition(params: {
    positionId: string;
    userId: string;
    price: number;
  }): Promise<Position> {
    const { data: position, error: fetchError } = await supabase
      .from('positions')
      .select('*')
      .eq('id', params.positionId)
      .eq('userId', params.userId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate PnL
    const pnl = position.side === 'buy'
      ? (params.price - position.entryPrice) * position.size
      : (position.entryPrice - params.price) * position.size;

    const updatedPosition = {
      ...position,
      markPrice: params.price,
      realizedPnl: pnl,
      status: 'closed',
      closedAt: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('positions')
      .update(updatedPosition)
      .eq('id', params.positionId);

    if (updateError) throw updateError;

    return updatedPosition;
  }

  // ==================== OPTIONS TRADING ====================
  
  async createOption(params: {
    userId: string;
    pair: string;
    direction: 'up' | 'down';
    amount: number;
    timeFrame: number;
    payout: number;
    expiresAt: number;
    metadata?: Record<string, any>;
  }): Promise<Transaction> {
    const optionId = uuidv4();

    // Check admin control for outcome
    const controlResult = await tradingControlService.checkTradeOutcome(params.userId, 'options');

    const transaction: Transaction = {
      id: optionId,
      userId: params.userId,
      type: 'option',
      asset: params.pair,
      amount: params.amount,
      price: 0, // Will be set at settlement
      total: params.amount,
      side: params.direction === 'up' ? 'buy' : 'sell',
      status: 'scheduled',
      metadata: {
        direction: params.direction,
        timeFrame: params.timeFrame,
        payout: params.payout,
        expiresAt: params.expiresAt,
        shouldWin: controlResult.shouldWin,
        outcome: controlResult.outcomeType === 'default' ? 'loss' : controlResult.outcomeType,
        controlReason: controlResult.reason,
        ...params.metadata
      },
      createdAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('transactions')
      .insert(transaction);

    if (error) throw error;

    return transaction;
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  private calculateLiquidationPrice(params: {
    entryPrice: number;
    leverage: number;
    side: OrderSide;
  }): number {
    const maintenanceMargin = 0.005; // 0.5%
    const liquidationBuffer = 0.01; // 1%

    if (params.side === 'buy') {
      return params.entryPrice * (1 - (1 / params.leverage) - maintenanceMargin - liquidationBuffer);
    } else {
      return params.entryPrice * (1 + (1 / params.leverage) + maintenanceMargin + liquidationBuffer);
    }
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getUserPositions(userId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updatePositionMarkPrice(positionId: string, markPrice: number): Promise<void> {
    const { data: position } = await supabase
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (!position) return;

    // Calculate unrealized PnL
    const unrealizedPnl = position.side === 'buy'
      ? (markPrice - position.entryPrice) * position.size
      : (position.entryPrice - markPrice) * position.size;

    // Check for liquidation
    if (this.shouldLiquidate(position, markPrice)) {
      await this.liquidatePosition(positionId);
      return;
    }

    // Check for TP/SL
    await this.checkTakeProfitStopLoss(position, markPrice);

    // Update position
    await supabase
      .from('positions')
      .update({
        markPrice,
        unrealizedPnl,
        updatedAt: new Date().toISOString()
      })
      .eq('id', positionId);
  }

  private shouldLiquidate(position: Position, markPrice: number): boolean {
    const threshold = position.side === 'buy'
      ? position.liquidationPrice
      : position.liquidationPrice;

    return position.side === 'buy'
      ? markPrice <= threshold
      : markPrice >= threshold;
  }

  private async liquidatePosition(positionId: string): Promise<void> {
    await supabase
      .from('positions')
      .update({
        status: 'liquidated',
        closedAt: new Date().toISOString(),
        realizedPnl: -position.margin // Loss of entire margin
      })
      .eq('id', positionId);
  }

  private async checkTakeProfitStopLoss(position: Position, markPrice: number): Promise<void> {
    if (position.takeProfit && (
      (position.side === 'buy' && markPrice >= position.takeProfit) ||
      (position.side === 'sell' && markPrice <= position.takeProfit)
    )) {
      await this.closeFuturesPosition({
        positionId: position.id,
        userId: position.userId,
        price: markPrice
      });
    }

    if (position.stopLoss && (
      (position.side === 'buy' && markPrice <= position.stopLoss) ||
      (position.side === 'sell' && markPrice >= position.stopLoss)
    )) {
      await this.closeFuturesPosition({
        positionId: position.id,
        userId: position.userId,
        price: markPrice
      });
    }
  }
}

export const tradingService = new TradingService();