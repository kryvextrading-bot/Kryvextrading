import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  BarChart3,
  Eye,
  RefreshCw,
  User,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { useOptionTrading } from '@/hooks/useOptionTrading';
import { toast } from 'react-hot-toast';

// Components
import { ScheduledTimeModal } from '@/components/trading/ScheduledTimeModal';
import { TimeRangeModal } from '@/components/trading/TimeRangeModal';
import { FluctuationRangeModal, FluctuationOption } from '@/components/trading/FluctuationRangeModal';
import { DecimalChangeModal } from '@/components/trading/DecimalChangeModal';
import { ActiveOrderCard } from '@/components/trading/ActiveOrderCard';
import { CompletedOrderCard } from '@/components/trading/CompletedOrderCard';

// Constants
const TRADING_PAIRS = [
  { symbol: 'XAUUSDT', baseAsset: 'XAU', quoteAsset: 'USDT', price: 4909.35, change: -1.68 },
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', price: 67000, change: 2.34 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', price: 3500, change: 1.56 },
];

const TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H'];

const OPTIONS_TIMEFRAMES = [
  { value: 60, label: '1 min' },
  { value: 120, label: '2 min' },
  { value: 240, label: '4 min' },
  { value: 360, label: '6 min' },
  { value: 600, label: '10 min' }
];

