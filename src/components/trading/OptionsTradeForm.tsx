import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/wallet-service-new';
import { useAuth } from '@/contexts/AuthContext';
import { PROFIT_RATES, TimeFrame } from '@/constants/trading';

interface OptionsTradeFormProps {
  symbol: string;
  onTradeComplete?: () => void;
}

export const OptionsTradeForm: React.FC<OptionsTradeFormProps> = ({
  symbol,
  onTradeComplete
}) => {
  const { user } = useAuth();
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(60);
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [livePrice, setLivePrice] = useState<number | null>(null);
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
        // Mock price for now - replace with actual Binance API
        const mockPrice = symbol === 'BTCUSDT' ? 67000 : symbol === 'ETHUSDT' ? 3500 : 100;
        if (mounted) setLivePrice(mockPrice);
      } catch {
        if (mounted) setLivePrice(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [symbol]);

  const calculatePayout = () => {
    const betAmount = parseFloat(amount) || (balance * percent / 100);
    const rates = PROFIT_RATES[timeFrame];
    return {
      betAmount,
      potentialProfit: betAmount * rates.profit / 100,
      potentialReturn: betAmount * rates.payout,
      payoutRate: rates.payout
    };
  };

  const handleSubmit = async () => {
    if (!user || !livePrice) return;
    
    const { betAmount, potentialReturn } = calculatePayout();
    
    if (betAmount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDT for this option.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Lock balance first
      await walletService.lockBalance({
        userId: user.id,
        asset: 'USDT',
        amount: betAmount,
        reference: `option-${Date.now()}`
      });
      
      // Create the option
      const option = await tradingService.createOption({
        userId: user.id,
        pair: symbol,
        direction,
        amount: betAmount,
        timeFrame,
        payout: PROFIT_RATES[timeFrame].payout,
        expiresAt: Date.now() + (timeFrame * 1000),
        metadata: {
          timestamp: Date.now(),
          source: 'options-trading-form',
          entryPrice: livePrice
        }
      });
      
      toast({
        title: "Option Purchased Successfully",
        description: `Your ${direction} option for $${betAmount} expires in ${timeFrame}s. Potential return: $${potentialReturn.toFixed(2)}`
      });
      
      // Reset form
      setAmount('');
      setPercent(0);
      
      onTradeComplete?.();
    } catch (error: any) {
      console.error('Option purchase failed:', error);
      toast({
        title: "Option Purchase Failed",
        description: error.message || "Failed to purchase option. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const { betAmount, potentialProfit, potentialReturn, payoutRate } = calculatePayout();
  
  return (
    <div className="w-full max-w-md mx-auto bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#EAECEF]">Options Trade</h3>
        <div className="text-sm text-[#848E9C]">
          Balance: ${balance.toLocaleString()} USDT
        </div>
      </div>
      
      <Tabs value={direction} onValueChange={v => setDirection(v as 'up' | 'down')} className="mb-2">
        <TabsList className="w-full grid grid-cols-2 bg-[#2B3139]">
          <TabsTrigger value="up" className="text-green-400 data-[state=active]:bg-green-500/20">↑ Up</TabsTrigger>
          <TabsTrigger value="down" className="text-red-400 data-[state=active]:bg-red-500/20">↓ Down</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div>
        <label className="text-xs text-[#848E9C] mb-1 block">Expiration Time</label>
        <Select value={String(timeFrame)} onValueChange={v => setTimeFrame(Number(v) as TimeFrame)}>
          <SelectTrigger className="w-full bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PROFIT_RATES).map(([time, rates]) => (
              <SelectItem key={time} value={time}>
                {time}s - {rates.profit}% profit
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="text-xs text-[#848E9C] mb-1 block">Bet Amount (USDT)</label>
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
            const calculatedAmount = balance * newPercent / 100;
            setAmount(calculatedAmount.toString());
          }} 
          className="w-full" 
        />
      </div>
      
      <div className="bg-[#2B3139]/30 rounded p-3 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Current Price:</span>
          <span className="text-[#EAECEF]">${livePrice?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Bet Amount:</span>
          <span className="text-[#EAECEF]">${betAmount.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Potential Profit:</span>
          <span className="text-green-400">+${potentialProfit.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Potential Return:</span>
          <span className="text-[#EAECEF]">${potentialReturn.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Payout Rate:</span>
          <span className="text-[#EAECEF]">{(payoutRate * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Expires In:</span>
          <span className="text-[#EAECEF]">{timeFrame} seconds</span>
        </div>
      </div>
      
      <Button 
        className={`w-full font-semibold ${
          direction === 'up' 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`} 
        onClick={handleSubmit} 
        disabled={loading || !livePrice || !user || betAmount <= 0}
      >
        {loading ? 'Processing...' : `Buy ${direction === 'up' ? '↑ Up' : '↓ Down'} Option`}
      </Button>
    </div>
  );
};

export default OptionsTradeForm; 