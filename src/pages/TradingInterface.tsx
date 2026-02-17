// TradingInterface.tsx - Redesigned with Swan-IRA Style & 3-Level Navigation
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  AlertTriangle,
  Sparkles,
  Zap,
  Layers,
  MoreVertical,
  Star,
  Search,
  Settings,
  X,
  TrendingUp,
  ChevronDown,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

// Hooks
import useBinanceStream from '@/hooks/useBinanceStream';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingControl } from '@/hooks/useTradingControl';

// Services
import { tradingService } from '@/services/tradingService';
import { walletService } from '@/services/wallet-service-new';
import { positionService } from '@/services/positionService';

// Components
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
const TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H'];

const PROFIT_RATES = {
  60: { payout: 0.85, profit: 15 },
  120: { payout: 0.82, profit: 18 },
  300: { payout: 0.75, profit: 25 }
};

// Asset List Component (Level 1)
const AssetList = ({ onSelectAsset }: { onSelectAsset: (symbol: string) => void }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('favourites');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'futures', label: 'Futures' },
    { id: 'usstock', label: 'USStock' },
    { id: 'forex', label: 'Forex' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'etf', label: 'ETF' }
  ];

  const filters = [
    { id: 'favourites', label: 'Favourites' },
    { id: 'all', label: 'All' },
    { id: 'hot', label: 'Hot' },
    { id: 'gainer', label: 'Gainer' },
    { id: 'loser', label: 'Loser' }
  ];

  const assets = [
    { symbol: 'XAU', name: 'Gold', lastPrice: 4909.36, change: -1.68, usdtPrice: 4909.36, category: 'futures', volume: '1.2B' },
    { symbol: 'XAG', name: 'Silver', lastPrice: 74.62, change: -1.81, usdtPrice: 74.62, category: 'futures', volume: '890M' },
    { symbol: 'NG', name: 'Natural Gas', lastPrice: 3.02, change: 0.97, usdtPrice: 3.02, category: 'futures', volume: '2.1B' },
    { symbol: 'CAD', name: 'Canadian Dollar', lastPrice: 12730.88, change: -0.56, usdtPrice: 12730.88, category: 'forex', volume: '450M' },
    { symbol: 'HO', name: 'Heating Oil', lastPrice: 2.32, change: 0.22, usdtPrice: 2.32, category: 'futures', volume: '780M' },
    { symbol: 'RBOB', name: 'Gasoline', lastPrice: 2.14, change: -0.09, usdtPrice: 2.14, category: 'futures', volume: '560M' },
    { symbol: 'GC', name: 'Gold Futures', lastPrice: 4922.34, change: -2.53, usdtPrice: 4922.34, category: 'futures', volume: '3.2B' },
    { symbol: 'XPT', name: 'Platinum', lastPrice: 74.34, change: -4.14, usdtPrice: 74.34, category: 'futures', volume: '340M' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold">Choose your portfolio</h1>
          <button className="text-gray-400">
            <Filter className="h-5 w-5" />
          </button>
        </div>
        
        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-teal-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 flex space-x-2 overflow-x-auto pb-2">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="px-4 py-3 grid grid-cols-3 text-xs text-gray-500 border-b border-gray-800">
        <div>Name</div>
        <div className="text-right">Last Price</div>
        <div className="text-right">Change %</div>
      </div>

      {/* Asset List */}
      <div className="px-4 divide-y divide-gray-800 pb-24">
        {assets.map((asset, index) => (
          <button
            key={index}
            onClick={() => onSelectAsset(asset.symbol)}
            className="w-full py-4 grid grid-cols-3 items-center hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  // Toggle favorite
                }}
                className="text-gray-600 hover:text-yellow-400"
              >
                <Star className="h-4 w-4" />
              </button>
              <div className="text-left">
                <div className="text-white font-medium">{asset.symbol}</div>
                <div className="text-xs text-gray-500">{asset.volume}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-white font-mono">
                ${asset.lastPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                {asset.usdtPrice.toFixed(2)} USDT
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-sm font-medium ${
                asset.change >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
                {asset.change >= 0 ? '+' : ''}{asset.change}%
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Kryvex Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-gray-800 py-2 text-center text-xs text-gray-600">
        kryvex.com
      </div>
    </div>
  );
};

// Trading Page Component (Level 2 - No Chart)
const TradingPage = ({ symbol, onShowChart }: { symbol: string; onShowChart: () => void }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'spot' | 'future' | 'option'>('spot');
  const [tradeType, setTradeType] = useState<'buy' | 'sell' | 'up' | 'down'>('buy');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [selectedOptionTime, setSelectedOptionTime] = useState(60);

  // Mock data - replace with real data from props
  const currentPrice = 4909.34;
  const priceChange = -1.68;

  const orderBookBids = [
    { price: 4911, quantity: 0.800 },
    { price: 4910, quantity: 65187.995 },
    { price: 4909, quantity: 68278.408 },
    { price: 4908, quantity: 74578.626 },
    { price: 4907, quantity: 133148.201 }
  ];

  const orderBookAsks = [
    { price: 4911, quantity: 0.500 },
    { price: 4910, quantity: 143717.666 },
    { price: 4909, quantity: 74578.626 }
  ];

  const optionTimes = [60, 120, 300];
  const optionLabels = ['60s', '120s', '300s'];

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white pb-32">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate('/trading')} className="text-gray-400">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold">{symbol}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={onShowChart}
              className="text-gray-400"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Market Tabs */}
        <div className="flex space-x-4 border-b border-gray-800">
          {['Spot', 'Future', 'Option'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-teal-400 text-teal-400'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Price Info */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {currentPrice.toFixed(2)} ↓
              </span>
              <span className={`text-sm ${
                priceChange >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
                {priceChange}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              ≈${currentPrice.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">{symbol} {priceChange}%</div>
          </div>
        </div>
      </div>

      {/* Timeframes */}
      <div className="px-4 py-3 flex space-x-2 border-b border-gray-800">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              selectedTimeframe === tf
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Mini Chart Placeholder */}
      <div className="h-32 bg-gray-900 m-4 rounded-lg flex items-center justify-center">
        <span className="text-gray-600 text-sm">Price Chart</span>
      </div>

      {/* Trade Type Selector */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        {activeTab === 'option' ? (
          <>
            <button
              onClick={() => setTradeType('up')}
              className={`py-3 rounded-lg text-sm font-medium ${
                tradeType === 'up'
                  ? 'bg-teal-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              Up
            </button>
            <button
              onClick={() => setTradeType('down')}
              className={`py-3 rounded-lg text-sm font-medium ${
                tradeType === 'down'
                  ? 'bg-red-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              Down
            </button>
            <button className="py-3 rounded-lg text-sm font-medium bg-gray-800 text-gray-400">
              Borrow/Repay
            </button>
          </>
        ) : activeTab === 'future' ? (
          <>
            <button
              onClick={() => setTradeType('buy')}
              className={`py-3 rounded-lg text-sm font-medium ${
                tradeType === 'buy'
                  ? 'bg-teal-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              100x
            </button>
            <button className="py-3 rounded-lg text-sm font-medium bg-gray-800 text-gray-400 col-span-2">
              Borrow/Repay
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setTradeType('buy')}
              className={`py-3 rounded-lg text-sm font-medium ${
                tradeType === 'buy'
                  ? 'bg-teal-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`py-3 rounded-lg text-sm font-medium ${
                tradeType === 'sell'
                  ? 'bg-red-400 text-gray-900'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              Sell
            </button>
            <button className="py-3 rounded-lg text-sm font-medium bg-gray-800 text-gray-400">
              Borrow/Repay
            </button>
          </>
        )}
      </div>

      {/* Order Book and Trading Form */}
      <div className="px-4 grid grid-cols-2 gap-4">
        {/* Left Column - Order Book */}
        <div>
          <div className="text-xs text-gray-500 mb-2">Price (USDT) • Available (XAU)</div>
          
          {/* Asks (Sell orders) */}
          <div className="space-y-1 mb-2">
            {orderBookAsks.map((ask, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-red-400 font-mono">{ask.price}</span>
                <span className="text-gray-300">{ask.quantity.toFixed(3)}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="flex justify-between items-center py-2 border-y border-gray-800 my-2">
            <span className="text-white font-bold font-mono">{currentPrice.toFixed(2)} ↓</span>
            <span className="text-xs text-gray-500">≈${currentPrice.toFixed(2)}</span>
          </div>

          {/* Bids (Buy orders) */}
          <div className="space-y-1 mt-2">
            {orderBookBids.map((bid, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-teal-400 font-mono">{bid.price}</span>
                <span className="text-gray-300">{bid.quantity.toFixed(3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Trading Form */}
        <div>
          {activeTab === 'option' ? (
            // Options Trading Form
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 mb-2">Open Position Now</div>
                <div className="grid grid-cols-3 gap-1 text-xs mb-2">
                  {optionTimes.map((time, idx) => (
                    <React.Fragment key={time}>
                      <button
                        onClick={() => setSelectedOptionTime(time)}
                        className={`text-left ${selectedOptionTime === time ? 'text-teal-400' : 'text-gray-500'}`}
                      >
                        {optionLabels[idx]}
                      </button>
                      <div className="text-right text-teal-400">4911</div>
                      <div className="text-right text-gray-300">0.400</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Total</span>
                  <span className="text-gray-500">USDT</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-teal-400">4909</span>
                    <span className="text-gray-300">0.700</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400">4908</span>
                    <span className="text-gray-300">5896.877</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400">4907</span>
                    <span className="text-gray-300">133148.201</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">Purchase Range</span>
                  <span className="text-white">100-50000</span>
                </div>
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Available</span>
                  <span className="text-white">0 USDT</span>
                </div>
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Expected Profit</span>
                  <span className="text-white">0.00 USDT</span>
                </div>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white mb-3"
                />

                <button className="w-full bg-teal-400 text-gray-900 py-4 rounded-lg font-medium">
                  Buy
                </button>
              </div>
            </div>
          ) : activeTab === 'future' ? (
            // Futures Trading Form
            <div className="space-y-4">
              <div className="flex space-x-2 mb-3">
                <button className="flex-1 py-2 bg-teal-400 text-gray-900 rounded-lg text-sm font-medium">Open</button>
                <button className="flex-1 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium">Close</button>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-2">Price (USDT) • Available (XAU)</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-teal-400">Market</span>
                    <span className="text-teal-400">4911</span>
                    <span className="text-gray-300">13992.735</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500"></span>
                    <span className="text-teal-400">4910</span>
                    <span className="text-gray-300">35090.467</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">4909.35</span>
                    <span className="text-teal-400">4909</span>
                    <span className="text-gray-300">74579.926</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">Buy Hands</span>
                  <span className="text-white">XAU</span>
                </div>
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">≈${currentPrice.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-4 gap-1 mb-4">
                  {[0, 25, 50, 75].map(p => (
                    <button key={p} className="bg-gray-800 text-gray-400 py-2 rounded text-xs">{p}%</button>
                  ))}
                </div>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white mb-3"
                />

                <div className="flex items-center space-x-2 mb-4">
                  <input type="checkbox" className="rounded bg-gray-800 border-gray-700" />
                  <span className="text-xs text-gray-400">Take Profit / Stop Lose</span>
                </div>

                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Available</span>
                  <span className="text-white">0.00 XAU</span>
                </div>
                <div className="flex justify-between text-xs mb-4">
                  <span className="text-gray-500">Max open</span>
                  <span className="text-white">1</span>
                </div>

                <button className="w-full bg-teal-400 text-gray-900 py-4 rounded-lg font-medium">
                  Buy
                </button>
              </div>
            </div>
          ) : (
            // Spot Trading Form
            <div className="space-y-4">
              <div className="text-xs text-gray-500 mb-2">Market</div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-teal-400">4911</span>
                  <span className="text-gray-300">9909.066</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-400">4910</span>
                  <span className="text-gray-300">31947.091</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-teal-400">4909</span>
                  <span className="text-gray-300">65874.109</span>
                </div>
              </div>

              <div className="py-3 border-y border-gray-800 my-3">
                <div className="flex justify-between">
                  <span className="text-white font-mono">{currentPrice.toFixed(2)} ↓</span>
                  <span className="text-xs text-gray-500">≈${currentPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">0.00000 XAU</span>
                </div>

                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white"
                />

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Available</span>
                  <span className="text-white">0.00 USDT</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Est. fee</span>
                  <span className="text-white">-- USDT</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-teal-400">4909</span>
                    <span className="text-gray-300">0.400</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400">4908</span>
                    <span className="text-gray-300">57036.023</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-400">4907</span>
                    <span className="text-gray-300">79386.899</span>
                  </div>
                </div>

                <button className="w-full bg-teal-400 text-gray-900 py-4 rounded-lg font-medium">
                  Buy {symbol}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-gray-800">
        <div className="flex border-b border-gray-800">
          {activeTab === 'option' ? (
            <>
              <button className="flex-1 py-3 text-sm text-teal-400 border-b-2 border-teal-400">Active</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Scheduled</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Completed</button>
            </>
          ) : activeTab === 'future' ? (
            <>
              <button className="flex-1 py-3 text-sm text-teal-400 border-b-2 border-teal-400">Positions</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Open orders</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Closed Orders</button>
            </>
          ) : (
            <>
              <button className="flex-1 py-3 text-sm text-teal-400 border-b-2 border-teal-400">Open orders</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Completed</button>
              <button className="flex-1 py-3 text-sm text-gray-500">Assets</button>
            </>
          )}
        </div>

        {/* No Records Found */}
        <div className="py-8 text-center">
          <div className="text-gray-600 text-sm">No Records Found</div>
        </div>

        {/* XAU Chart Link */}
        <div className="py-3 text-center border-t border-gray-800">
          <button 
            onClick={onShowChart}
            className="text-teal-400 text-sm flex items-center justify-center space-x-2"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{symbol} Chart</span>
          </button>
        </div>

        {/* Kryvex Footer */}
        <div className="py-2 text-center text-xs text-gray-600">
          kryvex.com
        </div>
      </div>
    </div>
  );
};

// Chart View Component (Level 3)
const ChartView = ({ symbol, onBack }: { symbol: string; onBack: () => void }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('15M');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timeframes = ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '1W'];
  const currentPrice = 4909.34;
  const priceChange = -1.68;

  return (
    <div className={`min-h-screen bg-[#0A0B0D] text-white ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{symbol} Chart</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-white font-mono">{currentPrice.toFixed(2)}</span>
              <span className={`text-xs ${
                priceChange >= 0 ? 'text-teal-400' : 'text-red-400'
              }`}>
                {priceChange}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-gray-400"
          >
            {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Timeframes */}
      <div className="px-4 py-3 flex space-x-2 overflow-x-auto border-b border-gray-800">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedTimeframe === tf
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '500px' }}>
        {/* TradingView Widget Placeholder */}
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-600 mb-2">TradingView Chart</div>
            <div className="text-xs text-gray-700">{symbol}/USDT • Real-time</div>
          </div>
        </div>

        {/* Price Indicators */}
        <div className="absolute top-4 left-4 space-y-2">
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">O</div>
            <div className="text-white font-mono text-sm">4908.23</div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">H</div>
            <div className="text-teal-400 font-mono text-sm">4921.45</div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">L</div>
            <div className="text-red-400 font-mono text-sm">4895.67</div>
          </div>
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
            <div className="text-xs text-gray-500 mb-1">C</div>
            <div className="text-white font-mono text-sm">4909.34</div>
          </div>
        </div>

        {/* Volume Indicator */}
        <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-gray-800">
          <div className="text-xs text-gray-500 mb-1">Volume</div>
          <div className="text-white font-mono text-sm">1.24M</div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-4 py-3 flex justify-between items-center border-t border-gray-800">
        <div className="flex items-center space-x-4">
          <button className="text-gray-400 hover:text-teal-400">
            <TrendingUp className="h-5 w-5" />
          </button>
          <button className="text-gray-400 hover:text-red-400">
            <TrendingDown className="h-5 w-5" />
          </button>
        </div>
        <button 
          onClick={onBack}
          className="bg-teal-400 text-gray-900 px-6 py-2 rounded-lg text-sm font-medium"
        >
          Trade
        </button>
      </div>
    </div>
  );
};

// Main Trading Interface Component
export default function TradingInterface() {
  const navigate = useNavigate();
  const { symbol: urlSymbol } = useParams();
  const [view, setView] = useState<'asset-list' | 'trading' | 'chart'>('asset-list');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAU');

  useEffect(() => {
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol.toUpperCase());
      setView('trading');
    }
  }, [urlSymbol]);

  const handleSelectAsset = (symbol: string) => {
    setSelectedSymbol(symbol);
    setView('trading');
    navigate(`/trading/${symbol.toLowerCase()}`);
  };

  const handleShowChart = () => {
    setView('chart');
    navigate(`/trading/${selectedSymbol.toLowerCase()}/chart`);
  };

  const handleBackFromChart = () => {
    setView('trading');
    navigate(`/trading/${selectedSymbol.toLowerCase()}`);
  };

  const handleBackFromTrading = () => {
    setView('asset-list');
    navigate('/trading');
  };

  return (
    <>
      {view === 'asset-list' && <AssetList onSelectAsset={handleSelectAsset} />}
      {view === 'trading' && (
        <TradingPage 
          symbol={selectedSymbol} 
          onShowChart={handleShowChart}
        />
      )}
      {view === 'chart' && (
        <ChartView 
          symbol={selectedSymbol} 
          onBack={handleBackFromChart}
        />
      )}
    </>
  );
}