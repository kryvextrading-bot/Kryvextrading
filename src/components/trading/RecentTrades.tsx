import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { Trade } from '@/types/trading';
import { formatPrice, formatAmount } from '@/utils/tradingCalculations';

interface RecentTradesProps {
  trades: Trade[];
  loading?: boolean;
  baseAsset: string;
  quoteAsset: string;
}

const TradeRow = ({ trade }: { trade: Trade }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="font-mono text-sm text-[#EAECEF]">
        ${formatPrice(trade.price)}
      </span>
    </div>
    <span className="font-mono text-sm text-[#EAECEF]">{formatAmount(trade.amount)}</span>
    <span className="text-xs text-[#848E9C]">
      {new Date(trade.time).toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })}
    </span>
  </div>
);

const TradesSkeleton = () => (
  <div className="space-y-2">
    {[...Array(10)].map((_, i) => (
      <Skeleton key={i} className="h-10 w-full bg-[#2B3139]" />
    ))}
  </div>
);

// Generate mock recent trades for demonstration
const generateMockTrades = (basePrice: number) => {
  const mockTrades = [];
  const currentTime = Date.now();
  
  // Reduced to 8 trades for smaller display
  for (let i = 0; i < 8; i++) {
    const priceVariation = (Math.random() - 0.5) * 100; // ±50 from base price
    const price = basePrice + priceVariation;
    const amount = Math.random() * 1.5 + 0.1;
    const isBuy = Math.random() > 0.5;
    
    mockTrades.push({
      id: `mock-${i}`,
      price,
      amount,
      total: price * amount,
      side: isBuy ? 'buy' : 'sell',
      time: currentTime - (i * 30000) // 30 seconds apart
    });
  }
  
  return mockTrades;
};

export const RecentTrades: React.FC<RecentTradesProps> = ({
  trades,
  loading,
  baseAsset,
  quoteAsset
}) => {
  // Use mock data if no real data is available
  const displayTrades = React.useMemo(() => {
    if (trades.length === 0 && !loading) {
      // Generate mock data around current BTC price
      return generateMockTrades(67000);
    }
    return trades;
  }, [trades, loading]);

  return (
    <Card className="bg-[#1E2329] border-[#2B3139] p-3">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-[#F0B90B]" />
        <span className="font-semibold text-[#EAECEF]">Recent Trades</span>
        <Badge className="bg-[#2B3139] text-[#848E9C] ml-auto">
          {displayTrades.length} trades
        </Badge>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-3 gap-4 text-xs text-[#848E9C] mb-2">
        <span>Price ({quoteAsset})</span>
        <span className="text-right">Amount ({baseAsset})</span>
        <span className="text-right">Time</span>
      </div>

      {loading ? (
        <TradesSkeleton />
      ) : (
        <div className="space-y-1 max-h-[200px] overflow-y-auto custom-scrollbar">
          {displayTrades.length === 0 ? (
            <div className="text-xs text-[#5E6673] text-center py-4">
              Waiting for trades...
            </div>
          ) : (
            displayTrades.map((trade, i) => (
              <TradeRow key={trade.id || i} trade={trade} />
            ))
          )}
        </div>
      )}
    </Card>
  );
};

export default RecentTrades;