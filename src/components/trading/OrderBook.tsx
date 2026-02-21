import React, { useMemo } from 'react';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';
import { OrderBookEntry } from '@/types/trading';
import { formatPrice, formatAmount } from '@/utils/tradingCalculations';

interface OrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  loading?: boolean;
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
}

const OrderBookRow = ({ 
  price, 
  amount, 
  total, 
  type 
}: OrderBookEntry & { type: 'bid' | 'ask' }) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
      ${formatPrice(price)}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{formatAmount(amount)}</span>
    <span className="font-mono text-xs text-[#848E9C]">
      ${formatPrice(total)}
    </span>
  </div>
);

const OrderBookSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-8 w-full bg-[#2B3139]" />
    ))}
  </div>
);

// Generate mock order book data for demonstration
const generateMockOrderBook = (basePrice: number) => {
  const mockBids = [];
  const mockAsks = [];
  
  // Generate mock bids (buy orders below current price) - reduced to 3
  for (let i = 0; i < 3; i++) {
    const price = basePrice - (i + 1) * 0.5;
    const amount = Math.random() * 2 + 0.1;
    mockBids.push({
      price,
      amount,
      total: price * amount
    });
  }
  
  // Generate mock asks (sell orders above current price) - reduced to 3
  for (let i = 0; i < 3; i++) {
    const price = basePrice + (i + 1) * 0.5;
    const amount = Math.random() * 2 + 0.1;
    mockAsks.push({
      price,
      amount,
      total: price * amount
    });
  }
  
  return { bids: mockBids, asks: mockAsks };
};

export const OrderBook: React.FC<OrderBookProps> = ({
  bids,
  asks,
  loading,
  baseAsset,
  quoteAsset,
  symbol
}) => {
  const { prices } = useMarketData();

  // Use mock data if no real data is available
  const displayData = useMemo(() => {
    if (bids.length === 0 && asks.length === 0 && !loading) {
      // Generate mock data around current price from MarketDataContext
      const currentPrice = prices[symbol] || 67668.18;
      return generateMockOrderBook(currentPrice);
    }
    return { bids, asks };
  }, [bids, asks, loading, prices, symbol]);

  const { bids: displayBids, asks: displayAsks } = displayData;

  const spread = useMemo(() => {
    if (displayAsks.length === 0 || displayBids.length === 0) return null;
    
    const bestAsk = displayAsks[0].price;
    const bestBid = displayBids[0].price;
    const spreadValue = bestAsk - bestBid;
    const spreadPercentage = (spreadValue / bestBid) * 100;
    
    return { value: spreadValue, percentage: spreadPercentage };
  }, [displayAsks, displayBids]);

  const maxTotal = useMemo(() => {
    const allTotals = [...displayBids, ...displayAsks].map(item => item.total);
    return Math.max(...allTotals, 0);
  }, [displayBids, displayAsks]);

  return (
    <Card className="bg-[#1E2329] border-[#2B3139] p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-[#F0B90B]" />
          <span className="font-semibold text-[#EAECEF]">Order Book</span>
        </div>
        <Badge className="bg-[#2B3139] text-[#848E9C]">
          {displayBids.length + displayAsks.length} levels
        </Badge>
      </div>

      {/* Headers */}
      <div className="grid grid-cols-3 gap-4 text-xs text-[#848E9C] mb-2 px-2">
        <span>Price ({quoteAsset})</span>
        <span className="text-right">Amount ({baseAsset})</span>
        <span className="text-right">Total</span>
      </div>

      {loading ? (
        <OrderBookSkeleton />
      ) : (
        <>
          {/* Asks (Sell orders) */}
          <div className="space-y-1 mb-2">
            {displayAsks.slice().reverse().map((ask, i) => (
              <OrderBookRow key={`ask-${i}`} {...ask} type="ask" />
            ))}
          </div>

          {/* Spread */}
          {spread && (
            <div className="flex items-center justify-between py-2 px-2 bg-[#2B3139]/30 rounded my-1">
              <span className="text-xs text-[#848E9C]">Spread</span>
              <span className="text-xs font-mono text-[#EAECEF]">
                ${formatPrice(spread.value)}
              </span>
              <span className="text-xs text-[#848E9C]">
                {spread.percentage.toFixed(2)}%
              </span>
            </div>
          )}

          {/* Bids (Buy orders) */}
          <div className="space-y-1 mt-2">
            {displayBids.map((bid, i) => (
              <OrderBookRow key={`bid-${i}`} {...bid} type="bid" />
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default OrderBook;