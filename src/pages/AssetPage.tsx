import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  StarOutline,
  Share2, 
  MoreHorizontal,
  Activity,
  Clock,
  Wallet,
  ChevronRight,
  BarChart3,
  PieChart,
  CandlestickChart,
  LineChart,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

// Mock data - replace with real API calls
const mockOrderBook = {
  asks: [
    { price: 119730.80, amount: 0.013, total: 1556.50 },
    { price: 119730.10, amount: 0.251, total: 30052.26 },
    { price: 119729.10, amount: 0.056, total: 6704.83 },
    { price: 119729.00, amount: 1.473, total: 176361.12 },
    { price: 119728.50, amount: 0.892, total: 106797.82 },
    { price: 119728.00, amount: 2.145, total: 256816.56 },
  ],
  bids: [
    { price: 119729.00, amount: 0.210, total: 25143.09 },
    { price: 119728.00, amount: 0.056, total: 6704.77 },
    { price: 119727.90, amount: 0.010, total: 1197.28 },
    { price: 119727.00, amount: 0.845, total: 101169.32 },
    { price: 119726.50, amount: 1.234, total: 147742.50 },
    { price: 119726.00, amount: 0.456, total: 54595.06 },
  ],
};

const mockTrades = [
  { price: 119678.13, amount: 0.01, side: 'buy', time: '09:32:01' },
  { price: 119678.00, amount: 0.02, side: 'sell', time: '09:31:58' },
  { price: 119677.50, amount: 0.15, side: 'buy', time: '09:31:45' },
  { price: 119677.00, amount: 0.08, side: 'buy', time: '09:31:32' },
  { price: 119676.80, amount: 0.12, side: 'sell', time: '09:31:20' },
  { price: 119676.50, amount: 0.05, side: 'sell', time: '09:31:12' },
];

const mockCandles = [
  { time: '09:30', open: 119600, high: 119800, low: 119500, close: 119700, volume: 1250 },
  { time: '09:35', open: 119700, high: 119900, low: 119600, close: 119800, volume: 2100 },
  { time: '09:40', open: 119800, high: 120000, low: 119700, close: 119900, volume: 1850 },
  { time: '09:45', open: 119900, high: 120100, low: 119800, close: 120000, volume: 3200 },
  { time: '09:50', open: 120000, high: 120200, low: 119900, close: 120100, volume: 2800 },
  { time: '09:55', open: 120100, high: 120150, low: 119950, close: 120050, volume: 1950 },
];

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
const orderTypes = ['market', 'limit', 'stop'];

// Order Book Row Component
const OrderBookRow = ({ price, amount, total, type }: any) => (
  <div className="flex items-center justify-between py-1.5 px-2 hover:bg-[#23262F] rounded transition-colors">
    <span className={`font-mono text-sm ${type === 'bid' ? 'text-green-400' : 'text-red-400'}`}>
      ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
    <span className="font-mono text-sm text-[#EAECEF]">{amount.toFixed(3)}</span>
    <span className="font-mono text-xs text-[#848E9C]">
      ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  </div>
);

// Trade Row Component
const TradeRow = ({ trade }: any) => (
  <div className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-400' : 'bg-red-400'}`} />
      <span className="font-mono text-sm text-[#EAECEF]">
        ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    </div>
    <span className="font-mono text-sm text-[#EAECEF]">{trade.amount.toFixed(3)}</span>
    <span className="text-xs text-[#848E9C]">{trade.time}</span>
  </div>
);

