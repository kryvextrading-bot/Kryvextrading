// pages/UnifiedTradingPage.tsx
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
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Clock,
  X,
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Star,
  Flame,
  Filter,
  LayoutGrid,
  Calendar,
  DollarSign,
  Activity,
  Zap,
  Award,
  Sparkles,
  LineChart,
  CandlestickChart,
  GanttChartSquare,
  Maximize2,
  Minimize2,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useMarketData } from '@/services/marketDataService';
import { unifiedTradingService } from '@/services/unified-trading-service';
import { toast } from 'react-hot-toast';
import Countdown from 'react-countdown';

// ==================== BINANCE COLOR PALETTE ====================

const COLORS = {
  binance: {
    yellow: '#F0B90B',
    yellowHover: '#F0B90BCC',
    yellowLight: '#FCD535',
  },
  bg: {
    primary: '#0B0E11',
    secondary: '#1E2329',
    card: '#2B3139',
    cardHover: '#323A45',
    border: '#3A3F4A',
    input: '#2B3139',
    modal: '#1E2329',
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
    border: 'rgba(14, 203, 129, 0.2)',
  },
  red: {
    primary: '#F6465D',
    dark: '#D63F53',
    bg: 'rgba(246, 70, 93, 0.1)',
    border: 'rgba(246, 70, 93, 0.2)',
  },
  blue: {
    primary: '#5096FF',
    dark: '#4785E6',
    bg: 'rgba(80, 150, 255, 0.1)',
    border: 'rgba(80, 150, 255, 0.2)',
  },
  purple: {
    primary: '#A66AE6',
    bg: 'rgba(166, 106, 230, 0.1)',
    border: 'rgba(166, 106, 230, 0.2)',
  },
  orange: {
    primary: '#F78D4B',
    bg: 'rgba(247, 141, 75, 0.1)',
    border: 'rgba(247, 141, 75, 0.2)',
  },
};

// ==================== TYPES ====================

type TabType = 'spot' | 'future' | 'option';
type OrderSide = 'buy' | 'sell';
type PositionSide = 'long' | 'short';
type OptionDirection = 'UP' | 'DOWN';
type BottomTabType = 'active' | 'scheduled' | 'completed' | 'positions' | 'open' | 'closed' | 'assets';
type ChartType = 'line' | 'candle' | 'depth';

interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  high24h?: number;
  low24h?: number;
  favorite?: boolean;
  hot?: boolean;
  leverage?: number;
}

interface OptionOrder {
  id: string;
  userId: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  exitPrice?: number;
  duration: number;
  profit?: number;
  startTime: number;
  endTime: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pnl?: number;
  fee?: number;
  fluctuation?: number;
  payout?: number;
  result?: 'win' | 'loss';
  isLocked?: boolean;
}

interface ScheduledOrder {
  id: string;
  userId: string;
  symbol: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  scheduledTime: number;
  duration: number;
  fluctuation: number;
  payout: number;
}

// ==================== TRADING CALCULATIONS ====================

// Timeframes with proper profit percentages and stake ranges
const OPTIONS_TIMEFRAMES = [
  { 
    label: '60s', 
    value: 60, 
    profitPercent: 18, // 18% profit
    payout: 1.18, // Return 1.18x stake (stake + 18%)
    move: 0.01, 
    display: '1min',
    minStake: 10,
    maxStake: 1000
  },
  { 
    label: '3m', 
    value: 180, 
    profitPercent: 30, // 30% profit
    payout: 1.30, // Return 1.30x stake
    move: 0.03, 
    display: '3min',
    minStake: 50,
    maxStake: 5000
  },
  { 
    label: '5m', 
    value: 300, 
    profitPercent: 45, // 45% profit
    payout: 1.45, // Return 1.45x stake
    move: 0.05, 
    display: '5min',
    minStake: 100,
    maxStake: 10000
  },
  { 
    label: '10m', 
    value: 600, 
    profitPercent: 65, // 65% profit
    payout: 1.65, // Return 1.65x stake
    move: 0.10, 
    display: '10min',
    minStake: 200,
    maxStake: 20000
  },
  { 
    label: '15m', 
    value: 900, 
    profitPercent: 85, // 85% profit
    payout: 1.85, // Return 1.85x stake
    move: 0.15, 
    display: '15min',
    minStake: 500,
    maxStake: 50000
  },
  { 
    label: '30m', 
    value: 1800, 
    profitPercent: 120, // 120% profit
    payout: 2.20, // Return 2.20x stake (stake + 120%)
    move: 0.30, 
    display: '30min',
    minStake: 1000,
    maxStake: 100000
  },
  { 
    label: '1h', 
    value: 3600, 
    profitPercent: 150, // 150% profit
    payout: 2.50, // Return 2.50x stake
    move: 0.50, 
    display: '1hour',
    minStake: 2000,
    maxStake: 200000
  },
  { 
    label: '2h', 
    value: 7200, 
    profitPercent: 180, // 180% profit
    payout: 2.80, // Return 2.80x stake
    move: 0.75, 
    display: '2hour',
    minStake: 5000,
    maxStake: 500000
  },
  { 
    label: '4h', 
    value: 14400, 
    profitPercent: 220, // 220% profit
    payout: 3.20, // Return 3.20x stake
    move: 1.00, 
    display: '4hour',
    minStake: 10000,
    maxStake: 1000000
  },
];

// Fluctuation ranges with proper payout multipliers
const FLUCTUATION_RANGES: Record<number, { label: string; value: number; payout: number }[]> = {
  60: [
    { label: 'UP > 0.01%', value: 0.01, payout: 1.18 },
    { label: 'UP > 0.02%', value: 0.02, payout: 1.22 },
    { label: 'UP > 0.03%', value: 0.03, payout: 1.25 },
  ],
  180: [
    { label: 'UP > 0.03%', value: 0.03, payout: 1.30 },
    { label: 'UP > 0.05%', value: 0.05, payout: 1.35 },
    { label: 'UP > 0.08%', value: 0.08, payout: 1.40 },
  ],
  300: [
    { label: 'UP > 0.05%', value: 0.05, payout: 1.45 },
    { label: 'UP > 0.08%', value: 0.08, payout: 1.50 },
    { label: 'UP > 0.12%', value: 0.12, payout: 1.55 },
  ],
  600: [
    { label: 'UP > 0.10%', value: 0.10, payout: 1.65 },
    { label: 'UP > 0.15%', value: 0.15, payout: 1.70 },
    { label: 'UP > 0.20%', value: 0.20, payout: 1.75 },
  ],
  900: [
    { label: 'UP > 0.15%', value: 0.15, payout: 1.85 },
    { label: 'UP > 0.20%', value: 0.20, payout: 1.90 },
    { label: 'UP > 0.25%', value: 0.25, payout: 1.95 },
  ],
  1800: [
    { label: 'UP > 0.30%', value: 0.30, payout: 2.20 },
    { label: 'UP > 0.40%', value: 0.40, payout: 2.30 },
    { label: 'UP > 0.50%', value: 0.50, payout: 2.40 },
  ],
  3600: [
    { label: 'UP > 0.50%', value: 0.50, payout: 2.50 },
    { label: 'UP > 0.75%', value: 0.75, payout: 2.60 },
    { label: 'UP > 1.00%', value: 1.00, payout: 2.70 },
  ],
  7200: [
    { label: 'UP > 0.75%', value: 0.75, payout: 2.80 },
    { label: 'UP > 1.00%', value: 1.00, payout: 2.90 },
    { label: 'UP > 1.50%', value: 1.50, payout: 3.00 },
  ],
  14400: [
    { label: 'UP > 1.00%', value: 1.00, payout: 3.20 },
    { label: 'UP > 1.50%', value: 1.50, payout: 3.40 },
    { label: 'UP > 2.00%', value: 2.00, payout: 3.60 },
  ],
};

