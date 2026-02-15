import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/trading.css';
import { 
  ArrowLeft, 
  TrendingUp, 
  Wallet, 
  Activity, 
  BarChart3,
  RefreshCw,
  History,
  ChevronDown,
  X,
  Star,
  Settings,
  Menu,
  Layers,
  Clock,
  Zap,
  Crown,
  AlertTriangle,
  Info,
  Copy,
  ExternalLink,
  Shield,
  Gauge,
  Flame,
  Sparkles,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  CandlestickChart,
  LineChart,
  PieChart,
  Filter,
  Download,
  Eye,
  EyeOff,
  Bell,
  User,
  LogOut,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Grid,
  List,
  BookOpen,
  TrendingDown,
  Rocket,
  Target,
  Award,
  Gift,
  Heart,
  Share2,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Send,
  Paperclip,
  Image,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileUnknown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Countdown from 'react-countdown';
import { CountdownTimer } from '@/components/CountdownTimer';

// Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import TradingViewWidget from '@/components/TradingViewWidget';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import OrderHistoryTable from '@/components/trading/OrderHistoryTable';
import PositionCard from '@/components/trading/PositionCard';
import LeverageSelector from '@/components/trading/LeverageSelector';
import ProfitLossDisplay from '@/components/trading/ProfitLossDisplay';
import EnhancedPairSelectorModal from '@/components/EnhancedPairSelectorModal';
import WalletTransfer from '@/components/WalletTransfer';

// Hooks
import { useUnifiedTrading } from '@/hooks/useUnifiedTrading';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useTradingControl } from '@/hooks/useTradingControl';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useRecentTrades } from '@/hooks/useRecentTrades';

// Services
import { tradingDataService } from '@/services/trading-data-service';
import { unifiedTradingService } from '@/services/unified-trading-service';

// Utils
import { formatPrice, formatCurrency, formatPercentage, calculatePnL } from '@/utils/tradingCalculations';

// Types
import { TradeType, AnyTrade, SpotTrade, FuturesTrade, OptionsTrade } from '@/types/trading-unified';

// Constants
const TRADING_PAIRS = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: 67000, change: 2.34, volume: 1250000000, high: 68500, low: 66500 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: 3500, change: 1.56, volume: 800000000, high: 3550, low: 3450 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', price: 580, change: -0.45, volume: 200000000, high: 585, low: 575 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', price: 145, change: 3.21, volume: 150000000, high: 148, low: 142 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', price: 0.52, change: 0.78, volume: 50000000, high: 0.53, low: 0.51 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', price: 0.78, change: 1.23, volume: 80000000, high: 0.79, low: 0.77 },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', price: 0.15, change: -1.45, volume: 30000000, high: 0.152, low: 0.148 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', price: 12.5, change: 2.1, volume: 25000000, high: 12.8, low: 12.3 },
];

const OPTIONS_TIMEFRAMES = [
  { label: '30s', value: 30, profit: 15, color: 'from-green-500 to-emerald-500' },
  { label: '1m', value: 60, profit: 18, color: 'from-emerald-500 to-teal-500' },
  { label: '2m', value: 120, profit: 22, color: 'from-teal-500 to-cyan-500' },
  { label: '5m', value: 300, profit: 25, color: 'from-cyan-500 to-sky-500' },
  { label: '15m', value: 900, profit: 30, color: 'from-sky-500 to-blue-500' },
  { label: '30m', value: 1800, profit: 35, color: 'from-blue-500 to-indigo-500' },
];

const PROFIT_RATES = {
  30: { payout: 0.85, profit: 15 },
  60: { payout: 0.82, profit: 18 },
  120: { payout: 0.78, profit: 22 },
  300: { payout: 0.75, profit: 25 },
  900: { payout: 0.70, profit: 30 },
  1800: { payout: 0.65, profit: 35 },
};

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 33, 50, 100];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 }
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 }
};

interface TradingFormState {
  spot: {
    side: 'buy' | 'sell';
    orderType: 'market' | 'limit' | 'stop';
    price: string;
    amount: string;
    percent: number;
  };
  futures: {
    side: 'long' | 'short';
    positionType: 'open' | 'close';
    orderType: 'market' | 'limit' | 'stop';
    price: string;
    amount: string;
    percent: number;
    leverage: number;
    takeProfit?: string;
    stopLoss?: string;
  };
  options: {
    direction: 'up' | 'down';
    timeFrame: number;
    amount: string;
    percent: number;
  };
}

interface ActiveOptionsTrade {
  id: string;
  amount: number;
  direction: 'up' | 'down';
  timeFrame: number;
  payoutRate: number;
  expiresAt: number;
}

