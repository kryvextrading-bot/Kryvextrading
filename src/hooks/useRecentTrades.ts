import { useState, useEffect } from 'react';
import { useBinanceStream } from './useBinanceStream';
import { Trade } from '../types/trading';

export function useRecentTrades(symbol: string, limit: number = 20) {
  const [trades, setTrades] = useState<Trade[]>([]);

  const streamData = useBinanceStream(symbol, 'trade');

  useEffect(() => {
    if (!streamData.raw) return;

    const newTrade: Trade = {
      id: streamData.raw.t?.toString() || Date.now().toString(),
      price: parseFloat(streamData.raw.p || '0'),
      amount: parseFloat(streamData.raw.q || '0'),
      total: parseFloat(streamData.raw.p || '0') * parseFloat(streamData.raw.q || '0'),
      side: streamData.raw.m ? 'sell' : 'buy', // m = true means seller is the market maker (sell)
      time: streamData.raw.T || Date.now()
    };

    setTrades(prevTrades => {
      // Add new trade to the beginning and keep only the most recent trades
      const updatedTrades = [newTrade, ...prevTrades];
      return updatedTrades.slice(0, limit);
    });
  }, [streamData.raw, limit]);

  // Also fetch initial recent trades when symbol changes
  useEffect(() => {
    if (!symbol) return;

    const fetchRecentTrades = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=${limit}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          const initialTrades: Trade[] = data.map((trade: any) => ({
            id: trade.id.toString(),
            price: parseFloat(trade.price),
            amount: parseFloat(trade.qty),
            total: parseFloat(trade.price) * parseFloat(trade.qty),
            side: trade.isBuyerMaker ? 'sell' : 'buy',
            time: trade.time
          }));

          setTrades(initialTrades);
        }
      } catch (error) {
        console.error('Failed to fetch recent trades:', error);
      }
    };

    fetchRecentTrades();
  }, [symbol, limit]);

  return {
    trades,
    loading: streamData.isLoading && trades.length === 0
  };
}

export default useRecentTrades;
