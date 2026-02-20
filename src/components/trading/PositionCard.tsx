import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, TrendingDown, AlertTriangle } from 'lucide-react';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { Position } from '@/types/trading';
import { 
  formatPrice, 
  formatCurrency, 
  formatPercentage,
  calculatePnL,
  calculatePnLPercentage,
  isNearLiquidation 
} from '@/utils/tradingCalculations';

interface PositionCardProps {
  position: Position;
  currentPrice: number;
  onClose: () => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  currentPrice,
  onClose
}) => {
  const unrealizedPnl = calculatePnL(
    position.entryPrice,
    currentPrice,
    position.size,
    position.side
  );

  const pnlPercentage = calculatePnLPercentage(
    position.entryPrice,
    currentPrice,
    position.leverage,
    position.side
  );

  const nearLiquidation = isNearLiquidation(
    currentPrice,
    position.liquidationPrice,
    position.side
  );

  const liquidationDistance = position.side === 'buy'
    ? ((currentPrice - position.liquidationPrice) / position.liquidationPrice) * 100
    : ((position.liquidationPrice - currentPrice) / currentPrice) * 100;

  return (
    <Card className="bg-[#1E2329] border-[#2B3139] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#F0B90B]" />
          <span className="font-semibold text-[#EAECEF]">{position.pair}</span>
        </div>
        <Badge className={
          position.side === 'buy' 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }>
          {position.side === 'buy' ? 'LONG' : 'SHORT'} {position.leverage}x
        </Badge>
      </div>

      {/* Position Details */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Size</span>
          <span className="text-[#EAECEF] font-medium">
            ${formatCurrency(position.size)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Margin</span>
          <span className="text-[#EAECEF] font-medium">
            ${formatCurrency(position.margin)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Entry Price</span>
          <span className="text-[#EAECEF] font-medium">
            ${formatPrice(position.entryPrice)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Mark Price</span>
          <span className="text-[#EAECEF] font-medium">
            ${formatPrice(currentPrice)}
          </span>
        </div>

        {/* P&L */}
        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Unrealized P&L</span>
          <span className={unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl)} USDT
            <span className="ml-1 text-xs">
              ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
            </span>
          </span>
        </div>

        {/* Liquidation Warning */}
        {nearLiquidation && (
          <div className="bg-red-500/10 border border-red-500/30 rounded p-2 mt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400">
                Near liquidation! {liquidationDistance.toFixed(1)}% away
              </span>
            </div>
          </div>
        )}

        {/* Liquidation Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#848E9C]">Liquidation at</span>
            <span className="text-red-400">
              ${formatPrice(position.liquidationPrice)}
            </span>
          </div>
          <Progress 
            value={Math.min(100, Math.max(0, 100 - liquidationDistance))} 
            className="h-1 bg-[#2B3139]"
            indicatorClassName={nearLiquidation ? 'bg-red-500' : 'bg-yellow-500'}
          />
        </div>

        {/* TP/SL if set */}
        {(position.takeProfit || position.stopLoss) && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B3139]">
            {position.takeProfit && (
              <div>
                <div className="text-xs text-[#848E9C]">Take Profit</div>
                <div className="text-sm text-green-400">
                  ${formatPrice(position.takeProfit)}
                </div>
              </div>
            )}
            {position.stopLoss && (
              <div>
                <div className="text-xs text-[#848E9C]">Stop Loss</div>
                <div className="text-sm text-red-400">
                  ${formatPrice(position.stopLoss)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <Button
          className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
          onClick={onClose}
        >
          Close Position
        </Button>
      </div>
    </Card>
  );
};

export default PositionCard;