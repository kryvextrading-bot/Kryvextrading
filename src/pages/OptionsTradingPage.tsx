// OptionsTradingPage.tsx - Fixed with proper wallet integration and admin controls
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Activity,
  Lock,
  Unlock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Chart imports
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, TimeScale } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

// Hooks
import useBinanceStream from '@/hooks/useBinanceStream';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingControl } from '@/hooks/useTradingControl';
import { useNotification } from '@/contexts/NotificationContext';

// Services
import { unifiedTradingService } from '@/services/unified-trading-service';

// Utils
import { formatPrice, formatCurrency } from '@/utils/tradingCalculations';

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

// ==================== CONSTANTS ====================

const TIME_RANGES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const;
type TimeRange = typeof TIME_RANGES[number];

const ASSETS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC'];

// Options Timeframes with correct payout calculations
const OPTIONS_TIMEFRAMES = [
  { value: 60, label: '60s', profitPercent: 18, payout: 1.18, minStake: 10, maxStake: 1000 },
  { value: 120, label: '2m', profitPercent: 25, payout: 1.25, minStake: 20, maxStake: 2000 },
  { value: 300, label: '5m', profitPercent: 45, payout: 1.45, minStake: 50, maxStake: 5000 },
  { value: 600, label: '10m', profitPercent: 65, payout: 1.65, minStake: 100, maxStake: 10000 },
  { value: 1800, label: '30m', profitPercent: 120, payout: 2.20, minStake: 200, maxStake: 20000 },
  { value: 3600, label: '1h', profitPercent: 150, payout: 2.50, minStake: 500, maxStake: 50000 },
] as const;

type OptionTime = typeof OPTIONS_TIMEFRAMES[number]['value'];

const CHART_TYPES = ['candlestick', 'line'] as const;
type ChartType = typeof CHART_TYPES[number];

// ==================== TYPES ====================

interface OptionOrder {
  id: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  exitPrice?: number;
  duration: number;
  payout: number;
  startTime: number;
  endTime: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pnl?: number;
  fee?: number;
  fluctuation?: number;
  result?: 'win' | 'loss';
  isLocked?: boolean;
}

// ==================== COMPONENTS ====================

