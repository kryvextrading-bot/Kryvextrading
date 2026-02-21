// pages/ArbitragePage.tsx - COMPLETE PREMIUM REDESIGN with Database Integration

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, BarChart3, History, Wallet, 
  TrendingUp, Clock, Award, AlertTriangle, X,
  ChevronRight, Play, Info, RefreshCw, Eye, EyeOff,
  User, LogOut, Settings, Bell, Menu, DollarSign,
  Calendar, PieChart, Activity, ArrowUpRight, ArrowDownLeft,
  Sparkles, Gem, Layers, Lock, Unlock, CheckCircle,
  AlertCircle, MoreVertical, ChevronDown, ChevronUp,
  Star, Flame, Globe, ShieldCheck, Rocket, Crown,
  Gift, Target, ZapOff, ShieldOff, RefreshCcw
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

// Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks and Context
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { useTradingControl } from '@/hooks/useTradingControl';
import { unifiedTradingService } from '@/services/unified-trading-service';
import { TradeType, ArbitrageContract, StakingPosition } from '@/services/unified-trading-service';

// Icons
import { 
  FaBitcoin, FaEthereum, FaChartLine, FaClock, 
  FaHistory, FaWallet, FaExchangeAlt, FaCog,
  FaArrowUp, FaArrowDown, FaPlay, FaStopwatch,
  FaRegClock, FaRegCalendarAlt, FaPercentage,
  FaGem, FaCrown, FaRocket, FaShieldAlt, FaBolt
} from 'react-icons/fa';
import { 
  SiTether, SiSolana, SiBinance, SiCardano, 
  SiXrp, SiPolkadot, SiHiveBlockchain,
  SiEthereum, SiBitcoin, SiDogecoin
} from 'react-icons/si';

// ==================== TYPES ====================
interface ArbitrageProduct {
  id: string;
  label: string;
  tier: 'Basic' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  minInvestment: number;
  maxInvestment: number;
  dailyReturn: string;
  annualReturn: string;
  duration: number;
  cryptos: string[];
  features: string[];
  risk: 'Low' | 'Medium' | 'High';
  icon: React.ReactNode;
  color: string;
  dailyRate: number;
}

interface StakingTier {
  range: string;
  min: number;
  max: number;
  dailyRate: number;
  annualRate: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

// ==================== CONSTANTS ====================
const BINANCE_YELLOW = '#F0B90B';
const BINANCE_DARK = '#0B0E11';
const BINANCE_CARD = '#1E2329';
const BINANCE_BORDER = '#2B3139';
const BINANCE_HOVER = '#373B42';

const TIER_COLORS = {
  Basic: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  Bronze: { bg: 'bg-amber-600/10', text: 'text-amber-500', border: 'border-amber-600/20' },
  Silver: { bg: 'bg-slate-400/10', text: 'text-slate-300', border: 'border-slate-400/20' },
  Gold: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  Platinum: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Diamond: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

const ARBITRAGE_PRODUCTS: ArbitrageProduct[] = [
  {
    id: 'arb-1d',
    label: '1 Day Flash',
    tier: 'Basic',
    minInvestment: 1000,
    maxInvestment: 9999,
    dailyReturn: '0.10% – 0.15%',
    annualReturn: '36.5% – 54.75%',
    duration: 1,
    cryptos: ['USDT', 'BTC', 'ETH'],
    features: ['Quick returns', 'Low risk', 'Daily payouts'],
    risk: 'Low',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-gray-500 to-gray-400',
    dailyRate: 0.001
  },
  {
    id: 'arb-3d',
    label: '3 Day Express',
    tier: 'Bronze',
    minInvestment: 10000,
    maxInvestment: 49999,
    dailyReturn: '0.12% – 0.18%',
    annualReturn: '43.8% – 65.7%',
    duration: 3,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL'],
    features: ['Enhanced returns', 'Medium risk', 'Compound available'],
    risk: 'Medium',
    icon: <Rocket className="w-5 h-5" />,
    color: 'from-amber-600 to-amber-500',
    dailyRate: 0.0012
  },
  {
    id: 'arb-7d',
    label: '7 Day Premium',
    tier: 'Silver',
    minInvestment: 50000,
    maxInvestment: 99999,
    dailyReturn: '0.15% – 0.20%',
    annualReturn: '54.75% – 73%',
    duration: 7,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB'],
    features: ['High yield', 'Weekly compounding', 'VIP support'],
    risk: 'Medium',
    icon: <Gem className="w-5 h-5" />,
    color: 'from-slate-400 to-slate-300',
    dailyRate: 0.0015
  },
  {
    id: 'arb-10d',
    label: '10 Day Elite',
    tier: 'Gold',
    minInvestment: 100000,
    maxInvestment: 199999,
    dailyReturn: '0.18% – 0.22%',
    annualReturn: '65.7% – 80.3%',
    duration: 10,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA'],
    features: ['Elite returns', 'Priority withdrawals', 'Dedicated manager'],
    risk: 'High',
    icon: <Crown className="w-5 h-5" />,
    color: 'from-yellow-500 to-yellow-400',
    dailyRate: 0.0018
  },
  {
    id: 'arb-15d',
    label: '15 Day Pro',
    tier: 'Platinum',
    minInvestment: 200000,
    maxInvestment: 499999,
    dailyReturn: '0.20% – 0.25%',
    annualReturn: '73% – 91.25%',
    duration: 15,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP'],
    features: ['Pro tier returns', 'Instant withdrawals', 'Private community'],
    risk: 'High',
    icon: <Shield className="w-5 h-5" />,
    color: 'from-purple-500 to-purple-400',
    dailyRate: 0.002
  },
  {
    id: 'arb-25d',
    label: '25 Day Max',
    tier: 'Diamond',
    minInvestment: 500000,
    maxInvestment: 999999,
    dailyReturn: '0.22% – 0.28%',
    annualReturn: '80.3% – 102.2%',
    duration: 25,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT'],
    features: ['Maximum returns', 'Zero fees', 'Lifetime rewards'],
    risk: 'High',
    icon: <Target className="w-5 h-5" />,
    color: 'from-blue-500 to-blue-400',
    dailyRate: 0.0022
  }
];

const STAKING_TIERS: StakingTier[] = [
  { range: '$1,000 – $10,000', min: 1000, max: 10000, dailyRate: 0.0008, annualRate: 29.2, icon: '🌱', color: 'green', bgColor: 'bg-green-500/10' },
  { range: '$10,000 – $50,000', min: 10000, max: 50000, dailyRate: 0.0012, annualRate: 43.8, icon: '🌿', color: 'emerald', bgColor: 'bg-emerald-500/10' },
  { range: '$50,000 – $200,000', min: 50000, max: 200000, dailyRate: 0.0018, annualRate: 65.7, icon: '🌳', color: 'teal', bgColor: 'bg-teal-500/10' },
  { range: '$200,000 – $500,000', min: 200000, max: 500000, dailyRate: 0.0025, annualRate: 91.25, icon: '🌲', color: 'blue', bgColor: 'bg-blue-500/10' },
  { range: '$500,000+', min: 500000, max: Infinity, dailyRate: 0.0035, annualRate: 127.75, icon: '🏆', color: 'purple', bgColor: 'bg-purple-500/10' }
];

const CRYPTO_ICONS: Record<string, React.ReactNode> = {
  BTC: <FaBitcoin className="text-[#F7931A]" size={18} />,
  ETH: <FaEthereum className="text-[#627EEA]" size={18} />,
  USDT: <SiTether className="text-[#26A17B]" size={18} />,
  SOL: <SiSolana className="text-[#9945FF]" size={18} />,
  BNB: <SiBinance className="text-[#F0B90B]" size={18} />,
  ADA: <SiCardano className="text-[#0033AD]" size={18} />,
  XRP: <SiXrp className="text-[#23292F]" size={18} />,
  DOT: <SiPolkadot className="text-[#E6007A]" size={18} />
};

// ==================== ANIMATION VARIANTS ====================
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  }
};