// Purchase ranges for each timeframe
const PURCHASE_RANGES: Record<number, { min: number; max: number }> = {
  60: { min: 10, max: 1000 },
  180: { min: 50, max: 5000 },
  300: { min: 100, max: 10000 },
  600: { min: 200, max: 20000 },
  900: { min: 500, max: 50000 },
  1800: { min: 1000, max: 100000 },
  3600: { min: 2000, max: 200000 },
  7200: { min: 5000, max: 500000 },
  14400: { min: 10000, max: 1000000 },
};

const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 33, 50, 100, 125];

// ==================== ANIMATION VARIANTS ====================

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

// ==================== TRADING PAIRS ====================

const TRADING_PAIRS: TradingPair[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', name: 'Bitcoin', price: 67668.18, change: 2.34, volume: 1250000000, hot: true, high24h: 68500, low24h: 66500 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', price: 3492.89, change: 1.56, volume: 800000000, high24h: 3550, low24h: 3450 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', name: 'Binance Coin', price: 603.60, change: 2.15, volume: 950000000, high24h: 615, low24h: 595 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', name: 'Solana', price: 176.88, change: 3.21, volume: 150000000, hot: true, high24h: 180, low24h: 173 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', name: 'Ripple', price: 0.62, change: 1.83, volume: 840000000, high24h: 0.63, low24h: 0.61 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', price: 0.60, change: -2.07, volume: 720000000, high24h: 0.62, low24h: 0.59 },
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

