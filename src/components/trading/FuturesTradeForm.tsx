import React, { useState, useEffect } from 'react';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/wallet-service-new';
import { positionService } from '@/services/positionService';
import { useAuth } from '@/contexts/AuthContext';
import { LeverageSelector } from './LeverageSelector';
import { LEVERAGE_OPTIONS } from '@/constants/trading';
import { calculateMargin, calculateRequiredMargin } from '@/utils/tradingCalculations';

interface FuturesTradeFormProps {
  symbol: string;
  onTradeComplete?: () => void;
}

export const FuturesTradeForm: React.FC<FuturesTradeFormProps> = ({
  symbol,
  onTradeComplete
}) => {
  const { user } = useAuth();
  const { prices } = useMarketData();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [positionType, setPositionType] = useState<'open' | 'close'>('open');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState(0);
  const [leverage, setLeverage] = useState(10);
  const [tpSl, setTpSl] = useState(false);
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [positions, setPositions] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [userBalance, userPositions] = await Promise.all([
          walletService.getBalance(user.id, 'USDT'),
          positionService.getUserPositions(user.id)
        ]);
        setBalance(userBalance);
        setPositions(userPositions);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
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
  }, [symbol, prices]);

  const calculatePositionSize = () => {
    if (!livePrice || !balance) return 0;
    const margin = balance * (percent / 100);
    return margin * leverage;
  };

  const calculateMarginRequired = () => {
    const positionSize = calculatePositionSize();
    return positionSize / leverage;
  };

  const handleSubmit = async () => {
    if (!user || !livePrice) return;
    
    const orderPrice = orderType === 'market' ? livePrice : parseFloat(price);
    const positionSize = calculatePositionSize();
    const margin = calculateMarginRequired();
    
    if (margin > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT for this position.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      if (positionType === 'open') {
        // Lock margin first
        await walletService.lockBalance({
          userId: user.id,
          asset: 'USDT',
          amount: margin,
          reference: `futures-position-${Date.now()}`
        });
        
        // Open futures position
        const position = await tradingService.openFuturesPosition({
          userId: user.id,
          pair: symbol,
          side,
          type: positionType,
          orderType,
          amount: positionSize,
          price: orderPrice,
          leverage,
          margin,
          takeProfit: tpSl && takeProfit ? parseFloat(takeProfit) : undefined,
          stopLoss: tpSl && stopLoss ? parseFloat(stopLoss) : undefined,
          metadata: {
            timestamp: Date.now(),
            source: 'futures-trading-form'
          }
        });
        
        toast({
          title: "Position Opened Successfully",
          description: `Your ${side} position of ${positionSize} ${symbol.replace('USDT', '')} at ${orderPrice} has been opened.`
        });
      } else {
        // Close position logic would go here
        // For now, just show a message
        toast({
          title: "Close Position",
          description: "Position closing functionality coming soon.",
          variant: "default"
        });
      }
      
      // Reset form
      setAmount('');
      setPercent(0);
      setPrice('');
      setTakeProfit('');
      setStopLoss('');
      
      onTradeComplete?.();
    } catch (error: any) {
      console.error('Trade failed:', error);
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to execute trade. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#EAECEF]">Futures Trade</h3>
        <div className="text-sm text-[#848E9C]">
          Balance: ${balance.toLocaleString()} USDT
        </div>
      </div>
      
      <div className="flex items-center gap-4 mb-4">
        <LeverageSelector value={leverage} onChange={setLeverage} />
        <Tabs value={positionType} onValueChange={v => setPositionType(v as 'open' | 'close')}>
          <TabsList className="w-full grid grid-cols-2 bg-[#2B3139]">
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="close">Close</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <Tabs value={side} onValueChange={v => setSide(v as 'buy' | 'sell')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2 bg-[#2B3139]">
          <TabsTrigger value="buy" className="text-green-400 data-[state=active]:bg-green-500/20">Long</TabsTrigger>
          <TabsTrigger value="sell" className="text-red-400 data-[state=active]:bg-red-500/20">Short</TabsTrigger>
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
        <label className="text-xs text-[#848E9C] mb-1 block">Position Size ({symbol.replace('USDT', '')})</label>
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
          <span className="text-xs text-[#848E9C]">Margin Percentage</span>
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
              const positionSize = (balance * newPercent / 100) * leverage;
              setAmount((positionSize / livePrice).toString());
            }
          }} 
          className="w-full" 
        />
      </div>
      
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="tpsl" 
          checked={tpSl} 
          onChange={e => setTpSl(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="tpsl" className="text-xs text-[#848E9C]">Take Profit / Stop Loss</label>
      </div>
      
      {tpSl && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-[#848E9C] mb-1 block">Take Profit</label>
            <Input 
              type="number" 
              value={takeProfit} 
              onChange={e => setTakeProfit(e.target.value)} 
              placeholder="TP price" 
              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>
          <div>
            <label className="text-xs text-[#848E9C] mb-1 block">Stop Loss</label>
            <Input 
              type="number" 
              value={stopLoss} 
              onChange={e => setStopLoss(e.target.value)} 
              placeholder="SL price" 
              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>
        </div>
      )}
      
      <div className="space-y-1 text-xs text-[#848E9C]">
        <div className="flex justify-between">
          <span>Market Price:</span>
          <span className="text-[#EAECEF]">${livePrice?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Position Size:</span>
          <span className="text-[#EAECEF]">${calculatePositionSize().toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Required Margin:</span>
          <span className="text-[#EAECEF]">${calculateMarginRequired().toLocaleString()} USDT</span>
        </div>
        <div className="flex justify-between">
          <span>Leverage:</span>
          <span className="text-[#EAECEF]">{leverage}x</span>
        </div>
      </div>
      
      <Button 
        className={`w-full font-semibold ${
          side === 'buy' 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`} 
        onClick={handleSubmit} 
        disabled={loading || !livePrice || !user || calculatePositionSize() <= 0}
      >
        {loading ? 'Processing...' : `${positionType === 'open' ? 'Open' : 'Close'} ${side === 'buy' ? 'Long' : 'Short'}`}
      </Button>
    </div>
  );
};
export default FuturesTradeForm; 