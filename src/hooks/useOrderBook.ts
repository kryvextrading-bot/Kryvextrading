import { useState, useEffect, useMemo } from 'react';
import { useBinanceStream } from './useBinanceStream';
import { OrderBookEntry } from '../types/trading';

export function useOrderBook(symbol: string) {
  const [orderBook, setOrderBook] = useState<{
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    lastUpdateId: number;
  }>({
    bids: [],
    asks: [],
    lastUpdateId: 0
  });

  const depthData = useBinanceStream(symbol, 'depth');

  useEffect(() => {
    if (!depthData.raw || !depthData.raw.b || !depthData.raw.a) return;

    // Process bids (buy orders) - sorted by price descending
    const bids = depthData.raw.b
      .slice(0, 10) // Take top 10 bids
      .map(([price, amount]: [string, string]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: parseFloat(price) * parseFloat(amount)
      }))
      .sort((a, b) => b.price - a.price);

    // Process asks (sell orders) - sorted by price ascending
    const asks = depthData.raw.a
      .slice(0, 10) // Take top 10 asks
      .map(([price, amount]: [string, string]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount),
        total: parseFloat(price) * parseFloat(amount)
      }))
      .sort((a, b) => a.price - b.price);

    setOrderBook({
      bids,
      asks,
      lastUpdateId: depthData.raw.lastUpdateId || 0
    });
  }, [depthData.raw]);

  const spread = useMemo(() => {
    if (orderBook.asks.length === 0 || orderBook.bids.length === 0) return null;
    const bestAsk = orderBook.asks[0].price;
    const bestBid = orderBook.bids[0].price;
    return {
      value: bestAsk - bestBid,
      percentage: ((bestAsk - bestBid) / bestAsk) * 100
    };
  }, [orderBook]);

  return {
    ...orderBook,
    spread,
    loading: depthData.isLoading
  };
}

export default useOrderBook;
