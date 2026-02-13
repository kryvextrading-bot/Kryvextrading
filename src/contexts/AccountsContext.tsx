import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getBinanceBalances } from '@/services/binanceApi';

export type AccountMode = 'mock' | 'real';
export type Exchange = 'Binance' | 'Coinbase' | 'Kraken' | 'MockExchange';

export interface ExchangeAccount {
  id: string;
  name: string;
  exchange: Exchange;
  mode: AccountMode;
  apiKey?: string;
  apiSecret?: string;
  balances: { [symbol: string]: number };
  portfolio: { symbol: string; balance: number }[];
}

interface AccountsContextType {
  accounts: ExchangeAccount[];
  addAccount: (account: Omit<ExchangeAccount, 'id'>) => void;
  removeAccount: (id: string) => void;
  aggregateBalances: () => { [symbol: string]: number };
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const useAccountsContext = () => {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccountsContext must be used within an AccountsProvider');
  return ctx;
};

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<ExchangeAccount[]>([]);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const fetchAndUpdateBinance = async (acc: ExchangeAccount) => {
    if (!acc.apiKey || !acc.apiSecret) return;
    setLoadingIds(ids => [...ids, acc.id]);
    try {
      const balances = await getBinanceBalances(acc.apiKey, acc.apiSecret);
      setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, balances } : a));
    } catch (e) {
      // Optionally handle error
    } finally {
      setLoadingIds(ids => ids.filter(id => id !== acc.id));
    }
  };

  const addAccount: AccountsContextType['addAccount'] = (account) => {
    const id = generateId();
    const newAcc: ExchangeAccount = {
      ...account,
      id,
      balances: account.mode === 'mock' ? generateMockBalances() : {},
      portfolio: account.mode === 'mock' ? generateMockPortfolio() : [],
    };
    setAccounts(prev => [newAcc, ...prev]);
    if (account.mode === 'real' && account.exchange === 'Binance' && account.apiKey && account.apiSecret) {
      fetchAndUpdateBinance({ ...newAcc, apiKey: account.apiKey, apiSecret: account.apiSecret });
    }
  };

  const removeAccount: AccountsContextType['removeAccount'] = (id) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const aggregateBalances = () => {
    const agg: { [symbol: string]: number } = {};
    accounts.forEach(acc => {
      Object.entries(acc.balances).forEach(([symbol, bal]) => {
        agg[symbol] = (agg[symbol] || 0) + bal;
      });
    });
    return agg;
  };

  // Periodically refresh real Binance accounts
  React.useEffect(() => {
    const interval = setInterval(() => {
      accounts.forEach(acc => {
        if (acc.mode === 'real' && acc.exchange === 'Binance' && acc.apiKey && acc.apiSecret) {
          fetchAndUpdateBinance(acc);
        }
      });
    }, 60000); // every 60s
    return () => clearInterval(interval);
  }, [accounts]);

  return (
    <AccountsContext.Provider value={{ accounts, addAccount, removeAccount, aggregateBalances }}>
      {children}
    </AccountsContext.Provider>
  );
};

// Helpers for mock/demo accounts
function generateMockBalances() {
  return {
    USDT: Math.floor(Math.random() * 10000 + 1000),
    BTC: Math.random() * 2,
    ETH: Math.random() * 10,
    BNB: Math.random() * 20,
    SOL: Math.random() * 50,
    ADA: Math.random() * 1000,
    XRP: Math.random() * 2000,
    DOGE: Math.random() * 5000,
    MATIC: Math.random() * 3000,
  };
}
function generateMockPortfolio() {
  return [
    { symbol: 'BTC', balance: Math.random() * 2 },
    { symbol: 'ETH', balance: Math.random() * 10 },
    { symbol: 'BNB', balance: Math.random() * 20 },
  ];
} 