// Countdown renderer
const CountdownRenderer = ({ hours, minutes, seconds, completed }: any) => {
  if (completed) {
    return <span className="text-red-400 font-bold">Expired</span>;
  }
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  if (totalSeconds > 60) {
    return (
      <span className="text-blue-400 font-mono font-bold">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  }
  
  return (
    <span className="text-yellow-400 font-mono font-bold animate-pulse">
      {seconds}s
    </span>
  );
};

export default function Trading() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Use the updated unified wallet hook with trading wallet support
  const { 
    balances: fundingBalances, 
    tradingBalances,
    getBalance: getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    transferToTrading,
    transferToFunding,
    refreshData,
    loading: walletLoading,
    lockBalance,
    unlockBalance,
    stats,
    locks
  } = useUnifiedWallet();
  
  const { 
    executeTrade, 
    getUserTrades, 
    getUserPositions, 
    getUserOptions,
    closeFuturesPosition,
    loading: tradingLoading 
  } = useUnifiedTrading();
  
  const {
    userOutcome,
    activeWindows,
    systemSettings,
    countdown: adminCountdown,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();

  // UI State
  const [activeTab, setActiveTab] = useState<'spot' | 'futures' | 'options'>('spot');
  const [pairSelectorOpen, setPairSelectorOpen] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const [selectedPair, setSelectedPair] = useState(TRADING_PAIRS[0]);
  const [formState, setFormState] = useState<TradingFormState>({
    spot: { side: 'buy', orderType: 'market', price: '', amount: '', percent: 0 },
    futures: { side: 'long', positionType: 'open', orderType: 'market', price: '', amount: '', percent: 0, leverage: 10 },
    options: { timeFrame: 60, amount: '', direction: 'up', percent: 0 }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [showRecentTrades, setShowRecentTrades] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOptionsTrade, setActiveOptionsTrade] = useState<{
    id: string;
    amount: number;
    direction: string;
    timeFrame: number;
    payoutRate: number;
    expiresAt: number;
  } | null>(null);
  const [optionsResult, setOptionsResult] = useState<'win' | 'loss' | null>(null);
  const [optionsPayout, setOptionsPayout] = useState<number | null>(null);

  // Data State
  const [userTrades, setUserTrades] = useState<AnyTrade[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [tradingLocks, setTradingLocks] = useState<any[]>([]);
  const [tradingStats, setTradingStats] = useState({ activeLocks: 0, totalLockedAmount: 0 });

  // Live Data
  const { currentPrice, priceChange24h, isLoading: priceLoading } = useBinanceStream(selectedPair?.symbol || 'BTCUSDT');
  const { orderBook, loading: orderBookLoading } = useOrderBook(selectedPair?.symbol || 'BTCUSDT');
  const { recentTrades, loading: tradesLoading } = useRecentTrades(selectedPair?.symbol || 'BTCUSDT');

  // Ensure orderBook has safe defaults
  const safeOrderBook = {
    bids: orderBook?.bids || [],
    asks: orderBook?.asks || [],
    spread: orderBook?.spread || null,
    lastUpdateId: orderBook?.lastUpdateId || 0
  };

  // Ensure recentTrades has safe defaults
  const safeRecentTrades = recentTrades || [];

  // Load user data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  const loadUserData = useCallback(async () => {
  if (!user?.id) return;
  
  try {
    // Get trades from unified trading service
    const trades = await getUserTrades(user.id);
    
    // Get positions
    const positionsData = await getUserPositions();
    
    // Get options
    const optionsData = await getUserOptions();
    
    // Get locks and stats
    const locks = await tradingDataService.getUserTradingLocks(user.id);
    const stats = await tradingDataService.getTradingStats(user.id);
    
    setUserTrades(trades || []);
    setPositions(positionsData || []);
    setOptions(optionsData || []);
    setTradingLocks(locks || []);
    setTradingStats(stats || { activeLocks: 0, totalLockedAmount: 0 });
    
    
    // Log sample for debugging
    if (trades && trades.length > 0) {
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
    // Set empty states on error
    setUserTrades([]);
    setPositions([]);
    setOptions([]);
    setTradingLocks([]);
    setTradingStats({ activeLocks: 0, totalLockedAmount: 0 });
  }
}, [user?.id, getUserTrades, getUserPositions, getUserOptions]);

  // Handlers
  const handlePairSelect = (pair: typeof TRADING_PAIRS[0]) => {
    setSelectedPair(pair);
    setPairSelectorOpen(false);
  };

  const handleSpotTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { side, orderType, price, amount } = formState.spot;
    const parsedAmount = parseFloat(amount);
    const parsedPrice = orderType === 'market' ? (currentPrice || 67000) : parseFloat(price);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const total = parsedAmount * parsedPrice;
    
    // ✅ Use trading wallet balance for trading
    const tradingBalance = getTradingBalance('USDT');
    
    if (total > tradingBalance) {
      toast.error(`Insufficient trading balance. Need ${formatCurrency(total)} USDT. You have ${formatCurrency(tradingBalance)} USDT in trading wallet. Please transfer funds from your funding wallet.`);
      return;
    }

    setLoading(true);

    try {
      const result = await executeTrade('spot', {
        pair: selectedPair.symbol,
        side,
        amount: parsedAmount,
        price: parsedPrice,
        orderType
      });

      if (result.success) {
        setFormState(prev => ({
          ...prev,
          spot: { ...prev.spot, amount: '', price: '', percent: 0 }
        }));
        await refreshData();
        await loadUserData();
        
        toast.success(
          result.transaction?.pnl && result.transaction.pnl > 0 
            ? `✅ Won ${formatCurrency(result.transaction.pnl)} USDT!` 
            : 'Trade executed successfully'
        );
      }
    } catch (error) {
      console.error('Trade failed:', error);
      toast.error('Trade execution failed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, formState.spot, currentPrice, getTradingBalance, selectedPair.symbol, executeTrade, refreshData]);

  const handleFuturesTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { side, orderType, price, amount, leverage } = formState.futures;
    const parsedAmount = parseFloat(amount);
    const parsedPrice = orderType === 'market' ? (currentPrice || 67000) : parseFloat(price);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const margin = parsedAmount / leverage;
    
    // ✅ Use trading wallet balance for trading
    const tradingBalance = getTradingBalance('USDT');
    
    if (margin > tradingBalance) {
      toast.error(`Insufficient trading balance. Need ${formatCurrency(margin)} USDT. You have ${formatCurrency(tradingBalance)} USDT in trading wallet. Please transfer funds from your funding wallet.`);
      return;
    }

    setLoading(true);

    try {
      const result = await executeTrade('futures', {
        symbol: selectedPair.symbol,
        side,
        amount: parsedAmount,
        price: parsedPrice,
        leverage,
        orderType
      });

      if (result.success) {
        setFormState(prev => ({
          ...prev,
          futures: { ...prev.futures, amount: '', price: '', percent: 0 }
        }));
        await refreshData();
        await loadUserData();
        
        toast.success('Position opened successfully');
      }
    } catch (error) {
      console.error('Futures trade failed:', error);
      toast.error('Failed to open position');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, formState.futures, currentPrice, getTradingBalance, selectedPair.symbol, executeTrade, refreshData]);

  const handleOptionsTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { direction, timeFrame, amount } = formState.options;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // ✅ Use trading wallet balance for trading
    const tradingBalance = getTradingBalance('USDT');
    
    if (parsedAmount > tradingBalance) {
      toast.error(`Insufficient trading balance. Need ${formatCurrency(parsedAmount)} USDT. You have ${formatCurrency(tradingBalance)} USDT in trading wallet. Please transfer funds from your funding wallet.`);
      return;
    }

    setLoading(true);

    const rate = PROFIT_RATES[timeFrame as keyof typeof PROFIT_RATES]?.payout || 0.85;
    const expiresAt = Date.now() + timeFrame * 1000;
      
    try {
      const result = await executeTrade('options', {
        symbol: selectedPair.symbol,
        direction,
        premium: parsedAmount,
        price: currentPrice || 67000,
        timeFrame,
        payoutRate: rate
      });

      console.log('[Trading] executeTrade result:', result);

      if (result.success && result.tradeId) {
      // Set active options trade for countdown
      setActiveOptionsTrade({
        id: result.tradeId,
        amount: parsedAmount,
        direction,
        timeFrame,
        payoutRate: rate,
        expiresAt
      });
      
      setFormState(prev => ({
        ...prev,
        options: { ...prev.options, amount: '', percent: 0 }
      }));
      
      // Refresh data immediately to show new trade
      await refreshData();
      await loadUserData();
      
      toast.success('Option purchased successfully');
    } else {
      throw new Error(result.error || 'Trade execution failed');
    }
    } catch (error) {
      console.error('Options trade failed:', error);
      toast.error('Failed to purchase option');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, formState.options, getTradingBalance, selectedPair.symbol, currentPrice, executeTrade, refreshData]);

  const handleOptionsExpiration = useCallback(async (tradeId: string) => {
  if (!activeOptionsTrade) return;
  
  try {
    console.log('⏰ [Trading] Handling options expiration:', tradeId);
    
    // Try to get the trade from the service
    let result;
    try {
      result = await unifiedTradingService.expireOptionsTrade(tradeId);
    } catch (error) {
      console.error('Error expiring trade:', error);
      // If API fails, determine outcome locally based on admin settings
      console.log('🔍 [Trading] Fallback - userOutcome:', userOutcome);
      const wins = userOutcome?.enabled && userOutcome?.outcome_type === 'win' || Math.random() > 0.4; // 60% win rate for demo
      console.log('🔍 [Trading] Fallback - calculated wins:', wins);
      result = {
        success: true,
        result: wins ? 'win' : 'loss',
        profit: wins ? activeOptionsTrade.amount * activeOptionsTrade.payoutRate - activeOptionsTrade.amount : -activeOptionsTrade.amount
      };
      console.log('🔍 [Trading] Fallback - result:', result);
    }
    
    if (result.success) {
      const profit = result.profit || (result.result === 'win' 
        ? activeOptionsTrade.amount * activeOptionsTrade.payoutRate - activeOptionsTrade.amount 
        : -activeOptionsTrade.amount);
      
      setOptionsResult(result.result);
      setOptionsPayout(profit);
      
      // Show toast notification
      if (result.result === 'win') {
        toast.success(`🎉 Options Win! +$${profit.toFixed(2)} USDT`);
      } else {
        toast.error(`💔 Options Loss. -$${activeOptionsTrade.amount} USDT`);
      }
      
      // Refresh data to show completed trade
      await refreshData();
      await loadUserData();
      
      // Clear active trade after showing result
      setTimeout(() => {
        setActiveOptionsTrade(null);
        setOptionsResult(null);
        setOptionsPayout(null);
      }, 5000);
    }
  } catch (error) {
    console.error('Error handling options expiration:', error);
    toast.error('Failed to process options expiration');
  }
}, [activeOptionsTrade, refreshData, loadUserData, userOutcome]);

  // Add effect to set expiration timeout for active options trades
  useEffect(() => {
    if (activeOptionsTrade) {
      const timeoutId = setTimeout(() => {
        handleOptionsExpiration(activeOptionsTrade.id);
      }, activeOptionsTrade.timeFrame * 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeOptionsTrade, handleOptionsExpiration]);

  // Add useEffect to monitor userTrades changes
  useEffect(() => {
    console.log('📋 [Trading] userTrades updated:', userTrades.length, 'trades');
    if (userTrades.length > 0) {
      console.log('📋 [Trading] Sample trade:', userTrades[0]);
    }
  }, [userTrades]);

  const handleClosePosition = async (positionId: string) => {
    try {
      await closeFuturesPosition(positionId, currentPrice || 67000);
      await loadUserData();
      toast.success('Position closed successfully');
    } catch (error) {
      console.error('Failed to close position:', error);
      toast.error('Failed to close position');
    }
  };

  const handleTransferToTrading = async (asset: string, amount: number) => {
    try {
      const result = await transferToTrading(asset, amount);
      if (result.success) {
        toast.success(`Successfully transferred ${formatCurrency(amount)} ${asset} to trading wallet`);
        await refreshData();
      } else {
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  const handleTransferToFunding = async (asset: string, amount: number) => {
    try {
      const result = await transferToFunding(asset, amount);
      if (result.success) {
        toast.success(`Successfully transferred ${formatCurrency(amount)} ${asset} to funding wallet`);
        await refreshData();
      } else {
        toast.error(result.error || 'Transfer failed');
      }
    } catch (error) {
      toast.error('Transfer failed');
    }
  };

  // Get trading pair stats
  const pairStats = useMemo(() => {
    const pair = TRADING_PAIRS.find(p => p.symbol === selectedPair.symbol);
    return {
      volume: pair?.volume || 0,
      high: pair?.high || 0,
      low: pair?.low || 0,
      change: priceChange24h || 0
    };
  }, [selectedPair, priceChange24h]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] via-[#0F1217] to-[#1A1D24]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F0B90B]/5 via-transparent to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B90B]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-50 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139] shadow-lg"
      >
        <div className="px-4 sm:px-6 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left Section - Back Button and Pair Selector */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/')}
                className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all shrink-0"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5 text-[#848E9C]" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPairSelectorOpen(true)}
                className="flex items-center gap-3 px-4 py-2.5 bg-[#1E2329] hover:bg-[#2B3139] rounded-xl transition-all group relative overflow-hidden flex-1 min-w-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B90B]/0 via-[#F0B90B]/10 to-[#F0B90B]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="flex flex-col items-start relative z-10 min-w-0">
                  <div className="flex items-center gap-2 w-full">
                    <h2 className="text-lg sm:text-xl font-bold text-[#EAECEF] group-hover:text-[#F0B90B] transition-colors truncate">
                      {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                    </h2>
                    <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 text-xs px-2 py-0.5">
                      Perp
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {priceLoading ? (
                      <Skeleton className="h-5 w-24" />
                    ) : (
                      <>
                        <motion.span 
                          key={currentPrice}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`text-sm sm:text-base font-mono font-medium ${
                            priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          ${formatPrice(currentPrice || 67000)}
                        </motion.span>
                        <motion.div
                          animate={{ rotate: priceChange24h >= 0 ? 0 : 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Badge className={`${
                            priceChange24h >= 0 
                              ? 'bg-green-500/15 text-green-400 border-green-500/20' 
                              : 'bg-red-500/15 text-red-400 border-red-500/20'
                          } text-xs font-medium`}>
                            {priceChange24h >= 0 ? '+' : ''}{(priceChange24h || 0).toFixed(2)}%
                          </Badge>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-[#848E9C] group-hover:text-[#F0B90B] transition-colors relative z-10 shrink-0" />
              </motion.button>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setHideBalances(!hideBalances)}
                      className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all"
                    >
                      {hideBalances ? 
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-[#848E9C]" /> : 
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#848E9C]" />
                      }
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF]">
                    <p>{hideBalances ? 'Show' : 'Hide'} balances</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowTransfer(true)}
                      className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all relative group"
                    >
                      <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#F0B90B]" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B90B] rounded-full group-hover:animate-ping"></span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF]">
                    <p>Transfer between wallets</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={refreshData}
                      className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all"
                      disabled={walletLoading}
                    >
                      <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-[#848E9C] ${walletLoading ? 'animate-spin' : ''}`} />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF]">
                    <p>Refresh balances</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all hidden sm:block"
                    >
                      <Settings className="w-5 h-5 text-[#848E9C]" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF]">
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2.5 hover:bg-[#23262F] rounded-xl transition-all sm:hidden"
              >
                <Settings className="w-4 h-4 text-[#848E9C]" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#F0B90B]/20 transition-all shrink-0"
              >
                <span className="text-sm font-bold text-[#181A20]">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </motion.button>
            </div>
          </div>

          {/* Chart Controls Row - Mobile */}
          <div className="flex items-center justify-between gap-2 mt-4 lg:hidden">
            <div className="flex items-center gap-1 bg-[#1E2329] p-1 rounded-xl flex-1">
              <button
                onClick={() => setChartType('candlestick')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  chartType === 'candlestick' 
                    ? 'bg-[#F0B90B] text-[#181A20] shadow-lg shadow-[#F0B90B]/20' 
                    : 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
                }`}
              >
                <CandlestickChart className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  chartType === 'line' 
                    ? 'bg-[#F0B90B] text-[#181A20] shadow-lg shadow-[#F0B90B]/20' 
                    : 'text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
                }`}
              >
                <LineChart className="w-4 h-4 mx-auto" />
              </button>
            </div>
            
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-[#1E2329] text-[#EAECEF] text-sm font-medium px-3 py-2 rounded-xl hover:bg-[#2B3139] transition-colors cursor-pointer border border-[#2B3139] focus:outline-none focus:ring-1 focus:ring-[#F0B90B]"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
            
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="p-2.5 bg-[#1E2329] rounded-xl text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] transition-all border border-[#2B3139]"
            >
              {chartExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Tabs */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <TabsList className="grid grid-cols-3 bg-[#1E2329] p-1.5 rounded-xl">
                <TabsTrigger 
                  value="spot" 
                  className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] data-[state=active]:shadow-lg data-[state=active]:shadow-[#F0B90B]/20 rounded-lg transition-all text-sm font-medium py-3"
                >
                  Spot
                </TabsTrigger>
                <TabsTrigger 
                  value="futures" 
                  className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] data-[state=active]:shadow-lg data-[state=active]:shadow-[#F0B90B]/20 rounded-lg transition-all text-sm font-medium py-3"
                >
                  Futures
                </TabsTrigger>
                <TabsTrigger 
                  value="options" 
                  className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] data-[state=active]:shadow-lg data-[state=active]:shadow-[#F0B90B]/20 rounded-lg transition-all text-sm font-medium py-3"
                >
                  Options
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Status Banners */}
        <AnimatePresence>
          {!isAuthenticated && (
            <motion.div
              variants={slideInLeft}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4"
            >
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-yellow-400">View Only Mode</h3>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      You're viewing in read-only mode. 
                      <button 
                        onClick={() => navigate('/login')}
                        className="underline hover:text-yellow-200 ml-1 font-medium transition-colors"
                      >
                        Login
                      </button> to trade.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeWindows.length > 0 && (
            <motion.div
              variants={slideInRight}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4"
            >
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-400">Active Trading Windows</h3>
                      <p className="text-sm text-amber-300/80 mt-1">
                        {activeWindows.map(w => w.outcome_type.toUpperCase()).join(' • ')}
                      </p>
                    </div>
                  </div>
                  {adminCountdown && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs px-3 py-1.5 rounded-lg">
                      <Clock className="w-3 h-3 mr-1.5" />
                      {adminCountdown}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Options Countdown */}
          {activeTab === 'options' && activeOptionsTrade && (
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4"
            >
              <div className={`bg-gradient-to-r rounded-2xl p-4 backdrop-blur-sm border ${
                optionsResult === 'win' ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' :
                optionsResult === 'loss' ? 'from-red-500/10 to-rose-500/10 border-red-500/20' :
                'from-blue-500/10 to-purple-500/10 border-blue-500/20'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      optionsResult === 'win' ? 'bg-green-500/20' :
                      optionsResult === 'loss' ? 'bg-red-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      {optionsResult === 'win' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : optionsResult === 'loss' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <h3 className={`text-sm font-semibold ${
                        optionsResult === 'win' ? 'text-green-400' :
                        optionsResult === 'loss' ? 'text-red-400' :
                        'text-blue-400'
                      }`}>
                        {optionsResult === 'win' ? 'Trade Won!' :
                         optionsResult === 'loss' ? 'Trade Lost' :
                         'Options Trade in Progress'}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        optionsResult === 'win' ? 'text-green-300/80' :
                        optionsResult === 'loss' ? 'text-red-300/80' :
                        'text-blue-300/80'
                      }`}>
                        {optionsResult === 'win' ? `Profit: +$${optionsPayout?.toFixed(2)} USDT` :
                         optionsResult === 'loss' ? `Loss: -$${activeOptionsTrade.amount} USDT` :
                         `${activeOptionsTrade.direction === 'up' ? '📈 Call' : '📉 Put'} • $${activeOptionsTrade.amount}`}
                      </p>
                    </div>
                  </div>
                  {!optionsResult && (
                    <Countdown
                      date={activeOptionsTrade.expiresAt}
                      renderer={CountdownRenderer}
                    />
                  )}
                  {optionsResult && (
                    <Badge className={`${
                      optionsResult === 'win' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    } text-xs px-3 py-1.5 rounded-lg font-semibold`}>
                      {optionsResult === 'win' ? 'WIN' : 'LOSS'}
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Toggle Buttons */}
        <div className="flex gap-3 mb-5 lg:hidden">
          <Button
            variant="outline"
            size="lg"
            className={`flex-1 rounded-xl text-sm font-medium ${
              showOrderBook 
                ? 'bg-[#F0B90B] text-[#181A20] border-[#F0B90B] hover:bg-[#F0B90B]/90' 
                : 'border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
            }`}
            onClick={() => setShowOrderBook(!showOrderBook)}
          >
            <Layers className="w-4 h-4 mr-2" />
            {showOrderBook ? 'Hide' : 'Show'} Order Book
          </Button>
          <Button
            variant="outline"
            size="lg"
            className={`flex-1 rounded-xl text-sm font-medium ${
              showRecentTrades 
                ? 'bg-[#F0B90B] text-[#181A20] border-[#F0B90B] hover:bg-[#F0B90B]/90' 
                : 'border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
            }`}
            onClick={() => setShowRecentTrades(!showRecentTrades)}
          >
            <Activity className="w-4 h-4 mr-2" />
            {showRecentTrades ? 'Hide' : 'Show'} Trades
          </Button>
        </div>

        {/* Main Grid */}
        <motion.div 
          variants={staggerChildren}
          initial="initial"
          animate="animate"
          className={`grid grid-cols-1 lg:grid-cols-12 gap-5`}
        >
          {/* Left Column - Chart */}
          <motion.div 
            variants={fadeInUp}
            className={`${chartExpanded ? 'lg:col-span-9' : 'lg:col-span-8'} space-y-5`}
          >
            <Card className="bg-[#1E2329] border-[#2B3139] overflow-hidden group hover:border-[#F0B90B]/30 transition-all duration-300 rounded-2xl">
              <div className="p-4 sm:p-5 border-b border-[#2B3139] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-[#F0B90B]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#EAECEF]">
                      {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                    </h2>
                    <p className="text-xs text-[#848E9C] mt-0.5">Real-time chart</p>
                  </div>
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-xs px-2 py-1 rounded-lg">
                    <Activity className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#848E9C] bg-[#2B3139] px-3 py-1.5 rounded-xl">
                  <span className="flex items-center gap-1">
                    <span className="text-green-400">H</span> ${formatPrice(pairStats.high)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#3A3F4A]"></span>
                  <span className="flex items-center gap-1">
                    <span className="text-red-400">L</span> ${formatPrice(pairStats.low)}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#3A3F4A]"></span>
                  <span className="flex items-center gap-1">
                    <span className="text-[#F0B90B]">V</span> ${(pairStats.volume / 1e6).toFixed(1)}M
                  </span>
                </div>
              </div>
              <div className={`${chartExpanded ? 'h-[350px] sm:h-[450px] lg:h-[550px]' : 'h-[300px] sm:h-[400px] lg:h-[500px]'} transition-all duration-300`}>
                <TradingViewWidget symbol={selectedPair.symbol} />
              </div>
            </Card>

            {/* Trading Forms - All Screens */}
            <div>
              <Card className="bg-[#1E2329] border-[#2B3139] p-4 sm:p-5 lg:p-6 rounded-2xl">
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-[#2B3139] p-1 mb-4 sm:mb-5 lg:mb-6 rounded-xl">
                    <TabsTrigger 
                      value="spot" 
                      className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg text-sm font-medium py-2.5 transition-all"
                    >
                      Spot
                    </TabsTrigger>
                    <TabsTrigger 
                      value="futures" 
                      className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg text-sm font-medium py-2.5 transition-all"
                    >
                      Futures
                    </TabsTrigger>
                    <TabsTrigger 
                      value="options" 
                      className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg text-sm font-medium py-2.5 transition-all"
                    >
                      Options
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="spot">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, spot: { ...prev.spot, side: 'buy' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.spot.side === 'buy' 
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          Buy {selectedPair.baseAsset}
                        </Button>
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, spot: { ...prev.spot, side: 'sell' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.spot.side === 'sell' 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          Sell {selectedPair.baseAsset}
                        </Button>
                      </div>

                      <Select
                        value={formState.spot.orderType}
                        onValueChange={(value: any) => setFormState(prev => ({ ...prev, spot: { ...prev.spot, orderType: value } }))}
                      >
                        <SelectTrigger className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6">
                          <SelectValue placeholder="Order Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                          <SelectItem value="market" className="text-[#EAECEF] focus:bg-[#2B3139]">Market</SelectItem>
                          <SelectItem value="limit" className="text-[#EAECEF] focus:bg-[#2B3139]">Limit</SelectItem>
                          <SelectItem value="stop" className="text-[#EAECEF] focus:bg-[#2B3139]">Stop</SelectItem>
                        </SelectContent>
                      </Select>

                      {formState.spot.orderType !== 'market' && (
                        <div className="space-y-2">
                          <label className="text-sm text-[#848E9C]">Price (USDT)</label>
                          <Input
                            type="number"
                            value={formState.spot.price}
                            onChange={(e) => setFormState(prev => ({ ...prev, spot: { ...prev.spot, price: e.target.value } }))}
                            placeholder="0.00"
                            className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6 text-lg"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-[#848E9C]">Amount ({selectedPair.baseAsset})</label>
                        <Input
                          type="number"
                          value={formState.spot.amount}
                          onChange={(e) => setFormState(prev => ({ ...prev, spot: { ...prev.spot, amount: e.target.value } }))}
                          placeholder="0.00"
                          className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6 text-lg"
                        />
                      </div>

                      <div className="bg-[#2B3139] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#848E9C]">Available</span>
                          <span className="text-[#F0B90B] font-mono font-medium">
                            {hideBalances ? '••••' : formatCurrency(getTradingBalance('USDT'))} USDT
                          </span>
                        </div>
                        {formState.spot.amount && formState.spot.price && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#848E9C]">Total</span>
                            <span className="text-[#EAECEF] font-mono font-medium">
                              ${(parseFloat(formState.spot.amount) * parseFloat(formState.spot.price || currentPrice?.toString() || '0')).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <Button
                          onClick={handleSpotTrade}
                          disabled={!formState.spot.amount || loading}
                          className={`w-full py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.spot.side === 'buy' 
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                          }`}
                        >
                          {loading ? 'Processing...' : `${formState.spot.side === 'buy' ? 'Buy' : 'Sell'} ${selectedPair.baseAsset}`}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="futures">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, futures: { ...prev.futures, side: 'long' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.futures.side === 'long' 
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          Long 📈
                        </Button>
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, futures: { ...prev.futures, side: 'short' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.futures.side === 'short' 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          Short 📉
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm text-[#848E9C]">Leverage: <span className="text-[#F0B90B] font-semibold">{formState.futures.leverage}x</span></label>
                          <div className="flex items-center gap-2">
                            {[2, 5, 10, 25, 50].map((lev) => (
                              <button
                                key={lev}
                                onClick={() => setFormState(prev => ({ ...prev, futures: { ...prev.futures, leverage: lev } }))}
                                className={`px-2 py-1 text-xs rounded-lg transition-all ${
                                  formState.futures.leverage === lev
                                    ? 'bg-[#F0B90B] text-[#181A20] font-medium'
                                    : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
                                }`}
                              >
                                {lev}x
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={formState.futures.leverage}
                          onChange={(e) => setFormState(prev => ({ ...prev, futures: { ...prev.futures, leverage: parseInt(e.target.value) } }))}
                          className="w-full h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#F0B90B] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                      </div>

                      <Select
                        value={formState.futures.orderType}
                        onValueChange={(value: any) => setFormState(prev => ({ ...prev, futures: { ...prev.futures, orderType: value } }))}
                      >
                        <SelectTrigger className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6">
                          <SelectValue placeholder="Order Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                          <SelectItem value="market" className="text-[#EAECEF] focus:bg-[#2B3139]">Market</SelectItem>
                          <SelectItem value="limit" className="text-[#EAECEF] focus:bg-[#2B3139]">Limit</SelectItem>
                          <SelectItem value="stop" className="text-[#EAECEF] focus:bg-[#2B3139]">Stop</SelectItem>
                        </SelectContent>
                      </Select>

                      {formState.futures.orderType !== 'market' && (
                        <div className="space-y-2">
                          <label className="text-sm text-[#848E9C]">Price (USDT)</label>
                          <Input
                            type="number"
                            value={formState.futures.price}
                            onChange={(e) => setFormState(prev => ({ ...prev, futures: { ...prev.futures, price: e.target.value } }))}
                            placeholder="0.00"
                            className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6 text-lg"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-[#848E9C]">Position Size (USDT)</label>
                        <Input
                          type="number"
                          value={formState.futures.amount}
                          onChange={(e) => setFormState(prev => ({ ...prev, futures: { ...prev.futures, amount: e.target.value } }))}
                          placeholder="0.00"
                          className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6 text-lg"
                        />
                      </div>

                      <div className="bg-[#2B3139] rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#848E9C]">Margin Required</span>
                          <span className="text-[#F0B90B] font-mono font-medium">
                            ${formState.futures.amount ? (parseFloat(formState.futures.amount) / formState.futures.leverage).toFixed(2) : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-[#848E9C]">Liquidation Price</span>
                          <span className="text-red-400 font-mono font-medium">
                            ${formState.futures.amount && currentPrice ? (currentPrice * (1 - (1 / formState.futures.leverage))).toFixed(2) : '0'}
                          </span>
                        </div>
                        <Button
                          onClick={handleFuturesTrade}
                          disabled={!formState.futures.amount || loading}
                          className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B]/90 hover:to-yellow-500/90 text-[#181A20] font-semibold py-4 rounded-xl text-sm shadow-lg shadow-[#F0B90B]/20"
                        >
                          {loading ? 'Opening...' : `Open ${formState.futures.side === 'long' ? 'Long' : 'Short'} Position`}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="options">
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, options: { ...prev.options, direction: 'up' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.options.direction === 'up' 
                              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          <TrendingUp className="w-4 h-4 mr-2 inline" />
                          Up / Call
                        </Button>
                        <Button
                          onClick={() => setFormState(prev => ({ ...prev, options: { ...prev.options, direction: 'down' } }))}
                          className={`py-4 rounded-xl text-sm font-semibold transition-all ${
                            formState.options.direction === 'down' 
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                              : 'bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF]'
                          }`}
                        >
                          <TrendingDown className="w-4 h-4 mr-2 inline" />
                          Down / Put
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-[#848E9C]">Time Frame</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {OPTIONS_TIMEFRAMES.map((tf) => (
                            <Button
                              key={tf.value}
                              onClick={() => setFormState(prev => ({ ...prev, options: { ...prev.options, timeFrame: tf.value } }))}
                              className={`p-3 rounded-xl transition-all ${
                                formState.options.timeFrame === tf.value 
                                  ? `bg-gradient-to-r ${tf.color} text-white shadow-lg` 
                                  : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#3A3F4A]'
                              }`}
                            >
                              <div className="text-xs font-semibold">{tf.label}</div>
                              <div className="text-[10px] opacity-80">+{tf.profit}%</div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-[#848E9C]">Investment (USDT)</label>
                        <Input
                          type="number"
                          value={formState.options.amount}
                          onChange={(e) => setFormState(prev => ({ ...prev, options: { ...prev.options, amount: e.target.value } }))}
                          placeholder="0.00"
                          className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl py-6 text-lg"
                        />
                      </div>

                      <div className="bg-[#2B3139] rounded-xl p-4 space-y-3">
                        {formState.options.amount && (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[#848E9C]">Potential Payout</span>
                              <span className="text-green-400 font-mono font-medium">
                                ${(parseFloat(formState.options.amount) * PROFIT_RATES[formState.options.timeFrame as keyof typeof PROFIT_RATES]?.payout).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[#848E9C]">Profit if Win</span>
                              <span className="text-green-400 font-mono font-medium">
                                +${(parseFloat(formState.options.amount) * (PROFIT_RATES[formState.options.timeFrame as keyof typeof PROFIT_RATES]?.profit / 100)).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                        <Button
                          onClick={handleOptionsTrade}
                          disabled={!formState.options.amount || loading || !!activeOptionsTrade}
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl text-sm shadow-lg shadow-purple-500/20"
                        >
                          {loading ? 'Purchasing...' : activeOptionsTrade ? 'Trade in Progress' : 'Buy Option'}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </motion.div>

          {/* Right Column - Market Data */}
          <motion.div 
            variants={fadeInUp}
            className={`${chartExpanded ? 'lg:col-span-3' : 'lg:col-span-4'} space-y-5`}
          >
            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-[#3A3F4A] p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#F0B90B]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#EAECEF]">Balances</h3>
                </div>
                <Badge className="bg-[#2B3139] text-[#848E9C] border-[#3A3F4A] text-xs px-3 py-1.5 rounded-lg">
                  {stats.activeLocks} Active
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#848E9C]">Funding Wallet</span>
                  <span className="text-[#EAECEF] font-mono font-medium">
                    {hideBalances ? '••••' : formatCurrency(getFundingBalance('USDT'))} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#848E9C]">Trading Wallet</span>
                  <span className="text-[#F0B90B] font-mono font-medium">
                    {hideBalances ? '••••' : formatCurrency(getTradingBalance('USDT'))} USDT
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-3 border-t border-[#3A3F4A]">
                  <span className="text-[#848E9C]">Locked Balance</span>
                  <span className="text-[#F0B90B] font-mono font-medium">
                    {hideBalances ? '••••' : formatCurrency(getLockedBalance('USDT'))} USDT
                  </span>
                </div>
              </div>
            </Card>

            {/* Order Book */}
            {showOrderBook && (
              <OrderBook
                bids={safeOrderBook.bids}
                asks={safeOrderBook.asks}
                loading={orderBookLoading}
                baseAsset={selectedPair.baseAsset}
                quoteAsset={selectedPair.quoteAsset}
              />
            )}

            {/* Recent Trades */}
            {showRecentTrades && (
              <RecentTrades
                trades={safeRecentTrades}
                loading={tradesLoading}
                baseAsset={selectedPair.baseAsset}
                quoteAsset={selectedPair.quoteAsset}
              />
            )}

            {/* Quick Actions */}
            <Card className="bg-[#1E2329] border-[#2B3139] p-4 rounded-2xl">
              <h3 className="text-sm font-semibold text-[#EAECEF] mb-3 px-1">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/wallet')}
                  className="justify-start bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] rounded-xl py-3 px-3"
                >
                  <Wallet className="w-4 h-4 mr-2 text-[#F0B90B]" />
                  Wallet
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/arbitrage')}
                  className="justify-start bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] rounded-xl py-3 px-3"
                >
                  <Zap className="w-4 h-4 mr-2 text-[#F0B90B]" />
                  Arbitrage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="justify-start bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] rounded-xl py-3 px-3"
                >
                  <History className="w-4 h-4 mr-2 text-[#F0B90B]" />
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTransfer(true)}
                  className="justify-start bg-[#2B3139] hover:bg-[#3A3F4A] text-[#EAECEF] rounded-xl py-3 px-3"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2 text-[#F0B90B]" />
                  Transfer
                </Button>
              </div>
            </Card>

            {/* Open Positions */}
            {positions.length > 0 && (
              <Card className="bg-[#1E2329] border-[#2B3139] p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#F0B90B]" />
                    <h3 className="text-sm font-semibold text-[#EAECEF]">Open Positions</h3>
                  </div>
                  <Badge className="bg-[#2B3139] text-[#F0B90B] border-[#3A3F4A] text-xs px-2 py-1 rounded-lg">
                    {positions.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {positions.slice(0, 3).map((position) => (
                    <div key={position.id} className="bg-[#2B3139] rounded-xl p-3 text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-[#EAECEF]">{position.symbol}</span>
                        <Badge className={`${
                          position.side === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        } text-[10px] px-2 py-0.5 rounded-lg`}>
                          {position.side}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-[#848E9C]">
                        <span>Size: {position.size} {position.asset}</span>
                        <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {position.pnl >= 0 ? '+' : ''}{position.pnl?.toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* Trading Locks Status */}
        {tradingLocks.length > 0 && (
          <Card className="mt-5 bg-[#1E2329] border-[#2B3139] p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F0B90B]" />
                <h3 className="text-sm font-semibold text-[#EAECEF]">Active Locks</h3>
              </div>
              <Badge className="bg-[#2B3139] text-[#F0B90B] border-[#3A3F4A] text-xs px-3 py-1.5 rounded-lg">
                {tradingStats.totalLockedAmount.toFixed(2)} USDT
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tradingLocks.slice(0, 3).map((lock) => (
                <div key={lock.id} className="bg-[#2B3139] rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-[#EAECEF]">{lock.asset}</span>
                    <span className="text-[#F0B90B] font-mono font-medium">{lock.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#848E9C]">
                    <span className="capitalize">{lock.lock_type}</span>
                    <span>{new Date(lock.expires_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Order History Modal */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#1E2329] border border-[#2B3139] rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-[#2B3139] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                      <History className="w-4 h-4 text-[#F0B90B]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#EAECEF]">Order History</h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-[#848E9C]" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
                  {userTrades.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3">📋</div>
                      <div className="text-sm text-[#848E9C]">No trades yet</div>
                      <p className="text-xs text-[#848E9C]/60 mt-1">Your trading history will appear here</p>
                    </div>
                  ) : (
                    <OrderHistoryTable orders={userTrades} />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#1E2329] border border-[#2B3139] rounded-2xl max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-[#2B3139] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                      <Settings className="w-4 h-4 text-[#F0B90B]" />
                    </div>
                    <h3 className="text-base font-semibold text-[#EAECEF]">Settings</h3>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-[#848E9C]" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#EAECEF]">Hide Balances</span>
                    <button
                      onClick={() => setHideBalances(!hideBalances)}
                      className={`w-12 h-6 rounded-full transition-colors ${hideBalances ? 'bg-[#F0B90B]' : 'bg-[#2B3139]'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transition-transform ${hideBalances ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <Separator className="bg-[#2B3139]" />
                  <div className="space-y-2">
                    <label className="text-sm text-[#848E9C]">Default Timeframe</label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="bg-[#2B3139] border-[#3A3F4A] text-[#EAECEF] rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                        <SelectItem value="1m" className="text-[#EAECEF] focus:bg-[#2B3139]">1 minute</SelectItem>
                        <SelectItem value="5m" className="text-[#EAECEF] focus:bg-[#2B3139]">5 minutes</SelectItem>
                        <SelectItem value="15m" className="text-[#EAECEF] focus:bg-[#2B3139]">15 minutes</SelectItem>
                        <SelectItem value="1h" className="text-[#EAECEF] focus:bg-[#2B3139]">1 hour</SelectItem>
                        <SelectItem value="4h" className="text-[#EAECEF] focus:bg-[#2B3139]">4 hours</SelectItem>
                        <SelectItem value="1d" className="text-[#EAECEF] focus:bg-[#2B3139]">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet Transfer Modal */}
        <AnimatePresence>
          {showTransfer && (
            <WalletTransfer
              isOpen={showTransfer}
              onClose={() => setShowTransfer(false)}
              fundingBalances={fundingBalances}
              tradingBalances={tradingBalances}
              onTransferToTrading={handleTransferToTrading}
              onTransferToFunding={handleTransferToFunding}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Pair Selector Modal */}
      <EnhancedPairSelectorModal
        open={pairSelectorOpen}
        onClose={() => setPairSelectorOpen(false)}
        onSelectPair={handlePairSelect}
        currentTab={activeTab}
      />

      {/* Profile Dropdown */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-6 w-72 bg-[#1E2329] border border-[#2B3139] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-[#2B3139]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20">
                  <span className="text-sm font-bold text-[#181A20]">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#EAECEF] truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-[#848E9C] mt-0.5">Member since {new Date().getFullYear()}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={() => navigate('/account')}
                className="w-full px-3 py-2.5 text-left text-sm text-[#EAECEF] hover:bg-[#2B3139] rounded-xl transition-colors flex items-center gap-3"
              >
                <User className="w-4 h-4 text-[#848E9C]" />
                Profile
              </button>
              <button
                onClick={() => navigate('/security')}
                className="w-full px-3 py-2.5 text-left text-sm text-[#EAECEF] hover:bg-[#2B3139] rounded-xl transition-colors flex items-center gap-3"
              >
                <Shield className="w-4 h-4 text-[#848E9C]" />
                Security
              </button>
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/20 rounded-xl transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}