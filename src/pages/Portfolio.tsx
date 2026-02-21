import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from '@/components/icons/TrendingUp';
import {
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Clock,
  RefreshCw,
  ChevronRight,
  Wallet,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Activity,
  Award,
  Target,
  AlertTriangle,
  Zap,
  Gauge,
  Sparkles,
  Crown,
  History,
  Download,
  Filter,
  Calendar,
  ArrowLeftRight,
  LineChart,
  Info,
  Copy,
  ExternalLink,
  Grid,
  List,
  BookOpen,
  Rocket,
  Gift,
  Share2,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useUnifiedTrading } from '@/hooks/useUnifiedTrading';
import { useToast, toast } from '@/hooks/use-toast';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useMarketData } from '@/contexts/MarketDataContext';
import { walletApiService } from '@/services/wallet-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import PortfolioValueChart from '@/components/PortfolioValueChart';
import AssetAllocationPieChart from '@/components/AssetAllocationPieChart';
import { formatCurrency, formatPrice, formatPercentage } from '@/utils/tradingCalculations';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================
interface PortfolioAsset {
  symbol: string;
  name: string;
  balance: number;
  locked: number;
  value: number;
  price: number;
  change24h: number;
  allocation: number;
  pnl?: number;
  pnlPercentage?: number;
  buyPrice?: number;
}

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  isPositive: boolean;
  icon: React.ReactNode;
  tooltip: string;
}

interface PeriodReturn {
  period: string;
  value: number;
  percentage: number;
  isPositive: boolean;
}

interface TradingActivity {
  id: string;
  type: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  asset: string;
  amount: number;
  pnl?: number;
  status: string;
  timestamp: string;
  metadata?: any;
}

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// ==================== COMPONENTS ====================

