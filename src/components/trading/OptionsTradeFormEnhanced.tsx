import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronDown, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle
} from 'lucide-react';
import Countdown from 'react-countdown';
import { OptionOrder, OptionDirection } from '@/types/options-trading';
import { formatCurrency } from '@/utils/tradingCalculations';

interface OptionsTradeFormEnhancedProps {
  symbol: string;
  currentPrice: number;
  balance: number;
  onSubmit: (direction: OptionDirection, stake: number, duration: number, fluctuationRange: number) => Promise<void>;
  activeOrder?: OptionOrder | null;
  isLoading: boolean;
}

const OPTIONS_TIMEFRAMES = [
  { label: '60s', value: 60, profit: 15 },
  { label: '120s', value: 120, profit: 18 },
  { label: '240s', value: 240, profit: 22 },
  { label: '360s', value: 360, profit: 25 },
  { label: '600s', value: 600, profit: 30 },
];

const FLUCTUATION_RANGES = {
  60: [
    { label: 'UP > 0.01%', value: 0.01, payout: 0.176 },
  ],
  120: [
    { label: 'UP > 0.01%', value: 0.01, payout: 0.176 },
  ],
  240: [
    { label: 'UP > 0.05%', value: 0.05, payout: 0.328 },
  ],
  360: [
    { label: 'UP > 0.1%', value: 0.1, payout: 0.439 },
  ],
  600: [
    { label: 'UP > 0.5%', value: 0.5, payout: 0.516 },
    { label: 'UP > 0.8%', value: 0.8, payout: 0.75 },
  ],
};

const PURCHASE_RANGES = {
  60: { min: 100, max: 50000 },
  120: { min: 10000, max: 300000 },
  240: { min: 30000, max: 500000 },
  360: { min: 50000, max: 1000000 },
  600: { min: 100000, max: 9999999 },
};

