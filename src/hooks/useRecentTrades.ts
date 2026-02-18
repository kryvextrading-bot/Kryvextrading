import { useState, useEffect } from 'react';
import { useBinanceStream } from './useBinanceStream';
import { Trade } from '../types/trading';

// Map common stock symbols to Binance symbols
const symbolMap: Record<string, string> = {
  'BTCUSDT': 'BTCUSDT',
  'ETHUSDT': 'ETHUSDT',
  'TSLA': 'BTCUSDT', // Map TSLA to BTCUSDT for demo
  'AAPL': 'ETHUSDT', // Map AAPL to ETHUSDT for demo
  'GOOGL': 'BNBUSDT', // Map GOOGL to BNBUSDT for demo
  'MSFT': 'SOLUSDT', // Map MSFT to SOLUSDT for demo
  'AMZN': 'ADAUSDT', // Map AMZN to ADAUSDT for demo
  'META': 'XRPUSDT', // Map META to XRPUSDT for demo
  'NVDA': 'DOGEUSDT', // Map NVDA to DOGEUSDT for demo
  'NFLX': 'DOTUSDT', // Map NFLX to DOTUSDT for demo
  'XAUUSDT': 'XAUUSDT', // Gold is available
  'EURUSDT': 'EURUSDT', // EUR is available
  'GBPUSDT': 'GBPUSDT', // GBP is available
  'JPYUSDT': 'JPYUSDT', // JPY is available
  'USDUSDT': 'BTCUSDT', // Map USD to BTC
  'default': 'BTCUSDT'
};

// Mock data for non-Binance symbols
const generateMockTrades = (symbol: string, count: number = 20): Trade[] => {
  const basePrice = symbol.includes('BTC') ? 67000 : 
                  symbol.includes('ETH') ? 3500 :
                  symbol.includes('BNB') ? 700 :
                  symbol.includes('SOL') ? 150 :
                  symbol.includes('XAU') ? 2050 :
                  symbol.includes('EUR') ? 1.10 :
                  symbol.includes('GBP') ? 1.28 :
                  symbol.includes('JPY') ? 154 :
                  1000; // Default price

  return Array.from({ length: count }, (_, i) => {
    const priceVariation = (Math.random() - 0.5) * 0.02; // +/- 1%
    const price = basePrice * (1 + priceVariation);
    const amount = Math.random() * 10 + 0.1;
    const isBuy = Math.random() > 0.5;
    const time = Date.now() - (i * 1000); // 1 second apart

    return {
      id: `mock_${symbol}_${i}`,
      price,
      amount,
      total: price * amount,
      side: isBuy ? 'buy' : 'sell',
      time
    };
  });
};

export function useRecentTrades(symbol: string, limit: number = 20) {
  const [trades, setTrades] = useState<Trade[]>([]);

  // Map symbol to Binance symbol
  const binanceSymbol = symbolMap[symbol] || symbolMap.default;
  const streamData = useBinanceStream(binanceSymbol, 'trade');

  // Handle real-time stream data
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

  // Fetch initial recent trades when symbol changes
  useEffect(() => {
    if (!symbol) return;

    const fetchRecentTrades = async () => {
      try {
        // For non-Binance symbols or CORS issues, use mock data
        if (!symbol.includes('USDT') || symbol === 'TSLA' || symbol === 'AAPL' || symbol === 'GOOGL' || symbol === 'MSFT' || symbol === 'AMZN' || symbol === 'META' || symbol === 'NVDA' || symbol === 'NFLX') {
          // Use mock data for stocks and non-USDT symbols
          const mockTrades = generateMockTrades(symbol, limit);
          setTrades(mockTrades);
          return;
        }

        // Try to fetch from Binance API for actual crypto symbols
        const response = await fetch(
          `https://api.binance.com/api/v3/trades?symbol=${binanceSymbol}&limit=${limit}`
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
        } else {
          // Fallback to mock data if API fails
          const mockTrades = generateMockTrades(symbol, limit);
          setTrades(mockTrades);
        }
      } catch (error) {
        console.log('Using mock data due to CORS or API error:', error);
        // Fallback to mock data
        const mockTrades = generateMockTrades(symbol, limit);
        setTrades(mockTrades);
      }
    };

    fetchRecentTrades();
  }, [symbol, limit, binanceSymbol]);

  return {
    trades,
    loading: streamData.isLoading && trades.length === 0
  };
}

export default useRecentTrades;
