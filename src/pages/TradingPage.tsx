// pages/UnifiedTradingPage.tsx - Updated with Binance Colors & Wallet Integration

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  BarChart3,
  Eye,
  RefreshCw,
  User,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ChevronUp,
  Search,
  Star,
  Flame,
  Sparkles,
  Filter,
  LayoutGrid,
  Wallet,
  Zap,
  Shield,
  Award,
  Copy,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatPrice } from '@/utils/tradingCalculations';
import Countdown from 'react-countdown';

// ============================================
// TYPES
// ============================================

type TabType = 'spot' | 'future' | 'option';
type BottomTabType = 'active' | 'scheduled' | 'completed' | 'positions' | 'open' | 'closed' | 'assets';
type CategoryType = 'futures' | 'usstock' | 'forex' | 'crypto' | 'etf';
type FilterType = 'favourites' | 'all' | 'hot' | 'gainer' | 'loser';

interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
}

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  category: CategoryType;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  volumeDisplay: string;
  high24h?: number;
  low24h?: number;
  favorite?: boolean;
  hot?: boolean;
  leverage?: number;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell' | 'long' | 'short' | 'UP' | 'DOWN';
  amount: number;
  price: number;
  total?: number;
  type: 'spot' | 'futures' | 'option';
  status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired' | 'completed';
  timestamp: string;
  expiryTime?: string;
  scheduledTime?: string;
  leverage?: number;
  margin?: number;
  direction?: 'UP' | 'DOWN';
  duration?: number;
  payout?: number;
  pnl?: number;
  fee?: number;
  move?: number;
  durationLabel?: string;
  startTime?: string;
  endTime?: string;
  stake?: number;
  entryPrice?: number;
  expiryPrice?: number;
  result?: 'win' | 'loss';
}

// ============================================
// CONSTANTS
// ============================================

// Binance Color Palette
const COLORS = {
  binance: {
    yellow: '#F0B90B',
    yellowDark: '#DBA40A',
    yellowLight: '#FCD535',
    black: '#0B0E11',
    dark: '#1E2329',
    card: '#2B3139',
    cardHover: '#373B42',
    border: '#3A3F4A',
  },
  text: {
    primary: '#EAECEF',
    secondary: '#B7BDC6',
    tertiary: '#848E9C',
    disabled: '#5E6673',
  },
  green: {
    primary: '#0ECB81',
    dark: '#0FB37E',
    bg: 'rgba(14, 203, 129, 0.1)',
  },
  red: {
    primary: '#F6465D',
    dark: '#D63F53',
    bg: 'rgba(246, 70, 93, 0.1)',
  },
  blue: {
    primary: '#5096FF',
    dark: '#4785E6',
    bg: 'rgba(80, 150, 255, 0.1)',
  },
  purple: {
    primary: '#A66AE6',
    dark: '#955FD1',
    bg: 'rgba(166, 106, 230, 0.1)',
  },
  orange: {
    primary: '#F78D4B',
    dark: '#E67F44',
    bg: 'rgba(247, 141, 75, 0.1)',
  },
};

// Animation Variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }
};

const cardHover = {
  whileHover: { scale: 1.02, y: -2, transition: { duration: 0.2, ease: 'easeOut' } },
  whileTap: { scale: 0.98 }
};

const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 17 }
};

const slideUp = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const CATEGORIES = [
  { id: 'futures', label: 'Futures', icon: TrendingUp },
  { id: 'usstock', label: 'USStock', icon: BarChart3 },
  { id: 'forex', label: 'Forex', icon: TrendingDown },
  { id: 'crypto', label: 'Crypto', icon: Sparkles },
  { id: 'etf', label: 'ETF', icon: Filter },
];

const FILTERS = [
  { id: 'favourites', label: 'Favourites', icon: Star },
  { id: 'all', label: 'All', icon: Filter },
  { id: 'hot', label: 'Hot', icon: Flame },
  { id: 'gainer', label: 'Gainer', icon: TrendingUp },
  { id: 'loser', label: 'Loser', icon: TrendingDown },
];

// Complete asset database
const ALL_ASSETS: TradingPair[] = [
  // Futures
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', name: 'Bitcoin', category: 'futures', price: 66743.75, change: -1.06, changePercent: -1.06, volume: 560000, volumeDisplay: '0.56M', hot: true, leverage: 86 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', category: 'futures', price: 3504.15, change: -1.60, changePercent: -1.60, volume: 450000, volumeDisplay: '0.45M', leverage: 37 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', name: 'Binance Coin', category: 'futures', price: 706.47, change: 0.30, changePercent: 0.30, volume: 630000, volumeDisplay: '0.63M', leverage: 88 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', name: 'Solana', category: 'futures', price: 151.44, change: 1.77, changePercent: 1.77, volume: 720000, volumeDisplay: '0.72M', leverage: 40 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', category: 'futures', price: 0.60, change: -2.07, changePercent: -2.07, volume: 720000, volumeDisplay: '0.72M', leverage: 32 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', name: 'Ripple', category: 'futures', price: 0.60, change: 1.83, changePercent: 1.83, volume: 840000, volumeDisplay: '0.84M', leverage: 30 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', name: 'Polkadot', category: 'futures', price: 7.96, change: -2.25, changePercent: -2.25, volume: 230000, volumeDisplay: '0.23M', leverage: 23 },
  
  // US Stocks
  { symbol: 'AAPL', baseAsset: 'AAPL', quoteAsset: 'USD', name: 'Apple Inc.', category: 'usstock', price: 176.25, change: 1.80, changePercent: 1.80, volume: 6660000, volumeDisplay: '6.66M' },
  { symbol: 'MSFT', baseAsset: 'MSFT', quoteAsset: 'USD', name: 'Microsoft', category: 'usstock', price: 345.09, change: -1.81, changePercent: -1.81, volume: 44540000, volumeDisplay: '44.54M' },
  { symbol: 'GOOGL', baseAsset: 'GOOGL', quoteAsset: 'USD', name: 'Google', category: 'usstock', price: 158.16, change: -1.29, changePercent: -1.29, volume: 29890000, volumeDisplay: '29.89M' },
  { symbol: 'AMZN', baseAsset: 'AMZN', quoteAsset: 'USD', name: 'Amazon', category: 'usstock', price: 168.07, change: -2.10, changePercent: -2.10, volume: 42880000, volumeDisplay: '42.88M' },
  { symbol: 'TSLA', baseAsset: 'TSLA', quoteAsset: 'USD', name: 'Tesla', category: 'usstock', price: 297.02, change: -1.69, changePercent: -1.69, volume: 48910000, volumeDisplay: '48.91M' },
  { symbol: 'NVDA', baseAsset: 'NVDA', quoteAsset: 'USD', name: 'NVIDIA', category: 'usstock', price: 430.64, change: 1.33, changePercent: 1.33, volume: 24620000, volumeDisplay: '24.62M' },
  { symbol: 'META', baseAsset: 'META', quoteAsset: 'USD', name: 'Meta', category: 'usstock', price: 278.39, change: 3.26, changePercent: 3.26, volume: 10330000, volumeDisplay: '10.33M' },
  { symbol: 'NFLX', baseAsset: 'NFLX', quoteAsset: 'USD', name: 'Netflix', category: 'usstock', price: 407.33, change: 1.54, changePercent: 1.54, volume: 27700000, volumeDisplay: '27.70M' },
  
  // Forex
  { symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD', name: 'Euro/US Dollar', category: 'forex', price: 1.10, change: 0.42, changePercent: 0.42, volume: 78320000, volumeDisplay: '78.32M' },
  { symbol: 'USDJPY', baseAsset: 'USD', quoteAsset: 'JPY', name: 'US Dollar/Japanese Yen', category: 'forex', price: 154.53, change: 0.20, changePercent: 0.20, volume: 30010000, volumeDisplay: '30.01M' },
  { symbol: 'GBPUSD', baseAsset: 'GBP', quoteAsset: 'USD', name: 'British Pound/US Dollar', category: 'forex', price: 1.28, change: 0.95, changePercent: 0.95, volume: 42820000, volumeDisplay: '42.82M' },
  { symbol: 'USDCHF', baseAsset: 'USD', quoteAsset: 'CHF', name: 'US Dollar/Swiss Franc', category: 'forex', price: 0.88, change: -0.22, changePercent: -0.22, volume: 6650000, volumeDisplay: '6.65M' },
  { symbol: 'AUDUSD', baseAsset: 'AUD', quoteAsset: 'USD', name: 'Australian Dollar/US Dollar', category: 'forex', price: 0.67, change: 0.56, changePercent: 0.56, volume: 76750000, volumeDisplay: '76.75M' },
  { symbol: 'USDCAD', baseAsset: 'USD', quoteAsset: 'CAD', name: 'US Dollar/Canadian Dollar', category: 'forex', price: 1.37, change: -0.63, changePercent: -0.63, volume: 82190000, volumeDisplay: '82.19M' },
  { symbol: 'USDCNH', baseAsset: 'USD', quoteAsset: 'CNH', name: 'US Dollar/Chinese Yuan', category: 'forex', price: 7.10, change: 0.28, changePercent: 0.28, volume: 13970000, volumeDisplay: '13.97M' },
  { symbol: 'USDHKD', baseAsset: 'USD', quoteAsset: 'HKD', name: 'US Dollar/Hong Kong Dollar', category: 'forex', price: 7.86, change: 0.96, changePercent: 0.96, volume: 94350000, volumeDisplay: '94.35M' },
  
  // Crypto
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', name: 'Bitcoin', category: 'crypto', price: 67668.18, change: -2.48, changePercent: -2.48, volume: 580000, volumeDisplay: '0.58M' },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', category: 'crypto', price: 3492.89, change: -1.83, changePercent: -1.83, volume: 840000, volumeDisplay: '0.84M' },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', name: 'Binance Coin', category: 'crypto', price: 943.60, change: -2.14, changePercent: -2.14, volume: 630000, volumeDisplay: '0.63M' },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', name: 'Solana', category: 'crypto', price: 856.88, change: -0.70, changePercent: -0.70, volume: 310000, volumeDisplay: '0.31M' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', category: 'crypto', price: 757.05, change: 2.84, changePercent: 2.84, volume: 60000, volumeDisplay: '0.06M' },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', name: 'Ripple', category: 'crypto', price: 99.42, change: -0.71, changePercent: -0.71, volume: 440000, volumeDisplay: '0.44M' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', name: 'Polkadot', category: 'crypto', price: 537.53, change: 1.17, changePercent: 1.17, volume: 710000, volumeDisplay: '0.71M' },
  
  // ETFs
  { symbol: 'SPY', baseAsset: 'SPY', quoteAsset: 'USD', name: 'SPDR S&P 500 ETF', category: 'etf', price: 473.65, change: 0.01, changePercent: 0.01, volume: 5640000, volumeDisplay: '5.64M' },
  { symbol: 'IVV', baseAsset: 'IVV', quoteAsset: 'USD', name: 'iShares Core S&P 500 ETF', category: 'etf', price: 514.98, change: 1.19, changePercent: 1.19, volume: 26230000, volumeDisplay: '26.23M' },
  { symbol: 'VOO', baseAsset: 'VOO', quoteAsset: 'USD', name: 'Vanguard S&P 500 ETF', category: 'etf', price: 485.94, change: 0.63, changePercent: 0.63, volume: 39310000, volumeDisplay: '39.31M' },
  { symbol: 'QQQ', baseAsset: 'QQQ', quoteAsset: 'USD', name: 'Invesco QQQ Trust', category: 'etf', price: 441.08, change: -0.06, changePercent: -0.06, volume: 31100000, volumeDisplay: '31.10M' },
  { symbol: 'VTI', baseAsset: 'VTI', quoteAsset: 'USD', name: 'Vanguard Total Stock Market ETF', category: 'etf', price: 262.77, change: 0.72, changePercent: 0.72, volume: 31300000, volumeDisplay: '31.30M' },
  { symbol: 'VEA', baseAsset: 'VEA', quoteAsset: 'USD', name: 'Vanguard FTSE Developed Markets ETF', category: 'etf', price: 66.71, change: -0.39, changePercent: -0.39, volume: 4980000, volumeDisplay: '4.98M' },
  { symbol: 'VWO', baseAsset: 'VWO', quoteAsset: 'USD', name: 'Vanguard FTSE Emerging Markets ETF', category: 'etf', price: 50.53, change: -0.86, changePercent: -0.86, volume: 6070000, volumeDisplay: '6.07M' },
  { symbol: 'BND', baseAsset: 'BND', quoteAsset: 'USD', name: 'Vanguard Total Bond Market ETF', category: 'etf', price: 80.42, change: -1.50, changePercent: -1.50, volume: 22020000, volumeDisplay: '22.02M' },
];

const TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H'];

// Options Timeframes
const OPTIONS_TIMEFRAMES = [
  { label: '60s', value: 60, profit: 15, move: 0.01, payout: 0.176, durationLabel: '1min' },
  { label: '120s', value: 120, profit: 18, move: 0.01, payout: 0.176, durationLabel: '2min' },
  { label: '240s', value: 240, profit: 22, move: 0.05, payout: 0.328, durationLabel: '4min' },
  { label: '360s', value: 360, profit: 25, move: 0.1, payout: 0.439, durationLabel: '6min' },
  { label: '600s', value: 600, profit: 30, move: 0.5, payout: 0.516, durationLabel: '10min' },
];

// Fluctuation Ranges
const FLUCTUATION_RANGES = {
  60: [
    { label: 'UP > 0.01%', value: 0.01, payout: 0.176, move: 0.01 },
  ],
  120: [
    { label: 'UP > 0.01%', value: 0.01, payout: 0.176, move: 0.01 },
  ],
  240: [
    { label: 'UP > 0.05%', value: 0.05, payout: 0.328, move: 0.05 },
  ],
  360: [
    { label: 'UP > 0.1%', value: 0.1, payout: 0.439, move: 0.1 },
  ],
  600: [
    { label: 'UP > 0.5%', value: 0.5, payout: 0.516, move: 0.5 },
    { label: 'UP > 0.8%', value: 0.8, payout: 0.75, move: 0.8 },
  ],
};

// Purchase Ranges
const PURCHASE_RANGES = {
  60: { min: 100, max: 50000 },
  120: { min: 10000, max: 300000 },
  240: { min: 30000, max: 500000 },
  360: { min: 50000, max: 1000000 },
  600: { min: 100000, max: 9999999 },
};

// Leverage Options
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 33, 50, 100];

// ============================================
// COMPONENTS
// ============================================

// Countdown Renderer with Binance styling
const CountdownRenderer = ({ hours, minutes, seconds, completed }: any) => {
  if (completed) return null;
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  if (totalSeconds > 60) {
    return (
      <span className="text-xs font-mono font-bold text-[#5096FF]">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    );
  }
  
  return (
    <span className="text-xs font-mono font-bold text-[#F0B90B] animate-pulse">
      {seconds}s
    </span>
  );
};

