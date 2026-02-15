import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, BarChart3, History, Wallet, 
  TrendingUp, Clock, Award, AlertTriangle, X,
  ChevronRight, Play, Info, RefreshCw, Eye, EyeOff,
  User, LogOut, Settings, Bell, Menu, DollarSign,
  Calendar, PieChart, Activity, ArrowUpRight, ArrowDownLeft
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
  duration: number; // in days
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
  BTC: <FaBitcoin className="text-yellow-500" size={20} />,
  ETH: <FaEthereum className="text-gray-400" size={20} />,
  USDT: <SiTether className="text-green-500" size={20} />,
  SOL: <SiSolana className="text-purple-500" size={20} />,
  BNB: <SiBinance className="text-yellow-400" size={20} />,
  ADA: <SiCardano className="text-blue-500" size={20} />,
  XRP: <SiXrp className="text-blue-400" size={20} />,
  DOT: <SiPolkadot className="text-pink-400" size={20} />
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
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="w-24 h-24 bg-[#2B3139] rounded-full flex items-center justify-center mb-6">
      {type === 'arbitrage' && <Zap className="w-10 h-10 text-[#848E9C]" />}
      {type === 'staking' && <Shield className="w-10 h-10 text-[#848E9C]" />}
    </div>
    <h3 className="text-xl font-bold text-[#EAECEF] mb-2">No Active {type === 'arbitrage' ? 'Arbitrage' : 'Staking'}</h3>
    <p className="text-[#848E9C] text-center mb-6 max-w-sm">
      {type === 'arbitrage' 
        ? 'Start your first arbitrage contract to earn passive income'
        : 'Begin staking your assets to earn daily rewards'
      }
    </p>
    <Button
      onClick={onAction}
      className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-6 py-3 rounded-xl"
    >
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
      
      toast.success(`✅ Arbitrage contract started! You invested ${formatCurrency(amount)}`);

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
        
        toast.success(`🎉 Arbitrage contract completed! You earned ${formatCurrency(profit)}`);
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

      toast.success(`✅ Staking started! You staked ${formatCurrency(amount)} at ${(tier.dailyRate * 100).toFixed(2)}% daily`);

      // Start reward accumulation
      const interval = setInterval(async () => {
        setStakingPositions(prev => 
          prev.map(pos => 
            pos.id === positionId
              ? { ...pos, accumulatedRewards: pos.accumulatedRewards + (amount * tier.dailyRate / 86400) }
              : pos
          )
        );
      }, 1000); // Update every second for smooth counter

      // Schedule unstaking (30 days)
      setTimeout(async () => {
        clearInterval(interval);
        
        const position = stakingPositions.find(p => p.id === positionId);
        if (position) {
          const totalReturn = amount + position.accumulatedRewards;
          
          // Update position status
          setStakingPositions(prev => prev.filter(p => p.id !== positionId));
          setStakingHistory(prev => [{
            ...position,
            status: 'completed'
          }, ...prev]);

          // Return funds + rewards
          await unlockBalance('USDT', amount, positionId);
          await addBalance('USDT', position.accumulatedRewards, 'staking_reward', `${positionId}_reward`);

          toast.success(`🎉 Staking completed! You earned ${formatCurrency(position.accumulatedRewards)}`);
        }
      }, 30 * 24 * 60 * 60 * 1000); // 30 days

      // Clear form
      setStakingAmount('');

    } catch (error) {
      console.error('Failed to start staking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start staking');
    } finally {
      setExecuting(false);
    }
  }, [isAuthenticated, stakingAmount, getBalance, lockBalance, unlockBalance, addBalance, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] to-[#1A1D24]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 text-[#848E9C]" />
              </button>
              
              <div className="flex items-center gap-2">
                <SiHiveBlockchain className="text-[#F0B90B] text-2xl" />
                <h1 className="text-xl font-bold text-[#F0B90B] hidden sm:block">Arbitrage Pro</h1>
              </div>

              {/* Active Windows */}
              {activeWindows.length > 0 && countdown && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 ml-4 hidden md:flex">
                  <Clock className="w-3 h-3 mr-1" />
                  {countdown}
                </Badge>
              )}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              >
                {hideBalances ? <EyeOff className="w-5 h-5 text-[#848E9C]" /> : <Eye className="w-5 h-5 text-[#848E9C]" />}
              </button>

              <button
                onClick={() => setRecordsOpen(true)}
                className="p-2 hover:bg-[#23262F] rounded-lg transition-colors relative"
              >
                <History className="w-5 h-5 text-[#848E9C]" />
                {(activeContracts.length + stakingPositions.length) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F0B90B] rounded-full text-[10px] flex items-center justify-center text-[#181A20] font-bold">
                    {activeContracts.length + stakingPositions.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center hover:scale-105 transition-all"
              >
                <span className="text-sm font-bold text-[#181A20]">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 lg:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Invested</p>
                <p className="text-xl font-bold text-[#EAECEF]">
                  {hideBalances ? '••••••' : formatCurrency(stats.totalInvested)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#F0B90B] opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Total Earned</p>
                <p className="text-xl font-bold text-green-400">
                  {hideBalances ? '••••••' : formatCurrency(stats.totalEarned)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Active Contracts</p>
                <p className="text-xl font-bold text-[#F0B90B]">{stats.activeContracts + stats.activeStaking}</p>
              </div>
              <Zap className="w-8 h-8 text-[#F0B90B] opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#848E9C]">Avg Daily Return</p>
                <p className="text-xl font-bold text-green-400">{stats.avgDailyReturn.toFixed(2)}%</p>
              </div>
              <Activity className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Main Trading Card */}
        <Card className="bg-[#1E2329] border-[#2B3139] overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <div className="border-b border-[#2B3139] px-6 pt-4">
              <TabsList className="inline-flex gap-2 bg-[#181A20] p-1 rounded-xl">
                <TabsTrigger 
                  value="arbitrage" 
                  className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Arbitrage
                </TabsTrigger>
                <TabsTrigger 
                  value="staking" 
                  className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Staking
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Arbitrage Tab */}
            <TabsContent value="arbitrage" className="p-6">
              <div className="space-y-6">
                {/* Products Grid */}
                <div>
                  <h2 className="text-lg font-bold text-[#EAECEF] mb-4 flex items-center gap-2">
                    <Zap className="text-[#F0B90B]" />
                    Arbitrage Products
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ARBITRAGE_PRODUCTS.map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`border rounded-xl p-5 bg-[#181A20] transition-all cursor-pointer ${
                          selectedProduct?.id === product.id 
                            ? 'border-[#F0B90B] ring-1 ring-[#F0B90B] shadow-lg shadow-[#F0B90B]/20' 
                            : 'border-[#2B3139] hover:border-[#F0B90B]/50'
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-[#EAECEF]">{product.label}</span>
                          <Badge className={
                            product.risk === 'Low' ? 'bg-green-500/20 text-green-400' :
                            product.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }>
                            {product.risk} Risk
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#848E9C]">Min Investment</span>
                            <span className="text-[#EAECEF] font-medium">{formatCurrency(product.minInvestment)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#848E9C]">Daily Return</span>
                            <span className="text-green-400 font-medium">{product.dailyReturn}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#848E9C]">Duration</span>
                            <span className="text-[#EAECEF] font-medium">{product.duration} Day{product.duration > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {product.cryptos.map((c) => (
                            <div key={c} className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center">
                              {CRYPTO_ICONS[c]}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Selected Product Summary */}
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#181A20] rounded-xl p-5 border border-[#F0B90B]"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-[#848E9C] mb-1">Product</p>
                        <p className="font-bold text-[#EAECEF]">{selectedProduct.label}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#848E9C] mb-1">Tier</p>
                        <p className="font-bold text-[#F0B90B]">{selectedProduct.tier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#848E9C] mb-1">Daily Return</p>
                        <p className="font-bold text-green-400">{selectedProduct.dailyReturn}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#848E9C] mb-1">Annual Return</p>
                        <p className="font-bold text-green-400">{selectedProduct.annualReturn}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#2B3139]">
                      <p className="text-sm text-[#848E9C]">{selectedProduct.features.join(' • ')}</p>
                    </div>
                  </motion.div>
                )}

                {/* Investment Form */}
                <div className="bg-[#181A20] rounded-xl p-5">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-[#848E9C] mb-1 block">Investment Amount (USDT)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder={selectedProduct ? `Min ${formatCurrency(selectedProduct.minInvestment)}` : 'Select a product'}
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-16"
                          disabled={!selectedProduct}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                      </div>
                    </div>
                    <Button
                      className="w-full md:w-auto bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-8 h-12 rounded-xl text-base disabled:opacity-50"
                      onClick={handleStartArbitrage}
                      disabled={!selectedProduct || !investmentAmount || Number(investmentAmount) < (selectedProduct?.minInvestment || 0) || executing}
                    >
                      {executing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Start Arbitrage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-[#848E9C]">Available Balance</span>
                    <span className="font-bold text-[#EAECEF]">
                      {hideBalances ? '••••••' : formatCurrency(getBalance('USDT'))} USDT
                    </span>
                  </div>
                  
                  {selectedProduct && investmentAmount && Number(investmentAmount) < selectedProduct.minInvestment && (
                    <div className="mt-2 text-[#F0B90B] text-xs bg-[#F0B90B]/10 rounded-lg p-2">
                      ⚠️ Minimum investment is {formatCurrency(selectedProduct.minInvestment)}
                    </div>
                  )}
                </div>

                {/* Active Contracts */}
                {activeContracts.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-[#EAECEF] mb-3 flex items-center gap-2">
                      <Zap className="text-[#F0B90B]" />
                      Active Contracts ({activeContracts.length})
                    </h3>
                    <div className="space-y-3">
                      {activeContracts.map((contract) => (
                        <motion.div
                          key={contract.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                                <Zap className="text-[#F0B90B] text-sm" />
                              </div>
                              <div>
                                <p className="font-bold text-[#EAECEF]">{contract.productLabel}</p>
                                <p className="text-xs text-[#848E9C]">ID: {contract.id.slice(0, 8)}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Amount</p>
                              <p className="font-semibold text-[#EAECEF]">{formatCurrency(contract.amount)}</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Daily Rate</p>
                              <p className="font-semibold text-green-400">{(contract.dailyRate * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Time Remaining</p>
                              <p className="font-semibold text-[#F0B90B]">{formatTimeRemaining(contract.endTime)}</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Est. Return</p>
                              <p className="font-semibold text-green-400">
                                +{formatCurrency(contract.amount * contract.dailyRate * 30)}
                              </p>
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
            <TabsContent value="staking" className="p-6">
              <div className="space-y-6">
                {/* Staking Tiers */}
                <div>
                  <h2 className="text-lg font-bold text-[#EAECEF] mb-4 flex items-center gap-2">
                    <Shield className="text-[#F0B90B]" />
                    Staking Tiers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {STAKING_TIERS.map((tier, i) => (
                      <Card key={i} className="bg-[#181A20] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all">
                        <div className="text-3xl mb-3">{tier.icon}</div>
                        <p className="text-sm text-[#848E9C] mb-1">Range</p>
                        <p className="text-sm font-bold text-[#EAECEF] mb-2">{tier.range}</p>
                        <p className="text-xs text-[#848E9C] mb-1">Daily Rate</p>
                        <p className="text-base font-bold text-green-400">{(tier.dailyRate * 100).toFixed(2)}%</p>
                        <p className="text-xs text-[#848E9C] mt-2">APY: {(tier.annualRate).toFixed(1)}%</p>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Staking Form */}
                <div className="bg-[#181A20] rounded-xl p-5">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-[#848E9C] mb-1 block">Staking Amount (USDT)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Enter amount (min $1,000)"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.value)}
                          className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                      </div>
                    </div>
                    <Button
                      className="w-full md:w-auto bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-8 h-12 rounded-xl text-base disabled:opacity-50"
                      onClick={handleStartStaking}
                      disabled={!stakingAmount || Number(stakingAmount) < 1000 || executing}
                    >
                      {executing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="w-4 h-4 mr-2" />
                      )}
                      Start Staking
                    </Button>
                  </div>

                  {stakingAmount && Number(stakingAmount) >= 1000 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-4 bg-[#23262F] rounded-lg"
                    >
                      <p className="text-sm font-medium text-[#EAECEF] mb-3">Estimated Returns (30 days)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-[#848E9C] mb-1">Daily</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(Number(stakingAmount) * 0.003)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#848E9C] mb-1">Weekly</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(Number(stakingAmount) * 0.021)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#848E9C] mb-1">Monthly</p>
                          <p className="text-sm font-bold text-green-400">
                            +{formatCurrency(Number(stakingAmount) * 0.09)}
                          </p>
                        </div>
                        <div>
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
                    <h3 className="text-sm font-semibold text-[#EAECEF] mb-3 flex items-center gap-2">
                      <Shield className="text-[#F0B90B]" />
                      Active Staking ({stakingPositions.length})
                    </h3>
                    <div className="space-y-3">
                      {stakingPositions.map((position) => (
                        <motion.div
                          key={position.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                                <Shield className="text-[#F0B90B] text-sm" />
                              </div>
                              <div>
                                <p className="font-bold text-[#EAECEF]">Node Staking</p>
                                <p className="text-xs text-[#848E9C]">ID: {position.id.slice(0, 8)}</p>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Staked</p>
                              <p className="font-semibold text-[#EAECEF]">{formatCurrency(position.amount)}</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Daily Rate</p>
                              <p className="font-semibold text-green-400">{(position.dailyRate * 100).toFixed(2)}%</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Accumulated</p>
                              <p className="font-semibold text-green-400">+{formatCurrency(position.accumulatedRewards)}</p>
                            </div>
                            <div className="bg-[#23262F] rounded-lg p-2">
                              <p className="text-xs text-[#848E9C] mb-1">Duration</p>
                              <p className="font-semibold text-[#F0B90B]">30 Days</p>
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

        {/* Auth Warning */}
        {!isAuthenticated && (
          <Card className="mt-6 bg-yellow-500/10 border border-yellow-500/30 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                You're in view-only mode. <button onClick={() => window.location.href = '/login'} className="underline hover:text-yellow-300">Login</button> to start arbitrage and staking.
              </p>
            </div>
          </Card>
        )}
      </main>

      {/* Records Modal */}
      <Dialog open={recordsOpen} onClose={() => setRecordsOpen(false)}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1E2329] border-[#F0B90B] max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2B3139]">
              <h2 className="text-xl font-bold text-[#EAECEF] flex items-center gap-2">
                <History className="text-[#F0B90B]" />
                Transaction History
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRecordsOpen(false)}
                className="text-[#848E9C] hover:text-[#EAECEF]"
              >
                <X size={20} />
              </Button>
            </div>
            
            <div className="p-6">
              <Tabs value={recordsTab} onValueChange={setRecordsTab} className="w-full">
                <TabsList className="grid grid-cols-2 w-full bg-[#181A20] p-1 rounded-xl mb-6">
                  <TabsTrigger value="active" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Active ({activeContracts.length + stakingPositions.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    History ({contractHistory.length + stakingHistory.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {activeContracts.map((contract) => (
                      <div key={contract.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="text-[#F0B90B]" />
                            <span className="font-medium text-[#EAECEF]">{contract.productLabel}</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-[#848E9C]">Amount</span>
                            <p className="font-medium text-[#EAECEF]">{formatCurrency(contract.amount)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Returns</span>
                            <p className="font-medium text-green-400">{(contract.dailyRate * 100).toFixed(2)}% daily</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Remaining</span>
                            <p className="font-medium text-[#F0B90B]">{formatTimeRemaining(contract.endTime)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {stakingPositions.map((position) => (
                      <div key={position.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="text-[#F0B90B]" />
                            <span className="font-medium text-[#EAECEF]">Node Staking</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-[#848E9C]">Staked</span>
                            <p className="font-medium text-[#EAECEF]">{formatCurrency(position.amount)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Earned</span>
                            <p className="font-medium text-green-400">+{formatCurrency(position.accumulatedRewards)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Daily Rate</span>
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
                  <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {contractHistory.map((contract) => (
                      <div key={contract.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="text-[#F0B90B]" />
                            <span className="font-medium text-[#EAECEF]">{contract.productLabel}</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-[#848E9C]">Invested</span>
                            <p className="font-medium text-[#EAECEF]">{formatCurrency(contract.amount)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Profit</span>
                            <p className="font-medium text-green-400">+{formatCurrency(contract.pnl || 0)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Date</span>
                            <p className="font-medium text-[#F0B90B]">{new Date(contract.endTime).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {stakingHistory.map((position) => (
                      <div key={position.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Shield className="text-[#F0B90B]" />
                            <span className="font-medium text-[#EAECEF]">Node Staking</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">Completed</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-[#848E9C]">Staked</span>
                            <p className="font-medium text-[#EAECEF]">{formatCurrency(position.amount)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Earned</span>
                            <p className="font-medium text-green-400">+{formatCurrency(position.accumulatedRewards)}</p>
                          </div>
                          <div>
                            <span className="text-[#848E9C]">Date</span>
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
        </div>
      </Dialog>

      {/* Loading Overlay */}
      <AnimatePresence>
        {executing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <Card className="bg-[#1E2329] border-[#F0B90B] p-6 max-w-sm">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#F0B90B] border-t-transparent animate-spin mb-4" />
                <p className="text-[#EAECEF] font-medium mb-2">Processing Transaction</p>
                <p className="text-xs text-[#848E9C] text-center">Please wait while we process your request</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 w-72 bg-[#1E2329] border border-[#2B3139] rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 border-b border-[#2B3139]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-xl flex items-center justify-center">
                  <span className="text-lg font-bold text-[#181A20]">
                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[#EAECEF]">
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
                className="w-full px-4 py-3 text-left text-sm text-[#EAECEF] hover:bg-[#2B3139] rounded-lg transition-colors flex items-center gap-3"
              >
                <User className="w-4 h-4 text-[#848E9C]" />
                Profile Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
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
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
      `}</style>
    </div>
  );
}