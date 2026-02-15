// OptionsTradingPage.tsx - Fixed with proper wallet integration and admin controls
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Clock, 
  Wallet, 
  Crown, 
  AlertTriangle,
  Info,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  Activity
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Chart imports
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, TimeScale } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

// Hooks
import useBinanceStream from '@/hooks/useBinanceStream';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingControl } from '@/hooks/useTradingControl';

// Services
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/walletService';

// Utils
import { formatPrice, formatCurrency, validateOrder } from '@/utils/tradingCalculations';

// Types
import { Transaction } from '@/types/trading';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  ChartTooltip, 
  Legend, 
  TimeScale, 
  CandlestickController, 
  CandlestickElement
);

// Constants
const TIME_RANGES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
type TimeRange = typeof TIME_RANGES[number];

const OPTION_TIMES = [60, 120, 300, 600, 1800, 3600] as const; // in seconds
type OptionTime = typeof OPTION_TIMES[number];

const CHART_TYPES = ['candlestick', 'line'] as const;
type ChartType = typeof CHART_TYPES[number];

const ASSETS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];

const PROFIT_RATES = {
  60: { payout: 0.85, profit: 15 },
  120: { payout: 0.82, profit: 18 },
  300: { payout: 0.78, profit: 22 },
  600: { payout: 0.75, profit: 25 },
  1800: { payout: 0.70, profit: 30 },
  3600: { payout: 0.65, profit: 35 }
};

// Mock chart data
const generateMockData = (timeRange: TimeRange) => {
  const points = timeRange === '1m' ? 60 : 
                 timeRange === '5m' ? 48 : 
                 timeRange === '15m' ? 32 : 
                 timeRange === '30m' ? 30 : 
                 timeRange === '1h' ? 24 : 
                 timeRange === '4h' ? 18 : 
                 timeRange === '1d' ? 14 : 30;

  const basePrice = 67000;
  const volatility = 0.02;
  
  const labels = [];
  const candleData = [];
  const lineData = [];
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < points; i++) {
    const time = new Date(Date.now() - (points - i) * 60000);
    labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    // Generate random walk
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    
    candleData.push({ o: open, h: high, l: low, c: close });
    lineData.push(close);
    
    currentPrice = close;
  }
  
  return { labels, candleData, lineData };
};

interface OptionOrder {
  id: string;
  pair: string;
  direction: 'up' | 'down';
  amount: number;
  timeFrame: number;
  entryPrice: number;
  payout: number;
  expiresAt: number;
  status: 'active' | 'completed' | 'failed';
  pnl?: number;
}

