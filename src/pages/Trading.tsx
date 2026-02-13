import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import SpotTradeForm from '@/components/trading/SpotTradeForm';
import FuturesTradeForm from '@/components/trading/FuturesTradeForm';
import OptionTradePanel from '@/components/trading/OptionTradePanel';
import MiniChart from '@/components/MiniChart';
import useBinanceStream from '@/hooks/useBinanceStream';
import { toast } from '@/components/ui/use-toast';
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
  X,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '@/services/api';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import TradingViewWidget from '@/components/TradingViewWidget';
import { Dialog } from '@headlessui/react';
import EnhancedPairSelectorModal from '@/components/EnhancedPairSelectorModal';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';
import OrderPlacementForm from '@/components/trading/OrderPlacementForm';
import OrderManagementTabs from '@/components/trading/OrderManagementTabs';
import { OrderProvider, useOrderContext } from '@/contexts/OrderContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT'];
const ASSETS = ['USDT', 'BTC', 'ETH', 'BNB'];

// ==================== TYPES ====================
interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

interface Trade {
  id: string;
  price: number;
  amount: number;
  total: number;
  side: 'buy' | 'sell';
  time: number;
}

interface TradingPair {
  label: string;
  price: number;
  change?: number;
}

// ==================== ERROR BOUNDARY ====================
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 text-red-200 rounded border border-red-800">
          <div className="font-bold mb-2 flex items-center gap-2">
            <Shield size={16} />
            Something went wrong in the trading panel.
          </div>
          <pre className="text-xs whitespace-pre-wrap opacity-80">{this.state.error?.toString()}</pre>
          <Button 
            className="mt-4 bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==================== COUNTDOWN TIMER ====================
