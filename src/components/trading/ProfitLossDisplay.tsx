import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, DollarSign } from 'lucide-react';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { formatCurrency, formatPercentage, calculatePnL } from '@/utils/tradingCalculations';
import { AnyTrade, FuturesTrade } from '@/types/trading-unified';

interface ProfitLossDisplayProps {
  trade?: AnyTrade;
  currentPrice?: number;
  showPercentage?: boolean;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export default function ProfitLossDisplay({
  trade,
  currentPrice,
  showPercentage = true,
  showDetails = false,
  compact = false,
  className = ''
}: ProfitLossDisplayProps) {
  if (!trade) return null;

  const getPnL = (): number | null => {
    // If P&L is already calculated and stored
    if (trade.pnl !== undefined) {
      return trade.pnl;
    }

    // Calculate P&L for futures positions based on current price
    if (trade.type === 'futures' && currentPrice) {
      const futuresTrade = trade as FuturesTrade;
      return calculatePnL(
        futuresTrade.entryPrice,
        currentPrice,
        futuresTrade.amount,
        futuresTrade.side === 'long' ? 'buy' : 'sell'
      );
    }

    // For other trade types, return stored P&L or null
    return trade.pnl || null;
  };

  const getPnLPercentage = (): number | null => {
    const pnl = getPnL();
    if (!pnl || trade.type !== 'futures') return null;

    const futuresTrade = trade as FuturesTrade;
    const entryValue = futuresTrade.amount * futuresTrade.entryPrice;
    if (entryValue === 0) return null;

    return (pnl / entryValue) * 100;
  };

  const pnl = getPnL();
  const pnlPercentage = getPnLPercentage();

  if (pnl === null) {
    return null;
  }

  const isPositive = pnl > 0;
  const isNegative = pnl < 0;

  const getColorClasses = () => {
    if (isPositive) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (isNegative) return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  };

  const getIcon = () => {
    if (isPositive) return <TrendingUp className="w-4 h-4" />;
    if (isNegative) return <TrendingDown className="w-4 h-4" />;
    return <DollarSign className="w-4 h-4" />;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className={`font-mono font-medium ${
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
        }`}>
          {isPositive ? '+' : ''}{formatCurrency(pnl)}
        </span>
        {showPercentage && pnlPercentage !== null && (
          <span className={`text-sm font-medium ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
          }`}>
            ({isPositive ? '+' : ''}{formatPercentage(pnlPercentage)})
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={`border ${getColorClasses()} ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getColorClasses()}`}>
              {getIcon()}
            </div>
            <div>
              <div className="text-sm font-medium opacity-80">
                {trade.type === 'futures' ? 'Unrealized P&L' : 'P&L'}
              </div>
              <div className={`text-xl font-bold font-mono ${
                isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
              }`}>
                {isPositive ? '+' : ''}{formatCurrency(pnl)}
              </div>
            </div>
          </div>
          
          {showPercentage && pnlPercentage !== null && (
            <Badge className={`${getColorClasses()} border`}>
              {isPositive ? '+' : ''}{formatPercentage(pnlPercentage)}
            </Badge>
          )}
        </div>

        {showDetails && trade.type === 'futures' && (
          <div className="mt-3 pt-3 border-t border-current/20 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Entry Price</span>
              <span className="font-mono">
                ${formatCurrency((trade as FuturesTrade).entryPrice)}
              </span>
            </div>
            {currentPrice && (
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Mark Price</span>
                <span className="font-mono">
                  ${formatCurrency(currentPrice)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="opacity-70">Position Size</span>
              <span className="font-mono">
                {formatCurrency(trade.amount)} {trade.asset.replace('USDT', '')}
              </span>
            </div>
            {(trade as FuturesTrade).leverage && (
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Leverage</span>
                <span className="font-mono">
                  {(trade as FuturesTrade).leverage}x
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
