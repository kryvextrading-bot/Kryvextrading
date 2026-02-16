import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MoreVertical,
  Activity,
  DollarSign,
  Clock,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useMarketData } from '@/contexts/MarketDataContext';

// Types
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

interface ServiceItem {
  name: string;
  icon: any;
  route: string;
  badge?: number;
  isActive?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}

export default function Index() {
  const navigate = useNavigate();
  const { getBalance, getTotalBalance, refreshBalance, loading: walletLoading } = useWallet();
  const { prices } = useMarketData();
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Real wallet balance from context
  const usdtBalance = getTotalBalance('USDT');
  const totalPortfolioValue = Object.keys(prices || {}).reduce((total, asset) => {
    const balance = getTotalBalance(asset);
    const price = prices?.[asset] || 0;
    return total + (balance * price);
  }, 0);

  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    totalUSDT: usdtBalance,
    totalUSD: totalPortfolioValue,
    change24h: 0.32,
    lastUpdated: new Date()
  });

  // Update wallet balance when context changes
  useEffect(() => {
    setWalletBalance(prev => ({
      ...prev,
      totalUSDT: usdtBalance,
      totalUSD: totalPortfolioValue,
      lastUpdated: new Date()
    }));
  }, [usdtBalance, totalPortfolioValue]);

  // Services with real routing based on existing routes
  const services: ServiceItem[] = [
    { name: 'Quant Trading', icon: BarChart3, route: '/trading', badge: 3 },
    { name: 'Node Stacking', icon: Zap, route: '/portfolio', isActive: true },
    { name: 'Loan', icon: Landmark, route: '/loan' },
    { name: 'Pre-sale coin', icon: Coins, route: '/quick-access', badge: 2 },
    { name: 'Liquidity Miner', icon: Users, route: '/portfolio' },
    { name: 'AI Arbitrage', icon: Bot, route: '/arbitrage' }
  ];

  // Real-time watchlist data with 15 diverse assets
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
    { 
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      volume: '25.8B',
      price: 68699.89,
      usdPrice: 68699.89,
      change24h: 0.57,
      icon: '₿',
      category: 'crypto',
      high24h: 69234.12,
      low24h: 67890.45
    },
    { 
      symbol: 'ETH/USDT',
      name: 'Ethereum',
      volume: '12.5B',
      price: 3499.44,
      usdPrice: 3499.44,
      change24h: -1.87,
      icon: 'Ξ',
      category: 'crypto',
      high24h: 3567.89,
      low24h: 3456.78
    },
    { 
      symbol: 'BNB/USDT',
      name: 'Binance Coin',
      volume: '3.2B',
      price: 567.23,
      usdPrice: 567.23,
      change24h: 1.23,
      icon: 'BNB',
      category: 'crypto',
      high24h: 572.45,
      low24h: 560.12
    },
    { 
      symbol: 'SOL/USDT',
      name: 'Solana',
      volume: '2.8B',
      price: 142.56,
      usdPrice: 142.56,
      change24h: 3.45,
      icon: 'SOL',
      category: 'crypto',
      high24h: 145.67,
      low24h: 138.90
    },
    { 
      symbol: 'AAPL',
      name: 'Apple Inc.',
      volume: '52.3M',
      price: 189.84,
      usdPrice: 189.84,
      change24h: 1.23,
      icon: '🍎',
      category: 'stock',
      high24h: 192.45,
      low24h: 187.90
    },
    { 
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      volume: '98.7M',
      price: 238.45,
      usdPrice: 238.45,
      change24h: -2.34,
      icon: '🚗',
      category: 'stock',
      high24h: 245.67,
      low24h: 236.78
    },
    { 
      symbol: 'EUR/USD',
      name: 'Euro/US Dollar',
      volume: '89.1M',
      price: 1.0892,
      usdPrice: 1.0892,
      change24h: -0.15,
      icon: '💶',
      category: 'forex',
      high24h: 1.0923,
      low24h: 1.0876
    },
    { 
      symbol: 'GBP/USD',
      name: 'British Pound/US Dollar',
      volume: '45.6M',
      price: 1.2745,
      usdPrice: 1.2745,
      change24h: 0.28,
      icon: '💷',
      category: 'forex',
      high24h: 1.2789,
      low24h: 1.2712
    },
    { 
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      volume: '78.4M',
      price: 478.92,
      usdPrice: 478.92,
      change24h: 0.89,
      icon: '📊',
      category: 'etf',
      high24h: 482.34,
      low24h: 476.78
    },
    { 
      symbol: 'QQQ',
      name: 'NASDAQ 100 ETF',
      volume: '42.1M',
      price: 389.45,
      usdPrice: 389.45,
      change24h: 1.12,
      icon: '📈',
      category: 'etf',
      high24h: 392.67,
      low24h: 387.89
    },
    { 
      symbol: 'BTC-PERP',
      name: 'Bitcoin Perpetual',
      volume: '45.6B',
      price: 68701.25,
      usdPrice: 68701.25,
      change24h: -0.52,
      icon: '⚡',
      category: 'futures',
      high24h: 69456.78,
      low24h: 67890.12
    },
    { 
      symbol: 'ETH-PERP',
      name: 'Ethereum Perpetual',
      volume: '23.4B',
      price: 3501.67,
      usdPrice: 3501.67,
      change24h: -1.78,
      icon: '⚡',
      category: 'futures',
      high24h: 3567.89,
      low24h: 3478.90
    },
    { 
      symbol: 'GOLD',
      name: 'Gold Spot',
      volume: '12.3M',
      price: 2034.56,
      usdPrice: 2034.56,
      change24h: 0.45,
      icon: '🥇',
      category: 'commodity',
      high24h: 2045.67,
      low24h: 2028.90
    },
    { 
      symbol: 'OIL',
      name: 'Crude Oil',
      volume: '8.7M',
      price: 78.45,
      usdPrice: 78.45,
      change24h: -1.23,
      icon: '🛢️',
      category: 'commodity',
      high24h: 79.67,
      low24h: 77.89
    },
    { 
      symbol: 'ADA/USDT',
      name: 'Cardano',
      volume: '1.2B',
      price: 0.584,
      usdPrice: 0.584,
      change24h: 2.67,
      icon: 'ADA',
      category: 'crypto',
      high24h: 0.598,
      low24h: 0.567
    }
  ]);

  // Navigation items with existing routes
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
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await refreshBalance();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#1E2329]/95 backdrop-blur-lg border-b border-[#2B3139]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs">Welcome back,</p>
              <div className="flex items-center space-x-2">
                <h1 className="text-[#EAECEF] text-xl font-semibold">Kryvextrading</h1>
                <span className="text-gray-600 text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                  ID: 1124
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button 
                onClick={refreshData}
                className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
                disabled={refreshing || walletLoading}
              >
                <RefreshCw className={`h-5 w-5 text-[#848E9C] ${refreshing || walletLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications */}
              <button 
                className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5 text-[#848E9C]" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#F0B90B] rounded-full"></span>
                )}
              </button>

              {/* Settings */}
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Settings className="h-5 w-5 text-[#848E9C]" />
              </button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-end mt-1">
            <span className="text-gray-600 text-xs">
              Updated {formatTimeAgo(lastRefresh)}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute top-16 right-4 z-50 w-80 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-2xl">
          <div className="p-4 border-b border-[#2B3139]">
            <div className="flex items-center justify-between">
              <h3 className="text-[#EAECEF] font-medium">Notifications</h3>
              <button className="text-[#F0B90B] text-sm">Mark all read</button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-[#848E9C] mx-auto mb-2" />
                <p className="text-[#848E9C] text-sm">No new notifications</p>
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
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 space-y-6 py-4">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border border-[#373A40] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-[#F0B90B]/10 p-2 rounded-lg">
                <Wallet className="h-5 w-5 text-[#F0B90B]" />
              </div>
              <div>
                <span className="text-[#848E9C] text-sm">Total Balance</span>
                <div className="flex items-center space-x-2">
                  <span className="text-[#848E9C] text-xs">USDT</span>
                  <span className="text-[#848E9C] text-xs">•</span>
                  <span className="text-[#848E9C] text-xs">Last 24h</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <Eye className={`h-4 w-4 ${showBalance ? 'text-[#F0B90B]' : 'text-[#848E9C]'}`} />
              </button>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
                walletBalance.change24h >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                {walletBalance.change24h >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  walletBalance.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {walletBalance.change24h >= 0 ? '+' : ''}{walletBalance.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {showBalance ? (
              <>
                <div className="text-3xl font-bold text-[#EAECEF]">
                  {formatNumber(walletBalance.totalUSDT)} USDT
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[#848E9C] text-sm">
                    ≈ ${formatNumber(walletBalance.totalUSD)} USD
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-[#848E9C]" />
                    <span className="text-[#848E9C] text-xs">Live</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl font-bold text-[#EAECEF]">••••••••</div>
                <div className="text-[#848E9C] text-sm">≈ $••••••••</div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3">
            <DollarSign className="h-4 w-4 text-[#F0B90B] mb-1" />
            <div className="text-[#EAECEF] text-sm font-bold">0.1%</div>
            <div className="text-[#848E9C] text-xs">Maker Fee</div>
          </div>
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3">
            <Clock className="h-4 w-4 text-[#F0B90B] mb-1" />
            <div className="text-[#EAECEF] text-sm font-bold">24/7</div>
            <div className="text-[#848E9C] text-xs">Support</div>
          </div>
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3">
            <Zap className="h-4 w-4 text-[#F0B90B] mb-1" />
            <div className="text-[#EAECEF] text-sm font-bold">~1s</div>
            <div className="text-[#848E9C] text-xs">Execution</div>
          </div>
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-3">
            <Globe className="h-4 w-4 text-[#F0B90B] mb-1" />
            <div className="text-[#EAECEF] text-sm font-bold">100+</div>
            <div className="text-[#848E9C] text-xs">Pairs</div>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#EAECEF] text-sm font-medium">Quick Services</h2>
            <button 
              onClick={() => navigate('/portfolio')}
              className="text-[#F0B90B] text-xs flex items-center hover:text-[#F0B90B]/80"
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={() => navigate(service.route)}
                className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 hover:bg-[#2B3139] hover:border-[#F0B90B]/50 transition-all group relative"
              >
                <div className="flex flex-col items-start">
                  <div className="relative">
                    <service.icon className="h-5 w-5 text-[#848E9C] mb-2 group-hover:text-[#F0B90B] transition-colors" />
                    {service.badge && (
                      <span className="absolute -top-1 -right-1 bg-[#F0B90B] text-[#0B0E11] text-xs rounded-full h-3.5 w-3.5 flex items-center justify-center">
                        {service.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[#EAECEF] text-xs font-medium">{service.name}</span>
                  {service.isActive && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#F0B90B] rounded-full"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Watch List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <h2 className="text-[#EAECEF] text-sm font-medium">Watch List</h2>
              <span className="bg-[#F0B90B]/10 text-[#F0B90B] text-xs px-2 py-0.5 rounded-full">
                {watchlist.length} assets
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-[#2B3139] rounded-lg">
                <Search className="h-4 w-4 text-[#848E9C]" />
              </button>
              <button 
                onClick={() => navigate('/trading')}
                className="text-[#F0B90B] text-xs flex items-center hover:text-[#F0B90B]/80"
              >
                See All <ChevronRight className="h-3 w-3 ml-1" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {watchlist.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(`/trading?pair=${item.symbol}`)}
                className="w-full bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 hover:bg-[#2B3139] hover:border-[#F0B90B]/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-full flex items-center justify-center">
                      <span className="text-[#F0B90B] text-sm font-bold">{item.icon}</span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-[#EAECEF] text-sm font-medium">{item.symbol}</span>
                        <span className="text-[#848E9C] text-xs">{item.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[#848E9C] text-xs">Vol: {item.volume}</span>
                        <span className="w-1 h-1 bg-[#373A40] rounded-full"></span>
                        <span className="text-[#848E9C] text-xs">H: ${formatLargeNumber(item.high24h)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#EAECEF] text-sm font-bold">
                        ${formatNumber(item.price)}
                      </span>
                      <div className={`flex items-center ${
                        item.change24h >= 0 ? 'text-green-500' : 'text-red-500'
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
                    <span className="text-[#848E9C] text-xs block mt-0.5">
                      ≈ ${formatNumber(item.usdPrice)}
                    </span>
                  </div>
                </div>

                {/* Mini Chart (Visual indicator) */}
                <div className="flex items-center space-x-1 mt-2">
                  <div className={`h-1 w-full rounded-full bg-[#373A40]`}>
                    <div 
                      className={`h-1 rounded-full ${item.change24h >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(item.change24h) * 20, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Market Overview */}
        <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[#EAECEF] text-sm font-medium">Market Overview</h3>
            <TrendingUp className="h-4 w-4 text-[#F0B90B]" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[#848E9C] text-xs mb-1">24h Volume</div>
              <div className="text-[#EAECEF] text-sm font-bold">$42.5B</div>
            </div>
            <div>
              <div className="text-[#848E9C] text-xs mb-1">Active Pairs</div>
              <div className="text-[#EAECEF] text-sm font-bold">156</div>
            </div>
            <div>
              <div className="text-[#848E9C] text-xs mb-1">Dominance</div>
              <div className="text-[#EAECEF] text-sm font-bold">BTC 52.3%</div>
            </div>
            <div>
              <div className="text-[#848E9C] text-xs mb-1">Gas Fee</div>
              <div className="flex items-center space-x-1">
                <span className="text-[#EAECEF] text-sm font-bold">23 Gwei</span>
                <span className="text-green-500 text-xs">↓12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E2329] border-t border-[#2B3139] px-2 pb-2">
        <div className="grid grid-cols-5 gap-1">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                item.active 
                  ? 'text-[#F0B90B]' 
                  : 'text-[#848E9C] hover:text-[#EAECEF]'
              }`}
            >
              <item.icon className={`h-5 w-5 ${item.active ? 'text-[#F0B90B]' : ''}`} />
              <span className={`text-xs mt-1 ${item.active ? 'text-[#F0B90B] font-medium' : 'text-[#848E9C]'}`}>
                {item.label}
              </span>
              {item.active && (
                <span className="absolute bottom-0 w-1 h-1 bg-[#F0B90B] rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Quick Trade */}
      <button 
        onClick={() => navigate('/trading')}
        className="fixed right-4 bottom-24 z-50 bg-[#F0B90B] text-[#0B0E11] p-4 rounded-full shadow-lg shadow-[#F0B90B]/20 hover:bg-[#F0B90B]/90 transition-colors"
      >
        <CreditCard className="h-6 w-6" />
      </button>
    </div>
  );
}