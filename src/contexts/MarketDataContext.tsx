import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';

// Supported coins with their symbols and API identifiers
const COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', binanceSymbol: 'BTCUSDT', alphaVantageSymbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', binanceSymbol: 'ETHUSDT', alphaVantageSymbol: 'ETH' },
  { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', coingeckoId: 'binancecoin', binanceSymbol: 'BNBUSDT', alphaVantageSymbol: 'BNB' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', binanceSymbol: 'SOLUSDT', alphaVantageSymbol: 'SOL' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', binanceSymbol: 'ADAUSDT', alphaVantageSymbol: 'ADA' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', coingeckoId: 'xrp', binanceSymbol: 'XRPUSDT', alphaVantageSymbol: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', coingeckoId: 'dogecoin', binanceSymbol: 'DOGEUSDT', alphaVantageSymbol: 'DOGE' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', coingeckoId: 'matic-network', binanceSymbol: 'MATICUSDT', alphaVantageSymbol: 'MATIC' },
];

// API Keys from environment
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
const TWELVE_DATA_KEY = import.meta.env.VITE_TWELVE_DATA_KEY;

console.log('🔑 Alpha Vantage Key available:', !!ALPHA_VANTAGE_KEY);
console.log('🔑 Twelve Data Key available:', !!TWELVE_DATA_KEY);

// Base mock prices (fallback)
const BASE_MOCK_PRICES: Record<string, number> = {
  'BTC': 67668.18,
  'ETH': 3492.89,
  'BNB': 603.60,
  'SOL': 176.88,
  'ADA': 0.60,
  'XRP': 0.62,
  'DOGE': 0.15,
  'MATIC': 0.85
};

// Generate realistic price variations
const generateMockPrices = (previousPrices?: Record<string, number>): Record<string, number> => {
  const prices: Record<string, number> = {};
  const now = Date.now();
  
  Object.entries(BASE_MOCK_PRICES).forEach(([symbol, basePrice]) => {
    const prevPrice = previousPrices?.[symbol] || basePrice;
    
    // Create realistic price movements
    const trend = Math.sin(now * 0.0001 + symbol.length) * 0.5;
    const randomWalk = (Math.random() - 0.5) * 0.01;
    const reversion = (basePrice - prevPrice) * 0.001;
    
    let newPrice = prevPrice * (1 + trend * 0.001 + randomWalk + reversion);
    
    // Ensure price stays within reasonable bounds
    const minPrice = basePrice * 0.9;
    const maxPrice = basePrice * 1.1;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
    
    prices[symbol] = Number(newPrice.toFixed(symbol === 'BTC' || symbol === 'ETH' ? 2 : 4));
  });
  
  return prices;
};

export type MarketPrices = {
  [symbol: string]: number;
};

export type PriceChanges = {
  [symbol: string]: number;
};

export interface PriceHistory {
  timestamp: number;
  prices: MarketPrices;
}

interface MarketDataContextType {
  prices: MarketPrices;
  changes: PriceChanges;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  usingMockData: boolean;
  refreshPrices: () => Promise<void>;
  getPriceHistory: (symbol: string, minutes?: number) => { timestamp: number; price: number }[];
  priceHistory: PriceHistory[];
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const useMarketData = () => {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used within a MarketDataProvider');
  return ctx;
};

export const MarketDataProvider = ({ children }: { children: ReactNode }) => {
  const [prices, setPrices] = useState<MarketPrices>(BASE_MOCK_PRICES);
  const [changes, setChanges] = useState<PriceChanges>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [apiSource, setApiSource] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  // Get price history for a specific symbol
  const getPriceHistory = useCallback((symbol: string, minutes: number = 60) => {
    const now = Date.now();
    const cutoff = now - minutes * 60 * 1000;
    
    return priceHistory
      .filter(h => h.timestamp > cutoff && h.prices[symbol] !== undefined)
      .map(h => ({
        timestamp: h.timestamp,
        price: h.prices[symbol]
      }));
  }, [priceHistory]);

  // Update price history
  const updatePriceHistory = useCallback((newPrices: MarketPrices) => {
    setPriceHistory(prev => {
      const now = Date.now();
      const newHistory = [...prev, { timestamp: now, prices: newPrices }];
      
      // Keep last 24 hours of data
      const dayAgo = now - 24 * 60 * 60 * 1000;
      return newHistory.filter(h => h.timestamp > dayAgo);
    });
  }, []);

  // Calculate 24h changes
  const calculate24hChanges = useCallback((currentPrices: MarketPrices) => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const oldHistory = priceHistory.find(h => h.timestamp <= dayAgo);
    
    if (oldHistory) {
      const newChanges: PriceChanges = {};
      Object.keys(currentPrices).forEach(symbol => {
        const oldPrice = oldHistory.prices[symbol];
        if (oldPrice) {
          const change = ((currentPrices[symbol] - oldPrice) / oldPrice) * 100;
          newChanges[symbol] = Number(change.toFixed(2));
        }
      });
      setChanges(newChanges);
    }
  }, [priceHistory]);

