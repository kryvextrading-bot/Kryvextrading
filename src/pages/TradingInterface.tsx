import React, { useState, useEffect } from 'react';
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
  Download,
  Upload,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import useBinanceStream from '../hooks/useBinanceStream';
import SpotTradeForm from '../components/trading/SpotTradeForm';
import FuturesTradeForm from '../components/trading/FuturesTradeForm';
import OptionsTradeForm from '../components/trading/OptionsTradeForm';

const ORDER_TYPES = ['market', 'limit', 'stop'];
const LEVERAGES = [1, 2, 5, 10, 20, 50, 100];
const POSITION_TIMES = ['60s', '120s', '300s'];
const ASSETS = ['USDT', 'BTC', 'ETH'];

type Order = {
  id: number;
  symbol?: string;
  side?: 'buy' | 'sell';
  orderType?: string;
  amount?: string;
  price?: string;
  status?: string;
  time?: string;
  leverage?: number;
  positionType?: 'open' | 'close';
  tpSl?: boolean;
  direction?: 'up' | 'down';
  positionTime?: string;
  asset?: string;
  filled?: string;
  total?: string;
  pnl?: string;
};

// Order Book Row Component
const OrderBookRow = ({ price, amount, type }: { price: string; amount: string; type: 'bid' | 'ask' }) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
      {parseFloat(price).toFixed(2)}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{parseFloat(amount).toFixed(4)}</span>
    <span className="text-xs text-[#848E9C]">
      ${(parseFloat(price) * parseFloat(amount)).toFixed(2)}
    </span>
  </div>
);