const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  })
};

const shimmerEffect = {
  initial: { x: '-100%' },
  hover: { x: '100%' },
  transition: { duration: 0.8, ease: "easeInOut" }
};

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatCompactCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatTimeRemaining = (endTime: string): string => {
  const remaining = new Date(endTime).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// ==================== EMPTY STATE COMPONENT ====================
const EmptyState = ({ type, onAction }: { type: string; onAction: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <motion.div
      animate={{ 
        scale: [1, 1.1, 1],
        rotate: [0, 5, -5, 0]
      }}
      transition={{ duration: 4, repeat: Infinity }}
      className="w-24 h-24 bg-gradient-to-br from-[#F0B90B]/20 to-[#F0B90B]/5 rounded-3xl flex items-center justify-center mb-6"
    >
      {type === 'arbitrage' ? (
        <Zap className="w-10 h-10 text-[#F0B90B]" />
      ) : (
        <Shield className="w-10 h-10 text-[#F0B90B]" />
      )}
    </motion.div>
    <h3 className="text-xl font-bold text-[#EAECEF] mb-2">
      No Active {type === 'arbitrage' ? 'Arbitrage' : 'Staking'}
    </h3>
    <p className="text-sm text-[#848E9C] text-center mb-8 max-w-md">
      {type === 'arbitrage' 
        ? 'Start your first arbitrage contract to earn passive income with our AI-powered trading bots'
        : 'Begin staking your assets to earn daily rewards and compound your earnings'
      }
    </p>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onAction}
      className="bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11] font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#F0B90B]/20 flex items-center gap-2"
    >
      {type === 'arbitrage' ? <Play className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      Get Started Now
    </motion.button>
  </motion.div>
);

// ==================== MAIN COMPONENT ====================
export default function ArbitragePage() {
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    getTradingBalance, 
    refreshBalances, 
    loading: walletLoading 
  } = useUnifiedWallet();
  const { 
    userOutcome,
    activeWindows,
    countdown,
    shouldWin 
  } = useTradingControl();

  // UI State
  const [activeTab, setActiveTab] = useState<'arbitrage' | 'staking'>('arbitrage');
  const [selectedProduct, setSelectedProduct] = useState<ArbitrageProduct | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordsTab, setRecordsTab] = useState('active');
  const [hideBalances, setHideBalances] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState<string | null>(null);
  const [hoveredTier, setHoveredTier] = useState<number | null>(null);

  // Data State
  const [activeContracts, setActiveContracts] = useState<ArbitrageContract[]>([]);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [contractHistory, setContractHistory] = useState<ArbitrageContract[]>([]);
  const [stakingHistory, setStakingHistory] = useState<StakingPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalEarned: 0,
    activeContracts: 0,
    activeStaking: 0,
    avgDailyReturn: 0
  });

  // Load user data from real API
  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        // Initialize with empty data if not authenticated
        setActiveContracts([]);
        setContractHistory([]);
        setStakingPositions([]);
        setStakingHistory([]);
        setStats({
          totalInvested: 0,
          totalEarned: 0,
          activeContracts: 0,
          activeStaking: 0,
          avgDailyReturn: 0
        });
        return;
      }

      // Load real arbitrage contracts from trading service
      const arbitrageTrades = await unifiedTradingService.getUserTrades(user.id, 'arbitrage');
      const stakingTrades = await unifiedTradingService.getUserTrades(user.id, 'staking');

      // Filter and map arbitrage contracts
      const activeArbitrage = arbitrageTrades
        .filter(trade => trade.status === 'active')
        .map(trade => trade as ArbitrageContract);

      const completedArbitrage = arbitrageTrades
        .filter(trade => trade.status === 'completed' || trade.status === 'failed')
        .map(trade => trade as ArbitrageContract);

      // Filter and map staking positions
      const activeStaking = stakingTrades
        .filter(trade => trade.status === 'active')
        .map(trade => ({
          id: trade.id,
          userId: trade.userId,
          amount: trade.amount,
          startTime: trade.createdAt,
          dailyRate: trade.metadata?.dailyRate || 0.001,
          accumulatedRewards: trade.pnl || 0,
          status: trade.status as 'active' | 'completed' | 'unstaked'
        }));

      const completedStaking = stakingTrades
        .filter(trade => trade.status === 'completed' || trade.status === 'failed')
        .map(trade => ({
          id: trade.id,
          userId: trade.userId,
          amount: trade.amount,
          startTime: trade.createdAt,
          dailyRate: trade.metadata?.dailyRate || 0.001,
          accumulatedRewards: trade.pnl || 0,
          status: trade.status as 'active' | 'completed' | 'unstaked'
        }));

      // Update state with real data
      setActiveContracts(activeArbitrage);
      setContractHistory(completedArbitrage);
      setStakingPositions(activeStaking);
      setStakingHistory(completedStaking);

      // Calculate real stats
      const totalInvested = [...arbitrageTrades, ...stakingTrades].reduce((sum, trade) => sum + trade.amount, 0);
      const totalEarned = [...arbitrageTrades, ...stakingTrades].reduce((sum, trade) => sum + (trade.pnl || 0), 0);

      setStats({
        totalInvested,
        totalEarned,
        activeContracts: activeArbitrage.length,
        activeStaking: activeStaking.length,
        avgDailyReturn: totalInvested > 0 ? (totalEarned / totalInvested) * 100 : 0
      });

    } catch (error) {
      console.error('Failed to load user data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your arbitrage data',
        variant: 'destructive'
      });
      
      // Initialize with empty data on error
      setActiveContracts([]);
      setContractHistory([]);
      setStakingPositions([]);
      setStakingHistory([]);
      setStats({
        totalInvested: 0,
        totalEarned: 0,
        activeContracts: 0,
        activeStaking: 0,
        avgDailyReturn: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle arbitrage start
  const handleStartArbitrage = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to start arbitrage',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedProduct) {
      toast({
        title: 'No Product Selected',
        description: 'Please select an arbitrage product',
        variant: 'destructive'
      });
      return;
    }

    const amount = Number(investmentAmount);
    if (!amount || amount < selectedProduct.minInvestment) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum investment is ${formatCurrency(selectedProduct.minInvestment)}`,
        variant: 'destructive'
      });
      return;
    }

    if (amount > getTradingBalance('USDT')) {
      toast({
        title: 'Insufficient Balance',
        description: `You have ${formatCurrency(getTradingBalance('USDT'))} USDT available`,
        variant: 'destructive'
      });
      return;
    }

    setExecuting(true);

    try {
      // Execute arbitrage trade through unified trading service
      const result = await unifiedTradingService.executeTrade({
        type: 'arbitrage',
        data: {
          amount,
          productId: selectedProduct.id,
          productLabel: selectedProduct.label,
          duration: selectedProduct.duration,
          asset: 'USDT',
          dailyRate: selectedProduct.dailyRate
        },
        userId: user!.id
      });

      if (result.success) {
        toast({
          title: 'Arbitrage Started! 🚀',
          description: `Your ${selectedProduct.label} contract has been activated.`,
        });
        
        // Reset form
        setSelectedProduct(null);
        setInvestmentAmount('');
        
        // Reload data to show new contract
        await loadUserData();
        
        // Refresh wallet balance
        await refreshBalances();
      } else {
        throw new Error(result.error || 'Failed to start arbitrage');
      }

    } catch (error) {
      console.error('Failed to start arbitrage:', error);
      toast({
        title: 'Failed to Start Arbitrage',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  }, [isAuthenticated, selectedProduct, investmentAmount, user, getTradingBalance, refreshBalances, toast]);

  // Handle staking start
  const handleStartStaking = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to start staking',
        variant: 'destructive'
      });
      return;
    }

    const amount = Number(stakingAmount);
    if (!amount || amount < 1000) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum staking amount is $1,000',
        variant: 'destructive'
      });
      return;
    }

    if (amount > getTradingBalance('USDT')) {
      toast({
        title: 'Insufficient Balance',
        description: `You have ${formatCurrency(getTradingBalance('USDT'))} USDT available`,
        variant: 'destructive'
      });
      return;
    }

    // Find applicable tier
    const tier = STAKING_TIERS.find(t => amount >= t.min && amount <= t.max) || STAKING_TIERS[STAKING_TIERS.length - 1];

    setExecuting(true);

    try {
      // Execute staking trade through unified trading service
      const result = await unifiedTradingService.executeTrade({
        type: 'staking',
        data: {
          amount,
          tier: tier.range,
          dailyRate: tier.dailyRate,
          asset: 'USDT'
        },
        userId: user!.id
      });

      if (result.success) {
        toast({
          title: 'Staking Started! 🎉',
          description: `Your ${tier.range} staking position has been activated.`,
        });
        
        // Reset form
        setStakingAmount('');
        
        // Reload data to show new position
        await loadUserData();
        
        // Refresh wallet balance
        await refreshBalances();
      } else {
        throw new Error(result.error || 'Failed to start staking');
      }

    } catch (error) {
      console.error('Failed to start staking:', error);
      toast({
        title: 'Failed to Start Staking',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  }, [isAuthenticated, stakingAmount, user, getTradingBalance, refreshBalances, toast]);

  // Calculate estimated returns for staking
  const estimatedReturns = useMemo(() => {
    if (!stakingAmount || Number(stakingAmount) < 1000) return null;
    
    const amount = Number(stakingAmount);
    const tier = STAKING_TIERS.find(t => amount >= t.min && amount <= t.max) || STAKING_TIERS[STAKING_TIERS.length - 1];
    
    return {
      daily: amount * tier.dailyRate,
      weekly: amount * tier.dailyRate * 7,
      monthly: amount * tier.dailyRate * 30,
      apy: tier.annualRate
    };
  }, [stakingAmount]);

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
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

      {/* Premium Header with Glass Effect */}
      <motion.header 
        variants={itemVariants}
        className="sticky top-0 z-50 bg-[#0B0E11]/95 backdrop-blur-xl border-b border-[#2B3139]/50"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200"
              >
                <Menu className="w-5 h-5 text-[#848E9C]" />
              </motion.button>
              
              <motion.div 
                className="flex items-center gap-2.5"
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20">
                    <SiHiveBlockchain className="text-[#0B0E11] text-xl" />
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                  />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent">
                    Arbitrage Pro
                  </h1>
                  <p className="text-xs text-[#848E9C]">AI-Powered Trading</p>
                </div>
              </motion.div>

              {/* Active Windows Indicator */}
              {activeWindows.length > 0 && countdown && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="hidden md:block"
                >
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 ml-2 px-3 py-1.5">
                    <Clock className="w-3 h-3 mr-1 animate-pulse" />
                    {countdown}
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setHideBalances(!hideBalances)}
                      className="p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200 relative group"
                    >
                      {hideBalances ? 
                        <EyeOff className="w-5 h-5 text-[#848E9C] group-hover:text-[#F0B90B]" /> : 
                        <Eye className="w-5 h-5 text-[#848E9C] group-hover:text-[#F0B90B]" />
                      }
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hideBalances ? 'Show' : 'Hide'} Balances</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRecordsOpen(true)}
                      className="p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200 relative group"
                    >
                      <History className="w-5 h-5 text-[#848E9C] group-hover:text-[#F0B90B]" />
                      {(activeContracts.length + stakingPositions.length) > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0B90B] rounded-full text-[10px] flex items-center justify-center text-[#0B0E11] font-bold"
                        >
                          {activeContracts.length + stakingPositions.length}
                        </motion.span>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Transaction History</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-200 shadow-lg shadow-[#F0B90B]/20">
                  <span className="text-sm font-bold text-[#0B0E11]">
                    {user?.email?.[0] || 'U'}
                  </span>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
                />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Total Invested', value: stats.totalInvested, icon: DollarSign, color: '#F0B90B', change: '+2.5%' },
            { label: 'Total Earned', value: stats.totalEarned, icon: TrendingUp, color: '#0ECB81', change: null },
            { label: 'Active Positions', value: stats.activeContracts + stats.activeStaking, icon: Zap, color: '#F0B90B', change: null },
            { label: 'Avg Daily Return', value: stats.avgDailyReturn, icon: Activity, color: '#5096FF', change: null, suffix: '%' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              custom={index}
              variants={statsVariants}
              whileHover={{ scale: 1.02, y: -2 }}
              className="group"
            >
              <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  variants={shimmerEffect}
                  initial="initial"
                  whileHover="hover"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-[#848E9C]">{stat.label}</p>
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}10` }}
                    >
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-[#EAECEF]">
                    {hideBalances && stat.label !== 'Avg Daily Return' ? '••••••' : 
                      stat.suffix ? `${stat.value.toFixed(2)}${stat.suffix}` : 
                      formatCompactCurrency(stat.value)}
                  </p>
                  {stat.change && (
                    <div className="mt-2 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-400">{stat.change}</span>
                      <span className="text-xs text-[#848E9C] ml-1">vs last month</span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Trading Card */}
        <motion.div variants={cardVariants}>
          <Card className="bg-[#1E2329] border-[#2B3139] overflow-hidden shadow-2xl">
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
              <div className="border-b border-[#2B3139] px-4 sm:px-6 pt-4">
                <TabsList className="inline-flex gap-1 bg-[#0B0E11] p-1 rounded-xl">
                  <TabsTrigger 
                    value="arbitrage" 
                    className="px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] transition-all duration-200"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Arbitrage</span>
                    <span className="sm:hidden">Arb</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="staking" 
                    className="px-4 sm:px-6 py-2.5 rounded-lg font-semibold text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] transition-all duration-200"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Staking</span>
                    <span className="sm:hidden">Stake</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Arbitrage Tab */}
              <TabsContent value="arbitrage" className="p-4 sm:p-6">
                <motion.div 
                  variants={itemVariants}
                  className="space-y-6"
                >
                  {/* Products Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold text-[#EAECEF] flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                          <Zap className="w-4 h-4 text-[#F0B90B]" />
                        </div>
                        Arbitrage Products
                      </h2>
                      <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
                        {ARBITRAGE_PRODUCTS.length} Available
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {ARBITRAGE_PRODUCTS.map((product, index) => {
                        const tierStyle = TIER_COLORS[product.tier];
                        const isSelected = selectedProduct?.id === product.id;
                        
                        return (
                          <motion.div
                            key={product.id}
                            variants={cardVariants}
                            custom={index}
                            whileHover="hover"
                            className={`group relative border rounded-xl p-4 sm:p-5 bg-gradient-to-br from-[#0B0E11] to-[#1E2329] transition-all duration-300 cursor-pointer overflow-hidden ${
                              isSelected 
                                ? 'border-[#F0B90B] shadow-lg shadow-[#F0B90B]/20' 
                                : 'border-[#2B3139] hover:border-[#F0B90B]/50 hover:shadow-lg hover:shadow-[#F0B90B]/5'
                            }`}
                            onClick={() => setSelectedProduct(product)}
                          >
                            {/* Gradient Overlay */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              animate={isSelected ? { opacity: 0.1 } : { opacity: 0 }}
                            />
                            
                            {/* Shimmer Effect */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                              variants={shimmerEffect}
                              initial="initial"
                              whileHover="hover"
                            />
                            
                            <div className="relative">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-[#EAECEF]">{product.label}</h3>
                                    <Badge className={`${tierStyle.bg} ${tierStyle.text} ${tierStyle.border}`}>
                                      {product.tier}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-[#848E9C]">{product.duration} Day Duration</p>
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${product.color}`}>
                                  {product.icon}
                                </div>
                              </div>
                              
                              <div className="space-y-2.5 mb-4">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[#848E9C]">Min Investment</span>
                                  <span className="text-[#EAECEF] font-medium">{formatCompactCurrency(product.minInvestment)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[#848E9C]">Daily Return</span>
                                  <span className="text-green-400 font-medium">{product.dailyReturn}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-[#848E9C]">Risk Level</span>
                                  <span className={
                                    product.risk === 'Low' ? 'text-green-400' :
                                    product.risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                                  }>
                                    {product.risk}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex -space-x-2">
                                  {product.cryptos.slice(0, 4).map((c) => (
                                    <motion.div 
                                      key={c} 
                                      whileHover={{ scale: 1.2, zIndex: 10 }}
                                      className="w-7 h-7 rounded-full bg-[#1E2329] border-2 border-[#0B0E11] flex items-center justify-center hover:z-10 transition-all duration-200"
                                      title={c}
                                    >
                                      {CRYPTO_ICONS[c]}
                                    </motion.div>
                                  ))}
                                  {product.cryptos.length > 4 && (
                                    <div className="w-7 h-7 rounded-full bg-[#1E2329] border-2 border-[#0B0E11] flex items-center justify-center text-[10px] text-[#848E9C]">
                                      +{product.cryptos.length - 4}
                                    </div>
                                  )}
                                </div>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowProductDetails(showProductDetails === product.id ? null : product.id);
                                  }}
                                  className="p-1.5 hover:bg-[#1E2329] rounded-lg transition-colors"
                                >
                                  <Info className="w-4 h-4 text-[#848E9C]" />
                                </motion.button>
                              </div>

                              {/* Expanded Details */}
                              <AnimatePresence>
                                {showProductDetails === product.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-4 pt-4 border-t border-[#2B3139] overflow-hidden"
                                  >
                                    <p className="text-sm text-[#848E9C] mb-2">Features:</p>
                                    <ul className="space-y-1.5">
                                      {product.features.map((feature, i) => (
                                        <motion.li 
                                          key={i}
                                          initial={{ opacity: 0, x: -10 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ delay: i * 0.1 }}
                                          className="text-xs text-[#EAECEF] flex items-center gap-2"
                                        >
                                          <CheckCircle className="w-3 h-3 text-green-400" />
                                          {feature}
                                        </motion.li>
                                      ))}
                                    </ul>
                                    <div className="mt-3 text-xs text-[#F0B90B] font-medium">
                                      APY: {product.annualReturn}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Product Summary - Animated */}
                  <AnimatePresence>
                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-br from-[#F0B90B]/10 to-transparent rounded-xl p-5 border border-[#F0B90B]/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-[#F0B90B] rounded flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-[#0B0E11]" />
                          </div>
                          <h3 className="font-semibold text-[#EAECEF]">Selected Product</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0B0E11] rounded-lg p-3"
                          >
                            <p className="text-xs text-[#848E9C] mb-1">Product</p>
                            <p className="font-semibold text-[#EAECEF]">{selectedProduct.label}</p>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0B0E11] rounded-lg p-3"
                          >
                            <p className="text-xs text-[#848E9C] mb-1">Tier</p>
                            <p className="font-semibold text-[#F0B90B]">{selectedProduct.tier}</p>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0B0E11] rounded-lg p-3"
                          >
                            <p className="text-xs text-[#848E9C] mb-1">Daily Return</p>
                            <p className="font-semibold text-green-400">{selectedProduct.dailyReturn}</p>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-[#0B0E11] rounded-lg p-3"
                          >
                            <p className="text-xs text-[#848E9C] mb-1">Annual Return</p>
                            <p className="font-semibold text-green-400">{selectedProduct.annualReturn}</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Investment Form - Premium Design */}
                  <motion.div 
                    variants={itemVariants}
                    className="bg-[#0B0E11] rounded-xl p-5 border border-[#2B3139]"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <label className="text-xs text-[#848E9C] mb-1.5 block">Investment Amount</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder={selectedProduct ? `Min ${formatCompactCurrency(selectedProduct.minInvestment)}` : 'Select a product'}
                            value={investmentAmount}
                            onChange={(e) => setInvestmentAmount(e.target.value)}
                            className="w-full bg-[#1E2329] border-[#2B3139] text-[#EAECEF] h-12 pl-4 pr-20 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all duration-200"
                            disabled={!selectedProduct}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[#848E9C] text-sm">USDT</span>
                            <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                              <SelectTrigger className="w-20 h-8 bg-[#2B3139] border-0 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USDT">USDT</SelectItem>
                                <SelectItem value="BTC">BTC</SelectItem>
                                <SelectItem value="ETH">ETH</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full lg:w-auto"
                      >
                        <Button
                          className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B]/90 hover:to-yellow-500/90 text-[#0B0E11] font-semibold px-8 h-12 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#F0B90B]/20 relative overflow-hidden group"
                          onClick={handleStartArbitrage}
                          disabled={!selectedProduct || !investmentAmount || Number(investmentAmount) < (selectedProduct?.minInvestment || 0) || executing}
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {executing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Arbitrage
                              </>
                            )}
                          </span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            variants={shimmerEffect}
                            initial="initial"
                            whileHover="hover"
                          />
                        </Button>
                      </motion.div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-[#2B3139]">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#848E9C]" />
                        <span className="text-sm text-[#848E9C]">Trading Balance</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.span 
                          key={getTradingBalance('USDT')}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="font-bold text-[#EAECEF]"
                        >
                          {hideBalances ? '••••••' : formatCurrency(getTradingBalance('USDT'))} USDT
                        </motion.span>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setInvestmentAmount(getTradingBalance('USDT').toString())}
                          className="text-xs text-[#F0B90B] hover:text-[#F0B90B]/80 font-medium"
                        >
                          Max
                        </motion.button>
                      </div>
                    </div>
                    
                    {selectedProduct && investmentAmount && Number(investmentAmount) < selectedProduct.minInvestment && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-amber-400 text-sm bg-amber-400/10 rounded-lg p-3 flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Minimum investment is {formatCurrency(selectedProduct.minInvestment)}</span>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Active Contracts */}
                  {activeContracts.length > 0 && (
                    <motion.div variants={itemVariants}>
                      <h3 className="text-sm font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                          <Zap className="w-3 h-3 text-[#F0B90B]" />
                        </div>
                        Active Contracts ({activeContracts.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {activeContracts.map((contract, index) => {
                          const startTime = new Date(contract.createdAt).getTime();
                          const endTime = contract.endTime ? new Date(contract.endTime).getTime() : startTime + (contract.duration || 7) * 24 * 60 * 60 * 1000;
                          const progress = Math.min(
                            (Date.now() - startTime) / (endTime - startTime) * 100,
                            100
                          );
                          
                          return (
                            <motion.div
                              key={contract.id}
                              variants={itemVariants}
                              custom={index}
                              whileHover={{ scale: 1.01, y: -2 }}
                              className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all duration-300 group relative overflow-hidden"
                            >
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                                variants={shimmerEffect}
                                initial="initial"
                                whileHover="hover"
                              />
                              
                              <div className="relative">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                      <Zap className="w-5 h-5 text-[#F0B90B]" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-[#EAECEF]">{contract.productLabel || 'Arbitrage Contract'}</p>
                                      <p className="text-xs text-[#848E9C]">ID: {contract.id.slice(0, 8)}</p>
                                    </div>
                                  </div>
                                  <Badge className="bg-green-400/10 text-green-400 border-green-400/20 w-fit">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1.5" />
                                    Active
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div className="bg-[#1E2329] rounded-lg p-2.5">
                                    <p className="text-xs text-[#848E9C] mb-1">Amount</p>
                                    <p className="font-semibold text-[#EAECEF]">{formatCompactCurrency(contract.amount)}</p>
                                  </div>
                                  <div className="bg-[#1E2329] rounded-lg p-2.5">
                                    <p className="text-xs text-[#848E9C] mb-1">Daily Rate</p>
                                    <p className="font-semibold text-green-400">{(contract.dailyRate * 100).toFixed(2)}%</p>
                                  </div>
                                  <div className="bg-[#1E2329] rounded-lg p-2.5">
                                    <p className="text-xs text-[#848E9C] mb-1">Time Left</p>
                                    <p className="font-semibold text-[#F0B90B]">{formatTimeRemaining(contract.endTime || contract.updatedAt)}</p>
                                  </div>
                                  <div className="bg-[#1E2329] rounded-lg p-2.5">
                                    <p className="text-xs text-[#848E9C] mb-1">Est. Return</p>
                                    <p className="font-semibold text-green-400">
                                      +{formatCompactCurrency(contract.amount * contract.dailyRate * 30)}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[#848E9C]">Progress</span>
                                    <span className="text-[#EAECEF] font-mono">{progress.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-[#1E2329] rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-gradient-to-r from-[#F0B90B] to-yellow-400 rounded-full"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                      transition={{ duration: 0.5 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Empty State */}
                  {activeContracts.length === 0 && !selectedProduct && (
                    <EmptyState type="arbitrage" onAction={() => setSelectedProduct(ARBITRAGE_PRODUCTS[0])} />
                  )}
                </motion.div>
              </TabsContent>

              {/* Staking Tab */}
              <TabsContent value="staking" className="p-4 sm:p-6">
                <motion.div 
                  variants={itemVariants}
                  className="space-y-6"
                >
                  {/* Staking Tiers */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-bold text-[#EAECEF] flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-[#F0B90B]" />
                        </div>
                        Staking Tiers
                      </h2>
                      <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
                        Up to 127% APY
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {STAKING_TIERS.map((tier, i) => (
                        <motion.div
                          key={i}
                          variants={cardVariants}
                          custom={i}
                          whileHover="hover"
                          onHoverStart={() => setHoveredTier(i)}
                          onHoverEnd={() => setHoveredTier(null)}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/50 transition-all duration-300 group relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"
                            variants={shimmerEffect}
                            initial="initial"
                            whileHover="hover"
                          />
                          
                          <div className="relative">
                            <motion.div 
                              animate={hoveredTier === i ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                              className="text-3xl mb-3"
                            >
                              {tier.icon}
                            </motion.div>
                            
                            <p className="text-xs text-[#848E9C] mb-1">Range</p>
                            <p className="text-sm font-semibold text-[#EAECEF] mb-3">{tier.range}</p>
                            
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#848E9C]">Daily</span>
                                <span className="text-green-400 font-medium">{(tier.dailyRate * 100).toFixed(2)}%</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-[#848E9C]">APY</span>
                                <span className="text-[#F0B90B] font-medium">{tier.annualRate.toFixed(1)}%</span>
                              </div>
                            </div>
                            
                            {/* Progress indicator for tier */}
                            <div className="mt-3 pt-2 border-t border-[#2B3139]">
                              <div className="w-full h-1 bg-[#1E2329] rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: hoveredTier === i ? `${(i + 1) * 20}%` : `${(i + 1) * 15}%` }}
                                  transition={{ duration: 0.3 }}
                                  style={{ 
                                    background: `linear-gradient(90deg, ${
                                      i === 0 ? '#10B981' :
                                      i === 1 ? '#34D399' :
                                      i === 2 ? '#60A5FA' :
                                      i === 3 ? '#8B5CF6' : '#F0B90B'
                                    }, ${
                                      i === 0 ? '#059669' :
                                      i === 1 ? '#10B981' :
                                      i === 2 ? '#3B82F6' :
                                      i === 3 ? '#7C3AED' : '#F59E0B'
                                    })`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Staking Form */}
                  <motion.div 
                    variants={itemVariants}
                    className="bg-[#0B0E11] rounded-xl p-5 border border-[#2B3139]"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                      <div className="flex-1 w-full">
                        <label className="text-xs text-[#848E9C] mb-1.5 block">Staking Amount</label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Enter amount (min $1,000)"
                            value={stakingAmount}
                            onChange={(e) => setStakingAmount(e.target.value)}
                            className="w-full bg-[#1E2329] border-[#2B3139] text-[#EAECEF] h-12 pl-4 pr-20 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all duration-200"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[#848E9C] text-sm">USDT</span>
                          </div>
                        </div>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full lg:w-auto"
                      >
                        <Button
                          className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B]/90 hover:to-yellow-500/90 text-[#0B0E11] font-semibold px-8 h-12 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#F0B90B]/20 relative overflow-hidden group"
                          onClick={handleStartStaking}
                          disabled={!stakingAmount || Number(stakingAmount) < 1000 || executing}
                        >
                          <span className="relative z-10 flex items-center justify-center">
                            {executing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Start Staking
                              </>
                            )}
                          </span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            variants={shimmerEffect}
                            initial="initial"
                            whileHover="hover"
                          />
                        </Button>
                      </motion.div>
                    </div>

                    {/* Estimated Returns */}
                    {estimatedReturns && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-[#2B3139]"
                      >
                        <p className="text-sm font-medium text-[#EAECEF] mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#F0B90B]" />
                          Estimated Returns (30 days)
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: 'Daily', value: estimatedReturns.daily },
                            { label: 'Weekly', value: estimatedReturns.weekly },
                            { label: 'Monthly', value: estimatedReturns.monthly },
                            { label: 'APY', value: estimatedReturns.apy, suffix: '%' }
                          ].map((item, i) => (
                            <motion.div 
                              key={item.label}
                              whileHover={{ scale: 1.02 }}
                              className="bg-[#1E2329] rounded-lg p-3"
                            >
                              <p className="text-xs text-[#848E9C] mb-1">{item.label}</p>
                              <p className="text-sm font-bold text-green-400">
                                +{item.suffix ? item.value.toFixed(1) + item.suffix : formatCompactCurrency(item.value)}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Active Staking Positions */}
                  {stakingPositions.length > 0 && (
                    <motion.div variants={itemVariants}>
                      <h3 className="text-sm font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                          <Shield className="w-3 h-3 text-[#F0B90B]" />
                        </div>
                        Active Staking ({stakingPositions.length})
                      </h3>
                      
                      <div className="space-y-3">
                        {stakingPositions.map((position, index) => (
                          <motion.div
                            key={position.id}
                            variants={itemVariants}
                            custom={index}
                            whileHover={{ scale: 1.01, y: -2 }}
                            className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all duration-300 group relative overflow-hidden"
                          >
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                              variants={shimmerEffect}
                              initial="initial"
                              whileHover="hover"
                            />
                            
                            <div className="relative">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Shield className="w-5 h-5 text-[#F0B90B]" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#EAECEF]">Node Staking</p>
                                    <p className="text-xs text-[#848E9C]">ID: {position.id.slice(0, 8)}</p>
                                  </div>
                                </div>
                                <Badge className="bg-green-400/10 text-green-400 border-green-400/20 w-fit">
                                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1.5" />
                                  Staking
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="bg-[#1E2329] rounded-lg p-2.5">
                                  <p className="text-xs text-[#848E9C] mb-1">Staked</p>
                                  <p className="font-semibold text-[#EAECEF]">{formatCompactCurrency(position.amount)}</p>
                                </div>
                                <div className="bg-[#1E2329] rounded-lg p-2.5">
                                  <p className="text-xs text-[#848E9C] mb-1">Daily Rate</p>
                                  <p className="font-semibold text-green-400">{(position.dailyRate * 100).toFixed(2)}%</p>
                                </div>
                                <div className="bg-[#1E2329] rounded-lg p-2.5">
                                  <p className="text-xs text-[#848E9C] mb-1">Earned</p>
                                  <p className="font-semibold text-green-400">+{formatCompactCurrency(position.accumulatedRewards)}</p>
                                </div>
                                <div className="bg-[#1E2329] rounded-lg p-2.5">
                                  <p className="text-xs text-[#848E9C] mb-1">Duration</p>
                                  <p className="font-semibold text-[#F0B90B]">30 Days</p>
                                </div>
                              </div>
                              
                              {/* Rewards Counter Animation */}
                              <div className="mt-3 pt-2 border-t border-[#2B3139]">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-[#848E9C]">Accumulating rewards</span>
                                  <motion.span 
                                    key={position.accumulatedRewards}
                                    initial={{ scale: 1.2, color: '#4ADE80' }}
                                    animate={{ scale: 1, color: '#4ADE80' }}
                                    className="text-sm font-bold text-green-400"
                                  >
                                    +{formatCurrency(position.accumulatedRewards)}
                                  </motion.span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Empty State */}
                  {stakingPositions.length === 0 && !stakingAmount && (
                    <EmptyState type="staking" onAction={() => setStakingAmount('1000')} />
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        {/* Auth Warning - Premium Alert */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 p-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </motion.div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-amber-400">
                    You're in view-only mode. 
                    <button 
                      onClick={() => window.location.href = '/login'} 
                      className="ml-2 underline hover:text-amber-300 font-medium transition-colors"
                    >
                      Login
                    </button> 
                    {' '}to start arbitrage and staking.
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/register'}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
                  >
                    Register
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Records Modal - Premium Design */}
      <Dialog open={recordsOpen} onClose={() => setRecordsOpen(false)}>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl"
          >
            <Card className="bg-[#1E2329] border-[#F0B90B] overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-[#2B3139]">
                <h2 className="text-xl font-bold text-[#EAECEF] flex items-center gap-2">
                  <History className="text-[#F0B90B]" />
                  Transaction History
                </h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => loadUserData()}
                    disabled={loading}
                    className="text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
                    title="Refresh data"
                  >
                    <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setRecordsOpen(false)}
                    className="text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] rounded-lg w-10 h-10 flex items-center justify-center transition-colors"
                  >
                    <X size={20} />
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6">
                <Tabs value={recordsTab} onValueChange={setRecordsTab} className="w-full">
                  <TabsList className="grid grid-cols-2 w-full bg-[#0B0E11] p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="active" 
                      className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] rounded-lg py-2.5 transition-all duration-200"
                    >
                      Active ({activeContracts.length + stakingPositions.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="history" 
                      className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#0B0E11] rounded-lg py-2.5 transition-all duration-200"
                    >
                      History ({contractHistory.length + stakingHistory.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {activeContracts.map((contract) => (
                        <motion.div
                          key={contract.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">{contract.productLabel || 'Arbitrage Contract'}</span>
                            </div>
                            <Badge className="bg-green-400/10 text-green-400 border-green-400/20">Active</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Amount</span>
                              <p className="font-medium text-[#EAECEF]">{formatCompactCurrency(contract.amount)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Returns</span>
                              <p className="font-medium text-green-400">{(contract.dailyRate * 100).toFixed(2)}% daily</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Remaining</span>
                              <p className="font-medium text-[#F0B90B]">{formatTimeRemaining(contract.endTime || contract.updatedAt)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {stakingPositions.map((position) => (
                        <motion.div
                          key={position.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">Node Staking</span>
                            </div>
                            <Badge className="bg-green-400/10 text-green-400 border-green-400/20">Active</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Staked</span>
                              <p className="font-medium text-[#EAECEF]">{formatCompactCurrency(position.amount)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Earned</span>
                              <p className="font-medium text-green-400">+{formatCompactCurrency(position.accumulatedRewards)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Daily Rate</span>
                              <p className="font-medium text-[#F0B90B]">{(position.dailyRate * 100).toFixed(2)}%</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {activeContracts.length === 0 && stakingPositions.length === 0 && (
                        <div className="text-center py-12 text-[#848E9C]">
                          No active contracts or staking positions
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                      {contractHistory.map((contract) => (
                        <motion.div
                          key={contract.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">{contract.productLabel || 'Arbitrage Contract'}</span>
                            </div>
                            <Badge className="bg-green-400/10 text-green-400 border-green-400/20">Completed</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Invested</span>
                              <p className="font-medium text-[#EAECEF]">{formatCompactCurrency(contract.amount)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Profit</span>
                              <p className="font-medium text-green-400">+{formatCompactCurrency(contract.pnl || 0)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Date</span>
                              <p className="font-medium text-[#F0B90B]">{new Date(contract.endTime || contract.updatedAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {stakingHistory.map((position) => (
                        <motion.div
                          key={position.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">Node Staking</span>
                            </div>
                            <Badge className="bg-green-400/10 text-green-400 border-green-400/20">Completed</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Staked</span>
                              <p className="font-medium text-[#EAECEF]">{formatCompactCurrency(position.amount)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Earned</span>
                              <p className="font-medium text-green-400">+{formatCompactCurrency(position.accumulatedRewards)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2">
                              <span className="text-xs text-[#848E9C] block mb-1">Date</span>
                              <p className="font-medium text-[#F0B90B]">{new Date(position.startTime).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {contractHistory.length === 0 && stakingHistory.length === 0 && (
                        <div className="text-center py-12 text-[#848E9C]">
                          No transaction history yet
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </motion.div>
        </div>
      </Dialog>

      {/* Loading Overlay */}
      <AnimatePresence>
        {executing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <Card className="bg-[#1E2329] border-[#F0B90B] p-8 max-w-sm text-center">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-[#F0B90B] border-t-transparent mx-auto mb-6"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#1E2329] rounded-full" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#EAECEF] mb-2">Processing Transaction</h3>
                <p className="text-sm text-[#848E9C]">Please wait while we process your request</p>
                <div className="mt-4 flex justify-center gap-1">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-[#F0B90B] rounded-full"
                  />
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-[#F0B90B] rounded-full"
                  />
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-[#F0B90B] rounded-full"
                  />
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Dropdown - Premium */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-16 right-4 w-72 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-[#F0B90B]/10 to-transparent border-b border-[#2B3139]">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20"
                >
                  <span className="text-lg font-bold text-[#0B0E11]">
                    {user?.email?.[0] || 'U'}
                  </span>
                </motion.div>
                <div>
                  <p className="font-semibold text-[#EAECEF]">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-[#848E9C]">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => {
                  window.location.href = '/account';
                  setProfileOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-all duration-200 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 bg-[#2B3139] rounded-lg flex items-center justify-center group-hover:bg-[#3A4149] transition-colors">
                  <User className="w-4 h-4 text-[#848E9C]" />
                </div>
                <span>Profile Settings</span>
              </motion.button>
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span>Sign Out</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <motion.div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1E2329] border-r border-[#2B3139] p-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-lg flex items-center justify-center">
                  <SiHiveBlockchain className="text-[#0B0E11] text-sm" />
                </div>
                <h2 className="font-bold text-[#EAECEF]">Menu</h2>
              </div>
              
              <div className="space-y-2">
                <motion.button 
                  whileHover={{ x: 4 }}
                  className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3"
                  onClick={() => setActiveTab('arbitrage')}
                >
                  <Zap className="w-4 h-4 text-[#F0B90B]" />
                  Arbitrage
                </motion.button>
                <motion.button 
                  whileHover={{ x: 4 }}
                  className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3"
                  onClick={() => setActiveTab('staking')}
                >
                  <Shield className="w-4 h-4 text-[#F0B90B]" />
                  Staking
                </motion.button>
                <motion.button 
                  whileHover={{ x: 4 }}
                  className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3"
                  onClick={() => setRecordsOpen(true)}
                >
                  <History className="w-4 h-4 text-[#F0B90B]" />
                  History
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </motion.div>
  );
}