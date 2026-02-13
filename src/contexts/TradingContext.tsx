import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AssetRow } from '../components/AssetTable';

interface TradingContextType {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  search: string;
  setSearch: (s: string) => void;
  assets: AssetRow[];
  setAssets: (a: AssetRow[]) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export function TradingProvider({ children }: { children: ReactNode }) {
  const [selectedTab, setSelectedTab] = useState('Crypto');
  const [search, setSearch] = useState('');
  const [assets, setAssets] = useState<AssetRow[]>([]);

  return (
    <TradingContext.Provider value={{ selectedTab, setSelectedTab, search, setSearch, assets, setAssets }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTrading must be used within TradingProvider');
  return ctx;
} 