import React, { useState, useEffect } from 'react';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { tradingApiService } from '@/services/tradingApiService';
import { walletService } from '@/services/wallet-service-new';
import { useAuth } from '@/contexts/AuthContext';

interface SpotTradeFormProps {
  symbol: string;
  onTradeComplete?: () => void;
}

export const SpotTradeForm: React.FC<SpotTradeFormProps> = ({
  symbol,
  onTradeComplete
}) => {
  const { user } = useAuth();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState(0);
  const { prices } = useMarketData();
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const userBalance = await walletService.getBalance(user.id, 'USDT');
        setBalance(userBalance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
    };
    fetchBalance();
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      setLoading(true);
      try {
        // Get price from MarketDataContext
        const baseAsset = symbol.replace('USDT', '');
        const marketPrice = prices[baseAsset];
        const priceToUse = marketPrice || (symbol === 'BTCUSDT' ? 67668.18 : symbol === 'ETHUSDT' ? 3492.89 : 100);
        if (mounted) setLivePrice(priceToUse);
      } catch {
        if (mounted) setLivePrice(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [symbol, side]);

  const handleSubmit = async () => {
    if (!user || !livePrice) return;
    
    const orderPrice = orderType === 'market' ? livePrice : parseFloat(price);
    const orderAmount = parseFloat(amount) || (balance * percent / 100) / orderPrice;
    const total = orderAmount * orderPrice;
    
    if (total > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT for this trade.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Execute trade with admin outcome control
      const response = await tradingApiService.executeSpotTrade({
        pair: symbol,
        side,
        type: orderType,
        amount: orderAmount,
        price: orderPrice,
        total
      });
      
      if (response.success) {
        const { trade } = response;
        
        // Show appropriate message based on outcome
        if (trade.outcome === 'win') {
          toast({
            title: "Winning Trade!",
            description: `+$${trade.pnl.toFixed(2)} profit`,
            variant: "default"
          });
        } else {
          toast({
            title: "Trade Lost",
            description: `-$${Math.abs(trade.pnl).toFixed(2)}`,
            variant: "destructive"
          });
        }
        
        // Reset form
        setAmount('');
        setPercent(0);
        setPrice('');
        
        onTradeComplete?.();
      }
      
    } catch (error: any) {
      console.error('Trade failed:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#EAECEF]">Spot Trade</h3>
        <div className="text-sm text-[#848E9C]">
          Balance: ${balance.toLocaleString()} USDT
        </div>
      </div>
      
      <Tabs value={side} onValueChange={v => setSide(v as 'buy' | 'sell')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2 bg-[#2B3139]">
          <TabsTrigger value="buy" className="text-green-400 data-[state=active]:bg-green-500/20">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="text-red-400 data-[state=active]:bg-red-500/20">Sell</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Tabs value={orderType} onValueChange={v => setOrderType(v as 'market' | 'limit' | 'stop')} className="mb-2">
        <TabsList className="w-full grid grid-cols-3 bg-[#2B3139]">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="limit">Limit</TabsTrigger>
          <TabsTrigger value="stop">Stop</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {orderType !== 'market' && (
        <div>
          <label className="text-xs text-[#848E9C] mb-1 block">Price (USDT)</label>
          <Input 
            type="number" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            placeholder="Enter price" 
            className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
          />
        </div>
      )}
      
      <div>
        <label className="text-xs text-[#848E9C] mb-1 block">Amount ({symbol.replace('USDT', '')})</label>
        <Input 
          type="number" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="Enter amount" 
          className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#848E9C]">Percentage</span>
          <span className="text-xs text-[#EAECEF]">{percent}%</span>
        </div>
        <input 
          type="range" 
          min={0} 
          max={100} 
          value={percent} 
          onChange={e => {
            const newPercent = Number(e.target.value);
            setPercent(newPercent);
            if (livePrice) {
              const calculatedAmount = (balance * newPercent / 100) / livePrice;
              setAmount(calculatedAmount.toString());
            }
          }} 
          className="w-full" 
        />
      </div>
      
      <div className="mb-2 text-xs">
        {loading ? (
          <span className="text-[#848E9C]">Loading price...</span>
        ) : livePrice ? (
          <span>Market Price: <span className="font-semibold text-[#EAECEF]">${livePrice.toLocaleString()}</span></span>
        ) : (
          <span className="text-red-400">No price data</span>
        )}
      </div>
      
      {amount && livePrice && (
        <div className="text-xs text-[#848E9C]">
          Total: ${(parseFloat(amount) * livePrice).toLocaleString()} USDT
        </div>
      )}
      
      <Button 
        className={`w-full font-semibold ${
          side === 'buy' 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`} 
        onClick={handleSubmit} 
        disabled={loading || !livePrice || !user || parseFloat(amount) <= 0}
      >
        {loading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol.replace('USDT', '')}`}
      </Button>
    </div>
  );
};
export default SpotTradeForm; 