// Metric Card Component
const MetricCard = ({ title, value, change, icon, tooltip, color = 'default', loading = false }: any) => {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
        <Skeleton className="h-4 w-24 mb-2 bg-[#2B3139]" />
        <Skeleton className="h-8 w-32 bg-[#2B3139]" />
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all group h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                      {icon}
                    </div>
                    <span className="text-xs text-[#848E9C] truncate">{title}</span>
                  </div>
                  {change !== undefined && (
                    <Badge className={`${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-0 ml-1 shrink-0`}>
                      {isPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                      {Math.abs(change).toFixed(2)}%
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 mt-auto">
                  <div className="text-xl font-bold text-[#EAECEF] font-mono break-words">{value}</div>
                  {tooltip && <div className="text-xs text-[#848E9C] truncate">{tooltip}</div>}
                </div>
              </div>
            </Card>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Asset Allocation Item
const AllocationItem = ({ asset, index, hideBalances }: { asset: PortfolioAsset; index: number; hideBalances: boolean }) => {
  const colors = ['#F0B90B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#6366F1'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 border-b border-[#2B3139] last:border-0 hover:bg-[#23262F]/50 transition-colors px-2 rounded-lg"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${colors[index % colors.length]}20`, color: colors[index % colors.length] }}
        >
          {asset.symbol.charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-[#EAECEF] truncate">{asset.name}</div>
          <div className="text-xs text-[#848E9C] truncate">{asset.symbol}</div>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <div className="text-sm font-medium text-[#EAECEF]">{asset.allocation.toFixed(1)}%</div>
        <div className="text-xs text-[#848E9C]">{hideBalances ? '••••' : `$${asset.value.toFixed(2)}`}</div>
        {asset.pnl !== undefined && (
          <div className={`text-xs ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {asset.pnl >= 0 ? '+' : ''}{asset.pnl.toFixed(2)} ({asset.pnlPercentage?.toFixed(1)}%)
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Holdings Table (Mobile optimized with horizontal scroll and compact view)
const HoldingsTable = ({ assets, hideBalances }: { assets: PortfolioAsset[]; hideBalances: boolean }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (symbol: string) => {
    setExpandedRows(prev => ({ ...prev, [symbol]: !prev[symbol] }));
  };

  return (
    <div className="-mx-4 sm:mx-0">
      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#848E9C] border-b border-[#2B3139]">
              <th className="text-left py-3 font-medium pl-2">Asset</th>
              <th className="text-right py-3 font-medium">Balance</th>
              <th className="text-right py-3 font-medium">Locked</th>
              <th className="text-right py-3 font-medium">Price</th>
              <th className="text-right py-3 font-medium">Value</th>
              <th className="text-right py-3 font-medium">Allocation</th>
              <th className="text-right py-3 font-medium">24h</th>
              <th className="text-right py-3 font-medium pr-2">P&L</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <motion.tr
                key={asset.symbol}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-[#2B3139] hover:bg-[#23262F] transition-colors"
              >
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center text-sm shrink-0">
                      {asset.symbol.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[#EAECEF] truncate">{asset.symbol}</div>
                      <div className="text-xs text-[#848E9C] truncate">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right font-mono text-[#EAECEF]">
                  {hideBalances ? '••••••' : asset.balance.toFixed(6)}
                </td>
                <td className="text-right font-mono text-[#F0B90B]">
                  {hideBalances ? '••••••' : asset.locked.toFixed(6)}
                </td>
                <td className="text-right font-mono text-[#EAECEF]">
                  ${asset.price.toFixed(2)}
                </td>
                <td className="text-right font-mono text-[#EAECEF]">
                  ${asset.value.toFixed(2)}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-[#2B3139] rounded-full h-1.5 hidden lg:block">
                      <div
                        className="bg-[#F0B90B] h-1.5 rounded-full"
                        style={{ width: `${asset.allocation}%` }}
                      />
                    </div>
                    <span className="text-[#EAECEF] text-xs">{asset.allocation.toFixed(1)}%</span>
                  </div>
                </td>
                <td className="text-right">
                  <Badge className={asset.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </Badge>
                </td>
                <td className="text-right pr-2">
                  {asset.pnl !== undefined && (
                    <span className={`font-mono ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {assets.map((asset, index) => (
          <motion.div
            key={asset.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1E2329] border border-[#2B3139] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2B3139] flex items-center justify-center text-sm font-bold shrink-0">
                  {asset.symbol.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-[#EAECEF]">{asset.symbol}</div>
                  <div className="text-xs text-[#848E9C]">{asset.name}</div>
                </div>
              </div>
              <Badge className={asset.change24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[#848E9C]">Balance</div>
                <div className="font-mono text-[#EAECEF]">{hideBalances ? '••••' : asset.balance.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Locked</div>
                <div className="font-mono text-[#F0B90B]">{hideBalances ? '••••' : asset.locked.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Price</div>
                <div className="font-mono text-[#EAECEF]">${asset.price.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Value</div>
                <div className="font-mono text-[#EAECEF]">${asset.value.toFixed(2)}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <div className="text-xs text-[#848E9C]">Allocation</div>
                <div className="flex-1 h-1.5 bg-[#2B3139] rounded-full max-w-[100px]">
                  <div className="bg-[#F0B90B] h-1.5 rounded-full" style={{ width: `${asset.allocation}%` }} />
                </div>
                <span className="text-xs text-[#EAECEF]">{asset.allocation.toFixed(1)}%</span>
              </div>
              {asset.pnl !== undefined && (
                <div className={`text-xs font-mono ${asset.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  P&L: {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toFixed(2)}
                </div>
              )}
            </div>

            <button
              onClick={() => toggleRow(asset.symbol)}
              className="mt-2 w-full text-xs text-[#F0B90B] flex items-center justify-center gap-1 py-1 border-t border-[#2B3139] pt-2"
            >
              {expandedRows[asset.symbol] ? 'Show less' : 'Details'}
              <ChevronRight size={12} className={`transition-transform ${expandedRows[asset.symbol] ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {expandedRows[asset.symbol] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-[#2B3139] text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[#848E9C]">24h High/Low</span>
                      <span className="text-[#EAECEF]">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#848E9C]">Volume (24h)</span>
                      <span className="text-[#EAECEF]">--</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#848E9C]">Market Cap</span>
                      <span className="text-[#EAECEF]">--</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Transaction Item Component
const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isPositive = transaction.amount > 0;
  const Icon = transaction.type === 'Deposit' ? ArrowDownLeft : 
               transaction.type === 'Withdrawal' ? ArrowUpRight : 
               transaction.type === 'Swap' ? RefreshCw :
               transaction.type === 'Trade' ? TrendingUp : Clock;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500/15 text-green-400 border-green-500/20';
      case 'Pending': return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20';
      case 'Processing': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'Failed': return 'bg-red-500/15 text-red-400 border-red-500/20';
      case 'Cancelled': return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-green-500/15 text-green-400';
      case 'Withdrawal': return 'bg-red-500/15 text-red-400';
      case 'Swap': return 'bg-blue-500/15 text-blue-400';
      case 'Trade': return 'bg-purple-500/15 text-purple-400';
      case 'Options': return 'bg-orange-500/15 text-orange-400';
      case 'Staking': return 'bg-yellow-500/15 text-yellow-400';
      default: return 'bg-gray-500/15 text-gray-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-3 border-b border-[#2B3139]/50 last:border-0 hover:bg-[#23262F]/50 transition-colors px-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", getTypeColor(transaction.type))}>
          <Icon size={14} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#EAECEF]">{transaction.type}</span>
            {transaction.metadata?.shouldWin && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[8px] px-1 py-0">
                <Crown className="w-2 h-2 mr-0.5" />
                FW
              </Badge>
            )}
          </div>
          <div className="text-xs text-[#848E9C]">{transaction.asset}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("text-sm font-medium", isPositive ? 'text-green-400' : 'text-red-400')}>
          {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)} {transaction.asset}
        </div>
        {transaction.pnl !== undefined && transaction.pnl !== 0 && (
          <div className={cn("text-xs", transaction.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
            {transaction.pnl >= 0 ? '+' : ''}{transaction.pnl.toFixed(2)} USDT
          </div>
        )}
        <Badge className={cn("text-[10px] mt-1", getStatusColor(transaction.status))}>
          {transaction.status}
        </Badge>
      </div>
    </motion.div>
  );
};

// Activity Item Component
const ActivityItem = ({ activity }: { activity: TradingActivity }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'spot': return <BarChart3 size={14} className="text-blue-400" />;
      case 'futures': return <Gauge size={14} className="text-purple-400" />;
      case 'options': return <Target size={14} className="text-green-400" />;
      case 'arbitrage': return <Zap size={14} className="text-yellow-400" />;
      case 'staking': return <Shield size={14} className="text-emerald-400" />;
      default: return <Activity size={14} className="text-[#F0B90B]" />;
    }
  };

  const getColor = () => {
    switch (activity.type) {
      case 'spot': return 'bg-blue-500/20';
      case 'futures': return 'bg-purple-500/20';
      case 'options': return 'bg-green-500/20';
      case 'arbitrage': return 'bg-yellow-500/20';
      case 'staking': return 'bg-emerald-500/20';
      default: return 'bg-[#F0B90B]/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'win':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
      case 'processing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'active':
      case 'open':
        return 'bg-blue-500/20 text-blue-400';
      case 'failed':
      case 'loss':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between py-3 border-b border-[#2B3139] last:border-0 hover:bg-[#23262F]/50 transition-colors px-2 rounded-lg"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={`w-8 h-8 rounded-lg ${getColor()} flex items-center justify-center shrink-0`}>
          {getIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#EAECEF] capitalize">{activity.type}</span>
            <Badge className={getStatusColor(activity.status)}>
              {activity.status}
            </Badge>
          </div>
          <div className="text-xs text-[#848E9C] truncate">{activity.asset}</div>
        </div>
      </div>
      <div className="text-right ml-4 shrink-0">
        <div className="text-sm font-medium text-[#EAECEF]">${activity.amount.toFixed(2)}</div>
        {activity.pnl !== undefined && (
          <div className={`text-xs ${activity.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {activity.pnl >= 0 ? '+' : ''}{activity.pnl.toFixed(2)} USDT
          </div>
        )}
        <div className="text-xs text-[#848E9C] whitespace-nowrap">
          {new Date(activity.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, subValue, icon, color = 'default' }: any) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all h-full">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <span className="text-sm text-[#848E9C] truncate">{title}</span>
    </div>
    <div className="text-xl font-bold text-[#EAECEF] font-mono break-words">{value}</div>
    {subValue && <div className="text-xs text-[#848E9C] mt-1 truncate">{subValue}</div>}
  </Card>
);

// ==================== MAIN COMPONENT ====================
export default function Portfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Hooks
  const { portfolio: walletPortfolio, totalValue, valueHistory, transactions } = useWallet();
  const {
    fundingBalances,
    tradingBalances,
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    stats,
    locks,
    refreshData,
    loading: walletLoading
  } = useUnifiedWallet();

  const {
    getUserTrades,
    getUserPositions,
    getUserOptions,
    loading: tradingLoading
  } = useUnifiedTrading();

  const { currency, setCurrency } = useUserSettings();
  const { prices } = useMarketData();

  // Helper to get asset name
  const getAssetName = (symbol: string): string => {
    const names: Record<string, string> = {
      USDT: 'Tether',
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      XRP: 'Ripple',
      DOT: 'Polkadot',
      DOGE: 'Dogecoin',
      AVAX: 'Avalanche',
      MATIC: 'Polygon',
      LINK: 'Chainlink',
      UNI: 'Uniswap'
    };
    return names[symbol] || symbol;
  };

  // State
  const [hideBalances, setHideBalances] = useState(false);
  const [timeframe, setTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userTrades, setUserTrades] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const [trades, positionsData, optionsData] = await Promise.all([
        getUserTrades(),
        getUserPositions(),
        getUserOptions()
      ]);

      setUserTrades(trades || []);
      setPositions(positionsData || []);
      setOptions(optionsData || []);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate combined portfolio from all sources
  const combinedPortfolio = useMemo(() => {
    // Start with wallet assets
    const assets: Record<string, PortfolioAsset> = {};

    // Add funding wallet balances
    Object.entries(fundingBalances || {}).forEach(([symbol, balance]) => {
      if (typeof balance === 'number' && balance > 0) {
        assets[symbol] = {
          symbol,
          name: getAssetName(symbol),
          balance,
          locked: 0,
          value: symbol === 'USDT' ? balance : (balance * (prices?.[symbol] || 0)),
          price: prices?.[symbol] || (symbol === 'USDT' ? 1 : 0),
          change24h: 0,
          allocation: 0
        };
      }
    });

    // Add trading wallet balances
    Object.entries(tradingBalances || {}).forEach(([symbol, data]: [string, any]) => {
      if (data && data.available > 0) {
        if (assets[symbol]) {
          assets[symbol].balance += data.available;
          assets[symbol].locked = (assets[symbol].locked || 0) + (data.locked || 0);
          assets[symbol].value += symbol === 'USDT' ? data.available : (data.available * (prices?.[symbol] || 0));
        } else {
          assets[symbol] = {
            symbol,
            name: getAssetName(symbol),
            balance: data.available,
            locked: data.locked || 0,
            value: symbol === 'USDT' ? data.available : (data.available * (prices?.[symbol] || 0)),
            price: prices?.[symbol] || (symbol === 'USDT' ? 1 : 0),
            change24h: 0,
            allocation: 0
          };
        }
      }
    });

    // Add positions value (futures PnL)
    positions.forEach(pos => {
      const symbol = pos.symbol?.replace('USDT', '') || 'BTC';
      if (assets[symbol]) {
        assets[symbol].pnl = (assets[symbol].pnl || 0) + (pos.pnl || 0);
      }
    });

    // Add options value
    options.forEach(opt => {
      const symbol = opt.symbol?.replace('USDT', '') || 'BTC';
      if (assets[symbol]) {
        assets[symbol].pnl = (assets[symbol].pnl || 0) + (opt.pnl || 0);
      }
    });

    // Calculate total portfolio value
    const totalPortfolioValue = Object.values(assets).reduce((sum, a) => sum + a.value, 0);

    // Calculate allocations and PnL percentages
    Object.values(assets).forEach(asset => {
      asset.allocation = totalPortfolioValue > 0 ? (asset.value / totalPortfolioValue) * 100 : 0;
      if (asset.pnl && asset.value > 0) {
        asset.pnlPercentage = (asset.pnl / asset.value) * 100;
      }
    });

    return Object.values(assets).sort((a, b) => b.value - a.value);
  }, [fundingBalances, tradingBalances, prices, positions, options]);

  // Calculate total portfolio value
  const totalPortfolioValue = useMemo(() => {
    return combinedPortfolio.reduce((sum, a) => sum + a.value, 0);
  }, [combinedPortfolio]);

  // Calculate total locked value
  const totalLockedValue = useMemo(() => {
    return combinedPortfolio.reduce((sum, a) => sum + (a.locked || 0), 0);
  }, [combinedPortfolio]);

  // Calculate active trades count
  const activeTradesCount = useMemo(() => {
    return (positions?.filter((p: any) => p.status === 'open')?.length || 0) +
      (options?.filter((o: any) => o.status === 'active')?.length || 0) +
      (stats?.activeLocks || 0);
  }, [positions, options, stats]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const todayValue = totalPortfolioValue;
    const safeValueHistory = Array.isArray(valueHistory) ? valueHistory : [];
    const yesterdayValue = safeValueHistory.length > 1 ? safeValueHistory[safeValueHistory.length - 2].value : todayValue;
    const weekAgoValue = safeValueHistory.length > 7 ? safeValueHistory[safeValueHistory.length - 8].value : todayValue;
    const monthAgoValue = safeValueHistory.length > 30 ? safeValueHistory[safeValueHistory.length - 31].value : todayValue;

    const dailyChange = todayValue - yesterdayValue;
    const weeklyChange = todayValue - weekAgoValue;
    const monthlyChange = todayValue - monthAgoValue;

    return {
      daily: {
        value: dailyChange,
        percentage: yesterdayValue > 0 ? (dailyChange / yesterdayValue) * 100 : 0
      },
      weekly: {
        value: weeklyChange,
        percentage: weekAgoValue > 0 ? (weeklyChange / weekAgoValue) * 100 : 0
      },
      monthly: {
        value: monthlyChange,
        percentage: monthAgoValue > 0 ? (monthlyChange / monthAgoValue) * 100 : 0
      }
    };
  }, [totalPortfolioValue, valueHistory]);

  // Combine all activities
  const recentActivities = useMemo(() => {
    const activities: TradingActivity[] = [
      ...(userTrades || []).slice(0, 10).map(t => ({
        id: t.id,
        type: t.type || 'spot',
        asset: t.asset || 'BTC',
        amount: t.total || t.amount || 0,
        pnl: t.pnl,
        status: t.status || 'completed',
        timestamp: t.createdAt || new Date().toISOString()
      })),
      ...(positions || []).slice(0, 5).map(p => ({
        id: p.id,
        type: 'futures' as const,
        asset: p.symbol || 'BTC',
        amount: p.size || 0,
        pnl: p.pnl,
        status: p.status || 'active',
        timestamp: p.createdAt || new Date().toISOString()
      })),
      ...(options || []).slice(0, 5).map(o => ({
        id: o.id,
        type: 'options' as const,
        asset: o.symbol || 'BTC',
        amount: o.premium || 0,
        pnl: o.pnl,
        status: o.status || 'active',
        timestamp: o.createdAt || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 10);
  }, [userTrades, positions, options]);

  // Navigation protection is handled by ProtectedRoute wrapper

  const isLoading = loading || walletLoading || tradingLoading;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-[#0B0E11] via-[#0F1217] to-[#1A1D24] pb-16 md:pb-24"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.header
        variants={slideInLeft}
        className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139]"
      >
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center shrink-0"
              >
                <Activity size={16} className="text-[#181A20] md:w-5 md:h-5" />
              </motion.div>
              <h1 className="text-base md:text-xl font-bold text-[#EAECEF] truncate">Portfolio</h1>
              {activeTradesCount > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30 hidden sm:inline-flex">
                    {activeTradesCount} Active
                  </Badge>
                  <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30 sm:hidden">
                    {activeTradesCount}
                  </Badge>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setHideBalances(!hideBalances)}
                className="p-1.5 md:p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              >
                {hideBalances ? <EyeOff size={18} className="text-[#848E9C]" /> : <Eye size={18} className="text-[#848E9C]" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={refreshData}
                className="p-1.5 md:p-2 hover:bg-[#23262F] rounded-lg transition-colors"
                disabled={isLoading}
              >
                <RefreshCw size={18} className={`text-[#848E9C] ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>

              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-20 md:w-24 h-8 md:h-9 bg-[#1E2329] border-[#2B3139]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 md:py-6">
        {/* Portfolio Value Overview */}
        <motion.div variants={fadeInUp} className="mb-4 md:mb-6">
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 md:p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-[#F0B90B]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 md:w-64 h-48 md:h-64 bg-purple-500/5 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-[#F0B90B] md:w-5 md:h-5" />
                  <span className="text-xs md:text-sm text-[#848E9C]">Total Portfolio Value</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#2B3139] text-[#848E9C] text-xs">
                    {combinedPortfolio.length} Assets
                  </Badge>
                  {totalLockedValue > 0 && (
                    <Badge className="bg-[#2B3139] text-[#848E9C] text-xs hidden xs:inline">
                      ${totalLockedValue.toFixed(2)} Locked
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <motion.div
                    key={totalPortfolioValue}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-5xl font-bold text-[#EAECEF] mb-1 md:mb-2 font-mono break-words"
                  >
                    {hideBalances ? '••••••' : (
                      currency === 'BTC' && prices?.BTC
                        ? `${(totalPortfolioValue / prices.BTC).toFixed(6)} BTC`
                        : `$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </motion.div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <span className="text-xs text-[#848E9C]">
                      ≈ ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                    </span>
                    <Badge className={`${performanceMetrics.daily.value >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                      {performanceMetrics.daily.value >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                      {Math.abs(performanceMetrics.daily.percentage).toFixed(2)}% (24h)
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] h-8 md:h-10 px-3 md:px-4 text-xs md:text-sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List size={14} className="mr-1 md:mr-2" /> : <Grid size={14} className="mr-1 md:mr-2" />}
                    <span className="hidden xs:inline">{viewMode === 'grid' ? 'List' : 'Grid'}</span>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-8 md:h-10 px-3 md:px-4 text-xs md:text-sm"
                    onClick={() => navigate('/wallet')}
                  >
                    <span>Manage</span>
                    <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Key Performance Metrics */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6"
        >
          <MetricCard
            title="24h Change"
            value={hideBalances ? '•••••' : `${performanceMetrics.daily.value >= 0 ? '+' : ''}$${Math.abs(performanceMetrics.daily.value).toFixed(2)}`}
            change={performanceMetrics.daily.percentage}
            icon={<TrendingUp size={16} className="text-[#F0B90B]" />}
            tooltip="Change in last 24 hours"
            loading={isLoading}
          />

          <MetricCard
            title="7d Change"
            value={hideBalances ? '•••••' : `${performanceMetrics.weekly.value >= 0 ? '+' : ''}$${Math.abs(performanceMetrics.weekly.value).toFixed(2)}`}
            change={performanceMetrics.weekly.percentage}
            icon={<BarChart3 size={16} className="text-[#F0B90B]" />}
            tooltip="Change in last 7 days"
            loading={isLoading}
          />

          <MetricCard
            title="30d Change"
            value={hideBalances ? '•••••' : `${performanceMetrics.monthly.value >= 0 ? '+' : ''}$${Math.abs(performanceMetrics.monthly.value).toFixed(2)}`}
            change={performanceMetrics.monthly.percentage}
            icon={<LineChart size={16} className="text-[#F0B90B]" />}
            tooltip="Change in last 30 days"
            loading={isLoading}
          />

          <MetricCard
            title="Active Positions"
            value={activeTradesCount.toString()}
            icon={<Target size={16} className="text-[#F0B90B]" />}
            tooltip={`${positions?.length || 0} futures · ${options?.length || 0} options · ${stats?.activeLocks || 0} locks`}
            loading={isLoading}
          />
        </motion.div>

        {/* Portfolio Analytics Tabs */}
        <motion.div variants={fadeInUp} className="mb-4 md:mb-6">
          <Card className="bg-[#1E2329] border-[#2B3139] overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="p-3 md:p-4 border-b border-[#2B3139] flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <PieChart size={16} className="text-[#F0B90B] md:w-5 md:h-5" />
                  <h2 className="font-semibold text-[#EAECEF] text-sm md:text-base">Portfolio Analysis</h2>
                </div>
                <TabsList className="bg-[#2B3139] p-1 rounded-lg w-full xs:w-auto overflow-x-auto flex-nowrap">
                  <TabsTrigger value="overview" className="text-xs px-2 md:px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="allocation" className="text-xs px-2 md:px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Allocation
                  </TabsTrigger>
                  <TabsTrigger value="holdings" className="text-xs px-2 md:px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Holdings
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-xs px-2 md:px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Activity
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-3 md:p-4">
                <TabsContent value="overview" className="mt-0">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[150px] md:h-[200px] w-full bg-[#2B3139]" />
                      <div className="grid grid-cols-4 gap-2 md:gap-3">
                        <Skeleton className="h-14 md:h-16 bg-[#2B3139]" />
                        <Skeleton className="h-14 md:h-16 bg-[#2B3139]" />
                        <Skeleton className="h-14 md:h-16 bg-[#2B3139]" />
                        <Skeleton className="h-14 md:h-16 bg-[#2B3139]" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Performance Chart */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-[#848E9C]">Portfolio Performance</span>
                          <div className="flex gap-1 md:gap-2">
                            {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
                              <button
                                key={tf}
                                className={`text-xs px-1.5 md:px-2 py-1 rounded transition-colors ${
                                  timeframe === tf
                                    ? 'bg-[#F0B90B] text-[#181A20] font-medium'
                                    : 'text-[#848E9C] hover:text-[#EAECEF]'
                                }`}
                                onClick={() => setTimeframe(tf)}
                              >
                                {tf}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="h-[150px] md:h-[200px]">
                          <PortfolioValueChart
                            valueHistory={Array.isArray(valueHistory) && valueHistory.length > 0 ? valueHistory : []}
                            timeframe={timeframe}
                          />
                        </div>
                      </div>

                      {/* Period Returns */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 pt-4 border-t border-[#2B3139]">
                        <div className="text-center p-2 md:p-3 bg-[#23262F] rounded-lg">
                          <div className="text-xs text-[#848E9C] mb-1">1D</div>
                          <div className={`text-xs md:text-sm font-bold ${performanceMetrics.daily.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.daily.value >= 0 ? '+' : ''}${Math.abs(performanceMetrics.daily.value).toFixed(2)}
                          </div>
                          <div className={`text-[10px] md:text-xs ${performanceMetrics.daily.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.daily.percentage >= 0 ? '+' : ''}{performanceMetrics.daily.percentage.toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-[#23262F] rounded-lg">
                          <div className="text-xs text-[#848E9C] mb-1">7D</div>
                          <div className={`text-xs md:text-sm font-bold ${performanceMetrics.weekly.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.weekly.value >= 0 ? '+' : ''}${Math.abs(performanceMetrics.weekly.value).toFixed(2)}
                          </div>
                          <div className={`text-[10px] md:text-xs ${performanceMetrics.weekly.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.weekly.percentage >= 0 ? '+' : ''}{performanceMetrics.weekly.percentage.toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-[#23262F] rounded-lg">
                          <div className="text-xs text-[#848E9C] mb-1">30D</div>
                          <div className={`text-xs md:text-sm font-bold ${performanceMetrics.monthly.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.monthly.value >= 0 ? '+' : ''}${Math.abs(performanceMetrics.monthly.value).toFixed(2)}
                          </div>
                          <div className={`text-[10px] md:text-xs ${performanceMetrics.monthly.percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {performanceMetrics.monthly.percentage >= 0 ? '+' : ''}{performanceMetrics.monthly.percentage.toFixed(2)}%
                          </div>
                        </div>
                        <div className="text-center p-2 md:p-3 bg-[#23262F] rounded-lg">
                          <div className="text-xs text-[#848E9C] mb-1">All Time</div>
                          <div className={`text-xs md:text-sm font-bold text-[#EAECEF]`}>
                            ${totalPortfolioValue.toFixed(2)}
                          </div>
                          <div className="text-[10px] md:text-xs text-[#848E9C]">Current</div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="allocation" className="mt-0">
                  {isLoading ? (
                    <Skeleton className="h-[250px] md:h-[300px] w-full bg-[#2B3139]" />
                  ) : combinedPortfolio.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="text-3xl md:text-4xl mb-3">📊</div>
                      <div className="text-[#848E9C] text-xs md:text-sm mb-2">No assets in portfolio</div>
                      <Button
                        className="bg-[#F0B90B] text-[#181A20] font-bold text-xs h-7 md:h-8"
                        onClick={() => navigate('/wallet')}
                      >
                        Start Investing
                      </Button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <PieChart size={14} className="text-[#F0B90B] md:w-4 md:h-4" />
                          <span className="text-xs text-[#848E9C]">Asset Distribution</span>
                        </div>
                        <div className="h-[200px] md:h-[250px]">
                          <AssetAllocationPieChart portfolio={combinedPortfolio} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Award size={14} className="text-[#F0B90B] md:w-4 md:h-4" />
                          <span className="text-xs text-[#848E9C]">Top Holdings</span>
                        </div>
                        <div className="space-y-1 max-h-[250px] md:max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {combinedPortfolio.slice(0, 8).map((asset, index) => (
                            <AllocationItem key={asset.symbol} asset={asset} index={index} hideBalances={hideBalances} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="holdings" className="mt-0">
                  {isLoading ? (
                    <Skeleton className="h-[250px] md:h-[300px] w-full bg-[#2B3139]" />
                  ) : combinedPortfolio.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="text-3xl md:text-4xl mb-3">📋</div>
                      <div className="text-[#848E9C] text-xs md:text-sm">No holdings to display</div>
                    </div>
                  ) : (
                    <HoldingsTable assets={combinedPortfolio} hideBalances={hideBalances} />
                  )}
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  {isLoading ? (
                    <Skeleton className="h-[250px] md:h-[300px] w-full bg-[#2B3139]" />
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="text-3xl md:text-4xl mb-3">📋</div>
                      <div className="text-[#848E9C] text-xs md:text-sm">No recent activity</div>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[300px] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                      {recentActivities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </motion.div>

        {/* Summary Cards Row */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
          <SummaryCard
            title="Funding Wallet"
            value={hideBalances ? '••••••' : `$${(fundingBalances?.USDT || 0).toFixed(2)}`}
            subValue={`${Object.keys(fundingBalances || {}).length} assets`}
            icon={<Wallet size={16} className="text-[#F0B90B]" />}
          />

          <SummaryCard
            title="Trading Wallet"
            value={hideBalances ? '••••••' : `$${(tradingBalances?.USDT?.available || 0).toFixed(2)}`}
            subValue={`$${(tradingBalances?.USDT?.locked || 0).toFixed(2)} locked`}
            icon={<Activity size={16} className="text-[#F0B90B]" />}
          />

          <SummaryCard
            title="Active Positions"
            value={activeTradesCount.toString()}
            subValue={`${positions?.length || 0} futures · ${options?.length || 0} options`}
            icon={<Target size={16} className="text-[#F0B90B]" />}
          />
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#F0B90B] md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-medium text-[#EAECEF]">Recent Transactions</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#F0B90B] text-xs h-7 md:h-8 px-2"
                onClick={() => navigate('/transaction-history')}
              >
                View All
                <ChevronRight size={12} className="ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 md:h-12 w-full bg-[#2B3139]" />
                <Skeleton className="h-10 md:h-12 w-full bg-[#2B3139]" />
                <Skeleton className="h-10 md:h-12 w-full bg-[#2B3139]" />
              </div>
            ) : (transactions || []).length === 0 ? (
              <div className="text-center py-4 md:py-6">
                <div className="text-[#848E9C] text-xs md:text-sm">No transaction history</div>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3 max-h-[200px] md:max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
                {(transactions || []).slice(0, 5).map((tx, index) => (
                  <div key={tx.id || `tx-${index}`} className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0 hover:bg-[#23262F]/50 transition-colors px-2 rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'Deposit' ? 'bg-green-500/20' :
                        tx.type === 'Withdrawal' ? 'bg-red-500/20' : 'bg-[#F0B90B]/20'
                      }`}>
                        {tx.type === 'Deposit' ? <ArrowDownLeft size={12} className="text-green-400 md:w-3.5 md:h-3.5" /> :
                         tx.type === 'Withdrawal' ? <ArrowUpRight size={12} className="text-red-400 md:w-3.5 md:h-3.5" /> :
                         <RefreshCw size={12} className="text-[#F0B90B] md:w-3.5 md:h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs md:text-sm font-medium text-[#EAECEF] truncate">{tx.type || 'Transaction'}</div>
                        <div className="text-[10px] md:text-xs text-[#848E9C]">{new Date(tx.date || Date.now()).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <div className={`text-xs md:text-sm font-medium ${
                        tx.type === 'Deposit' ? 'text-green-400' :
                        tx.type === 'Withdrawal' ? 'text-red-400' : 'text-[#F0B90B]'
                      }`}>
                        {tx.type === 'Deposit' ? '+' : '-'}{(tx.amount || 0).toFixed(6)} {tx.asset || 'USDT'}
                      </div>
                      <div className="text-[10px] md:text-xs text-[#848E9C]">
                        ${((tx.amount || 0) * (prices?.[tx.asset || 'USDT'] || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Portfolio Summary & Recommendations */}
        <motion.div variants={fadeInUp} className="mt-4 md:mt-6">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center shrink-0">
                <Target size={14} className="text-[#F0B90B] md:w-4 md:h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs md:text-sm font-medium text-[#EAECEF] mb-1">Portfolio Summary</h3>
                <p className="text-[10px] md:text-xs text-[#848E9C] mb-2 md:mb-3 leading-relaxed">
                  Your portfolio is diversified across {combinedPortfolio.length} assets with a total value of ${totalPortfolioValue.toFixed(2)}.
                  {activeTradesCount > 0 && ` You have ${activeTradesCount} active trading positions.`}
                  {totalLockedValue > 0 && ` ${formatCurrency(totalLockedValue)} is currently locked.`}
                  {performanceMetrics.daily.percentage > 0 ? ' Your portfolio is up' : ' Your portfolio is down'} {Math.abs(performanceMetrics.daily.percentage).toFixed(1)}% today.
                </p>
                <div className="flex gap-1 md:gap-2 flex-wrap">
                  {/* Portfolio metrics will be calculated from real data */}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Risk Disclosure */}
        <motion.div variants={fadeInUp} className="mt-3 md:mt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-2 md:p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-[#848E9C] shrink-0 mt-0.5 md:w-3.5 md:h-3.5" />
              <p className="text-[9px] md:text-[10px] text-[#5E6673] leading-relaxed">
                Past performance does not guarantee future results. Investment values may fluctuate.
                All figures are estimated and subject to market conditions. Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
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
          .custom-scrollbar::-webkit-scrollbar {
            width: 2px;
            height: 2px;
          }
        }
      `}</style>
    </motion.div>
  );
}