import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Landmark, 
  Coins, 
  Zap, 
  Bot, 
  Eye, 
  Home, 
  LineChart, 
  CreditCard, 
  User,
  TrendingUp,
  BarChart3,
  Users,
  Globe,
  RefreshCw,
  ChevronRight,
  Settings,
  Search,
  Activity,
  DollarSign,
  Clock,
  Shield,
  Award,
  Gift,
  Rocket,
  Menu,
  X,
  Sparkles,
  Flame,
  Star,
  AlertCircle
} from 'lucide-react';
import { useMarketData } from '@/contexts/MarketDataContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { Skeleton } from '@/components/ui/skeleton';

// Import assets from AssetPage
const ALL_ASSETS: Record<string, {
  name: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  category: 'crypto' | 'stable' | 'meme' | 'stock' | 'commodity';
  marketCap: number;
  supply: number;
}> = {
  // Crypto
  'BTC': { name: 'Bitcoin', symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', category: 'crypto', marketCap: 1350000000000, supply: 19500000 },
  'ETH': { name: 'Ethereum', symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', category: 'crypto', marketCap: 420000000000, supply: 120000000 },
  'BNB': { name: 'Binance Coin', symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', category: 'crypto', marketCap: 88000000000, supply: 166801148 },
  'SOL': { name: 'Solana', symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', category: 'crypto', marketCap: 62000000000, supply: 511736464 },
  'ADA': { name: 'Cardano', symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', category: 'crypto', marketCap: 38000000000, supply: 45000000000 },
  'XRP': { name: 'Ripple', symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', category: 'crypto', marketCap: 33000000000, supply: 99987684073 },
  'DOT': { name: 'Polkadot', symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', category: 'crypto', marketCap: 9000000000, supply: 1100000000 },
  'USDT': { name: 'Tether', symbol: 'USDT', baseAsset: 'USDT', quoteAsset: 'USDT', category: 'stable', marketCap: 83000000000, supply: 83000000000 },
  'DOGE': { name: 'Dogecoin', symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', category: 'crypto', marketCap: 15000000000, supply: 14641643600 },
  'WIF': { name: 'Dogwifhat', symbol: 'WIFUSDT', baseAsset: 'WIF', quoteAsset: 'USDT', category: 'crypto', marketCap: 2500000000, supply: 998908093 },
  'PEPE': { name: 'Pepe', symbol: 'PEPEUSDT', baseAsset: 'PEPE', quoteAsset: 'USDT', category: 'meme', marketCap: 4200000000, supply: 420690000000000 },
  // Stocks
  'AAPL': { name: 'Apple Inc.', symbol: 'AAPL', baseAsset: 'AAPL', quoteAsset: 'USD', category: 'stock', marketCap: 2800000000000, supply: 15600000000 },
  'GOOGL': { name: 'Alphabet Inc.', symbol: 'GOOGL', baseAsset: 'GOOGL', quoteAsset: 'USD', category: 'stock', marketCap: 1700000000000, supply: 12600000000 },
  'TSLA': { name: 'Tesla Inc.', symbol: 'TSLA', baseAsset: 'TSLA', quoteAsset: 'USD', category: 'stock', marketCap: 780000000000, supply: 3100000000 },
  // Commodities
  'GOLD': { name: 'Gold', symbol: 'XAU', baseAsset: 'XAU', quoteAsset: 'USD', category: 'commodity', marketCap: 13000000000000, supply: 197400000 },
  'SILVER': { name: 'Silver', symbol: 'XAG', baseAsset: 'XAG', quoteAsset: 'USD', category: 'commodity', marketCap: 1200000000000, supply: 1900000 }
};

// ============================================
// TYPES
// ============================================

interface WalletBalance {
  totalUSDT: number;
  totalUSD: number;
  change24h: number;
  lastUpdated: Date;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  volume: string;
  price: number;
  usdPrice: number;
  change24h: number;
  icon: string;
  category: 'crypto' | 'stock' | 'forex' | 'etf' | 'futures' | 'commodity';
  high24h: number;
  low24h: number;
}

interface TrendingAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: string;
  volume: string;
  icon: string;
}

interface ServiceItem {
  name: string;
  icon: React.ElementType;
  route: string;
  badge?: number;
  isActive?: boolean;
  color: string;
}

interface BannerItem {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  route: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

interface ActivityItem {
  asset: string;
  action: string;
  amount: string;
  value: string;
  time: string;
}

// ============================================
// CONSTANTS
// ============================================

const SERVICES: ServiceItem[] = [
  { name: 'Quant Trading', icon: BarChart3, route: '/trading', badge: 3, color: 'from-blue-500 to-cyan-500' },
  { name: 'Node Stacking', icon: Zap, route: '/arbitrage', isActive: true, color: 'from-purple-500 to-pink-500' },
  { name: 'Loan', icon: Landmark, route: '/loan', color: 'from-emerald-500 to-teal-500' },
  { name: 'Pre-sale coin', icon: Coins, route: '/presale', badge: 2, color: 'from-orange-500 to-red-500' },
  { name: 'Liquidity Miner', icon: Users, route: '/arbitrage#staking', color: 'from-indigo-500 to-blue-500' },
  { name: 'AI Arbitrage', icon: Bot, route: '/arbitrage', color: 'from-pink-500 to-rose-500' },
];

const BANNERS: BannerItem[] = [
  {
    title: 'Liquidity Miner',
    description: 'Earn passive income',
    icon: Users,
    color: 'from-[#F0B90B] to-[#FCD535]',
    route: '/arbitrage#staking'
  },
  {
    title: 'Join AI Arbitrage',
    description: 'Automated trading',
    icon: Bot,
    color: 'from-[#F0B90B] to-[#FCD535]',
    route: '/arbitrage'
  }
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const { prices, loading: marketLoading } = useMarketData();
  
  // Use unified wallet for real data
  const {
    fundingBalances,
    tradingBalances,
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    refreshData: refreshWalletData,
    loading: walletLoading,
    balances // Legacy property (same as fundingBalances)
  } = useUnifiedWallet();
  
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Calculate real wallet balances using proper unified wallet structure
  const totalFundingBalance = useMemo(() => {
    // Use fundingBalances from the unified wallet hook
    const funding = balances || {}; // balances is the legacy property containing funding balances
    return Object.values(funding).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances]);

  const totalTradingBalance = useMemo(() => {
    // Use tradingBalances from unified wallet hook
    // tradingBalances is an object with { available, locked, total } for each asset
    let total = 0;
    Object.entries(tradingBalances || {}).forEach(([_, balance]) => {
      // Handle both simple number format and TradingBalance object format
      if (typeof balance === 'number') {
        total += balance;
      } else if (balance && typeof balance === 'object' && 'available' in balance) {
        total += (balance as { available: number }).available || 0;
      }
    });
    return total;
  }, [tradingBalances]);

  const totalLockedBalance = useMemo(() => {
    // Locked balances would come from the locks or locked balances
    let total = 0;
    Object.entries(tradingBalances || {}).forEach(([_, balance]) => {
      if (balance && typeof balance === 'object' && 'locked' in balance) {
        total += (balance as { locked: number }).locked || 0;
      }
    });
    return total;
  }, [tradingBalances]);

  // Real wallet balance - show actual USDT balance
  const usdtBalance = useMemo(() => {
    // Get USDT balance directly from funding wallet
    const usdtFunding = Number(balances?.USDT || 0);
    const result = usdtFunding + totalTradingBalance;
    console.log(' [Index] Balance calculation:', {
      usdtFunding,
      totalTradingBalance,
      totalLockedBalance,
      usdtBalance: result,
      rawBalances: balances,
      loading: walletLoading
    });
    return result;
  }, [balances, totalTradingBalance, walletLoading]);

  // Calculate total portfolio value using market prices
  const totalPortfolioValue = useMemo(() => {
    let total = 0;
    
    // Add funding balances
    Object.entries(balances || {}).forEach(([asset, balance]) => {
      const numBalance = Number(balance) || 0;
      if (numBalance <= 0) return;
      
      // Skip trading wallet entries (they shouldn't be in funding balances anyway)
      if (asset.includes('_TRADING')) return;
      
      // Get price for the asset
      let price = 1; // Default to 1 for USDT
      if (asset !== 'USDT' && prices && prices[asset]) {
        price = prices[asset];
      }
      
      total += numBalance * price;
    });
    
    // Add trading balances
    Object.entries(tradingBalances || {}).forEach(([asset, balance]) => {
      let numBalance = 0;
      
      // Handle both simple number format and TradingBalance object format
      if (typeof balance === 'number') {
        numBalance = balance;
      } else if (balance && typeof balance === 'object' && 'available' in balance) {
        numBalance = (balance as { available: number }).available || 0;
      }
      
      if (numBalance <= 0) return;
      
      // Get price for the asset
      let price = 1; // Default to 1 for USDT
      if (asset !== 'USDT' && prices && prices[asset]) {
        price = prices[asset];
      }
      
      total += numBalance * price;
    });
    
    return total;
  }, [balances, tradingBalances, prices]);

  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    totalUSDT: usdtBalance,
    totalUSD: totalPortfolioValue,
    totalFundingBalance,
    totalTradingBalance,
    totalLockedBalance,
    change24h: 5.67, // This would come from real data in production
    lastUpdated: new Date()
  });

  // Update wallet balance when context changes - use stable references
  const prevPricesRef = useRef<Record<string, number>>({});
  
  useEffect(() => {
    // Only update if prices actually changed
    const pricesChanged = JSON.stringify(prices) !== JSON.stringify(prevPricesRef.current);
    
    if (pricesChanged) {
      prevPricesRef.current = prices;
      
      setWalletBalance(prev => ({
        ...prev,
        totalUSDT: usdtBalance,
        totalUSD: totalPortfolioValue,
        totalFundingBalance,
        totalTradingBalance,
        totalLockedBalance
      }));
      
      console.log('💰 [Index] Balance updated:', {
        usdtBalance,
        totalPortfolioValue,
        totalFundingBalance,
        totalTradingBalance,
        totalLockedBalance
      });
    }
  }, [prices]);

  // Trending assets from ALL_ASSETS
  const trendingAssets: TrendingAsset[] = useMemo(() => {
    return Object.values(ALL_ASSETS)
      .filter(asset => asset.category === 'crypto')
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 3)
      .map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        price: prices?.[asset.symbol] || 0,
        change24h: `${(Math.random() - 0.5) * 10 > 0 ? '+' : ''}${Math.abs((Math.random() - 0.5) * 10).toFixed(2)}%`,
        volume: asset.category === 'crypto' ? `${(Math.random() * 1000).toFixed(0)}B` : `${(Math.random() * 100).toFixed(0)}M`,
        icon: asset.category === 'crypto' ? '₿' : asset.category === 'stock' ? '📈' : asset.category === 'commodity' ? '🥇' : '💎'
      }));
  }, [prices]);

  // Initialize watchlist with real data from ALL_ASSETS
  useEffect(() => {
    const watchlistData = Object.entries(ALL_ASSETS).map(([symbol, asset]) => {
      const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
      return {
        symbol,
        name: asset.name,
        volume: asset.category === 'crypto' ? `${(Math.random() * 100).toFixed(1)}B` : `${(Math.random() * 10).toFixed(1)}M`,
        price: price,
        usdPrice: price,
        change24h: (Math.random() - 0.5) * 10, // Random change between -5% and +5%
        icon: asset.category === 'crypto' ? '₿' : asset.category === 'stock' ? '📈' : asset.category === 'commodity' ? '🥇' : '💎',
        category: asset.category as any,
        high24h: price * (1 + (Math.random() - 0.5) * 0.1),
        low24h: price * (1 - (Math.random() - 0.5) * 0.1)
      };
    }).slice(0, 6); // Show first 6 assets

    setWatchlist(watchlistData);
  }, [prices]);

  // Market overview using ALL_ASSETS
  const marketOverview = useMemo(() => {
    const cryptoAssets = Object.values(ALL_ASSETS).filter(asset => asset.category === 'crypto' || asset.category === 'meme');
    const totalMarketCap = cryptoAssets.reduce((sum, asset) => sum + asset.marketCap, 0);
    
    return {
      totalMarketCap,
      totalAssets: cryptoAssets.length,
      activeAssets: cryptoAssets.filter(asset => prices?.[asset.baseAsset]).length
    };
  }, [prices]);

  // Initialize data on mount
  useEffect(() => {
    refreshWalletData();
  }, [refreshWalletData]);

  // Track scroll position for scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items with routes to AssetPage
  const bottomNavItems = [
    { icon: Home, label: 'Home', route: '/', active: true },
    { icon: LineChart, label: 'Markets', route: '/trading' },
    { icon: CreditCard, label: 'Trade', route: '/trading' },
    { icon: Wallet, label: 'Wallet', route: '/wallet' },
    { icon: User, label: 'Account', route: '/account' },
  ];

  // Format functions
  const formatNumber = (num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Refresh data using real wallet context
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWalletData();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshWalletData]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(item => ({
        ...item,
        price: item.price * (1 + (Math.random() - 0.5) * 0.001),
        change24h: item.change24h + (Math.random() - 0.5) * 0.1
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Recent activity data
  const recentActivity: ActivityItem[] = useMemo(() => {
    return Object.values(ALL_ASSETS)
      .filter(asset => prices?.[asset.baseAsset])
      .slice(0, 3)
      .map(asset => {
        const action = Math.random() > 0.5 ? 'Buy' : 'Sell';
        const amount = (Math.random() * 10).toFixed(4);
        const price = prices?.[asset.baseAsset] || 0;
        return {
          asset: asset.symbol,
          action,
          amount,
          value: `$${(parseFloat(amount) * price).toFixed(0)}`,
          time: `${Math.floor(Math.random() * 60) + 1} min ago`
        };
      });
  }, [prices]);

  // Quick actions
  const quickActions = useMemo(() => {
    const topAssets = Object.values(ALL_ASSETS)
      .filter(asset => asset.category === 'crypto')
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .slice(0, 4);

    return [
      { 
        icon: CreditCard, 
        label: 'Deposit', 
        color: '#0ECB81', 
        route: '/wallet' 
      },
      { 
        icon: Wallet, 
        label: 'Withdraw', 
        color: '#F0B90B', 
        route: '/wallet' 
      },
      { 
        icon: TrendingUp, 
        label: 'Trade', 
        color: '#F6465D', 
        route: `/trading/${topAssets[0]?.baseAsset || 'BTC'}` 
      },
      { 
        icon: Gift, 
        label: 'Rewards', 
        color: '#F0B90B', 
        route: '/rewards' 
      }
    ];
  }, []);

  // Loading state
  const isLoading = walletLoading || marketLoading;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] pb-24">
      {/* ===== HEADER ===== */}
      <div className="sticky top-0 z-50 bg-[#1E2329]/95 backdrop-blur-xl border-b border-[#2B3139]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#848E9C] text-xs">Welcome to</p>
              <div className="flex items-center space-x-2">
                <h1 className="text-[#EAECEF] text-xl font-bold">Kryvex</h1>
                <span className="bg-[#F0B90B] text-[#0B0E11] text-xs font-medium px-2 py-0.5 rounded">
                  TRADING
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Refresh Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="relative p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
                disabled={refreshing || isLoading}
              >
                <RefreshCw className={`h-5 w-5 text-[#848E9C] ${refreshing || isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              {/* Notifications */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="relative p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5 text-[#848E9C]" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B90B] rounded-full animate-pulse" />
                )}
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-[#848E9C]" />
                ) : (
                  <Menu className="h-5 w-5 text-[#848E9C]" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-end mt-1">
            <span className="text-[#5E6673] text-xs">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
          </div>
        </div>
      </div>

      {/* ===== NOTIFICATIONS DROPDOWN ===== */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-50 w-80 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-2xl"
          >
            <div className="p-4 border-b border-[#2B3139]">
              <div className="flex items-center justify-between">
                <h3 className="text-[#EAECEF] font-medium">Notifications</h3>
                <button className="text-[#F0B90B] text-sm hover:text-[#FCD535]">Mark all read</button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-[#2B3139] mx-auto mb-2" />
                  <p className="text-[#5E6673] text-sm">No new notifications</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className="p-4 border-b border-[#2B3139] hover:bg-[#2B3139]/50">
                    <p className="text-[#EAECEF] text-sm font-medium">{notif.title}</p>
                    <p className="text-[#848E9C] text-xs mt-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN CONTENT ===== */}
      <div className="px-4 space-y-6 py-4">
        {/* ===== TOTAL BALANCE CARD ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border border-[#2B3139] rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-[#F0B90B]/10 p-2 rounded-lg">
                <Wallet className="h-5 w-5 text-[#F0B90B]" />
              </div>
              <div>
                <span className="text-[#848E9C] text-sm">Total Balance</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[#5E6673] text-xs">USDT</span>
                  <span className="text-[#5E6673] text-xs">•</span>
                  <span className="text-[#5E6673] text-xs">Last 24h</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <Eye className={`h-4 w-4 ${showBalance ? 'text-[#F0B90B]' : 'text-[#5E6673]'}`} />
              </motion.button>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                walletBalance.change24h >= 0 ? 'bg-[#0ECB81]/10' : 'bg-[#F6465D]/10'
              }`}>
                {walletBalance.change24h >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-[#0ECB81]" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-[#F6465D]" />
                )}
                <span className={`text-xs font-medium ${
                  walletBalance.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                }`}>
                  {walletBalance.change24h >= 0 ? '+' : ''}{walletBalance.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-48 bg-[#2B3139]" />
                <Skeleton className="h-4 w-32 bg-[#2B3139]" />
              </>
            ) : showBalance ? (
              <>
                <div className="text-3xl font-bold text-[#EAECEF] font-mono">
                  {formatNumber(walletBalance.totalUSDT)} USDT
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[#848E9C] text-sm">
                    ≈ ${formatNumber(walletBalance.totalUSD)} USD
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-[#5E6673]" />
                    <span className="text-[#5E6673] text-xs">Live</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-[#EAECEF] font-mono">•••••••••</div>
                <div className="text-[#848E9C] text-sm">≈ $••••••••</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ===== QUICK STATS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { icon: DollarSign, label: 'Funding', value: formatCurrency(totalFundingBalance), tooltip: 'Available for deposits/withdrawals' },
            { icon: TrendingUp, label: 'Trading', value: formatCurrency(totalTradingBalance), tooltip: 'Available for trading' },
            { icon: Clock, label: 'Locked', value: formatCurrency(totalLockedBalance), tooltip: 'In open orders' },
            { icon: Globe, label: 'Pairs', value: '100+' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3 relative group"
                title={stat.tooltip}
              >
                <Icon className="h-4 w-4 text-[#F0B90B] mb-1" />
                <div className="text-[#EAECEF] text-sm font-bold">
                  {isLoading ? <Skeleton className="h-4 w-12" /> : stat.value}
                </div>
                <div className="text-[#848E9C] text-xs">{stat.label}</div>
                {stat.tooltip && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#2B3139] text-[#EAECEF] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {stat.tooltip}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ===== SERVICES GRID ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#EAECEF] text-sm font-medium">Quick Services</h2>
            <motion.button
              whileHover={{ x: 5 }}
              onClick={() => navigate('/services')}
              className="text-[#F0B90B] text-xs flex items-center hover:text-[#FCD535] transition-colors"
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </motion.button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setActiveService(service.name)}
                  onHoverEnd={() => setActiveService(null)}
                  onClick={() => navigate(service.route)}
                  className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B] transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F0B90B]/0 via-[#F0B90B]/5 to-[#F0B90B]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="flex flex-col items-start relative z-10">
                    <div className="relative">
                      <Icon className="h-5 w-5 text-[#848E9C] mb-2 group-hover:text-[#F0B90B] transition-colors" />
                      {service.badge && (
                        <span className="absolute -top-1 -right-1 bg-[#F0B90B] text-[#0B0E11] text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[#EAECEF] text-xs font-medium">{service.name}</span>
                    {service.isActive && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-[#F0B90B] rounded-full animate-pulse" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ===== BANNERS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          {BANNERS.map((banner, index) => {
            const Icon = banner.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(banner.route)}
                className="bg-gradient-to-r from-[#F0B90B] to-[#FCD535] rounded-xl p-4 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <div className="relative z-10">
                  <Icon className="h-6 w-6 text-[#0B0E11] mb-2" />
                  <h3 className="text-[#0B0E11] text-sm font-semibold">{banner.title}</h3>
                  <p className="text-[#0B0E11]/80 text-xs mt-1">{banner.description}</p>
                  <div className="flex items-center mt-2 text-[#0B0E11] text-xs font-medium">
                    See more <ChevronRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ===== WATCH LIST ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-[#EAECEF] text-sm font-medium">Watch List</h2>
              <span className="bg-[#F0B90B]/10 text-[#F0B90B] text-xs px-2 py-0.5 rounded">
                {watchlist.length} assets
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-[#2B3139] rounded-lg"
              >
                <Search className="h-4 w-4 text-[#5E6673]" />
              </motion.button>
              <motion.button
                whileHover={{ x: 5 }}
                onClick={() => navigate('/trading')}
                className="text-[#F0B90B] text-xs flex items-center hover:text-[#FCD535] transition-colors"
              >
                See All <ChevronRight className="h-3 w-3 ml-1" />
              </motion.button>
            </div>
          </div>

          <div className="space-y-3">
            {watchlist.map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 5 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => navigate(`/trading/${item.symbol.toLowerCase().replace('/', '')}`)}
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F0B90B] text-lg font-bold">{item.icon}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#EAECEF] text-sm font-medium">{item.symbol}</span>
                        <span className="text-[#848E9C] text-xs">{item.name}</span>
                      </div>
                      <div className="text-[#848E9C] text-xs mt-1">
                        Vol: {item.volume}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[#EAECEF] text-sm font-bold">
                      ${formatNumber(item.price)}
                    </div>
                    <div className={`flex items-center justify-end space-x-1 mt-1 ${
                      item.change24h >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'
                    }`}>
                      {item.change24h >= 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-1 bg-[#2B3139] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(item.change24h) * 5, 100)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full rounded-full ${
                      item.change24h >= 0 ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'
                    }`}
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ===== MARKET OVERVIEW SECTION ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-[#EAECEF] text-sm font-medium">Market Overview</h3>
              <span className="bg-[#F0B90B]/10 text-[#F0B90B] text-xs px-2 py-0.5 rounded">LIVE</span>
            </div>
            <TrendingUp className="h-4 w-4 text-[#F0B90B]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-[#2B3139]/30 rounded-lg p-3"
            >
              <div className="text-[#848E9C] text-xs mb-1">24h Volume</div>
              <div className="text-[#EAECEF] text-sm font-bold">$42.5B</div>
              <div className="flex items-center mt-1 text-[#0ECB81] text-xs">
                <ArrowUpRight className="h-3 w-3" />
                <span>+12.3%</span>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-[#2B3139]/30 rounded-lg p-3"
            >
              <div className="text-[#848E9C] text-xs mb-1">Active Pairs</div>
              <div className="text-[#EAECEF] text-sm font-bold">{marketOverview.activeAssets}</div>
              <div className="text-[#848E9C] text-xs mt-1">{marketOverview.totalAssets} total</div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-[#2B3139]/30 rounded-lg p-3"
            >
              <div className="text-[#848E9C] text-xs mb-1">Dominance</div>
              <div className="text-[#EAECEF] text-sm font-bold">BTC 52.3%</div>
              <div className="w-full bg-[#2B3139] h-1 rounded-full mt-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '52.3%' }}
                  transition={{ duration: 1, delay: 0.6 }}
                  className="bg-[#F0B90B] h-1 rounded-full"
                />
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-[#2B3139]/30 rounded-lg p-3"
            >
              <div className="text-[#848E9C] text-xs mb-1">Market Cap</div>
              <div className="text-[#EAECEF] text-sm font-bold">{formatCurrency(marketOverview.totalMarketCap)}</div>
            </motion.div>
          </div>

          {/* Market Cap Distribution */}
          <div className="mt-4 pt-4 border-t border-[#2B3139]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#848E9C] text-xs">Market Cap Distribution</span>
              <span className="text-[#EAECEF] text-xs font-medium">{formatCurrency(marketOverview.totalMarketCap)}</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '52%' }}
                transition={{ duration: 1, delay: 0.7 }}
                className="bg-[#F0B90B] h-full"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '28%' }}
                transition={{ duration: 1, delay: 0.8 }}
                className="bg-[#0ECB81] h-full"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '20%' }}
                transition={{ duration: 1, delay: 0.9 }}
                className="bg-[#F6465D] h-full"
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#848E9C]">
              <span>BTC 52%</span>
              <span>ETH 28%</span>
              <span>Others 20%</span>
            </div>
          </div>
        </motion.div>

        {/* ===== TRENDING ASSETS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4 text-[#F0B90B]" />
              <h3 className="text-[#EAECEF] text-sm font-medium">Trending</h3>
            </div>
            <motion.button
              whileHover={{ x: 5 }}
              className="text-[#F0B90B] text-xs flex items-center"
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </motion.button>
          </div>

          <div className="space-y-2">
            {trendingAssets.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01, x: 5 }}
                className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
                    <Flame className="h-4 w-4 text-[#F0B90B]" />
                  </div>
                  <div>
                    <span className="text-[#EAECEF] text-sm font-medium">{item.name}</span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[#848E9C] text-xs">Vol: {item.volume}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[#EAECEF] text-sm font-bold">${item.price.toFixed(item.price < 0.01 ? 8 : 2)}</span>
                  <div className="text-[#0ECB81] text-xs font-medium">{item.change24h}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== RECENT ACTIVITY ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-[#F0B90B]" />
              <h3 className="text-[#EAECEF] text-sm font-medium">Recent Activity</h3>
            </div>
            <span className="text-[#848E9C] text-xs">Live updates</span>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.action === 'Buy' ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'
                  }`} />
                  <div>
                    <span className="text-[#EAECEF] text-xs font-medium">
                      {activity.action} {activity.asset}
                    </span>
                    <div className="text-[#848E9C] text-[10px]">{activity.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[#EAECEF] text-xs">{activity.amount}</span>
                  <div className="text-[#848E9C] text-[10px]">{activity.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ===== QUICK ACTIONS ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="grid grid-cols-4 gap-2"
        >
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.route)}
                className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3 flex flex-col items-center"
              >
                <Icon className="h-5 w-5 mb-1" style={{ color: action.color }} />
                <span className="text-[#EAECEF] text-xs">{action.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        {/* ===== NEWS & UPDATES ===== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#F0B90B]" />
              <h3 className="text-[#EAECEF] text-sm font-medium">Announcements</h3>
            </div>
            <span className="bg-[#F0B90B]/10 text-[#F0B90B] text-xs px-2 py-0.5 rounded">NEW</span>
          </div>

          <div className="space-y-3">
            {[
              { title: 'New listing: PEPE/USDT', desc: 'Trading starts in 2h', icon: Star },
              { title: 'Reduced fees on SOL', desc: '50% discount for 7 days', icon: Zap },
              { title: 'Staking rewards boost', desc: 'Up to 15% APY', icon: Award },
            ].map((news, index) => {
              const Icon = news.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-[#2B3139] transition-colors cursor-pointer"
                >
                  <div className="bg-[#F0B90B]/10 p-2 rounded-lg">
                    <Icon className="h-4 w-4 text-[#F0B90B]" />
                  </div>
                  <div>
                    <h4 className="text-[#EAECEF] text-xs font-medium">{news.title}</h4>
                    <p className="text-[#848E9C] text-[10px] mt-0.5">{news.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ===== BOTTOM NAVIGATION ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E2329] border-t border-[#2B3139] px-2 pb-2">
        <div className="grid grid-cols-5 gap-1">
          {bottomNavItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.route;
            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(item.route)}
                className={`flex flex-col items-center py-3 rounded-xl transition-all relative ${
                  isActive 
                    ? 'text-[#F0B90B]' 
                    : 'text-[#5E6673] hover:text-[#848E9C]'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-[#F0B90B]' : ''}`} />
                <span className={`text-xs mt-1 ${isActive ? 'text-[#F0B90B] font-medium' : 'text-[#5E6673]'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 w-1 h-1 bg-[#F0B90B] rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 500, damping: 30 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/trading')}
        className="fixed right-4 bottom-24 z-50 bg-[#F0B90B] text-[#0B0E11] p-4 rounded-full shadow-lg shadow-[#F0B90B]/20 hover:bg-[#FCD535] transition-colors"
      >
        <Rocket className="h-6 w-6" />
      </motion.button>

      {/* ===== MOBILE MENU ===== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed inset-0 z-40 bg-[#0B0E11] pt-16"
          >
            <div className="p-4 space-y-4">
              {[
                { icon: Settings, label: 'Settings', badge: null },
                { icon: Shield, label: 'Security', badge: null },
                { icon: Award, label: 'Rewards', badge: '2 new' },
                { icon: Gift, label: 'Referrals', badge: null },
                { icon: Star, label: 'Favorites', badge: null },
                { icon: Sparkles, label: 'New Features', badge: '3' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 5 }}
                    className="w-full flex items-center justify-between p-4 bg-[#1E2329] rounded-xl border border-[#2B3139]"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-[#F0B90B]" />
                      <span className="text-[#EAECEF]">{item.label}</span>
                    </div>
                    {item.badge ? (
                      <span className="bg-[#F0B90B] text-[#0B0E11] text-xs px-2 py-1 rounded">
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#5E6673]" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== BOTTOM SHEET ===== */}
      <AnimatePresence>
        {activeService && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E2329] border-t border-[#2B3139] rounded-t-2xl p-4"
          >
            <div className="w-12 h-1 bg-[#2B3139] rounded-full mx-auto mb-4" />
            <h3 className="text-[#EAECEF] font-medium mb-2">{activeService}</h3>
            <p className="text-[#848E9C] text-sm mb-4">Quick actions and information</p>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-[#F0B90B] text-[#0B0E11] py-3 rounded-xl font-medium">
                Get Started
              </button>
              <button className="bg-[#2B3139] text-[#EAECEF] py-3 rounded-xl font-medium">
                Learn More
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== LOADING STATES ===== */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="bg-[#1E2329] rounded-2xl p-6 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#F0B90B] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[#EAECEF]">Loading your portfolio...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REFRESH INDICATOR ===== */}
      <AnimatePresence>
        {refreshing && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E2329] border border-[#2B3139] rounded-full px-4 py-2 flex items-center space-x-2 shadow-lg"
          >
            <RefreshCw className="h-4 w-4 text-[#F0B90B] animate-spin" />
            <span className="text-[#EAECEF] text-sm">Refreshing data...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== NETWORK STATUS ===== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-20 right-4 z-40 bg-[#1E2329] border border-[#2B3139] rounded-full px-3 py-1.5 flex items-center space-x-2 shadow-lg"
      >
        <div className="w-2 h-2 bg-[#0ECB81] rounded-full animate-pulse" />
        <span className="text-[#EAECEF] text-xs">Network Connected</span>
      </motion.div>

      {/* ===== SCROLL TO TOP BUTTON ===== */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed left-4 bottom-24 z-50 bg-[#F0B90B] text-[#0B0E11] p-3 rounded-full shadow-lg shadow-[#F0B90B]/20"
          >
            <ArrowUpRight className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== KEYBOARD SHORTCUTS HELPER ===== */}
      <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-40 bg-[#1E2329]/90 backdrop-blur-sm border border-[#2B3139] rounded-full px-4 py-2 hidden md:flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <kbd className="bg-[#2B3139] text-[#EAECEF] px-2 py-1 rounded text-xs">⌘K</kbd>
          <span className="text-[#848E9C] text-xs">Search</span>
        </div>
        <div className="flex items-center space-x-2">
          <kbd className="bg-[#2B3139] text-[#EAECEF] px-2 py-1 rounded text-xs">⌘R</kbd>
          <span className="text-[#848E9C] text-xs">Refresh</span>
        </div>
      </div>
    </div>
  );
}