// Mini Candlestick Chart Component
const MiniCandlestickChart = ({ data }: { data: any[] }) => {
  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const range = maxPrice - minPrice || 1;
  
  return (
    <div className="flex items-end h-32 gap-1">
      {data.slice(-20).map((candle, i) => {
        const isUp = candle.close >= candle.open;
        const height = ((candle.high - candle.low) / range) * 100;
        const bodyHeight = (Math.abs(candle.close - candle.open) / range) * 100;
        const bodyTop = ((maxPrice - Math.max(candle.open, candle.close)) / range) * 100;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative" style={{ height: '100%' }}>
            {/* Wick */}
            <div 
              className={`absolute w-0.5 ${isUp ? 'bg-green-400' : 'bg-red-400'}`}
              style={{ 
                height: `${height}%`,
                top: `${((maxPrice - candle.high) / range) * 100}%`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
            {/* Body */}
            <div 
              className={`absolute w-3 ${isUp ? 'bg-green-400' : 'bg-red-400'}`}
              style={{ 
                height: `${bodyHeight}%`,
                top: `${bodyTop}%`,
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// Order Form Component
const OrderForm = ({ side, symbol, price, onSubmit }: any) => {
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState(price.toString());
  
  return (
    <div className="space-y-4">
      {/* Order Type Selector */}
      <div className="grid grid-cols-3 gap-2">
        {orderTypes.map(type => (
          <Button
            key={type}
            variant={orderType === type ? 'default' : 'outline'}
            className={`text-xs capitalize ${
              orderType === type 
                ? 'bg-[#F0B90B] text-[#181A20] border-[#F0B90B]' 
                : 'border-[#2B3139] text-[#848E9C]'
            }`}
            onClick={() => setOrderType(type)}
          >
            {type}
          </Button>
        ))}
      </div>
      
      {/* Price Input (for limit/stop orders) */}
      {orderType !== 'market' && (
        <div>
          <Label className="text-xs text-[#848E9C] mb-1 block">Price</Label>
          <div className="relative">
            <Input
              type="number"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10 pr-12"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#848E9C]">
              USDT
            </span>
          </div>
        </div>
      )}
      
      {/* Amount Input */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label className="text-xs text-[#848E9C]">Amount</Label>
          <span className="text-xs text-[#848E9C]">Available: 10,000 USDT</span>
        </div>
        <div className="relative">
          <Input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-10 pr-20"
            placeholder="0.00"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
            <button className="text-[#F0B90B] text-xs font-semibold hover:text-yellow-400">
              25%
            </button>
            <button className="text-[#F0B90B] text-xs font-semibold hover:text-yellow-400">
              50%
            </button>
            <button className="text-[#F0B90B] text-xs font-semibold hover:text-yellow-400">
              Max
            </button>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="bg-[#181A20] rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-[#848E9C]">Total</span>
          <span className="font-mono text-[#EAECEF] font-bold">
            ${amount ? (parseFloat(amount) * (orderType === 'market' ? price : parseFloat(limitPrice))).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>
      
      {/* Submit Button */}
      <Button
        className={`w-full h-11 font-bold ${
          side === 'buy' 
            ? 'bg-green-500 hover:bg-green-600 text-white' 
            : 'bg-red-500 hover:bg-red-600 text-white'
        }`}
        onClick={onSubmit}
      >
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol?.split('/')[0]}
      </Button>
      
      {/* Fee Info */}
      <p className="text-[10px] text-[#5E6673] text-center">
        Market fee: 0.1% • Limit fee: 0.0%
      </p>
    </div>
  );
};

export default function AssetPage() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('spot');
  const [chartType, setChartType] = useState('candlestick');
  const [timeframe, setTimeframe] = useState('1h');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showDepth, setShowDepth] = useState(false);
  
  // Asset data - replace with real API call
  const asset = {
    name: symbol || 'BTC/USDT',
    baseAsset: symbol?.split('/')[0] || 'BTC',
    quoteAsset: symbol?.split('/')[1] || 'USDT',
    price: 119678.13,
    change: 0.83,
    high24h: 120150.00,
    low24h: 119500.00,
    volume24h: 12456.78,
    marketCap: 2350000000
  };

  const isPositiveChange = asset.change >= 0;

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
      variants={fadeInUp}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-3 md:px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#848E9C]" />
            </button>
            
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#EAECEF]">{asset.name}</h1>
              <Badge className={isPositiveChange ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {isPositiveChange ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {isPositiveChange ? '+' : ''}{asset.change}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              {isFavorite ? (
                <Star size={18} className="text-[#F0B90B] fill-[#F0B90B]" />
              ) : (
                <Star size={18} className="text-[#848E9C]" />
              )}
            </button>
            <button className="p-2 hover:bg-[#23262F] rounded-lg transition-colors">
              <Share2 size={18} className="text-[#848E9C]" />
            </button>
            <button className="p-2 hover:bg-[#23262F] rounded-lg transition-colors">
              <MoreHorizontal size={18} className="text-[#848E9C]" />
            </button>
          </div>
        </div>
        
        {/* Price Bar */}
        <div className="px-3 md:px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-[#EAECEF] font-mono">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-[#848E9C]">≈ ${asset.price.toFixed(2)} USD</span>
                <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                  <Clock size={10} className="mr-1" />
                  Real-time
                </Badge>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-[#848E9C]">24h High</div>
                <div className="font-mono text-sm text-[#EAECEF]">
                  ${asset.high24h.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#848E9C]">24h Low</div>
                <div className="font-mono text-sm text-[#EAECEF]">
                  ${asset.low24h.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#848E9C]">24h Volume</div>
                <div className="font-mono text-sm text-[#EAECEF]">
                  ${asset.volume24h.toLocaleString()}M
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 md:px-4 py-4">
        {/* Market Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="border-b border-[#2B3139] mb-4">
            <TabsList className="bg-transparent gap-4">
              <TabsTrigger 
                value="spot" 
                className="text-sm data-[state=active]:text-[#F0B90B] data-[state=active]:border-b-2 data-[state=active]:border-[#F0B90B] rounded-none px-2 py-2"
              >
                Spot
              </TabsTrigger>
              <TabsTrigger 
                value="futures" 
                className="text-sm data-[state=active]:text-[#F0B90B] data-[state=active]:border-b-2 data-[state=active]:border-[#F0B90B] rounded-none px-2 py-2"
              >
                Futures
              </TabsTrigger>
              <TabsTrigger 
                value="options" 
                className="text-sm data-[state=active]:text-[#F0B90B] data-[state=active]:border-b-2 data-[state=active]:border-[#F0B90B] rounded-none px-2 py-2"
              >
                Options
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Spot Tab */}
          <TabsContent value="spot" className="mt-0">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Left Column: Chart */}
              <div className="lg:w-3/5 space-y-4">
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-[#F0B90B]" />
                      <span className="text-sm font-semibold text-[#EAECEF]">{asset.name} Chart</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Chart Type Selector */}
                      <div className="flex bg-[#181A20] rounded-lg p-1">
                        <button
                          className={`p-1.5 rounded ${chartType === 'candlestick' ? 'bg-[#2B3139] text-[#F0B90B]' : 'text-[#848E9C]'}`}
                          onClick={() => setChartType('candlestick')}
                        >
                          <CandlestickChart size={14} />
                        </button>
                        <button
                          className={`p-1.5 rounded ${chartType === 'line' ? 'bg-[#2B3139] text-[#F0B90B]' : 'text-[#848E9C]'}`}
                          onClick={() => setChartType('line')}
                        >
                          <LineChart size={14} />
                        </button>
                      </div>
                      
                      {/* Timeframe Selector */}
                      <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="w-20 h-8 bg-[#181A20] border-[#2B3139] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeframes.map(tf => (
                            <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="h-64 md:h-80 bg-[#181A20] rounded-lg p-2">
                    {chartType === 'candlestick' ? (
                      <MiniCandlestickChart data={mockCandles} />
                    ) : (
                      <div className="flex items-end h-full">
                        {mockCandles.map((candle, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-[#F0B90B]/60 mx-0.5 rounded-t"
                            style={{ height: `${(candle.close - 119500) / 1000 * 100}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Volume */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#848E9C]">Volume (24h)</span>
                      <span className="text-xs font-mono text-[#EAECEF]">
                        {asset.volume24h.toLocaleString()} {asset.quoteAsset}
                      </span>
                    </div>
                    <div className="flex h-12 gap-1">
                      {mockCandles.map((candle, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#2B3139] rounded-t relative"
                          style={{ height: `${candle.volume / 50}%` }}
                        >
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-[#F0B90B]/40 rounded-t"
                            style={{ height: `${candle.volume / 100}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                
                {/* Market Stats */}
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={14} className="text-[#F0B90B]" />
                    <span className="text-xs font-medium text-[#EAECEF]">Market Statistics</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-[10px] text-[#848E9C]">Market Cap</div>
                      <div className="text-sm font-mono text-[#EAECEF]">${asset.marketCap.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#848E9C]">24h Volume</div>
                      <div className="text-sm font-mono text-[#EAECEF]">${asset.volume24h.toLocaleString()}M</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#848E9C]">Circulating Supply</div>
                      <div className="text-sm font-mono text-[#EAECEF]">19.5M {asset.baseAsset}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#848E9C]">All-Time High</div>
                      <div className="text-sm font-mono text-[#EAECEF]">$73,750</div>
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Right Column: Trading Panel */}
              <div className="lg:w-2/5 space-y-4">
                {/* Buy/Sell Card */}
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                      onClick={() => setTab('spot')}
                    >
                      Buy
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-10 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                      onClick={() => setTab('spot')}
                    >
                      Sell
                    </Button>
                  </div>
                  
                  <OrderForm side="buy" symbol={asset.name} price={asset.price} />
                </Card>
                
                {/* Order Book Card */}
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-[#F0B90B]" />
                      <span className="text-xs font-semibold text-[#EAECEF]">Order Book</span>
                    </div>
                    <button
                      onClick={() => setShowDepth(!showDepth)}
                      className="text-[#848E9C] hover:text-[#F0B90B] text-xs flex items-center gap-1"
                    >
                      <BarChart3 size={12} />
                      {showDepth ? 'Hide' : 'Show'} Depth
                    </button>
                  </div>
                  
                  {/* Header */}
                  <div className="flex justify-between text-xs text-[#848E9C] mb-2 px-2">
                    <span>Price (USDT)</span>
                    <span>Amount ({asset.baseAsset})</span>
                    <span>Total (USDT)</span>
                  </div>
                  
                  {/* Asks */}
                  <div className="mb-2">
                    {mockOrderBook.asks.slice().reverse().map((order, i) => (
                      <OrderBookRow key={`ask-${i}`} {...order} type="ask" />
                    ))}
                  </div>
                  
                  {/* Spread */}
                  <div className="flex items-center justify-between py-2 px-2 bg-[#2B3139]/30 rounded my-1">
                    <span className="text-xs text-[#848E9C]">Spread</span>
                    <span className="text-xs font-mono text-[#EAECEF]">
                      ${(mockOrderBook.asks[0].price - mockOrderBook.bids[0].price).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#848E9C]">
                      {((mockOrderBook.asks[0].price - mockOrderBook.bids[0].price) / mockOrderBook.bids[0].price * 100).toFixed(2)}%
                    </span>
                  </div>
                  
                  {/* Bids */}
                  <div className="mt-2">
                    {mockOrderBook.bids.map((order, i) => (
                      <OrderBookRow key={`bid-${i}`} {...order} type="bid" />
                    ))}
                  </div>
                </Card>
                
                {/* Recent Trades Card */}
                <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-[#F0B90B]" />
                      <span className="text-xs font-semibold text-[#EAECEF]">Recent Trades</span>
                    </div>
                    <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                      {mockTrades.length} Trades
                    </Badge>
                  </div>
                  
                  {/* Header */}
                  <div className="flex justify-between text-xs text-[#848E9C] mb-2">
                    <span>Price (USDT)</span>
                    <span>Amount ({asset.baseAsset})</span>
                    <span>Time</span>
                  </div>
                  
                  {/* Trades */}
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {mockTrades.map((trade, i) => (
                      <TradeRow key={i} trade={trade} />
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Futures Tab */}
          <TabsContent value="futures" className="mt-0">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center">
                <TrendingUp size={24} className="text-[#F0B90B]" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">Futures Trading Coming Soon</h3>
              <p className="text-sm text-[#848E9C] max-w-md mx-auto mb-6">
                Trade {asset.name} futures with up to 100x leverage. Advanced risk management and real-time settlement.
              </p>
              <Button className="bg-[#F0B90B] text-[#181A20] font-bold">
                Get Notified
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </Card>
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="mt-0">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center">
                <PieChart size={24} className="text-[#F0B90B]" />
              </div>
              <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">Options Trading Coming Soon</h3>
              <p className="text-sm text-[#848E9C] max-w-md mx-auto mb-6">
                Trade {asset.name} options with flexible strike prices and expiration dates. Hedge your portfolio effectively.
              </p>
              <Button className="bg-[#F0B90B] text-[#181A20] font-bold">
                Join Waitlist
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
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
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}