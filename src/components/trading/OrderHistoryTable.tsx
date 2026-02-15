import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/trading';
import { formatPrice, formatAmount, formatCurrency } from '@/utils/tradingCalculations';
import { X, Play } from 'lucide-react';

interface OrderHistoryTableProps {
  orders: Transaction[];
  showCountdown?: boolean;
  onStopOrder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
}

const formatCountdown = (endTime: number): string => {
  const remaining = endTime - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

const getStatusDisplay = (order: any): string => {
  // For options trades, show won/lost based on metadata outcome
  if (order.type === 'options') {
    if (order.metadata?.outcome === 'win') return 'won';
    if (order.metadata?.outcome === 'loss') return 'lost';
  }
  return order.status;
};

const getStatusColor = (status: string, order: any): string => {
  // For options trades with won/lost status
  if (order.type === 'options') {
    if (status === 'won') return 'bg-green-500/20 text-green-400';
    if (status === 'lost') return 'bg-red-500/20 text-red-400';
  }
  
  // Default status colors
  switch (status) {
    case 'completed': return 'bg-green-500/20 text-green-400';
    case 'active': return 'bg-blue-500/20 text-blue-400';
    case 'pending': return 'bg-yellow-500/20 text-yellow-400';
    case 'scheduled': return 'bg-purple-500/20 text-purple-400';
    case 'cancelled': return 'bg-gray-500/20 text-gray-400';
    default: return 'bg-red-500/20 text-red-400';
  }
};

export const OrderHistoryTable: React.FC<OrderHistoryTableProps> = ({ 
  orders, 
  showCountdown,
  onStopOrder,
  onCancelOrder
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!showCountdown) return;
    
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showCountdown]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-[#848E9C] text-sm">
        No orders found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#2B3139]">
            <th className="text-left p-3 text-xs text-[#848E9C]">Pair</th>
            <th className="text-left p-3 text-xs text-[#848E9C]">Type</th>
            <th className="text-left p-3 text-xs text-[#848E9C]">Side</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">Amount</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">Price</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">Total</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">P&L</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">Status</th>
            <th className="text-right p-3 text-xs text-[#848E9C]">Time</th>
            {(onStopOrder || onCancelOrder) && (
              <th className="text-right p-3 text-xs text-[#848E9C]">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map(order => {
            const expiresAt = order.metadata?.expiresAt;
            const isExpiring = showCountdown && expiresAt && expiresAt > currentTime;
            
            return (
              <tr key={order.id} className="border-b border-[#2B3139] hover:bg-[#23262F]/50">
                <td className="p-3 text-sm text-[#EAECEF]">{order.asset}</td>
                <td className="p-3">
                  <Badge className="bg-[#2B3139] text-[#848E9C]">
                    {order.type}
                  </Badge>
                </td>
                <td className="p-3">
                  <Badge className={
                    order.side === 'buy' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }>
                    {order.side?.toUpperCase()}
                  </Badge>
                </td>
                <td className="p-3 text-right text-sm text-[#EAECEF]">
                  {formatAmount(order.amount)}
                </td>
                <td className="p-3 text-right text-sm text-[#EAECEF]">
                  ${formatPrice(order.price)}
                </td>
                <td className="p-3 text-right text-sm text-[#EAECEF]">
                  ${formatPrice(order.total)}
                </td>
                <td className="p-3 text-right">
                  {order.pnl !== undefined && (
                    <span className={order.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {order.pnl >= 0 ? '+' : ''}{formatCurrency(order.pnl)} USDT
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <Badge className={getStatusColor(getStatusDisplay(order), order)}>
                    {getStatusDisplay(order)}
                  </Badge>
                </td>
                <td className="p-3 text-right text-xs text-[#848E9C]">
                  {isExpiring ? (
                    <span className="text-blue-400 font-mono">
                      {formatCountdown(expiresAt)}
                    </span>
                  ) : (
                    new Date(order.createdAt).toLocaleTimeString()
                  )}
                </td>
                {(onStopOrder || onCancelOrder) && (
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {order.status === 'active' && onStopOrder && (
                        <Button
                          size="sm"
                          className="bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400 h-6 px-2 text-xs"
                          onClick={() => onStopOrder(order.id)}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Stop
                        </Button>
                      )}
                      {(order.status === 'active' || order.status === 'pending') && onCancelOrder && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#2B3139] text-[#848E9C] hover:bg-[#2B3139] h-6 px-2 text-xs"
                          onClick={() => onCancelOrder(order.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderHistoryTable;