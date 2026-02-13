import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import apiService from '@/services/api';
import { 
  FaBitcoin, 
  FaEthereum, 
  FaChartLine, 
  FaClock, 
  FaHistory, 
  FaWallet, 
  FaExchangeAlt,
  FaCog,
  FaArrowUp,
  FaArrowDown,
  FaPlay,
  FaStopwatch
} from 'react-icons/fa';
import { 
  SiTether, 
  SiSolana, 
  SiBinance, 
  SiCardano, 
  SiXrp, 
  SiPolkadot,
  SiHiveBlockchain 
} from 'react-icons/si';
import { Dialog } from '@headlessui/react';
import { X, TrendingUp, Shield, Zap, BarChart3, DollarSign, Calendar, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import TradingViewWidget from '@/components/TradingViewWidget';
import useBinanceStream from '@/hooks/useBinanceStream';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== TYPES ====================
interface ArbitrageProduct {
  id: string;
  label: string;
  tier: string;
  purchaseLimit: string;
  investmentRange: string;
  dailyIncome: string;
  cryptos: string[];
  min: number;
}

interface StakingTier {
  range: string;
  yield: string;
  icon: string;
}

interface TradingPair {
  label: string;
  price: number;
  icon: React.ElementType;
  color: string;
}

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  exchangeA: string;
  priceA: number;
  exchangeB: string;
  priceB: number;
  diff: number;
  liquidity: number;
}

