import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { OptionOrder, OptionDirection, PriceCache } from '@/types/options-trading';
import { unifiedTradingService } from '@/services/unified-trading-service';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useBinanceStream } from '@/hooks/useBinanceStream';

interface UseOptionOrderLifecycleProps {
  userId: string;
  symbol: string;
}

interface ActiveOrderState {
  order: OptionOrder;
  remainingSeconds: number;
  progress: number;
}

export const useOptionOrderLifecycle = ({ userId, symbol }: UseOptionOrderLifecycleProps) => {
  const [activeOrders, setActiveOrders] = useState<OptionOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OptionOrder[]>([]);
  const [activeOrderStates, setActiveOrderStates] = useState<Map<string, ActiveOrderState>>(new Map());
  const [priceCache, setPriceCache] = useState<Map<string, PriceCache[]>>(new Map());
  const { updateBalance } = useUnifiedWallet();
  const { currentPrice } = useBinanceStream(symbol);

  // Load orders on mount
  useEffect(() => {
    loadActiveOrders();
    loadCompletedOrders();
  }, [userId]);

  const loadActiveOrders = async () => {
    try {
      const orders = await unifiedTradingService.getActiveOptionsOrders(userId);
      setActiveOrders(orders);
      
      // Initialize order states
      const now = Date.now() / 1000;
      const newStates = new Map();
      orders.forEach(order => {
        const remainingSeconds = Math.max(0, order.endTime - now);
        const progress = 1 - (remainingSeconds / order.duration);
        newStates.set(order.id, { order, remainingSeconds, progress });
      });
      setActiveOrderStates(newStates);
    } catch (error) {
      console.error('Failed to load active orders:', error);
    }
  };

  const loadCompletedOrders = async () => {
    try {
      const orders = await unifiedTradingService.getCompletedOptionsOrders(userId);
      setCompletedOrders(orders);
    } catch (error) {
      console.error('Failed to load completed orders:', error);
    }
  };

  // Cache price data for offline fallback
  const cachePrice = useCallback((symbol: string, price: number) => {
    setPriceCache(prev => {
      const newCache = new Map(prev);
      const symbolCache = newCache.get(symbol) || [];
      symbolCache.push({
        symbol,
        timestamp: Date.now() / 1000,
        price
      });
      // Keep last 300 candles (5 minutes at 1s intervals)
      if (symbolCache.length > 300) {
        symbolCache.shift();
      }
      newCache.set(symbol, symbolCache);
      return newCache;
    });
  }, []);

  // Cache current price
  useEffect(() => {
    if (currentPrice) {
      cachePrice(symbol, currentPrice);
    }
  }, [currentPrice, symbol, cachePrice]);

  // Get price at specific timestamp (for settlement)
  const getPriceAt = useCallback((timestamp: number): number | null => {
    const symbolCache = priceCache.get(symbol);
    if (!symbolCache) return null;

    // Find closest price within 1 second
    const closest = symbolCache.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.timestamp - timestamp);
      const currDiff = Math.abs(curr.timestamp - timestamp);
      return prevDiff < currDiff ? prev : curr;
    });

    // Only return if within 1 second tolerance
    return Math.abs(closest.timestamp - timestamp) <= 1 ? closest.price : null;
  }, [priceCache, symbol]);

  // Create new option order
  const createOptionOrder = useCallback(async (
    direction: OptionDirection,
    stake: number,
    duration: number,
    fluctuationRange: number,
    entryPrice: number
  ): Promise<OptionOrder | null> => {
    try {
      const now = Date.now() / 1000;
      const profit = stake * (fluctuationRange * 10); // Example calculation
      const fee = stake * 0.001; // 0.1% fee

      const order: OptionOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        symbol,
        direction,
        stake,
        entryPrice,
        expiryPrice: null,
        profit,
        fee,
        duration,
        startTime: now,
        endTime: now + duration,
        status: 'ACTIVE',
        payoutRate: fluctuationRange,
        fluctuationRange,
        createdAt: now
      };

      // Deduct stake + fee from wallet
      await updateBalance('USDT', -(stake + fee), 'subtract');

      // Save to backend
      await unifiedTradingService.saveOptionOrder(order);

      // Update local state
      setActiveOrders(prev => [...prev, order]);
      
      const remainingSeconds = duration;
      const progress = 0;
      setActiveOrderStates(prev => {
        const newMap = new Map(prev);
        newMap.set(order.id, { order, remainingSeconds, progress });
        return newMap;
      });

      toast.success('Option order placed successfully');
      return order;
    } catch (error) {
      console.error('Failed to create option order:', error);
      toast.error('Failed to place option order');
      return null;
    }
  }, [userId, symbol, updateBalance]);

  // Settle order at expiration
  const settleOrder = useCallback(async (order: OptionOrder) => {
    try {
      // Get price at exact expiry time
      const closePrice = getPriceAt(order.endTime);
      
      // Fallback to current price if cache miss
      const finalPrice = closePrice ?? currentPrice ?? order.entryPrice;

      // Determine win/loss
      const win = order.direction === 'UP'
        ? finalPrice > order.entryPrice
        : finalPrice < order.entryPrice;

      // Calculate PnL
      const pnl = win ? order.profit : -order.stake;

      // Update order
      const completedOrder: OptionOrder = {
        ...order,
        expiryPrice: finalPrice,
        status: 'COMPLETED',
        completedAt: Date.now() / 1000,
        pnl
      };

      // Credit user if won
      if (win) {
        const creditAmount = order.stake + order.profit;
        await updateBalance('USDT', creditAmount, 'add');
        toast.success(`🎉 Won! +$${order.profit.toFixed(2)} USDT`);
      } else {
        toast.error(`💔 Lost. -$${order.stake.toFixed(2)} USDT`);
      }

      // Save to backend
      await unifiedTradingService.updateOptionOrder(completedOrder);

      // Update local state
      setActiveOrders(prev => prev.filter(o => o.id !== order.id));
      setCompletedOrders(prev => [completedOrder, ...prev]);
      
      setActiveOrderStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(order.id);
        return newMap;
      });

    } catch (error) {
      console.error('Failed to settle order:', error);
      toast.error('Failed to settle order');
    }
  }, [getPriceAt, currentPrice, updateBalance]);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now() / 1000;
      
      setActiveOrderStates(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;

        prev.forEach((state, id) => {
          const remainingSeconds = Math.max(0, state.order.endTime - now);
          const progress = 1 - (remainingSeconds / state.order.duration);
          
          newMap.set(id, {
            ...state,
            remainingSeconds,
            progress
          });

          // Check for expiration
          if (remainingSeconds === 0 && state.order.status === 'ACTIVE') {
            settleOrder(state.order);
            hasChanges = true;
          }
        });

        return hasChanges ? newMap : prev;
      });
    }, 100); // Update 10 times per second for smooth countdown

    return () => clearInterval(timer);
  }, [settleOrder]);

  // Get current price with offline fallback
  const getCurrentPrice = useCallback((): number => {
    if (currentPrice) return currentPrice;
    
    // Fallback to last cached price
    const symbolCache = priceCache.get(symbol);
    if (symbolCache && symbolCache.length > 0) {
      return symbolCache[symbolCache.length - 1].price;
    }
    
    return 0;
  }, [currentPrice, priceCache, symbol]);

  return {
    activeOrders,
    completedOrders,
    activeOrderStates,
    createOptionOrder,
    settleOrder,
    getCurrentPrice,
    refreshOrders: loadActiveOrders,
    refreshCompleted: loadCompletedOrders
  };
};