export default function OptionsTradingPage() {
  const navigate = useNavigate();
  const { symbol } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { getTradingBalance } = useUnifiedWallet();

  // Find selected pair
  const selectedPair = TRADING_PAIRS.find(p => p.baseAsset.toLowerCase() === symbol?.toLowerCase()) || TRADING_PAIRS[0];

  // Live price data
  const { currentPrice, priceChange24h } = useBinanceStream(selectedPair?.symbol || 'XAUUSDT');
  const displayPrice = currentPrice || selectedPair.price;
  const displayChange = priceChange24h || selectedPair.change;

  // Options trading hook
  const {
    activeOrders,
    completedOrders,
    scheduledTrades,
    fluctuationOptions,
    purchaseRange,
    loading,
    purchaseOption,
    scheduleOption,
    cancelScheduled,
    loadFluctuationOptions,
    loadPurchaseRange,
    calculateExpectedProfit,
    validateAmount
  } = useOptionTrading(selectedPair?.baseAsset || 'XAU');

  // UI State
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [duration, setDuration] = useState(60);
  const [fluctuation, setFluctuation] = useState(0.01);
  const [payoutRate, setPayoutRate] = useState(0.176);
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedDecimal, setSelectedDecimal] = useState(0.01);
  const [hideBalances, setHideBalances] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'active' | 'scheduled' | 'completed'>('active');

  // Modal states
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showFluctuationModal, setShowFluctuationModal] = useState(false);
  const [showDecimalModal, setShowDecimalModal] = useState(false);

  // Load fluctuation options when duration changes
  useEffect(() => {
    loadFluctuationOptions(duration);
    loadPurchaseRange(duration);
  }, [duration]);

  // Update fluctuation options when they load
  useEffect(() => {
    if (fluctuationOptions.length > 0) {
      const defaultOption = fluctuationOptions.find(opt => opt.value === fluctuation) || fluctuationOptions[0];
      setFluctuation(defaultOption.value);
      setPayoutRate(defaultOption.payout);
    }
  }, [fluctuationOptions]);

  // Amount validation
  const [amountError, setAmountError] = useState<string | null>(null);
  useEffect(() => {
    if (!amount) {
      setAmountError(null);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      setAmountError('Invalid amount');
      return;
    }

    const validation = validateAmount(numAmount);
    setAmountError(validation.valid ? null : validation.error || null);
  }, [amount, validateAmount]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setPercentage(0);
  };

  const handlePercentageClick = (percent: number) => {
    setPercentage(percent);
    const maxAmount = purchaseRange.max;
    const calculatedAmount = Math.floor(maxAmount * (percent / 100));
    setAmount(calculatedAmount.toString());
  };

  const handleBuy = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to trade');
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const balance = getTradingBalance('USDT');
    if (numAmount > balance) {
      toast.error(`Insufficient balance. Need $${numAmount.toFixed(2)} USDT`);
      return;
    }

    if (isScheduled) {
      // Handle scheduled trade
      const now = new Date();
      const scheduledDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          parseInt(showScheduledModal.split(':')[0]) || 0,
          parseInt(showScheduledModal.split(':')[1]) || 0,
          parseInt(showScheduledModal.split(':')[2]) || 30
        )
      );

      try {
        await scheduleOption({
          direction,
          stake: numAmount,
          duration,
          fluctuationRange: fluctuation,
          payoutRate,
          scheduledTime: scheduledDate
        });
        setAmount('');
        setPercentage(0);
        setIsScheduled(false);
      } catch (error) {
        // Error already handled in hook
      }
    } else {
      // Handle immediate trade
      try {
        await purchaseOption({
          direction,
          stake: numAmount,
          duration,
          fluctuationRange: fluctuation,
          payoutRate
        });
        setAmount('');
        setPercentage(0);
      } catch (error) {
        // Error already handled in hook
      }
    }
  };

  const handleScheduleSave = async (time: { hours: number; minutes: number; seconds: number }) => {
    const now = new Date();
    const scheduledDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        time.hours,
        time.minutes,
        time.seconds
      )
    );

    try {
      await scheduleOption({
        direction,
        stake: parseFloat(amount),
        duration,
        fluctuationRange: fluctuation,
        payoutRate,
        scheduledTime: scheduledDate
      });
      setAmount('');
      setPercentage(0);
      setIsScheduled(false);
      setShowScheduledModal(`${time.hours}:${time.minutes.toString().padStart(2, '0')}:${time.seconds.toString().padStart(2, '0')}`);
    } catch (error) {
      // Error already handled in hook
    }
  };

  const handleCancelScheduled = async (tradeId: string) => {
    await cancelScheduled(tradeId);
  };

  // Generate price ladder based on selected decimal
  const generatePriceLadder = () => {
    const prices = [];
    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      const price = displayPrice + (i * selectedDecimal);
      prices.push({
        price: price.toFixed(2),
        quantity: (Math.random() * 100000).toFixed(3),
        side: i > 0 ? 'ask' : 'bid'
      });
    }
    return {
      asks: prices.filter(p => p.side === 'ask').sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
      bids: prices.filter(p => p.side === 'bid').sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    };
  };

  const priceLadder = generatePriceLadder();

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0A0B0D]/95 backdrop-blur-xl border-b border-gray-800">
        <div className="px-4 py-3">
          {/* Top Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => navigate('/trading')} className="text-gray-400">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">{selectedPair.baseAsset}</h1>
              <span className={`text-sm ${displayChange >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setHideBalances(!hideBalances)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Toggle balance visibility"
              >
                <Eye className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={() => navigate(`/trading/${symbol}/chart`)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="View chart"
              >
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Refresh">
                <RefreshCw className="h-5 w-5 text-gray-400" />
              </button>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center"
                title="User profile"
              >
                <span className="text-sm font-bold text-gray-900">
                  {user?.email?.[0] || 'U'}
                </span>
              </button>
            </div>
          </div>

          {/* Market Tabs */}
          <div className="flex space-x-4 mt-3">
            <button
              onClick={() => navigate(`/trading/${symbol}`)}
              className="pb-1 text-sm font-medium border-b-2 border-transparent text-gray-500"
            >
              Spot
            </button>
            <button
              onClick={() => navigate(`/trading/${symbol}/future`)}
              className="pb-1 text-sm font-medium border-b-2 border-transparent text-gray-500"
            >
              Future
            </button>
            <button
              className="pb-1 text-sm font-medium border-b-2 border-teal-400 text-teal-400"
            >
              Option
            </button>
          </div>

          {/* Price Info */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white">
                {displayPrice.toFixed(2)} ↓
              </span>
              <span className={`text-sm ${displayChange >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                {displayChange.toFixed(2)}%
              </span>
            </div>
            <span className="text-xs text-gray-500">
              ≈${displayPrice.toFixed(2)}
            </span>
          </div>

          {/* Offline Warning */}
          {false && (
            <div className="mt-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
              <div className="flex items-center gap-2 text-yellow-400 text-xs">
                <AlertTriangle className="w-3 h-3" />
                <span>Price delayed - using cached data</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeframes */}
      <div className="px-4 py-2 flex space-x-4 border-b border-gray-800">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            className="text-sm font-medium text-gray-500"
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Mini Chart */}
        <div className="h-32 bg-gray-900 rounded-lg mb-4 flex items-end justify-between px-2">
          <div className="flex items-end gap-1 h-full py-2">
            {[16, 24, 12, 20, 8, 28, 16, 22].map((height, i) => (
              <div
                key={i}
                className={`w-8 rounded-t ${
                  i % 2 === 0 ? 'bg-red-400/30' : 'bg-green-400/30'
                }`}
                style={{ height: `${height * 4}px` }}
              />
            ))}
          </div>
        </div>

        {/* Direction Selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setDirection('UP')}
            className={`py-2 rounded-lg text-sm font-medium ${
              direction === 'UP'
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Up
          </button>
          <button
            onClick={() => setDirection('DOWN')}
            className={`py-2 rounded-lg text-sm font-medium ${
              direction === 'DOWN'
                ? 'bg-red-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Down
          </button>
          <button className="py-2 rounded-lg text-sm font-medium bg-gray-800 text-gray-400">
            Borrow/Repay
          </button>
        </div>

        {/* Open Position Mode */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setIsScheduled(false)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              !isScheduled
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            Open Position Now
          </button>
          <button
            onClick={() => setShowScheduledModal(true)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
              isScheduled
                ? 'bg-teal-400 text-gray-900'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <Clock className="w-4 h-4" />
            Scheduled Time
          </button>
        </div>

        {/* Active Trade Display */}
        <AnimatePresence>
          {activeOrders.map(order => (
            <ActiveOrderCard
              key={order.id}
              order={order}
              currentPrice={displayPrice}
            />
          ))}
        </AnimatePresence>

        {/* Order Book and Trading Form */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Left - Order Book */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-gray-500">Price (USDT) • Available (XAU)</div>
              <button
                onClick={() => setShowDecimalModal(true)}
                className="text-xs text-gray-400 hover:text-teal-400 flex items-center gap-1"
                title="Change decimal precision"
              >
                <span>{selectedDecimal}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            {/* Asks */}
            <div className="space-y-1">
              {priceLadder.asks.map((ask, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-red-400 font-mono">{ask.price}</span>
                  <span className="text-gray-300">{ask.quantity}</span>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="flex justify-between items-center py-2 border-y border-gray-800 my-2">
              <span className={`text-white font-bold font-mono ${
                displayChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${displayPrice.toFixed(2)} {displayChange >= 0 ? '↑' : '↓'}
              </span>
              <span className="text-xs text-gray-500">≈${displayPrice.toFixed(2)}</span>
            </div>

            {/* Bids */}
            <div className="space-y-1 mt-2">
              {priceLadder.bids.map((bid, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-teal-400 font-mono">{bid.price}</span>
                  <span className="text-gray-300">{bid.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Trading Form */}
          <div className="space-y-4">
            {/* Duration Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Time Range</span>
                <button
                  onClick={() => setShowDurationModal(true)}
                  className="text-xs text-gray-400 hover:text-teal-400"
                  title="Select duration"
                >
                  {OPTIONS_TIMEFRAMES.find(tf => tf.value === duration)?.label || '60s'} <ChevronDown className="w-3 h-3 inline" />
                </button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {OPTIONS_TIMEFRAMES.map(d => (
                    <button
                      key={d.value}
                      onClick={() => {
                        setDuration(d.value);
                        setShowDurationModal(false);
                      }}
                      className={`text-xs py-1 rounded ${
                        duration === d.value
                          ? 'bg-teal-400 text-gray-900 font-medium'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                      title={`${d.label} - ${d.value} seconds`}
                    >
                      {d.value}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fluctuation Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Fluctuation Range</span>
                <button
                  onClick={() => setShowFluctuationModal(true)}
                  className="text-xs text-gray-400 hover:text-teal-400"
                  title="Select fluctuation range"
                >
                  {fluctuationOptions.find(f => f.value === fluctuation)?.label || 'UP > 0.01%'} <ChevronDown className="w-3 h-3 inline" />
                </button>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-teal-400 font-mono">
                    {payoutRate.toFixed(3)}x
                  </span>
                  <span className="text-xs text-gray-400">
                    Min: {fluctuationOptions[0]?.value || 0.01}% Max: {fluctuationOptions[fluctuationOptions.length - 1]?.value || 0.01}%
                  </span>
                </div>
              </div>
            </div>

            {/* Purchase Range */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Purchase Range</span>
                <span className="text-white">
                  {purchaseRange.min.toLocaleString()}-{purchaseRange.max.toLocaleString()}
                </span>
              </div>

              {/* Available */}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Available</span>
                <span className="text-white">
                  {hideBalances ? '•••••' : `$${getTradingBalance('USDT').toFixed(2)}`} USDT
                </span>
              </div>

              {/* Expected Profit */}
              {amount && !amountError && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Expected Profit</span>
                  <span className="text-green-400 font-mono">
                    +${calculateExpectedProfit(parseFloat(amount), payoutRate).toFixed(2)} USDT
                  </span>
                </div>
              )}

              {/* Amount Input */}
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-white font-mono ${
                  amountError ? 'border-red-500' : 'border-gray-700'
                }`}
                min={purchaseRange.min}
                max={purchaseRange.max}
                title="Trade amount"
              />

              {/* Error Message */}
              {amountError && (
                <div className="text-red-400 text-xs mt-1">{amountError}</div>
              )}

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-1">
                {[25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    onClick={() => handlePercentageClick(p)}
                    className={`py-2 rounded text-xs transition-colors ${
                      percentage === p
                        ? 'bg-teal-400 text-gray-900'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                    title={`${p}% of available balance`}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              {/* Buy Button */}
              <button
                onClick={handleBuy}
                disabled={!!amountError || !amount || loading}
                className="w-full bg-teal-400 text-gray-900 py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title={isScheduled ? 'Schedule trade' : 'Buy now'}
              >
                {loading ? 'Processing...' : isScheduled ? 'Schedule Trade' : 'Buy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D] border-t border-gray-800">
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveBottomTab('active')}
            className={`flex-1 py-3 text-sm border-b-2 transition-colors ${
              activeBottomTab === 'active'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-500'
            }`}
            title="View active trades"
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveBottomTab('scheduled')}
            className={`flex-1 py-3 text-sm border-b-2 transition-colors ${
              activeBottomTab === 'scheduled'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-500'
            }`}
            title="View scheduled trades"
          >
            Scheduled ({scheduledTrades.length})
          </button>
          <button
            onClick={() => setActiveBottomTab('completed')}
            className={`flex-1 py-3 text-sm border-b-2 transition-colors ${
              activeBottomTab === 'completed'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-gray-500'
            }`}
            title="View completed trades"
          >
            Completed ({completedOrders.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-64 overflow-y-auto">
          {activeBottomTab === 'active' && (
            <div className="p-4 space-y-3">
              {activeOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No active trades
                </div>
              ) : (
                activeOrders.map(order => (
                  <div key={order.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${
                            order.direction === 'UP' ? 'text-teal-400' : 'text-red-400'
                          }`}>
                            {order.direction}
                          </span>
                          <span className="text-xs text-gray-400">XAU</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Stake: ${order.stake.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'scheduled' && (
            <div className="p-4 space-y-3">
              {scheduledTrades.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No scheduled trades
                </div>
              ) : (
                scheduledTrades.map(trade => (
                  <div key={trade.id} className="bg-gray-800 rounded-lg p-3 opacity-75">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${
                            trade.direction === 'UP' ? 'text-teal-400' : 'text-red-400'
                          }`}>
                            {trade.direction}
                          </span>
                          <span className="text-xs text-gray-400">XAU</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Stake: ${trade.stake.toFixed(2)} • {new Date(trade.scheduledTime).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelScheduled(trade.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        title="Cancel scheduled trade"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeBottomTab === 'completed' && (
            <div className="p-4 space-y-3">
              {completedOrders.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No completed trades
                </div>
              ) : (
                completedOrders.map(order => (
                  <CompletedOrderCard key={order.id} order={order} />
                ))
              )}
            </div>
          )}
        </div>

        {/* Chart Link */}
        <div className="py-3 text-center border-t border-gray-800">
          <button
            onClick={() => navigate(`/trading/${symbol}/chart`)}
            className="text-teal-400 text-sm flex items-center justify-center space-x-2"
            title="View detailed chart"
          >
            <BarChart3 className="h-4 w-4" />
            <span>{selectedPair.baseAsset} Chart</span>
          </button>
        </div>

        {/* Kryvex Footer */}
        <div className="py-2 text-center text-xs text-gray-600">
          kryvex.com
        </div>
      </div>

      {/* Modals */}
      <ScheduledTimeModal
        isOpen={showScheduledModal}
        onClose={() => setShowScheduledModal(false)}
        onSave={handleScheduleSave}
      />

      <TimeRangeModal
        isOpen={showDurationModal}
        onClose={() => setShowDurationModal(false)}
        onSelect={(d) => {
          setDuration(d);
          setShowDurationModal(false);
        }}
        currentDuration={duration}
      />

      <FluctuationRangeModal
        isOpen={showFluctuationModal}
        onClose={() => setShowFluctuationModal(false)}
        onSelect={(value) => {
          const option = fluctuationOptions.find(opt => opt.value === value);
          if (option) {
            setFluctuation(value);
            setPayoutRate(option.payout);
          }
          setShowFluctuationModal(false);
        }}
        currentValue={fluctuation}
        options={fluctuationOptions}
      />

      <DecimalChangeModal
        isOpen={showDecimalModal}
        onClose={() => setShowDecimalModal(false)}
        onSelect={setSelectedDecimal}
        currentDecimal={selectedDecimal}
      />
    </div>
  );
}