// ==================== CONSTANTS ====================
const arbitrageProducts: ArbitrageProduct[] = [
  { id: 'arb-1d', label: '1 Day', tier: 'Basic', purchaseLimit: '$1,000', investmentRange: '$1,000 – $9,999', dailyIncome: '0.80% – 1.00%', cryptos: ['USDT', 'BTC', 'ETH'], min: 1000 },
  { id: 'arb-3d', label: '3 Days', tier: 'Bronze', purchaseLimit: '$5,000', investmentRange: '$5,000 – $49,999', dailyIncome: '1.01% – 1.19%', cryptos: ['USDT', 'BTC', 'ETH', 'SOL'], min: 5000 },
  { id: 'arb-7d', label: '7 Days', tier: 'Silver', purchaseLimit: '$10,000', investmentRange: '$10,000 – $99,999', dailyIncome: '1.20% – 1.29%', cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB'], min: 10000 },
  { id: 'arb-10d', label: '10 Days', tier: 'Gold', purchaseLimit: '$25,000', investmentRange: '$25,000 – $199,999', dailyIncome: '1.30% – 1.49%', cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA'], min: 25000 },
  { id: 'arb-15d', label: '15 Days', tier: 'Platinum', purchaseLimit: '$50,000', investmentRange: '$50,000 – $499,999', dailyIncome: '1.40% – 1.49%', cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP'], min: 50000 },
  { id: 'arb-25d', label: '25 Days', tier: 'Diamond', purchaseLimit: '$100,000', investmentRange: '$100,000 – $999,999', dailyIncome: '1.45% – 1.49%', cryptos: ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT'], min: 100000 },
];

const stakingTiers: StakingTier[] = [
  { range: '1,000–10,000', yield: '0.10%–0.30%', icon: '🌱' },
  { range: '10,000–50,000', yield: '0.30%–0.70%', icon: '🌿' },
  { range: '50,000–200,000', yield: '0.75%–1.20%', icon: '🌳' },
  { range: '200,000–500,000', yield: '1.30%–1.80%', icon: '🌲' },
  { range: '500,000–9,999,999', yield: '1.85%–2.80%', icon: '🏆' },
];

const tradingPairs: TradingPair[] = [
  { label: 'BTC/USDT', price: 67000, icon: FaBitcoin, color: 'text-yellow-500' },
  { label: 'ETH/USDT', price: 3200, icon: FaEthereum, color: 'text-gray-400' },
  { label: 'SOL/USDT', price: 150, icon: SiSolana, color: 'text-purple-500' },
];

const timeRanges: number[] = [60, 120, 240, 360, 600];

// ==================== HELPER FUNCTIONS ====================
const getCryptoIcon = (symbol: string): React.ReactNode => {
  switch (symbol) {
    case 'BTC': return <FaBitcoin className="text-yellow-500" title="BTC" size={20} />;
    case 'ETH': return <FaEthereum className="text-gray-400" title="ETH" size={20} />;
    case 'USDT': return <SiTether className="text-green-500" title="USDT" size={20} />;
    case 'SOL': return <SiSolana className="text-purple-500" title="SOL" size={20} />;
    case 'BNB': return <SiBinance className="text-yellow-400" title="BNB" size={20} />;
    case 'ADA': return <SiCardano className="text-blue-500" title="ADA" size={20} />;
    case 'XRP': return <SiXrp className="text-blue-400" title="XRP" size={20} />;
    case 'DOT': return <SiPolkadot className="text-pink-400" title="DOT" size={20} />;
    default: return null;
  }
};

const getArbitrageDuration = (label: string): number => {
  if (label.includes('1 Day')) return 24 * 60 * 60 * 1000;
  if (label.includes('3 Days')) return 3 * 24 * 60 * 60 * 1000;
  if (label.includes('7 Days')) return 7 * 24 * 60 * 60 * 1000;
  if (label.includes('10 Days')) return 10 * 24 * 60 * 60 * 1000;
  if (label.includes('15 Days')) return 15 * 24 * 60 * 60 * 1000;
  if (label.includes('25 Days')) return 25 * 24 * 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
};

const formatDuration = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const calculateStakingRate = (amount: number): number => {
  if (amount >= 1000 && amount < 10000) return 0.002;
  if (amount >= 10000 && amount < 50000) return 0.005;
  if (amount >= 50000 && amount < 200000) return 0.00975;
  if (amount >= 200000 && amount < 500000) return 0.0155;
  if (amount >= 500000) return 0.02325;
  return 0.001;
};

// ==================== EMPTY RECORDS COMPONENT ====================
const EmptyRecords = ({ onClose }: { onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12"
  >
    <div className="w-20 h-20 bg-[#2B3139] rounded-full flex items-center justify-center mb-4">
      <FaHistory className="text-[#848E9C] text-3xl" />
    </div>
    <div className="text-xl font-bold text-[#EAECEF] mb-2">No Records Yet</div>
    <div className="text-sm text-[#848E9C] text-center mb-6 max-w-[240px]">
      Start your first transaction to see your trading history here
    </div>
    <Button
      className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-6 py-3 rounded-xl"
      onClick={onClose}
    >
      Get Started
    </Button>
  </motion.div>
);

// ==================== MAIN COMPONENT ====================
export default function ArbitragePage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { 
    balances, 
    transactions, 
    orders, 
    executeArbitrage, 
    executeStaking, 
    executeTrade,
    getTransactionHistory 
  } = useWallet();

  // State
  const [activeTab, setActiveTab] = useState('quant');
  const [selectedProduct, setSelectedProduct] = useState<ArbitrageProduct | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedPair, setSelectedPair] = useState<TradingPair>(tradingPairs[0]);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [tradeTime, setTradeTime] = useState(60);
  const [tradeAmount, setTradeAmount] = useState('');
  const [price, setPrice] = useState(selectedPair.price);
  const [tradeTab, setTradeTab] = useState('active');
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [recordsTab, setRecordsTab] = useState('arbitrage');
  const [historyTab, setHistoryTab] = useState('arbitrage');
  const [tick, setTick] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const btcusdtTrade = useBinanceStream('btcusdt', 'trade');
  const realBtcPrice = btcusdtTrade?.p ? parseFloat(btcusdtTrade.p) : price;

  // Live price simulation
  useEffect(() => {
    setPrice(selectedPair.price);
    const interval = setInterval(() => {
      setPrice((p) => parseFloat((p + (Math.random() - 0.5) * (selectedPair.price * 0.001)).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Timer for live updates
  useEffect(() => {
    timerRef.current = setInterval(() => setTick(t => t + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Fetch arbitrage opportunities
  const PAIRS = ['BTCUSDT', 'ETHUSDT'];
  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const prices = await apiService.getMultiExchangePrices(PAIRS);
      const opps: ArbitrageOpportunity[] = [];
      
      for (const pair of PAIRS) {
        const priceMap: Record<string, number> = {};
        for (const ex in prices) {
          if (prices[ex][pair]) priceMap[ex] = prices[ex][pair];
        }
        const exchanges = Object.keys(priceMap);
        
        for (let i = 0; i < exchanges.length; i++) {
          for (let j = 0; j < exchanges.length; j++) {
            if (i !== j) {
              const a = exchanges[i];
              const b = exchanges[j];
              const diff = priceMap[b] - priceMap[a];
              if (diff > 1) {
                opps.push({
                  id: `${pair}-${a}-${b}`,
                  pair,
                  exchangeA: a,
                  priceA: priceMap[a],
                  exchangeB: b,
                  priceB: priceMap[b],
                  diff,
                  liquidity: 0.5,
                });
              }
            }
          }
        }
      }
      setOpportunities(opps);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
      setOpportunities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleStartArbitrage = async () => {
    if (!isAuthenticated) {
      toast({ 
        title: '🔒 Authentication Required', 
        description: 'Please login to place arbitrage trades.', 
        variant: 'destructive' 
      });
      return;
    }

    if (!selectedProduct || !investmentAmount) {
      toast({ 
        title: 'Error', 
        description: 'Select a package and enter amount.', 
        variant: 'destructive' 
      });
      return;
    }
    
    const amount = Number(investmentAmount);
    if (amount < selectedProduct.min) {
      toast({ 
        title: 'Error', 
        description: `Minimum amount for this product is $${selectedProduct.min.toLocaleString()}.`, 
        variant: 'destructive' 
      });
      return;
    }
    
    if (amount > balances.USDT) {
      toast({ 
        title: 'Error', 
        description: 'Insufficient USDT balance.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setExecuting(true);
    setMessage('Processing arbitrage contract...');
    
    try {
      const duration = getArbitrageDuration(selectedProduct.label);
      const transaction = await executeArbitrage({
        product: selectedProduct.label,
        amount,
        duration: duration / 1000 // Convert to seconds
      });
      
      toast({ 
        title: '✅ Arbitrage Started', 
        description: `Contract #${transaction.id} activated with $${amount.toLocaleString()}` 
      });
      setInvestmentAmount('');
      setSelectedProduct(null);
    } catch (error) {
      toast({ 
        title: '❌ Error', 
        description: error instanceof Error ? error.message : 'Failed to start arbitrage', 
        variant: 'destructive' 
      });
    } finally {
      setExecuting(false);
      setMessage('');
    }
  };

  const handleStartStaking = async () => {
    if (!isAuthenticated) {
      toast({ 
        title: '🔒 Authentication Required', 
        description: 'Please login to place staking investments.', 
        variant: 'destructive' 
      });
      return;
    }

    const amount = Number(stakingAmount);
    
    if (!stakingAmount || isNaN(amount) || amount <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Enter a valid staking amount.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (amount > balances.USDT) {
      toast({ 
        title: 'Error', 
        description: 'Insufficient USDT balance.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setExecuting(true);
    setMessage('Processing staking contract...');
    
    try {
      const rate = calculateStakingRate(amount);
      const transaction = await executeStaking({
        asset: 'USDT',
        amount,
        duration: 30 * 24 * 60 * 60, // 30 days in seconds
        apy: rate * 365 * 100 // Convert daily rate to APY percentage
      });
      
      toast({ 
        title: '✅ Staking Started', 
        description: `$${amount.toLocaleString()} staked for 30 days at ${(rate * 100).toFixed(2)}% daily` 
      });
      setStakingAmount('');
    } catch (error) {
      toast({ 
        title: '❌ Error', 
        description: error instanceof Error ? error.message : 'Failed to start staking', 
        variant: 'destructive' 
      });
    } finally {
      setExecuting(false);
      setMessage('');
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast({ 
        title: '🔒 Authentication Required', 
        description: 'Please login to place trades.', 
        variant: 'destructive' 
      });
      return;
    }

    const amount = Number(tradeAmount);
    
    if (!tradeAmount || isNaN(amount) || amount <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Enter a valid trade amount.', 
        variant: 'destructive' 
      });
      return;
    }
    
    if (amount > balances.USDT) {
      toast({ 
        title: 'Error', 
        description: 'Insufficient USDT balance.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setExecuting(true);
    setMessage('Processing trade...');
    
    try {
      const [baseAsset] = selectedPair.label.split('/');
      const transaction = await executeTrade({
        type: 'options',
        pair: selectedPair.label,
        side: direction === 'up' ? 'call' : 'put',
        amount,
        price: selectedPair.price,
        expiry: tradeTime
      });
      
      toast({ 
        title: '✅ Trade Executed', 
        description: `${direction.toUpperCase()} option on ${selectedPair.label} for $${amount.toLocaleString()}` 
      });
      setTradeAmount('');
    } catch (error) {
      toast({ 
        title: '❌ Error', 
        description: error instanceof Error ? error.message : 'Failed to execute trade', 
        variant: 'destructive' 
      });
    } finally {
      setExecuting(false);
      setMessage('');
    }
  };

  const handleArb = (opp: ArbitrageOpportunity) => {
    setExecuting(true);
    setMessage('');
    
    // Simulate arbitrage execution
    setTimeout(() => {
      setExecuting(false);
      
      // 50% win rate for manual arbitrage
      const isWin = Math.random() < 0.5;
      const profit = isWin ? opp.diff * opp.liquidity : -opp.diff * opp.liquidity;
      
      setHistory(prev => [
        {
          ...opp,
          profit,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);
      
      setMessage(`Arbitrage executed! ${isWin ? 'Profit' : 'Loss'}: $${Math.abs(profit).toFixed(2)}`);
      setMessageType(isWin ? 'success' : 'error');
      
      toast({ 
        title: isWin ? '✅ Arbitrage Profitable' : '❌ Arbitrage Loss', 
        description: `${isWin ? 'Profit' : 'Loss'}: $${Math.abs(profit).toFixed(2)}`,
        variant: isWin ? 'default' : 'destructive'
      });
    }, 1500);
  };

  // Filter transactions by type
  const arbitrageTransactions = transactions.filter(t => t.type === 'Arbitrage');
  const stakingTransactions = transactions.filter(t => t.type === 'Staking');
  const tradeTransactions = transactions.filter(t => t.type === 'Trade' || t.type === 'Options');

  return (
    <div className="min-h-screen bg-[#181A20] pb-20">
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
                <p className="text-[#EAECEF] font-medium mb-2">{message || 'Processing...'}</p>
                <p className="text-xs text-[#848E9C]">Please wait while we process your transaction</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Only Mode Banner for Unauthenticated Users */}
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mx-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-400">View Only Mode</p>
              <p className="text-xs text-yellow-300 mt-1">You're viewing the arbitrage interface in read-only mode. <a href="/login" className="underline hover:text-yellow-200">Login</a> to place real trades.</p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139] lg:hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SiHiveBlockchain className="text-[#F0B90B] text-2xl" />
            <h1 className="text-lg font-bold text-[#F0B90B]">Arbitrage Pro</h1>
          </div>
          <Button
            size="sm"
            className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold rounded-xl"
            onClick={() => setRecordsOpen(true)}
          >
            <FaHistory className="mr-2" />
            Records
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SiHiveBlockchain className="text-[#F0B90B] text-3xl" />
            <h1 className="text-3xl font-bold text-[#F0B90B]">Arbitrage Trading</h1>
          </div>
          <Button
            className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-8 py-3 rounded-xl text-lg"
            onClick={() => setRecordsOpen(true)}
          >
            <FaHistory className="mr-2" />
            Records
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
        {/* Quick Stats - Mobile */}
        <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
          <Card className="bg-[#23262F] border border-[#2B3139] p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaWallet className="text-[#F0B90B] text-xs" />
              <span className="text-xs text-[#848E9C]">Balance</span>
            </div>
            <div className="font-bold text-[#EAECEF] text-sm">{balances.USDT.toLocaleString()} USDT</div>
          </Card>
          <Card className="bg-[#23262F] border border-[#2B3139] p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaExchangeAlt className="text-[#F0B90B] text-xs" />
              <span className="text-xs text-[#848E9C]">Active</span>
            </div>
            <div className="font-bold text-[#EAECEF] text-sm">
              {orders.arbitrage.filter((r: any) => r.status === 'active').length + 
               orders.spot.filter((r: any) => r.status === 'open').length} Trades
            </div>
          </Card>
          <Card className="bg-[#23262F] border border-[#2B3139] p-3">
            <div className="flex items-center gap-2 mb-1">
              <FaChartLine className="text-[#F0B90B] text-xs" />
              <span className="text-xs text-[#848E9C]">24h PnL</span>
            </div>
            <div className="font-bold text-green-400 text-sm">+$1,234.56</div>
          </Card>
        </div>

        {/* Main Trading Card */}
        <Card className="bg-[#23262F] rounded-2xl shadow border border-[#2B3139] overflow-hidden mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tabs */}
            <div className="lg:hidden px-4 pt-4">
              <TabsList className="grid grid-cols-3 w-full bg-[#181A20] p-1 rounded-xl">
                <TabsTrigger 
                  value="quant" 
                  className={`text-xs md:text-sm py-2.5 rounded-lg font-bold ${
                    activeTab === 'quant' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#EAECEF]'
                  }`}
                >
                  <Zap className="w-4 h-4 mr-1 inline" />
                  Quant
                </TabsTrigger>
                <TabsTrigger 
                  value="staking" 
                  className={`text-xs md:text-sm py-2.5 rounded-lg font-bold ${
                    activeTab === 'staking' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#EAECEF]'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-1 inline" />
                  Staking
                </TabsTrigger>
                <TabsTrigger 
                  value="options" 
                  className={`text-xs md:text-sm py-2.5 rounded-lg font-bold ${
                    activeTab === 'options' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#EAECEF]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 mr-1 inline" />
                  Options
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden lg:block border-b border-[#2B3139] px-6 pt-6">
              <TabsList className="inline-flex gap-2 bg-[#181A20] p-1 rounded-xl">
                <TabsTrigger value="quant" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Quant Trading
                </TabsTrigger>
                <TabsTrigger value="staking" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Node Staking
                </TabsTrigger>
                <TabsTrigger value="options" className="px-6 py-2.5 rounded-lg font-bold data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                  Options Trading
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Quant Trading Content */}
            <TabsContent value="quant" className="p-4 lg:p-6">
              <div className="space-y-6">
                {/* Products Grid */}
                <div>
                  <h2 className="text-lg lg:text-xl font-bold mb-4 text-[#F0B90B] flex items-center gap-2">
                    <Zap size={20} />
                    Arbitrage Products
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
                    {arbitrageProducts.map((prod) => (
                      <motion.div
                        key={prod.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`border rounded-xl p-4 bg-[#181A20] transition-all cursor-pointer ${
                          selectedProduct?.id === prod.id 
                            ? 'border-[#F0B90B] ring-1 ring-[#F0B90B] shadow-lg shadow-[#F0B90B]/20' 
                            : 'border-[#2B3139] hover:border-[#F0B90B]/50'
                        }`}
                        onClick={() => setSelectedProduct(prod)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-[#EAECEF]">{prod.label}</span>
                          <Badge className="bg-[#F0B90B] text-[#181A20] font-bold text-xs">
                            {prod.tier}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#848E9C]">Range</span>
                            <span className="text-[#EAECEF] font-medium">{prod.investmentRange}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#848E9C]">Daily Income</span>
                            <span className="text-green-400 font-medium">{prod.dailyIncome}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-3">
                          {prod.cryptos.map((c) => (
                            <span key={c} className="text-xl">{getCryptoIcon(c)}</span>
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
                    className="bg-[#181A20] rounded-xl p-4 border border-[#F0B90B]"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-[#848E9C] mb-1">Product</div>
                        <div className="font-bold text-[#EAECEF]">{selectedProduct.label}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C] mb-1">Tier</div>
                        <div className="font-bold text-[#F0B90B]">{selectedProduct.tier}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C] mb-1">Daily Income</div>
                        <div className="font-bold text-green-400">{selectedProduct.dailyIncome}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C] mb-1">Min Investment</div>
                        <div className="font-bold text-[#EAECEF]">${selectedProduct.min.toLocaleString()}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Investment Form */}
                <div className="bg-[#181A20] rounded-xl p-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-[#848E9C] mb-1 block">Investment Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder={selectedProduct ? `Min $${selectedProduct.min.toLocaleString()}` : 'Select a product'}
                        value={investmentAmount}
                        onChange={e => setInvestmentAmount(e.target.value)}
                        className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
                        disabled={!selectedProduct}
                      />
                    </div>
                    <Button
                      className="w-full md:w-auto bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-8 h-12 rounded-xl text-base"
                      onClick={handleStartArbitrage}
                      disabled={!selectedProduct || !investmentAmount || Number(investmentAmount) < (selectedProduct?.min || 0) || executing}
                    >
                      <FaPlay className="mr-2 text-xs" />
                      Start Arbitrage
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="text-[#848E9C]">Available Balance</span>
                    <span className="font-bold text-[#EAECEF]">{balances.USDT.toLocaleString()} USDT</span>
                  </div>
                  
                  {selectedProduct && investmentAmount && Number(investmentAmount) < selectedProduct.min && (
                    <div className="mt-2 text-[#F0B90B] text-xs bg-[#F0B90B]/10 rounded-lg p-2">
                      ⚠️ Minimum amount for this product is ${selectedProduct.min.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Node Staking Content */}
            <TabsContent value="staking" className="p-4 lg:p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="text-[#F0B90B] text-xl" />
                  <h2 className="text-lg lg:text-xl font-bold text-[#F0B90B]">Node Staking</h2>
                  <Badge className="bg-[#F0B90B] text-[#181A20] font-bold">APY up to 2.8%</Badge>
                </div>

                {/* Wallet Balance Card */}
                <Card className="bg-gradient-to-br from-[#181A20] to-[#23262F] border border-[#2B3139] p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                        <FaWallet className="text-[#F0B90B] text-lg" />
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C]">USDT Wallet Balance</div>
                        <div className="text-xl font-bold text-[#EAECEF]">{balances.USDT.toLocaleString()} USDT</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#848E9C]">Est. Daily</div>
                      <div className="text-sm font-bold text-green-400">
                        +${(balances.USDT * calculateStakingRate(balances.USDT)).toFixed(2)} USDT
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Yield Rate Table */}
                <div>
                  <h3 className="text-sm font-semibold text-[#EAECEF] mb-3 flex items-center gap-2">
                    <Award size={16} className="text-[#F0B90B]" />
                    Staking Tiers & Rewards
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {stakingTiers.map((tier, i) => (
                      <Card key={i} className="bg-[#181A20] border border-[#2B3139] p-3 hover:border-[#F0B90B]/50 transition-all">
                        <div className="text-2xl mb-2">{tier.icon}</div>
                        <div className="text-xs text-[#848E9C]">Staking Range</div>
                        <div className="text-sm font-bold text-[#EAECEF] mb-1">${tier.range}</div>
                        <div className="text-xs text-[#848E9C]">Daily Yield</div>
                        <div className="text-sm font-bold text-green-400">{tier.yield}</div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Staking Form */}
                <div className="bg-[#181A20] rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                    <div className="flex-1 w-full">
                      <label className="text-xs text-[#848E9C] mb-1 block">Staking Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={stakingAmount}
                        onChange={e => setStakingAmount(e.target.value)}
                        className="w-full bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12"
                      />
                    </div>
                    <Button
                      className="w-full lg:w-auto bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-8 h-12 rounded-xl text-base"
                      onClick={handleStartStaking}
                      disabled={!stakingAmount || executing}
                    >
                      <Shield className="mr-2 text-sm" />
                      Start Staking
                    </Button>
                  </div>
                  
                  {stakingAmount && Number(stakingAmount) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-[#23262F] rounded-lg"
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#848E9C]">Estimated Daily Earnings</span>
                        <span className="font-bold text-green-400">
                          +${(Number(stakingAmount) * calculateStakingRate(Number(stakingAmount))).toFixed(2)} USDT
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-[#848E9C]">Monthly (Est.)</span>
                        <span className="text-[#EAECEF]">
                          +${(Number(stakingAmount) * calculateStakingRate(Number(stakingAmount)) * 30).toFixed(2)} USDT
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Options Trading Content */}
            <TabsContent value="options" className="p-4 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Trading Form */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="text-[#F0B90B] text-xl" />
                    <h2 className="text-lg lg:text-xl font-bold text-[#F0B90B]">Options Trading</h2>
                  </div>

                  {/* Trading Pair Selection */}
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1 block">Trading Pair</label>
                    <div className="grid grid-cols-3 gap-2">
                      {tradingPairs.map((pair) => {
                        const Icon = pair.icon;
                        return (
                          <motion.button
                            key={pair.label}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                              selectedPair.label === pair.label 
                                ? 'border-[#F0B90B] bg-[#F0B90B]/10' 
                                : 'border-[#2B3139] bg-[#181A20] hover:border-[#F0B90B]/50'
                            }`}
                            onClick={() => setSelectedPair(pair)}
                          >
                            <Icon className={`${pair.color} text-xl mb-1`} />
                            <span className="text-xs text-[#EAECEF]">{pair.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direction Selection */}
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1 block">Direction</label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          direction === 'up' 
                            ? 'bg-green-500/20 border-green-500 text-green-500' 
                            : 'bg-[#181A20] border-[#2B3139] text-[#848E9C] hover:border-green-500/50'
                        }`}
                        onClick={() => setDirection('up')}
                      >
                        <FaArrowUp />
                        <span className="font-bold">Up</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                          direction === 'down' 
                            ? 'bg-red-500/20 border-red-500 text-red-500' 
                            : 'bg-[#181A20] border-[#2B3139] text-[#848E9C] hover:border-red-500/50'
                        }`}
                        onClick={() => setDirection('down')}
                      >
                        <FaArrowDown />
                        <span className="font-bold">Down</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1 block">Expiry Time</label>
                    <div className="grid grid-cols-5 gap-2">
                      {timeRanges.map((t) => (
                        <motion.button
                          key={t}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`py-2 rounded-lg text-xs font-bold transition-all ${
                            tradeTime === t 
                              ? 'bg-[#F0B90B] text-[#181A20]' 
                              : 'bg-[#181A20] text-[#848E9C] border border-[#2B3139] hover:border-[#F0B90B]/50'
                          }`}
                          onClick={() => setTradeTime(t)}
                        >
                          {t}s
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="text-xs text-[#848E9C] mb-1 block">Trade Amount</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={tradeAmount}
                        onChange={e => setTradeAmount(e.target.value)}
                        className="w-full bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-12 pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                    </div>
                  </div>

                  {/* Trade Summary */}
                  <div className="bg-[#181A20] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#848E9C]">Available Balance</span>
                      <span className="font-bold text-[#EAECEF]">{balances.USDT.toLocaleString()} USDT</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#848E9C]">Expected Payout</span>
                      <span className="font-bold text-green-400">
                        +${(Number(tradeAmount) * 0.8).toFixed(2)} USDT
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#848E9C]">Max Loss</span>
                      <span className="font-bold text-red-400">
                        -${Number(tradeAmount).toFixed(2)} USDT
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold py-3 rounded-xl text-lg h-12 disabled:opacity-50"
                    onClick={handleBuy} 
                    disabled={!tradeAmount || executing}
                  >
                    <FaPlay className="mr-2 text-sm" />
                    Buy Option
                  </Button>
                </div>

                {/* Right Column - Live Price & Chart */}
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-[#181A20] to-[#23262F] border border-[#2B3139] p-6">
                    <div className="text-center">
                      <div className="text-xs text-[#848E9C] mb-2">Real-Time BTC Price</div>
                      <div className="text-3xl lg:text-4xl font-bold text-[#F0B90B] mb-2">
                        ${realBtcPrice?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <span className="text-green-400">▲ +2.34%</span>
                        <span className="text-[#848E9C]">24h Change</span>
                      </div>
                    </div>
                  </Card>

                  {/* Trading History Tabs */}
                  <Card className="bg-[#181A20] border border-[#2B3139] p-4">
                    <Tabs value={tradeTab} onValueChange={setTradeTab} className="w-full">
                      <TabsList className="grid grid-cols-3 gap-2 mb-4 bg-[#23262F] p-1 rounded-xl">
                        <TabsTrigger value="active" className="text-xs py-2 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                          Active
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="text-xs py-2 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                          Scheduled
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs py-2 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                          Completed
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="active">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {tradeTransactions.filter(t => t.status === 'active' || t.status === 'pending').length === 0 ? (
                            <div className="text-center py-6 text-[#848E9C] text-sm">No active trades</div>
                          ) : (
                            tradeTransactions.filter(t => t.status === 'active' || t.status === 'pending').map((t) => (
                              <div key={t.id} className="bg-[#23262F] rounded-lg p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-medium text-[#EAECEF]">{t.asset}</div>
                                  <Badge className="bg-[#F0B90B] text-[#181A20] text-xs">
                                    {t.details?.side?.toUpperCase() || 'TRADE'}
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#848E9C]">Amount</span>
                                  <span className="text-[#EAECEF]">${t.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#848E9C]">Price</span>
                                  <span className="text-[#EAECEF]">${t.details?.price || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                  <span className="text-[#848E9C]">Time</span>
                                  <span className="text-[#EAECEF]">{new Date(t.date).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="scheduled">
                        <div className="text-center py-6 text-[#848E9C] text-sm">No scheduled trades</div>
                      </TabsContent>

                      <TabsContent value="completed">
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {tradeTransactions.filter(t => t.status === 'completed' || t.status === 'Win' || t.status === 'Loss').length === 0 ? (
                            <div className="text-center py-6 text-[#848E9C] text-sm">No completed trades</div>
                          ) : (
                            tradeTransactions.filter(t => t.status === 'completed' || t.status === 'Win' || t.status === 'Loss').slice(0, 5).map((t) => (
                              <div key={t.id} className="bg-[#23262F] rounded-lg p-3">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-medium text-[#EAECEF]">{t.asset}</div>
                                  <Badge className={
                                    t.pnl && t.pnl > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                  }>
                                    {t.pnl && t.pnl > 0 ? '+' : ''}{t.pnl?.toFixed(2)} USDT
                                  </Badge>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#848E9C]">Amount</span>
                                  <span className="text-[#EAECEF]">${t.amount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-[#848E9C]">Date</span>
                                  <span className="text-[#EAECEF]">{new Date(t.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Arbitrage History */}
        <Card className="bg-[#23262F] rounded-2xl shadow border border-[#2B3139] p-4 lg:p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaHistory className="text-[#F0B90B]" />
            <h2 className="text-lg lg:text-xl font-bold text-[#EAECEF]">Recent Arbitrage Trades</h2>
          </div>
          
          <div className="p-4">
            <div className="flex justify-around gap-2 mb-6 bg-[#181A20] p-1 rounded-xl">
              <button 
                className={`flex-1 py-2.5 px-1 rounded-lg font-bold text-sm transition-all ${
                  historyTab === 'arbitrage' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
                onClick={() => setHistoryTab('arbitrage')}
              >
                Arbitrage
              </button>
              <button 
                className={`flex-1 py-2.5 px-1 rounded-lg font-bold text-sm transition-all ${
                  historyTab === 'staking' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
                onClick={() => setHistoryTab('staking')}
              >
                Staking
              </button>
              <button 
                className={`flex-1 py-2.5 px-1 rounded-lg font-bold text-sm transition-all ${
                  historyTab === 'quant' ? 'bg-[#F0B90B] text-[#181A20]' : 'text-[#848E9C] hover:text-[#EAECEF]'
                }`}
                onClick={() => setHistoryTab('quant')}
              >
                Options
              </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {historyTab === 'arbitrage' && (
                arbitrageTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">🔄</div>
                    <div className="text-[#848E9C]">No arbitrage trades executed yet</div>
                    <div className="text-xs text-[#5E6673] mt-2">Start an arbitrage contract to see your trading history</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {arbitrageTransactions.slice(0, 10).map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                              <FaExchangeAlt className="text-[#F0B90B] text-sm" />
                            </div>
                            <div>
                              <div className="font-bold text-[#EAECEF] text-sm">{t.asset}</div>
                              <div className="text-xs text-[#848E9C]">ID: {t.id.slice(0, 8)}</div>
                            </div>
                          </div>
                          <Badge className={
                            t.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                            t.status === 'Completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                            t.status === 'Failed' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                            'bg-blue-500/20 text-blue-500 border-blue-500/30'
                          }>
                            {t.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Amount</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">${t.amount.toLocaleString()}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Duration</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">
                              {t.details?.duration ? `${Math.floor(t.details.duration / (24 * 60 * 60))}d` : 'N/A'}
                            </div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Date</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">{new Date(t.date).toLocaleDateString()}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Time</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">{new Date(t.date).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {t.pnl !== undefined && (
                          <div className="flex justify-between items-center pt-3 border-t border-[#2B3139]">
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-[#848E9C]">Result:</div>
                              <Badge className={t.pnl > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                                {t.pnl > 0 ? 'Profit' : 'Loss'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-[#848E9C] mb-1">PnL</div>
                              <div className={`font-bold text-sm ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {t.pnl > 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )
              )}

              {historyTab === 'staking' && (
                stakingTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">⛓️</div>
                    <div className="text-[#848E9C]">No staking positions yet</div>
                    <div className="text-xs text-[#5E6673] mt-2">Start staking to earn passive rewards</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stakingTransactions.slice(0, 10).map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                              <Shield className="text-[#F0B90B] text-sm" />
                            </div>
                            <div>
                              <div className="font-bold text-[#EAECEF] text-sm">Node Staking</div>
                              <div className="text-xs text-[#848E9C]">ID: {t.id.slice(0, 8)}</div>
                            </div>
                          </div>
                          <Badge className={
                            t.status === 'active' ? 'bg-green-500/20 text-green-500' :
                            t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-blue-500/20 text-blue-500'
                          }>
                            {t.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Staked</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">${t.amount.toLocaleString()}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">APY</div>
                            <div className="font-semibold text-green-400 text-sm">{(t.details?.apy || 5).toFixed(1)}%</div>
                          </div>
                        </div>

                        {t.pnl !== undefined && (
                          <div className="flex justify-between items-center pt-3 border-t border-[#2B3139]">
                            <div className="text-xs text-[#848E9C]">Earned</div>
                            <div className="text-green-400 font-bold text-sm">+${t.pnl.toFixed(2)}</div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )
              )}

              {historyTab === 'quant' && (
                tradeTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-[#848E9C]">No options trades yet</div>
                    <div className="text-xs text-[#5E6673] mt-2">Start trading options to see your history</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tradeTransactions.slice(0, 10).map((t) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4 hover:border-[#F0B90B]/30 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                              <BarChart3 className="text-[#F0B90B] text-sm" />
                            </div>
                            <div>
                              <div className="font-bold text-[#EAECEF] text-sm">{t.asset}</div>
                              <div className="text-xs text-[#848E9C]">ID: {t.id.slice(0, 8)}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                              {t.details?.side?.toUpperCase() || 'CALL'}
                            </Badge>
                            <Badge className={
                              t.pnl && t.pnl > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }>
                              {t.pnl && t.pnl > 0 ? '+' : ''}{t.pnl?.toFixed(2)} USDT
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Amount</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">${t.amount.toLocaleString()}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Price</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">${t.details?.price || 'N/A'}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Date</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">{new Date(t.date).toLocaleDateString()}</div>
                          </div>
                          <div className="bg-[#23262F] rounded-lg p-2">
                            <div className="text-xs text-[#848E9C] mb-1">Time</div>
                            <div className="font-semibold text-[#EAECEF] text-sm">{new Date(t.date).toLocaleTimeString()}</div>
                          </div>
                        </div>

                        {t.pnl !== undefined && (
                          <div className="flex justify-between items-center pt-3 border-t border-[#2B3139]">
                            <div className="text-xs text-[#848E9C]">Result</div>
                            <div className={`font-bold text-sm ${t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {t.pnl > 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Records Modal */}
      <Dialog open={recordsOpen} onClose={() => setRecordsOpen(false)}>
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#1E2329] border-[#F0B90B] max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#2B3139]">
              <h2 className="text-xl font-bold text-[#EAECEF]">Trading Records</h2>
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
                <TabsList className="grid grid-cols-3 w-full bg-[#181A20] p-1 rounded-xl mb-6">
                  <TabsTrigger value="arbitrage" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Arbitrage
                  </TabsTrigger>
                  <TabsTrigger value="staking" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Staking
                  </TabsTrigger>
                  <TabsTrigger value="options" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Options
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="arbitrage">
                  {arbitrageTransactions.length === 0 ? (
                    <EmptyRecords onClose={() => setRecordsOpen(false)} />
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {arbitrageTransactions.map((t) => (
                        <div key={t.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                                <FaExchangeAlt className="text-[#F0B90B] text-sm" />
                              </div>
                              <div>
                                <div className="font-bold text-[#EAECEF]">{t.asset}</div>
                                <div className="text-xs text-[#848E9C]">{new Date(t.date).toLocaleString()}</div>
                              </div>
                            </div>
                            <Badge className={
                              t.status === 'Completed' ? 'bg-green-500/20 text-green-500' :
                              t.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }>
                              {t.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-[#848E9C]">Amount</span>
                              <div className="font-medium text-[#EAECEF]">${t.amount.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">Duration</span>
                              <div className="font-medium text-[#EAECEF]">{t.details?.duration || 'N/A'}</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">PnL</span>
                              <div className={`font-medium ${t.pnl && t.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {t.pnl && t.pnl > 0 ? '+' : ''}${t.pnl?.toFixed(2) || '0.00'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="staking">
                  {stakingTransactions.length === 0 ? (
                    <EmptyRecords onClose={() => setRecordsOpen(false)} />
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {stakingTransactions.map((t) => (
                        <div key={t.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                                <Shield className="text-[#F0B90B] text-sm" />
                              </div>
                              <div>
                                <div className="font-bold text-[#EAECEF]">Node Staking</div>
                                <div className="text-xs text-[#848E9C]">{new Date(t.date).toLocaleString()}</div>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-500">
                              {t.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-[#848E9C]">Staked</span>
                              <div className="font-medium text-[#EAECEF]">${t.amount.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">APY</span>
                              <div className="font-medium text-green-400">{(t.details?.apy || 5).toFixed(1)}%</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">Earned</span>
                              <div className="font-medium text-green-400">+${t.pnl?.toFixed(2) || '0.00'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="options">
                  {tradeTransactions.length === 0 ? (
                    <EmptyRecords onClose={() => setRecordsOpen(false)} />
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {tradeTransactions.map((t) => (
                        <div key={t.id} className="bg-[#181A20] border border-[#2B3139] rounded-xl p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                                <BarChart3 className="text-[#F0B90B] text-sm" />
                              </div>
                              <div>
                                <div className="font-bold text-[#EAECEF]">{t.asset}</div>
                                <div className="text-xs text-[#848E9C]">{new Date(t.date).toLocaleString()}</div>
                              </div>
                            </div>
                            <Badge className={
                              t.pnl && t.pnl > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }>
                              {t.pnl && t.pnl > 0 ? '+' : ''}{t.pnl?.toFixed(2)} USDT
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-[#848E9C]">Amount</span>
                              <div className="font-medium text-[#EAECEF]">${t.amount.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">Side</span>
                              <div className="font-medium text-[#EAECEF]">{t.details?.side?.toUpperCase() || 'CALL'}</div>
                            </div>
                            <div>
                              <span className="text-[#848E9C]">Price</span>
                              <div className="font-medium text-[#EAECEF]">${t.details?.price || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </Dialog>
    </div>
  );
}
