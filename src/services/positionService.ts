import { supabase } from '@/lib/supabase';
import { Position, PnLCalculation } from '@/types/trading';
import { OrderSide } from '@/constants/trading';

class PositionService {
  async getUserPositions(userId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'open')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getPositionById(positionId: string): Promise<Position | null> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', positionId)
      .single();

    if (error) return null;
    return data;
  }

  async updatePosition(position: Partial<Position> & { id: string }): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .update({
        ...position,
        updatedAt: new Date().toISOString()
      })
      .eq('id', position.id);

    if (error) throw error;
  }

  async closePosition(positionId: string, closePrice: number): Promise<Position> {
    const position = await this.getPositionById(positionId);
    if (!position) throw new Error('Position not found');

    // Calculate realized PnL
    const realizedPnl = this.calculateRealizedPnL(position, closePrice);

    const updatedPosition = {
      ...position,
      markPrice: closePrice,
      realizedPnl,
      status: 'closed' as const,
      closedAt: new Date().toISOString()
    };

    await this.updatePosition(updatedPosition);
    return updatedPosition;
  }

  async liquidatePosition(positionId: string): Promise<Position> {
    const position = await this.getPositionById(positionId);
    if (!position) throw new Error('Position not found');

    const updatedPosition = {
      ...position,
      status: 'liquidated' as const,
      realizedPnl: -position.margin, // Loss of entire margin
      closedAt: new Date().toISOString()
    };

    await this.updatePosition(updatedPosition);
    return updatedPosition;
  }

  async updateMarkPrices(positions: Position[], currentPrices: Record<string, number>): Promise<void> {
    for (const position of positions) {
      const currentPrice = currentPrices[position.pair];
      if (!currentPrice) continue;

      const unrealizedPnl = this.calculateUnrealizedPnL(position, currentPrice);
      
      await supabase
        .from('positions')
        .update({
          markPrice: currentPrice,
          unrealizedPnl,
          updatedAt: new Date().toISOString()
        })
        .eq('id', position.id);
    }
  }

  calculateUnrealizedPnL(position: Position, currentPrice: number): number {
    if (position.side === 'buy') {
      return (currentPrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - currentPrice) * position.size;
    }
  }

  calculateRealizedPnL(position: Position, closePrice: number): number {
    if (position.side === 'buy') {
      return (closePrice - position.entryPrice) * position.size;
    } else {
      return (position.entryPrice - closePrice) * position.size;
    }
  }

  calculatePnLPercentage(position: Position, currentPrice: number): number {
    const pnl = this.calculateUnrealizedPnL(position, currentPrice);
    return (pnl / position.margin) * 100;
  }

  getLiquidationPrice(position: Position): number {
    const maintenanceMargin = 0.005; // 0.5%
    const liquidationBuffer = 0.01; // 1%

    if (position.side === 'buy') {
      return position.entryPrice * (1 - (1 / position.leverage) - maintenanceMargin - liquidationBuffer);
    } else {
      return position.entryPrice * (1 + (1 / position.leverage) + maintenanceMargin + liquidationBuffer);
    }
  }

  async checkLiquidations(positions: Position[], currentPrices: Record<string, number>): Promise<Position[]> {
    const liquidated: Position[] = [];

    for (const position of positions) {
      const currentPrice = currentPrices[position.pair];
      if (!currentPrice) continue;

      const liquidationPrice = this.getLiquidationPrice(position);
      
      const shouldLiquidate = position.side === 'buy'
        ? currentPrice <= liquidationPrice
        : currentPrice >= liquidationPrice;

      if (shouldLiquidate) {
        const liquidatedPosition = await this.liquidatePosition(position.id);
        liquidated.push(liquidatedPosition);
      }
    }

    return liquidated;
  }

  async checkTakeProfitStopLoss(positions: Position[], currentPrices: Record<string, number>): Promise<Position[]> {
    const closed: Position[] = [];

    for (const position of positions) {
      const currentPrice = currentPrices[position.pair];
      if (!currentPrice) continue;

      // Check Take Profit
      if (position.takeProfit) {
        const shouldTakeProfit = position.side === 'buy'
          ? currentPrice >= position.takeProfit
          : currentPrice <= position.takeProfit;

        if (shouldTakeProfit) {
          const closedPosition = await this.closePosition(position.id, currentPrice);
          closed.push(closedPosition);
          continue;
        }
      }

      // Check Stop Loss
      if (position.stopLoss) {
        const shouldStopLoss = position.side === 'buy'
          ? currentPrice <= position.stopLoss
          : currentPrice >= position.stopLoss;

        if (shouldStopLoss) {
          const closedPosition = await this.closePosition(position.id, currentPrice);
          closed.push(closedPosition);
        }
      }
    }

    return closed;
  }

  getAggregatedPnL(positions: Position[], currentPrices: Record<string, number>): PnLCalculation {
    let totalUnrealized = 0;
    let totalMargin = 0;

    for (const position of positions) {
      const currentPrice = currentPrices[position.pair] || position.markPrice;
      const unrealized = this.calculateUnrealizedPnL(position, currentPrice);
      totalUnrealized += unrealized;
      totalMargin += position.margin;
    }

    return {
      unrealized: totalUnrealized,
      realized: 0, // Would need to sum from closed positions
      percentage: totalMargin > 0 ? (totalUnrealized / totalMargin) * 100 : 0
    };
  }

  async subscribeToPositionUpdates(
    userId: string,
    callback: (positions: Position[]) => void
  ): Promise<() => void> {
    const subscription = supabase
      .channel('positions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'positions',
          filter: `userId=eq.${userId}`
        },
        async () => {
          const positions = await this.getUserPositions(userId);
          callback(positions);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const positionService = new PositionService();