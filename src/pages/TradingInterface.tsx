// TradingInterface.tsx - Fixed with proper wallet integration and admin controls
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Clock,
  Wallet,
  Shield,
  RefreshCw,
  ChevronRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Crown,
  AlertTriangle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

// Hooks
import useBinanceStream from '@/hooks/useBinanceStream';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingControl } from '@/hooks/useTradingControl';

// Services
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/walletService';
import { positionService } from '@/services/positionService';

// Components
import SpotTradeForm from '@/components/trading/SpotTradeForm';
import FuturesTradeForm from '@/components/trading/FuturesTradeForm';
import OptionsTradeForm from '@/components/trading/OptionsTradeForm';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import OrderHistoryTable from '@/components/trading/OrderHistoryTable';
import PositionCard from '@/components/trading/PositionCard';

// Utils
import { formatPrice, formatCurrency, validateOrder, calculateMargin } from '@/utils/tradingCalculations';

// Types
import { Transaction, Position, OrderSide, OrderType } from '@/types/trading';

// Constants
const ORDER_TYPES = ['market', 'limit', 'stop'] as const;
const LEVERAGES = [1, 2, 5, 10, 20, 50, 100];
const POSITION_TIMES = [60, 120, 300];
const ASSETS = ['USDT', 'BTC', 'ETH'];

const PROFIT_RATES = {
  60: { payout: 0.85, profit: 15 },
  120: { payout: 0.82, profit: 18 },
  300: { payout: 0.75, profit: 25 }
};

// Order Book Row Component
const OrderBookRow = ({ price, amount, type }: { price: string; amount: string; type: 'bid' | 'ask' }) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
      ${parseFloat(price).toFixed(2)}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{parseFloat(amount).toFixed(4)}</span>
    <span className="text-xs text-[#848E9C]">
      ${(parseFloat(price) * parseFloat(amount)).toFixed(2)}
    </span>
  </div>
);

