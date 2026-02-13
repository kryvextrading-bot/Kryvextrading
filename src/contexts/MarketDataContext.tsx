import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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

export type MarketPrices = {
  [symbol: string]: number;
};

interface MarketDataContextType {
  prices: MarketPrices;
  lastUpdated: Date | null;
  isLoading: boolean;
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

  const fetchPrices = async () => {
    setIsLoading(true);
    try {
      const ids = COINS.map((c) => c.id).join(',');
      // Use backend proxy to avoid CORS and rate limiting issues
      const url = `http://localhost:3001/api/coingecko/prices?ids=${ids}&vs_currencies=usd`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      const newPrices: MarketPrices = {};
      COINS.forEach((coin) => {
        newPrices[coin.symbol] = data[coin.id]?.usd ?? 0;
      });
      setPrices(newPrices);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Failed to fetch prices:', e);
      // Set fallback mock prices to prevent UI issues
      const fallbackPrices: MarketPrices = {
        'BTC': 45000,
        'ETH': 2500,
        'BNB': 320,
        'SOL': 120,
        'ADA': 0.55,
        'XRP': 0.65,
        'DOGE': 0.08,
        'MATIC': 0.85
      };
      setPrices(fallbackPrices);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MarketDataContext.Provider value={{ prices, lastUpdated, isLoading }}>
      {children}
    </MarketDataContext.Provider>
  );
}; 