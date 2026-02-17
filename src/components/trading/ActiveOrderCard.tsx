import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface ActiveOrderCardProps {
  order: {
    id: string;
    direction: 'UP' | 'DOWN';
    stake: number;
    entryPrice: number;
    profit: number;
    duration: number;
    endTime: string;
  };
  currentPrice: number;
}

export const ActiveOrderCard: React.FC<ActiveOrderCardProps> = ({
  order,
  currentPrice
}) => {
  const endTimeDate = new Date(order.endTime);
  const { remainingSeconds, progress, formatted } = useCountdown(endTimeDate);
  
  const isProfitable = order.direction === 'UP'
    ? currentPrice > order.entryPrice
    : currentPrice < order.entryPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {order.direction === 'UP' ? (
              <TrendingUp className="w-4 h-4 text-teal-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-sm font-semibold ${
              order.direction === 'UP' ? 'text-teal-400' : 'text-red-400'
            }`}>
              {order.direction}
            </span>
            <span className="text-xs text-gray-400">XAU</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Stake: ${order.stake.toFixed(2)} • Duration: {order.duration}s
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Expected Profit</div>
          <div className="text-sm font-semibold text-green-400">
            +${order.profit.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">Time Remaining</span>
          <span className="text-sm font-mono font-bold text-yellow-400">
            {formatted}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-400"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex justify-between text-xs mt-2">
          <span className="text-gray-400">
            Entry: ${order.entryPrice.toFixed(2)}
          </span>
          <span className={isProfitable ? 'text-green-400' : 'text-red-400'}>
            Current: ${currentPrice.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
