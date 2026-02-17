import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { OptionOrder } from '@/types/options-trading';
import { formatCurrency } from '@/utils/tradingCalculations';

interface CompletedOrdersProps {
  orders: OptionOrder[];
}

export const CompletedOrders: React.FC<CompletedOrdersProps> = ({ orders }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-3">📋</div>
        <div className="text-gray-400 text-sm">No completed orders</div>
        <div className="text-xs text-gray-600 mt-1">Your trade history will appear here</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const isWin = (order.pnl ?? 0) > 0;
        const isExpanded = expandedId === order.id;

        return (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700"
          >
            {/* Summary Card - Always Visible */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
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
                        {order.direction} {order.symbol}
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
                
                {/* Profit/Loss Display - EXACT SCREENSHOT */}
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    isWin ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isWin ? '✔ Your Profit' : '✖ Your Loss'}
                  </div>
                  <div className={`text-lg font-bold font-mono ${
                    isWin ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isWin ? '+' : '-'}{formatCurrency(Math.abs(order.pnl ?? 0))} USDT
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Stake: ${order.stake.toFixed(2)}</span>
                <span>•</span>
                <span>Duration: {formatDuration(order.duration)}</span>
                <span>•</span>
                <span>{order.direction === 'UP' ? '↑' : '↓'} {order.fluctuationRange}%</span>
              </div>

              {/* Expand/Collapse Indicator */}
              <div className="flex justify-center mt-2">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Details - EXACT SCREENSHOT */}
            <AnimatePresence>
              {isExpanded && (
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
                        {isWin ? '+' : '-'}{formatCurrency(Math.abs(order.pnl ?? 0))} USDT
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
};