const CountdownTimer = ({ endTime, onComplete }: { endTime: number; onComplete: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(timer);
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <Clock size={12} className="text-[#F0B90B]" />
      <span className="text-[#EAECEF]">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

// ==================== ORDER BOOK ROW ====================
const OrderBookRow = ({ price, amount, total, type }: { price: number; amount: number; total: number; type: 'bid' | 'ask' }) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
      ${price.toFixed(2)}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{amount.toFixed(4)}</span>
    <span className="font-mono text-xs text-[#848E9C]">
      ${total.toFixed(2)}
    </span>
  </div>
);

// ==================== TRADE ROW ====================
const TradeRow = ({ trade }: { trade: Trade }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="font-mono text-sm text-[#EAECEF]">
        ${trade.price.toFixed(2)}
      </span>
    </div>
    <span className="font-mono text-sm text-[#EAECEF]">{trade.amount.toFixed(4)}</span>
    <span className="text-xs text-[#848E9C]">
      {new Date(trade.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  </div>
);

// ==================== ORDER CARD ====================
const OrderCard = ({ order, type, onComplete, onCancel }: any) => {
  const isBuy = order.details?.side === 'buy' || order.details?.side === 'up';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-[#1E2329] rounded-lg p-3 space-y-2 border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge className={isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {order.details?.side?.toUpperCase()}
          </Badge>
          <span className="text-xs text-[#848E9C]">{order.asset}</span>
        </div>
        <Badge className="bg-yellow-500/20 text-yellow-400">
          {order.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[#848E9C]">Amount</span>
          <div className="font-medium text-[#EAECEF]">${order.amount.toLocaleString()}</div>
        </div>
        {order.details?.price && (
          <div>
            <span className="text-[#848E9C]">Price</span>
            <div className="font-medium text-[#EAECEF]">${order.details.price}</div>
          </div>
        )}
        {order.details?.timeFrame && (
          <div>
            <span className="text-[#848E9C]">Time Frame</span>
            <div className="font-medium text-[#EAECEF]">{order.details.timeFrame}s</div>
          </div>
        )}
        {order.details?.leverage && (
          <div>
            <span className="text-[#848E9C]">Leverage</span>
            <div className="font-medium text-[#F0B90B]">{order.details.leverage}x</div>
          </div>
        )}
      </div>

      {order.details?.endTime && (
        <div className="flex items-center justify-between pt-2 border-t border-[#2B3139]">
          <CountdownTimer 
            endTime={order.details.endTime} 
            onComplete={onComplete}
          />
          <div className="flex gap-2">
            <button 
              className="text-xs text-green-400 bg-green-500/20 px-3 py-1.5 rounded hover:bg-green-500/30 transition-colors"
              onClick={onComplete}
            >
              Complete
            </button>
            <button 
              className="text-xs text-red-400 bg-red-500/20 px-3 py-1.5 rounded hover:bg-red-500/30 transition-colors"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function Trading() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'spot' | 'futures' | 'option'>('spot');
  
  // URL parameters
  const [urlParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      pair: params.get('pair'),
      market: params.get('market')
    };
  });

  // Wallet context
  const { 
    balances, 
    transactions, 
    orders, 
    executeTrade, 
    addTransaction, 
    updateTransaction, 
    updateBalance,
    totalValue, 
    portfolio 
  } = useWallet();
  
  const { placeOrder, openOrders, closedOrders, modifyOrder } = useOrderContext();

  // Spot state
  const [spotPair, setSpotPair] = useState('BTC/USDT');
  const [spotSide, setSpotSide] = useState<'buy' | 'sell'>('buy');
  const [spotOrderType, setSpotOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [spotPrice, setSpotPrice] = useState('');
  const [spotAmount, setSpotAmount] = useState('');
  const [spotPercent, setSpotPercent] = useState(0);

  // Futures state
  const [futuresSide, setFuturesSide] = useState<'buy' | 'sell'>('buy');
  const [futuresPositionType, setFuturesPositionType] = useState<'open' | 'close'>('open');
  const [futuresOrderType, setFuturesOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [futuresPrice, setFuturesPrice] = useState('');
  const [futuresAmount, setFuturesAmount] = useState('');
  const [futuresPercent, setFuturesPercent] = useState(0);
  const [futuresLeverage, setFuturesLeverage] = useState(10);
  const [futuresTpSl, setFuturesTpSl] = useState(false);

  // Options state
  const [optionsDirection, setOptionsDirection] = useState<'up' | 'down'>('up');
  const [optionsPositionTime, setOptionsPositionTime] = useState('60s');
  const [optionsOrderType, setOptionsOrderType] = useState<'market' | 'limit'>('market');
  const [optionsAmount, setOptionsAmount] = useState('');
  const [optionsAsset, setOptionsAsset] = useState('USDT');
  const [optionsPercent, setOptionsPercent] = useState(0);

  // Live price data
  const futuresTrade = useBinanceStream('btcusdt', 'trade');
  const liveFuturesPrice = futuresTrade?.p ? parseFloat(futuresTrade.p) : 0;

  // Mini chart data
  const [base, quote] = spotPair.split('/');
  const binanceSymbol = `${base}${quote}`.toLowerCase();
  const klineData = useBinanceStream(binanceSymbol, 'kline', '1m');
  
  const miniChartPrices = useMemo(() => {
    if (!klineData || !klineData.k) return [];
    if (Array.isArray(klineData)) {
      return klineData.map((k: any) => parseFloat(k.k.c));
    }
    if (klineData.k && klineData.k.c) {
      return [parseFloat(klineData.k.c)];
    }
    return [];
  }, [klineData]);

  const currentPrice = miniChartPrices[miniChartPrices.length - 1] || 0;

  // Pairs
  const [futuresPair, setFuturesPair] = useState('BTC/USDT');
  const [optionsPair, setOptionsPair] = useState('BTC/USDT');

  // Handle URL parameters
  useEffect(() => {
    if (urlParams.pair && urlParams.market) {
      if (tab === 'spot') setSpotPair(urlParams.pair);
      if (tab === 'futures') setFuturesPair(urlParams.pair);
      if (tab === 'option') setOptionsPair(urlParams.pair);
      
      if (urlParams.market === 'Crypto' && tab !== 'spot') setTab('spot');
      if (urlParams.market === 'Futures' && tab !== 'futures') setTab('futures');
      if (urlParams.market === 'USStock' && tab !== 'option') setTab('option');
    }
  }, [urlParams, tab]);

  // Order book - mock data
  const [orderBook, setOrderBook] = useState<OrderBook>({
    bids: [
      { price: 43000.50, amount: 1.2345, total: 43000.50 * 1.2345 },
      { price: 43000.25, amount: 0.8765, total: 43000.25 * 0.8765 },
      { price: 43000.00, amount: 1.5432, total: 43000.00 * 1.5432 },
      { price: 42999.75, amount: 2.1098, total: 42999.75 * 2.1098 },
      { price: 42999.50, amount: 0.9876, total: 42999.50 * 0.9876 }
    ],
    asks: [
      { price: 43001.00, amount: 1.0987, total: 43001.00 * 1.0987 },
      { price: 43001.25, amount: 0.7654, total: 43001.25 * 0.7654 },
      { price: 43001.50, amount: 1.2345, total: 43001.50 * 1.2345 },
      { price: 43001.75, amount: 0.5432, total: 43001.75 * 0.5432 },
      { price: 43002.00, amount: 1.8765, total: 43002.00 * 1.8765 }
    ]
  });

  // Recent trades
  const [recentTrades, setRecentTrades] = useState<Trade[]>([
    { price: 43000.50, amount: 0.1234, total: 43000.50 * 0.1234, side: 'buy', time: Date.now() - 1000 },
    { price: 43000.75, amount: 0.5678, total: 43000.75 * 0.5678, side: 'sell', time: Date.now() - 2000 },
    { price: 43001.00, amount: 0.2345, total: 43001.00 * 0.2345, side: 'buy', time: Date.now() - 3000 },
    { price: 43001.25, amount: 0.8901, total: 43001.25 * 0.8901, side: 'sell', time: Date.now() - 4000 },
    { price: 43000.25, amount: 0.4567, total: 43000.25 * 0.4567, side: 'buy', time: Date.now() - 5000 },
  ]);

  // Tab states
  const [activeSpotTab, setActiveSpotTab] = useState<'open' | 'completed' | 'assets'>('open');
  const [activeFuturesTab, setActiveFuturesTab] = useState<'positions' | 'open' | 'closed'>('positions');
  const [activeOptionsTab, setActiveOptionsTab] = useState<'open' | 'completed' | 'closed'>('open');

  // UI state
  const [pairSelectorOpen, setPairSelectorOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(true);
  const [showRecentTrades, setShowRecentTrades] = useState(true);

  // Options trading state
  const tradingPairs: TradingPair[] = [
    { label: 'BTC/USDT', price: 67000, change: 2.34 },
    { label: 'ETH/USDT', price: 3200, change: -1.25 },
    { label: 'SOL/USDT', price: 150, change: 5.67 },
  ];
  const timeRanges = [60, 120, 240, 360, 600];
  const [selectedPair, setSelectedPair] = useState<TradingPair>(tradingPairs[0]);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [tradeTime, setTradeTime] = useState(60);
  const [tradeAmount, setTradeAmount] = useState('');
  const [price, setPrice] = useState(selectedPair.price);
  const [tradeTab, setTradeTab] = useState('active');

  // Profit rates for options
  const profitRates = {
    60: { payout: 0.85, profit: 15 },    // 60s = 85% payout (15% profit)
    120: { payout: 0.82, profit: 18 },   // 120s = 82% payout (18% profit)  
    240: { payout: 0.78, profit: 22 },   // 240s = 78% payout (22% profit)
    360: { payout: 0.75, profit: 25 },   // 360s = 75% payout (25% profit)
    600: { payout: 0.70, profit: 30 }    // 600s = 70% payout (30% profit)
  };

  // Update price periodically
  useEffect(() => {
    setPrice(selectedPair.price);
    const interval = setInterval(() => {
      setPrice((p) => parseFloat((p + (Math.random() - 0.5) * (selectedPair.price * 0.001)).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  // Get current tab for pair selector
  const getCurrentTab = () => {
    if (tab === 'spot') return 'Crypto';
    if (tab === 'futures') return 'Futures';
    if (tab === 'option') return 'Crypto';
    return 'Crypto';
  };

  // ==================== TRADING HANDLERS ====================

  // Spot Trading Handler
  const handleSpotTrade = async (side: 'buy' | 'sell', pair: string, amountRaw: number | string, priceRaw: number | string) => {
    const amount = Number(amountRaw);
    let price = Number(priceRaw);
    
    if (spotOrderType === 'market' && (!price || isNaN(price))) {
      price = currentPrice;
    }
    
    if (!amount || isNaN(amount) || amount <= 0 || !price || isNaN(price)) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid amount and price.', 
        variant: 'destructive' 
      });
      return;
    }

    if (amount > balances.USDT) {
      toast({ 
        title: 'Insufficient Balance', 
        description: `You need ${amount.toLocaleString()} USDT but have ${balances.USDT.toLocaleString()} USDT.`, 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const transaction = await executeTrade({
        type: 'spot',
        pair,
        side,
        amount,
        price,
        orderType: spotOrderType
      });

      toast({ 
        title: '✅ Trade Placed', 
        description: `${side.toUpperCase()} ${amount} USDT of ${pair} at $${price.toFixed(2)}` 
      });

      // Clear form
      setSpotAmount('');
      setSpotPrice('');
      setSpotPercent(0);
      
    } catch (error) {
      toast({ 
        title: '❌ Trade Failed', 
        description: error instanceof Error ? error.message : 'Failed to place trade', 
        variant: 'destructive' 
      });
    }
  };

  // Futures Trading Handler
  const handleFuturesTrade = async (side: 'buy' | 'sell', pair: string, amountRaw: number | string, priceRaw: number | string) => {
    const amount = Number(amountRaw);
    let price = Number(priceRaw);
    
    if (futuresOrderType === 'market' && (!price || isNaN(price))) {
      price = currentPrice;
    }
    
    if (!amount || isNaN(amount) || amount <= 0 || !price || isNaN(price)) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid amount and price.', 
        variant: 'destructive' 
      });
      return;
    }

    const margin = amount / futuresLeverage;
    if (margin > balances.USDT) {
      toast({ 
        title: 'Insufficient Margin', 
        description: `Required margin: ${margin.toLocaleString()} USDT, Available: ${balances.USDT.toLocaleString()} USDT`, 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const transaction = await executeTrade({
        type: 'futures',
        pair,
        side,
        amount,
        price,
        leverage: futuresLeverage,
        orderType: futuresOrderType,
        positionType: futuresPositionType,
        tpSl: futuresTpSl
      });

      toast({ 
        title: '✅ Futures Position Opened', 
        description: `${side.toUpperCase()} ${amount} USDT of ${pair} with ${futuresLeverage}x leverage` 
      });

      // Clear form
      setFuturesAmount('');
      setFuturesPrice('');
      setFuturesPercent(0);
      
    } catch (error) {
      toast({ 
        title: '❌ Position Failed', 
        description: error instanceof Error ? error.message : 'Failed to open position', 
        variant: 'destructive' 
      });
    }
  };

  // Options Trading Handler
  const handleOptionsTrade = async (side: 'up' | 'down', pair: string, amountRaw: number | string) => {
    const amount = Number(amountRaw);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid amount.', 
        variant: 'destructive' 
      });
      return;
    }

    if (amount > balances.USDT) {
      toast({ 
        title: 'Insufficient Balance', 
        description: `You need ${amount.toLocaleString()} USDT but have ${balances.USDT.toLocaleString()} USDT.`, 
        variant: 'destructive' 
      });
      return;
    }

    const payoutRate = profitRates[tradeTime as keyof typeof profitRates]?.payout || 0.8;
    const profitAmount = amount * payoutRate - amount;
    const endTime = Date.now() + tradeTime * 1000;

    try {
      const transaction = await executeTrade({
        type: 'options',
        pair,
        side: side === 'up' ? 'call' : 'put',
        amount,
        price: selectedPair.price,
        strike: selectedPair.price,
        expiration: new Date(endTime).toISOString(),
        timeFrame: tradeTime,
        profitRate: payoutRate,
        expectedProfit: profitAmount
      });

      toast({ 
        title: '✅ Option Purchased', 
        description: `${side.toUpperCase()} $${amount} on ${pair} for ${tradeTime}s` 
      });

      // Clear form
      setTradeAmount('');
      
    } catch (error) {
      toast({ 
        title: '❌ Option Failed', 
        description: error instanceof Error ? error.message : 'Failed to purchase option', 
        variant: 'destructive' 
      });
    }
  };

  // Helper: Get average buy price
  const getAvgBuyPrice = (asset: string) => {
    const buys = transactions.filter(t => 
      t.type === 'Trade' && 
      t.asset.startsWith(asset) && 
      t.status === 'Completed' &&
      t.details?.side === 'buy'
    );
    const totalQty = buys.reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = buys.reduce((sum, t) => sum + t.amount * (t.details?.price || 0), 0);
    return totalQty > 0 ? totalSpent / totalQty : 0;
  };

  // Helper: Calculate PnL
  const getPnL = (trade: any) => {
    if (trade.status !== 'Completed') return null;
    const avgBuy = getAvgBuyPrice(trade.asset.split('/')[0]);
    if (!avgBuy) return null;
    const pnl = (trade.details?.price - avgBuy) * trade.amount;
    return pnl;
  };

  // Complete transaction
  const handleCompleteTransaction = (id: string) => {
    updateTransaction(id, { status: 'Completed' });
    toast({ 
      title: '✅ Transaction Completed', 
      description: 'Transaction has been marked as completed.' 
    });
  };

  // Cancel transaction
  const handleCancelTransaction = (id: string) => {
    updateTransaction(id, { status: 'Failed' });
    toast({ 
      title: '❌ Transaction Cancelled', 
      description: 'Transaction has been cancelled.' 
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#181A20] pb-16 md:pb-20">
        {/* Mobile Header - Sticky */}
        <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
          <div className="container mx-auto px-3 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 hover:bg-[#23262F] rounded-lg transition-colors" 
                  title="Menu" 
                  onClick={() => setPairSelectorOpen(true)}
                >
                  <Menu size={22} className="text-[#848E9C]" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xl md:text-2xl font-bold text-[#EAECEF]">
                    {tab === 'spot' && spotPair.split('/')[0]}
                    {tab === 'futures' && futuresPair.split('/')[0]}
                    {tab === 'option' && optionsPair.split('/')[0]}
                  </span>
                  <span className="text-green-500 text-lg font-mono">
                    ${currentPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 md:gap-2">
                <button className="p-2 hover:bg-[#23262F] rounded-lg transition-colors" title="Favorite">
                  <Star size={20} className="text-[#848E9C]" />
                </button>
                <button className="p-2 hover:bg-[#23262F] rounded-lg transition-colors" title="Settings">
                  <Settings size={20} className="text-[#848E9C]" />
                </button>
              </div>
            </div>
            
            {/* Mobile Tabs */}
            <div className="mt-3">
              <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-[#1E2329] p-1 rounded-xl">
                  <TabsTrigger value="spot" className="text-sm md:text-base data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg">
                    Spot
                  </TabsTrigger>
                  <TabsTrigger value="futures" className="text-sm md:text-base data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg">
                    Futures
                  </TabsTrigger>
                  <TabsTrigger value="option" className="text-sm md:text-base data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg">
                    Option
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 py-4">
          {/* Pair Selector Modal */}
          <EnhancedPairSelectorModal
            open={pairSelectorOpen}
            onClose={() => setPairSelectorOpen(false)}
            currentTab={getCurrentTab()}
            onSelectPair={pair => {
              if (tab === 'spot') setSpotPair(pair.name);
              if (tab === 'futures') setFuturesPair(pair.name);
              if (tab === 'option') setOptionsPair(pair.name);
            }}
          />

          {/* Mobile Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 md:hidden">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">Balance</div>
              <div className="font-bold text-[#EAECEF]">${balances.USDT.toLocaleString()}</div>
            </Card>
            <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">24h Change</div>
              <div className="font-bold text-green-500">+2.34%</div>
            </Card>
            <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
              <div className="text-xs text-[#848E9C]">Volume</div>
              <div className="font-bold text-[#EAECEF]">$1.2B</div>
            </Card>
          </div>

          {/* Main Trading Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            
            {/* Left Column - Chart */}
            <div className="lg:col-span-7 order-1">
              <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#F0B90B]" />
                    <span className="font-semibold text-sm md:text-base text-[#EAECEF]">Price Chart</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#2B3139] text-[#848E9C]">
                      <Activity size={12} className="mr-1" />
                      1m
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-400">
                      Live
                    </Badge>
                  </div>
                </div>
                <TradingViewWidget 
                  symbol={(tab === 'spot' ? spotPair : tab === 'futures' ? futuresPair : optionsPair).replace('/', '')} 
                />
              </Card>
            </div>

            {/* Center Column - Order Form */}
            <div className="lg:col-span-5 order-2 space-y-4">
              {tab === 'spot' && (
                <Card className="bg-[#1E2329] border border-[#F0B90B] p-4 md:p-6">
                  {/* Buy/Sell Toggle */}
                  <div className="flex mb-4 bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
                    <button
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-sm md:text-base transition-all ${
                        spotSide === 'buy' 
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                          : 'text-[#848E9C] hover:text-white'
                      }`}
                      onClick={() => setSpotSide('buy')}
                    >
                      Buy
                    </button>
                    <button
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-sm md:text-base transition-all ${
                        spotSide === 'sell' 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                          : 'text-[#848E9C] hover:text-white'
                      }`}
                      onClick={() => setSpotSide('sell')}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Order Form */}
                  <div className="space-y-3">
                    <Select value={spotOrderType} onValueChange={value => setSpotOrderType(value as any)}>
                      <SelectTrigger className="w-full bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                        <SelectValue placeholder="Order Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <Input
                        type="number"
                        className="w-full bg-[#181A20] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] text-sm md:text-base pr-16"
                        value={spotOrderType === 'market' ? currentPrice.toString() : spotPrice}
                        onChange={e => setSpotPrice(e.target.value)}
                        placeholder="Price"
                        disabled={spotOrderType === 'market'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        className="w-full bg-[#181A20] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] text-sm md:text-base pr-16"
                        value={spotAmount}
                        onChange={e => setSpotAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">{spotPair.split('/')[1]}</span>
                    </div>

                    {/* Percentage Slider */}
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min={0} 
                        max={100} 
                        value={spotPercent} 
                        onChange={e => setSpotPercent(Number(e.target.value))} 
                        className="flex-1 h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F0B90B]"
                      />
                      <span className="text-[#EAECEF] text-sm w-12 text-right">{spotPercent}%</span>
                    </div>

                    {/* Balance & Fee */}
                    <div className="flex justify-between text-xs md:text-sm bg-[#181A20] rounded-lg p-3">
                      <span className="text-[#848E9C]">Available</span>
                      <span className="text-[#EAECEF] font-medium">{balances.USDT.toLocaleString()} USDT</span>
                      <span className="text-[#848E9C] ml-auto mr-2">Fee</span>
                      <span className="text-[#EAECEF] font-medium">{spotOrderType === 'market' ? '0.1%' : '0.0%'}</span>
                    </div>

                    {/* Action Button */}
                    <button
                      className={`w-full py-3.5 rounded-lg font-bold text-sm md:text-base transition-all ${
                        spotSide === 'buy' 
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30' 
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                      }`}
                      onClick={() => handleSpotTrade(spotSide, spotPair, parseFloat(spotAmount), parseFloat(spotPrice))}
                      disabled={!spotAmount}
                    >
                      {spotSide === 'buy' ? `Buy ${spotPair.split('/')[0]}` : `Sell ${spotPair.split('/')[0]}`}
                    </button>
                  </div>
                </Card>
              )}

              {tab === 'futures' && (
                <Card className="bg-[#1E2329] border border-[#F0B90B] p-4 md:p-6">
                  {/* Leverage & Position Type */}
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Select value={String(futuresLeverage)} onValueChange={value => setFuturesLeverage(Number(value))}>
                        <SelectTrigger className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                          <SelectValue placeholder="Leverage" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 5, 10, 20, 50, 100].map(lv => (
                            <SelectItem key={lv} value={String(lv)}>{lv}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex flex-1 bg-[#1E2329] p-1 rounded-xl border border-[#2B3139]">
                        <button
                          className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            futuresPositionType === 'open' 
                              ? 'bg-[#F0B90B] text-[#181A20]' 
                              : 'text-[#848E9C] hover:text-[#EAECEF]'
                          }`}
                          onClick={() => setFuturesPositionType('open')}
                        >
                          Open
                        </button>
                        <button
                          className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            futuresPositionType === 'close' 
                              ? 'bg-[#F0B90B] text-[#181A20]' 
                              : 'text-[#848E9C] hover:text-[#EAECEF]'
                          }`}
                          onClick={() => setFuturesPositionType('close')}
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    {/* Order Form */}
                    <Select value={futuresOrderType} onValueChange={value => setFuturesOrderType(value as any)}>
                      <SelectTrigger className="w-full bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                        <SelectValue placeholder="Order Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">Market</SelectItem>
                        <SelectItem value="limit">Limit</SelectItem>
                        <SelectItem value="stop">Stop</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <Input
                        type="number"
                        className="w-full bg-[#181A20] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] text-sm md:text-base pr-16"
                        value={futuresOrderType === 'market' ? (liveFuturesPrice ? liveFuturesPrice.toString() : '') : futuresPrice}
                        onChange={e => setFuturesPrice(e.target.value)}
                        placeholder="Price"
                        disabled={futuresOrderType === 'market'}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        className="w-full bg-[#181A20] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] text-sm md:text-base pr-16"
                        value={futuresAmount}
                        onChange={e => setFuturesAmount(e.target.value)}
                        placeholder="Amount"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                    </div>

                    {/* TP/SL */}
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={futuresTpSl} 
                        onChange={e => setFuturesTpSl(e.target.checked)}
                        className="w-4 h-4 rounded border-[#2B3139] bg-[#181A20] text-[#F0B90B] focus:ring-[#F0B90B]"
                      />
                      <span className="text-[#EAECEF]">Take Profit / Stop Loss</span>
                    </label>

                    {/* Margin Info */}
                    {futuresAmount && (
                      <div className="bg-[#181A20] rounded-lg p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#848E9C]">Position Size</span>
                          <span className="text-[#EAECEF] font-medium">${(Number(futuresAmount) * futuresLeverage).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#848E9C]">Margin Required</span>
                          <span className="text-[#F0B90B] font-medium">${(Number(futuresAmount) / futuresLeverage).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    <button
                      className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] py-3.5 rounded-lg font-bold text-sm md:text-base transition-all shadow-lg shadow-[#F0B90B]/30 disabled:opacity-50"
                      onClick={() => handleFuturesTrade(futuresSide, futuresPair, parseFloat(futuresAmount), parseFloat(futuresPrice))}
                      disabled={!futuresAmount}
                    >
                      {futuresPositionType === 'open' ? 'Open Position' : 'Close Position'}
                    </button>
                  </div>
                </Card>
              )}

              {tab === 'option' && (
                <div className="bg-[#1E2329] border border-[#F0B90B] p-4 md:p-6 rounded-lg">
                  <h2 className="text-lg md:text-xl font-bold mb-4 text-[#F0B90B] flex items-center gap-2">
                    <Zap size={20} />
                    Options Trading
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Trading Pair Selection */}
                    <div>
                      <label className="text-xs md:text-sm text-[#848E9C] mb-1 block">Trading Pair</label>
                      <div className="grid grid-cols-3 gap-2">
                        {tradingPairs.map((pair) => (
                          <button
                            key={pair.label}
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                              selectedPair.label === pair.label 
                                ? 'border-[#F0B90B] bg-[#F0B90B]/10' 
                                : 'border-[#2B3139] bg-[#181A20] hover:border-[#F0B90B]/50'
                            }`}
                            onClick={() => setSelectedPair(pair)}
                          >
                            <span className="text-xs font-medium text-[#EAECEF] mb-1">{pair.label}</span>
                            <span className="text-sm font-bold text-[#F0B90B]">${pair.price.toLocaleString()}</span>
                            <span className={`text-xs ${pair.change && pair.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pair.change && pair.change > 0 ? '+' : ''}{pair.change}%
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direction Selection */}
                    <div>
                      <label className="text-xs md:text-sm text-[#848E9C] mb-1 block">Direction</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            direction === 'up' 
                              ? 'bg-green-500/20 border-green-500 text-green-500' 
                              : 'bg-[#181A20] border-[#2B3139] text-[#848E9C] hover:text-green-500 hover:border-green-500/50'
                          }`}
                          onClick={() => setDirection('up')}
                        >
                          <TrendingUp size={16} />
                          <span className="font-bold">Up</span>
                        </button>
                        <button
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                            direction === 'down' 
                              ? 'bg-red-500/20 border-red-500 text-red-500' 
                              : 'bg-[#181A20] border-[#2B3139] text-[#848E9C] hover:text-red-500 hover:border-red-500/50'
                          }`}
                          onClick={() => setDirection('down')}
                        >
                          <TrendingUp size={16} className="rotate-180" />
                          <span className="font-bold">Down</span>
                        </button>
                      </div>
                    </div>

                    {/* Time Range */}
                    <div>
                      <label className="text-xs md:text-sm text-[#848E9C] mb-2 block">Expiry Time</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {timeRanges.map((t) => {
                          const rate = profitRates[t as keyof typeof profitRates];
                          return (
                            <button
                              key={t}
                              className={`py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                                tradeTime === t 
                                  ? 'bg-[#F0B90B] text-[#181A20]' 
                                  : 'bg-[#181A20] text-[#848E9C] border border-[#2B3139] hover:border-[#F0B90B]/50'
                              }`}
                              onClick={() => setTradeTime(t)}
                            >
                              <div>{t}s</div>
                              <div className="text-[10px] opacity-80">+{rate?.profit}%</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={tradeAmount}
                        onChange={e => setTradeAmount(e.target.value)}
                        className="w-full bg-[#181A20] border border-[#2B3139] rounded-lg px-4 py-3 text-[#EAECEF] text-sm md:text-base pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] text-xs">USDT</span>
                    </div>

                    {/* Trade Summary */}
                    <div className="bg-[#181A20] rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Available Balance</span>
                        <span className="text-[#EAECEF] font-medium">{balances.USDT.toLocaleString()} USDT</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Investment</span>
                        <span className="text-[#EAECEF] font-medium">
                          {tradeAmount ? `$${Number(tradeAmount).toLocaleString()}` : '$0'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Payout</span>
                        <span className="text-green-400 font-medium">
                          {(() => {
                            const amt = Number(tradeAmount);
                            if (!amt) return '$0';
                            const rate = profitRates[tradeTime as keyof typeof profitRates]?.payout || 0.8;
                            return `$${(amt * rate).toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Potential Profit</span>
                        <span className="text-green-400 font-medium">
                          {(() => {
                            const amt = Number(tradeAmount);
                            if (!amt) return '$0';
                            const rate = profitRates[tradeTime as keyof typeof profitRates]?.payout || 0.8;
                            const profit = amt * rate - amt;
                            return `+$${profit.toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] py-3.5 rounded-lg font-bold text-sm md:text-base transition-all shadow-lg shadow-[#F0B90B]/30 disabled:opacity-50"
                      onClick={() => handleOptionsTrade(direction, selectedPair.label, tradeAmount)}
                      disabled={!tradeAmount}
                    >
                      Buy Option
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Book & Trades */}
            <div className="lg:col-span-5 order-3 space-y-4">
              {/* Mobile Toggles */}
              <div className="lg:hidden flex gap-2">
                <button
                  onClick={() => setShowOrderBook(!showOrderBook)}
                  className="flex-1 bg-[#1E2329] border border-[#2B3139] rounded-lg p-2 flex items-center justify-center gap-2 text-sm"
                >
                  <Layers size={16} className="text-[#F0B90B]" />
                  {showOrderBook ? 'Hide' : 'Show'} Order Book
                  <ChevronDown size={14} className={`transition-transform ${showOrderBook ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => setShowRecentTrades(!showRecentTrades)}
                  className="flex-1 bg-[#1E2329] border border-[#2B3139] rounded-lg p-2 flex items-center justify-center gap-2 text-sm"
                >
                  <Activity size={16} className="text-[#F0B90B]" />
                  {showRecentTrades ? 'Hide' : 'Show'} Trades
                  <ChevronDown size={14} className={`transition-transform ${showRecentTrades ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Order Book */}
              {(showOrderBook || window.innerWidth >= 1024) && (
                <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-[#F0B90B]" />
                      <span className="font-semibold text-sm md:text-base text-[#EAECEF]">Order Book</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#2B3139] text-[#848E9C]">{spotPair}</Badge>
                      <span className="text-xs text-[#848E9C]">5 levels</span>
                    </div>
                  </div>
                  
                  {/* Headers */}
                  <div className="grid grid-cols-3 gap-4 text-xs text-[#848E9C] mb-2 px-2">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Total</span>
                  </div>

                  {/* Asks */}
                  <div className="space-y-1 mb-2">
                    {orderBook.asks.slice().reverse().map((ask, i) => (
                      <OrderBookRow key={`ask-${i}`} {...ask} type="ask" />
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="flex items-center justify-between py-2 px-2 bg-[#2B3139]/30 rounded my-1">
                    <span className="text-xs text-[#848E9C]">Spread</span>
                    <span className="text-xs font-mono text-[#EAECEF]">
                      ${(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#848E9C]">
                      {((orderBook.asks[0].price - orderBook.bids[0].price) / orderBook.bids[0].price * 100).toFixed(2)}%
                    </span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1 mt-2">
                    {orderBook.bids.map((bid, i) => (
                      <OrderBookRow key={`bid-${i}`} {...bid} type="bid" />
                    ))}
                  </div>
                </Card>
              )}

              {/* Recent Trades */}
              {(showRecentTrades || window.innerWidth >= 1024) && (
                <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <History size={16} className="text-[#F0B90B]" />
                    <span className="font-semibold text-sm md:text-base text-[#EAECEF]">Recent Trades</span>
                    <Badge className="bg-[#2B3139] text-[#848E9C] ml-auto">
                      {recentTrades.length} trades
                    </Badge>
                  </div>

                  {/* Headers */}
                  <div className="grid grid-cols-3 gap-4 text-xs text-[#848E9C] mb-2">
                    <span>Price</span>
                    <span className="text-right">Amount</span>
                    <span className="text-right">Time</span>
                  </div>

                  {/* Trades */}
                  <div className="space-y-1 max-h-[200px] md:max-h-[300px] overflow-y-auto custom-scrollbar">
                    {recentTrades.length === 0 ? (
                      <div className="text-xs text-[#5E6673] text-center py-4">Waiting for trades...</div>
                    ) : (
                      recentTrades.map((trade, i) => (
                        <TradeRow key={i} trade={trade} />
                      ))
                    )}
                  </div>
                </Card>
              )}

              {/* Mini Chart - Mobile */}
              <div className="lg:hidden">
                {miniChartPrices.length > 0 && (
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#848E9C]">Mini Chart (1m)</span>
                      <span className="text-xs text-[#F0B90B]">${currentPrice.toFixed(2)}</span>
                    </div>
                    <MiniChart data={miniChartPrices} />
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Order Management Section */}
          <div className="mt-6 order-4">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-6">
              {/* Tabs */}
              <div className="flex items-center gap-4 md:gap-6 border-b border-[#2B3139] pb-3 mb-4 overflow-x-auto custom-scrollbar">
                {tab === 'spot' && (
                  <>
                    <button
                      onClick={() => setActiveSpotTab('open')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeSpotTab === 'open' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Clock size={16} />
                      Open Orders ({transactions.filter(t => t.type === 'Trade' && t.status === 'Pending').length})
                    </button>
                    <button
                      onClick={() => setActiveSpotTab('completed')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeSpotTab === 'completed' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <History size={16} />
                      Completed ({transactions.filter(t => t.type === 'Trade' && t.status === 'Completed').length})
                    </button>
                    <button
                      onClick={() => setActiveSpotTab('assets')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeSpotTab === 'assets' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Wallet size={16} />
                      Assets ({portfolio.length})
                    </button>
                  </>
                )}
                
                {tab === 'futures' && (
                  <>
                    <button
                      onClick={() => setActiveFuturesTab('positions')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeFuturesTab === 'positions' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <TrendingUp size={16} />
                      Positions
                    </button>
                    <button
                      onClick={() => setActiveFuturesTab('open')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeFuturesTab === 'open' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Clock size={16} />
                      Open Orders
                    </button>
                    <button
                      onClick={() => setActiveFuturesTab('closed')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeFuturesTab === 'closed' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <History size={16} />
                      Closed Orders
                    </button>
                  </>
                )}
                
                {tab === 'option' && (
                  <>
                    <button
                      onClick={() => setActiveOptionsTab('open')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeOptionsTab === 'open' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <Clock size={16} />
                      Open Options ({[...transactions.filter(t => t.type === 'Trade' && t.status === 'Pending'), 
                        { id: 'mock-1', status: 'Pending' }, { id: 'mock-2', status: 'Pending' }].length})
                    </button>
                    <button
                      onClick={() => setActiveOptionsTab('completed')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeOptionsTab === 'completed' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <History size={16} />
                      Completed
                    </button>
                    <button
                      onClick={() => setActiveOptionsTab('closed')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                        activeOptionsTab === 'closed' 
                          ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                          : 'text-[#848E9C] hover:text-[#EAECEF]'
                      }`}
                    >
                      <History size={16} />
                      Closed
                    </button>
                  </>
                )}
              </div>

              {/* Tab Content */}
              <div className="overflow-x-auto">
                {tab === 'spot' && (
                  <>
                    {activeSpotTab === 'open' && (
                      <AnimatePresence>
                        {transactions.filter(t => t.type === 'Trade' && t.status === 'Pending').length === 0 ? (
                          <div className="text-center py-8 text-[#848E9C] text-sm">No open orders</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {transactions.filter(t => t.type === 'Trade' && t.status === 'Pending').map(t => (
                              <OrderCard
                                key={t.id}
                                order={t}
                                type="spot"
                                onComplete={() => handleCompleteTransaction(t.id)}
                                onCancel={() => handleCancelTransaction(t.id)}
                              />
                            ))}
                          </div>
                        )}
                      </AnimatePresence>
                    )}

                    {activeSpotTab === 'completed' && (
                      <div className="text-center py-8 text-[#848E9C] text-sm">
                        {transactions.filter(t => t.type === 'Trade' && t.status === 'Completed').length === 0
                          ? 'No completed orders'
                          : `${transactions.filter(t => t.type === 'Trade' && t.status === 'Completed').length} completed orders`
                        }
                      </div>
                    )}

                    {activeSpotTab === 'assets' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {portfolio.length === 0 ? (
                          <div className="col-span-full text-center py-8 text-[#848E9C] text-sm">No assets</div>
                        ) : (
                          portfolio.map(asset => (
                            <div key={asset.symbol} className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-[#EAECEF]">{asset.symbol}</span>
                                <span className="text-xs text-[#848E9C]">{asset.name}</span>
                              </div>
                              <div className="text-xl font-bold text-[#EAECEF] mb-1">{asset.balance.toFixed(6)}</div>
                              <div className="text-sm text-[#848E9C]">≈ ${asset.value.toFixed(2)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}

                {tab === 'futures' && (
                  <div className="text-center py-8 text-[#848E9C] text-sm">
                    {activeFuturesTab === 'positions' && 'No open positions'}
                    {activeFuturesTab === 'open' && 'No open orders'}
                    {activeFuturesTab === 'closed' && 'No closed orders'}
                  </div>
                )}

                {tab === 'option' && (
                  <>
                    {activeOptionsTab === 'open' && (
                      <AnimatePresence>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                            ...transactions.filter(t => t.type === 'Trade' && t.status === 'Pending'),
                            // Mock options for demonstration
                            {
                              id: 'mock-option-1',
                              type: 'Trade',
                              asset: 'BTC/USDT',
                              amount: 50,
                              status: 'Pending',
                              date: new Date().toISOString(),
                              details: {
                                side: 'up',
                                price: 43000,
                                timeFrame: 120,
                                profitRate: 0.82,
                                expectedProfit: 9,
                                endTime: Date.now() + 120000,
                              }
                            },
                            {
                              id: 'mock-option-2',
                              type: 'Trade',
                              asset: 'ETH/USDT',
                              amount: 25,
                              status: 'Pending',
                              date: new Date().toISOString(),
                              details: {
                                side: 'down',
                                price: 2950,
                                timeFrame: 240,
                                profitRate: 0.78,
                                expectedProfit: 5.5,
                                endTime: Date.now() + 240000,
                              }
                            }
                          ].map(t => (
                            <OrderCard
                              key={t.id}
                              order={t}
                              type="option"
                              onComplete={() => handleCompleteTransaction(t.id)}
                              onCancel={() => handleCancelTransaction(t.id)}
                            />
                          ))}
                        </div>
                      </AnimatePresence>
                    )}

                    {activeOptionsTab === 'completed' && (
                      <div className="text-center py-8 text-[#848E9C] text-sm">No completed options</div>
                    )}

                    {activeOptionsTab === 'closed' && (
                      <div className="text-center py-8 text-[#848E9C] text-sm">No closed options</div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

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
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </ErrorBoundary>
  );
}