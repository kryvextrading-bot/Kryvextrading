// Trading.tsx - Professional Redesign
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// Icons
import {
  ArrowLeft,
  Star,
  Settings,
  Menu,
  TrendingUp,
  Wallet,
  History,
  Activity,
  BarChart3,
  Layers,
  Shield,
  Clock,
  Zap,
  ChevronDown,
  AlertTriangle,
  Crown,
  RefreshCw,
  Info,
  XCircle,
  CheckCircle2,
  TrendingDown,
  Gauge,
  Fuel
} from 'lucide-react';

// Contexts & Hooks
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingControl } from '@/hooks/useTradingControl';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { useOrderBook } from '@/hooks/useOrderBook';
import { useRecentTrades } from '@/hooks/useRecentTrades';

// Services
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/walletService';
import { positionService } from '@/services/positionService';

// Components
import TradingViewWidget from '@/components/TradingViewWidget';
import EnhancedPairSelectorModal from '@/components/EnhancedPairSelectorModal';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import OrderHistoryTable from '@/components/trading/OrderHistoryTable';
import PositionCard from '@/components/trading/PositionCard';
import LeverageSelector from '@/components/trading/LeverageSelector';
import ProfitLossDisplay from '@/components/trading/ProfitLossDisplay';

// Utils
import { formatPrice, formatAmount, formatCurrency, formatPercentage } from '@/utils/formatting';
import { validateOrder, calculateMargin, calculatePnL } from '@/utils/tradingCalculations';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Types
import {
  TradingPair,
  OrderType,
  OrderSide,
  PositionType,
  TimeFrame,
  OrderBook as IOrderBook,
  Trade as ITrade,
  Transaction,
  Position
} from '@/types/trading';

// Constants
import { SUPPORTED_PAIRS, PROFIT_RATES, DEFAULT_LEVERAGE, ORDER_TYPES } from '@/constants/trading';

// ==================== PROPS & STATE TYPES ====================
interface TradingState {
  spot: {
    side: OrderSide;
    orderType: OrderType;
    price: string;
    amount: string;
    percent: number;
  };
  futures: {
    side: OrderSide;
    positionType: PositionType;
    orderType: OrderType;
    price: string;
    amount: string;
    percent: number;
    leverage: number;
    takeProfit?: string;
    stopLoss?: string;
  };
  options: {
    direction: 'up' | 'down';
    timeFrame: TimeFrame;
    amount: string;
  };
}