// Order Card Component (Mobile Optimized)
const OrderCard = ({ order, type, onCancel }: { order: Transaction; type: 'spot' | 'futures' | 'options'; onCancel?: () => void }) => {
  const isBuy = order.side === 'buy';
  const isOpen = order.status === 'pending' || order.status === 'processing';
  
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] p-3 mb-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {order.side?.toUpperCase() || order.metadata?.direction?.toUpperCase()}
          </Badge>
          <Badge className={isOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#2B3139] text-[#848E9C]'}>
            {order.status}
          </Badge>
          {order.metadata?.shouldWin && (
            <Badge className="bg-emerald-500/20 text-emerald-400">
              <Crown className="w-3 h-3 mr-1" />
              Force Win
            </Badge>
          )}
        </div>
        <span className="text-xs text-[#848E9C]">{new Date(order.createdAt).toLocaleTimeString()}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-[#848E9C]">Symbol</div>
          <div className="font-medium text-[#EAECEF]">{order.asset}</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Amount</div>
          <div className="font-medium text-[#EAECEF]">{order.amount} {order.metadata?.asset || 'USDT'}</div>
        </div>
        {order.price > 0 && (
          <div>
            <div className="text-xs text-[#848E9C]">Price</div>
            <div className="font-medium text-[#EAECEF]">${formatPrice(order.price)}</div>
          </div>
        )}
        {order.metadata?.leverage && (
          <div>
            <div className="text-xs text-[#848E9C]">Leverage</div>
            <div className="font-medium text-[#F0B90B]">{order.metadata.leverage}x</div>
          </div>
        )}
        {order.metadata?.timeFrame && (
          <div>
            <div className="text-xs text-[#848E9C]">Expiry</div>
            <div className="font-medium text-[#EAECEF]">{order.metadata.timeFrame}s</div>
          </div>
        )}
        {order.pnl !== undefined && order.pnl !== 0 && (
          <div>
            <div className="text-xs text-[#848E9C]">P&L</div>
            <div className={`font-medium ${order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {order.pnl >= 0 ? '+' : ''}{formatCurrency(order.pnl)} USDT
            </div>
          </div>
        )}
      </div>
      
      {isOpen && onCancel && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-[#2B3139]">
          <Button 
            size="sm" 
            variant="ghost" 
            className="flex-1 text-xs h-7 text-red-400 hover:text-red-300"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </Card>
  );
};

// Mini Chart Component
const MiniChart = ({ data }: { data: any[] }) => {
  if (data.length === 0) return null;
  
  const prices = data.map(k => parseFloat(k.c));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  
  return (
    <div className="flex items-end h-16 gap-0.5">
      {data.slice(-30).map((k, i) => {
        const height = ((parseFloat(k.c) - min) / range) * 100;
        return (
          <div
            key={i}
            className="flex-1 bg-[#F0B90B]/60 hover:bg-[#F0B90B] transition-colors rounded-t"
            style={{ height: `${Math.max(15, height)}%` }}
          />
        );
      })}
    </div>
  );
};

export default function TradingInterface() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'spot' | 'futures' | 'options'>('spot');
  const [symbols, setSymbols] = useState<string[]>([]);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [loadingSymbols, setLoadingSymbols] = useState(true);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [hideBalances, setHideBalances] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Contexts
  const { user, isAuthenticated } = useAuth();
  const { balances, updateBalance, addBalance } = useWallet();
  const {
    userOutcome,
    activeWindows,
    systemSettings,
    countdown,
    shouldWin,
    loading: controlsLoading
  } = useTradingControl();

  // Spot state
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
  const [futuresLeverage, setFuturesLeverage] = useState<number>(10);
  const [futuresTpSl, setFuturesTpSl] = useState(false);

  // Options state
  const [optionsDirection, setOptionsDirection] = useState<'up' | 'down'>('up');
  const [optionsPositionTime, setOptionsPositionTime] = useState<number>(60);
  const [optionsOrderType, setOptionsOrderType] = useState<'market' | 'limit'>('market');
  const [optionsAmount, setOptionsAmount] = useState('');
  const [optionsAsset, setOptionsAsset] = useState('USDT');
  const [optionsPercent, setOptionsPercent] = useState(0);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeFooterTab, setActiveFooterTab] = useState<'open' | 'history' | 'positions' | 'completed' | 'assets' | 'scheduled' | 'closed' | 'active'>('open');

  // Load user data
  useEffect(() => {
    if (user?.id) {
      loadUserTransactions();
      loadUserPositions();
    }
  }, [user?.id]);

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

  // Load symbol list from Binance API
  useEffect(() => {
    setLoadingSymbols(true);
    setSymbolError(null);
    fetch('https://api.binance.com/api/v3/exchangeInfo')
      .then(res => res.json())
      .then(data => {
        const pairs = data.symbols
          .filter((s: any) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
          .map((s: any) => s.symbol)
          .sort();
        setSymbols(pairs);
        setLoadingSymbols(false);
      })
      .catch(() => {
        setSymbolError('Failed to load symbols. Please try again.');
        setLoadingSymbols(false);
      });
  }, []);

  // Live data hooks
  const trade = useBinanceStream(symbol, 'trade');
  const depth = useBinanceStream(symbol, 'depth');
  const kline = useBinanceStream(symbol, 'kline', '1m');

  // Chart data (accumulate klines)
  const [chartData, setChartData] = useState<any[]>([]);
  useEffect(() => {
    if (kline && kline.k) {
      setChartData(prev => {
        const exists = prev.find(c => c.t === kline.k.t);
        if (exists) {
          return prev.map(c => c.t === kline.k.t ? kline.k : c);
        } else {
          return [...prev.slice(-99), kline.k];
        }
      });
    }
  }, [kline]);
  useEffect(() => { setChartData([]); }, [symbol]);

  // Trade history (accumulate trades)
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  useEffect(() => {
    if (trade && trade.p) {
      setTradeHistory(prev => [trade, ...prev.slice(0, 49)]);
    }
  }, [trade]);
  useEffect(() => { setTradeHistory([]); }, [symbol]);

  // Order book (depth)
  const orderBook = depth && depth.b && depth.a ? {
    bids: depth.b.slice(0, 8).map((b: any) => ({ price: parseFloat(b[0]), amount: parseFloat(b[1]), total: parseFloat(b[0]) * parseFloat(b[1]) })),
    asks: depth.a.slice(0, 8).map((a: any) => ({ price: parseFloat(a[0]), amount: parseFloat(a[1]), total: parseFloat(a[0]) * parseFloat(a[1]) }))
  } : { bids: [], asks: [] };

  // Current price
  const currentPrice = trade?.p ? parseFloat(trade.p) : 0;
  const priceChange = currentPrice - (chartData[chartData.length - 2]?.c || currentPrice);
  const priceChangePercent = ((priceChange / (chartData[chartData.length - 2]?.c || currentPrice)) * 100) || 0;

  // Filter orders by type
  const getSpotOrders = useCallback(() => 
    transactions.filter(tx => tx.type === 'trade' && !tx.metadata?.leverage), 
  [transactions]);

  const getFuturesOrders = useCallback(() => 
    transactions.filter(tx => tx.type === 'trade' && tx.metadata?.leverage), 
  [transactions]);

  const getOptionsOrders = useCallback(() => 
    transactions.filter(tx => tx.type === 'option'), 
  [transactions]);

  const getActiveOrders = useCallback(() => 
    transactions.filter(tx => tx.status === 'active' || tx.status === 'pending' || tx.status === 'processing'), 
  [transactions]);

  // Cancel order - calculate losses and return remaining funds
  const handleCancelOrder = async (orderId: string) => {
    try {
      const order = transactions.find(tx => tx.id === orderId);
      if (!order) return;

      // Calculate elapsed time and losses (simulate gradual loss)
      const elapsedSeconds = (Date.now() - new Date(order.createdAt).getTime()) / 1000;
      const lossRate = Math.min(elapsedSeconds * 0.01, 0.95); // Max 95% loss over time
      const lossAmount = order.total * lossRate;
      const remainingAmount = order.total - lossAmount;

      // Update order status
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === orderId
            ? { 
                ...tx, 
                status: 'cancelled',
                pnl: -lossAmount,
                metadata: {
                  ...tx.metadata,
                  cancelledAt: new Date().toISOString(),
                  lossAmount,
                  returnedAmount: remainingAmount
                }
              }
            : tx
        )
      );

      // Unlock remaining funds
      await walletService.unlockBalance({
        userId: user!.id,
        asset: 'USDT',
        amount: order.total,
        reference: orderId
      });
      
      // Return remaining funds to wallet
      await updateBalance('USDT', remainingAmount, 'add');

      // Show message about loss and return
      if (lossAmount > 0) {
        toast({
          title: "Order Cancelled",
          description: `Loss: $${lossAmount.toFixed(2)}, Returned: $${remainingAmount.toFixed(2)}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Order Cancelled",
          description: `Returned: $${remainingAmount.toFixed(2)}`
        });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive"
      });
    }
  };

  // Stop order - finalize the trade
  const handleStopOrder = async (orderId: string) => {
    try {
      const order = transactions.find(tx => tx.id === orderId);
      if (!order) return;

      // Check if user should win
      const wins = await shouldWin(order.type === 'option' ? 'options' : 'trade');
      
      let finalPnl = 0;
      if (wins) {
        // Calculate profit (5% for spot/futures, based on payout for options)
        if (order.type === 'option' && order.metadata?.payout) {
          finalPnl = order.metadata.payout - order.total;
        } else {
          finalPnl = order.total * 0.05;
        }
        
        // Add profit to wallet
        await walletService.addBalance({
          userId: user!.id,
          asset: 'USDT',
          amount: order.total + finalPnl,
          reference: orderId,
          type: 'trade_settlement'
        });
        await updateBalance('USDT', order.total + finalPnl, 'add');
        
        toast({
        title: "Trade Won!",
        description: `+$${finalPnl.toFixed(2)} profit`
      });
      } else {
        // Losing trade - funds already deducted
        finalPnl = -order.total;
        toast({
        title: "Trade Lost",
        description: `-$${order.total.toFixed(2)}`,
        variant: "destructive"
      });
      }

      // Update transaction
      setTransactions(prev =>
        prev.map(tx =>
          tx.id === orderId
            ? { 
                ...tx, 
                status: 'completed', 
                pnl: finalPnl,
                metadata: {
                  ...tx.metadata,
                  outcome: wins ? 'win' : 'loss',
                  completedAt: new Date().toISOString()
                }
              }
            : tx
        )
      );

    } catch (error) {
      console.error('Failed to stop order:', error);
      toast.error('Failed to stop order');
    }
  };

  // Place order simulation for each form
  const handleSpotSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const amount = parseFloat(spotAmount);
    const price = spotOrderType === 'market' ? currentPrice : parseFloat(spotPrice);
    
    // Validate order
    const validation = validateOrder({
      type: 'spot',
      side: spotSide,
      amount,
      price,
      balance: balances.USDT || 0
    });

    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    setLoading(true);

    try {
      // Check if trade should win
      const wins = await shouldWin('spot');
      
      const total = amount * price;

      // Create order
      const order = await tradingService.createSpotOrder({
        userId: user!.id,
        pair: symbol,
        side: spotSide,
        type: spotOrderType,
        amount,
        price,
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
        asset: symbol,
        amount,
        price,
        total,
        side: spotSide,
        status: spotOrderType === 'market' ? 'completed' : 'active',
        pnl: spotOrderType === 'market' ? (wins ? total * 0.05 : -total) : 0,
        metadata: {
          orderType: spotOrderType,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);
      await updateBalance('USDT', -total, 'subtract');

      // Handle market orders immediately
      if (spotOrderType === 'market') {
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
          await updateBalance('USDT', total + profit, 'add');
        } else {
          toast.error(`Trade Lost -$${total.toFixed(2)}`);
          // For losing trades, the balance was already deducted above, no additional action needed
        }
      } else {
        toast.info(`Order placed: ${spotOrderType} ${spotSide} ${amount} ${symbol}`);
      }

      // Clear form
      setSpotAmount('');
      setSpotPrice('');
      setSpotPercent(0);

    } catch (error) {
      console.error('Spot trade failed:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const handleFuturesSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const amount = parseFloat(futuresAmount);
    const price = futuresOrderType === 'market' ? currentPrice : parseFloat(futuresPrice);
    
    // Calculate margin
    const margin = calculateMargin(amount, futuresLeverage);
    
    // Validate position
    if (margin > (balances.USDT || 0)) {
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
        pair: symbol,
        side: futuresSide,
        type: futuresPositionType,
        orderType: futuresOrderType,
        amount,
        price,
        leverage: futuresLeverage,
        margin,
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
        pair: symbol,
        side: futuresSide,
        size: amount,
        entryPrice: price,
        markPrice: price,
        leverage: futuresLeverage,
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
      await updateBalance('USDT', -margin, 'subtract');

      // Add transaction
      const transaction: Transaction = {
        id: position.id,
        userId: user!.id,
        type: 'trade',
        asset: symbol,
        amount,
        price,
        total: amount,
        side: futuresSide,
        status: futuresOrderType === 'market' ? 'completed' : 'active',
        pnl: 0,
        metadata: {
          orderType: futuresOrderType,
          leverage: futuresLeverage,
          positionType: futuresPositionType,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);

      // Show message
      if (futuresOrderType === 'market') {
        toast.success(`${futuresPositionType === 'open' ? 'Opened' : 'Closed'} ${futuresSide} position with ${futuresLeverage}x leverage`);
        
        // Simulate immediate PnL for winning trades
        if (wins) {
          const pnl = margin * 0.2;
          toast.success(`Position is profitable! +$${pnl.toFixed(2)} unrealized`);
        }
      } else {
        toast.info(`${futuresOrderType} order placed for ${futuresSide} position`);
      }

      // Clear form
      setFuturesAmount('');
      setFuturesPrice('');
      setFuturesPercent(0);

    } catch (error) {
      console.error('Futures trade failed:', error);
      toast.error('Failed to open position');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const amount = parseFloat(optionsAmount);
    
    if (amount > (balances.USDT || 0)) {
      toast.error(`Insufficient balance. Required: $${amount.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      // Check if option should win
      const wins = await shouldWin('options');
      
      const rate = PROFIT_RATES[optionsPositionTime as keyof typeof PROFIT_RATES]?.payout || 0.8;
      const payout = amount * rate;
      const expiresAt = Date.now() + optionsPositionTime * 1000;

      // Create option
      const option = await tradingService.createOption({
        userId: user!.id,
        pair: symbol,
        direction: optionsDirection,
        amount,
        timeFrame: optionsPositionTime,
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
        amount,
        reference: option.id,
        type: 'option_premium'
      });

      // Add to transactions
      const transaction: Transaction = {
        id: option.id,
        userId: user!.id,
        type: 'option',
        asset: symbol,
        amount,
        price: currentPrice,
        total: amount,
        side: optionsDirection === 'up' ? 'buy' : 'sell',
        status: 'scheduled',
        pnl: 0,
        metadata: {
          direction: optionsDirection,
          timeFrame: optionsPositionTime,
          payout,
          expiresAt,
          shouldWin: wins,
          outcome: wins ? 'win' : 'loss'
        },
        createdAt: new Date().toISOString()
      };

      setTransactions(prev => [transaction, ...prev]);
      await updateBalance('USDT', -amount, 'subtract');

      toast.info(`Option purchased! Expires in ${optionsPositionTime}s`);

      // Schedule settlement
      setTimeout(async () => {
        const finalPnl = wins ? payout - amount : -amount;
        
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
          await updateBalance('USDT', payout, 'add');
          toast.success(`Option won! +$${(payout - amount).toFixed(2)} profit`);
        } else {
          toast.error(`Option lost -$${amount.toFixed(2)}`);
        }
      }, optionsPositionTime * 1000);

      // Clear form
      setOptionsAmount('');
      setOptionsPercent(0);

    } catch (error) {
      console.error('Options trade failed:', error);
      toast.error('Failed to purchase option');
    } finally {
      setLoading(false);
    }
  };

  // Render force win badge
  const renderForceWinBadge = () => {
    if (userOutcome?.enabled && userOutcome.outcome_type === 'win') {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 ml-2 animate-pulse">
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
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 ml-2">
          <Clock className="w-3 h-3 mr-1" />
          Win Window {countdown && `(${countdown})`}
        </Badge>
      );
    }

    return null;
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] pb-24"
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-3 md:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-[#848E9C] hover:text-[#EAECEF]"
              onClick={() => navigate('/trading')}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> 
              <span className="hidden sm:inline">Back</span>
            </Button>
            
            <div className="flex items-center gap-2 ml-2">
              <div className="relative">
                <Select value={symbol} onValueChange={setSymbol} disabled={loadingSymbols || !!symbolError}>
                  <SelectTrigger className="w-36 sm:w-48 h-9 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue placeholder={loadingSymbols ? 'Loading...' : symbolError || 'Select Pair'} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E2329] border-[#2B3139] max-h-96">
                    {symbols.slice(0, 50).map(s => (
                      <SelectItem key={s} value={s} className="text-[#EAECEF] hover:bg-[#2B3139]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="hidden sm:block text-right">
                <div className="text-lg font-bold text-[#EAECEF] font-mono flex items-center">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {renderForceWinBadge()}
                </div>
                <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              {hideBalances ? <EyeOff size={18} className="text-[#848E9C]" /> : <Eye size={18} className="text-[#848E9C]" />}
            </button>
            <button
              onClick={() => setChartExpanded(!chartExpanded)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors hidden sm:block"
            >
              {chartExpanded ? <Minimize2 size={18} className="text-[#848E9C]" /> : <Maximize2 size={18} className="text-[#848E9C]" />}
            </button>
            <div className="ml-2">
              <Tabs value={tab} onValueChange={v => setTab(v as any)}>
                <TabsList className="bg-[#1E2329] p-1 rounded-lg h-9">
                  <TabsTrigger value="spot" className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded">
                    Spot
                  </TabsTrigger>
                  <TabsTrigger value="futures" className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded">
                    Futures
                  </TabsTrigger>
                  <TabsTrigger value="options" className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded">
                    Options
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Mobile Price Bar */}
        <div className="sm:hidden px-3 pb-2 flex items-center justify-between">
          <div className="text-lg font-bold text-[#EAECEF] font-mono flex items-center gap-2">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {renderForceWinBadge()}
          </div>
          <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Auth Warning Banner */}
      {!isAuthenticated && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg m-3 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <p className="text-sm text-yellow-400">
              Please <button onClick={() => navigate('/login')} className="underline hover:text-yellow-300">login</button> to trade
            </p>
          </div>
        </div>
      )}

      {/* Force Win Banner */}
      {userOutcome?.enabled && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg m-3 p-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-emerald-400">
              Force win enabled - you will win all trades!
            </p>
          </div>
        </div>
      )}

      {/* Active Windows Banner */}
      {activeWindows.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg m-3 p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-amber-400">
              Active windows: {activeWindows.map(w => w.outcome_type.toUpperCase()).join(', ')}
              {countdown && ` (${countdown})`}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-3 md:p-4">
        
        {/* Left Column: Chart + Order Form */}
        <div className={`${chartExpanded ? 'lg:w-4/5' : 'lg:w-3/5'} w-full space-y-4`}>
          
          {/* Chart Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-[#F0B90B]" />
                <span className="text-xs text-[#848E9C]">{symbol} • 1m Chart</span>
              </div>
              <div className="flex items-center gap-1">
                <Badge className="bg-[#2B3139] text-[#EAECEF] text-[10px]">
                  <Activity size={10} className="mr-1" />
                  Live
                </Badge>
              </div>
            </div>
            
            {/* Chart Visualization */}
            <div className="relative">
              <div className="h-48 md:h-64 flex flex-col">
                <div className="flex-1 flex items-end">
                  {chartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B90B]" />
                    </div>
                  ) : (
                    <MiniChart data={chartData} />
                  )}
                </div>
              </div>
              
              {/* Chart Overlay - Volume */}
              <div className="absolute bottom-0 left-0 right-0 flex gap-0.5 h-12 opacity-40">
                {chartData.slice(-30).map((k, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#2B3139]"
                    style={{ height: `${Math.min(100, parseFloat(k.v) / 1000)}%` }}
                  />
                ))}
              </div>
            </div>
            
            {/* Price Stats */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-[#2B3139] text-xs">
              <div>
                <div className="text-[#848E9C]">Open</div>
                <div className="font-mono text-[#EAECEF]">${chartData[chartData.length - 1]?.o || '0.00'}</div>
              </div>
              <div>
                <div className="text-[#848E9C]">High</div>
                <div className="font-mono text-[#EAECEF]">${chartData[chartData.length - 1]?.h || '0.00'}</div>
              </div>
              <div>
                <div className="text-[#848E9C]">Low</div>
                <div className="font-mono text-[#EAECEF]">${chartData[chartData.length - 1]?.l || '0.00'}</div>
              </div>
              <div>
                <div className="text-[#848E9C]">Volume</div>
                <div className="font-mono text-[#EAECEF]">{parseFloat(chartData[chartData.length - 1]?.v || 0).toFixed(2)}</div>
              </div>
            </div>
          </Card>
          
          {/* Order Form Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <TrendingUp size={14} className="text-[#F0B90B]" />
              </div>
              <h2 className="text-sm font-semibold text-[#EAECEF]">
                {tab === 'spot' && 'Spot Trading'}
                {tab === 'futures' && 'Futures Trading'}
                {tab === 'options' && 'Options Trading'}
              </h2>
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-0 text-[10px] ml-auto">
                {tab === 'spot' && '0 Fees'}
                {tab === 'futures' && `${futuresLeverage}x Leverage`}
                {tab === 'options' && 'Binary Options'}
              </Badge>
            </div>
            
            {tab === 'spot' && (
              <SpotTradeForm
                symbol={symbol}
                side={spotSide}
                orderType={spotOrderType}
                price={spotPrice}
                amount={spotAmount}
                percent={spotPercent}
                balance={getBalance('USDT')}
                currentPrice={currentPrice}
                onSideChange={setSpotSide}
                onOrderTypeChange={setSpotOrderType}
                onPriceChange={setSpotPrice}
                onAmountChange={setSpotAmount}
                onPercentChange={setSpotPercent}
                onSubmit={handleSpotSubmit}
                disabled={!isAuthenticated || loading || controlsLoading}
              />
            )}
            {tab === 'futures' && (
              <FuturesTradeForm
                symbol={symbol}
                side={futuresSide}
                positionType={futuresPositionType}
                orderType={futuresOrderType}
                price={futuresPrice}
                amount={futuresAmount}
                percent={futuresPercent}
                leverage={futuresLeverage}
                tpSl={futuresTpSl}
                balance={getBalance('USDT')}
                currentPrice={currentPrice}
                onSideChange={setFuturesSide}
                onPositionTypeChange={setFuturesPositionType}
                onOrderTypeChange={setFuturesOrderType}
                onPriceChange={setFuturesPrice}
                onAmountChange={setFuturesAmount}
                onPercentChange={setFuturesPercent}
                onLeverageChange={setFuturesLeverage}
                onTpSlChange={setFuturesTpSl}
                onSubmit={handleFuturesSubmit}
                disabled={!isAuthenticated || loading || controlsLoading}
              />
            )}
            {tab === 'options' && (
              <OptionsTradeForm
                symbol={symbol}
                direction={optionsDirection}
                positionTime={optionsPositionTime}
                orderType={optionsOrderType}
                amount={optionsAmount}
                asset={optionsAsset}
                percent={optionsPercent}
                balance={getBalance('USDT')}
                currentPrice={currentPrice}
                profitRates={PROFIT_RATES}
                onDirectionChange={setOptionsDirection}
                onPositionTimeChange={setOptionsPositionTime}
                onOrderTypeChange={setOptionsOrderType}
                onAmountChange={setOptionsAmount}
                onAssetChange={setOptionsAsset}
                onPercentChange={setOptionsPercent}
                onSubmit={handleOptionsSubmit}
                disabled={!isAuthenticated || loading || controlsLoading}
              />
            )}
          </Card>
        </div>
        
        {/* Right Column: Order Book + Trade History */}
        <div className={`${chartExpanded ? 'lg:w-1/5' : 'lg:w-2/5'} w-full space-y-4`}>
          
          {/* Order Book Card */}
          <OrderBook
            bids={orderBook.bids}
            asks={orderBook.asks}
            loading={!depth}
            baseAsset={symbol.replace('USDT', '')}
            quoteAsset="USDT"
          />
          
          {/* Trade History Card */}
          <RecentTrades
            trades={tradeHistory.map(t => ({
              id: t.t?.toString() || Math.random().toString(),
              price: parseFloat(t.p),
              amount: parseFloat(t.q),
              total: parseFloat(t.p) * parseFloat(t.q),
              side: t.m ? 'sell' : 'buy',
              time: t.T
            }))}
            loading={!trade}
            baseAsset={symbol.replace('USDT', '')}
            quoteAsset="USDT"
          />
          
          {/* Account Summary Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4 hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-[#F0B90B]" />
              <span className="text-xs font-semibold text-[#EAECEF]">Account Summary</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#848E9C]">Total Balance</span>
                <span className="font-mono text-[#EAECEF]">
                  {hideBalances ? '•••••••' : formatCurrency(balances.USDT || 0)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848E9C]">In Orders</span>
                <span className="font-mono text-[#EAECEF]">
                  {hideBalances ? '••••••' : formatCurrency(
                    getActiveOrders().reduce((sum, o) => sum + o.total, 0)
                  )} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848E9C]">Open Positions</span>
                <span className="font-mono text-[#EAECEF]">{positions.length}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2B3139]">
                <span className="text-[#848E9C]">Today's PnL</span>
                <span className="font-mono text-green-400">
                  +{formatCurrency(
                    transactions
                      .filter(t => t.status === 'completed' && t.pnl && t.pnl > 0)
                      .reduce((sum, t) => sum + (t.pnl || 0), 0)
                  )} USDT
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Footer: Orders & Positions */}
      <div className="border-t border-[#2B3139] bg-[#1E2329] px-3 md:px-4 py-3 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#EAECEF]">
            {tab === 'spot' && 'Spot Orders'}
            {tab === 'futures' && 'Futures Positions'}
            {tab === 'options' && 'Options Trades'}
          </h3>
          
          <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {tab === 'spot' && (
              <>
                <Button 
                  variant={activeFooterTab === 'open' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('open')}
                >
                  Open ({getSpotOrders().filter(o => o.status === 'active').length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'history' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('history')}
                >
                  History
                </Button>
                <Button 
                  variant={activeFooterTab === 'assets' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('assets')}
                >
                  Assets
                </Button>
              </>
            )}
            
            {tab === 'futures' && (
              <>
                <Button 
                  variant={activeFooterTab === 'positions' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('positions')}
                >
                  Positions ({positions.length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'open' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('open')}
                >
                  Open Orders ({getFuturesOrders().filter(o => o.status === 'active').length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'closed' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('closed')}
                >
                  Closed
                </Button>
              </>
            )}
            
            {tab === 'options' && (
              <>
                <Button 
                  variant={activeFooterTab === 'active' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('active')}
                >
                  Active ({getOptionsOrders().filter(o => o.status === 'scheduled').length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'completed' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('completed')}
                >
                  Completed
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Tab Content - Mobile Optimized */}
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {/* Spot - Open Orders */}
          {tab === 'spot' && activeFooterTab === 'open' && (
            <div className="space-y-2">
              {getSpotOrders().filter(o => o.status === 'active').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open orders</div>
                  <div className="text-xs text-[#5E6673] mt-1">Place an order to get started</div>
                </div>
              ) : (
                <div className="md:hidden space-y-2">
                  {getSpotOrders().filter(o => o.status === 'active').map(o => (
                    <OrderCard 
                      key={o.id} 
                      order={o} 
                      type="spot" 
                      onCancel={() => handleCancelOrder(o.id)}
                    />
                  ))}
                </div>
              )}
              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <OrderHistoryTable 
                  orders={getSpotOrders().filter(o => o.status === 'active')} 
                  onStopOrder={handleStopOrder}
                  onCancelOrder={handleCancelOrder}
                />
              </div>
            </div>
          )}
          
          {/* Spot - History */}
          {tab === 'spot' && activeFooterTab === 'history' && (
            <div className="space-y-2">
              {getSpotOrders().filter(o => o.status === 'completed' || o.status === 'cancelled').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No order history</div>
                </div>
              ) : (
                <>
                  <OrderHistoryTable orders={getSpotOrders().filter(o => o.status === 'completed' || o.status === 'cancelled')} />
                  <div className="pt-2 border-t border-[#2B3139]">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-[#F0B90B] text-xs"
                      onClick={() => navigate('/transaction-history')}
                    >
                      View Full History
                      <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Spot - Assets */}
          {tab === 'spot' && activeFooterTab === 'assets' && (
            <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet size={16} className="text-[#F0B90B]" />
                <span className="text-sm font-medium text-[#EAECEF]">Wallet Balances</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ASSETS.map(asset => (
                  <div key={asset} className="bg-[#181A20] rounded-lg p-3">
                    <div className="text-xs text-[#848E9C] mb-1">{asset}</div>
                    <div className="font-mono text-[#EAECEF] font-bold">
                      {hideBalances ? '••••••' : formatCurrency(balances.USDT || 0)}
                    </div>
                    <div className="text-[10px] text-[#848E9C] mt-1">
                      ≈ ${asset === 'USDT' ? formatCurrency(balances.USDT || 0) : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Futures - Positions */}
          {tab === 'futures' && activeFooterTab === 'positions' && (
            <div className="space-y-2">
              {positions.length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open positions</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {positions.map(position => (
                    <PositionCard
                      key={position.id}
                      position={position}
                      currentPrice={currentPrice}
                      onClose={async () => {
                        try {
                          const closed = await positionService.closePosition(position.id, currentPrice);
                          setPositions(prev => prev.filter(p => p.id !== position.id));
                          toast.success('Position closed');
                        } catch (error) {
                          toast.error('Failed to close position');
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Futures - Open Orders */}
          {tab === 'futures' && activeFooterTab === 'open' && (
            <div className="space-y-2">
              {getFuturesOrders().filter(o => o.status === 'pending').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open orders</div>
                </div>
              ) : (
                <div className="md:hidden space-y-2">
                  {getFuturesOrders().filter(o => o.status === 'pending').map(o => (
                    <OrderCard 
                      key={o.id} 
                      order={o} 
                      type="futures" 
                      onCancel={() => handleCancelOrder(o.id)}
                    />
                  ))}
                </div>
              )}
              {/* Desktop View */}
              <div className="hidden md:block">
                <OrderHistoryTable orders={getFuturesOrders().filter(o => o.status === 'pending')} />
              </div>
            </div>
          )}
          
          {/* Futures - Closed */}
          {tab === 'futures' && activeFooterTab === 'closed' && (
            <div className="text-center py-6">
              <div className="text-[#848E9C] text-sm">No closed positions</div>
            </div>
          )}
          
          {/* Options - Active */}
          {tab === 'options' && activeFooterTab === 'active' && (
            <div className="space-y-2">
              {getOptionsOrders().filter(o => o.status === 'scheduled').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No active options</div>
                </div>
              ) : (
                <div className="md:hidden space-y-2">
                  {getOptionsOrders().filter(o => o.status === 'scheduled').map(o => (
                    <OrderCard key={o.id} order={o} type="options" />
                  ))}
                </div>
              )}
              {/* Desktop View */}
              <div className="hidden md:block">
                <OrderHistoryTable orders={getOptionsOrders().filter(o => o.status === 'scheduled')} showCountdown />
              </div>
            </div>
          )}
          
          {/* Options - Completed */}
          {tab === 'options' && activeFooterTab === 'completed' && (
            <div className="space-y-2">
              {getOptionsOrders().filter(o => o.status === 'completed' || o.status === 'failed').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No completed options</div>
                </div>
              ) : (
                <OrderHistoryTable orders={getOptionsOrders().filter(o => o.status === 'completed' || o.status === 'failed')} />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
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
    </motion.div>
  );
}