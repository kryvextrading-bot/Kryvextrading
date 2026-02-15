import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, BarChart3, History, Wallet, 
  TrendingUp, Clock, Award, AlertTriangle, X,
  ChevronRight, Play, Info, RefreshCw, Eye, EyeOff,
  User, LogOut, Settings, Bell, Menu, DollarSign,
  Calendar, PieChart, Activity, ArrowUpRight, ArrowDownLeft,
  Sparkles, Gem, Layers, Lock, Unlock, CheckCircle,
  AlertCircle, MoreVertical, ChevronDown, ChevronUp
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

// Components
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hooks and Context
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useTradingControl } from '@/hooks/useTradingControl';
import { useUnifiedTrading } from '@/hooks/useUnifiedTrading';

// Icons
import { 
  FaBitcoin, FaEthereum, FaChartLine, FaClock, 
  FaHistory, FaWallet, FaExchangeAlt, FaCog,
  FaArrowUp, FaArrowDown, FaPlay, FaStopwatch,
  FaRegClock, FaRegCalendarAlt, FaPercentage
} from 'react-icons/fa';
import { 
  SiTether, SiSolana, SiBinance, SiCardano, 
  SiXrp, SiPolkadot, SiHiveBlockchain 
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
}

interface StakingTier {
  range: string;
  min: number;
  max: number;
  dailyRate: number;
  annualRate: number;
  icon: string;
  color: string;
}

interface ArbitrageContract {
  id: string;
  productId: string;
  productLabel: string;
  amount: number;
  startTime: string;
  endTime: string;
  dailyRate: number;
  status: 'active' | 'completed' | 'failed';
  pnl?: number;
  claimed?: number;
}

interface StakingPosition {
  id: string;
  amount: number;
  startTime: string;
  dailyRate: number;
  accumulatedRewards: number;
  status: 'active' | 'completed' | 'unstaked';
}

// ==================== CONSTANTS ====================
const ARBITRAGE_PRODUCTS: ArbitrageProduct[] = [
  {
    id: 'arb-1d',
    label: '1 Day Flash',
    tier: 'Basic',
    minInvestment: 1000,
    maxInvestment: 9999,
    dailyReturn: '0.80% – 1.00%',
    annualReturn: '292% – 365%',
    duration: 1,
    cryptos: ['USDT', 'BTC', 'ETH'],
    features: ['Quick returns', 'Low risk', 'Daily payouts'],
    risk: 'Low'
  },
  {
    id: 'arb-3d',
    label: '3 Day Express',
    tier: 'Bronze',
    minInvestment: 10000,
    maxInvestment: 49999,
    dailyReturn: '1.01% – 1.19%',
    annualReturn: '368% – 434%',
    duration: 3,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL'],
    features: ['Enhanced returns', 'Medium risk', 'Compound available'],
    risk: 'Medium'
  },
  {
    id: 'arb-7d',
    label: '7 Day Premium',
    tier: 'Silver',
    minInvestment: 50000,
    maxInvestment: 99999,
    dailyReturn: '1.20% – 1.29%',
    annualReturn: '438% – 470%',
    duration: 7,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB'],
    features: ['High yield', 'Weekly compounding', 'VIP support'],
    risk: 'Medium'
  },
  {
    id: 'arb-10d',
    label: '10 Day Elite',
    tier: 'Gold',
    minInvestment: 100000,
    maxInvestment: 199999,
    dailyReturn: '1.30% – 1.49%',
    annualReturn: '474% – 543%',
    duration: 10,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA'],
    features: ['Elite returns', 'Priority withdrawals', 'Dedicated manager'],
    risk: 'High'
  },
  {
    id: 'arb-15d',
    label: '15 Day Pro',
    tier: 'Platinum',
    minInvestment: 200000,
    maxInvestment: 499999,
    dailyReturn: '1.40% – 1.49%',
    annualReturn: '511% – 543%',
    duration: 15,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP'],
    features: ['Pro tier returns', 'Instant withdrawals', 'Private community'],
    risk: 'High'
  },
  {
    id: 'arb-25d',
    label: '25 Day Max',
    tier: 'Diamond',
    minInvestment: 500000,
    maxInvestment: 999999,
    dailyReturn: '1.45% – 1.49%',
    annualReturn: '529% – 543%',
    duration: 25,
    cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT'],
    features: ['Maximum returns', 'Zero fees', 'Lifetime rewards'],
    risk: 'High'
  }
];