// Binance-style Card Component
const BinanceCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ 
  children, 
  className = '', 
  onClick 
}) => (
  <motion.div
    whileHover={onClick ? cardHover.whileHover : undefined}
    whileTap={onClick ? cardHover.whileTap : undefined}
    className={`bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/30 rounded-xl transition-all duration-300 overflow-hidden ${className}`}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Binance-style Button
const BinanceButton: React.FC<{
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}> = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  className = '',
  fullWidth = true 
}) => {
  const baseClasses = `py-3 rounded-lg font-medium text-base transition-all duration-200 ${
    fullWidth ? 'w-full' : ''
  }`;
  
  const variantClasses = {
    primary: 'bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11]',
    secondary: 'bg-[#2B3139] hover:bg-[#373B42] text-[#EAECEF] border border-[#3A3F4A]',
    success: 'bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-[#0B0E11]',
    danger: 'bg-[#F6465D] hover:bg-[#F6465D]/90 text-white',
  };
  
  return (
    <motion.button
      whileHover={!disabled ? buttonHover.whileHover : undefined}
      whileTap={!disabled ? buttonHover.whileTap : undefined}
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

// Completed Order Card Component with Expandable Details - Binance Style
const CompletedOrderCard: React.FC<{ order: any }> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Data validation - ensure order is completed
  if (order.status !== "COMPLETED") {
    console.warn("Attempted to render non-completed order in CompletedOrderCard:", order);
    return null;
  }
  
  if (order.expiryPrice === null) {
    console.warn("Completed order missing expiryPrice:", order);
    return null;
  }
  
  if (order.startTime >= order.endTime) {
    console.warn("Invalid timestamps in completed order:", order);
    return null;
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  // Immutable data - never recalculate, always use stored values
  const isWin = order.pnl > 0;
  const resultLabel = isWin ? "Your Profit" : "Your Loss";
  const resultValue = isWin ? order.pnl : -order.stake;
  const resultColor = isWin ? "text-[#0ECB81]" : "text-[#F6465D]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E2329] rounded-xl overflow-hidden border border-[#2B3139]"
    >
      {/* 🧾 HEADER (ALWAYS VISIBLE) */}
      <motion.div 
        whileHover={{ backgroundColor: '#2B3139' }}
        className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-[#EAECEF]">{order.symbol}</span>
          <span className="text-xs text-[#848E9C]">|</span>
          <span className={`text-xs font-medium ${order.direction === 'UP' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            {order.direction}
          </span>
          <span className="text-xs text-[#848E9C]">&gt;</span>
          <span className="text-xs text-[#B7BDC6]">{order.move}%</span>
          <span className="text-xs text-[#5E6673]">({order.payout})</span>
          <span className="text-xs text-[#848E9C]">|</span>
          <span className="text-xs text-[#B7BDC6]">{order.durationLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${resultColor}`}>
            {isWin ? '+' : ''}{resultValue.toFixed(2)} USDT
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#848E9C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#848E9C]" />
          )}
        </div>
      </motion.div>

      {/* 💰 RESULT LINE AND 📋 DETAILS SECTION (EXPANDED CONTENT) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2B3139]"
          >
            <div className="p-4 space-y-4">
              {/* 💰 RESULT LINE (MOST IMPORTANT) */}
              <div className={`text-base font-semibold ${resultColor}`}>
                {isWin ? '✔' : '✖'} {resultLabel}     {isWin ? '+' : ''}{resultValue.toFixed(2)} USDT
              </div>

              {/* 📋 DETAILS SECTION - EXACT LABELS AS SPECIFIED */}
              <div className="space-y-3">
                <DetailRow label="Direction" value={order.direction} />
                <DetailRow label="Total" value={`${order.stake} USDT`} />
                <DetailRow label="Open Price" value={`$${order.entryPrice}`} />
                <DetailRow label="Closing Price" value={`$${order.expiryPrice}`} />
                <DetailRow label="Duration" value={order.durationLabel} />
                <DetailRow label="Fee" value={`${order.fee} USDT`} />
                <DetailRow label="Start Time" value={formatDateTime(order.startTime)} />
                <DetailRow label="End Time" value={formatDateTime(order.endTime)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-xs text-[#848E9C]">{label}</span>
    <span className="text-xs text-[#EAECEF] font-mono">{value}</span>
  </div>
);

// Asset Selector Modal Component - Binance Style
const AssetSelectorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: TradingPair) => void;
  currentCategory: CategoryType;
}> = ({ isOpen, onClose, onSelect, currentCategory }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(currentCategory);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Filter assets based on category, search, and filter type
  const filteredAssets = useMemo(() => {
    let filtered = ALL_ASSETS.filter(asset => 
      asset.category === selectedCategory
    );

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    switch (selectedFilter) {
      case 'favourites':
        filtered = filtered.filter(asset => favorites.includes(asset.symbol));
        break;
      case 'hot':
        filtered = filtered.filter(asset => asset.hot);
        break;
      case 'gainer':
        filtered = filtered.filter(asset => asset.changePercent > 2);
        break;
      case 'loser':
        filtered = filtered.filter(asset => asset.changePercent < -2);
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedCategory, searchQuery, selectedFilter, favorites]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="bg-[#0B0E11] w-full max-w-2xl rounded-t-3xl border-t border-[#2B3139] max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-[#2B3139]">
              <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">Choose your trading pair</h2>
              <p className="text-sm text-[#848E9C]">Real-time data from all markets • Auto-refresh every 30 seconds</p>
            </div>

            {/* Categories */}
            <div className="px-6 py-4 flex space-x-3 overflow-x-auto border-b border-[#2B3139]">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as CategoryType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                    selectedCategory === cat.id
                      ? 'bg-[#F0B90B] text-[#0B0E11]'
                      : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-6 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
                <input
                  type="text"
                  placeholder={`Search ${selectedCategory} pairs...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg pl-10 pr-4 py-3 text-[#EAECEF] placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 flex space-x-2 overflow-x-auto pb-2">
              {FILTERS.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id as FilterType)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedFilter === filter.id
                      ? 'bg-[#F0B90B] text-[#0B0E11]'
                      : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                  }`}
                >
                  <filter.icon className="w-3 h-3" />
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Table Header */}
            <div className="px-6 py-3 grid grid-cols-4 text-xs text-[#848E9C] border-b border-[#2B3139]">
              <div className="col-span-2">Pair</div>
              <div className="text-right">Last Price</div>
              <div className="text-right">Change %</div>
              <div className="text-right hidden sm:block">Volume</div>
            </div>

            {/* Asset List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 300px)' }}>
              {filteredAssets.map((asset) => (
                <motion.button
                  key={asset.symbol}
                  whileHover={{ backgroundColor: '#1E2329' }}
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
                  className="w-full px-6 py-4 grid grid-cols-4 items-center transition-colors border-b border-[#2B3139]/50"
                >
                  <div className="col-span-2 flex items-center space-x-3">
                    <button 
                      onClick={(e) => toggleFavorite(asset.symbol, e)}
                      className="text-[#5E6673] hover:text-[#F0B90B] transition-colors"
                    >
                      <Star className="w-4 h-4" fill={favorites.includes(asset.symbol) ? "#F0B90B" : "none"} />
                    </button>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[#EAECEF] font-medium">{asset.symbol}</span>
                        {asset.leverage && (
                          <span className="text-xs bg-[#F0B90B]/10 text-[#F0B90B] px-1.5 py-0.5 rounded">
                            {asset.leverage}x
                          </span>
                        )}
                        {asset.hot && (
                          <Flame className="w-3 h-3 text-[#F78D4B]" />
                        )}
                      </div>
                      <div className="text-xs text-[#848E9C]">{asset.name}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[#EAECEF] font-mono">
                      ${asset.price.toFixed(asset.price < 10 ? 4 : 2)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      asset.change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                    }`}>
                      {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-right text-[#848E9C] text-sm hidden sm:block">
                    {asset.volumeDisplay}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-[#2B3139] flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (filteredAssets.length > 0) {
                    onSelect(filteredAssets[0]);
                    onClose();
                  }
                }}
                className="px-6 py-2 bg-[#F0B90B] text-[#0B0E11] rounded-lg font-medium hover:bg-[#F0B90B]/90 transition-colors"
              >
                Select First Available
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function UnifiedTradingPage() {
  const navigate = useNavigate();
  const { symbol, tab } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { 
    getTradingBalance, 
    getFundingBalance, 
    balances,
    addBalance,
    deductBalance,
    lockBalance,
    unlockBalance,
    transferToTrading,
    transferToFunding
  } = useUnifiedWallet();

  // ============================================
  // ASSET SELECTOR STATE
  // ============================================

  const [showAssetSelector, setShowAssetSelector] = useState(false);

  // ============================================
  // SELECTED PAIR
  // ============================================

  const selectedPair = useMemo(() => {
    if (symbol) {
      const pair = ALL_ASSETS.find(p => p.baseAsset.toLowerCase() === symbol.toLowerCase());
      return pair || ALL_ASSETS[0];
    }
    return ALL_ASSETS[0];
  }, [symbol]);

  // ============================================
  // LIVE DATA HOOKS
  // ============================================

  // Live price data
  const { currentPrice, priceChange24h, isLoading: priceLoading } = useBinanceStream(selectedPair?.symbol || 'XAUUSDT');
  
  // Order book data
  const { orderBook, loading: orderBookLoading } = useOrderBook(selectedPair?.symbol || 'XAUUSDT');
  
  // Recent trades
  const { recentTrades, loading: tradesLoading } = useRecentTrades(selectedPair?.symbol || 'XAUUSDT');

  // Display price (use live or fallback to static)
  const displayPrice = currentPrice || selectedPair.price;
  const displayChange = priceChange24h || selectedPair.change;

  // ============================================
  // DYNAMIC ORDER BOOK GENERATION
  // ============================================

  // Generate spot order book from live data or create realistic mock
  const spotOrderBookAsks = useMemo(() => {
    if (orderBook?.asks && orderBook.asks.length > 0) {
      return orderBook.asks.slice(0, 5).map(ask => ({
        price: ask.price,
        quantity: ask.quantity
      }));
    }
    
    // Fallback generated data based on current price
    const basePrice = displayPrice;
    return [
      { price: basePrice + 2.5, quantity: 12500.45 },
      { price: basePrice + 1.8, quantity: 34200.67 },
      { price: basePrice + 1.2, quantity: 28750.89 },
      { price: basePrice + 0.6, quantity: 45600.23 },
      { price: basePrice + 0.3, quantity: 67800.12 }
    ].slice(0, 3);
  }, [orderBook, displayPrice]);

  const spotOrderBookBids = useMemo(() => {
    if (orderBook?.bids && orderBook.bids.length > 0) {
      return orderBook.bids.slice(0, 5).map(bid => ({
        price: bid.price,
        quantity: bid.quantity
      }));
    }
    
    // Fallback generated data based on current price
    const basePrice = displayPrice;
    return [
      { price: basePrice - 0.4, quantity: 45678.90 },
      { price: basePrice - 1.1, quantity: 23456.78 },
      { price: basePrice - 1.7, quantity: 12345.67 },
      { price: basePrice - 2.3, quantity: 56789.01 },
      { price: basePrice - 2.9, quantity: 78901.23 }
    ].slice(0, 3);
  }, [orderBook, displayPrice]);

  // Futures order book
  const futuresOrderBookAsks = useMemo(() => {
    const basePrice = displayPrice;
    return [
      { price: basePrice + 2.5, available: 15200.35 },
      { price: basePrice + 1.8, available: 38400.67 },
      { price: basePrice + 1.2, available: 25600.89 },
      { price: basePrice + 0.6, available: 42300.45 },
      { price: basePrice + 0.3, available: 71200.23 }
    ].slice(0, 3);
  }, [displayPrice]);

  const futuresOrderBookBids = useMemo(() => {
    const basePrice = displayPrice;
    return [
      { price: basePrice - 0.4, amount: 0.85 },
      { price: basePrice - 1.1, amount: 2.34 },
      { price: basePrice - 1.7, amount: 5.67 },
      { price: basePrice - 2.3, amount: 8.90 },
      { price: basePrice - 2.9, amount: 12.34 }
    ].slice(0, 3);
  }, [displayPrice]);

  // Options order book
  const optionsOrderBookAsks = useMemo(() => {
    const basePrice = displayPrice;
    return [
      { price: basePrice + 2.5, quantity: 0.45 },
      { price: basePrice + 1.8, quantity: 34567.89 },
      { price: basePrice + 1.2, quantity: 56789.01 },
      { price: basePrice + 0.6, quantity: 23456.78 },
      { price: basePrice + 0.3, quantity: 78901.23 }
    ].slice(0, 3);
  }, [displayPrice]);

  const optionsOrderBookBids = useMemo(() => {
    const basePrice = displayPrice;
    return [
      { price: basePrice - 0.4, quantity: 0.95 },
      { price: basePrice - 1.1, quantity: 7890.12 },
      { price: basePrice - 1.7, quantity: 45678.90 },
      { price: basePrice - 2.3, quantity: 23456.78 },
      { price: basePrice - 2.9, quantity: 12345.67 }
    ].slice(0, 3);
  }, [displayPrice]);

  // ============================================
  // UI STATE
  // ============================================

  const [activeTab, setActiveTab] = useState<TabType>(
    tab === 'future' ? 'future' : tab === 'option' ? 'option' : 'spot'
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');
  const [hideBalances, setHideBalances] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Spot State
  const [spotSide, setSpotSide] = useState<'buy' | 'sell'>('buy');
  const [spotAmount, setSpotAmount] = useState('');
  
  // Futures State
  const [futuresTradeType, setFuturesTradeType] = useState<'open' | 'close'>('open');
  const [futuresSide, setFuturesSide] = useState<'long' | 'short'>('long');
  const [futuresLeverage, setFuturesLeverage] = useState(100);
  const [futuresAmount, setFuturesAmount] = useState('');
  const [futuresPercentage, setFuturesPercentage] = useState(0);
  const [tpSlEnabled, setTpSlEnabled] = useState(false);
  const [showLeverageModal, setShowLeverageModal] = useState(false);

  // Options State
  const [optionDirection, setOptionDirection] = useState<'up' | 'down'>('up');
  const [optionDuration, setOptionDuration] = useState(60);
  const [optionFluctuation, setOptionFluctuation] = useState(0.01);
  const [optionPayout, setOptionPayout] = useState(0.176);
  const [optionMove, setOptionMove] = useState(0.01);
  const [optionAmount, setOptionAmount] = useState('');
  const [optionPercentage, setOptionPercentage] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showFluctuationModal, setShowFluctuationModal] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState({ hours: 0, minutes: 0, seconds: 30 });

  // Bottom Tabs
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabType>('active');
  
  // Order State Management
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [scheduledOrders, setScheduledOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  
  // Spot and Futures Orders
  const [spotOrders, setSpotOrders] = useState<Order[]>([]);
  const [futuresOrders, setFuturesOrders] = useState<Order[]>([]);
  const [spotPositions, setSpotPositions] = useState<Order[]>([]);
  const [futuresPositions, setFuturesPositions] = useState<Order[]>([]);

  // Chart animation
  const [chartData, setChartData] = useState([16, 24, 12, 20, 8, 28, 16, 22]);
  const animationRef = useRef<NodeJS.Timeout>();

  // Animate chart data
  useEffect(() => {
    const animateChart = () => {
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1];
        const change = (Math.random() - 0.5) * 8;
        const newValue = Math.max(4, Math.min(32, lastValue + change));
        newData.push(newValue);
        return newData;
      });
    };

    animationRef.current = setInterval(animateChart, 2000);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Monitor active orders and move expired ones to completed
  useEffect(() => {
    const checkExpiredOrders = async () => {
      const now = new Date();
      
      setActiveOrders(prev => {
        const expiredOrders = prev.filter(order => 
          order.expiryTime && new Date(order.expiryTime) <= now
        );
        
        if (expiredOrders.length > 0) {
          // Process expired orders asynchronously
          expiredOrders.forEach(async (order) => {
            // Calculate final result based on current price vs entry price
            const priceDiff = displayPrice - order.entryPrice!;
            const isWin = order.direction === 'UP' ? priceDiff > 0 : priceDiff < 0;
            
            // Calculate PNL based on payout ratio
            const pnl = isWin ? order.amount * order.payout! : -order.amount;
            
            // Add winnings to trading wallet if won
            if (isWin) {
              const result = await addBalance('USDT', pnl, 'option_win', `option_win_${order.id}`, { 
                orderId: order.id,
                entryPrice: order.entryPrice,
                exitPrice: displayPrice,
                direction: order.direction
              });
              if (result.success) {
                toast.success(`🎉 You won $${pnl.toFixed(2)} USDT!`);
              }
            } else {
              // Loss amount already deducted when order was placed
              toast.error(`Trade lost: -$${order.amount.toFixed(2)} USDT`);
            }
          });
          
          // Move expired orders to completed with final results
          const completedOrdersData = expiredOrders.map(order => {
            const priceDiff = displayPrice - order.entryPrice!;
            const isWin = order.direction === 'UP' ? priceDiff > 0 : priceDiff < 0;
            const pnl = isWin ? order.amount * order.payout! : -order.amount;
            
            return {
              ...order,
              status: 'COMPLETED' as const,
              pnl: pnl,
              stake: order.amount,
              expiryPrice: displayPrice,
              endTime: now.toISOString(),
              startTime: order.timestamp || now.toISOString(),
              fee: order.fee || (order.amount * 0.001), // Default 0.1% fee
              result: isWin ? 'win' : 'loss' as 'win' | 'loss',
              move: order.move || 0.01,
              payout: order.payout || 0.176,
              durationLabel: order.durationLabel || `${order.duration}s`
            };
          });
          
          setCompletedOrders(prevCompleted => [...prevCompleted, ...completedOrdersData]);
          
          // Show notifications for expired orders
          completedOrdersData.forEach(order => {
            if (order.pnl && order.pnl > 0) {
              toast.success(`🎉 Trade Won! +${order.pnl.toFixed(2)} USDT`);
            } else {
              toast.error(`Trade Lost. ${order.pnl?.toFixed(2) || '0'} USDT`);
            }
          });
        }
        
        // Keep only non-expired orders in active
        return prev.filter(order => 
          !order.expiryTime || new Date(order.expiryTime) > now
        );
      });
    };

    // Check every second for precision
    const interval = setInterval(checkExpiredOrders, 1000);
    
    return () => clearInterval(interval);
  }, [displayPrice, addBalance]);

  // Monitor scheduled orders and activate them when scheduled time arrives
  useEffect(() => {
    const checkScheduledOrders = () => {
      const now = new Date();
      
      setScheduledOrders(prev => {
        const readyOrders = prev.filter(order => 
          order.scheduledTime && new Date(order.scheduledTime) <= now
        );
        
        if (readyOrders.length > 0) {
          // Move ready orders to active orders
          const activeOrdersData = readyOrders.map(order => ({
            ...order,
            status: 'active' as const,
            expiryTime: new Date(now.getTime() + (order.duration || 0) * 1000).toISOString()
          }));
          
          setActiveOrders(prevActive => [...prevActive, ...activeOrdersData]);
          
          // Show notifications for activated orders
          readyOrders.forEach(order => {
            toast.success(`🚀 Scheduled order activated: ${order.symbol} ${order.direction}`);
          });
        }
        
        // Keep only future scheduled orders
        return prev.filter(order => 
          !order.scheduledTime || new Date(order.scheduledTime) > now
        );
      });
    };

    // Check every second for precision
    const interval = setInterval(checkScheduledOrders, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // WALLET INTEGRATION HANDLERS
  // ============================================

  const deductFromTradingWallet = async (amount: number, description: string) => {
    try {
      const result = await deductBalance('USDT', amount, 'trade_stake', `trade_${Date.now()}`);
      return result.success;
    } catch (error) {
      console.error('Failed to deduct from trading wallet:', error);
      return false;
    }
  };

  const addToTradingWallet = async (amount: number, description: string) => {
    try {
      const result = await addBalance('USDT', amount, 'trade_profit', `trade_profit_${Date.now()}`, { description });
      return result.success;
    } catch (error) {
      console.error('Failed to add to trading wallet:', error);
      return false;
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleAssetSelect = (asset: TradingPair) => {
    navigate(`/trading/${asset.baseAsset.toLowerCase()}${activeTab === 'spot' ? '' : '/' + activeTab}`);
  };

  const handleSpotTrade = async () => {
    console.log('handleSpotTrade called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('spotAmount:', spotAmount);
    
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const parsedAmount = parseFloat(spotAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const total = parsedAmount * displayPrice;
    const balance = getTradingBalance('USDT');

    if (total > balance) {
      toast.error(`Insufficient balance. Need $${total.toFixed(2)} USDT`);
      return;
    }

    try {
      // Deduct from trading wallet
      const deducted = await deductFromTradingWallet(total, 'Spot trade');
      if (!deducted) {
        toast.error('Failed to process transaction');
        return;
      }

      // Execute spot trade
      const order: Order = {
        id: Date.now().toString(),
        symbol: selectedPair.symbol,
        side: spotSide,
        amount: parsedAmount,
        price: displayPrice,
        total: total,
        type: 'spot',
        status: 'filled',
        timestamp: new Date().toISOString(),
        fee: total * 0.001 // 0.1% fee
      };

      console.log('Executing spot trade:', order);
      
      toast.loading('Executing trade...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.dismiss();
      toast.success(`${spotSide === 'buy' ? 'Bought' : 'Sold'} ${parsedAmount} ${selectedPair.baseAsset} at $${displayPrice.toFixed(2)}`);
      
      // Add to spot orders
      setSpotOrders(prev => [...prev, order]);
      
      console.log('Trade execution completed, clearing form...');
      
      // Clear form
      setSpotAmount('');
      
    } catch (error) {
      toast.dismiss();
      toast.error('Trade execution failed. Please try again.');
      console.error('Spot trade error:', error);
    }
  };

  const handleFuturesTrade = async () => {
    console.log('handleFuturesTrade called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('futuresAmount:', futuresAmount);
    
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const parsedAmount = parseFloat(futuresAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const margin = parsedAmount / futuresLeverage;
    const balance = getTradingBalance('USDT');

    if (margin > balance) {
      toast.error(`Insufficient balance. Need $${margin.toFixed(2)} USDT for margin`);
      return;
    }

    try {
      // Lock margin in trading wallet
      const locked = await lockBalance('USDT', margin, `futures_margin_${Date.now()}`);
      if (!locked) {
        toast.error('Failed to lock margin');
        return;
      }

      // Execute futures trade
      const tradeData: Order = {
        id: Date.now().toString(),
        symbol: selectedPair.symbol,
        side: futuresSide === 'long' ? 'long' : 'short',
        amount: parsedAmount,
        price: displayPrice,
        type: 'futures',
        status: futuresTradeType === 'open' ? 'active' : 'filled',
        timestamp: new Date().toISOString(),
        leverage: futuresLeverage,
        margin: margin,
        fee: margin * 0.001 // 0.1% fee on margin
      };

      console.log('Executing futures trade:', tradeData);
      
      toast.loading('Executing futures trade...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.dismiss();
      toast.success(`${futuresTradeType === 'open' ? 'Opened' : 'Closed'} ${futuresSide} position: ${parsedAmount} ${selectedPair.baseAsset} at ${futuresLeverage}x leverage`);
      
      // Clear form
      setFuturesAmount('');
      setFuturesPercentage(0);
      
      // Add to futures positions
      const position: Order = {
        ...tradeData,
        status: futuresTradeType === 'open' ? 'active' : 'filled',
        pnl: 0,
        entryPrice: displayPrice,
        expiryTime: futuresTradeType === 'open' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined // 24h expiry for demo
      };
      
      console.log('Position executed:', position);
      
      setFuturesPositions(prev => {
        const newPositions = [...prev, position];
        console.log('New futuresPositions array:', newPositions);
        return newPositions;
      });
      
    } catch (error) {
      toast.dismiss();
      toast.error('Futures trade execution failed. Please try again.');
      console.error('Futures trade error:', error);
    }
  };

  const handleOptionTrade = async () => {
    console.log('handleOptionTrade called');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('optionAmount:', optionAmount);
    
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const parsedAmount = parseFloat(optionAmount);
    console.log('Parsed amount:', parsedAmount);
    
    if (!parsedAmount || parsedAmount <= 0) {
      console.log('Amount validation failed');
      toast.error('Please enter a valid amount');
      return;
    }

    const purchaseRange = PURCHASE_RANGES[optionDuration as keyof typeof PURCHASE_RANGES];
    console.log('Purchase range:', purchaseRange);
    console.log('Checking amount range:', parsedAmount, 'min:', purchaseRange.min, 'max:', purchaseRange.max);
    
    if (parsedAmount < purchaseRange.min || parsedAmount > purchaseRange.max) {
      console.log('Purchase range validation failed');
      toast.error(`Amount must be between ${purchaseRange.min} and ${purchaseRange.max} USDT`);
      return;
    }

    const balance = getTradingBalance('USDT');
    console.log('Balance check:', { parsedAmount, balance });
    
    if (parsedAmount > balance) {
      console.log('Balance validation failed');
      const fundingBalance = getFundingBalance ? getFundingBalance('USDT') : 0;
      if (fundingBalance >= parsedAmount) {
        toast.error(`Insufficient trading balance. You have $${fundingBalance.toFixed(2)} USDT in funding wallet. Transfer funds to trading wallet first.`);
      } else {
        toast.error(`Insufficient balance. Need $${parsedAmount.toFixed(2)} USDT, but only have $${balance.toFixed(2)} USDT available.`);
      }
      return;
    }

    console.log('All validations passed, proceeding to execution...');

    try {
      console.log('Starting option trade execution...');
      
      // Deduct from trading wallet (premium paid for option)
      const deducted = await deductFromTradingWallet(parsedAmount, 'Option purchase');
      if (!deducted) {
        toast.error('Failed to process transaction');
        return;
      }

      // Execute options trade
      const tradeData: Order = {
        id: Date.now().toString(),
        symbol: selectedPair.symbol,
        side: optionDirection === 'up' ? 'UP' : 'DOWN',
        amount: parsedAmount,
        price: displayPrice,
        type: 'option',
        status: isScheduled ? 'pending' : 'active',
        timestamp: new Date().toISOString(),
        direction: optionDirection === 'up' ? 'UP' : 'DOWN',
        duration: optionDuration,
        payout: optionPayout,
        move: optionMove,
        fee: parsedAmount * 0.001, // 0.1% fee
        entryPrice: displayPrice,
        isScheduled: isScheduled,
        scheduledTime: isScheduled ? new Date(Date.now() + 
          (scheduledTime.hours * 3600 + scheduledTime.minutes * 60 + scheduledTime.seconds) * 1000
        ).toISOString() : null,
        expiryTime: isScheduled ? null : new Date(Date.now() + optionDuration * 1000).toISOString()
      };

      console.log('Trade data prepared:', tradeData);
      console.log('Executing options trade:', tradeData);
      
      if (isScheduled) {
        console.log('Processing scheduled trade...');
        toast.loading('Scheduling option trade...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.dismiss();
        toast.success(`Trade scheduled for ${scheduledTime.hours.toString().padStart(2, '0')}:${scheduledTime.minutes.toString().padStart(2, '0')}:${scheduledTime.seconds.toString().padStart(2, '0')} UTC`);
        setIsScheduled(false);
      } else {
        console.log('Processing immediate trade...');
        toast.loading('Purchasing option...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.dismiss();
        toast.success(`Option purchased: ${optionDirection.toUpperCase()} ${selectedPair.baseAsset} - ${optionDuration}s at $${parsedAmount}`);
      }
      
      console.log('Trade execution completed, clearing form...');
      
      // Clear form
      setOptionAmount('');
      setOptionPercentage(0);
      
      // Add to options history
      const option: Order = {
        id: Date.now().toString(),
        ...tradeData,
        status: isScheduled ? 'pending' : 'active',
        expiryTime: isScheduled ? null : new Date(Date.now() + optionDuration * 1000).toISOString(),
        startTime: new Date().toISOString(),
        durationLabel: OPTIONS_TIMEFRAMES.find(tf => tf.value === optionDuration)?.durationLabel || `${optionDuration}s`,
        scheduledTime: isScheduled ? new Date(Date.now() + 
          (scheduledTime.hours * 3600 + scheduledTime.minutes * 60 + scheduledTime.seconds) * 1000
        ).toISOString() : null
      };
      console.log('Option executed:', option);
      
      // Store in appropriate state array
      if (isScheduled) {
        setScheduledOrders(prev => [...prev, option]);
      } else {
        setActiveOrders(prev => [...prev, option]);
      }
      
    } catch (error) {
      console.error('Error in option trade:', error);
      toast.dismiss();
      toast.error('Option purchase failed. Please try again.');
      console.error('Option trade error:', error);
    }
  };

  const handleSaveScheduled = () => {
    setIsScheduled(true);
    setShowScheduledModal(false);
    toast.success(`Trade scheduled for ${scheduledTime.hours}:${scheduledTime.minutes}:${scheduledTime.seconds} UTC`);
  };

  // Get current UTC time
  const currentUTC = new Date().toISOString().split('T')[1].split('.')[0];

  // ============================================
  // RENDER
  // ============================================

  return (
    <motion.div 
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF] pb-24"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-50 bg-[#1E2329]/95 backdrop-blur-xl border-b border-[#2B3139]/50">
        <div className="px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/trading')} 
                className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#2B3139' }}
                onClick={() => setShowAssetSelector(true)}
                className="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors"
              >
                <h1 className="text-xl font-semibold text-[#EAECEF]">{selectedPair.baseAsset}</h1>
                <ChevronDown className="w-4 h-4 text-[#848E9C]" />
              </motion.button>
              <span className={`text-sm ${displayChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setHideBalances(!hideBalances)}
                className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                <Eye className="h-5 w-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(`/trading/${symbol}/chart`)}
                className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/trading')}
                className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                title="Asset Selector"
              >
                <LayoutGrid className="h-5 w-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center hover:bg-[#F0B90B]/90 transition-colors"
              >
                <span className="text-sm font-bold text-[#0B0E11]">
                  {user?.email?.[0] || 'U'}
                </span>
              </motion.button>
            </div>
          </div>

          {/* Market Tabs */}
          <div className="flex space-x-6 mt-4">
            {['Spot', 'Future', 'Option'].map((tabName) => (
              <motion.button
                key={tabName}
                whileHover={{ y: -1 }}
                onClick={() => {
                  const newTab = tabName.toLowerCase() as TabType;
                  setActiveTab(newTab);
                  navigate(`/trading/${symbol}${newTab === 'spot' ? '' : '/' + newTab}`);
                }}
                className={`pb-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tabName.toLowerCase()
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {tabName}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TIMEFRAMES ===== */}
      <div className="px-4 py-3 flex space-x-4 border-b border-[#2B3139]">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`text-sm font-medium ${
              selectedTimeframe === tf ? 'text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* ===== PRICE INFO ===== */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-[#2B3139]">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-[#EAECEF]">
            ${displayPrice.toFixed(2)} {priceChange24h && priceChange24h >= 0 ? '↑' : '↓'}
          </span>
          <span className={`text-sm ${displayChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
          </span>
        </div>
        <span className="text-xs text-[#848E9C]">
          ≈${displayPrice.toFixed(2)}
        </span>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="px-4 py-4">
        {/* Mini Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-24 bg-[#1E2329] rounded-lg mb-6 flex items-end justify-between px-2"
        >
          <div className="flex items-end gap-1 h-full py-2">
            {chartData.map((height, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: height * 3 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className={`w-8 rounded-t transition-all duration-500 ease-in-out ${
                  i > 0 && height > chartData[i - 1] ? 'bg-[#0ECB81]/40' : 'bg-[#F6465D]/40'
                }`}
                style={{ height: `${height * 3}px` }}
              />
            ))}
          </div>
        </motion.div>

        {/* ===== SPOT TAB ===== */}
        {activeTab === 'spot' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Buy/Sell/BorrowRepay */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setSpotSide('buy')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  spotSide === 'buy'
                    ? 'bg-[#0ECB81] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setSpotSide('sell')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  spotSide === 'sell'
                    ? 'bg-[#F6465D] text-white'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Sell
              </button>
              <button 
                onClick={() => navigate('/loan')}
                className="py-3 rounded-lg text-sm font-medium bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]"
              >
                Borrow/Repay
              </button>
            </div>

            {/* Market Price */}
            <div className="mb-4">
              <div className="text-xs text-[#848E9C] mb-1">Market</div>
              <div className="text-lg font-mono text-[#EAECEF]">{displayPrice.toFixed(2)}</div>
            </div>

            {/* Order Book - Two Column */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Price Column */}
              <div>
                <div className="text-xs text-[#848E9C] mb-2">Price (USDT)</div>
                <div className="space-y-1">
                  {spotOrderBookAsks.map((ask, i) => (
                    <div key={i} className="text-sm font-mono text-[#F6465D]">{ask.price.toFixed(2)}</div>
                  ))}
                  <div className="text-sm font-mono text-[#EAECEF] font-bold border-t border-b border-[#2B3139] py-1 my-1">
                    {displayPrice.toFixed(2)}
                  </div>
                  {spotOrderBookBids.map((bid, i) => (
                    <div key={i} className="text-sm font-mono text-[#0ECB81]">{bid.price.toFixed(2)}</div>
                  ))}
                </div>
              </div>

              {/* Available Column */}
              <div>
                <div className="text-xs text-[#848E9C] mb-2">Available ({selectedPair.baseAsset})</div>
                <div className="space-y-1">
                  {spotOrderBookAsks.map((ask, i) => (
                    <div key={i} className="text-sm font-mono text-[#B7BDC6] text-right">{ask.quantity.toFixed(3)}</div>
                  ))}
                  <div className="text-sm font-mono text-[#EAECEF] font-bold border-t border-b border-[#2B3139] py-1 my-1 text-right">
                    0.00000
                  </div>
                  {spotOrderBookBids.map((bid, i) => (
                    <div key={i} className="text-sm font-mono text-[#B7BDC6] text-right">{bid.quantity.toFixed(3)}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trading Form */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Available</span>
                <span className="text-[#EAECEF]">
                  {hideBalances ? '••••' : formatCurrency(getTradingBalance('USDT'))} USDT
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Est. fee</span>
                <span className="text-[#EAECEF]">-- USDT</span>
              </div>

              <input
                type="number"
                value={spotAmount}
                onChange={(e) => setSpotAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
              />

              <div className="space-y-1">
                {spotOrderBookBids.map((bid, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[#0ECB81] font-mono">{bid.price.toFixed(2)}</span>
                    <span className="text-[#B7BDC6]">{bid.quantity.toFixed(3)}</span>
                  </div>
                ))}
              </div>

              <BinanceButton
                variant={spotSide === 'buy' ? 'success' : 'danger'}
                onClick={handleSpotTrade}
                disabled={!spotAmount || parseFloat(spotAmount) <= 0}
              >
                {spotSide === 'buy' ? 'Buy' : 'Sell'} {selectedPair.baseAsset}
              </BinanceButton>
            </div>
          </motion.div>
        )}

        {/* ===== FUTURES TAB ===== */}
        {activeTab === 'future' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Open/Close/BorrowRepay */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setFuturesTradeType('open')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  futuresTradeType === 'open'
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFuturesTradeType('close')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  futuresTradeType === 'close'
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Close
              </button>
              <button className="py-3 rounded-lg text-sm font-medium bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]">
                Borrow/Repay
              </button>
            </div>

            {/* Leverage */}
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={() => setShowLeverageModal(true)}
                className="flex items-center space-x-1 bg-[#1E2329] px-3 py-1 rounded-lg hover:bg-[#2B3139] transition-colors"
              >
                <span className="text-[#F0B90B] font-medium">{futuresLeverage}x</span>
                <ChevronDown className="h-4 w-4 text-[#848E9C]" />
              </button>
            </div>

            {/* Market Price */}
            <div className="mb-4">
              <div className="text-xs text-[#848E9C] mb-1">Market</div>
              <div className="text-lg font-mono text-[#EAECEF]">{displayPrice.toFixed(2)}</div>
            </div>

            {/* Order Book - Two Column */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Price Column */}
              <div>
                <div className="text-xs text-[#848E9C] mb-2">Price (USDT)</div>
                <div className="space-y-1">
                  {futuresOrderBookAsks.map((ask, i) => (
                    <div key={i} className="text-sm font-mono text-[#F6465D]">{ask.price.toFixed(2)}</div>
                  ))}
                  <div className="text-sm font-mono text-[#EAECEF] font-bold border-t border-b border-[#2B3139] py-1 my-1">
                    {displayPrice.toFixed(2)}
                  </div>
                  {futuresOrderBookBids.map((bid, i) => (
                    <div key={i} className="text-sm font-mono text-[#0ECB81]">{bid.price.toFixed(2)}</div>
                  ))}
                </div>
              </div>

              {/* Available Column */}
              <div>
                <div className="text-xs text-[#848E9C] mb-2">Available ({selectedPair.baseAsset})</div>
                <div className="space-y-1">
                  {futuresOrderBookAsks.map((ask, i) => (
                    <div key={i} className="text-sm font-mono text-[#B7BDC6] text-right">{ask.available.toFixed(3)}</div>
                  ))}
                  <div className="text-sm font-mono text-[#EAECEF] font-bold border-t border-b border-[#2B3139] py-1 my-1 text-right">
                    0.000
                  </div>
                  {futuresOrderBookBids.map((bid, i) => (
                    <div key={i} className="text-sm font-mono text-[#B7BDC6] text-right">{bid.amount.toFixed(3)}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trading Form */}
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Buy Hands</span>
                <span className="text-[#EAECEF]">{selectedPair.baseAsset}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">≈${displayPrice.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[0, 25, 50, 75].map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setFuturesPercentage(p);
                      if (p > 0) {
                        const balance = getTradingBalance('USDT');
                        setFuturesAmount(((balance * p) / 100).toFixed(3));
                      } else {
                        setFuturesAmount('');
                      }
                    }}
                    className={`py-3 rounded text-sm ${
                      futuresPercentage === p
                        ? 'bg-[#F0B90B] text-[#0B0E11]'
                        : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={futuresAmount}
                onChange={(e) => {
                  setFuturesAmount(e.target.value);
                  setFuturesPercentage(0);
                }}
                placeholder="0.000"
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="tpSl"
                  checked={tpSlEnabled}
                  onChange={(e) => setTpSlEnabled(e.target.checked)}
                  className="rounded bg-[#1E2329] border-[#2B3139] accent-[#F0B90B]"
                />
                <label htmlFor="tpSl" className="text-sm text-[#848E9C]">
                  Take Profit / Stop Lose
                </label>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Available</span>
                <span className="text-[#EAECEF]">{getTradingBalance('USDT').toFixed(2)} USDT</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Max open</span>
                <span className="text-[#EAECEF]">{((getTradingBalance('USDT') * futuresLeverage) / displayPrice).toFixed(2)}</span>
              </div>

              <BinanceButton
                variant="primary"
                onClick={handleFuturesTrade}
                disabled={!futuresAmount || parseFloat(futuresAmount) <= 0}
              >
                Buy
              </BinanceButton>
            </div>
          </motion.div>
        )}

        {/* ===== OPTIONS TAB ===== */}
        {activeTab === 'option' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Up/Down/BorrowRepay */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setOptionDirection('up')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  optionDirection === 'up'
                    ? 'bg-[#0ECB81] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Up
              </button>
              <button
                onClick={() => setOptionDirection('down')}
                className={`py-3 rounded-lg text-sm font-medium ${
                  optionDirection === 'down'
                    ? 'bg-[#F6465D] text-white'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Down
              </button>
              <button className="py-3 rounded-lg text-sm font-medium bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]">
                Borrow/Repay
              </button>
            </div>

            {/* Open Position Now / Scheduled Time */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsScheduled(false)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  !isScheduled
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Open Position Now
              </button>
              <button
                onClick={() => setShowScheduledModal(true)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                  isScheduled
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                <Clock className="w-4 h-4" />
                Scheduled Time
              </button>
            </div>

            {/* Options Order Book - Clean Layout */}
            <div className="space-y-4 mb-6">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 text-xs text-[#848E9C]">
                <span>Price (USDT)</span>
                <span className="text-center">Available ({selectedPair.baseAsset})</span>
                <span className="text-right">Total</span>
              </div>

              {/* Asks */}
              <div className="space-y-1">
                {optionsOrderBookAsks.map((ask, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                    <span className="text-[#F6465D] font-mono">{ask.price.toFixed(2)}</span>
                    <span className="text-[#B7BDC6] font-mono text-center">{ask.quantity.toFixed(3)}</span>
                    <span className="text-[#848E9C] font-mono text-right">
                      {(ask.price * ask.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Current Price */}
              <div className="grid grid-cols-3 gap-4 items-center py-2 border-y border-[#2B3139]">
                <span className="text-[#EAECEF] font-bold font-mono">{displayPrice.toFixed(2)} ↓</span>
                <span className="text-xs text-[#848E9C] text-center">≈${displayPrice.toFixed(2)}</span>
                <span className="text-[#848E9C] text-right">0.000</span>
              </div>

              {/* Bids */}
              <div className="space-y-1">
                {optionsOrderBookBids.map((bid, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 text-sm">
                    <span className="text-[#0ECB81] font-mono">{bid.price.toFixed(2)}</span>
                    <span className="text-[#B7BDC6] font-mono text-center">{bid.quantity.toFixed(3)}</span>
                    <span className="text-[#848E9C] font-mono text-right">
                      {(bid.price * bid.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Options Trading Form */}
            <div className="space-y-4">
              {/* Purchase Range */}
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Purchase Range</span>
                <span className="text-[#EAECEF]">
                  {PURCHASE_RANGES[optionDuration as keyof typeof PURCHASE_RANGES].min}-
                  {PURCHASE_RANGES[optionDuration as keyof typeof PURCHASE_RANGES].max}
                </span>
              </div>

              {/* Duration Selection */}
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Duration</span>
                <button 
                  onClick={() => setShowDurationModal(true)}
                  className="text-[#F0B90B] hover:text-[#F0B90B]/80 transition-colors flex items-center gap-1"
                >
                  {OPTIONS_TIMEFRAMES.find(tf => tf.value === optionDuration)?.label || '60s'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Fluctuation Range */}
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Fluctuation</span>
                <button 
                  onClick={() => setShowFluctuationModal(true)}
                  className="text-[#F0B90B] hover:text-[#F0B90B]/80 transition-colors flex items-center gap-1"
                >
                  {FLUCTUATION_RANGES[optionDuration as keyof typeof FLUCTUATION_RANGES]?.find(
                    f => f.value === optionFluctuation
                  )?.label || 'UP > 0.01%'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Available */}
              <div className="flex justify-between text-sm">
                <span className="text-[#848E9C]">Available</span>
                <span className="text-[#EAECEF]">
                  {hideBalances ? '••••' : formatCurrency(getTradingBalance('USDT'))} USDT
                </span>
              </div>

              {/* Expected Profit */}
              {optionAmount && (
                <div className="flex justify-between text-sm">
                  <span className="text-[#848E9C]">Expected Profit</span>
                  <span className="text-[#0ECB81] font-mono">
                    +${(parseFloat(optionAmount) * optionPayout).toFixed(2)} USDT
                  </span>
                </div>
              )}

              {/* Amount Input */}
              <input
                type="number"
                value={optionAmount}
                onChange={(e) => {
                  setOptionAmount(e.target.value);
                  setOptionPercentage(0);
                }}
                placeholder="Enter amount"
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
              />

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map(p => {
                  const max = PURCHASE_RANGES[optionDuration as keyof typeof PURCHASE_RANGES].max;
                  const amount = Math.floor(max * (p / 100));
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setOptionAmount(amount.toString());
                        setOptionPercentage(p);
                      }}
                      className={`py-3 rounded text-sm ${
                        optionPercentage === p
                          ? 'bg-[#F0B90B] text-[#0B0E11]'
                          : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      {p}%
                    </button>
                  );
                })}
              </div>

              {/* Buy Button */}
              <BinanceButton
                variant="primary"
                onClick={handleOptionTrade}
                disabled={!optionAmount || parseFloat(optionAmount) <= 0}
              >
                {isScheduled ? 'Schedule Trade' : 'Buy'}
              </BinanceButton>
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== BOTTOM TABS ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E2329] border-t border-[#2B3139]">
        <div className="flex border-b border-[#2B3139]">
          {activeTab === 'option' ? (
            // Options Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('active')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'active'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveBottomTab('scheduled')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'scheduled'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setActiveBottomTab('completed')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'completed'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Completed
              </button>
            </>
          ) : activeTab === 'future' ? (
            // Futures Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('positions')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'positions'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Positions
              </button>
              <button
                onClick={() => setActiveBottomTab('open')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'open'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Open orders
              </button>
              <button
                onClick={() => setActiveBottomTab('closed')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'closed'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Closed Orders
              </button>
            </>
          ) : (
            // Spot Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('open')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'open'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Open orders
              </button>
              <button
                onClick={() => setActiveBottomTab('completed')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'completed'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveBottomTab('assets')}
                className={`flex-1 py-3 text-sm ${
                  activeBottomTab === 'assets'
                    ? 'text-[#F0B90B] border-b-2 border-[#F0B90B]'
                    : 'text-[#848E9C]'
                }`}
              >
                Assets
              </button>
            </>
          )}
        </div>

        {/* Tab Content */}
        <div className="max-h-64 overflow-y-auto bg-[#1E2329]">
          {activeTab === 'option' ? (
            // Options Tab Content
            <>
              {activeBottomTab === 'active' && activeOrders.length > 0 && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Active Options</h3>
                  {activeOrders.map((order, index) => (
                    <div key={order.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-[#848E9C] font-mono">#{order.id}</span>
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#0ECB81]/20 text-[#0ECB81] border border-[#0ECB81]/30">
                            <div className="w-2 h-2 bg-[#0ECB81] rounded-full animate-pulse" />
                            active
                          </div>
                        </div>
                        
                        {/* Countdown Timer */}
                        {order.expiryTime && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-[#848E9C]" />
                            <Countdown
                              date={new Date(order.expiryTime)}
                              renderer={CountdownRenderer}
                            />
                          </div>
                        )}
                      </div>

                      {/* Main Trade Info */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${
                            order.direction === 'UP' 
                              ? 'bg-[#0ECB81]/20 text-[#0ECB81]' 
                              : 'bg-[#F6465D]/20 text-[#F6465D]'
                          }`}>
                            {order.direction === 'UP' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#EAECEF]">
                              {order.symbol}
                            </div>
                            <div className="text-sm text-[#B7BDC6] font-mono">
                              ${typeof order.entryPrice === 'number' ? order.entryPrice.toFixed(2) : displayPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-[#EAECEF]">
                            ${order.amount}
                          </div>
                          <div className="text-xs text-[#848E9C]">
                            {order.duration}s
                          </div>
                        </div>
                      </div>

                      {/* Price Details */}
                      <div className="flex justify-between items-center pt-3 border-t border-[#3A3F4A]">
                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-xs text-[#848E9C]">Entry</div>
                            <div className="text-sm text-[#B7BDC6] font-mono">
                              ${typeof order.entryPrice === 'number' ? order.entryPrice.toFixed(2) : order.entryPrice}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#848E9C]">Current</div>
                            <div className={`text-sm font-mono ${
                              (order.direction === 'UP' && displayPrice > (order.entryPrice || 0)) ||
                              (order.direction === 'DOWN' && displayPrice < (order.entryPrice || 0))
                                ? 'text-[#0ECB81]'
                                : 'text-[#F6465D]'
                            }`}>
                              ${displayPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm font-medium text-[#F0B90B]">
                          +${order.payout ? (order.amount * order.payout).toFixed(2) : '0'} est.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeBottomTab === 'scheduled' && scheduledOrders.length > 0 && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Scheduled Orders</h3>
                  {scheduledOrders.map((order, index) => (
                    <div key={order.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-[#848E9C] font-mono">#{order.id}</span>
                          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#F0B90B]/20 text-[#F0B90B] border border-[#F0B90B]/30">
                            <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-pulse" />
                            scheduled
                          </div>
                        </div>
                        
                        {/* Scheduled Time */}
                        {order.scheduledTime && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-[#848E9C]" />
                            <span className="text-xs text-[#B7BDC6]">
                              {new Date(order.scheduledTime).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Main Trade Info */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${
                            order.direction === 'UP' 
                              ? 'bg-[#0ECB81]/20 text-[#0ECB81]' 
                              : 'bg-[#F6465D]/20 text-[#F6465D]'
                          }`}>
                            {order.direction === 'UP' ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#EAECEF]">
                              {order.symbol}
                            </div>
                            <div className="text-sm text-[#B7BDC6] font-mono">
                              ${order.entryPrice?.toFixed(2) || displayPrice.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium text-[#EAECEF]">
                            ${order.amount}
                          </div>
                          <div className="text-xs text-[#848E9C]">
                            {order.duration}s
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end pt-3 border-t border-[#3A3F4A]">
                        <button 
                          onClick={() => {
                            setScheduledOrders(prev => prev.filter(o => o.id !== order.id));
                            toast.success('Scheduled order cancelled');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#F6465D]/20 text-[#F6465D] hover:bg-[#F6465D]/30 transition-colors text-xs font-medium"
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {activeBottomTab === 'completed' && completedOrders.length > 0 && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Completed Options</h3>
                  {completedOrders.map((order, index) => (
                    <CompletedOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'future' ? (
            // Futures Tab Content
            <>
              {activeBottomTab === 'positions' && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Open Positions</h3>
                  {futuresPositions.length > 0 ? (
                    futuresPositions.map((position, index) => (
                      <div key={position.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-[#848E9C] font-mono">#{position.id}</span>
                            <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-[#0ECB81]/20 text-[#0ECB81] border border-[#0ECB81]/30">
                              <div className="w-2 h-2 bg-[#0ECB81] rounded-full animate-pulse" />
                              {position.status}
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            position.side === 'long' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'
                          }`}>
                            {position.side?.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-[#848E9C]">Size</div>
                            <div className="text-sm font-medium text-[#EAECEF]">
                              {position.amount} {position.symbol?.replace('USDT', '')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#848E9C]">Entry Price</div>
                            <div className="text-sm text-[#B7BDC6] font-mono">
                              ${position.price?.toFixed(2) || position.entryPrice?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#848E9C]">Leverage</div>
                            <div className="text-sm text-[#F0B90B] font-medium">
                              {position.leverage}x
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#848E9C]">PnL</div>
                            <div className={`text-sm font-medium ${
                              (position.unrealizedPnl || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                            }`}>
                              ${position.unrealizedPnl?.toFixed(2) || '0'}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-[#3A3F4A]">
                          <button 
                            onClick={() => {
                              setFuturesPositions(prev => prev.filter(p => p.id !== position.id));
                              toast.success('Position closed');
                            }}
                            className="px-4 py-2 bg-[#F0B90B] text-[#0B0E11] rounded-lg text-sm font-medium hover:bg-[#F0B90B]/90 transition-colors"
                          >
                            Close Position
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#848E9C] text-sm text-center py-4">No open positions</div>
                  )}
                </div>
              )}
              
              {activeBottomTab === 'open' && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Open Orders</h3>
                  {futuresOrders.length > 0 ? (
                    futuresOrders.map((order, index) => (
                      <div key={order.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#848E9C] font-mono">#{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'filled' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F0B90B]/20 text-[#F0B90B]'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-[#B7BDC6]">
                          <div className="flex justify-between mb-1">
                            <span>{order.symbol} {order.side?.toString().toUpperCase()}</span>
                            <span className="text-[#848E9C]">{new Date(order.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount: {order.amount} {order.symbol?.replace('USDT', '')}</span>
                            <span className="text-[#848E9C]">Price: ${order.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#848E9C] text-sm text-center py-4">No open orders</div>
                  )}
                </div>
              )}
              
              {activeBottomTab === 'closed' && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Closed Orders</h3>
                  <div className="text-[#848E9C] text-sm text-center py-4">No closed orders</div>
                </div>
              )}
            </>
          ) : (
            // Spot Tab Content
            <>
              {activeBottomTab === 'open' && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Open Orders</h3>
                  {spotOrders.length > 0 ? (
                    spotOrders.map((order, index) => (
                      <div key={order.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#848E9C] font-mono">#{order.id}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'filled' ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F0B90B]/20 text-[#F0B90B]'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-[#B7BDC6]">
                          <div className="flex justify-between mb-1">
                            <span>{order.symbol} {order.side?.toString().toUpperCase()}</span>
                            <span className="text-[#848E9C]">{new Date(order.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount: {order.amount} {order.symbol?.replace('USDT', '')}</span>
                            <span className="text-[#848E9C]">Price: ${order.price?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#848E9C] text-sm text-center py-4">No open orders</div>
                  )}
                </div>
              )}
              
              {activeBottomTab === 'completed' && (
                <div className="px-4 py-4 space-y-3">
                  <h3 className="text-[#EAECEF] font-medium mb-3">Completed Orders</h3>
                  {completedOrders.length > 0 ? (
                    completedOrders.map((order, index) => (
                      <div key={order.id} className="bg-[#2B3139] rounded-xl p-4 border border-[#3A3F4A]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-[#848E9C] font-mono">#{order.id}</span>
                          <span className="text-xs px-2 py-1 rounded bg-[#0ECB81]/20 text-[#0ECB81]">
                            completed
                          </span>
                        </div>
                        <div className="text-sm text-[#B7BDC6]">
                          <div className="flex justify-between mb-1">
                            <span>{order.symbol} {order.side?.toString().toUpperCase()}</span>
                            <span className="text-[#848E9C]">{new Date(order.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Amount: {order.amount} {order.symbol?.replace('USDT', '')}</span>
                            <span className={`font-medium ${(order.pnl || 0) >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                              {order.pnl ? (order.pnl >= 0 ? '+' : '') + order.pnl.toFixed(2) : '0'} USDT
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[#848E9C] text-sm text-center py-4">No completed orders</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Chart Link */}
        <div className="py-3 text-center border-t border-[#2B3139]">
          <button 
            onClick={() => navigate(`/trading/${symbol}/chart`)}
            className="text-[#F0B90B] text-sm flex items-center justify-center space-x-2 hover:text-[#F0B90B]/80 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{selectedPair.baseAsset} Chart</span>
          </button>
        </div>

        {/* Kryvex Footer */}
        <div className="py-2 text-center text-xs text-[#848E9C]">
          kryvex.com
        </div>
      </div>

      {/* ===== ASSET SELECTOR MODAL ===== */}
      <AssetSelectorModal
        isOpen={showAssetSelector}
        onClose={() => setShowAssetSelector(false)}
        onSelect={handleAssetSelect}
        currentCategory={selectedPair.category}
      />

      {/* ===== MODALS ===== */}

      {/* Leverage Modal */}
      <AnimatePresence>
        {showLeverageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
            onClick={() => setShowLeverageModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#EAECEF]">Select Leverage</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowLeverageModal(false)}
                    className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#848E9C]" />
                  </motion.button>
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-3">
                {LEVERAGE_OPTIONS.map(lev => (
                  <motion.button
                    key={lev}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setFuturesLeverage(lev);
                      setShowLeverageModal(false);
                    }}
                    className={`p-3 rounded-lg text-center ${
                      futuresLeverage === lev
                        ? 'bg-[#F0B90B] text-[#0B0E11]'
                        : 'bg-[#2B3139] text-[#848E9C] hover:bg-[#373B42]'
                    }`}
                  >
                    {lev}x
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scheduled Time Modal */}
      <AnimatePresence>
        {showScheduledModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
            onClick={() => setShowScheduledModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAECEF]">Scheduled Time</h3>
                    <p className="text-xs text-[#848E9C] mt-1">
                      Customize the opening time (UTC+0) for your position.
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowScheduledModal(false)}
                    className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#848E9C]" />
                  </motion.button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Time Display */}
                <div className="bg-[#2B3139] rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-xs text-[#848E9C] mb-1">Current Time (UTC+0)</div>
                    <div className="text-lg font-mono text-[#EAECEF]">{currentUTC}</div>
                  </div>
                </div>

                {/* Time Selector */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Hours */}
                  <div>
                    <label className="text-xs text-[#848E9C] block mb-1">Hours</label>
                    <div className="bg-[#2B3139] rounded-lg p-2 flex items-center justify-between">
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, hours: Math.max(0, prev.hours - 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-mono text-[#EAECEF]">
                        {scheduledTime.hours.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, hours: Math.min(23, prev.hours + 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Minutes */}
                  <div>
                    <label className="text-xs text-[#848E9C] block mb-1">Minutes</label>
                    <div className="bg-[#2B3139] rounded-lg p-2 flex items-center justify-between">
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, minutes: Math.max(0, prev.minutes - 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-mono text-[#EAECEF]">
                        {scheduledTime.minutes.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, minutes: Math.min(59, prev.minutes + 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Seconds */}
                  <div>
                    <label className="text-xs text-[#848E9C] block mb-1">Seconds</label>
                    <div className="bg-[#2B3139] rounded-lg p-2 flex items-center justify-between">
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, seconds: Math.max(0, prev.seconds - 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-mono text-[#EAECEF]">
                        {scheduledTime.seconds.toString().padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => setScheduledTime(prev => ({ ...prev, seconds: Math.min(59, prev.seconds + 1) }))}
                        className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scheduled Time Display */}
                <div className="bg-[#2B3139] rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-xs text-[#848E9C] mb-1">Open Position</div>
                    <div className="text-lg font-mono text-[#F0B90B]">
                      {scheduledTime.hours.toString().padStart(2, '0')}:
                      {scheduledTime.minutes.toString().padStart(2, '0')}:
                      {scheduledTime.seconds.toString().padStart(2, '0')} (UTC+0)
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowScheduledModal(false)}
                    className="flex-1 bg-[#2B3139] text-[#848E9C] py-3 rounded-lg font-medium hover:bg-[#373B42] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScheduled}
                    className="flex-1 bg-[#F0B90B] text-[#0B0E11] py-3 rounded-lg font-medium hover:bg-[#F0B90B]/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Duration Modal */}
      <AnimatePresence>
        {showDurationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
            onClick={() => setShowDurationModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#EAECEF]">Select Duration</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDurationModal(false)}
                    className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#848E9C]" />
                  </motion.button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {OPTIONS_TIMEFRAMES.map(option => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setOptionDuration(option.value);
                      setOptionFluctuation(option.move);
                      setOptionPayout(option.payout);
                      setOptionMove(option.move);
                      setShowDurationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      optionDuration === option.value
                        ? 'bg-[#F0B90B]/20 border border-[#F0B90B]'
                        : 'bg-[#2B3139] hover:bg-[#373B42]'
                    }`}
                  >
                    <div>
                      <span className="text-[#EAECEF] font-medium">{option.label}</span>
                      <span className="text-xs text-[#848E9C] block mt-1">
                        Profit: +{option.profit}% • Move: ≥{option.move}%
                      </span>
                    </div>
                    {optionDuration === option.value && (
                      <CheckCircle className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fluctuation Modal */}
      <AnimatePresence>
        {showFluctuationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center p-4"
            onClick={() => setShowFluctuationModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#EAECEF]">Fluctuation Range</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFluctuationModal(false)}
                    className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#848E9C]" />
                  </motion.button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {FLUCTUATION_RANGES[optionDuration as keyof typeof FLUCTUATION_RANGES]?.map((range, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setOptionFluctuation(range.value);
                      setOptionPayout(range.payout);
                      setOptionMove(range.move);
                      setShowFluctuationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      optionFluctuation === range.value
                        ? 'bg-[#F0B90B]/20 border border-[#F0B90B]'
                        : 'bg-[#2B3139] hover:bg-[#373B42]'
                    }`}
                  >
                    <div>
                      <span className="text-[#EAECEF] font-medium">{range.label}</span>
                      <span className="text-xs text-[#848E9C] block mt-1">
                        Payout: {range.payout.toFixed(3)}x
                      </span>
                    </div>
                    {optionFluctuation === range.value && (
                      <CheckCircle className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}