export const OptionsTradeFormEnhanced: React.FC<OptionsTradeFormEnhancedProps> = ({
  symbol,
  currentPrice,
  balance,
  onSubmit,
  activeOrder,
  isLoading
}) => {
  const [direction, setDirection] = useState<OptionDirection>('UP');
  const [duration, setDuration] = useState(60);
  const [fluctuationRange, setFluctuationRange] = useState(0.01);
  const [stake, setStake] = useState('');
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showFluctuationModal, setShowFluctuationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseRange = PURCHASE_RANGES[duration as keyof typeof PURCHASE_RANGES];
  const fluctuationOptions = FLUCTUATION_RANGES[duration as keyof typeof FLUCTUATION_RANGES];
  const selectedFluctuation = fluctuationOptions?.find(f => f.value === fluctuationRange);
  const timeOption = OPTIONS_TIMEFRAMES.find(t => t.value === duration);

  // Validate stake
  useEffect(() => {
    if (!stake) {
      setError(null);
      return;
    }

    const amount = parseFloat(stake);
    if (isNaN(amount)) {
      setError('Invalid amount');
    } else if (amount < purchaseRange.min) {
      setError(`Minimum amount: $${purchaseRange.min.toLocaleString()}`);
    } else if (amount > purchaseRange.max) {
      setError(`Maximum amount: $${purchaseRange.max.toLocaleString()}`);
    } else if (amount > balance) {
      setError('Insufficient balance');
    } else {
      setError(null);
    }
  }, [stake, purchaseRange, balance]);

  const handleSubmit = () => {
    if (error || !stake) return;
    const amount = parseFloat(stake);
    onSubmit(direction, amount, duration, fluctuationRange);
    setStake('');
  };

  // Countdown renderer for active order
  const CountdownRenderer = ({ hours, minutes, seconds, completed }: any) => {
    if (completed) return null;
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const progress = 1 - (totalSeconds / (activeOrder?.duration || 1));
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Time Remaining</span>
          <span className="text-lg font-mono font-bold text-yellow-400">
            {totalSeconds > 60 
              ? `${minutes}:${seconds.toString().padStart(2, '0')}` 
              : `${seconds}s` 
            }
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-teal-400"
            initial={{ width: `${progress * 100}%` }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        
        {/* Price Comparison */}
        {activeOrder && (
          <div className="flex justify-between text-xs mt-2">
            <span className="text-gray-400">Entry: ${activeOrder.entryPrice.toFixed(2)}</span>
            <span className={`font-mono ${
              (activeOrder.direction === 'UP' && currentPrice > activeOrder.entryPrice) ||
              (activeOrder.direction === 'DOWN' && currentPrice < activeOrder.entryPrice)
                ? 'text-green-400'
                : 'text-red-400'
            }`}>
              Current: ${currentPrice.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Active Order Display */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${
                    activeOrder.direction === 'UP' ? 'text-teal-400' : 'text-red-400'
                  }`}>
                    {activeOrder.direction}
                  </span>
                  <span className="text-xs text-gray-400">{symbol}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Stake: ${activeOrder.stake.toFixed(2)} • Duration: {activeOrder.duration}s
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Expected Profit</div>
                <div className="text-sm font-semibold text-green-400">
                  +${activeOrder.profit.toFixed(2)}
                </div>
              </div>
            </div>
            
            <Countdown
              date={activeOrder.endTime * 1000}
              renderer={CountdownRenderer}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direction Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setDirection('UP')}
          className={`py-4 rounded-xl text-sm font-medium transition-all ${
            direction === 'UP'
              ? 'bg-teal-400 text-gray-900 shadow-lg shadow-teal-400/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4 mx-auto mb-1" />
          UP
        </button>
        <button
          onClick={() => setDirection('DOWN')}
          className={`py-4 rounded-xl text-sm font-medium transition-all ${
            direction === 'DOWN'
              ? 'bg-red-400 text-gray-900 shadow-lg shadow-red-400/20'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <TrendingDown className="w-4 h-4 mx-auto mb-1" />
          DOWN
        </button>
      </div>

      {/* Duration Selector */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Duration</label>
        <button
          onClick={() => setShowDurationModal(true)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between"
        >
          <span className="text-white">{timeOption?.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Profit: +{timeOption?.profit}%</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Fluctuation Range Selector */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Fluctuation Range</label>
        <button
          onClick={() => setShowFluctuationModal(true)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 flex items-center justify-between"
        >
          <div>
            <span className="text-white">{selectedFluctuation?.label}</span>
            <span className="text-xs text-gray-400 ml-2">
              Payout: {selectedFluctuation?.payout.toFixed(3)}x
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Stake Input */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400">Stake (USDT)</label>
          <span className="text-xs text-gray-400">
            Balance: ${formatCurrency(balance)}
          </span>
        </div>
        
        <input
          type="number"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          placeholder={`${purchaseRange.min.toLocaleString()} - ${purchaseRange.max.toLocaleString()}`}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white font-mono"
          min={purchaseRange.min}
          max={purchaseRange.max}
          step="0.01"
        />

        {/* Quick amount buttons */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[25, 50, 75, 100].map(percent => {
            const amount = Math.floor(purchaseRange.max * (percent / 100));
            return (
              <button
                key={percent}
                onClick={() => setStake(amount.toString())}
                className="bg-gray-800 text-gray-400 py-2 rounded-lg text-xs hover:bg-gray-700"
              >
                {percent}%
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
      </div>

      {/* Expected Profit */}
      {stake && !error && (
        <div className="bg-gray-800/50 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Expected Profit</span>
            <span className="text-lg font-bold text-green-400">
              +${(parseFloat(stake) * (selectedFluctuation?.payout || 0.176)).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Potential Payout</span>
            <span className="text-white font-mono">
              ${(parseFloat(stake) * (1 + (selectedFluctuation?.payout || 0.176))).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-400">Fee (0.1%)</span>
            <span className="text-white font-mono">
              ${(parseFloat(stake) * 0.001).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!!error || !stake || isLoading || !!activeOrder}
        className={`w-full py-4 rounded-xl font-semibold text-sm transition-all ${
          direction === 'UP'
            ? 'bg-teal-400 hover:bg-teal-500 text-gray-900'
            : 'bg-red-400 hover:bg-red-500 text-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Processing...' :
         activeOrder ? 'Trade in Progress' :
         direction === 'UP' ? 'Buy UP' : 'Buy DOWN'}
      </button>

      {/* Duration Modal */}
      <AnimatePresence>
        {showDurationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
            onClick={() => setShowDurationModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-[#1E2329] border border-gray-800 rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Select Duration</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Choose the time range for your option
                </p>
              </div>
              <div className="p-4 space-y-2">
                {OPTIONS_TIMEFRAMES.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDuration(option.value);
                      setFluctuationRange(
                        FLUCTUATION_RANGES[option.value as keyof typeof FLUCTUATION_RANGES][0].value
                      );
                      setShowDurationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      duration === option.value
                        ? 'bg-teal-400/20 border border-teal-400'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div>
                      <span className="text-white font-medium">{option.label}</span>
                      <span className="text-xs text-gray-400 block mt-1">
                        Profit: +{option.profit}%
                      </span>
                    </div>
                    {duration === option.value && (
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fluctuation Modal */}
      <AnimatePresence>
        {showFluctuationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
            onClick={() => setShowFluctuationModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-[#1E2329] border border-gray-800 rounded-t-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-800">
                <h3 className="text-lg font-semibold text-white">Fluctuation Range</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Select the price movement required to win
                </p>
              </div>
              <div className="p-4 space-y-2">
                {fluctuationOptions?.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFluctuationRange(option.value);
                      setShowFluctuationModal(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-lg ${
                      fluctuationRange === option.value
                        ? 'bg-teal-400/20 border border-teal-400'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div>
                      <span className="text-white font-medium">{option.label}</span>
                      <span className="text-xs text-gray-400 block mt-1">
                        Payout: {option.payout.toFixed(3)}x
                      </span>
                    </div>
                    {fluctuationRange === option.value && (
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