export default function OptionsTradingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Contexts
  const { user, isAuthenticated } = useAuth();
  const { balances, getBalance, updateBalance } = useWallet();
  const {
    userOutcome,
    activeWindows,
    systemSettings,
    countdown,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();

  // State
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [hideBalances, setHideBalances] = useState(false);
  const [loading, setLoading] = useState(false);

  // Trading state
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [optionTime, setOptionTime] = useState<OptionTime>(60);
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState(0);

  // Orders state
  const [activeOptions, setActiveOptions] = useState<OptionOrder[]>([]);
  const [completedOptions, setCompletedOptions] = useState<OptionOrder[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Live data
  const trade = useBinanceStream(symbol, 'trade');
  const kline = useBinanceStream(symbol, 'kline', timeRange);

  // Current price
  const currentPrice = trade?.p ? parseFloat(trade.p) : 67000;
  const priceChange = kline?.k ? ((parseFloat(kline.k.c) - parseFloat(kline.k.o)) / parseFloat(kline.k.o)) * 100 : 0;

  // Chart data
  const [chartData, setChartData] = useState(() => generateMockData(timeRange));
  const [chartHistory, setChartHistory] = useState<any[]>([]);

  // Update chart with real data
  useEffect(() => {
    if (kline && kline.k) {
      setChartHistory(prev => {
        const newCandle = {
          o: parseFloat(kline.k.o),
          h: parseFloat(kline.k.h),
          l: parseFloat(kline.k.l),
          c: parseFloat(kline.k.c),
          t: kline.k.t
        };
        
        const exists = prev.find(c => c.t === kline.k.t);
        if (exists) {
          return prev.map(c => c.t === kline.k.t ? newCandle : c);
        } else {
          return [...prev.slice(-99), newCandle];
        }
      });
    }
  }, [kline]);

  useEffect(() => {
    setChartHistory([]);
    setChartData(generateMockData(timeRange));
  }, [symbol, timeRange]);

  // Load user data
  useEffect(() => {
    if (user?.id) {
      loadTransactions();
    }
  }, [user?.id]);

  const loadTransactions = async () => {
    try {
      const data = await tradingService.getUserTransactions(user!.id);
      setTransactions(data);
      
      // Separate active and completed options
      const options = data.filter(tx => tx.type === 'option');
      const active = options.filter(tx => 
        tx.status === 'scheduled' && 
        tx.metadata?.expiresAt && 
        tx.metadata.expiresAt > Date.now()
      );
      const completed = options.filter(tx => 
        tx.status === 'completed' || tx.status === 'failed'
      );
      
      setActiveOptions(active.map(tx => ({
        id: tx.id,
        pair: tx.asset,
        direction: tx.metadata?.direction,
        amount: tx.amount,
        timeFrame: tx.metadata?.timeFrame,
        entryPrice: tx.price,
        payout: tx.metadata?.payout,
        expiresAt: tx.metadata?.expiresAt,
        status: 'active',
        pnl: tx.pnl
      })));
      
      setCompletedOptions(completed.map(tx => ({
        id: tx.id,
        pair: tx.asset,
        direction: tx.metadata?.direction,
        amount: tx.amount,
        timeFrame: tx.metadata?.timeFrame,
        entryPrice: tx.price,
        payout: tx.metadata?.payout,
        expiresAt: tx.metadata?.expiresAt,
        status: tx.status === 'completed' ? 'completed' : 'failed',
        pnl: tx.pnl
      })));
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  // Handle asset change
  const handleAssetChange = (asset: string) => {
    setSelectedAsset(asset);
    setSymbol(`${asset}USDT`);
  };

  // Handle option purchase
  const handlePurchase = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to trade options',
        variant: 'destructive'
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    
    if (!parsedAmount || parsedAmount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive'
      });
      return;
    }

    if (parsedAmount > getBalance('USDT')) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${formatCurrency(parsedAmount)} USDT but have ${formatCurrency(getBalance('USDT'))} USDT`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Check if option should win based on admin settings
      const wins = await shouldWin('options');
      
      const rate = PROFIT_RATES[optionTime]?.payout || 0.8;
      const payout = parsedAmount * rate;
      const expiresAt = Date.now() + optionTime * 1000;

      // Create option order
      const option = await tradingService.createOption({
        userId: user!.id,
        pair: symbol,
        direction,
        amount: parsedAmount,
        timeFrame: optionTime,
        payout,
        expiresAt,
        metadata: {
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        }
      });

      // Deduct premium
      await walletService.deductBalance({
        userId: user!.id,
        asset: 'USDT',
        amount: parsedAmount,
        reference: option.id,
        type: 'option_premium'
      });

      // Add to transactions
      const transaction: Transaction = {
        id: option.id,
        userId: user!.id,
        type: 'option',
        asset: symbol,
        amount: parsedAmount,
        price: currentPrice,
        total: parsedAmount,
        side: direction === 'up' ? 'buy' : 'sell',
        status: 'scheduled',
        pnl: 0,
        metadata: {
          direction,
          timeFrame: optionTime,
          payout,
          expiresAt,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);
      updateBalance('USDT', -parsedAmount);

      // Add to active options
      const newOption: OptionOrder = {
        id: option.id,
        pair: symbol,
        direction,
        amount: parsedAmount,
        timeFrame: optionTime,
        entryPrice: currentPrice,
        payout,
        expiresAt,
        status: 'active'
      };
      
      setActiveOptions(prev => [newOption, ...prev]);

      toast({
        title: wins ? '🎯 Option Purchased (Win Forced)' : '📊 Option Purchased',
        description: `${direction.toUpperCase()} option for ${formatCurrency(parsedAmount)} USDT, expires in ${optionTime}s`,
      });

      // Schedule settlement
      setTimeout(async () => {
        const finalPnl = wins ? payout - parsedAmount : -parsedAmount;
        
        // Update transaction
        setTransactions(prev =>
          prev.map(tx =>
            tx.id === option.id
              ? { ...tx, status: 'completed', pnl: finalPnl }
              : tx
          )
        );

        // Update active options
        setActiveOptions(prev => prev.filter(o => o.id !== option.id));
        
        // Add to completed options
        setCompletedOptions(prev => [{
          ...newOption,
          status: wins ? 'completed' : 'failed',
          pnl: finalPnl
        }, ...prev]);

        if (wins) {
          // Add payout to wallet
          await walletService.addBalance({
            userId: user!.id,
            asset: 'USDT',
            amount: payout,
            reference: option.id,
            type: 'option_settlement'
          });
          updateBalance('USDT', payout);
          
          toast({
            title: '✅ Option Won!',
            description: `You won ${formatCurrency(payout - parsedAmount)} USDT profit!`,
          });
        } else {
          toast({
            title: '❌ Option Lost',
            description: `You lost ${formatCurrency(parsedAmount)} USDT`,
            variant: 'destructive'
          });
        }
      }, optionTime * 1000);

      // Clear form
      setAmount('');
      setPercent(0);

    } catch (error) {
      console.error('Option purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: 'Failed to purchase option. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, amount, getBalance, shouldWin, optionTime, direction, symbol, user, currentPrice, updateBalance]);

  // Format countdown for active options
  const formatCountdown = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Render force win badge
  const renderForceWinBadge = () => {
    if (userOutcome?.enabled && userOutcome.outcome_type === 'win') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
          <Crown className="w-3 h-3 mr-1" />
          Force Win Active
        </Badge>
      );
    }
    
    const activeWinWindow = activeWindows.find(w => 
      w.outcome_type === 'win' && 
      new Date(w.start_time) <= new Date() && 
      new Date(w.end_time) >= new Date()
    );

    if (activeWinWindow) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Win Window {countdown && `(${countdown})`}
        </Badge>
      );
    }

    return null;
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/trading')}
                className="lg:hidden"
              >
                <ArrowLeft className="h-5 w-5 text-[#848E9C]" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#F0B90B]" />
                <h1 className="text-xl font-bold text-[#EAECEF]">Options Trading</h1>
                {renderForceWinBadge()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              >
                {hideBalances ? <EyeOff size={18} className="text-[#848E9C]" /> : <Eye size={18} className="text-[#848E9C]" />}
              </button>
              
              <Select value={selectedAsset} onValueChange={handleAssetChange}>
                <SelectTrigger className="w-28 bg-[#1E2329] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSETS.map(asset => (
                    <SelectItem key={asset} value={asset}>
                      {asset}/USDT
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Bar */}
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-[#EAECEF] font-mono">
                ${formatPrice(currentPrice)}
              </div>
              <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </div>
            </div>
            
            <div className="flex gap-2">
              <Badge className="bg-[#2B3139] text-[#EAECEF]">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Warning */}
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg m-4 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-400">View Only Mode</p>
              <p className="text-xs text-yellow-300 mt-1">
                Please <button onClick={() => navigate('/login')} className="underline hover:text-yellow-200">login</button> to trade options
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Force Win Banner */}
      {userOutcome?.enabled && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg m-4 p-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-400">
              Force win enabled - all your options will win!
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart & Controls */}
          <div className="lg:col-span-2 space-y-4">
            {/* Chart Controls */}
            <Card className="bg-[#1E2329] border-[#2B3139] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex gap-2">
                  {TIME_RANGES.map(range => (
                    <Button
                      key={range}
                      variant={timeRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={timeRange === range ? 'bg-[#F0B90B] text-[#181A20]' : ''}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
                
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chart */}
              <div className="h-[400px]">
                {chartHistory.length > 0 || chartData ? (
                  <Chart
                    type={chartType === 'candlestick' ? 'candlestick' : 'line'}
                    data={{
                      labels: chartHistory.length > 0 
                        ? chartHistory.map((_, i) => i.toString())
                        : chartData.labels,
                      datasets: [{
                        label: symbol,
                        data: chartHistory.length > 0 
                          ? chartHistory
                          : chartType === 'candlestick' 
                            ? chartData.candleData 
                            : chartData.lineData,
                        borderColor: '#F0B90B',
                        backgroundColor: chartType === 'candlestick' 
                          ? undefined 
                          : 'rgba(240, 185, 11, 0.1)',
                        ...(chartType === 'candlestick' && {
                          borderColor: {
                            up: '#22c55e',
                            down: '#ef4444',
                            unchanged: '#888',
                          },
                          color: {
                            up: '#22c55e',
                            down: '#ef4444',
                            unchanged: '#888',
                          },
                        })
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true }
                      },
                      scales: {
                        x: {
                          grid: { color: '#2B3139' },
                          ticks: { color: '#848E9C' }
                        },
                        y: {
                          grid: { color: '#2B3139' },
                          ticks: { color: '#848E9C' }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 text-[#848E9C] animate-spin" />
                  </div>
                )}
              </div>
            </Card>

            {/* Active Options */}
            <Card className="bg-[#1E2329] border-[#2B3139] p-4">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#F0B90B]" />
                Active Options
              </h3>
              
              {activeOptions.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C]">
                  No active options. Purchase an option to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOptions.map(option => (
                    <div key={option.id} className="bg-[#181A20] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={option.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {option.direction.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-[#EAECEF]">{option.pair}</span>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-400">
                          {formatCountdown(option.expiresAt)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-[#848E9C]">Amount</div>
                          <div className="font-mono text-[#EAECEF]">{formatCurrency(option.amount)} USDT</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#848E9C]">Entry</div>
                          <div className="font-mono text-[#EAECEF]">${formatPrice(option.entryPrice)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#848E9C]">Payout</div>
                          <div className="font-mono text-green-400">{formatCurrency(option.payout)} USDT</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Trading Panel */}
          <div className="space-y-4">
            <Card className="bg-[#1E2329] border-[#F0B90B] p-6">
              <h2 className="text-xl font-bold text-[#F0B90B] mb-4">Binary Options</h2>
              
              <div className="space-y-4">
                {/* Direction Selection */}
                <div>
                  <label className="text-sm text-[#848E9C] mb-2 block">Direction</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        direction === 'up' 
                          ? 'bg-green-500/20 border-green-500 text-green-500' 
                          : 'border-[#2B3139] text-[#848E9C] hover:border-green-500/50'
                      }`}
                      onClick={() => setDirection('up')}
                    >
                      <TrendingUp size={20} />
                      <span className="font-bold">UP</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        direction === 'down' 
                          ? 'bg-red-500/20 border-red-500 text-red-500' 
                          : 'border-[#2B3139] text-[#848E9C] hover:border-red-500/50'
                      }`}
                      onClick={() => setDirection('down')}
                    >
                      <TrendingDown size={20} />
                      <span className="font-bold">DOWN</span>
                    </button>
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <label className="text-sm text-[#848E9C] mb-2 block">Expiry Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {OPTION_TIMES.map(time => {
                      const rate = PROFIT_RATES[time as keyof typeof PROFIT_RATES];
                      return (
                        <button
                          key={time}
                          className={`p-3 rounded-lg border transition-all ${
                            optionTime === time
                              ? 'bg-[#F0B90B] border-[#F0B90B] text-[#181A20]'
                              : 'bg-[#181A20] border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B]/50'
                          }`}
                          onClick={() => setOptionTime(time as OptionTime)}
                        >
                          <div className="font-bold">{time}s</div>
                          <div className="text-xs opacity-80">{rate.profit}%</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm text-[#848E9C] mb-2 block">Amount (USDT)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-[#181A20] border-[#2B3139] pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                      USDT
                    </span>
                  </div>
                </div>

                {/* Percentage Slider */}
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={percent}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPercent(val);
                      const maxAmount = getBalance('USDT');
                      setAmount((maxAmount * val / 100).toFixed(2));
                    }}
                    className="w-full h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1 text-xs text-[#848E9C]">
                    <span>0%</span>
                    <span>{percent}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#848E9C]">Available Balance</span>
                    <span className="text-[#EAECEF] font-medium">
                      {hideBalances ? '••••••' : formatCurrency(getBalance('USDT'))} USDT
                    </span>
                  </div>
                  
                  {amount && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Investment</span>
                        <span className="text-[#EAECEF] font-medium">
                          {formatCurrency(parseFloat(amount))} USDT
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Payout</span>
                        <span className="text-green-400 font-medium">
                          {formatCurrency(parseFloat(amount) * PROFIT_RATES[optionTime].payout)} USDT
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Profit</span>
                        <span className="text-green-400 font-medium">
                          +{formatCurrency(parseFloat(amount) * (PROFIT_RATES[optionTime].profit / 100))} USDT
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Purchase Button */}
                <Button
                  className="w-full py-6 text-lg font-bold bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                  onClick={handlePurchase}
                  disabled={!amount || !isAuthenticated || loading || controlsLoading}
                >
                  {loading ? 'Processing...' : 'Purchase Option'}
                </Button>

                {/* Info Tooltip */}
                <div className="flex items-center gap-2 text-xs text-[#848E9C]">
                  <Info className="h-3 w-3" />
                  <span>Options settle automatically at expiry. Payout includes your initial stake.</span>
                </div>
              </div>
            </Card>

            {/* Completed Options */}
            <Card className="bg-[#1E2329] border-[#2B3139] p-4">
              <h3 className="text-sm font-semibold text-[#EAECEF] mb-3">Recent Results</h3>
              
              {completedOptions.length === 0 ? (
                <div className="text-center py-4 text-[#848E9C] text-xs">
                  No completed options yet
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {completedOptions.slice(0, 5).map(option => (
                    <div key={option.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={option.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {option.status === 'completed' ? 'WIN' : 'LOSS'}
                        </Badge>
                        <span className="text-[#EAECEF]">{option.pair}</span>
                      </div>
                      <span className={option.pnl && option.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {option.pnl && option.pnl >= 0 ? '+' : ''}{formatCurrency(option.pnl || 0)} USDT
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}