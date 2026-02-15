import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';

const COINS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'binancecoin', symbol: 'BNB' },
  { id: 'solana', symbol: 'SOL' },
  { id: 'cardano', symbol: 'ADA' },
  { id: 'ripple', symbol: 'XRP' },
  { id: 'dogecoin', symbol: 'DOGE' },
  { id: 'matic-network', symbol: 'MATIC' },
];

const PROXY_API = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api/crypto/prices' // Local proxy
  : '/api/crypto/prices'; // Production proxy

// Mock price data for when API is unavailable
const BASE_MOCK_PRICES: MarketPrices = {
  'BTC': 67000.00,
  'ETH': 3500.00,
  'BNB': 698.45,
  'SOL': 146.82,
  'ADA': 0.58,
  'XRP': 0.62,
  'DOGE': 0.08,
  'MATIC': 0.45
};

// Generate realistic price variations
const generateMockPrices = (): MarketPrices => {
  const prices: MarketPrices = {};
  Object.entries(BASE_MOCK_PRICES).forEach(([symbol, basePrice]) => {
    // Add small random variation (-2% to +2%)
    const variation = (Math.random() - 0.5) * 0.04;
    prices[symbol] = basePrice * (1 + variation);
  });
  return prices;
};

export type MarketPrices = {
  [symbol: string]: number;
};

interface MarketDataContextType {
  prices: MarketPrices;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  refreshPrices: () => Promise<void>;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export const useMarketData = () => {
  const ctx = useContext(MarketDataContext);
  if (!ctx) throw new Error('useMarketData must be used within a MarketDataProvider');
  return ctx;
};

export const MarketDataProvider = ({ children }: { children: ReactNode }) => {
  const [prices, setPrices] = useState<MarketPrices>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  const fetchPrices = useCallback(async (retry = false) => {
    // Cancel previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const ids = COINS.map((c) => c.id).join(',');
      
      const response = await fetch(
        `${PROXY_API}?ids=${ids}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const newPrices: MarketPrices = {};
      COINS.forEach((coin) => {
        newPrices[coin.symbol] = data[coin.id]?.usd ?? BASE_MOCK_PRICES[coin.symbol];
      });
      
      setPrices(newPrices);
      setLastUpdated(new Date());
      setError(null);

      // Reset retry count on success
      retryCountRef.current = 0;

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error('Failed to fetch prices:', error);

      // Use mock data immediately instead of retrying
      console.log('Using mock price data due to API unavailability');
      const mockPrices = generateMockPrices();
      setPrices(mockPrices);
      setLastUpdated(new Date());
      setError('Using mock data - API unavailable');
      setUsingMockData(true);

    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshPrices = useCallback(() => {
    retryCountRef.current = 0;
    return fetchPrices(true);
  }, [fetchPrices]);

  useEffect(() => {
    // Start with mock data immediately to avoid any API calls
    const mockPrices = generateMockPrices();
    setPrices(mockPrices);
    setLastUpdated(new Date());
    setError('Using mock data - API unavailable');
    setUsingMockData(true);
    setIsLoading(false);

    // Update mock prices every 30 seconds for live simulation
    const interval = setInterval(() => {
      const newMockPrices = generateMockPrices();
      setPrices(newMockPrices);
      setLastUpdated(new Date());
    }, 30000);

    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <MarketDataContext.Provider value={{ prices, lastUpdated, isLoading, error, refreshPrices }}>
      {children}
    </MarketDataContext.Provider>
  );
}; 