  // Fetch from CoinGecko (free, no API key needed)
  const fetchFromCoinGecko = useCallback(async () => {
    try {
      console.log('🔄 Fetching from CoinGecko...');
      setApiSource('CoinGecko');
      
      const ids = COINS.map(c => c.coingeckoId).join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10 second timeout
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; TradingApp/1.0)'
        }
      });

      if (!response.ok) {
        console.log(`⚠️ CoinGecko HTTP error: ${response.status} ${response.statusText}`);
        // If rate limited, don't retry immediately
        if (response.status === 429) {
          console.log('🚫 CoinGecko rate limited, skipping to next provider...');
          return null;
        }
        return null;
      }

      const data = await response.json();
      console.log('📊 CoinGecko response:', data);
      
      const newPrices: MarketPrices = {};
      const newChanges: PriceChanges = {};
      
      COINS.forEach(coin => {
        const coinData = data[coin.coingeckoId];
        if (coinData && coinData.usd) {
          newPrices[coin.symbol] = coinData.usd;
          if (coinData.usd_24h_change) {
            newChanges[coin.symbol] = Number(coinData.usd_24h_change.toFixed(2));
          }
        }
      });
      
      if (Object.keys(newPrices).length > 0) {
        setChanges(newChanges);
        console.log('✅ CoinGecko prices fetched:', newPrices);
        return newPrices;
      }
      
      console.log('⚠️ CoinGecko: No valid prices received');
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('CoinGecko request aborted');
        return null;
      }
      console.error('❌ CoinGecko error:', error);
      return null;
    }
  }, [COINS, setApiSource, setChanges]);

  // Fetch from Twelve Data
  const fetchFromTwelveData = useCallback(async () => {
    if (!TWELVE_DATA_KEY) {
      console.log('❌ Twelve Data API key missing');
      return null;
    }
    
    try {
      console.log('🔄 Fetching from Twelve Data...');
      setApiSource('Twelve Data');
      
      const symbols = COINS.map(c => `${c.symbol}/USD`).join(',');
      const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${TWELVE_DATA_KEY}`;
      console.log('📡 Twelve Data URL:', url.replace(TWELVE_DATA_KEY, 'HIDDEN'));
      
      const response = await fetch(url, {
        signal: abortControllerRef.current?.signal,
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Twelve Data HTTP error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log('📊 Twelve Data response:', data);
      
      const newPrices: MarketPrices = {};
      
      COINS.forEach(coin => {
        const key = `${coin.symbol}/USD`;
        if (data[key] && data[key].price) {
          newPrices[coin.symbol] = parseFloat(data[key].price);
        }
      });
      
      if (Object.keys(newPrices).length > 0) {
        console.log('✅ Twelve Data prices fetched:', newPrices);
        return newPrices;
      }
      
      console.log('⚠️ Twelve Data: No valid prices received');
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Twelve Data request aborted');
        return null;
      }
      console.error('❌ Twelve Data error:', error);
      return null;
    }
  }, []);

  // Fetch from Alpha Vantage
  const fetchFromAlphaVantage = useCallback(async () => {
    if (!ALPHA_VANTAGE_KEY) {
      console.log('❌ Alpha Vantage API key missing');
      return null;
    }
    
    try {
      console.log('🔄 Fetching from Alpha Vantage...');
      setApiSource('Alpha Vantage');
      
      const newPrices: MarketPrices = {};
      
      // Alpha Vantage has rate limits, so we need to fetch one by one
      for (const coin of COINS) {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin.alphaVantageSymbol}&to_currency=USD&apikey=${ALPHA_VANTAGE_KEY}`;
        
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal,
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          const rate = data['Realtime Currency Exchange Rate'];
          
          if (rate && rate['5. Exchange Rate']) {
            newPrices[coin.symbol] = parseFloat(rate['5. Exchange Rate']);
            console.log(`✅ ${coin.symbol}: $${newPrices[coin.symbol]}`);
          } else {
            console.log(`⚠️ Alpha Vantage: No rate data for ${coin.symbol}`);
            newPrices[coin.symbol] = BASE_MOCK_PRICES[coin.symbol];
          }
        } else {
          console.log(`⚠️ Alpha Vantage HTTP error for ${coin.symbol}: ${response.status}`);
          newPrices[coin.symbol] = BASE_MOCK_PRICES[coin.symbol];
        }
        
        // Small delay to avoid rate limiting (5 calls per minute for free tier)
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds
      }
      
      if (Object.keys(newPrices).length > 0) {
        console.log('✅ Alpha Vantage prices fetched:', newPrices);
        return newPrices;
      }
      
      console.log('⚠️ Alpha Vantage: No valid prices received');
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Alpha Vantage request aborted');
        return null;
      }
      console.error('❌ Alpha Vantage error:', error);
      return null;
    }
  }, []);

  // Main fetch function with proper error handling
  const fetchPrices = useCallback(async (isRetry = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      let newPrices: MarketPrices | null = null;
      
      // Try CoinGecko first (free, no rate limits)
      newPrices = await fetchFromCoinGecko();
      if (newPrices) {
        setUsingMockData(false);
        setApiSource('CoinGecko');
      }
      
      // If CoinGecko fails, try Twelve Data
      if (!newPrices && TWELVE_DATA_KEY && retryCountRef.current < MAX_RETRIES) {
        newPrices = await fetchFromTwelveData();
        if (newPrices) {
          setUsingMockData(false);
          setApiSource('Twelve Data');
        }
      }
      
      // If both fail, try Alpha Vantage
      if (!newPrices && ALPHA_VANTAGE_KEY && retryCountRef.current < MAX_RETRIES) {
        newPrices = await fetchFromAlphaVantage();
        if (newPrices) {
          setUsingMockData(false);
          setApiSource('Alpha Vantage');
        }
      }
      
      // If all APIs fail, use mock data
      if (!newPrices) {
        console.log('⚠️ All APIs failed, using mock data');
        newPrices = generateMockPrices(prices);
        setUsingMockData(true);
        setApiSource('Mock Data');
        
        if (retryCountRef.current >= MAX_RETRIES) {
          setError('Unable to connect to price APIs. Using simulated data.');
        } else {
          retryCountRef.current++;
        }
      } else {
        retryCountRef.current = 0; // Reset retry count on success
      }

      // Update state with new prices
      setPrices(newPrices);
      setLastUpdated(new Date());
      updatePriceHistory(newPrices);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }
      console.error('Failed to fetch prices:', error);
      setError('Failed to fetch market data');
      
      // Fallback to mock data on error
      const mockPrices = generateMockPrices(prices);
      setPrices(mockPrices);
      setUsingMockData(true);
      setApiSource('Mock Data');
      updatePriceHistory(mockPrices);
      
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromCoinGecko, fetchFromTwelveData, fetchFromAlphaVantage, prices, updatePriceHistory]);

  // Initialize with mock data first, then try to fetch real data
  useEffect(() => {
    // Set initial mock data immediately
    const initialPrices = generateMockPrices();
    setPrices(initialPrices);
    setLastUpdated(new Date());
    setUsingMockData(true);
    setError('Using mock data - API unavailable');
    setIsLoading(false);
    updatePriceHistory(initialPrices);
    
    // Try to fetch real data after a short delay
    const fetchTimer = setTimeout(() => {
      fetchPrices();
    }, 1000);
    
    // Set up periodic updates
    intervalRef.current = setInterval(() => {
      fetchPrices(true);
    }, 30000); // Update every 30 seconds

    return () => {
      clearTimeout(fetchTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - only run once

  const refreshPrices = useCallback(async () => {
    retryCountRef.current = 0; // Reset retry count
    await fetchPrices(true);
  }, [fetchPrices]);

  return (
    <MarketDataContext.Provider
      value={{
        prices,
        changes,
        lastUpdated,
        isLoading,
        error,
        usingMockData,
        refreshPrices,
        getPriceHistory,
        priceHistory
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};