const STAKING_TIERS: StakingTier[] = [
  { range: '$1,000 – $10,000', min: 1000, max: 10000, dailyRate: 0.0010, annualRate: 36.5, icon: '🌱', color: 'green' },
  { range: '$10,000 – $50,000', min: 10000, max: 50000, dailyRate: 0.0030, annualRate: 109.5, icon: '🌿', color: 'emerald' },
  { range: '$50,000 – $200,000', min: 50000, max: 200000, dailyRate: 0.0075, annualRate: 273.75, icon: '🌳', color: 'teal' },
  { range: '$200,000 – $500,000', min: 200000, max: 500000, dailyRate: 0.0130, annualRate: 474.5, icon: '🌲', color: 'blue' },
  { range: '$500,000+', min: 500000, max: Infinity, dailyRate: 0.0185, annualRate: 675.25, icon: '🏆', color: 'purple' }
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
    className="flex flex-col items-center justify-center py-12 px-4 bg-[#1E2329] rounded-2xl border border-[#2B3139]"
  >
    <div className="w-20 h-20 bg-gradient-to-br from-[#F0B90B]/20 to-[#F0B90B]/5 rounded-2xl flex items-center justify-center mb-5">
      {type === 'arbitrage' ? (
        <Zap className="w-8 h-8 text-[#F0B90B]" />
      ) : (
        <Shield className="w-8 h-8 text-[#F0B90B]" />
      )}
    </div>
    <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">
      No Active {type === 'arbitrage' ? 'Arbitrage' : 'Staking'}
    </h3>
    <p className="text-sm text-[#848E9C] text-center mb-6 max-w-xs">
      {type === 'arbitrage' 
        ? 'Start your first arbitrage contract to earn passive income'
        : 'Begin staking your assets to earn daily rewards'
      }
    </p>
    <Button
      onClick={onAction}
      className="bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#181A20] font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
    >
      <Zap className="w-4 h-4 mr-2" />
      Get Started
    </Button>
  </motion.div>
);

