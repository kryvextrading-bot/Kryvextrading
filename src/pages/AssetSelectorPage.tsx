// pages/AssetSelectorPage.tsx - COMPLETE BINANCE REDESIGN

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp,
  BarChart3,
  TrendingDown,
  Sparkles,
  Filter,
  Star,
  Flame,
  Search,
  ArrowLeft,
  LayoutGrid,
  X,
  RefreshCw,
  Clock,
  Info,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Award,
  Crown,
  Rocket,
  Shield,
  Globe,
  Wallet,
  Activity
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type CategoryType = 'futures' | 'usstock' | 'forex' | 'crypto' | 'etf';
type FilterType = 'favourites' | 'all' | 'hot' | 'gainer' | 'loser';

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
  marketCap?: number;
}

// ============================================
// CONSTANTS
// ============================================

// Binance Official Color Palette
const BINANCE = {
  yellow: '#F0B90B',
  yellowDark: '#DBA40A',
  yellowLight: '#FCD535',
  black: '#0B0E11',
  dark: '#1E2329',
  card: '#2B3139',
  cardHover: '#373B42',
  border: '#3A3F4A',
  text: {
    primary: '#EAECEF',
    secondary: '#B7BDC6',
    tertiary: '#848E9C',
    disabled: '#5E6673',
  },
  green: '#0ECB81',
  red: '#F6465D',
  blue: '#5096FF',
  purple: '#A66AE6',
  orange: '#F78D4B',
};

const CATEGORIES = [
  { id: 'futures', label: 'Futures', icon: TrendingUp, color: BINANCE.yellow },
  { id: 'usstock', label: 'USStock', icon: BarChart3, color: BINANCE.blue },
  { id: 'forex', label: 'Forex', icon: TrendingDown, color: BINANCE.purple },
  { id: 'crypto', label: 'Crypto', icon: Sparkles, color: BINANCE.orange },
  { id: 'etf', label: 'ETF', icon: Filter, color: BINANCE.green },
];

const FILTERS = [
  { id: 'favourites', label: 'Favourites', icon: Star, color: BINANCE.yellow },
  { id: 'all', label: 'All', icon: Filter, color: BINANCE.blue },
  { id: 'hot', label: 'Hot', icon: Flame, color: BINANCE.orange },
  { id: 'gainer', label: 'Gainer', icon: TrendingUp, color: BINANCE.green },
  { id: 'loser', label: 'Loser', icon: TrendingDown, color: BINANCE.red },
];

