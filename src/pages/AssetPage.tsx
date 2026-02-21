// pages/AssetPage.tsx - Complete Trading Page for Individual Assets

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Star,
  Share2,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  BarChart3,
  PieChart,
  CandlestickChart,
  LineChart,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  AlertCircle,
  Info,
  Activity,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  X,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useRecentTrades } from '@/hooks/useRecentTrades';
import { toast } from 'react-hot-toast';
import { formatCurrency, formatPrice } from '@/utils/tradingCalculations';
import Countdown from 'react-countdown';

// ============================================
// TYPES
// ============================================

type TabType = 'spot' | 'futures' | 'options';
type ChartType = 'candlestick' | 'line';
type OrderSide = 'buy' | 'sell';

interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
}

interface Trade {
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: string;
  timestamp: number;
}

// ============================================
// CONSTANTS
// ============================================

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const ORDER_TYPES = ['market', 'limit', 'stop'];

// Mock data for charts - in production, this would come from API
const mockCandles = [
  { time: '09:30', open: 119600, high: 119800, low: 119500, close: 119700, volume: 1250 },
  { time: '09:35', open: 119700, high: 119900, low: 119600, close: 119800, volume: 2100 },
  { time: '09:40', open: 119800, high: 120000, low: 119700, close: 119900, volume: 1850 },
  { time: '09:45', open: 119900, high: 120100, low: 119800, close: 120000, volume: 3200 },
  { time: '09:50', open: 120000, high: 120200, low: 119900, close: 120100, volume: 2800 },
  { time: '09:55', open: 120100, high: 120150, low: 119950, close: 120050, volume: 1950 },
  { time: '10:00', open: 120050, high: 120180, low: 119980, close: 120120, volume: 2300 },
  { time: '10:05', open: 120120, high: 120220, low: 120000, close: 120180, volume: 2700 },
  { time: '10:10', open: 120180, high: 120250, low: 120050, close: 120200, volume: 2100 },
  { time: '10:15', open: 120200, high: 120300, low: 120100, close: 120250, volume: 1900 },
  { time: '10:20', open: 120250, high: 120280, low: 120150, close: 120220, volume: 1650 },
  { time: '10:25', open: 120220, high: 120270, low: 120180, close: 120240, volume: 1450 },
  { time: '10:30', open: 120240, high: 120290, low: 120190, close: 120260, volume: 1800 },
  { time: '10:35', open: 120260, high: 120310, low: 120200, close: 120280, volume: 2200 },
  { time: '10:40', open: 120280, high: 120330, low: 120220, close: 120300, volume: 2600 },
  { time: '10:45', open: 120300, high: 120350, low: 120250, close: 120320, volume: 2400 },
  { time: '10:50', open: 120320, high: 120370, low: 120270, close: 120340, volume: 2100 },
  { time: '10:55', open: 120340, high: 120380, low: 120290, close: 120360, volume: 1900 },
  { time: '11:00', open: 120360, high: 120400, low: 120310, close: 120380, volume: 2300 },
  { time: '11:05', open: 120380, high: 120420, low: 120330, close: 120400, volume: 2500 },
];

// Asset database for all available assets
const ALL_ASSETS = {
  // Crypto
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'crypto', marketCap: 1350000000000, supply: 19500000 },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'crypto', marketCap: 420000000000, supply: 120000000 },
  'BNB': { name: 'Binance Coin', symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'crypto', marketCap: 85000000000, supply: 155000000 },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'crypto', marketCap: 65000000000, supply: 450000000 },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', category: 'crypto', marketCap: 21000000000, supply: 35000000000 },
  'XRP': { name: 'Ripple', symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', category: 'crypto', marketCap: 32000000000, supply: 55000000000 },
  'DOT': { name: 'Polkadot', symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', category: 'crypto', marketCap: 11000000000, supply: 1200000000 },
  
  // Stocks
  'AAPL': { name: 'Apple Inc.', symbol: 'AAPLUSD', baseAsset: 'AAPL', quoteAsset: 'USD', category: 'stock', marketCap: 2850000000000, supply: 15500000000 },
  'MSFT': { name: 'Microsoft', symbol: 'MSFTUSD', baseAsset: 'MSFT', quoteAsset: 'USD', category: 'stock', marketCap: 2750000000000, supply: 7400000000 },
  'GOOGL': { name: 'Google', symbol: 'GOOGLUSD', baseAsset: 'GOOGL', quoteAsset: 'USD', category: 'stock', marketCap: 1750000000000, supply: 12500000000 },
  'AMZN': { name: 'Amazon', symbol: 'AMZNUSD', baseAsset: 'AMZN', quoteAsset: 'USD', category: 'stock', marketCap: 1650000000000, supply: 10100000000 },
  'TSLA': { name: 'Tesla', symbol: 'TSLAUSD', baseAsset: 'TSLA', quoteAsset: 'USD', category: 'stock', marketCap: 550000000000, supply: 3180000000 },
  'NVDA': { name: 'NVIDIA', symbol: 'NVDAUSD', baseAsset: 'NVDA', quoteAsset: 'USD', category: 'stock', marketCap: 1150000000000, supply: 2460000000 },
  'META': { name: 'Meta', symbol: 'METAUSD', baseAsset: 'META', quoteAsset: 'USD', category: 'stock', marketCap: 890000000000, supply: 2560000000 },
  
  // Forex
  'EURUSD': { name: 'Euro/US Dollar', symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD', category: 'forex', marketCap: null, supply: null },
  'GBPUSD': { name: 'British Pound/US Dollar', symbol: 'GBPUSD', baseAsset: 'GBP', quoteAsset: 'USD', category: 'forex', marketCap: null, supply: null },
  'USDJPY': { name: 'US Dollar/Japanese Yen', symbol: 'USDJPY', baseAsset: 'USD', quoteAsset: 'JPY', category: 'forex', marketCap: null, supply: null },
  
  // ETFs
  'SPY': { name: 'SPDR S&P 500 ETF', symbol: 'SPYUSD', baseAsset: 'SPY', quoteAsset: 'USD', category: 'etf', marketCap: 425000000000, supply: 900000000 },
  'QQQ': { name: 'Invesco QQQ Trust', symbol: 'QQQUSD', baseAsset: 'QQQ', quoteAsset: 'USD', category: 'etf', marketCap: 215000000000, supply: 487000000 },
  'VOO': { name: 'Vanguard S&P 500 ETF', symbol: 'VOOUSD', baseAsset: 'VOO', quoteAsset: 'USD', category: 'etf', marketCap: 350000000000, supply: 720000000 },
};

// ============================================
// COMPONENTS
// ============================================

// Order Book Row Component
const OrderBookRow = ({ price, amount, total, type }: any) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-teal-400' : 'text-red-400'}`}>
      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{amount.toFixed(3)}</span>
    <span className="font-mono text-xs text-[#848E9C]">
      ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>
);

// Trade Row Component
const TradeRow = ({ trade }: { trade: Trade }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-teal-400' : 'bg-red-400'}`} />
      <span className="font-mono text-sm text-[#EAECEF]">
        ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
    <span className="font-mono text-sm text-[#EAECEF]">{trade.amount.toFixed(3)}</span>
    <span className="text-xs text-[#848E9C]">{trade.time}</span>
  </div>
);

// Mini Candlestick Chart Component
const MiniCandlestickChart = ({ data }: { data: any[] }) => {
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const range = maxPrice - minPrice || 1;
  
  return (
    <div className="flex items-end h-full gap-1">
      {data.slice(-30).map((candle, i) => {
        const isUp = candle.close >= candle.open;
        const height = ((candle.high - candle.low) / range) * 100;
        const bodyHeight = (Math.abs(candle.close - candle.open) / range) * 100;
        const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / range) * 100;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
            {/* Wick */}
            <div 
              className={`absolute w-0.5 ${isUp ? 'bg-teal-400' : 'bg-red-400'}`}
              style={{ 
                height: `${height}%`,
                top: `${((maxPrice - candle.high) / range) * 100}%`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
            {/* Body */}
            <div 
              className={`absolute w-3 ${isUp ? 'bg-teal-400' : 'bg-red-400'}`}
              style={{ 
                height: `${bodyHeight}%`,
                top: `${bodyTop}%`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// Order Form Component
const OrderForm = ({ 
  side, 
  symbol, 
  price, 
  baseAsset,
  balance,
  onSubmit 
}: any) => {
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState(price.toString());
  const [percentage, setPercentage] = useState(0);

  const total = amount ? parseFloat(amount) * (orderType === 'market' ? price : parseFloat(limitPrice)) : 0;
  const maxAmount = balance / price;

  const handlePercentageClick = (p: number) => {
    setPercentage(p);
    setAmount(((maxAmount * p) / 100).toFixed(6));
  };

  return (
    <div className="space-y-4">
      {/* Order Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {ORDER_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
              orderType === type 
                ? 'bg-teal-400 text-gray-900' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {type}
          </button>
        ))}
      </div>
      
      {/* Price Input (for limit/stop orders) */}
      {orderType !== 'market' && (
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Price</span>
            <span>USDT</span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono"
              placeholder="0.00"
              step="0.01"
            />
          </div>
        </div>
      )}
      
      {/* Amount Input */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Amount</span>
          <span>Available: {formatCurrency(balance)} USDT</span>
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => {
              setAmount(e.target.value);
              setPercentage(0);
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono"
            placeholder="0.00"
            step="0.000001"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <button 
              onClick={() => handlePercentageClick(25)}
              className={`text-xs font-semibold ${percentage === 25 ? 'text-teal-400' : 'text-gray-500 hover:text-teal-400'}`}
            >
              25%
            </button>
            <button 
              onClick={() => handlePercentageClick(50)}
              className={`text-xs font-semibold ${percentage === 50 ? 'text-teal-400' : 'text-gray-500 hover:text-teal-400'}`}
            >
              50%
            </button>
            <button 
              onClick={() => handlePercentageClick(75)}
              className={`text-xs font-semibold ${percentage === 75 ? 'text-teal-400' : 'text-gray-500 hover:text-teal-400'}`}
            >
              75%
            </button>
            <button 
              onClick={() => handlePercentageClick(100)}
              className={`text-xs font-semibold ${percentage === 100 ? 'text-teal-400' : 'text-gray-500 hover:text-teal-400'}`}
            >
              Max
            </button>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Total</span>
          <span className="font-mono text-white font-bold">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
      
      {/* Submit Button */}
      <button
        onClick={onSubmit}
        disabled={!amount || parseFloat(amount) <= 0}
        className={`w-full py-4 rounded-lg font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed ${
          side === 'buy' 
            ? 'bg-teal-400 text-gray-900 hover:bg-teal-500' 
            : 'bg-red-400 text-gray-900 hover:bg-red-500'
        }`}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {baseAsset}
      </button>
      
      {/* Fee Info */}
      <p className="text-[10px] text-gray-500 text-center">
        Market fee: 0.1% • Limit fee: 0.0%
      </p>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssetPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getTradingBalance } = useUnifiedWallet();

  // Get asset info
  const asset = useMemo(() => {
    const baseSymbol = symbol?.toUpperCase().split('/')[0] || 'BTC';
    return ALL_ASSETS[baseSymbol as keyof typeof ALL_ASSETS] || ALL_ASSETS['BTC'];
  }, [symbol]);

  // State
  const [tab, setTab] = useState<TabType>('spot');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState('1h');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDepth, setShowDepth] = useState(false);
  const [hideBalances, setHideBalances] = useState(false);
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [showChart, setShowChart] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);

  // Live data
  const { currentPrice, priceChange24h, isLoading: priceLoading } = useBinanceStream(asset?.symbol || 'BTCUSDT');
  const { orderBook, loading: orderBookLoading } = useOrderBook(asset?.symbol || 'BTCUSDT');
  const { recentTrades, loading: tradesLoading } = useRecentTrades(asset?.symbol || 'BTCUSDT');

  // Mock data fallback
  const price = currentPrice || 119678.13;
  const change = priceChange24h || 0.83;
  const isPositiveChange = change >= 0;

  // Generate dynamic order book
  const orderBookAsks = useMemo(() => {
    if (orderBook?.asks && orderBook.asks.length > 0) {
      return orderBook.asks.slice(0, 6).map(ask => ({
        price: ask.price,
        amount: ask.quantity,
        total: ask.price * ask.quantity
      }));
    }
    // Fallback
    const basePrice = price;
    return [
      { price: basePrice + 0.80, amount: 0.013, total: (basePrice + 0.80) * 0.013 },
      { price: basePrice + 0.10, amount: 0.251, total: (basePrice + 0.10) * 0.251 },
      { price: basePrice - 0.90, amount: 0.056, total: (basePrice - 0.90) * 0.056 },
      { price: basePrice - 1.00, amount: 1.473, total: (basePrice - 1.00) * 1.473 },
      { price: basePrice - 1.50, amount: 0.892, total: (basePrice - 1.50) * 0.892 },
      { price: basePrice - 2.00, amount: 2.145, total: (basePrice - 2.00) * 2.145 },
    ];
  }, [orderBook, price]);

  const orderBookBids = useMemo(() => {
    if (orderBook?.bids && orderBook.bids.length > 0) {
      return orderBook.bids.slice(0, 6).map(bid => ({
        price: bid.price,
        amount: bid.quantity,
        total: bid.price * bid.quantity
      }));
    }
    // Fallback
    const basePrice = price;
    return [
      { price: basePrice - 1.00, amount: 0.210, total: (basePrice - 1.00) * 0.210 },
      { price: basePrice - 2.00, amount: 0.056, total: (basePrice - 2.00) * 0.056 },
      { price: basePrice - 2.10, amount: 0.010, total: (basePrice - 2.10) * 0.010 },
      { price: basePrice - 3.00, amount: 0.845, total: (basePrice - 3.00) * 0.845 },
      { price: basePrice - 3.50, amount: 1.234, total: (basePrice - 3.50) * 1.234 },
      { price: basePrice - 4.00, amount: 0.456, total: (basePrice - 4.00) * 0.456 },
    ];
  }, [orderBook, price]);

  const mockTrades: Trade[] = useMemo(() => {
    if (recentTrades && recentTrades.length > 0) {
      return recentTrades.slice(0, 10).map(trade => ({
        price: trade.price,
        amount: trade.quantity,
        side: trade.side === 'buy' ? 'buy' : 'sell',
        time: new Date(trade.time).toLocaleTimeString(),
        timestamp: trade.time
      }));
    }
    // Fallback
    return [
      { price: price - 1.00, amount: 0.01, side: 'buy', time: '09:32:01', timestamp: Date.now() - 60000 },
      { price: price - 1.13, amount: 0.02, side: 'sell', time: '09:31:58', timestamp: Date.now() - 120000 },
      { price: price - 1.63, amount: 0.15, side: 'buy', time: '09:31:45', timestamp: Date.now() - 180000 },
      { price: price - 2.13, amount: 0.08, side: 'buy', time: '09:31:32', timestamp: Date.now() - 240000 },
      { price: price - 2.33, amount: 0.12, side: 'sell', time: '09:31:20', timestamp: Date.now() - 300000 },
      { price: price - 2.63, amount: 0.05, side: 'sell', time: '09:31:12', timestamp: Date.now() - 360000 },
    ];
  }, [recentTrades, price]);

  const handleTrade = () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }
    toast.success('Order placed successfully');
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#0A0B0D] text-white pb-24"
      initial="initial"
      animate="animate"
      variants={fadeInUp}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0A0B0D]/95 backdrop-blur border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/trading')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{asset.baseAsset}/{asset.quoteAsset}</h1>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                isPositiveChange ? 'bg-teal-400/10' : 'bg-red-400/10'
              }`}>
                {isPositiveChange ? (
                  <TrendingUp size={14} className="text-teal-400" />
                ) : (
                  <TrendingDown size={14} className="text-red-400" />
                )}
                <span className={`text-sm font-medium ${isPositiveChange ? 'text-teal-400' : 'text-red-400'}`}>
                  {isPositiveChange ? '+' : ''}{change.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Star size={18} className={isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Share2 size={18} className="text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <MoreHorizontal size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* Price Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-white font-mono">
                ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">≈ ${price.toFixed(2)} USD</span>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock size={10} />
                  Real-time
                </span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-gray-500">24h High</div>
                <div className="font-mono text-sm text-white">
                  ${(price * 1.02).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">24h Low</div>
                <div className="font-mono text-sm text-white">
                  ${(price * 0.98).toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">24h Volume</div>
                <div className="font-mono text-sm text-white">
                  {formatCurrency(price * 12500)} {asset.quoteAsset}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Eye size={18} className="text-gray-400" />
              </button>
              <button 
                onClick={() => setChartExpanded(!chartExpanded)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                {chartExpanded ? <Minimize2 size={18} className="text-gray-400" /> : <Maximize2 size={18} className="text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Market Tabs */}
      <div className="px-4 border-b border-gray-800">
        <div className="flex gap-6">
          {['Spot', 'Futures', 'Options'].map((tabName) => (
            <button
              key={tabName}
              onClick={() => setTab(tabName.toLowerCase() as TabType)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                tab === tabName.toLowerCase()
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Timeframes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  timeframe === tf
                    ? 'bg-teal-400 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                className={`p-1.5 rounded ${chartType === 'candlestick' ? 'bg-gray-700 text-teal-400' : 'text-gray-400'}`}
                onClick={() => setChartType('candlestick')}
              >
                <CandlestickChart size={16} />
              </button>
              <button
                className={`p-1.5 rounded ${chartType === 'line' ? 'bg-gray-700 text-teal-400' : 'text-gray-400'}`}
                onClick={() => setChartType('line')}
              >
                <LineChart size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className={`${chartExpanded ? 'h-96' : 'h-64'} bg-gray-900 rounded-lg p-4 mb-4 transition-all duration-300`}>
          {chartType === 'candlestick' ? (
            <MiniCandlestickChart data={mockCandles} />
          ) : (
            <div className="flex items-end h-full">
              {mockCandles.slice(-30).map((candle, i) => (
                <div
                  key={i}
                  className="flex-1 bg-teal-400/60 mx-0.5 rounded-t"
                  style={{ height: `${(candle.close - 119500) / 1000 * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Volume */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">Volume (24h)</span>
            <span className="text-xs font-mono text-white">
              {formatCurrency(price * 12500)} {asset.quoteAsset}
            </span>
          </div>
          <div className="flex h-12 gap-1">
            {mockCandles.slice(-12).map((candle, i) => (
              <div
                key={i}
                className="flex-1 bg-gray-800 rounded-t relative"
                style={{ height: `${candle.volume / 50}%` }}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-teal-400/40 rounded-t"
                  style={{ height: `${candle.volume / 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Trading Interface */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Left Column - Order Book & Recent Trades */}
          <div className="lg:w-2/5 space-y-4">
            {/* Order Book */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-teal-400" />
                  <span className="text-sm font-semibold text-white">Order Book</span>
                </div>
                <button
                  onClick={() => setShowDepth(!showDepth)}
                  className="text-gray-500 hover:text-teal-400 text-xs flex items-center gap-1"
                >
                  <BarChart3 size={12} />
                  {showDepth ? 'Hide' : 'Show'} Depth
                </button>
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-3 text-xs text-gray-500 mb-2">
                <span>Price (USDT)</span>
                <span className="text-center">Amount ({asset.baseAsset})</span>
                <span className="text-right">Total (USDT)</span>
              </div>
              
              {/* Asks */}
              <div className="mb-2">
                {orderBookAsks.slice().reverse().map((order, i) => (
                  <OrderBookRow key={`ask-${i}`} {...order} type="ask" />
                ))}
              </div>
              
              {/* Spread */}
              <div className="grid grid-cols-3 gap-4 py-2 px-2 bg-gray-800/30 rounded my-1">
                <span className="text-xs text-gray-500">Spread</span>
                <span className="text-xs font-mono text-white text-center">
                  ${(orderBookAsks[0]?.price - orderBookBids[0]?.price || 0).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 text-right">
                  {((orderBookAsks[0]?.price - orderBookBids[0]?.price || 0) / (orderBookBids[0]?.price || 1) * 100).toFixed(2)}%
                </span>
              </div>
              
              {/* Bids */}
              <div className="mt-2">
                {orderBookBids.map((order, i) => (
                  <OrderBookRow key={`bid-${i}`} {...order} type="bid" />
                ))}
              </div>
            </div>
            
            {/* Recent Trades */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-teal-400" />
                  <span className="text-sm font-semibold text-white">Recent Trades</span>
                </div>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                  {mockTrades.length} Trades
                </span>
              </div>
              
              {/* Header */}
              <div className="grid grid-cols-3 text-xs text-gray-500 mb-2">
                <span>Price (USDT)</span>
                <span className="text-center">Amount ({asset.baseAsset})</span>
                <span className="text-right">Time</span>
              </div>
              
              {/* Trades */}
              <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                {mockTrades.map((trade, i) => (
                  <TradeRow key={i} trade={trade} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Trading Forms */}
          <div className="lg:w-3/5 space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setOrderSide('buy')}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  orderSide === 'buy'
                    ? 'bg-teal-400 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setOrderSide('sell')}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                  orderSide === 'sell'
                    ? 'bg-red-400 text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                Sell
              </button>
            </div>

            {/* Spot Trading Form */}
            {tab === 'spot' && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-4">Spot Trading</h3>
                <OrderForm
                  side={orderSide}
                  symbol={asset.symbol}
                  price={price}
                  baseAsset={asset.baseAsset}
                  balance={getTradingBalance('USDT')}
                  onSubmit={handleTrade}
                />
              </div>
            )}

            {/* Futures Trading Form */}
            {tab === 'futures' && (
              <div className="bg-gray-900 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <TrendingUp size={24} className="text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Futures Trading Coming Soon</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Trade {asset.baseAsset}/{asset.quoteAsset} futures with up to 100x leverage. Advanced risk management and real-time settlement.
                </p>
                <button className="bg-teal-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-teal-500 transition-colors">
                  Get Notified
                  <ChevronRight size={16} className="inline ml-2" />
                </button>
              </div>
            )}

            {/* Options Trading Form */}
            {tab === 'options' && (
              <div className="bg-gray-900 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <PieChart size={24} className="text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Options Trading Coming Soon</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Trade {asset.baseAsset}/{asset.quoteAsset} options with flexible strike prices and expiration dates. Hedge your portfolio effectively.
                </p>
                <button className="bg-teal-400 text-gray-900 px-6 py-3 rounded-lg font-bold hover:bg-teal-500 transition-colors">
                  Join Waitlist
                  <ChevronRight size={16} className="inline ml-2" />
                </button>
              </div>
            )}

            {/* Market Stats */}
            <div className="bg-gray-900 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} className="text-teal-400" />
                <span className="text-xs font-medium text-white">Market Statistics</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] text-gray-500">Market Cap</div>
                  <div className="text-sm font-mono text-white">
                    {asset.marketCap ? `$${(asset.marketCap / 1e9).toFixed(2)}B` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">24h Volume</div>
                  <div className="text-sm font-mono text-white">
                    ${(price * 12500 / 1e6).toFixed(2)}M
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Circulating Supply</div>
                  <div className="text-sm font-mono text-white">
                    {asset.supply ? `${(asset.supply / 1e6).toFixed(2)}M` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">All-Time High</div>
                  <div className="text-sm font-mono text-white">
                    ${(price * 1.5).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Link */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-gray-800">
        <div className="py-3 text-center">
          <button 
            onClick={() => navigate(`/trading/${symbol}/chart`)}
            className="text-teal-400 text-sm flex items-center justify-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{asset.baseAsset} Chart</span>
          </button>
        </div>

        {/* Kryvex Footer */}
        <div className="py-2 text-center text-xs text-gray-600">
          kryvex.com
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