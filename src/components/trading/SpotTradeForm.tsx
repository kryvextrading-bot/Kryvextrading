import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import apiService from '@/services/api';

interface SpotTradeFormProps {
  symbol: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  price: string;
  amount: string;
  percent: number;
  onSideChange: (side: 'buy' | 'sell') => void;
  onOrderTypeChange: (type: 'market' | 'limit' | 'stop') => void;
  onPriceChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onPercentChange: (v: number) => void;
  onSubmit: (tradePrice: number) => void;
  disabled?: boolean;
}

export const SpotTradeForm: React.FC<SpotTradeFormProps> = ({
  symbol, side, orderType, price, amount, percent,
  onSideChange, onOrderTypeChange, onPriceChange, onAmountChange, onPercentChange, onSubmit, disabled
}) => {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      setLoading(true);
      try {
        const prices = await apiService.getMultiExchangePrices([symbol]);
        // For buy: best is lowest, for sell: best is highest
        const allPrices = Object.values(prices).map(ex => ex[symbol]).filter(Boolean);
        let best = null;
        if (allPrices.length) {
          best = side === 'buy' ? Math.min(...allPrices) : Math.max(...allPrices);
        }
        if (mounted) setLivePrice(best);
      } catch {
        if (mounted) setLivePrice(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrice();
    // Optionally, poll every 30s
    const interval = setInterval(fetchPrice, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [symbol, side]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow p-6 flex flex-col gap-4">
      <Tabs value={side} onValueChange={v => onSideChange(v as 'buy' | 'sell')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      <Tabs value={orderType} onValueChange={v => onOrderTypeChange(v as 'market' | 'limit' | 'stop')} className="mb-2">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop">Stop</TabsTrigger>
        </TabsList>
      </Tabs>
      {orderType !== 'market' && (
        <Input type="number" value={price} onChange={e => onPriceChange(e.target.value)} placeholder="Price" className="mb-2" />
      )}
      <Input type="number" value={amount} onChange={e => onAmountChange(e.target.value)} placeholder="Amount" className="mb-2" />
      {/* Slider for percent */}
      <div className="flex items-center gap-2 mb-2">
        <input type="range" min={0} max={100} value={percent} onChange={e => onPercentChange(Number(e.target.value))} className="w-full" />
        <span className="text-xs w-10 text-right">{percent}%</span>
      </div>
      <div className="mb-2 text-xs">
        {loading ? (
          <span className="text-muted-foreground">Loading live price...</span>
        ) : livePrice ? (
          <span>Best {side === 'buy' ? 'Ask' : 'Bid'}: <span className="font-semibold">${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
        ) : (
          <span className="text-red-500">No live price</span>
        )}
      </div>
      <Button className="w-full" onClick={() => onSubmit(livePrice ?? 0)} disabled={disabled || !livePrice}>
        {side === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`}
      </Button>
    </div>
  );
};
export default SpotTradeForm; 