// Complete asset database
const ALL_ASSETS: TradingPair[] = [
  // Futures
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', name: 'Bitcoin', category: 'futures', price: 66743.75, change: -1.06, changePercent: -1.06, volume: 560000, volumeDisplay: '0.56M', hot: true, leverage: 86, marketCap: 1350000000000 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', category: 'futures', price: 3504.15, change: -1.60, changePercent: -1.60, volume: 450000, volumeDisplay: '0.45M', leverage: 37, marketCap: 420000000000 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', name: 'Binance Coin', category: 'futures', price: 706.47, change: 0.30, changePercent: 0.30, volume: 630000, volumeDisplay: '0.63M', leverage: 88, marketCap: 85000000000 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', name: 'Solana', category: 'futures', price: 151.44, change: 1.77, changePercent: 1.77, volume: 720000, volumeDisplay: '0.72M', leverage: 40, marketCap: 65000000000 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', category: 'futures', price: 0.60, change: -2.07, changePercent: -2.07, volume: 720000, volumeDisplay: '0.72M', leverage: 32, marketCap: 21000000000 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', name: 'Ripple', category: 'futures', price: 0.60, change: 1.83, changePercent: 1.83, volume: 840000, volumeDisplay: '0.84M', leverage: 30, marketCap: 32000000000 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', name: 'Polkadot', category: 'futures', price: 7.96, change: -2.25, changePercent: -2.25, volume: 230000, volumeDisplay: '0.23M', leverage: 23, marketCap: 11000000000 },
  
  // US Stocks
  { symbol: 'AAPL', baseAsset: 'AAPL', quoteAsset: 'USD', name: 'Apple Inc.', category: 'usstock', price: 176.25, change: 1.80, changePercent: 1.80, volume: 6660000, volumeDisplay: '6.66M', marketCap: 2850000000000 },
  { symbol: 'MSFT', baseAsset: 'MSFT', quoteAsset: 'USD', name: 'Microsoft', category: 'usstock', price: 345.09, change: -1.81, changePercent: -1.81, volume: 44540000, volumeDisplay: '44.54M', marketCap: 2750000000000 },
  { symbol: 'GOOGL', baseAsset: 'GOOGL', quoteAsset: 'USD', name: 'Google', category: 'usstock', price: 158.16, change: -1.29, changePercent: -1.29, volume: 29890000, volumeDisplay: '29.89M', marketCap: 1750000000000 },
  { symbol: 'AMZN', baseAsset: 'AMZN', quoteAsset: 'USD', name: 'Amazon', category: 'usstock', price: 168.07, change: -2.10, changePercent: -2.10, volume: 42880000, volumeDisplay: '42.88M', marketCap: 1650000000000 },
  { symbol: 'TSLA', baseAsset: 'TSLA', quoteAsset: 'USD', name: 'Tesla', category: 'usstock', price: 297.02, change: -1.69, changePercent: -1.69, volume: 48910000, volumeDisplay: '48.91M', marketCap: 550000000000 },
  { symbol: 'NVDA', baseAsset: 'NVDA', quoteAsset: 'USD', name: 'NVIDIA', category: 'usstock', price: 430.64, change: 1.33, changePercent: 1.33, volume: 24620000, volumeDisplay: '24.62M', marketCap: 1150000000000 },
  { symbol: 'META', baseAsset: 'META', quoteAsset: 'USD', name: 'Meta', category: 'usstock', price: 278.39, change: 3.26, changePercent: 3.26, volume: 10330000, volumeDisplay: '10.33M', marketCap: 890000000000 },
  { symbol: 'NFLX', baseAsset: 'NFLX', quoteAsset: 'USD', name: 'Netflix', category: 'usstock', price: 407.33, change: 1.54, changePercent: 1.54, volume: 27700000, volumeDisplay: '27.70M', marketCap: 180000000000 },
  
  // Forex
  { symbol: 'EURUSD', baseAsset: 'EUR', quoteAsset: 'USD', name: 'Euro/US Dollar', category: 'forex', price: 1.1032, change: 0.42, changePercent: 0.42, volume: 78320000, volumeDisplay: '78.32M' },
  { symbol: 'USDJPY', baseAsset: 'USD', quoteAsset: 'JPY', name: 'US Dollar/Japanese Yen', category: 'forex', price: 154.53, change: 0.20, changePercent: 0.20, volume: 30010000, volumeDisplay: '30.01M' },
  { symbol: 'GBPUSD', baseAsset: 'GBP', quoteAsset: 'USD', name: 'British Pound/US Dollar', category: 'forex', price: 1.2815, change: 0.95, changePercent: 0.95, volume: 42820000, volumeDisplay: '42.82M' },
  { symbol: 'USDCHF', baseAsset: 'USD', quoteAsset: 'CHF', name: 'US Dollar/Swiss Franc', category: 'forex', price: 0.8842, change: -0.22, changePercent: -0.22, volume: 6650000, volumeDisplay: '6.65M' },
  { symbol: 'AUDUSD', baseAsset: 'AUD', quoteAsset: 'USD', name: 'Australian Dollar/US Dollar', category: 'forex', price: 0.6725, change: 0.56, changePercent: 0.56, volume: 76750000, volumeDisplay: '76.75M' },
  { symbol: 'USDCAD', baseAsset: 'USD', quoteAsset: 'CAD', name: 'US Dollar/Canadian Dollar', category: 'forex', price: 1.3715, change: -0.63, changePercent: -0.63, volume: 82190000, volumeDisplay: '82.19M' },
  { symbol: 'USDCNH', baseAsset: 'USD', quoteAsset: 'CNH', name: 'US Dollar/Chinese Yuan', category: 'forex', price: 7.1045, change: 0.28, changePercent: 0.28, volume: 13970000, volumeDisplay: '13.97M' },
  { symbol: 'USDHKD', baseAsset: 'USD', quoteAsset: 'HKD', name: 'US Dollar/Hong Kong Dollar', category: 'forex', price: 7.8620, change: 0.96, changePercent: 0.96, volume: 94350000, volumeDisplay: '94.35M' },
  
  // Crypto
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', name: 'Bitcoin', category: 'crypto', price: 67668.18, change: -2.48, changePercent: -2.48, volume: 580000, volumeDisplay: '0.58M', marketCap: 1350000000000 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', category: 'crypto', price: 3492.89, change: -1.83, changePercent: -1.83, volume: 840000, volumeDisplay: '0.84M', marketCap: 420000000000 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', name: 'Binance Coin', category: 'crypto', price: 943.60, change: -2.14, changePercent: -2.14, volume: 630000, volumeDisplay: '0.63M', marketCap: 85000000000 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', name: 'Solana', category: 'crypto', price: 856.88, change: -0.70, changePercent: -0.70, volume: 310000, volumeDisplay: '0.31M', marketCap: 65000000000 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', category: 'crypto', price: 757.05, change: 2.84, changePercent: 2.84, volume: 60000, volumeDisplay: '0.06M', marketCap: 21000000000 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', name: 'Ripple', category: 'crypto', price: 99.42, change: -0.71, changePercent: -0.71, volume: 440000, volumeDisplay: '0.44M', marketCap: 32000000000 },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', name: 'Polkadot', category: 'crypto', price: 537.53, change: 1.17, changePercent: 1.17, volume: 710000, volumeDisplay: '0.71M', marketCap: 11000000000 },
  
  // ETFs
  { symbol: 'SPY', baseAsset: 'SPY', quoteAsset: 'USD', name: 'SPDR S&P 500 ETF', category: 'etf', price: 473.65, change: 0.01, changePercent: 0.01, volume: 5640000, volumeDisplay: '5.64M', marketCap: 425000000000 },
  { symbol: 'IVV', baseAsset: 'IVV', quoteAsset: 'USD', name: 'iShares Core S&P 500 ETF', category: 'etf', price: 514.98, change: 1.19, changePercent: 1.19, volume: 26230000, volumeDisplay: '26.23M', marketCap: 350000000000 },
  { symbol: 'VOO', baseAsset: 'VOO', quoteAsset: 'USD', name: 'Vanguard S&P 500 ETF', category: 'etf', price: 485.94, change: 0.63, changePercent: 0.63, volume: 39310000, volumeDisplay: '39.31M', marketCap: 375000000000 },
  { symbol: 'QQQ', baseAsset: 'QQQ', quoteAsset: 'USD', name: 'Invesco QQQ Trust', category: 'etf', price: 441.08, change: -0.06, changePercent: -0.06, volume: 31100000, volumeDisplay: '31.10M', marketCap: 215000000000 },
  { symbol: 'VTI', baseAsset: 'VTI', quoteAsset: 'USD', name: 'Vanguard Total Stock Market ETF', category: 'etf', price: 262.77, change: 0.72, changePercent: 0.72, volume: 31300000, volumeDisplay: '31.30M', marketCap: 300000000000 },
  { symbol: 'VEA', baseAsset: 'VEA', quoteAsset: 'USD', name: 'Vanguard FTSE Developed Markets ETF', category: 'etf', price: 66.71, change: -0.39, changePercent: -0.39, volume: 4980000, volumeDisplay: '4.98M', marketCap: 110000000000 },
  { symbol: 'VWO', baseAsset: 'VWO', quoteAsset: 'USD', name: 'Vanguard FTSE Emerging Markets ETF', category: 'etf', price: 50.53, change: -0.86, changePercent: -0.86, volume: 6070000, volumeDisplay: '6.07M', marketCap: 95000000000 },
  { symbol: 'BND', baseAsset: 'BND', quoteAsset: 'USD', name: 'Vanguard Total Bond Market ETF', category: 'etf', price: 80.42, change: -1.50, changePercent: -1.50, volume: 22020000, volumeDisplay: '22.02M', marketCap: 85000000000 },
];