// Trade History Row Component
const TradeRow = ({ trade }: { trade: any }) => (
  <div className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${trade.m ? 'bg-red-400' : 'bg-green-400'}`} />
      <span className="font-mono text-sm text-[#EAECEF]">{parseFloat(trade.p).toFixed(2)}</span>
    </div>
    <span className="font-mono text-sm text-[#EAECEF]">{parseFloat(trade.q).toFixed(4)}</span>
    <span className="text-xs text-[#848E9C]">
      {new Date(trade.T).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  </div>
);

// Order Card Component (Mobile Optimized)
const OrderCard = ({ order, type }: { order: Order; type: 'spot' | 'futures' | 'options' }) => {
  const isBuy = order.side === 'buy';
  const isOpen = order.status === 'open' || order.status === 'active';
  
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] p-3 mb-2">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge className={isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
            {order.side?.toUpperCase() || order.direction?.toUpperCase()}
          </Badge>
          <Badge className={isOpen ? 'bg-yellow-500/20 text-yellow-400' : 'bg-[#2B3139] text-[#848E9C]'}>
            {order.status}
          </Badge>
        </div>
        <span className="text-xs text-[#848E9C]">{order.time}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-[#848E9C]">Symbol</div>
          <div className="font-medium text-[#EAECEF]">{order.symbol}</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Amount</div>
          <div className="font-medium text-[#EAECEF]">{order.amount} {order.asset || 'USDT'}</div>
        </div>
        {order.price && (
          <div>
            <div className="text-xs text-[#848E9C]">Price</div>
            <div className="font-medium text-[#EAECEF]">${parseFloat(order.price).toFixed(2)}</div>
          </div>
        )}
        {order.leverage && (
          <div>
            <div className="text-xs text-[#848E9C]">Leverage</div>
            <div className="font-medium text-[#F0B90B]">{order.leverage}x</div>
          </div>
        )}
        {order.positionTime && (
          <div>
            <div className="text-xs text-[#848E9C]">Expiry</div>
            <div className="font-medium text-[#EAECEF]">{order.positionTime}</div>
          </div>
        )}
      </div>
      
      {isOpen && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-[#2B3139]">
          <Button size="sm" variant="ghost" className="flex-1 text-xs h-7 text-red-400 hover:text-red-300">
            Cancel
          </Button>
          <Button size="sm" variant="ghost" className="flex-1 text-xs h-7 text-[#F0B90B] hover:text-yellow-400">
            Modify
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
  const [optionsPositionTime, setOptionsPositionTime] = useState('60s');
  const [optionsOrderType, setOptionsOrderType] = useState<'market' | 'limit'>('market');
  const [optionsAmount, setOptionsAmount] = useState('');
  const [optionsAsset, setOptionsAsset] = useState('USDT');
  const [optionsPercent, setOptionsPercent] = useState(0);

  // Orders and activity
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeFooterTab, setActiveFooterTab] = useState<'open' | 'history' | 'positions' | 'completed' | 'assets' | 'scheduled' | 'closed' | 'active'>('open');

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
    bids: depth.b.slice(0, 8),
    asks: depth.a.slice(0, 8)
  } : { bids: [], asks: [] };

  // Current price
  const currentPrice = trade?.p ? parseFloat(trade.p) : 0;
  const priceChange = currentPrice - (chartData[chartData.length - 2]?.c || currentPrice);
  const priceChangePercent = ((priceChange / (chartData[chartData.length - 2]?.c || currentPrice)) * 100) || 0;

  // Place order simulation for each form
  const handleSpotSubmit = () => {
    const newOrder: Order = {
      id: Date.now(),
      symbol,
      side: spotSide,
      orderType: spotOrderType,
      amount: spotAmount,
      price: spotOrderType === 'market' ? currentPrice.toString() : spotPrice,
      status: spotOrderType === 'market' ? 'filled' : 'open',
      time: new Date().toLocaleTimeString(),
      filled: spotOrderType === 'market' ? spotAmount : '0',
      total: spotOrderType === 'market' ? (parseFloat(spotAmount) * currentPrice).toFixed(2) : '0'
    };
    setOrders(prev => [newOrder, ...prev]);
    setSpotAmount('');
    setSpotPrice('');
    setSpotPercent(0);
  };

  const handleFuturesSubmit = () => {
    const newOrder: Order = {
      id: Date.now(),
      symbol,
      side: futuresSide,
      orderType: futuresOrderType,
      amount: futuresAmount,
      price: futuresOrderType === 'market' ? currentPrice.toString() : futuresPrice,
      status: 'open',
      time: new Date().toLocaleTimeString(),
      leverage: futuresLeverage,
      positionType: futuresPositionType,
      tpSl: futuresTpSl,
      filled: '0',
      total: (parseFloat(futuresAmount) * currentPrice).toFixed(2)
    };
    setOrders(prev => [newOrder, ...prev]);
    setFuturesAmount('');
    setFuturesPrice('');
    setFuturesPercent(0);
  };

  const handleOptionsSubmit = () => {
    const newOrder: Order = {
      id: Date.now(),
      symbol,
      direction: optionsDirection,
      positionTime: optionsPositionTime,
      orderType: optionsOrderType,
      amount: optionsAmount,
      asset: optionsAsset,
      status: 'active',
      time: new Date().toLocaleTimeString(),
      side: undefined,
      price: currentPrice.toString(),
      leverage: undefined,
      positionType: undefined,
      tpSl: undefined,
      filled: '0',
      total: (parseFloat(optionsAmount) * 0.05).toFixed(2) // Premium
    };
    setOrders(prev => [newOrder, ...prev]);
    setOptionsAmount('');
    setOptionsPercent(0);
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
                  <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                    {symbols.slice(0, 50).map(s => (
                      <SelectItem key={s} value={s} className="text-[#EAECEF] hover:bg-[#2B3139]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="hidden sm:block text-right">
                <div className="text-lg font-bold text-[#EAECEF] font-mono">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <div className="text-lg font-bold text-[#EAECEF] font-mono">
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`text-xs ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>

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
                onSideChange={setSpotSide}
                onOrderTypeChange={setSpotOrderType}
                onPriceChange={setSpotPrice}
                onAmountChange={setSpotAmount}
                onPercentChange={setSpotPercent}
                onSubmit={handleSpotSubmit}
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
                onSideChange={setFuturesSide}
                onPositionTypeChange={setFuturesPositionType}
                onOrderTypeChange={setFuturesOrderType}
                onPriceChange={setFuturesPrice}
                onAmountChange={setFuturesAmount}
                onPercentChange={setFuturesPercent}
                onLeverageChange={setFuturesLeverage}
                onTpSlChange={setFuturesTpSl}
                onSubmit={handleFuturesSubmit}
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
                onDirectionChange={setOptionsDirection}
                onPositionTimeChange={setOptionsPositionTime}
                onOrderTypeChange={setOptionsOrderType}
                onAmountChange={setOptionsAmount}
                onAssetChange={setOptionsAsset}
                onPercentChange={setOptionsPercent}
                onSubmit={handleOptionsSubmit}
              />
            )}
          </Card>
        </div>
        
        {/* Right Column: Order Book + Trade History */}
        <div className={`${chartExpanded ? 'lg:w-1/5' : 'lg:w-2/5'} w-full space-y-4`}>
          
          {/* Order Book Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#F0B90B]" />
                <span className="text-xs font-semibold text-[#EAECEF]">Order Book</span>
              </div>
              <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                {symbol}
              </Badge>
            </div>
            
            {/* Header */}
            <div className="flex justify-between text-xs text-[#848E9C] mb-2 px-2">
              <span>Price (USDT)</span>
              <span>Amount</span>
              <span>Total</span>
            </div>
            
            {/* Asks (Sells) */}
            <div className="mb-2">
              {orderBook.asks.length === 0 ? (
                <div className="text-xs text-[#5E6673] text-center py-4">Loading order book...</div>
              ) : (
                orderBook.asks.slice().reverse().map((a: any, i: number) => (
                  <OrderBookRow key={`ask-${i}`} price={a[0]} amount={a[1]} type="ask" />
                ))
              )}
            </div>
            
            {/* Current Price */}
            <div className="flex items-center justify-between py-2 px-2 bg-[#2B3139]/30 rounded my-1">
              <span className="text-sm font-bold text-[#F0B90B]">${currentPrice.toFixed(2)}</span>
              <span className="text-xs text-[#848E9C]">Spread: ${(parseFloat(orderBook.asks[0]?.[0] || 0) - parseFloat(orderBook.bids[0]?.[0] || 0)).toFixed(2)}</span>
            </div>
            
            {/* Bids (Buys) */}
            <div className="mt-2">
              {orderBook.bids.map((b: any, i: number) => (
                <OrderBookRow key={`bid-${i}`} price={b[0]} amount={b[1]} type="bid" />
              ))}
            </div>
          </Card>
          
          {/* Trade History Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#F0B90B]" />
                <span className="text-xs font-semibold text-[#EAECEF]">Market Trades</span>
              </div>
              <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                {tradeHistory.length} Trades
              </Badge>
            </div>
            
            {/* Header */}
            <div className="flex justify-between text-xs text-[#848E9C] mb-2">
              <span>Price</span>
              <span>Amount</span>
              <span>Time</span>
            </div>
            
            {/* Trades */}
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {tradeHistory.length === 0 ? (
                <div className="text-xs text-[#5E6673] text-center py-4">Waiting for trades...</div>
              ) : (
                tradeHistory.map((t, i) => (
                  <TradeRow key={i} trade={t} />
                ))
              )}
            </div>
          </Card>
          
          {/* Account Summary Card */}
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3 md:p-4 hidden lg:block">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={16} className="text-[#F0B90B]" />
              <span className="text-xs font-semibold text-[#EAECEF]">Account Summary</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#848E9C]">Total Balance</span>
                <span className="font-mono text-[#EAECEF]">{hideBalances ? '••••••' : '12,345.67 USDT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848E9C]">Available</span>
                <span className="font-mono text-[#EAECEF]">{hideBalances ? '••••••' : '10,000.00 USDT'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#848E9C]">In Order</span>
                <span className="font-mono text-[#EAECEF]">{hideBalances ? '••••••' : '2,345.67 USDT'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2B3139]">
                <span className="text-[#848E9C]">Today's PnL</span>
                <span className="font-mono text-green-400">+123.45 USDT</span>
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
                  Open ({orders.filter(o => o.status === 'open' && !o.leverage).length})
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
                  Positions ({orders.filter(o => o.leverage && o.positionType === 'open').length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'open' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('open')}
                >
                  Open Orders
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
                  Active ({orders.filter(o => o.direction && o.status === 'active').length})
                </Button>
                <Button 
                  variant={activeFooterTab === 'scheduled' ? 'default' : 'outline'} 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={() => setActiveFooterTab('scheduled')}
                >
                  Scheduled
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
              {orders.filter(o => o.status === 'open' && !o.leverage).length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open orders</div>
                  <div className="text-xs text-[#5E6673] mt-1">Place an order to get started</div>
                </div>
              ) : (
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-[#848E9C] text-xs">
                      <tr>
                        <th className="text-left py-2">Symbol</th>
                        <th className="text-left">Side</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Filled</th>
                        <th className="text-right">Time</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.status === 'open' && !o.leverage).map(o => (
                        <tr key={o.id} className="border-b border-[#2B3139] text-[#EAECEF]">
                          <td className="py-2">{o.symbol}</td>
                          <td className={o.side === 'buy' ? 'text-green-400' : 'text-red-400'}>{o.side?.toUpperCase()}</td>
                          <td className="text-right font-mono">${parseFloat(o.price || '0').toFixed(2)}</td>
                          <td className="text-right font-mono">{o.amount} USDT</td>
                          <td className="text-right font-mono text-[#848E9C]">{o.filled || '0'}</td>
                          <td className="text-right text-[#848E9C] text-xs">{o.time}</td>
                          <td className="text-right">
                            <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400">Cancel</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Mobile View */}
              <div className="md:hidden space-y-2">
                {orders.filter(o => o.status === 'open' && !o.leverage).map(o => (
                  <OrderCard key={o.id} order={o} type="spot" />
                ))}
              </div>
            </div>
          )}
          
          {/* Spot - History */}
          {tab === 'spot' && activeFooterTab === 'history' && (
            <div className="space-y-2">
              {orders.filter(o => o.status === 'filled' && !o.leverage).length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No order history</div>
                </div>
              ) : (
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead className="text-[#848E9C] text-xs">
                      <tr>
                        <th className="text-left py-2">Symbol</th>
                        <th className="text-left">Side</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Total</th>
                        <th className="text-right">Time</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.filter(o => o.status === 'filled' && !o.leverage).map(o => (
                        <tr key={o.id} className="border-b border-[#2B3139] text-[#EAECEF]">
                          <td className="py-2">{o.symbol}</td>
                          <td className={o.side === 'buy' ? 'text-green-400' : 'text-red-400'}>{o.side?.toUpperCase()}</td>
                          <td className="text-right font-mono">${parseFloat(o.price || '0').toFixed(2)}</td>
                          <td className="text-right font-mono">{o.amount} USDT</td>
                          <td className="text-right font-mono">${o.total}</td>
                          <td className="text-right text-[#848E9C] text-xs">{o.time}</td>
                          <td className="text-right">
                            <Badge className="bg-green-500/20 text-green-400">Filled</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                      {hideBalances ? '••••••' : asset === 'USDT' ? '10,000.00' : '0.000000'}
                    </div>
                    <div className="text-[10px] text-[#848E9C] mt-1">
                      ≈ ${asset === 'USDT' ? '10,000.00' : '0.00'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          {/* Futures - Positions */}
          {tab === 'futures' && activeFooterTab === 'positions' && (
            <div className="space-y-2">
              {orders.filter(o => o.leverage && o.positionType === 'open').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open positions</div>
                </div>
              ) : (
                orders.filter(o => o.leverage && o.positionType === 'open').map(o => (
                  <Card key={o.id} className="bg-[#1E2329] border border-[#2B3139] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={o.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {o.side?.toUpperCase()} {o.leverage}x
                        </Badge>
                        <span className="text-sm font-medium text-[#EAECEF]">{o.symbol}</span>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400">Open</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-[#848E9C]">Amount</div>
                        <div className="font-mono text-[#EAECEF]">{o.amount} USDT</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C]">Entry</div>
                        <div className="font-mono text-[#EAECEF]">${parseFloat(o.price || '0').toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C]">PnL</div>
                        <div className="font-mono text-green-400">+12.34%</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-2 border-t border-[#2B3139]">
                      <Button size="sm" className="flex-1 h-7 bg-[#F0B90B] text-[#181A20] text-xs">
                        Close Position
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-7 border-[#2B3139] text-xs">
                        Add Margin
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          
          {/* Futures - Open Orders */}
          {tab === 'futures' && activeFooterTab === 'open' && (
            <div className="space-y-2">
              {orders.filter(o => o.leverage && o.status === 'open').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No open orders</div>
                </div>
              ) : (
                orders.filter(o => o.leverage && o.status === 'open').map(o => (
                  <OrderCard key={o.id} order={o} type="futures" />
                ))
              )}
            </div>
          )}
          
          {/* Futures - Closed Orders */}
          {tab === 'futures' && activeFooterTab === 'closed' && (
            <div className="text-center py-6">
              <div className="text-[#848E9C] text-sm">No closed orders</div>
            </div>
          )}
          
          {/* Options - Active */}
          {tab === 'options' && activeFooterTab === 'active' && (
            <div className="space-y-2">
              {orders.filter(o => o.direction && o.status === 'active').length === 0 ? (
                <div className="text-center py-6">
                  <div className="text-[#848E9C] text-sm">No active options</div>
                </div>
              ) : (
                orders.filter(o => o.direction && o.status === 'active').map(o => (
                  <Card key={o.id} className="bg-[#1E2329] border border-[#2B3139] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={o.direction === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {o.direction?.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium text-[#EAECEF]">{o.symbol}</span>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-400">{o.positionTime}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-xs text-[#848E9C]">Amount</div>
                        <div className="font-mono text-[#EAECEF]">{o.amount} {o.asset}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[#848E9C]">Premium</div>
                        <div className="font-mono text-[#EAECEF]">${o.total}</div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          
          {/* Options - Scheduled & Completed */}
          {tab === 'options' && (activeFooterTab === 'scheduled' || activeFooterTab === 'completed') && (
            <div className="text-center py-6">
              <div className="text-[#848E9C] text-sm">
                {activeFooterTab === 'scheduled' ? 'No scheduled options' : 'No completed options'}
              </div>
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