// ==================== COMPONENTS ====================

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
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  disabled = false, 
  className = '',
  fullWidth = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'py-2 text-xs',
    md: 'py-3 text-sm',
    lg: 'py-4 text-base'
  };
  
  const baseClasses = `${sizeClasses[size]} rounded-lg font-medium transition-all duration-200 ${
    fullWidth ? 'w-full' : ''
  }`;
  
  const variantClasses = {
    primary: 'bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11]',
    secondary: 'bg-[#2B3139] hover:bg-[#323A45] text-[#EAECEF] border border-[#3A3F4A]',
    success: 'bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-[#0B0E11]',
    danger: 'bg-[#F6465D] hover:bg-[#F6465D]/90 text-white',
    outline: 'bg-transparent hover:bg-[#2B3139] text-[#EAECEF] border border-[#3A3F4A]',
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

// Price Display Component
const PriceDisplay: React.FC<{ price: number; change: number; high24h?: number; low24h?: number }> = ({ 
  price, change, high24h, low24h 
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
    <div className="flex items-center gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-[#EAECEF] font-mono">
          ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${
        change >= 0 ? 'bg-[#0ECB81]/10 text-[#0ECB81]' : 'bg-[#F6465D]/10 text-[#F6465D]'
      }`}>
        {change >= 0 ? '↑' : '↓'} 24h
      </span>
    </div>
    
    {(high24h || low24h) && (
      <div className="flex items-center gap-3 text-xs text-[#848E9C]">
        <span>H: ${high24h?.toFixed(2) || '0.00'}</span>
        <span>L: ${low24h?.toFixed(2) || '0.00'}</span>
      </div>
    )}
  </div>
);

// Mini Chart Component
const MiniChart: React.FC<{ 
  data: number[]; 
  type?: ChartType;
  height?: number;
}> = ({ data, type = 'line', height = 32 }) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  if (type === 'candle') {
    return (
      <div className={`h-${height} bg-[#1E2329] rounded-lg mb-4 flex items-end justify-between px-1`}>
        <div className="flex items-end gap-0.5 h-full py-2 w-full">
          {data.map((value, i) => {
            const isGreen = i > 0 ? value >= data[i - 1] : true;
            const open = data[Math.max(0, i - 1)] || value * 0.99;
            const close = value;
            const high = Math.max(open, close) * 1.01;
            const low = Math.min(open, close) * 0.99;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div 
                  className={`w-full ${isGreen ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}
                  style={{ 
                    height: `${((high - low) / range) * 70}%`,
                    maxHeight: '70%'
                  }}
                />
                <div 
                  className={`w-full mt-0.5 ${isGreen ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`}
                  style={{ 
                    height: `${(Math.abs(close - open) / range) * 30}%`,
                    maxHeight: '30%'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  if (type === 'depth') {
    const midPoint = Math.floor(data.length / 2);
    const bids = data.slice(0, midPoint);
    const asks = data.slice(midPoint);
    
    return (
      <div className={`h-${height} bg-[#1E2329] rounded-lg mb-4 flex items-end justify-between px-2`}>
        <div className="flex items-end gap-0.5 h-full py-2 w-full">
          {bids.map((value, i) => (
            <div
              key={`bid-${i}`}
              className="flex-1 bg-[#0ECB81]/40"
              style={{ height: `${(value / maxValue) * 100}%` }}
            />
          ))}
          {asks.map((value, i) => (
            <div
              key={`ask-${i}`}
              className="flex-1 bg-[#F6465D]/40"
              style={{ height: `${(value / maxValue) * 100}%` }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Line chart (default)
  return (
    <div className={`h-${height} bg-[#1E2329] rounded-lg mb-4 flex items-end justify-between px-2`}>
      <div className="flex items-end gap-1 h-full py-2 w-full">
        {data.map((value, i) => {
          const heightPercent = ((value - minValue) / range) * 100;
          const isGreen = i > 0 ? value >= data[i - 1] : true;
          
          return (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-500 ease-in-out"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: isGreen ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Order Book Row Component
const OrderBookRow: React.FC<{ price: number; quantity: number; type: 'bid' | 'ask'; showTotal?: boolean }> = ({ 
  price, quantity, type, showTotal = false 
}) => (
  <div className="flex justify-between items-center text-xs py-1 px-2 hover:bg-[#2B3139] rounded transition-colors">
    <span className={`font-mono font-medium ${type === 'ask' ? 'text-[#F6465D]' : 'text-[#0ECB81]'}`}>
      {price.toFixed(2)}
    </span>
    <span className="text-[#EAECEF] font-mono">{quantity.toFixed(4)}</span>
    {showTotal && (
      <span className="text-[#848E9C] font-mono">
        {(price * quantity).toFixed(2)}
      </span>
    )}
  </div>
);

// Order Book Component
const OrderBook: React.FC<{ 
  bids: { price: number; quantity: number }[]; 
  asks: { price: number; quantity: number }[];
  currentPrice: number;
  showTotal?: boolean;
}> = ({ bids, asks, currentPrice, showTotal = false }) => (
  <BinanceCard className="p-4">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-sm font-medium text-[#EAECEF]">Order Book</h3>
      <span className="text-xs text-[#848E9C]">Price · Amount</span>
    </div>
    
    {/* Asks (Sell orders) */}
    <div className="space-y-1 mb-3">
      {asks.slice(0, 8).map((ask, i) => (
        <OrderBookRow key={i} price={ask.price} quantity={ask.quantity} type="ask" showTotal={showTotal} />
      ))}
    </div>

    {/* Current Price */}
    <div className="flex justify-between items-center py-2 border-y border-[#2B3139] my-2">
      <span className="text-base font-bold text-[#F0B90B] font-mono">
        {currentPrice.toFixed(2)}
      </span>
      <span className="text-xs text-[#848E9C]">≈ ${currentPrice.toFixed(2)}</span>
    </div>

    {/* Bids (Buy orders) */}
    <div className="space-y-1 mt-3">
      {bids.slice(0, 8).map((bid, i) => (
        <OrderBookRow key={i} price={bid.price} quantity={bid.quantity} type="bid" showTotal={showTotal} />
      ))}
    </div>
  </BinanceCard>
);

// Active Trade Card Component
const ActiveTradeCard: React.FC<{ 
  trade: OptionOrder; 
  currentPrice: number;
  onExpire: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
}> = ({ trade, currentPrice, onExpire, onCancel }) => {
  const [expanded, setExpanded] = useState(false);
  const timeLeft = Math.max(0, trade.endTime - Date.now() / 1000);
  const isProfitable = (trade.direction === 'UP' && currentPrice > trade.entryPrice) ||
                       (trade.direction === 'DOWN' && currentPrice < trade.entryPrice);
  const profitAmount = trade.stake * ((trade.payout || 1.18) - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-[#5096FF]/10 to-[#A66AE6]/10 border border-[#5096FF]/20 rounded-xl overflow-hidden mb-3"
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#2B3139] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-sm font-medium text-[#EAECEF]">{trade.symbol}</span>
          <span className="text-[#848E9C]">|</span>
          <span className={`text-xs font-medium ${trade.direction === 'UP' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            {trade.direction}
          </span>
          <span className="text-[#848E9C]">{'>'}</span>
          <span className="text-xs text-[#B7BDC6]">{trade.fluctuation || 0.01}%</span>
          <span className="text-[#848E9C]">|</span>
          <span className="text-xs text-[#B7BDC6]">{trade.duration}s</span>
          {trade.isLocked && (
            <>
              <span className="text-[#848E9C]">|</span>
              <Lock className="w-3 h-3 text-[#F0B90B]" />
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-xs ${timeLeft < 10 ? 'text-[#F6465D] animate-pulse' : 'text-[#848E9C]'}`}>
              {Math.floor(timeLeft / 60)}:{Math.floor(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            <div className={`text-sm font-medium ${isProfitable ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
              +${profitAmount.toFixed(2)}
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#848E9C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#848E9C]" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2B3139]"
          >
            <div className="p-4 space-y-4">
              <Countdown
                date={trade.endTime * 1000}
                onComplete={() => {
                  console.log('⏰ [Countdown] Timer completed for trade:', trade.id);
                  onExpire(trade.id);
                }}
                renderer={({ hours, minutes, seconds, completed }) => {
                  if (completed) return null;
                  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                  const progress = 1 - (totalSeconds / trade.duration);
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#848E9C]">Time Remaining</span>
                        <span className="text-sm font-mono font-bold text-[#F0B90B]">
                          {totalSeconds > 60 
                            ? `${minutes}:${seconds.toString().padStart(2, '0')}`
                            : `${seconds}s`
                          }
                        </span>
                      </div>
                      
                      <div className="h-1.5 bg-[#2B3139] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F0B90B]"
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                }}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Stake (Locked)</span>
                    <span className="text-sm font-medium text-[#EAECEF]">
                      ${trade.stake.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Entry Price</span>
                    <span className="text-sm font-mono text-[#EAECEF]">
                      ${trade.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Current Price</span>
                    <span className={`text-sm font-mono ${isProfitable ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      ${currentPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Payout</span>
                    <span className="text-sm font-medium text-[#0ECB81]">
                      {((trade.payout || 1.18) * 100 - 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Potential Return</span>
                    <span className="text-sm font-medium text-[#0ECB81]">
                      ${(trade.stake * (trade.payout || 1.18)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#848E9C]">Potential Profit</span>
                    <span className="text-sm font-medium text-[#0ECB81]">
                      +${profitAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {onCancel && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => onCancel(trade.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#F6465D]/10 text-[#F6465D] text-xs font-medium hover:bg-[#F6465D]/20 transition-colors"
                  >
                    Cancel Order
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Completed Order Card Component
const CompletedOrderCard: React.FC<{ order: OptionOrder }> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const isWin = order.result === 'win' || (order.pnl ?? 0) > 0;
  const profitAmount = order.pnl ?? (isWin ? order.stake * ((order.payout || 1.18) - 1) : -order.stake);
  
  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1E2329] rounded-xl overflow-hidden border border-[#2B3139] mb-2"
    >
      {/* Header */}
      <motion.div 
        whileHover={{ backgroundColor: '#2B3139' }}
        className="px-4 py-3 flex items-center justify-between cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-sm font-medium text-[#EAECEF]">{order.symbol}</span>
          <span className="text-[#848E9C]">|</span>
          <span className={`text-xs font-medium ${order.direction === 'UP' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            {order.direction}
          </span>
          <span className="text-[#848E9C]">{'>'}</span>
          <span className="text-xs text-[#B7BDC6]">{order.fluctuation || 0.01}%</span>
          <span className="text-[#848E9C]">|</span>
          <span className="text-xs text-[#B7BDC6]">{order.duration}s</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isWin ? 'bg-[#0ECB81]/20 text-[#0ECB81]' : 'bg-[#F6465D]/20 text-[#F6465D]'
          }`}>
            {isWin ? 'WIN' : 'LOSS'}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
            {isWin ? '+' : ''}{profitAmount.toFixed(2)} USDT
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#848E9C]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#848E9C]" />
          )}
        </div>
      </motion.div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#2B3139]"
          >
            <div className="p-5 space-y-4">
              {/* Result Banner */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${
                isWin ? 'bg-[#0ECB81]/10 border border-[#0ECB81]/20' : 'bg-[#F6465D]/10 border border-[#F6465D]/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isWin ? 'bg-[#0ECB81]/20' : 'bg-[#F6465D]/20'
                  }`}>
                    {isWin ? (
                      <CheckCircle className="w-5 h-5 text-[#0ECB81]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#F6465D]" />
                    )}
                  </div>
                  <div>
                    <div className={`text-base font-semibold ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {isWin ? '✔ Your Profit' : '✖ Your Loss'}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {isWin ? '+' : ''}{profitAmount.toFixed(2)} USDT
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Direction</span>
                    <span className={`text-sm font-medium ${order.direction === 'UP' ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {order.direction}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Stake</span>
                    <span className="text-sm font-medium text-[#EAECEF]">
                      {order.stake.toFixed(2)} USDT
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Entry Price</span>
                    <span className="text-sm font-medium text-[#EAECEF] font-mono">
                      ${order.entryPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Exit Price</span>
                    <span className="text-sm font-medium text-[#EAECEF] font-mono">
                      ${order.exitPrice?.toFixed(2) || order.entryPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Duration</span>
                    <span className="text-sm font-medium text-[#EAECEF]">
                      {formatDuration(order.duration)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">Fee</span>
                    <span className="text-sm font-medium text-[#EAECEF]">
                      {(order.fee || order.stake * 0.001).toFixed(2)} USDT
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">P&L</span>
                    <span className={`text-sm font-bold ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {isWin ? '+' : ''}{profitAmount.toFixed(2)} USDT
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-[#2B3139]/50">
                    <span className="text-xs text-[#848E9C]">ROI</span>
                    <span className={`text-sm font-medium ${isWin ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                      {isWin ? '+' : ''}{((profitAmount) / order.stake * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="mt-3 pt-3 border-t border-[#2B3139]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">Start Time</div>
                    <div className="text-xs font-mono text-[#B7BDC6]">
                      {formatDateTime(order.startTime)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#848E9C] mb-1">End Time</div>
                    <div className="text-xs font-mono text-[#B7BDC6]">
                      {formatDateTime(order.endTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order ID */}
              <div className="mt-2 text-right">
                <span className="text-[10px] text-[#5E6673] font-mono">
                  Order ID: {order.id.slice(0, 8)}...{order.id.slice(-4)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Options Trading Form Component
const OptionsTradingForm: React.FC<{
  direction: OptionDirection;
  onDirectionChange: (direction: OptionDirection) => void;
  duration: number;
  onDurationClick: () => void;
  fluctuation: number;
  onFluctuationClick: () => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  onTrade: () => void;
  balance: number;
  hideBalance: boolean;
  isScheduled: boolean;
  onScheduleClick: () => void;
  disabled?: boolean;
}> = ({ direction, onDirectionChange, duration, onDurationClick, fluctuation, onFluctuationClick, amount, onAmountChange, onTrade, balance, hideBalance, isScheduled, onScheduleClick, disabled }) => {
  const [percentage, setPercentage] = useState(0);
  const timeframe = OPTIONS_TIMEFRAMES.find(tf => tf.value === duration) || OPTIONS_TIMEFRAMES[0];
  const currentFluctuation = FLUCTUATION_RANGES[duration]?.find(f => f.value === fluctuation);
  const payout = currentFluctuation?.payout || timeframe.payout;
  const profitPercent = (payout - 1) * 100;
  const parsedAmount = parseFloat(amount) || 0;
  const potentialReturn = parsedAmount * payout;
  const potentialProfit = potentialReturn - parsedAmount;
  
  const handlePercentageClick = (p: number) => {
    setPercentage(p);
    const amount = (timeframe.maxStake * p / 100).toFixed(2);
    onAmountChange(amount);
  };

  return (
    <BinanceCard className="p-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onDirectionChange('UP')}
          className={`py-3 rounded-lg text-sm font-medium ${
            direction === 'UP'
              ? 'bg-[#0ECB81] text-[#0B0E11]'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Up
        </button>
        <button
          onClick={() => onDirectionChange('DOWN')}
          className={`py-3 rounded-lg text-sm font-medium ${
            direction === 'DOWN'
              ? 'bg-[#F6465D] text-white'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Down
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={onScheduleClick}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
            isScheduled
              ? 'bg-[#F0B90B] text-[#0B0E11]'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          <Clock className="w-3 h-3" />
          {isScheduled ? 'Scheduled' : 'Schedule'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Stake Range</span>
          <span className="text-[#EAECEF]">
            ${timeframe.minStake} - ${timeframe.maxStake}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Duration</span>
          <button 
            onClick={onDurationClick}
            className="text-[#F0B90B] hover:text-[#F0B90B]/80 transition-colors flex items-center gap-1"
          >
            {timeframe.label}
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Payout</span>
          <button 
            onClick={onFluctuationClick}
            className="text-[#F0B90B] hover:text-[#F0B90B]/80 transition-colors flex items-center gap-1"
          >
            {currentFluctuation?.label || timeframe.label} ({profitPercent.toFixed(0)}%)
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Available</span>
          <span className="text-[#EAECEF]">
            {hideBalance ? '••••' : balance.toFixed(2)} USDT
          </span>
        </div>

        {amount && parsedAmount > 0 && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Potential Return</span>
              <span className="text-[#0ECB81] font-mono">
                ${potentialReturn.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Potential Profit</span>
              <span className="text-[#0ECB81] font-mono">
                +${potentialProfit.toFixed(2)} USDT
              </span>
            </div>
          </>
        )}

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => {
              onAmountChange(e.target.value);
              setPercentage(0);
            }}
            placeholder="Enter stake amount"
            className="w-full bg-[#2B3139] border border-[#3A3F4A] rounded-lg px-3 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
            min={timeframe.minStake}
            max={timeframe.maxStake}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#848E9C]">
            USDT
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(p => {
            const amount = (timeframe.maxStake * p / 100).toFixed(2);
            return (
              <button
                key={p}
                onClick={() => handlePercentageClick(p)}
                className={`py-2 rounded text-xs transition-colors ${
                  percentage === p
                    ? 'bg-[#F0B90B] text-[#0B0E11]'
                    : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {p}%
              </button>
            );
          })}
        </div>

        <button
          onClick={onTrade}
          disabled={disabled || !amount || parsedAmount < timeframe.minStake || parsedAmount > timeframe.maxStake || parsedAmount > balance}
          className="w-full bg-[#F0B90B] text-[#0B0E11] py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0B90B]/90 transition-colors"
        >
          {isScheduled ? 'Schedule Trade' : 'Buy Option'}
        </button>

        {parsedAmount > balance && (
          <p className="text-xs text-[#F6465D] mt-1">
            Insufficient balance. Need ${parsedAmount.toFixed(2)} USDT
          </p>
        )}
      </div>
    </BinanceCard>
  );
};

// Spot Trading Form Component
const SpotTradingForm: React.FC<{
  side: 'buy' | 'sell';
  onSideChange: (side: 'buy' | 'sell') => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: number;
  currentPrice: number;
  hideBalance: boolean;
  disabled?: boolean;
}> = ({ side, onSideChange, amount, onAmountChange, balance, currentPrice, hideBalance, disabled }) => {
  const parsedAmount = parseFloat(amount) || 0;
  const total = parsedAmount * currentPrice;

  return (
    <BinanceCard className="p-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onSideChange('buy')}
          className={`py-3 rounded-lg text-sm font-medium ${
            side === 'buy'
              ? 'bg-[#0ECB81] text-[#0B0E11]'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => onSideChange('sell')}
          className={`py-3 rounded-lg text-sm font-medium ${
            side === 'sell'
              ? 'bg-[#F6465D] text-white'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Available</span>
          <span className="text-[#EAECEF]">
            {hideBalance ? '••••' : balance.toFixed(2)} USDT
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Price</span>
          <span className="text-[#EAECEF] font-mono">
            ${currentPrice.toFixed(2)}
          </span>
        </div>

        {amount && parsedAmount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-[#848E9C]">Total</span>
            <span className="text-[#EAECEF] font-mono">
              ${total.toFixed(2)} USDT
            </span>
          </div>
        )}

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-[#2B3139] border border-[#3A3F4A] rounded-lg px-3 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
            min="0"
            step="0.001"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#848E9C]">
            BTC
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(p => {
            const amount = (balance * p / 100).toFixed(6);
            return (
              <button
                key={p}
                onClick={() => onAmountChange(amount)}
                className="py-2 rounded text-xs bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                {p}%
              </button>
            );
          })}
        </div>

        <button
          disabled={disabled || !amount || parsedAmount <= 0 || (side === 'buy' && total > balance)}
          className="w-full bg-[#F0B90B] text-[#0B0E11] py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0B90B]/90 transition-colors"
        >
          {side === 'buy' ? 'Buy BTC' : 'Sell BTC'}
        </button>

        {side === 'buy' && total > balance && (
          <p className="text-xs text-[#F6465D] mt-1">
            Insufficient balance. Need ${total.toFixed(2)} USDT
          </p>
        )}
      </div>
    </BinanceCard>
  );
};

// Futures Trading Form Component
const FuturesTradingForm: React.FC<{
  side: 'long' | 'short';
  onSideChange: (side: 'long' | 'short') => void;
  leverage: number;
  onLeverageChange: (leverage: number) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  balance: number;
  currentPrice: number;
  hideBalance: boolean;
  disabled?: boolean;
}> = ({ side, onSideChange, leverage, onLeverageChange, amount, onAmountChange, balance, currentPrice, hideBalance, disabled }) => {
  const parsedAmount = parseFloat(amount) || 0;
  const notional = parsedAmount * currentPrice;
  const margin = notional / leverage;
  const roe = side === 'long' ? 2.5 : -2.5; // Placeholder ROE calculation

  return (
    <BinanceCard className="p-4">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onSideChange('long')}
          className={`py-3 rounded-lg text-sm font-medium ${
            side === 'long'
              ? 'bg-[#0ECB81] text-[#0B0E11]'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => onSideChange('short')}
          className={`py-3 rounded-lg text-sm font-medium ${
            side === 'short'
              ? 'bg-[#F6465D] text-white'
              : 'bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF]'
          }`}
        >
          Short
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Available</span>
          <span className="text-[#EAECEF]">
            {hideBalance ? '••••' : balance.toFixed(2)} USDT
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Leverage</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="125"
              value={leverage}
              onChange={(e) => onLeverageChange(parseInt(e.target.value))}
              className="w-16 h-1 bg-[#2B3139] rounded-lg appearance-none cursor-pointer"
              title="Adjust leverage"
            />
            <span className="text-[#F0B90B] font-mono text-xs">
              {leverage}x
            </span>
          </div>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#848E9C]">Price</span>
          <span className="text-[#EAECEF] font-mono">
            ${currentPrice.toFixed(2)}
          </span>
        </div>

        {amount && parsedAmount > 0 && (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Notional</span>
              <span className="text-[#EAECEF] font-mono">
                ${notional.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Margin</span>
              <span className="text-[#EAECEF] font-mono">
                ${margin.toFixed(2)} USDT
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#848E9C]">Est. ROE</span>
              <span className={`font-mono ${roe >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                {roe >= 0 ? '+' : ''}{roe.toFixed(2)}%
              </span>
            </div>
          </>
        )}

        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full bg-[#2B3139] border border-[#3A3F4A] rounded-lg px-3 py-3 text-[#EAECEF] font-mono placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] transition-colors"
            min="0"
            step="0.001"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#848E9C]">
            BTC
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(p => {
            const amount = (balance * p / 100).toFixed(6);
            return (
              <button
                key={p}
                onClick={() => onAmountChange(amount)}
                className="py-2 rounded text-xs bg-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] transition-colors"
              >
                {p}%
              </button>
            );
          })}
        </div>

        <button
          disabled={disabled || !amount || parsedAmount <= 0 || margin > balance}
          className="w-full bg-[#F0B90B] text-[#0B0E11] py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#F0B90B]/90 transition-colors"
        >
          {side === 'long' ? 'Buy/Long' : 'Sell/Short'}
        </button>

        {margin > balance && (
          <p className="text-xs text-[#F6465D] mt-1">
            Insufficient margin. Need ${margin.toFixed(2)} USDT
          </p>
        )}
      </div>
    </BinanceCard>
  );
};

// ==================== MAIN COMPONENT ====================

export default function UnifiedTradingPage() {
  const navigate = useNavigate();
  const { symbol, tab } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { getTradingBalance, refreshData } = useUnifiedWallet();

  // Find selected pair
  const selectedPair = useMemo(() => {
    if (symbol) {
      const pair = TRADING_PAIRS.find(p => p.baseAsset.toLowerCase() === symbol.toLowerCase());
      return pair || TRADING_PAIRS[0];
    }
    return TRADING_PAIRS[0];
  }, [symbol]);

  // Market data from WebSocket
  const { orderBook, ticker, loading: marketLoading } = useMarketData(selectedPair?.symbol || 'BTCUSDT');
  
  // Use real-time data or fallback to static
  const displayPrice = ticker?.lastPrice || selectedPair.price;
  const displayChange = ticker?.priceChangePercent || selectedPair.change;
  const high24h = ticker?.high24h || selectedPair.high24h;
  const low24h = ticker?.low24h || selectedPair.low24h;

  // Chart state
  const [chartType, setChartType] = useState<ChartType>('line');
  const [chartData, setChartData] = useState([16, 24, 12, 20, 8, 28, 16, 22, 18, 26, 14, 30]);
  const animationRef = useRef<NodeJS.Timeout>();

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>(
    tab === 'future' ? 'future' : tab === 'option' ? 'option' : 'spot'
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [hideBalances, setHideBalances] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  
  // Spot State (simplified for brevity)
  const [spotSide, setSpotSide] = useState<'buy' | 'sell'>('buy');
  const [spotAmount, setSpotAmount] = useState('');
  
  // Futures State (simplified for brevity)
  const [futuresSide, setFuturesSide] = useState<'long' | 'short'>('long');
  const [futuresLeverage, setFuturesLeverage] = useState(100);
  const [futuresAmount, setFuturesAmount] = useState('');
  const [showLeverageModal, setShowLeverageModal] = useState(false);
  const [futuresBalance, setFuturesBalance] = useState(0);

  // Options State
  const [optionDirection, setOptionDirection] = useState<OptionDirection>('UP');
  const [optionDuration, setOptionDuration] = useState(60);
  const [optionFluctuation, setOptionFluctuation] = useState(0.01);
  const [optionAmount, setOptionAmount] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showFluctuationModal, setShowFluctuationModal] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [scheduledTime, setScheduledTime] = useState({ hours: 0, minutes: 0, seconds: 30 });

  // Orders State
  const [activeOrders, setActiveOrders] = useState<OptionOrder[]>([]);
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Bottom Tabs
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTabType>('active');
  const [orderHistoryHeight, setOrderHistoryHeight] = useState(320);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  // Update futures balance from wallet
  useEffect(() => {
    const balance = getTradingBalance('USDT');
    setFuturesBalance(balance);
  }, [getTradingBalance]);

  // Animate chart data
  useEffect(() => {
    const animateChart = () => {
      setChartData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = prev[prev.length - 1];
        const change = (Math.random() - 0.5) * 8;
        const newValue = Math.max(4, Math.min(48, lastValue + change));
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

  // Load user's orders
  useEffect(() => {
    if (!user?.id) return;

    const loadOrders = async () => {
      setLoading(true);
      try {
        console.log('🔄 [LoadOrders] Starting to load orders for user:', user.id);
        
        // Load active options
        const active = await unifiedTradingService.getActiveOptionsOrders(user.id);
        console.log('📋 [LoadOrders] Raw active orders from service:', active);
        
        const formattedActive: OptionOrder[] = active.map(order => ({
          id: order.id,
          userId: order.userId,
          symbol: order.symbol || 'BTCUSDT',
          direction: order.direction,
          stake: order.stake,
          entryPrice: order.entryPrice,
          duration: order.duration,
          startTime: new Date(order.startTime || order.createdAt).getTime() / 1000,
          endTime: new Date(order.endTime).getTime() / 1000,
          status: 'ACTIVE',
          fluctuation: order.fluctuationRange || 0.01,
          payout: order.payoutRate || 1.18,
          fee: order.fee || order.stake * 0.001,
          isLocked: true
        }));
        
        console.log('📋 [LoadOrders] Formatted active orders:', formattedActive);
        console.log('📋 [LoadOrders] Setting active orders count:', formattedActive.length);
        setActiveOrders(formattedActive);

        // Load completed options
        const completed = await unifiedTradingService.getCompletedOptionsOrders(user.id);
        console.log('📋 [LoadOrders] Raw completed orders from service:', completed);
        
        const formattedCompleted: OptionOrder[] = completed.map(order => {
          const isWin = order.pnl && order.pnl > 0;
          return {
            id: order.id,
            userId: order.userId,
            symbol: order.symbol || 'BTCUSDT',
            direction: order.direction,
            stake: order.stake,
            entryPrice: order.entryPrice,
            exitPrice: order.exitPrice,
            duration: order.duration,
            startTime: new Date(order.startTime || order.createdAt).getTime() / 1000,
            endTime: new Date(order.endTime).getTime() / 1000,
            status: 'COMPLETED',
            pnl: order.pnl,
            fee: order.fee || order.stake * 0.001,
            fluctuation: order.fluctuationRange || 0.01,
            payout: order.payoutRate || 1.18,
            result: isWin ? 'win' : 'loss'
          };
        });
        
        console.log('📋 [LoadOrders] Formatted completed orders:', formattedCompleted);
        console.log('📋 [LoadOrders] Setting completed orders count:', formattedCompleted.length);
        setCompletedOrders(formattedCompleted);
      } catch (error) {
        console.error('❌ [LoadOrders] Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user?.id]);

  // Handle order expiration
  const handleOrderExpire = useCallback(async (orderId: string) => {
    console.log('🕐 [handleOrderExpire] Called with orderId:', orderId);
    
    if (processingOrder) {
      console.log('🚫 [handleOrderExpire] Blocked by processingOrder state');
      return;
    }
    
    setProcessingOrder(orderId);
    
    try {
      console.log('🔄 [handleOrderExpire] Calling expireOptionsTrade for:', orderId);
      const result = await unifiedTradingService.expireOptionsTrade(orderId);
      
      console.log('✅ [handleOrderExpire] Result from service:', result);
      
      if (result.success) {
        // Find the expired order in active orders
        const expiredOrder = activeOrders.find(o => o.id === orderId);
        console.log('🔍 [handleOrderExpire] Found expired order:', expiredOrder);
        
        if (expiredOrder) {
          // Remove from active orders
          setActiveOrders(prev => {
            console.log('📋 [Active] Before removal:', prev.length);
            const filtered = prev.filter(o => o.id !== orderId);
            console.log('📋 [Active] After removal:', filtered.length);
            return filtered;
          });
          
          // Create completed order
          const completedOrder: OptionOrder = {
            ...expiredOrder,
            status: 'COMPLETED',
            exitPrice: result.exitPrice || displayPrice,
            pnl: result.profit || 0,
            result: result.result === 'win' ? 'win' : 'loss',
            isLocked: false,
            endTime: Date.now() / 1000
          };
          
          console.log('📋 [Completed] New completed order:', completedOrder);
          
          // Add to completed orders (avoid duplicates)
          setCompletedOrders(prev => {
            console.log('📋 [Completed] Before addition:', prev.length);
            
            // Check if order already exists
            const exists = prev.some(o => o.id === orderId);
            if (exists) {
              console.log('📋 [Completed] Order already exists, skipping');
              return prev;
            }
            
            const newCompleted = [completedOrder, ...prev];
            console.log('📋 [Completed] After addition:', newCompleted.length);
            return newCompleted;
          });
          
          // Refresh balances to update locked funds
          if (typeof refreshData === 'function') {
            await refreshData();
          }

          // Show toast notification
          if (result.result === 'win') {
            const profitAmount = result.profit || 0;
            toast.success(
              <div>
                <div className="font-bold">🎉 You Won!</div>
                <div className="text-sm">+${profitAmount.toFixed(2)} USDT Profit</div>
              </div>,
              { duration: 5000 }
            );
          } else {
            const lossAmount = Math.abs(result.profit || 0);
            toast.error(
              <div>
                <div className="font-bold">Trade Lost</div>
                <div className="text-sm">-${lossAmount.toFixed(2)} USDT</div>
              </div>,
              { duration: 5000 }
            );
          }
        } else {
          console.warn('⚠️ [handleOrderExpire] Expired order not found in active orders:', orderId);
        }
      } else {
        console.error('❌ [handleOrderExpire] Service returned failure:', result.error);
      }
    } catch (error) {
      console.error('❌ [handleOrderExpire] Error expiring order:', error);
      toast.error('Failed to settle trade');
    } finally {
      console.log('🔄 [handleOrderExpire] Clearing processingOrder');
      setProcessingOrder(null);
    }
  }, [activeOrders, displayPrice, refreshData, processingOrder]);

  // Handle option trade
  const handleOptionTrade = async () => {
    if (!isAuthenticated || !user?.id) {
      toast.error('Please login to trade');
      return;
    }

    const parsedAmount = parseFloat(optionAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const timeframe = OPTIONS_TIMEFRAMES.find(tf => tf.value === optionDuration);
    if (!timeframe) return;

    if (parsedAmount < timeframe.minStake || parsedAmount > timeframe.maxStake) {
      toast.error(`Amount must be between $${timeframe.minStake} and $${timeframe.maxStake}`);
      return;
    }

    const balance = getTradingBalance('USDT');
    if (parsedAmount > balance) {
      toast.error(`Insufficient balance. Need $${parsedAmount.toFixed(2)} USDT`);
      return;
    }

    const currentFluctuation = FLUCTUATION_RANGES[optionDuration]?.find(f => f.value === optionFluctuation);
    const payout = currentFluctuation?.payout || timeframe.payout;

    try {
      if (isScheduled) {
        // Handle scheduled trade
        const scheduledTimeStr = new Date(Date.now() + 
          (scheduledTime.hours * 3600 + scheduledTime.minutes * 60 + scheduledTime.seconds) * 1000
        ).toISOString();

        const newScheduled: ScheduledOrder = {
          id: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          symbol: selectedPair.symbol,
          direction: optionDirection,
          stake: parsedAmount,
          scheduledTime: new Date(scheduledTimeStr).getTime() / 1000,
          duration: optionDuration,
          fluctuation: optionFluctuation,
          payout
        };
        
        setScheduledOrders(prev => [...prev, newScheduled]);
        toast.success(`Trade scheduled for ${scheduledTime.hours}:${scheduledTime.minutes}:${scheduledTime.seconds} UTC`);
        setIsScheduled(false);
      } else {
        // Execute immediate trade
        const result = await unifiedTradingService.executeTrade({
          type: 'options',
          data: {
            symbol: selectedPair.symbol,
            direction: optionDirection,
            amount: parsedAmount,
            duration: optionDuration,
            fluctuation: optionFluctuation,
            premium: parsedAmount,
            payoutRate: payout,
            entryPrice: displayPrice
          },
          userId: user.id
        });

        if (result.success && result.trade) {
          console.log('✅ [TradeCreation] Trade created successfully:', result.trade);
          
          // Add to active orders
          const newOrder: OptionOrder = {
            id: result.trade.id,
            userId: user.id,
            symbol: selectedPair.symbol,
            direction: optionDirection,
            stake: parsedAmount,
            entryPrice: displayPrice,
            duration: optionDuration,
            startTime: Date.now() / 1000,
            endTime: Date.now() / 1000 + optionDuration,
            status: 'ACTIVE',
            fluctuation: optionFluctuation,
            payout,
            fee: parsedAmount * 0.001,
            isLocked: true
          };
          
          console.log('📋 [TradeCreation] New order object:', newOrder);
          
          setActiveOrders(prev => {
            const updated = [...prev, newOrder];
            console.log('📋 [TradeCreation] Active orders after adding:', updated.length);
            return updated;
          });
          
          // Refresh balances to show locked funds
          await refreshData();
          
          toast.success(
            <div>
              <div className="font-bold">Option Purchased!</div>
              <div className="text-sm">${parsedAmount.toFixed(2)} USDT locked</div>
              <div className="text-xs text-[#0ECB81]">Potential profit: +${(parsedAmount * (payout - 1)).toFixed(2)}</div>
            </div>,
            { duration: 5000 }
          );
        }
      }

      setOptionAmount('');
    } catch (error) {
      console.error('❌ [TradeCreation] Trade execution failed:', error);
      toast.error('Trade execution failed');
    }
  };

  // Handle resize for order history
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleResizeEnd);
  }, []);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing.current || !resizeRef.current) return;
    
    const container = resizeRef.current.parentElement;
    if (!container) return;
    
    const newHeight = window.innerHeight - e.clientY - 60;
    const maxHeight = window.innerHeight * 0.7;
    const minHeight = 200;
    
    setOrderHistoryHeight(Math.min(maxHeight, Math.max(minHeight, newHeight)));
  }, []);

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleResizeEnd);
  }, []);

  // Get current UTC time
  const currentUTC = new Date().toISOString().split('T')[1].split('.')[0];

  // Filter out duplicate completed orders
  const uniqueCompletedOrders = useMemo(() => {
    const seen = new Set();
    return completedOrders.filter(order => {
      const duplicate = seen.has(order.id);
      seen.add(order.id);
      return !duplicate;
    });
  }, [completedOrders]);

  return (
    <motion.div 
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF]"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1E2329]/95 backdrop-blur-xl border-b border-[#2B3139]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/trading')} 
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#848E9C]" />
              </button>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-semibold text-[#EAECEF]">{selectedPair.baseAsset}</h1>
                <span className={`text-sm ${displayChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                  {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5 text-[#848E9C]" />
              </button>
              <button 
                onClick={() => setChartExpanded(!chartExpanded)}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                {chartExpanded ? (
                  <Minimize2 className="h-5 w-5 text-[#848E9C]" />
                ) : (
                  <Maximize2 className="h-5 w-5 text-[#848E9C]" />
                )}
              </button>
              <button 
                onClick={() => refreshData()}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-[#848E9C]" />
              </button>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 bg-[#F0B90B] rounded-lg flex items-center justify-center ml-1 hover:bg-[#F0B90B]/90 transition-colors"
              >
                <span className="text-sm font-bold text-[#0B0E11]">
                  {user?.email?.[0] || 'U'}
                </span>
              </button>
            </div>
          </div>

          {/* Market Tabs */}
          <div className="flex space-x-4 mt-3 overflow-x-auto pb-1">
            {['Spot', 'Future', 'Option'].map((tabName) => (
              <button
                key={tabName}
                onClick={() => {
                  const newTab = tabName.toLowerCase() as TabType;
                  setActiveTab(newTab);
                  navigate(`/trading/${symbol}${newTab === 'spot' ? '' : '/' + newTab}`);
                }}
                className={`pb-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tabName.toLowerCase()
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                {tabName}
              </button>
            ))}
          </div>

          {/* Price Info */}
          <PriceDisplay price={displayPrice} change={displayChange} high24h={high24h} low24h={low24h} />
        </div>
      </div>

      {/* Timeframes */}
      <div className="px-4 py-2 flex space-x-4 border-b border-[#2B3139] overflow-x-auto">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTimeframe === tf 
                ? 'text-[#F0B90B]' 
                : 'text-[#848E9C] hover:text-[#EAECEF]'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Mini Chart */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded transition-colors ${
                chartType === 'line' ? 'bg-[#F0B90B]/20 text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <LineChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('candle')}
              className={`p-1.5 rounded transition-colors ${
                chartType === 'candle' ? 'bg-[#F0B90B]/20 text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <CandlestickChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('depth')}
              className={`p-1.5 rounded transition-colors ${
                chartType === 'depth' ? 'bg-[#F0B90B]/20 text-[#F0B90B]' : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <GanttChartSquare className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <MiniChart 
          data={chartData} 
          type={chartType} 
          height={chartExpanded ? 64 : 32}
        />

        {/* Trading Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Order Book */}
          <div className="order-2 lg:order-1">
            {orderBook && (
              <OrderBook 
                bids={orderBook.bids} 
                asks={orderBook.asks} 
                currentPrice={displayPrice}
                showTotal={true}
              />
            )}
          </div>

          {/* Right Column - Trading Form */}
          <div className="order-1 lg:order-2">
            {activeTab === 'spot' && (
              <SpotTradingForm
                side={spotSide}
                onSideChange={setSpotSide}
                amount={spotAmount}
                onAmountChange={setSpotAmount}
                balance={getTradingBalance('USDT')}
                currentPrice={displayPrice}
                hideBalance={hideBalances}
                disabled={marketLoading}
              />
            )}
            {activeTab === 'future' && (
              <FuturesTradingForm
                side={futuresSide}
                onSideChange={setFuturesSide}
                leverage={futuresLeverage}
                onLeverageChange={setFuturesLeverage}
                amount={futuresAmount}
                onAmountChange={setFuturesAmount}
                balance={futuresBalance}
                currentPrice={displayPrice}
                hideBalance={hideBalances}
                disabled={marketLoading}
              />
            )}
            {activeTab === 'option' && (
              <OptionsTradingForm
                direction={optionDirection}
                onDirectionChange={setOptionDirection}
                duration={optionDuration}
                onDurationClick={() => setShowDurationModal(true)}
                fluctuation={optionFluctuation}
                onFluctuationClick={() => setShowFluctuationModal(true)}
                amount={optionAmount}
                onAmountChange={setOptionAmount}
                onTrade={handleOptionTrade}
                balance={getTradingBalance('USDT')}
                hideBalance={hideBalances}
                isScheduled={isScheduled}
                onScheduleClick={() => setShowScheduledModal(true)}
                disabled={marketLoading || !!processingOrder}
              />
            )}
          </div>
        </div>
      </div>

      {/* Duration Modal */}
      <AnimatePresence>
        {showDurationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4"
            onClick={() => setShowDurationModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={slideUp.transition}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <h3 className="text-lg font-semibold text-[#EAECEF]">Select Duration</h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {OPTIONS_TIMEFRAMES.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setOptionDuration(option.value);
                      setOptionFluctuation(option.move);
                      setShowDurationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      optionDuration === option.value
                        ? 'bg-[#F0B90B]/20 border border-[#F0B90B]'
                        : 'bg-[#2B3139] hover:bg-[#323A45]'
                    }`}
                  >
                    <div>
                      <span className="text-[#EAECEF] font-medium">{option.label}</span>
                      <span className="text-xs text-[#848E9C] block mt-1">
                        Payout: {option.profitPercent}% • Min: ${option.minStake} • Max: ${option.maxStake}
                      </span>
                    </div>
                    {optionDuration === option.value && (
                      <CheckCircle className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resizable Order History */}
      <div 
        ref={resizeRef}
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E2329] border-t border-[#2B3139]"
        style={{ height: orderHistoryHeight }}
      >
        {/* Resize Handle */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-[#F0B90B]/50 transition-colors"
          onMouseDown={handleResizeStart}
        />

        {/* Tab Headers */}
        <div className="flex border-b border-[#2B3139] overflow-x-auto">
          {activeTab === 'option' ? (
            // Options Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('active')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'active'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Active ({activeOrders.length})
              </button>
              <button
                onClick={() => setActiveBottomTab('scheduled')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'scheduled'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Scheduled ({scheduledOrders.length})
              </button>
              <button
                onClick={() => setActiveBottomTab('completed')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'completed'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Completed ({uniqueCompletedOrders.length})
              </button>
            </>
          ) : activeTab === 'future' ? (
            // Futures Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('positions')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'positions'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Positions (0)
              </button>
              <button
                onClick={() => setActiveBottomTab('open')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'open'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Open Orders (0)
              </button>
              <button
                onClick={() => setActiveBottomTab('closed')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'closed'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Order History
              </button>
            </>
          ) : (
            // Spot Tabs
            <>
              <button
                onClick={() => setActiveBottomTab('open')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'open'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Open Orders (0)
              </button>
              <button
                onClick={() => setActiveBottomTab('completed')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'completed'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Order History
              </button>
              <button
                onClick={() => setActiveBottomTab('assets')}
                className={`flex-1 py-3 text-sm border-b-2 whitespace-nowrap transition-colors ${
                  activeBottomTab === 'assets'
                    ? 'border-[#F0B90B] text-[#F0B90B]'
                    : 'border-transparent text-[#848E9C] hover:text-[#EAECEF]'
                }`}
              >
                Assets
              </button>
            </>
          )}
        </div>

        {/* Tab Content - Scrollable */}
        <div 
          className="overflow-y-auto p-4"
          style={{ height: orderHistoryHeight - 48 }}
        >
          {activeBottomTab === 'active' && (
            <div className="space-y-2">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <ActiveTradeCard
                    key={order.id}
                    trade={order}
                    currentPrice={displayPrice}
                    onExpire={handleOrderExpire}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-[#848E9C] text-sm">
                  No active trades
                </div>
              )}
            </div>
          )}

          {activeBottomTab === 'scheduled' && (
            <div className="space-y-2">
              {scheduledOrders.length > 0 ? (
                scheduledOrders.map(order => (
                  <div key={order.id} className="bg-[#2B3139] rounded-lg p-4 border border-[#3A3F4A]">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${
                            order.direction === 'UP' ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                          }`}>
                            {order.direction}
                          </span>
                          <span className="text-xs text-[#848E9C]">{order.symbol}</span>
                        </div>
                        <div className="text-xs text-[#B7BDC6] mt-1">
                          Stake: ${order.stake.toFixed(2)} • {order.duration}s • {order.fluctuation}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#848E9C]">Scheduled</div>
                        <div className="text-xs font-mono text-[#F0B90B]">
                          {new Date(order.scheduledTime * 1000).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#848E9C] text-sm">
                  No scheduled trades
                </div>
              )}
            </div>
          )}

          {activeBottomTab === 'completed' && (
            <div className="space-y-2">
              {uniqueCompletedOrders.length > 0 ? (
                uniqueCompletedOrders.map(order => (
                  <CompletedOrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="text-center py-8 text-[#848E9C] text-sm">
                  No completed trades
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fluctuation Modal */}
      <AnimatePresence>
        {showFluctuationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4"
            onClick={() => setShowFluctuationModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={slideUp.transition}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <h3 className="text-lg font-semibold text-[#EAECEF]">Fluctuation Range</h3>
              </div>
              <div className="p-4 space-y-2">
                {FLUCTUATION_RANGES[optionDuration]?.map((range, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setOptionFluctuation(range.value);
                      setShowFluctuationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      optionFluctuation === range.value
                        ? 'bg-[#F0B90B]/20 border border-[#F0B90B]'
                        : 'bg-[#2B3139] hover:bg-[#323A45]'
                    }`}
                  >
                    <div>
                      <span className="text-[#EAECEF] font-medium">{range.label}</span>
                      <span className="text-xs text-[#848E9C] block mt-1">
                        Payout: {(range.payout * 100 - 100).toFixed(0)}%
                      </span>
                    </div>
                    {optionFluctuation === range.value && (
                      <CheckCircle className="w-5 h-5 text-[#F0B90B]" />
                    )}
                  </button>
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
            className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 p-4"
            onClick={() => setShowScheduledModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={slideUp.transition}
              className="bg-[#1E2329] border border-[#2B3139] rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2B3139]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAECEF]">Scheduled Time</h3>
                    <p className="text-xs text-[#848E9C] mt-1">(UTC+0)</p>
                  </div>
                  <button 
                    onClick={() => setShowScheduledModal(false)}
                    className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-[#848E9C]" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Current Time */}
                <div className="bg-[#2B3139] rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-xs text-[#848E9C] mb-1">Current Time</div>
                    <div className="text-lg font-mono text-[#EAECEF]">{currentUTC}</div>
                  </div>
                </div>

                {/* Time Selector */}
                <div className="grid grid-cols-3 gap-3">
                  {['Hours', 'Minutes', 'Seconds'].map((label, idx) => (
                    <div key={label}>
                      <label className="text-xs text-[#848E9C] block mb-1">{label}</label>
                      <div className="bg-[#2B3139] rounded-lg p-2 flex items-center justify-between">
                        <button
                          onClick={() => setScheduledTime(prev => {
                            const key = label.toLowerCase() as keyof typeof prev;
                            return { ...prev, [key]: Math.max(0, prev[key] - 1) };
                          })}
                          className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-mono text-[#EAECEF]">
                          {label === 'Hours' 
                            ? scheduledTime.hours.toString().padStart(2, '0')
                            : label === 'Minutes'
                            ? scheduledTime.minutes.toString().padStart(2, '0')
                            : scheduledTime.seconds.toString().padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => setScheduledTime(prev => {
                            const key = label.toLowerCase() as keyof typeof prev;
                            const max = label === 'Hours' ? 23 : 59;
                            return { ...prev, [key]: Math.min(max, prev[key] + 1) };
                          })}
                          className="text-[#848E9C] hover:text-[#EAECEF] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Time */}
                <div className="bg-[#2B3139] rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-xs text-[#848E9C] mb-1">Scheduled Time</div>
                    <div className="text-lg font-mono text-[#F0B90B]">
                      {scheduledTime.hours.toString().padStart(2, '0')}:
                      {scheduledTime.minutes.toString().padStart(2, '0')}:
                      {scheduledTime.seconds.toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowScheduledModal(false)}
                    className="flex-1 bg-[#2B3139] text-[#848E9C] py-3 rounded-lg font-medium hover:bg-[#323A45] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsScheduled(true);
                      setShowScheduledModal(false);
                      toast.success(`Trade scheduled for ${scheduledTime.hours}:${scheduledTime.minutes}:${scheduledTime.seconds} UTC`);
                    }}
                    className="flex-1 bg-[#F0B90B] text-[#0B0E11] py-3 rounded-lg font-medium hover:bg-[#F0B90B]/90 transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}