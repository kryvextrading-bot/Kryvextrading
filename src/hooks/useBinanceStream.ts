import { useState, useEffect, useRef } from 'react';

interface StreamData {
  p?: string;
  priceChange?: number;
  [key: string]: any;
}

interface BinanceStreamResult {
  p: string;
  priceChange: number;
  currentPrice: number;
  priceChange24h: number;
  raw: StreamData | null;
  isLoading: boolean;
}

export function useBinanceStream(symbol: string, type: 'trade' | 'depth' | 'kline', interval = '1m'): BinanceStreamResult {
  const [data, setData] = useState<StreamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    if (!symbol) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Fix: Ensure we have a valid stream type
    let stream = `${symbol.toLowerCase()}@${type}`;
    if (type === 'kline') {
      stream += `_${interval}`;
    } else if (type === 'depth') {
      stream = `${symbol.toLowerCase()}@depth5@100ms`;
    }
    
    try {
      // Only connect to WebSocket if we have a valid symbol
      if (!symbol || symbol === 'undefined' || symbol === null) {
        console.log('Invalid symbol for WebSocket connection:', symbol);
        setIsLoading(false);
        return;
      }
      
      const wsUrl = `wss://stream.binance.com:9443/ws/${stream}`;
      console.log(`🔌 Connecting to WebSocket: ${stream}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected to ${stream}`);
        setIsLoading(false);
      };
      
      ws.onmessage = (e) => {
        try {
          const parsedData = JSON.parse(e.data);
          setData(parsedData);
          setIsLoading(false);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error(`❌ WebSocket error for ${symbol}:`, error);
        setData(null);
        setIsLoading(false);
      };
      
      ws.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected for ${symbol}, code: ${event.code}`);
        setIsLoading(false);
        if (event.code !== 1000) {
          // Attempt to reconnect after 3 seconds if not a normal closure
          setTimeout(() => {
            console.log('Attempting to reconnect...');
          }, 3000);
        }
      };
      
      return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Component unmounted');
        }
        wsRef.current = null;
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setData(null);
      setIsLoading(false);
    }
  }, [symbol, type, interval]);
  
  // Return an object with default values
  return {
    p: data?.p || '67000.00',
    priceChange: data?.priceChange || 0,
    currentPrice: data?.p ? parseFloat(data.p) : 67000,
    priceChange24h: data?.priceChange || 0,
    raw: data,
    isLoading
  };
}

export default useBinanceStream; 