// ==================== MAIN COMPONENT ====================
const Trading: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Contexts
  const { user, isAuthenticated } = useAuth();
  const { balances, updateBalance, addTransaction, getBalance } = useWallet();
  const {
    userOutcome,
    activeWindows,
    systemSettings,
    countdown,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();

  // State
  const [activeTab, setActiveTab] = useState<'spot' | 'futures' | 'option'>('spot');
  const [selectedPair, setSelectedPair] = useState<TradingPair>(SUPPORTED_PAIRS[0]);
  const [pairSelectorOpen, setPairSelectorOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderHistoryTab, setOrderHistoryTab] = useState<'active' | 'scheduled' | 'completed'>('active');
  
  // Trading form state
  const [tradingState, setTradingState] = useState<TradingState>({
    spot: {
      side: 'buy',
      orderType: 'market',
      price: '',
      amount: '',
      percent: 0
    },
    futures: {
      side: 'buy',
      positionType: 'open',
      orderType: 'market',
      price: '',
      amount: '',
      percent: 0,
      leverage: DEFAULT_LEVERAGE
    },
    options: {
      direction: 'up',
      timeFrame: 60,
      amount: ''
    }
  });

  // UI State
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [showRecentTrades, setShowRecentTrades] = useState(true);

  // ==================== DATA HOOKS ====================
  const { currentPrice, priceChange24h } = useBinanceStream(selectedPair.symbol);
  const { orderBook, loading: orderBookLoading } = useOrderBook(selectedPair.symbol);
  const { recentTrades, loading: tradesLoading } = useRecentTrades(selectedPair.symbol);

  // ==================== EFFECTS ====================
  
  // Load user data
  useEffect(() => {
    if (user?.id) {
      loadUserTransactions();
      loadUserPositions();
    }
  }, [user?.id]);

  // Handle URL parameters
  useEffect(() => {
    const pairParam = searchParams.get('pair');
    const marketParam = searchParams.get('market');
    
    if (pairParam) {
      const pair = SUPPORTED_PAIRS.find(p => p.symbol === pairParam.replace('/', ''));
      if (pair) {
        setSelectedPair(pair);
        
        if (marketParam === 'Futures') {
          setActiveTab('futures');
        } else if (marketParam === 'Options') {
          setActiveTab('option');
        } else {
          setActiveTab('spot');
        }
      }
    }
  }, [searchParams]);

  // Update URL when pair or tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set('pair', selectedPair.symbol.replace('USDT', '/USDT'));
    params.set('market', activeTab === 'futures' ? 'Futures' : activeTab === 'option' ? 'Options' : 'Spot');
    navigate(`?${params.toString()}`, { replace: true });
  }, [selectedPair, activeTab]);

  // ==================== DATA LOADING ====================
  
  const loadUserTransactions = async () => {
    try {
      const data = await tradingService.getUserTransactions(user!.id);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const loadUserPositions = async () => {
    try {
      const data = await positionService.getUserPositions(user!.id);
      setPositions(data);
    } catch (error) {
      console.error('Failed to load positions:', error);
    }
  };

  // ==================== ORDER CATEGORIZATION ====================
  
  const getActiveOrders = useCallback(() => {
    return transactions.filter(tx => 
      tx.status === 'pending' || tx.status === 'processing'
    );
  }, [transactions]);

  const getScheduledOrders = useCallback(() => {
    return transactions.filter(tx => 
      tx.status === 'scheduled' || 
      (tx.metadata?.expiresAt && new Date(tx.metadata.expiresAt) > new Date())
    );
  }, [transactions]);

  const getCompletedOrders = useCallback(() => {
    return transactions.filter(tx => 
      tx.status === 'completed' || tx.status === 'failed' || tx.status === 'cancelled'
    );
  }, [transactions]);

  // ==================== TRADING HANDLERS ====================
  
  const handleSpotTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { side, orderType, price, amount, percent } = tradingState.spot;
    const parsedAmount = parseFloat(amount);
    const parsedPrice = orderType === 'market' ? currentPrice : parseFloat(price);

    // Validate order
    const validation = validateOrder({
      type: 'spot',
      side,
      amount: parsedAmount,
      price: parsedPrice,
      balance: getBalance('USDT')
    });

    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setLoading(true);

    try {
      // Check if trade should win based on admin settings
      const wins = await shouldWin('spot');
      
      // Calculate total value
      const total = parsedAmount * parsedPrice;
      
      // Create order
      const order = await tradingService.createSpotOrder({
        userId: user!.id,
        pair: selectedPair.symbol,
        side,
        type: orderType,
        amount: parsedAmount,
        price: parsedPrice,
        total,
        metadata: {
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        }
      });

      // Deduct from wallet
      await walletService.deductBalance({
        userId: user!.id,
        asset: 'USDT',
        amount: total,
        reference: order.id,
        type: 'trade_lock'
      });

      // Add transaction to state
      const transaction: Transaction = {
        id: order.id,
        userId: user!.id,
        type: 'trade',
        asset: selectedPair.symbol,
        amount: parsedAmount,
        price: parsedPrice,
        total,
        side,
        status: orderType === 'market' ? 'completed' : 'pending',
        pnl: orderType === 'market' ? (wins ? total * 0.05 : -total) : 0,
        metadata: {
          orderType,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);
      updateBalance('USDT', -total);

      // Show appropriate message
      if (orderType === 'market') {
        if (wins) {
          const profit = total * 0.05;
          toast.success(`Winning Trade! +$${profit.toFixed(2)} profit`);
          
          // Add profit to wallet
          await walletService.addBalance({
            userId: user!.id,
            asset: 'USDT',
            amount: total + profit,
            reference: order.id,
            type: 'trade_settlement'
          });
          updateBalance('USDT', total + profit);
        } else {
          toast.error(`Trade Lost -$${total.toFixed(2)}`);
        }
      } else {
        toast.info(`Order placed: ${orderType} ${side} ${parsedAmount} ${selectedPair.baseAsset}`);
      }

      // Clear form
      setTradingState(prev => ({
        ...prev,
        spot: { ...prev.spot, amount: '', price: '', percent: 0 }
      }));

    } catch (error) {
      console.error('Spot trade failed:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tradingState.spot, currentPrice, getBalance, shouldWin, user, selectedPair, updateBalance]);

  const handleFuturesTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { side, positionType, orderType, price, amount, leverage, takeProfit, stopLoss } = tradingState.futures;
    const parsedAmount = parseFloat(amount);
    const parsedPrice = orderType === 'market' ? currentPrice : parseFloat(price);
    
    // Calculate margin
    const margin = calculateMargin(parsedAmount, leverage);
    
    // Validate position
    if (margin > getBalance('USDT')) {
      toast.error(`Insufficient margin. Required: $${margin.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      // Check if trade should win
      const wins = await shouldWin('futures');
      
      // Create futures position
      const position = await tradingService.openFuturesPosition({
        userId: user!.id,
        pair: selectedPair.symbol,
        side,
        type: positionType,
        orderType,
        amount: parsedAmount,
        price: parsedPrice,
        leverage,
        margin,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        metadata: {
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        }
      });

      // Lock margin
      await walletService.deductBalance({
        userId: user!.id,
        asset: 'USDT',
        amount: margin,
        reference: position.id,
        type: 'margin_lock'
      });

      // Add position to state
      const newPosition: Position = {
        id: position.id,
        userId: user!.id,
        pair: selectedPair.symbol,
        side,
        size: parsedAmount,
        entryPrice: parsedPrice,
        markPrice: parsedPrice,
        leverage,
        margin,
        unrealizedPnl: 0,
        liquidationPrice: position.liquidationPrice,
        status: 'open',
        metadata: {
          shouldWin: wins
        },
        createdAt: new Date().toISOString()
      };

      setPositions(prev => [newPosition, ...prev]);
      updateBalance('USDT', -margin);

      // Show message
      if (orderType === 'market') {
        toast.success(`${positionType === 'open' ? 'Opened' : 'Closed'} ${side} position with ${leverage}x leverage`);
        
        // Simulate immediate PnL for demo
        if (wins) {
          const pnl = margin * 0.2;
          toast.success(`Position is profitable! +$${pnl.toFixed(2)} unrealized`);
        }
      } else {
        toast.info(`${orderType} order placed for ${side} position`);
      }

      // Clear form
      setTradingState(prev => ({
        ...prev,
        futures: { ...prev.futures, amount: '', price: '', percent: 0 }
      }));

    } catch (error) {
      console.error('Futures trade failed:', error);
      toast.error('Failed to open position');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tradingState.futures, currentPrice, getBalance, shouldWin, user, selectedPair, updateBalance]);

  const handleOptionsTrade = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const { direction, timeFrame, amount } = tradingState.options;
    const parsedAmount = parseFloat(amount);
    
    if (parsedAmount > getBalance('USDT')) {
      toast.error(`Insufficient balance. Required: $${parsedAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      // Check if option should win
      const wins = await shouldWin('options');
      
      const rate = PROFIT_RATES[timeFrame];
      const payout = parsedAmount * rate.payout;
      const expiresAt = Date.now() + timeFrame * 1000;

      // Create option
      const option = await tradingService.createOption({
        userId: user!.id,
        pair: selectedPair.symbol,
        direction,
        amount: parsedAmount,
        timeFrame,
        payout,
        expiresAt,
        metadata: {
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        }
      });

      // Deduct premium
      await walletService.deductBalance({
        userId: user!.id,
        asset: 'USDT',
        amount: parsedAmount,
        reference: option.id,
        type: 'option_premium'
      });

      // Add to transactions
      const transaction: Transaction = {
        id: option.id,
        userId: user!.id,
        type: 'option',
        asset: selectedPair.symbol,
        amount: parsedAmount,
        price: currentPrice,
        total: parsedAmount,
        side: direction === 'up' ? 'buy' : 'sell',
        status: 'scheduled',
        pnl: 0,
        metadata: {
          direction,
          timeFrame,
          payout,
          expiresAt,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);
      updateBalance('USDT', -parsedAmount);

      toast.info(`Option purchased! Expires in ${timeFrame}s`);

      // Schedule settlement
      setTimeout(async () => {
        const finalPnl = wins ? payout - parsedAmount : -parsedAmount;
        
        // Update transaction
        setTransactions(prev =>
          prev.map(tx =>
            tx.id === option.id
              ? { ...tx, status: 'completed', pnl: finalPnl }
              : tx
          )
        );

        if (wins) {
          await walletService.addBalance({
            userId: user!.id,
            asset: 'USDT',
            amount: payout,
            reference: option.id,
            type: 'option_settlement'
          });
          updateBalance('USDT', payout);
          toast.success(`Option won! +$${(payout - parsedAmount).toFixed(2)} profit`);
        } else {
          toast.error(`Option lost -$${parsedAmount.toFixed(2)}`);
        }
      }, timeFrame * 1000);

      // Clear form
      setTradingState(prev => ({
        ...prev,
        options: { ...prev.options, amount: '' }
      }));

    } catch (error) {
      console.error('Options trade failed:', error);
      toast.error('Failed to purchase option');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, tradingState.options, getBalance, shouldWin, selectedPair, currentPrice, updateBalance]);

  // ==================== RENDER HELPERS ====================
  
  const renderForceWinBadge = () => {
    if (userOutcome?.enabled && userOutcome.outcome_type === 'win') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse">
          <Crown className="w-3 h-3 mr-1" />
          Force Win Active
        </Badge>
      );
    }
    
    const activeWinWindow = activeWindows.find(w => 
      w.outcome_type === 'win' && 
      new Date(w.start_time) <= new Date() && 
      new Date(w.end_time) >= new Date()
    );

    if (activeWinWindow) {
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Win Window {countdown && `(${countdown})`}
        </Badge>
      );
    }

    return null;
  };

  const renderActiveWindows = () => {
    if (activeWindows.length === 0) return null;

    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400">Active Windows:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {activeWindows.map(window => (
              <Badge key={window.id} className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {window.outcome_type.toUpperCase()}: {new Date(window.start_time).toLocaleTimeString()}-{new Date(window.end_time).toLocaleTimeString()}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================
  
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#181A20] pb-16 md:pb-20">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
          <div className="container mx-auto px-3 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPairSelectorOpen(true)}
                  className="lg:hidden"
                >
                  <Menu className="h-5 w-5 text-[#848E9C]" />
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setPairSelectorOpen(true)}
                  className="hidden lg:flex items-center gap-3"
                >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-[#EAECEF]">
                        {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                      </span>
                      {renderForceWinBadge()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-green-500 font-mono">
                        ${formatPrice(currentPrice)}
                      </span>
                      <Badge className={priceChange24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#848E9C]" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Star className="h-5 w-5 text-[#848E9C]" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5 text-[#848E9C]" />
                </Button>
              </div>
            </div>

            {/* Mobile Pair Info */}
            <Button
              variant="ghost"
              onClick={() => setPairSelectorOpen(true)}
              className="lg:hidden w-full mt-2 justify-start"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#EAECEF]">
                    {selectedPair.baseAsset}/{selectedPair.quoteAsset}
                  </span>
                  {renderForceWinBadge()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-green-500 font-mono">
                    ${formatPrice(currentPrice)}
                  </span>
                  <Badge className={priceChange24h >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                    {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                  </Badge>
                </div>
              </div>
            </Button>

            {/* Tabs */}
            <div className="mt-3">
              <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
                <TabsList className="grid grid-cols-3 bg-[#1E2329] p-1">
                  <TabsTrigger value="spot" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Spot
                  </TabsTrigger>
                  <TabsTrigger value="futures" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Futures
                  </TabsTrigger>
                  <TabsTrigger value="option" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                    Options
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 py-4">
          {/* Pair Selector Modal */}
          <EnhancedPairSelectorModal
            open={pairSelectorOpen}
            onClose={() => setPairSelectorOpen(false)}
            onSelect={(pair) => {
              setSelectedPair(pair);
              setPairSelectorOpen(false);
            }}
            currentTab={activeTab}
          />

          {/* Quick Stats - Mobile */}
          <div className="grid grid-cols-3 gap-2 mb-4 lg:hidden">
            <Card className="bg-[#1E2329] border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">Balance</div>
              <div className="font-bold text-[#EAECEF]">${formatCurrency(getBalance('USDT'))}</div>
            </Card>
            <Card className="bg-[#1E2329] border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">24h Change</div>
              <div className={`font-bold ${priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </div>
            </Card>
            <Card className="bg-[#1E2329] border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">24h Volume</div>
              <div className="font-bold text-[#EAECEF]">${formatCurrency(selectedPair.volume || 0)}</div>
            </Card>
          </div>

          {/* Auth Banner */}
          {!isAuthenticated && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">View Only Mode</p>
                  <p className="text-xs text-yellow-300 mt-1">
                    Please <button onClick={() => navigate('/login')} className="underline hover:text-yellow-200">login</button> to trade
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Force Win Banner */}
          {userOutcome?.enabled && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-emerald-400" />
                <p className="text-sm text-emerald-400">
                  Force win enabled - you will win all trades!
                </p>
              </div>
            </div>
          )}

          {/* Active Windows */}
          {renderActiveWindows()}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Chart */}
            <div className="lg:col-span-7">
              <Card className="bg-[#1E2329] border-[#2B3139] p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#F0B90B]" />
                    <span className="font-semibold text-[#EAECEF]">
                      {selectedPair.baseAsset}/{selectedPair.quoteAsset} Chart
                    </span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400">Live</Badge>
                </div>
                <TradingViewWidget symbol={selectedPair.symbol} />
              </Card>
            </div>

            {/* Trading Form */}
            <div className="lg:col-span-5 space-y-4">
              {activeTab === 'spot' && (
                <Card className="bg-[#1E2329] border-[#F0B90B] p-4">
                  {/* Spot Trading Form */}
                  <div className="space-y-4">
                    {/* Buy/Sell Toggle */}
                    <div className="flex bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
                      <Button
                        variant="ghost"
                        className={`flex-1 ${tradingState.spot.side === 'buy' ? 'bg-green-500 text-white' : 'text-[#848E9C]'}`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          spot: { ...prev.spot, side: 'buy' }
                        }))}
                      >
                        Buy {selectedPair.baseAsset}
                      </Button>
                      <Button
                        variant="ghost"
                        className={`flex-1 ${tradingState.spot.side === 'sell' ? 'bg-red-500 text-white' : 'text-[#848E9C]'}`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          spot: { ...prev.spot, side: 'sell' }
                        }))}
                      >
                        Sell {selectedPair.baseAsset}
                      </Button>
                    </div>

                    {/* Order Type */}
                    <Select
                      value={tradingState.spot.orderType}
                      onValueChange={(value: OrderType) => setTradingState(prev => ({
                        ...prev,
                        spot: { ...prev.spot, orderType: value }
                      }))}
                    >
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Price Input */}
                    {tradingState.spot.orderType !== 'market' && (
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={tradingState.spot.price}
                          onChange={(e) => setTradingState(prev => ({
                            ...prev,
                            spot: { ...prev.spot, price: e.target.value }
                          }))}
                          className="bg-[#181A20] border-[#2B3139] pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                          USDT
                        </span>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder={`Amount in ${selectedPair.baseAsset}`}
                        value={tradingState.spot.amount}
                        onChange={(e) => setTradingState(prev => ({
                          ...prev,
                          spot: { ...prev.spot, amount: e.target.value }
                        }))}
                        className="bg-[#181A20] border-[#2B3139] pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                        {selectedPair.baseAsset}
                      </span>
                    </div>

                    {/* Percentage Slider */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tradingState.spot.percent}
                        onChange={(e) => {
                          const percent = parseInt(e.target.value);
                          const maxAmount = getBalance('USDT') / currentPrice;
                          setTradingState(prev => ({
                            ...prev,
                            spot: {
                              ...prev.spot,
                              percent,
                              amount: (maxAmount * percent / 100).toFixed(6)
                            }
                          }));
                        }}
                        className="flex-1 h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[#EAECEF] text-sm w-12 text-right">
                        {tradingState.spot.percent}%
                      </span>
                    </div>

                    {/* Balance Info */}
                    <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Available</span>
                        <span className="text-[#EAECEF] font-medium">
                          {formatCurrency(getBalance('USDT'))} USDT
                        </span>
                      </div>
                      {tradingState.spot.amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Total</span>
                          <span className="text-[#EAECEF] font-medium">
                            ${formatCurrency(parseFloat(tradingState.spot.amount) * currentPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      className={`w-full py-6 text-lg font-bold ${
                        tradingState.spot.side === 'buy'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                      onClick={handleSpotTrade}
                      disabled={!tradingState.spot.amount || loading || !isAuthenticated}
                    >
                      {tradingState.spot.side === 'buy' ? 'Buy' : 'Sell'} {selectedPair.baseAsset}
                    </Button>
                  </div>
                </Card>
              )}

              {activeTab === 'futures' && (
                <Card className="bg-[#1E2329] border-[#F0B90B] p-4">
                  {/* Futures Trading Form */}
                  <div className="space-y-4">
                    {/* Leverage & Position Type */}
                    <div className="flex gap-2">
                      <LeverageSelector
                        value={tradingState.futures.leverage}
                        onChange={(leverage) => setTradingState(prev => ({
                          ...prev,
                          futures: { ...prev.futures, leverage }
                        }))}
                      />
                      
                      <div className="flex flex-1 bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
                        <Button
                          variant="ghost"
                          className={`flex-1 ${
                            tradingState.futures.positionType === 'open'
                              ? 'bg-[#F0B90B] text-[#181A20]'
                              : 'text-[#848E9C]'
                          }`}
                          onClick={() => setTradingState(prev => ({
                            ...prev,
                            futures: { ...prev.futures, positionType: 'open' }
                          }))}
                        >
                          Open
                        </Button>
                        <Button
                          variant="ghost"
                          className={`flex-1 ${
                            tradingState.futures.positionType === 'close'
                              ? 'bg-[#F0B90B] text-[#181A20]'
                              : 'text-[#848E9C]'
                          }`}
                          onClick={() => setTradingState(prev => ({
                            ...prev,
                            futures: { ...prev.futures, positionType: 'close' }
                          }))}
                        >
                          Close
                        </Button>
                      </div>
                    </div>

                    {/* Long/Short Toggle */}
                    <div className="flex bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
                      <Button
                        variant="ghost"
                        className={`flex-1 ${
                          tradingState.futures.side === 'buy'
                            ? 'bg-green-500 text-white'
                            : 'text-[#848E9C]'
                        }`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          futures: { ...prev.futures, side: 'buy' }
                        }))}
                      >
                        Long
                      </Button>
                      <Button
                        variant="ghost"
                        className={`flex-1 ${
                          tradingState.futures.side === 'sell'
                            ? 'bg-red-500 text-white'
                            : 'text-[#848E9C]'
                        }`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          futures: { ...prev.futures, side: 'sell' }
                        }))}
                      >
                        Short
                      </Button>
                    </div>

                    {/* Order Type */}
                    <Select
                      value={tradingState.futures.orderType}
                      onValueChange={(value: OrderType) => setTradingState(prev => ({
                        ...prev,
                        futures: { ...prev.futures, orderType: value }
                      }))}
                    >
                      <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Price Input */}
                    {tradingState.futures.orderType !== 'market' && (
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Price"
                          value={tradingState.futures.price}
                          onChange={(e) => setTradingState(prev => ({
                            ...prev,
                            futures: { ...prev.futures, price: e.target.value }
                          }))}
                          className="bg-[#181A20] border-[#2B3139] pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                          USDT
                        </span>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Position Size (USDT)"
                        value={tradingState.futures.amount}
                        onChange={(e) => setTradingState(prev => ({
                          ...prev,
                          futures: { ...prev.futures, amount: e.target.value }
                        }))}
                        className="bg-[#181A20] border-[#2B3139] pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                        USDT
                      </span>
                    </div>

                    {/* TP/SL */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Take Profit (optional)"
                          value={tradingState.futures.takeProfit || ''}
                          onChange={(e) => setTradingState(prev => ({
                            ...prev,
                            futures: { ...prev.futures, takeProfit: e.target.value }
                          }))}
                          className="bg-[#181A20] border-[#2B3139] pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                          USDT
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Stop Loss (optional)"
                          value={tradingState.futures.stopLoss || ''}
                          onChange={(e) => setTradingState(prev => ({
                            ...prev,
                            futures: { ...prev.futures, stopLoss: e.target.value }
                          }))}
                          className="bg-[#181A20] border-[#2B3139] pr-16"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                          USDT
                        </span>
                      </div>
                    </div>

                    {/* Margin Info */}
                    {tradingState.futures.amount && (
                      <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Position Size</span>
                          <span className="text-[#EAECEF] font-medium">
                            ${formatCurrency(parseFloat(tradingState.futures.amount) * tradingState.futures.leverage)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Margin Required</span>
                          <span className="text-[#F0B90B] font-medium">
                            ${formatCurrency(parseFloat(tradingState.futures.amount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Liquidation Price</span>
                          <span className="text-red-400 font-medium">
                            ${formatPrice(currentPrice * (tradingState.futures.side === 'buy' ? 0.9 : 1.1))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full py-6 text-lg font-bold bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                      onClick={handleFuturesTrade}
                      disabled={!tradingState.futures.amount || loading || !isAuthenticated}
                    >
                      {tradingState.futures.positionType === 'open'
                        ? `Open ${tradingState.futures.side === 'buy' ? 'Long' : 'Short'}`
                        : 'Close Position'}
                    </Button>
                  </div>
                </Card>
              )}

              {activeTab === 'option' && (
                <Card className="bg-[#1E2329] border-[#F0B90B] p-4">
                  {/* Options Trading Form */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-[#F0B90B] flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Options Trading
                    </h2>

                    {/* Direction */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className={`p-6 ${
                          tradingState.options.direction === 'up'
                            ? 'bg-green-500/20 border-green-500 text-green-500'
                            : 'border-[#2B3139] text-[#848E9C]'
                        }`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          options: { ...prev.options, direction: 'up' }
                        }))}
                      >
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Up
                      </Button>
                      <Button
                        variant="outline"
                        className={`p-6 ${
                          tradingState.options.direction === 'down'
                            ? 'bg-red-500/20 border-red-500 text-red-500'
                            : 'border-[#2B3139] text-[#848E9C]'
                        }`}
                        onClick={() => setTradingState(prev => ({
                          ...prev,
                          options: { ...prev.options, direction: 'down' }
                        }))}
                      >
                        <TrendingDown className="h-5 w-5 mr-2" />
                        Down
                      </Button>
                    </div>

                    {/* Time Frame */}
                    <div>
                      <label className="text-sm text-[#848E9C] mb-2 block">
                        Expiry Time
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(PROFIT_RATES).map(([seconds, rate]) => (
                          <Button
                            key={seconds}
                            variant="outline"
                            className={`p-2 ${
                              tradingState.options.timeFrame === parseInt(seconds)
                                ? 'bg-[#F0B90B] text-[#181A20] border-[#F0B90B]'
                                : 'border-[#2B3139] text-[#848E9C]'
                            }`}
                            onClick={() => setTradingState(prev => ({
                              ...prev,
                              options: { ...prev.options, timeFrame: parseInt(seconds) as TimeFrame }
                            }))}
                          >
                            <div>{seconds}s</div>
                            <div className="text-xs">+{rate.profit}%</div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={tradingState.options.amount}
                        onChange={(e) => setTradingState(prev => ({
                          ...prev,
                          options: { ...prev.options, amount: e.target.value }
                        }))}
                        className="bg-[#181A20] border-[#2B3139] pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-sm">
                        USDT
                      </span>
                    </div>

                    {/* Summary */}
                    {tradingState.options.amount && (
                      <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Investment</span>
                          <span className="text-[#EAECEF] font-medium">
                            ${formatCurrency(parseFloat(tradingState.options.amount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Potential Payout</span>
                          <span className="text-green-400 font-medium">
                            ${formatCurrency(parseFloat(tradingState.options.amount) * PROFIT_RATES[tradingState.options.timeFrame].payout)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#848E9C]">Potential Profit</span>
                          <span className="text-green-400 font-medium">
                            +${formatCurrency(parseFloat(tradingState.options.amount) * (PROFIT_RATES[tradingState.options.timeFrame].profit / 100))}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className="w-full py-6 text-lg font-bold bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
                      onClick={handleOptionsTrade}
                      disabled={!tradingState.options.amount || loading || !isAuthenticated}
                    >
                      Buy Option
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* Order Book & Recent Trades */}
            <div className="lg:col-span-5 space-y-4">
              {/* Mobile Toggles */}
              <div className="lg:hidden flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOrderBook(!showOrderBook)}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {showOrderBook ? 'Hide' : 'Show'} Order Book
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRecentTrades(!showRecentTrades)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {showRecentTrades ? 'Hide' : 'Show'} Trades
                </Button>
              </div>

              {/* Order Book */}
              {(showOrderBook || window.innerWidth >= 1024) && (
                <OrderBook
                  bids={orderBook.bids}
                  asks={orderBook.asks}
                  loading={orderBookLoading}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              )}

              {/* Recent Trades */}
              {(showRecentTrades || window.innerWidth >= 1024) && (
                <RecentTrades
                  trades={recentTrades}
                  loading={tradesLoading}
                  baseAsset={selectedPair.baseAsset}
                  quoteAsset={selectedPair.quoteAsset}
                />
              )}
            </div>
          </div>

          {/* Open Positions (Futures) */}
          {activeTab === 'futures' && positions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-3 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#F0B90B]" />
                Open Positions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positions.map(position => (
                  <PositionCard
                    key={position.id}
                    position={position}
                    currentPrice={currentPrice}
                    onClose={() => {
                      // Handle position close
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Order History */}
          <div className="mt-6">
            <Card className="bg-[#1E2329] border-[#2B3139] p-4">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-[#F0B90B]" />
                <h3 className="font-semibold text-[#EAECEF]">Order History</h3>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C]">
                  No orders yet. Start trading to see your history.
                </div>
              ) : (
                <>
                  <Tabs value={orderHistoryTab} onValueChange={(v: any) => setOrderHistoryTab(v)}>
                    <TabsList className="grid w-full grid-cols-3 bg-[#2B3139]">
                      <TabsTrigger value="active">
                        Active ({getActiveOrders().length})
                      </TabsTrigger>
                      <TabsTrigger value="scheduled">
                        Scheduled ({getScheduledOrders().length})
                      </TabsTrigger>
                      <TabsTrigger value="completed">
                        Completed ({getCompletedOrders().length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                      <OrderHistoryTable orders={getActiveOrders()} />
                    </TabsContent>

                    <TabsContent value="scheduled">
                      <OrderHistoryTable orders={getScheduledOrders()} showCountdown />
                    </TabsContent>

                    <TabsContent value="completed">
                      <OrderHistoryTable orders={getCompletedOrders()} />
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </Card>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Trading;