// ==================== MAIN COMPONENT ====================
export default function ArbitragePage() {
  const { toast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();
  const { 
    balances, 
    getBalance,
    lockBalance,
    unlockBalance,
    addBalance,
    refreshData,
    loading: walletLoading 
  } = useUnifiedWallet();
  const { 
    userOutcome,
    activeWindows,
    countdown,
    shouldWin 
  } = useTradingControl();
  const { executeTrade } = useUnifiedTrading();

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

  // Load mock data (replace with real API calls)
  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      const mockContracts: ArbitrageContract[] = [
        {
          id: '1',
          productId: 'arb-1d',
          productLabel: '1 Day Flash',
          amount: 5000,
          startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          dailyRate: 0.009,
          status: 'completed',
          pnl: 45,
          claimed: 45
        },
        {
          id: '2',
          productId: 'arb-3d',
          productLabel: '3 Day Express',
          amount: 15000,
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          dailyRate: 0.011,
          status: 'active'
        }
      ];

      const mockStaking: StakingPosition[] = [
        {
          id: '1',
          amount: 10000,
          startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          dailyRate: 0.003,
          accumulatedRewards: 150,
          status: 'active'
        }
      ];

      setActiveContracts(mockContracts.filter(c => c.status === 'active'));
      setContractHistory(mockContracts.filter(c => c.status === 'completed'));
      setStakingPositions(mockStaking.filter(s => s.status === 'active'));
      setStakingHistory(mockStaking.filter(s => s.status === 'completed'));

      // Calculate stats
      const totalInvested = mockContracts.reduce((sum, c) => sum + c.amount, 0) + 
                           mockStaking.reduce((sum, s) => sum + s.amount, 0);
      const totalEarned = mockContracts.reduce((sum, c) => sum + (c.pnl || 0), 0) +
                          mockStaking.reduce((sum, s) => sum + s.accumulatedRewards, 0);

      setStats({
        totalInvested,
        totalEarned,
        activeContracts: mockContracts.filter(c => c.status === 'active').length,
        activeStaking: mockStaking.filter(s => s.status === 'active').length,
        avgDailyReturn: totalEarned / (totalInvested || 1) * 100
      });

    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load your arbitrage data');
    } finally {
      setLoading(false);
    }
  };

  // Handle arbitrage start
  const handleStartArbitrage = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to start arbitrage');
      return;
    }

    if (!selectedProduct) {
      toast.error('Please select an arbitrage product');
      return;
    }

    const amount = Number(investmentAmount);
    if (!amount || amount < selectedProduct.minInvestment) {
      toast.error(`Minimum investment is ${formatCurrency(selectedProduct.minInvestment)}`);
      return;
    }

    if (amount > getBalance('USDT')) {
      toast.error(`Insufficient balance. You have ${formatCurrency(getBalance('USDT'))}`);
      return;
    }

    setExecuting(true);

    try {
      // Check if this contract should win based on admin settings
      const wins = await shouldWin('arbitrage');
      
      const contractId = `arb_${Date.now()}`;
      const duration = selectedProduct.duration * 24 * 60 * 60 * 1000;
      const dailyRate = parseFloat(selectedProduct.dailyReturn.split('–')[0].replace('%', '')) / 100;

      // Lock the funds
      const lockResult = await lockBalance('USDT', amount, contractId, {
        productId: selectedProduct.id,
        productLabel: selectedProduct.label,
        duration: selectedProduct.duration
      });

      if (!lockResult.success) {
        throw new Error(lockResult.error || 'Failed to lock funds');
      }

      // Create contract
      const newContract: ArbitrageContract = {
        id: contractId,
        productId: selectedProduct.id,
        productLabel: selectedProduct.label,
        amount,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + duration).toISOString(),
        dailyRate,
        status: 'active'
      };

      setActiveContracts(prev => [newContract, ...prev]);
      
      toast.success({
        title: 'Contract Started',
        description: `You invested ${formatCurrency(amount)} in ${selectedProduct.label}`,
      });

      // Schedule completion
      setTimeout(async () => {
        const totalReturn = amount * (1 + dailyRate * selectedProduct.duration);
        const profit = totalReturn - amount;

        // Update contract status
        setActiveContracts(prev => prev.filter(c => c.id !== contractId));
        setContractHistory(prev => [{
          ...newContract,
          status: 'completed',
          pnl: profit,
          claimed: profit
        }, ...prev]);

        // Add profit to wallet
        await addBalance('USDT', totalReturn, 'arbitrage_profit', contractId);
        
        toast.success({
          title: 'Contract Completed',
          description: `You earned ${formatCurrency(profit)} from your arbitrage contract`,
        });
      }, duration);

      // Clear form
      setInvestmentAmount('');
      setSelectedProduct(null);

    } catch (error) {
      console.error('Failed to start arbitrage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start arbitrage');
    } finally {
      setExecuting(false);
    }
  }, [isAuthenticated, selectedProduct, investmentAmount, getBalance, lockBalance, addBalance, shouldWin, toast]);

  // Handle staking start
  const handleStartStaking = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to start staking');
      return;
    }

    const amount = Number(stakingAmount);
    if (!amount || amount < 1000) {
      toast.error('Minimum staking amount is $1,000');
      return;
    }

    if (amount > getBalance('USDT')) {
      toast.error(`Insufficient balance. You have ${formatCurrency(getBalance('USDT'))}`);
      return;
    }

    // Find applicable tier
    const tier = STAKING_TIERS.find(t => amount >= t.min && amount <= t.max) || STAKING_TIERS[STAKING_TIERS.length - 1];

    setExecuting(true);

    try {
      const positionId = `stake_${Date.now()}`;

      // Lock the funds
      const lockResult = await lockBalance('USDT', amount, positionId, {
        type: 'staking',
        tier: tier.range,
        dailyRate: tier.dailyRate
      });

      if (!lockResult.success) {
        throw new Error(lockResult.error || 'Failed to lock funds');
      }

      // Create staking position
      const newPosition: StakingPosition = {
        id: positionId,
        amount,
        startTime: new Date().toISOString(),
        dailyRate: tier.dailyRate,
        accumulatedRewards: 0,
        status: 'active'
      };

      setStakingPositions(prev => [newPosition, ...prev]);

      toast.success({
        title: 'Staking Started',
        description: `You staked ${formatCurrency(amount)} at ${(tier.dailyRate * 100).toFixed(2)}% daily`,
      });

      // Start reward accumulation
      const interval = setInterval(async () => {
        setStakingPositions(prev => 
          prev.map(pos => 
            pos.id === positionId
              ? { ...pos, accumulatedRewards: pos.accumulatedRewards + (amount * tier.dailyRate / 86400) }
              : pos
          )
        );
      }, 1000);

      // Schedule unstaking (30 days)
      setTimeout(async () => {
        clearInterval(interval);
        
        const position = stakingPositions.find(p => p.id === positionId);
        if (position) {
          const totalReturn = amount + position.accumulatedRewards;
          
          setStakingPositions(prev => prev.filter(p => p.id !== positionId));
          setStakingHistory(prev => [{
            ...position,
            status: 'completed'
          }, ...prev]);

          await unlockBalance('USDT', amount, positionId);
          await addBalance('USDT', position.accumulatedRewards, 'staking_reward', `${positionId}_reward`);

          toast.success({
            title: 'Staking Completed',
            description: `You earned ${formatCurrency(position.accumulatedRewards)} from staking`,
          });
        }
      }, 30 * 24 * 60 * 60 * 1000);

      setStakingAmount('');

    } catch (error) {
      console.error('Failed to start staking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start staking');
    } finally {
      setExecuting(false);
    }
  }, [isAuthenticated, stakingAmount, getBalance, lockBalance, unlockBalance, addBalance, toast]);

  return (
    <div className="min-h-screen bg-[#0B0E11]">
      {/* Premium Header with Glass Effect */}
      <header className="sticky top-0 z-50 bg-[#0B0E11]/95 backdrop-blur-xl border-b border-[#2B3139]">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200"
              >
                <Menu className="w-5 h-5 text-[#848E9C]" />
              </button>
              
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <SiHiveBlockchain className="text-[#F0B90B] text-2xl" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent hidden sm:block">
                  Arbitrage Pro
                </h1>
              </div>

              {/* Active Windows Indicator */}
              {activeWindows.length > 0 && countdown && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 ml-2 hidden md:inline-flex">
                  <Clock className="w-3 h-3 mr-1" />
                  {countdown}
                </Badge>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setHideBalances(!hideBalances)}
                      className="p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200"
                    >
                      {hideBalances ? 
                        <EyeOff className="w-5 h-5 text-[#848E9C]" /> : 
                        <Eye className="w-5 h-5 text-[#848E9C]" />
                      }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hideBalances ? 'Show' : 'Hide'} Balances</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setRecordsOpen(true)}
                      className="p-2 hover:bg-[#2B3139] rounded-xl transition-all duration-200 relative"
                    >
                      <History className="w-5 h-5 text-[#848E9C]" />
                      {(activeContracts.length + stakingPositions.length) > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0B90B] rounded-full text-[10px] flex items-center justify-center text-[#0B0E11] font-bold">
                          {activeContracts.length + stakingPositions.length}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Transaction History</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="relative group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-200 shadow-lg shadow-[#F0B90B]/20">
                  <span className="text-sm font-bold text-[#0B0E11]">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="absolute inset-0 rounded-xl bg-[#F0B90B] opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Stats Grid - Premium Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#848E9C] mb-1">Total Invested</p>
                  <p className="text-lg sm:text-xl font-bold text-[#EAECEF]">
                    {hideBalances ? '••••••' : formatCompactCurrency(stats.totalInvested)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#F0B90B]" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">+2.5%</span>
                <span className="text-xs text-[#848E9C] ml-1">vs last month</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#848E9C] mb-1">Total Earned</p>
                  <p className="text-lg sm:text-xl font-bold text-green-400">
                    {hideBalances ? '••••••' : formatCompactCurrency(stats.totalEarned)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-[#848E9C]">Realized P&L</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#848E9C] mb-1">Active Positions</p>
                  <p className="text-lg sm:text-xl font-bold text-[#F0B90B]">
                    {stats.activeContracts + stats.activeStaking}
                  </p>
                </div>
                <div className="w-10 h-10 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#F0B90B]" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="bg-green-400/10 text-green-400 text-xs">
                  {stats.activeContracts} Arbitrage
                </Badge>
                <Badge className="bg-blue-400/10 text-blue-400 text-xs">
                  {stats.activeStaking} Staking
                </Badge>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#848E9C] mb-1">Avg Daily Return</p>
                  <p className="text-lg sm:text-xl font-bold text-green-400">
                    {stats.avgDailyReturn.toFixed(2)}%
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full h-1 bg-[#2B3139] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F0B90B] to-yellow-400 rounded-full"
                    style={{ width: `${Math.min(stats.avgDailyReturn, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Main Trading Card */}
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
              <div className="space-y-6">
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
                    {ARBITRAGE_PRODUCTS.map((product) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ y: -2 }}
                        className={`group relative border rounded-xl p-4 sm:p-5 bg-[#0B0E11] transition-all duration-300 cursor-pointer ${
                          selectedProduct?.id === product.id 
                            ? 'border-[#F0B90B] shadow-lg shadow-[#F0B90B]/20' 
                            : 'border-[#2B3139] hover:border-[#F0B90B]/50 hover:shadow-lg hover:shadow-[#F0B90B]/5'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                        
                        <div className="relative">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-[#EAECEF]">{product.label}</h3>
                                <Badge className={
                                  product.risk === 'Low' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                                  product.risk === 'Medium' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' :
                                  'bg-red-400/10 text-red-400 border-red-400/20'
                                }>
                                  {product.risk}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#848E9C]">{product.tier} Tier</p>
                            </div>
                            <div className="w-8 h-8 bg-[#1E2329] rounded-lg flex items-center justify-center">
                              <Gem className="w-4 h-4 text-[#F0B90B]" />
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
                              <span className="text-[#848E9C]">Duration</span>
                              <span className="text-[#EAECEF] font-medium">{product.duration}D</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {product.cryptos.slice(0, 4).map((c) => (
                                <div 
                                  key={c} 
                                  className="w-7 h-7 rounded-full bg-[#1E2329] border-2 border-[#0B0E11] flex items-center justify-center hover:z-10 transition-all duration-200"
                                  title={c}
                                >
                                  {CRYPTO_ICONS[c]}
                                </div>
                              ))}
                              {product.cryptos.length > 4 && (
                                <div className="w-7 h-7 rounded-full bg-[#1E2329] border-2 border-[#0B0E11] flex items-center justify-center text-[10px] text-[#848E9C]">
                                  +{product.cryptos.length - 4}
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowProductDetails(showProductDetails === product.id ? null : product.id);
                              }}
                              className="p-1.5 hover:bg-[#1E2329] rounded-lg transition-colors"
                            >
                              <Info className="w-4 h-4 text-[#848E9C]" />
                            </button>
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
                                    <li key={i} className="text-xs text-[#EAECEF] flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-400" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-3 text-xs text-[#F0B90B]">
                                  APY: {product.annualReturn}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
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
                        <div className="bg-[#0B0E11] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Product</p>
                          <p className="font-semibold text-[#EAECEF]">{selectedProduct.label}</p>
                        </div>
                        <div className="bg-[#0B0E11] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Tier</p>
                          <p className="font-semibold text-[#F0B90B]">{selectedProduct.tier}</p>
                        </div>
                        <div className="bg-[#0B0E11] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Daily Return</p>
                          <p className="font-semibold text-green-400">{selectedProduct.dailyReturn}</p>
                        </div>
                        <div className="bg-[#0B0E11] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Annual Return</p>
                          <p className="font-semibold text-green-400">{selectedProduct.annualReturn}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Investment Form - Premium Design */}
                <div className="bg-[#0B0E11] rounded-xl p-5 border border-[#2B3139]">
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
                          <button className="p-1 hover:bg-[#2B3139] rounded-lg transition-colors">
                            <ChevronDown className="w-4 h-4 text-[#848E9C]" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full lg:w-auto bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11] font-semibold px-8 h-12 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg shadow-[#F0B90B]/20"
                      onClick={handleStartArbitrage}
                      disabled={!selectedProduct || !investmentAmount || Number(investmentAmount) < (selectedProduct?.minInvestment || 0) || executing}
                    >
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
                    </Button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-[#2B3139]">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#848E9C]" />
                      <span className="text-sm text-[#848E9C]">Available Balance</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#EAECEF]">
                        {hideBalances ? '••••••' : formatCurrency(getBalance('USDT'))} USDT
                      </span>
                      <button 
                        onClick={() => setInvestmentAmount(getBalance('USDT').toString())}
                        className="text-xs text-[#F0B90B] hover:text-[#F0B90B]/80 font-medium"
                      >
                        Max
                      </button>
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
                </div>

                {/* Active Contracts */}
                {activeContracts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                        <Zap className="w-3 h-3 text-[#F0B90B]" />
                      </div>
                      Active Contracts ({activeContracts.length})
                    </h3>
                    
                    <div className="space-y-3">
                      {activeContracts.map((contract) => (
                        <motion.div
                          key={contract.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all duration-300 group"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#F0B90B]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <Zap className="w-5 h-5 text-[#F0B90B]" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#EAECEF]">{contract.productLabel}</p>
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
                              <p className="font-semibold text-[#F0B90B]">{formatTimeRemaining(contract.endTime)}</p>
                            </div>
                            <div className="bg-[#1E2329] rounded-lg p-2.5">
                              <p className="text-xs text-[#848E9C] mb-1">Est. Return</p>
                              <p className="font-semibold text-green-400">
                                +{formatCompactCurrency(contract.amount * contract.dailyRate * contract.dailyRate * 30)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#848E9C]">Progress</span>
                              <span className="text-[#EAECEF]">
                                {Math.round((Date.now() - new Date(contract.startTime).getTime()) / 
                                (new Date(contract.endTime).getTime() - new Date(contract.startTime).getTime()) * 100)}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#1E2329] rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-gradient-to-r from-[#F0B90B] to-yellow-400 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${Math.min(
                                    (Date.now() - new Date(contract.startTime).getTime()) / 
                                    (new Date(contract.endTime).getTime() - new Date(contract.startTime).getTime()) * 100, 
                                    100
                                  )}%` 
                                }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {activeContracts.length === 0 && !selectedProduct && (
                  <EmptyState type="arbitrage" onAction={() => setSelectedProduct(ARBITRAGE_PRODUCTS[0])} />
                )}
              </div>
            </TabsContent>

            {/* Staking Tab */}
            <TabsContent value="staking" className="p-4 sm:p-6">
              <div className="space-y-6">
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
                      Up to 675% APY
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {STAKING_TIERS.map((tier, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/50 transition-all duration-300 group"
                      >
                        <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                          {tier.icon}
                        </div>
                        <p className="text-xs text-[#848E9C] mb-1">Range</p>
                        <p className="text-sm font-semibold text-[#EAECEF] mb-2">{tier.range}</p>
                        
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
                            <div 
                              className={`h-full rounded-full transition-all duration-300 group-hover:opacity-100 opacity-75`}
                              style={{ 
                                width: `${(i + 1) * 20}%`,
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
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Staking Form */}
                <div className="bg-[#0B0E11] rounded-xl p-5 border border-[#2B3139]">
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
                    
                    <Button
                      className="w-full lg:w-auto bg-[#F0B90B] hover:bg-[#F0B90B]/90 text-[#0B0E11] font-semibold px-8 h-12 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg shadow-[#F0B90B]/20"
                      onClick={handleStartStaking}
                      disabled={!stakingAmount || Number(stakingAmount) < 1000 || executing}
                    >
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
                    </Button>
                  </div>

                  {/* Estimated Returns */}
                  {stakingAmount && Number(stakingAmount) >= 1000 && (
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
                        <div className="bg-[#1E2329] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Daily</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCompactCurrency(Number(stakingAmount) * 0.003)}
                          </p>
                        </div>
                        <div className="bg-[#1E2329] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Weekly</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCompactCurrency(Number(stakingAmount) * 0.021)}
                          </p>
                        </div>
                        <div className="bg-[#1E2329] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">Monthly</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCompactCurrency(Number(stakingAmount) * 0.09)}
                          </p>
                        </div>
                        <div className="bg-[#1E2329] rounded-lg p-3">
                          <p className="text-xs text-[#848E9C] mb-1">APY</p>
                          <p className="text-sm font-bold text-[#F0B90B]">~109.5%</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Active Staking Positions */}
                {stakingPositions.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                        <Shield className="w-3 h-3 text-[#F0B90B]" />
                      </div>
                      Active Staking ({stakingPositions.length})
                    </h3>
                    
                    <div className="space-y-3">
                      {stakingPositions.map((position) => (
                        <motion.div
                          key={position.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          layout
                          className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all duration-300 group"
                        >
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
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {stakingPositions.length === 0 && !stakingAmount && (
                  <EmptyState type="staking" onAction={() => setStakingAmount('1000')} />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Auth Warning - Premium Alert */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 p-4">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = '/register'}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30"
                >
                  Register
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRecordsOpen(false)}
                  className="text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139] rounded-lg w-10 h-10 p-0"
                >
                  <X size={20} />
                </Button>
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
                        <div key={contract.id} className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">{contract.productLabel}</span>
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
                              <p className="font-medium text-[#F0B90B]">{formatTimeRemaining(contract.endTime)}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {stakingPositions.map((position) => (
                        <div key={position.id} className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all">
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
                        </div>
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
                        <div key={contract.id} className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                                <Zap className="w-4 h-4 text-[#F0B90B]" />
                              </div>
                              <span className="font-medium text-[#EAECEF]">{contract.productLabel}</span>
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
                              <p className="font-medium text-[#F0B90B]">{new Date(contract.endTime).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {stakingHistory.map((position) => (
                        <div key={position.id} className="bg-[#0B0E11] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all">
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
                        </div>
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
                  <div className="w-20 h-20 rounded-full border-4 border-[#F0B90B] border-t-transparent animate-spin mx-auto mb-6" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#1E2329] rounded-full" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#EAECEF] mb-2">Processing Transaction</h3>
                <p className="text-sm text-[#848E9C]">Please wait while we process your request</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#F0B90B] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                <div className="w-12 h-12 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20">
                  <span className="text-lg font-bold text-[#0B0E11]">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-[#EAECEF]">
                    {user?.first_name && user?.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user?.email || 'User'
                    }
                  </p>
                  <p className="text-xs text-[#848E9C]">{user?.email}</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
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
              </button>
              <button
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
              </button>
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
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <motion.div className="absolute left-0 top-0 bottom-0 w-64 bg-[#1E2329] border-r border-[#2B3139] p-4">
              <div className="flex items-center gap-2 mb-6">
                <SiHiveBlockchain className="text-[#F0B90B] text-2xl" />
                <h2 className="font-bold text-[#EAECEF]">Menu</h2>
              </div>
              
              <div className="space-y-2">
                <button className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3">
                  <Zap className="w-4 h-4 text-[#F0B90B]" />
                  Arbitrage
                </button>
                <button className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3">
                  <Shield className="w-4 h-4 text-[#F0B90B]" />
                  Staking
                </button>
                <button className="w-full px-4 py-3 text-left text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3">
                  <History className="w-4 h-4 text-[#F0B90B]" />
                  History
                </button>
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
    </div>
  );
}