// Countdown Timer Component
const CountdownTimer: React.FC<{ endTime: number; onExpire?: () => void }> = ({ endTime, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, endTime - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      
      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const seconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (timeLeft <= 0) return null;

  return (
    <span className={`font-mono font-bold ${
      seconds < 10 ? 'text-[#F6465D] animate-pulse' : 'text-[#F0B90B]'
    }`}>
      {hours > 0 
        ? `${hours}h ${minutes % 60}m`
        : minutes > 0 
          ? `${minutes}m ${seconds % 60}s`
          : `${seconds}s`
      }
    </span>
  );
};

// Active Option Card Component
const ActiveOptionCard: React.FC<{ 
  option: OptionOrder; 
  currentPrice: number;
  onExpire: (orderId: string) => void;
}> = ({ option, currentPrice, onExpire }) => {
  const isProfitable = (option.direction === 'UP' && currentPrice > option.entryPrice) ||
                       (option.direction === 'DOWN' && currentPrice < option.entryPrice);
  const potentialProfit = option.stake * (option.payout - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#1E2329] rounded-xl border border-[#2B3139] p-4 mb-3 hover:border-[#F0B90B]/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className={option.direction === 'UP' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}>
            {option.direction}
          </Badge>
          <span className="text-sm font-medium text-[#EAECEF]">{option.symbol}</span>
          <Lock className="w-3 h-3 text-[#F0B90B]" />
        </div>
        <CountdownTimer 
          endTime={option.endTime} 
          onExpire={() => onExpire(option.id)}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className="text-xs text-[#848E9C]">Stake</div>
          <div className="font-mono text-[#EAECEF]">${option.stake.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Entry</div>
          <div className="font-mono text-[#EAECEF]">${option.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Payout</div>
          <div className={`font-mono ${isProfitable ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            ${(option.stake * option.payout).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-[#2B3139]">
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Current Price</span>
          <span className={`font-mono ${isProfitable ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Completed Option Card Component
const CompletedOptionCard: React.FC<{ option: OptionOrder }> = ({ option }) => {
  const isWin = option.result === 'win' || (option.pnl && option.pnl > 0);
  const profitAmount = option.pnl ?? (isWin ? option.stake * (option.payout - 1) : -option.stake);

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-[#1E2329] rounded-lg p-3 mb-2 border border-[#2B3139]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={option.direction === 'UP' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}>
            {option.direction}
          </Badge>
          <span className="text-xs text-[#EAECEF]">{option.symbol}</span>
          <Badge className={isWin ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'}>
            {isWin ? 'WIN' : 'LOSS'}
          </Badge>
        </div>
        <span className={`text-xs font-mono ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
          {isWin ? '+' : ''}{profitAmount.toFixed(2)} USDT
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[#848E9C]">Stake:</span>
          <span className="ml-1 text-[#EAECEF]">${option.stake.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[#848E9C]">Entry:</span>
          <span className="ml-1 text-[#EAECEF]">${option.entryPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[#848E9C]">Exit:</span>
          <span className="ml-1 text-[#EAECEF]">${option.exitPrice?.toFixed(2) || option.entryPrice.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[#848E9C]">Time:</span>
          <span className="ml-1 text-[#EAECEF]">{formatDateTime(option.startTime)}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export default function OptionsTradingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addNotification } = useNotification();
  
  // Contexts
  const { user, isAuthenticated } = useAuth();
  const { getTradingBalance, refreshBalances } = useUnifiedWallet();
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
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Trading state
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [optionTime, setOptionTime] = useState<OptionTime>(60);
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState(0);

  // Orders state
  const [activeOptions, setActiveOptions] = useState<OptionOrder[]>([]);
  const [completedOptions, setCompletedOptions] = useState<OptionOrder[]>([]);

  // Live data
  const trade = useBinanceStream(symbol, 'trade');
  const kline = useBinanceStream(symbol, 'kline', timeRange);

  // Current price
  const currentPrice = trade?.p ? parseFloat(trade.p) : 67668.18;
  const priceChange = kline?.k ? ((parseFloat(kline.k.c) - parseFloat(kline.k.o)) / parseFloat(kline.k.o)) * 100 : 0;

  // Chart data
  const [chartData, setChartData] = useState<any>(null);
  const [chartHistory, setChartHistory] = useState<any[]>([]);

  // Get current timeframe config
  const timeframeConfig = useMemo(() => 
    OPTIONS_TIMEFRAMES.find(tf => tf.value === optionTime) || OPTIONS_TIMEFRAMES[0],
  [optionTime]);

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
    // Generate mock data for initial display
    const mockData = generateMockData(timeRange);
    setChartData(mockData);
  }, [symbol, timeRange]);

  // Load user data
  useEffect(() => {
    if (user?.id) {
      loadUserOrders();
    }
  }, [user?.id]);

  const loadUserOrders = async () => {
    try {
      setLoading(true);
      
      // Load active options
      const active = await unifiedTradingService.getActiveOptionsOrders(user!.id);
      const formattedActive: OptionOrder[] = active.map(order => ({
        id: order.id,
        symbol: order.symbol || symbol,
        direction: order.direction,
        stake: order.stake,
        entryPrice: order.entryPrice,
        duration: order.duration,
        payout: order.payoutRate || timeframeConfig.payout,
        startTime: new Date(order.startTime || order.createdAt).getTime(),
        endTime: new Date(order.endTime).getTime(),
        status: 'ACTIVE',
        fluctuation: order.fluctuationRange || 0.01,
        fee: order.fee || order.stake * 0.001,
        isLocked: true
      }));
      setActiveOptions(formattedActive);

      // Load completed options
      const completed = await unifiedTradingService.getCompletedOptionsOrders(user!.id);
      const formattedCompleted: OptionOrder[] = completed.map(order => {
        const isWin = order.pnl && order.pnl > 0;
        return {
          id: order.id,
          symbol: order.symbol || symbol,
          direction: order.direction,
          stake: order.stake,
          entryPrice: order.entryPrice,
          exitPrice: order.exitPrice,
          duration: order.duration,
          payout: order.payoutRate || timeframeConfig.payout,
          startTime: new Date(order.startTime || order.createdAt).getTime(),
          endTime: new Date(order.endTime).getTime(),
          status: 'COMPLETED',
          pnl: order.pnl,
          fee: order.fee || order.stake * 0.001,
          fluctuation: order.fluctuationRange || 0.01,
          result: isWin ? 'win' : 'loss'
        };
      });
      setCompletedOptions(formattedCompleted);
    } catch (error) {
      console.error('Failed to load orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle order expiration
  const handleOrderExpire = useCallback(async (orderId: string) => {
    if (processingOrder) return;
    
    setProcessingOrder(orderId);
    try {
      const result = await unifiedTradingService.expireOptionsTrade(orderId);
      
      if (result.success) {
        // Find the expired order
        const expiredOrder = activeOptions.find(o => o.id === orderId);
        if (expiredOrder) {
          // Remove from active
          setActiveOptions(prev => prev.filter(o => o.id !== orderId));
          
          // Create completed order
          const completedOrder: OptionOrder = {
            ...expiredOrder,
            status: 'COMPLETED',
            exitPrice: result.exitPrice || currentPrice,
            pnl: result.profit || 0,
            result: result.result === 'win' ? 'win' : 'loss',
            isLocked: false,
            endTime: Date.now()
          };
          
          // Add to completed (avoid duplicates)
          setCompletedOptions(prev => {
            const exists = prev.some(o => o.id === orderId);
            if (exists) return prev;
            return [completedOrder, ...prev];
          });
          
          // Refresh balances to update locked funds
          await refreshBalances();

          // Add notification
          if (result.result === 'win') {
            addNotification({
              type: 'success',
              title: 'Option Won! 🎉',
              message: `+$${result.profit?.toFixed(2)} USDT profit`,
              duration: 5000
            });
          } else {
            addNotification({
              type: 'error',
              title: 'Option Lost',
              message: `-$${Math.abs(result.profit || 0).toFixed(2)} USDT`,
              duration: 5000
            });
          }
        }
      }
    } catch (error) {
      console.error('Error expiring order:', error);
      toast({
        title: 'Error',
        description: 'Failed to settle option',
        variant: 'destructive'
      });
    } finally {
      setProcessingOrder(null);
    }
  }, [activeOptions, currentPrice, refreshBalances, processingOrder, addNotification, toast]);

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

    if (parsedAmount < timeframeConfig.minStake || parsedAmount > timeframeConfig.maxStake) {
      toast({
        title: 'Invalid Stake',
        description: `Amount must be between $${timeframeConfig.minStake} and $${timeframeConfig.maxStake}`,
        variant: 'destructive'
      });
      return;
    }

    const balance = getTradingBalance('USDT');
    if (parsedAmount > balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You need $${parsedAmount.toFixed(2)} USDT but have $${balance.toFixed(2)} USDT`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Check if option should win based on admin settings
      const wins = await shouldWin('options');
      
      const expiresAt = Date.now() + optionTime * 1000;

      // Execute trade
      const result = await unifiedTradingService.executeTrade({
        type: 'options',
        data: {
          symbol,
          direction,
          amount: parsedAmount,
          duration: optionTime,
          fluctuation: 0.01,
          premium: parsedAmount
        },
        userId: user!.id
      });

      if (result.success && result.trade) {
        // Add to active options
        const newOrder: OptionOrder = {
          id: result.trade.id,
          symbol,
          direction,
          stake: parsedAmount,
          entryPrice: currentPrice,
          duration: optionTime,
          payout: timeframeConfig.payout,
          startTime: Date.now(),
          endTime: expiresAt,
          status: 'ACTIVE',
          fluctuation: 0.01,
          fee: parsedAmount * 0.001,
          isLocked: true
        };
        
        setActiveOptions(prev => {
          const exists = prev.some(o => o.id === newOrder.id);
          if (exists) return prev;
          return [newOrder, ...prev];
        });
        
        // Refresh balances to show locked funds
        await refreshBalances();

        // Show success toast with win/loss info
        toast({
          title: wins ? '🎯 Option Purchased (Force Win)' : '📊 Option Purchased',
          description: (
            <div>
              <div>${parsedAmount.toFixed(2)} USDT locked</div>
              <div className="text-xs text-[#0ECB81] mt-1">
                Potential profit: +${(parsedAmount * (timeframeConfig.payout - 1)).toFixed(2)}
              </div>
              {wins && (
                <div className="text-xs text-[#F0B90B] mt-1">
                  👑 Force win enabled
                </div>
              )}
            </div>
          ),
        });

        // Schedule settlement
        setTimeout(async () => {
          await handleOrderExpire(result.trade.id);
        }, optionTime * 1000);

        // Clear form
        setAmount('');
        setPercent(0);
      }
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
  }, [isAuthenticated, amount, timeframeConfig, getTradingBalance, shouldWin, optionTime, direction, symbol, user, currentPrice, refreshBalances, handleOrderExpire, toast]);

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

  // Generate mock chart data
  const generateMockData = (timeRange: TimeRange) => {
    const points = timeRange === '1m' ? 60 : 
                   timeRange === '5m' ? 48 : 
                   timeRange === '15m' ? 32 : 
                   timeRange === '30m' ? 30 : 
                   timeRange === '1h' ? 24 : 
                   timeRange === '4h' ? 18 : 
                   timeRange === '1d' ? 14 : 30;

    const basePrice = 67668.18;
    const volatility = 0.02;
    
    const labels = [];
    const candleData = [];
    const lineData = [];
    
    let currentPrice = basePrice;
    
    for (let i = 0; i < points; i++) {
      const time = new Date(Date.now() - (points - i) * 60000);
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
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

  return (
    <motion.div 
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF] pb-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#1E2329]/95 backdrop-blur border-b border-[#2B3139]">
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
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
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
              <div className={`text-sm ${priceChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
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
      {userOutcome?.enabled && userOutcome.outcome_type === 'win' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg m-4 p-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-400">
              👑 Force win enabled - all your options will win!
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
                      className={timeRange === range ? 'bg-[#F0B90B] text-[#0B0E11]' : 'border-[#2B3139] text-[#848E9C]'}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
                
                <Select value={chartType} onValueChange={(v: any) => setChartType(v)}>
                  <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139]">
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
                        : chartData?.labels || [],
                      datasets: [{
                        label: symbol,
                        data: chartHistory.length > 0 
                          ? chartHistory
                          : chartType === 'candlestick' 
                            ? chartData?.candleData || []
                            : chartData?.lineData || [],
                        borderColor: '#F0B90B',
                        backgroundColor: chartType === 'candlestick' 
                          ? undefined 
                          : 'rgba(240, 185, 11, 0.1)',
                        ...(chartType === 'candlestick' && {
                          borderColor: {
                            up: '#0ECB81',
                            down: '#F6465D',
                            unchanged: '#848E9C',
                          },
                          color: {
                            up: '#0ECB81',
                            down: '#F6465D',
                            unchanged: '#848E9C',
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
                Active Options ({activeOptions.length})
              </h3>
              
              {activeOptions.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C]">
                  No active options. Purchase an option to get started.
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence>
                    {activeOptions.map(option => (
                      <ActiveOptionCard
                        key={option.id}
                        option={option}
                        currentPrice={currentPrice}
                        onExpire={handleOrderExpire}
                      />
                    ))}
                  </AnimatePresence>
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
                        direction === 'UP' 
                          ? 'bg-[#0ECB81]/20 border-[#0ECB81] text-[#0ECB81]' 
                          : 'border-[#2B3139] text-[#848E9C] hover:border-[#0ECB81]/50'
                      }`}
                      onClick={() => setDirection('UP')}
                    >
                      <TrendingUp size={20} />
                      <span className="font-bold">UP</span>
                    </button>
                    <button
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        direction === 'DOWN' 
                          ? 'bg-[#F6465D]/20 border-[#F6465D] text-[#F6465D]' 
                          : 'border-[#2B3139] text-[#848E9C] hover:border-[#F6465D]/50'
                      }`}
                      onClick={() => setDirection('DOWN')}
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
                    {OPTIONS_TIMEFRAMES.map(time => (
                      <button
                        key={time.value}
                        className={`p-3 rounded-lg border transition-all ${
                          optionTime === time.value
                            ? 'bg-[#F0B90B] border-[#F0B90B] text-[#0B0E11]'
                            : 'bg-[#2B3139] border-[#3A3F4A] text-[#848E9C] hover:border-[#F0B90B]/50'
                        }`}
                        onClick={() => setOptionTime(time.value as OptionTime)}
                      >
                        <div className="font-bold">{time.label}</div>
                        <div className="text-xs opacity-80">{time.profitPercent}%</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stake Range Info */}
                <div className="flex justify-between text-xs text-[#848E9C]">
                  <span>Min: ${timeframeConfig.minStake}</span>
                  <span>Max: ${timeframeConfig.maxStake}</span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="text-sm text-[#848E9C] mb-2 block">Stake (USDT)</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setPercent(0);
                      }}
                      placeholder={`Min $${timeframeConfig.minStake}`}
                      className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] pr-16"
                      min={timeframeConfig.minStake}
                      max={timeframeConfig.maxStake}
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
                      const maxAmount = timeframeConfig.maxStake;
                      setAmount((maxAmount * val / 100).toFixed(2));
                    }}
                    className="w-full h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer accent-[#F0B90B]"
                  />
                  <div className="flex justify-between mt-1 text-xs text-[#848E9C]">
                    <span>0%</span>
                    <span>{percent}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="bg-[#2B3139] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#848E9C]">Available Balance</span>
                    <span className="text-[#EAECEF] font-medium">
                      {hideBalances ? '••••••' : getTradingBalance('USDT').toFixed(2)} USDT
                    </span>
                  </div>
                  
                  {amount && parseFloat(amount) > 0 && (
                    <>
                      <div className="flex justify-between text-sm pt-2 border-t border-[#3A3F4A]">
                        <span className="text-[#848E9C]">Stake (Locked)</span>
                        <span className="text-[#EAECEF] font-medium">
                          ${parseFloat(amount).toFixed(2)} USDT
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Return</span>
                        <span className="text-[#0ECB81] font-medium">
                          ${(parseFloat(amount) * timeframeConfig.payout).toFixed(2)} USDT
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Profit</span>
                        <span className="text-[#0ECB81] font-medium">
                          +${(parseFloat(amount) * (timeframeConfig.payout - 1)).toFixed(2)} USDT
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Purchase Button */}
                <Button
                  className="w-full py-6 text-lg font-bold bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11]"
                  onClick={handlePurchase}
                  disabled={!amount || !isAuthenticated || loading || controlsLoading || parseFloat(amount) < timeframeConfig.minStake}
                >
                  {loading ? 'Processing...' : 'Purchase Option'}
                </Button>

                {/* Info Tooltip */}
                <div className="flex items-center gap-2 text-xs text-[#848E9C]">
                  <Info className="h-3 w-3 flex-shrink-0" />
                  <span>Funds are locked until option expiry. Payout includes your initial stake.</span>
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
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {completedOptions.slice(0, 5).map(option => (
                    <CompletedOptionCard key={option.id} option={option} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
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
        
        input[type="range"] {
          -webkit-appearance: none;
          background: #2B3139;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: #F0B90B;
          border-radius: 50%;
          cursor: pointer;
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