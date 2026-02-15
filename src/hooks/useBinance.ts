import { useState, useEffect, useCallback, useRef } from 'react';
import { BinanceClient } from '@/services/binance/client';
import { BinanceBalanceWithValue, BinancePrice, BinanceOrder, BinanceTrade } from '@/services/binance/types';
import { useToast } from '@/hooks/use-toast';

interface UseBinanceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: Error) => void;
}

export const useBinance = (
  apiKey: string,
  apiSecret: string,
  options: UseBinanceOptions = {}
) => {
  const { autoRefresh = false, refreshInterval = 30000, onError } = options;
  const { toast } = useToast();
  
  const [client, setClient] = useState<BinanceClient | null>(null);
  const [balances, setBalances] = useState<BinanceBalanceWithValue[]>([]);
  const [prices, setPrices] = useState<BinancePrice[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const refreshTimerRef = useRef<NodeJS.Timeout>();

  // Initialize client
  useEffect(() => {
    try {
      const binanceClient = new BinanceClient({ apiKey, apiSecret });
      setClient(binanceClient);
      setIsConnected(true);
    } catch (err) {
      setError(err as Error);
      setIsConnected(false);
      onError?.(err as Error);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [apiKey, apiSecret]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setError(null);

    try {
      const [balancesData, pricesData, totalData] = await Promise.all([
        client.getBalancesWithValues(),
        client.getAllPrices(),
        client.getTotalBalanceInUSDT(),
      ]);

      setBalances(balancesData);
      setPrices(pricesData);
      setTotalBalance(totalData);
    } catch (err) {
      setError(err as Error);
      onError?.(err as Error);
      
      toast({
        title: "Binance API Error",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast, onError]);

  // Initial fetch
  useEffect(() => {
    if (client) {
      fetchData();
    }
  }, [client, fetchData]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && client) {
      refreshTimerRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, client, fetchData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Get price for specific symbol
  const getPrice = useCallback((symbol: string): number => {
    const priceData = prices.find(p => p.symbol === `${symbol}USDT`);
    return priceData ? parseFloat(priceData.price) : 0;
  }, [prices]);

  // Get balance for specific asset
  const getBalance = useCallback((asset: string): BinanceBalanceWithValue | undefined => {
    return balances.find(b => b.asset === asset);
  }, [balances]);

  // Place order
  const placeOrder = useCallback(async (
    symbol: string,
    side: 'BUY' | 'SELL',
    type: 'LIMIT' | 'MARKET',
    quantity: string,
    price?: string
  ) => {
    if (!client) throw new Error('Client not initialized');

    try {
      const order = await client.createOrder({
        symbol,
        side,
        type,
        quantity,
        price,
        timeInForce: type === 'LIMIT' ? 'GTC' : undefined,
      });

      toast({
        title: "Order Placed",
        description: `${side} ${quantity} ${symbol} at ${price || 'market price'}`,
      });

      // Refresh data after order
      refresh();

      return order;
    } catch (err) {
      toast({
        title: "Order Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  }, [client, toast, refresh]);

  // Cancel order
  const cancelOrder = useCallback(async (symbol: string, orderId: number) => {
    if (!client) throw new Error('Client not initialized');

    try {
      const result = await client.cancelOrder(symbol, orderId);

      toast({
        title: "Order Cancelled",
        description: `Order ${orderId} has been cancelled`,
      });

      refresh();

      return result;
    } catch (err) {
      toast({
        title: "Cancel Failed",
        description: (err as Error).message,
        variant: "destructive",
      });
      throw err;
    }
  }, [client, toast, refresh]);

  return {
    client,
    balances,
    prices,
    totalBalance,
    loading,
    error,
    isConnected,
    refresh,
    getPrice,
    getBalance,
    placeOrder,
    cancelOrder,
  };
};