// ============================================
// ANIMATION VARIANTS
// ============================================

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

const headerVariants = {
  hidden: { y: -60, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.1
    }
  }
};

const categoryVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  })
};

const filterVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.05,
      type: "spring",
      stiffness: 100
    }
  })
};

const assetVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.5 + i * 0.03,
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }),
  hover: {
    scale: 1.01,
    backgroundColor: 'rgba(240, 185, 11, 0.05)',
    transition: { duration: 0.2 }
  }
};

const footerVariants = {
  hidden: { y: 100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.8
    }
  }
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const floatAnimation = {
  y: [0, -5, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const shimmerEffect = {
  initial: { x: '-100%' },
  hover: { x: '100%' },
  transition: { duration: 0.8, ease: "easeInOut" }
};

// ============================================
// COMPONENTS
// ============================================

const CategoryIcon: React.FC<{ icon: any; color: string }> = ({ icon: Icon, color }) => (
  <motion.div
    whileHover={{ rotate: 10, scale: 1.1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <Icon className="w-4 h-4" style={{ color }} />
  </motion.div>
);

const StatsBadge: React.FC<{ label: string; value: string; icon: any }> = ({ label, value, icon: Icon }) => (
  <motion.div
    className="flex items-center gap-2 bg-[#1E2329] px-3 py-1.5 rounded-lg border border-[#2B3139]"
    whileHover={{ scale: 1.02, backgroundColor: '#2B3139' }}
    transition={{ duration: 0.2 }}
  >
    <Icon className="w-3 h-3 text-[#F0B90B]" />
    <span className="text-xs text-[#848E9C]">{label}:</span>
    <span className="text-xs font-medium text-[#EAECEF]">{value}</span>
  </motion.div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssetSelectorPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('futures');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteAssets');
    return saved ? JSON.parse(saved) : [];
  });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteAssets', JSON.stringify(favorites));
  }, [favorites]);

  // Simulate real-time updates with animation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      setLastUpdated(new Date());
      setTimeout(() => setIsRefreshing(false), 1000);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleAssetSelect = (asset: TradingPair) => {
    navigate(`/trading/${asset.baseAsset.toLowerCase()}`);
  };

  const handleSelectFirstAvailable = () => {
    if (filteredAssets.length > 0) {
      handleAssetSelect(filteredAssets[0]);
    }
  };

  // Format last updated time
  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  // Calculate market statistics
  const marketStats = useMemo(() => {
    const totalAssets = ALL_ASSETS.length;
    const gainers = ALL_ASSETS.filter(a => a.changePercent > 0).length;
    const losers = ALL_ASSETS.filter(a => a.changePercent < 0).length;
    const hotAssets = ALL_ASSETS.filter(a => a.hot).length;
    
    return {
      totalAssets,
      gainers,
      losers,
      hotAssets,
      gainerPercent: ((gainers / totalAssets) * 100).toFixed(1),
      loserPercent: ((losers / totalAssets) * 100).toFixed(1)
    };
  }, []);

  // Filter assets based on category, search, and filter type
  const filteredAssets = useMemo(() => {
    // First filter by category
    let filtered = ALL_ASSETS.filter(asset => 
      asset.category === selectedCategory
    );

    // Remove duplicates by symbol (keep first occurrence)
    const uniqueSymbols = new Map();
    filtered = filtered.filter(asset => {
      if (!uniqueSymbols.has(asset.symbol)) {
        uniqueSymbols.set(asset.symbol, true);
        return true;
      }
      return false;
    });

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
    <motion.div 
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={pageVariants}
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF]"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5096FF]/5 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <motion.div 
        variants={headerVariants}
        className="sticky top-0 z-40 bg-[#1E2329]/95 backdrop-blur-xl border-b border-[#2B3139]/50"
      >
        <div className="px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ x: -5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/')} 
                className="text-[#848E9C] hover:text-[#F0B90B] transition-colors relative group"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-[#F0B90B]/0 group-hover:bg-[#F0B90B]/20"
                  transition={{ duration: 0.2 }}
                />
              </motion.button>
              
              <div>
                <motion.h1 
                  className="text-xl font-bold text-[#EAECEF]"
                  animate={pulseAnimation}
                >
                  Choose your trading pair
                </motion.h1>
                <motion.p 
                  className="text-xs text-[#848E9C] mt-0.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Real-time data from all markets
                </motion.p>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStats(!showStats)}
                className="text-[#848E9C] hover:text-[#F0B90B] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#2B3139] flex items-center gap-1"
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Stats</span>
              </motion.button>
              
              <motion.button 
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/trading/grid')}
                className="text-[#848E9C] hover:text-[#F0B90B] transition-colors p-2 rounded-lg hover:bg-[#2B3139]"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Stats Panel */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <StatsBadge label="Total" value={marketStats.totalAssets.toString()} icon={Globe} />
                  <StatsBadge label="Gainers" value={`${marketStats.gainers} (${marketStats.gainerPercent}%)`} icon={TrendingUp} />
                  <StatsBadge label="Losers" value={`${marketStats.losers} (${marketStats.loserPercent}%)`} icon={TrendingDown} />
                  <StatsBadge label="Hot" value={marketStats.hotAssets.toString()} icon={Flame} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          <motion.div 
            className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide"
          >
            {CATEGORIES.map((cat, index) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <motion.button
                  key={cat.id}
                  custom={index}
                  variants={categoryVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat.id as CategoryType)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 overflow-hidden group ${
                    isActive
                      ? 'text-[#0B0E11]'
                      : 'text-[#848E9C] hover:text-[#EAECEF]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-[#F0B90B] rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#0B0E11]' : ''}`} style={{ color: isActive ? '#0B0E11' : cat.color }} />
                    <span className="relative z-10">{cat.label}</span>
                  </span>
                  {!isActive && (
                    <motion.div
                      className="absolute inset-0 bg-[#2B3139] rounded-xl opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="px-4 py-3"
        variants={headerVariants}
      >
        <motion.div 
          className="relative"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5E6673]" />
          <input
            type="text"
            placeholder={`Search ${selectedCategory} pairs...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl pl-10 pr-12 py-4 text-[#EAECEF] placeholder-[#5E6673] focus:outline-none focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B]/50 transition-all duration-300"
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#848E9C] hover:text-[#F0B90B] transition-colors"
              aria-label="Clear search"
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
          <motion.div
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <RefreshCw className="w-4 h-4 text-[#F0B90B]" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="px-4 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide"
      >
        {FILTERS.map((filter, index) => {
          const Icon = filter.icon;
          const isActive = selectedFilter === filter.id;
          return (
            <motion.button
              key={filter.id}
              custom={index}
              variants={filterVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFilter(filter.id as FilterType)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                isActive
                  ? 'bg-[#F0B90B] text-[#0B0E11] shadow-lg shadow-[#F0B90B]/20'
                  : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-[#0B0E11]' : ''}`} />
              {filter.label}
            </motion.button>
          );
        })}
      </motion.div>

      {/* Info Bar */}
      <motion.div 
        className="px-4 py-2 flex items-center justify-between text-xs text-[#848E9C] border-b border-[#2B3139]/50 bg-[#1E2329]/30"
        variants={headerVariants}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, ease: "linear" }}
          >
            <RefreshCw className="w-3 h-3" />
          </motion.div>
          <span>Auto-refresh every 30s</span>
          <span className="w-1 h-1 bg-[#F0B90B] rounded-full" />
          <motion.span
            key={lastUpdated.getTime()}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="font-mono"
          >
            Last: {formatLastUpdated(lastUpdated)}
          </motion.span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>UTC+0</span>
        </div>
      </motion.div>

      {/* Table Header */}
      <motion.div 
        className="px-4 py-3 grid grid-cols-12 text-xs text-[#848E9C] border-b border-[#2B3139] bg-[#1E2329]/50"
        variants={headerVariants}
      >
        <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
          <span className="w-4" /> {/* Spacer for star */}
          Pair
        </div>
        <div className="col-span-3 sm:col-span-2 text-right">Last Price</div>
        <div className="col-span-3 sm:col-span-2 text-right">Change %</div>
        <div className="col-span-2 text-right hidden sm:block">Volume</div>
      </motion.div>

      {/* Asset List */}
      <motion.div 
        className="overflow-y-auto" 
        style={{ maxHeight: 'calc(100vh - 280px)' }}
      >
        <AnimatePresence mode="wait">
          {filteredAssets.length > 0 ? (
            filteredAssets.map((asset, index) => (
              <motion.div
                key={`${asset.symbol}-${asset.category}`}
                custom={index}
                variants={assetVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -20 }}
                whileHover="hover"
                layout
              >
                <button
                  onClick={() => handleAssetSelect(asset)}
                  className="w-full px-4 py-4 grid grid-cols-12 items-center border-b border-[#2B3139]/30 hover:bg-[#1E2329] transition-colors group relative overflow-hidden"
                >
                  {/* Shimmer effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F0B90B]/5 to-transparent"
                    variants={shimmerEffect}
                    initial="initial"
                    whileHover="hover"
                  />
                  
                  {/* Pair column */}
                  <div className="col-span-6 sm:col-span-5 flex items-center space-x-3 relative z-10">
                    <motion.button
                      onClick={(e) => toggleFavorite(asset.symbol, e)}
                      className="text-[#5E6673] hover:text-[#F0B90B] transition-colors"
                      whileHover={{ scale: 1.2, rotate: 180 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      <Star className="w-4 h-4" fill={favorites.includes(asset.symbol) ? "#F0B90B" : "none"} />
                    </motion.button>
                    
                    <div className="flex items-center gap-2">
                      {/* Asset Icon Placeholder */}
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2B3139] to-[#1E2329] flex items-center justify-center text-xs font-bold text-[#F0B90B]">
                        {asset.symbol.charAt(0)}
                      </div>
                      
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[#EAECEF] font-medium group-hover:text-[#F0B90B] transition-colors">
                            {asset.symbol}
                          </span>
                          {asset.leverage && (
                            <motion.span 
                              className="text-xs bg-[#F0B90B]/10 text-[#F0B90B] px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#F0B90B]/20"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.02 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <Zap className="w-2 h-2" />
                              {asset.leverage}x
                            </motion.span>
                          )}
                          {asset.hot && (
                            <motion.div
                              animate={floatAnimation}
                              className="flex items-center"
                            >
                              <Flame className="w-3 h-3 text-[#F78D4B]" />
                            </motion.div>
                          )}
                        </div>
                        <div className="text-xs text-[#5E6673]">{asset.name}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price column */}
                  <div className="col-span-3 sm:col-span-2 text-right relative z-10">
                    <motion.div 
                      className="text-[#EAECEF] font-mono text-sm"
                      key={asset.price}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      ${asset.price.toLocaleString(undefined, { 
                        minimumFractionDigits: asset.price < 1 ? 4 : 2,
                        maximumFractionDigits: asset.price < 1 ? 4 : 2 
                      })}
                    </motion.div>
                  </div>
                  
                  {/* Change column */}
                  <div className="col-span-3 sm:col-span-2 text-right relative z-10">
                    <motion.div 
                      className={`text-sm font-medium font-mono ${
                        asset.change >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                      }`}
                      key={asset.changePercent}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3 }}
                    >
                      {asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </motion.div>
                  </div>

                  {/* Volume column */}
                  <div className="col-span-2 text-right text-[#848E9C] text-sm font-mono hidden sm:block relative z-10">
                    {asset.volumeDisplay}
                  </div>
                </button>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-16 text-center"
            >
              <motion.div 
                animate={floatAnimation}
                className="text-5xl mb-4 inline-block"
              >
                🔍
              </motion.div>
              <motion.div 
                className="text-[#848E9C] text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                No matching pairs found
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="mt-4 text-[#F0B90B] text-sm hover:underline relative group inline-flex items-center gap-1"
              >
                Clear filters
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Actions */}
      <motion.div 
        variants={footerVariants}
        initial="hidden"
        animate="visible"
        className="fixed bottom-0 left-0 right-0 bg-[#1E2329]/95 backdrop-blur-xl border-t border-[#2B3139]/50 px-4 py-3"
      >
        <div className="flex justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.02, x: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl text-[#848E9C] hover:text-[#EAECEF] transition-colors relative group border border-[#2B3139] hover:border-[#F0B90B]/30"
          >
            Cancel
            <motion.div
              className="absolute inset-0 rounded-xl bg-[#F0B90B]/0 group-hover:bg-[#F0B90B]/5"
              transition={{ duration: 0.2 }}
            />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSelectFirstAvailable}
            className="px-6 py-2.5 bg-[#F0B90B] text-[#0B0E11] rounded-xl font-medium hover:bg-[#F0B90B]/90 transition-colors relative overflow-hidden group shadow-lg shadow-[#F0B90B]/20"
          >
            <span className="relative z-10">Select First Available</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5 }}
            />
          </motion.button>
        </div>
        
        <motion.div 
          className="text-center text-xs text-[#5E6673] mt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          kryvex.com • Secure • Reliable • Fast
        </motion.div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #1E2329;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, button {
            font-size: 16px !important;
          }
        }

        /* Binance style focus rings */
        *:focus-visible {
          outline: 2px solid #F0B90B;
          outline-offset: 2px;
        }

        /* Smooth transitions */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Glowing effect for active items */
        .bg-\\[\\#F0B90B\\] {
          box-shadow: 0 0 20px rgba(240, 185, 11, 0.3);
        }
      `}</style>
    </motion.div>
  );
}