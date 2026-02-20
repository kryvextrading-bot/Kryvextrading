import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

interface CompletedOrderCardProps {
  order: {
    id: string;
    direction: 'UP' | 'DOWN';
    stake: number;
    entryPrice: number;
    expiryPrice: number | null;
    profit: number;
    fee: number;
    duration: number;
    pnl: number | null;
    startTime: string;
    endTime: string;
  };
}

export const CompletedOrderCard: React.FC<CompletedOrderCardProps> = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const isWin = (order.pnl ?? 0) > 0;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700"
    >
      {/* Summary Card */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              order.direction === 'UP' ? 'bg-teal-400/20' : 'bg-red-400/20'
            }`}>
              {order.direction === 'UP' ? (
                <TrendingUp className={`w-4 h-4 ${isWin ? 'text-teal-400' : 'text-gray-400'}`} />
              ) : (
                <TrendingDown className={`w-4 h-4 ${isWin ? 'text-teal-400' : 'text-gray-400'}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {order.direction} XAU
                </span>
                {isWin ? (
                  <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">
                    WIN
                  </span>
                ) : (
                  <span className="text-xs bg-red-400/20 text-red-400 px-2 py-0.5 rounded-full">
                    LOSS
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {formatDate(order.endTime)}
              </div>
            </div>
          </div>

          {/* Profit/Loss Display */}
          <div className="text-right">
            <div className={`text-xs font-semibold ${
              isWin ? 'text-green-400' : 'text-red-400'
            }`}>
              {isWin ? '✔ Your Profit' : '✖ Your Loss'}
            </div>
            <div className={`text-lg font-bold font-mono ${
              isWin ? 'text-green-400' : 'text-red-400'
            }`}>
              {isWin ? '+' : '-'}${Math.abs(order.pnl ?? 0).toFixed(2)} USDT
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span>Stake: ${order.stake.toFixed(2)}</span>
          <span>•</span>
          <span>Duration: {formatDuration(order.duration)}</span>
          <span>•</span>
          <span>{order.direction === 'UP' ? '↑' : '↓'} {((order.pnl ?? 0) / order.stake * 100).toFixed(1)}%</span>
        </div>

        {/* Expand/Collapse Indicator */}
        <div className="flex justify-center mt-2">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700"
          >
            <div className="p-4 space-y-3">
              {/* Direction */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Direction</span>
                <div className="flex items-center gap-2">
                  {order.direction === 'UP' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-teal-400" />
                      <span className="text-sm font-medium text-teal-400">UP</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-red-400">DOWN</span>
                    </>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-sm font-mono text-white">
                  ${order.stake.toFixed(2)} USDT
                </span>
              </div>

              {/* Open Price */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Open Price</span>
                <span className="text-sm font-mono text-white">
                  ${order.entryPrice.toFixed(2)}
                </span>
              </div>

              {/* Closing Price */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Closing Price</span>
                <span className={`text-sm font-mono ${
                  isWin ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${order.expiryPrice?.toFixed(2) ?? 'N/A'}
                </span>
              </div>

              {/* Duration */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Duration</span>
                <span className="text-sm text-white">
                  {formatDuration(order.duration)}
                </span>
              </div>

              {/* Fee */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Fee</span>
                <span className="text-sm text-white">
                  ${order.fee.toFixed(2)} USDT
                </span>
              </div>

              {/* Start Time */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">Start Time</span>
                <span className="text-sm text-white">
                  {formatDate(order.startTime)}
                </span>
              </div>

              {/* End Time */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">End Time</span>
                <span className="text-sm text-white">
                  {formatDate(order.endTime)}
                </span>
              </div>

              {/* PnL */}
              <div className="flex justify-between items-center py-3 mt-2 border-t border-gray-700">
                <span className="text-base font-semibold text-white">
                  {isWin ? 'Profit' : 'Loss'}
                </span>
                <span className={`text-lg font-bold font-mono ${
                  isWin ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isWin ? '+' : '-'}${Math.abs(order.pnl ?? 0).toFixed(2)} USDT
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
