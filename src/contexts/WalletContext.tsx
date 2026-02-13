import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useUserSettings } from './UserSettingsContext';
import { useMarketData } from './MarketDataContext';
import supabaseApi from '@/services/supabase-api';
import { Database } from '@/lib/supabase';

// Enhanced Transaction type
export type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade' | 'Arbitrage' | 'Staking' | 'Swap' | 'Options';
  asset: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'In Progress' | 'Win' | 'Loss' | 'Closed';
  date: string;
  details?: any;
  pnl?: number;
  category?: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
};

// Enhanced Asset type
export type Asset = {
  symbol: string;
  name: string;
  balance: number;
  value: number;
  price?: number;
  change24h?: number;
};

// Order types
export type SpotOrder = {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled';
  timestamp: string;
};

export type FuturesPosition = {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  leverage: number;
  status: 'open' | 'closed';
};

export type OptionContract = {
  id: string;
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  status: 'active' | 'expired' | 'exercised';
  pnl?: number;
};

export type ArbitrageContract = {
  id: string;
  productId: string;
  productLabel: string;
  amount: number;
  duration: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'failed';
  pnl?: number;
  dailyRate: number;
};

export type StakingPosition = {
  id: string;
  asset: string;
  amount: number;
  apy: number;
  startTime: string;
  rewards: number;
  status: 'active' | 'completed';
};

// Trade execution types
export type TradeExecution = {
  type: 'spot' | 'futures' | 'options';
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  leverage?: number;
  strike?: number;
  expiration?: string;
};

export type ArbitrageExecution = {
  product: any;
  amount: number;
  duration: number;
};

export type StakingExecution = {
  asset: string;
  amount: number;
  duration: number;
  apy: number;
};

export type TransactionFilters = {
  type?: string;
  status?: string;
  asset?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
};

interface WalletContextType {
  // Core balances
  balances: Record<string, number>;
  
  // Portfolio tracking
  portfolio: Asset[];
  totalValue: number;
  valueHistory: { timestamp: number; value: number }[];
  
  // Unified transaction system
  transactions: Transaction[];
  
  // Unified order system (all markets)
  orders: {
    spot: SpotOrder[];
    futures: FuturesPosition[];
    options: OptionContract[];
    arbitrage: ArbitrageContract[];
    staking: StakingPosition[];
  };
  
  // Legacy compatibility
  balance: number;
  setBalance: (amt: number) => void;
  
  // Unified methods
  updateBalance: (asset: string, amount: number, operation: 'add' | 'subtract' | 'set') => void;
  executeTrade: (trade: TradeExecution) => Promise<Transaction>;
  executeArbitrage: (arbitrage: ArbitrageExecution) => Promise<Transaction>;
  executeStaking: (staking: StakingExecution) => Promise<Transaction>;
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  getTransactionHistory: (filters?: TransactionFilters) => Transaction[];
  getTotalPortfolioValue: (currency?: string) => number;
  updatePortfolio: (assets: Asset[]) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notificationsEnabled } = useUserSettings();
  const { prices } = useMarketData();

  // Initialize balances
  const getInitialBalances = (): Record<string, number> => {
    const stored = localStorage.getItem('wallet_balances');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return {
      USDT: 0,
      BTC: 0,
      ETH: 0,
      SOL: 0,
      BNB: 0,
      ADA: 0,
      XRP: 0,
      DOT: 0
    };
  };

  // Initialize orders
  const getInitialOrders = () => ({
    spot: [],
    futures: [],
    options: [],
    arbitrage: [],
    staking: []
  });

  // State
  const [balances, setBalances] = useState<Record<string, number>>(getInitialBalances);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState(getInitialOrders);
  
  // Portfolio state
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [valueHistory, setValueHistory] = useState<{ timestamp: number; value: number }[]>([]);

  // Legacy compatibility
  const balance = balances.USDT || 0;
  const setBalance = (amt: number) => updateBalance('USDT', amt, 'set');

  // Core balance update method
  const updateBalance = (asset: string, amount: number, operation: 'add' | 'subtract' | 'set') => {
    setBalances(prev => {
      const current = prev[asset] || 0;
      let newValue: number;
      
      switch (operation) {
        case 'add':
          newValue = current + amount;
          break;
        case 'subtract':
          newValue = Math.max(0, current - amount);
          break;
        case 'set':
          newValue = Math.max(0, amount);
          break;
        default:
          return prev;
      }
      
      const updated = { ...prev, [asset]: newValue };
      localStorage.setItem('wallet_balances', JSON.stringify(updated));
      return updated;
    });
  };

  // Execute trade
  const executeTrade = async (trade: TradeExecution): Promise<Transaction> => {
    const transactionId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [baseAsset, quoteAsset] = trade.pair.split('/');
    
    // Calculate cost/proceeds
    const price = trade.price || prices[baseAsset] || 0;
    const cost = trade.amount * price;
    
    // Check balance
    if (trade.side === 'buy' && balances[quoteAsset] < cost) {
      throw new Error(`Insufficient ${quoteAsset} balance`);
    }
    if (trade.side === 'sell' && balances[baseAsset] < trade.amount) {
      throw new Error(`Insufficient ${baseAsset} balance`);
    }
    
    // Update balances
    if (trade.side === 'buy') {
      updateBalance(quoteAsset, cost, 'subtract');
      updateBalance(baseAsset, trade.amount, 'add');
    } else {
      updateBalance(baseAsset, trade.amount, 'subtract');
      updateBalance(quoteAsset, cost, 'add');
    }
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      type: 'Trade',
      asset: trade.pair,
      amount: trade.amount,
      status: 'Completed',
      date: new Date().toISOString(),
      details: {
        side: trade.side,
        price,
        type: trade.type,
        pair: trade.pair
      },
      category: trade.type
    };
    
    addTransaction(transaction);
    
    // Add to orders if needed
    if (trade.type === 'spot') {
      const order: SpotOrder = {
        id: transactionId,
        pair: trade.pair,
        type: trade.side,
        amount: trade.amount,
        price,
        status: 'filled',
        timestamp: new Date().toISOString()
      };
      
      setOrders(prev => ({
        ...prev,
        spot: [...prev.spot, order]
      }));
    }
    
    return transaction;
  };

  // Execute arbitrage
  const executeArbitrage = async (arbitrage: ArbitrageExecution): Promise<Transaction> => {
    const transactionId = `arb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check balance
    if (balances.USDT < arbitrage.amount) {
      throw new Error('Insufficient USDT balance');
    }
    
    // Update balance
    updateBalance('USDT', arbitrage.amount, 'subtract');
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      type: 'Arbitrage',
      asset: 'USDT',
      amount: arbitrage.amount,
      status: 'In Progress',
      date: new Date().toISOString(),
      details: {
        product: arbitrage.product,
        duration: arbitrage.duration,
        startTime: new Date().toISOString()
      },
      category: 'arbitrage'
    };
    
    addTransaction(transaction);
    
    // Add to arbitrage contracts
    const contract: ArbitrageContract = {
      id: transactionId,
      productId: arbitrage.product.id,
      productLabel: arbitrage.product.label,
      amount: arbitrage.amount,
      duration: arbitrage.duration,
      startTime: new Date().toISOString(),
      status: 'active',
      dailyRate: 0.01 // Default 1% daily
    };
    
    setOrders(prev => ({
      ...prev,
      arbitrage: [...prev.arbitrage, contract]
    }));
    
    return transaction;
  };

  // Execute staking
  const executeStaking = async (staking: StakingExecution): Promise<Transaction> => {
    const transactionId = `stake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check balance
    if (balances[staking.asset] < staking.amount) {
      throw new Error(`Insufficient ${staking.asset} balance`);
    }
    
    // Update balance
    updateBalance(staking.asset, staking.amount, 'subtract');
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      type: 'Staking',
      asset: staking.asset,
      amount: staking.amount,
      status: 'In Progress',
      date: new Date().toISOString(),
      details: {
        duration: staking.duration,
        apy: staking.apy,
        startTime: new Date().toISOString()
      },
      category: 'staking'
    };
    
    addTransaction(transaction);
    
    // Add to staking positions
    const position: StakingPosition = {
      id: transactionId,
      asset: staking.asset,
      amount: staking.amount,
      apy: staking.apy,
      startTime: new Date().toISOString(),
      rewards: 0,
      status: 'active'
    };
    
    setOrders(prev => ({
      ...prev,
      staking: [...prev.staking, position]
    }));
    
    return transaction;
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => {
      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      const updated = [tx, ...prev].filter(t => new Date(t.date).getTime() >= sevenDaysAgo);
      localStorage.setItem('wallet_transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem('wallet_transactions', JSON.stringify(updated));
      return updated;
    });
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('wallet_transactions', JSON.stringify(updated));
      return updated;
    });
  };

  // Get transaction history with filters
  const getTransactionHistory = (filters?: TransactionFilters): Transaction[] => {
    let filtered = [...transactions];
    
    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters.status) {
        filtered = filtered.filter(t => t.status === filters.status);
      }
      if (filters.asset) {
        filtered = filtered.filter(t => t.asset === filters.asset);
      }
      if (filters.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo));
      }
    }
    
    return filtered;
  };

  // Get total portfolio value
  const getTotalPortfolioValue = (currency?: string): number => {
    if (currency === 'USDT' || !currency) {
      return totalValue;
    }
    // Convert to other currencies if needed
    const conversionRate = prices[currency] || 1;
    return totalValue / conversionRate;
  };

  // Update portfolio
  const updatePortfolio = (assets: Asset[]) => {
    setPortfolio(assets);
    localStorage.setItem('wallet_portfolio', JSON.stringify(assets));
  };

  // Initialize portfolio from balances
  const initializePortfolio = () => {
    const assets: Asset[] = Object.entries(balances).map(([symbol, balance]) => ({
      symbol,
      name: getAssetName(symbol),
      balance,
      value: symbol === 'USDT' ? balance : (balance * (prices[symbol] || 0)),
      price: prices[symbol],
      change24h: 0 // Would come from market data
    }));
    updatePortfolio(assets);
  };

  // Helper function to get asset name
  const getAssetName = (symbol: string): string => {
    const names: Record<string, string> = {
      USDT: 'Tether',
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      XRP: 'Ripple',
      DOT: 'Polkadot'
    };
    return names[symbol] || symbol;
  };

  // Load initial data
  useEffect(() => {
    // Load transactions from localStorage
    const storedTransactions = localStorage.getItem('wallet_transactions');
    if (storedTransactions) {
      try {
        const parsed = JSON.parse(storedTransactions);
        setTransactions(parsed);
      } catch (e) {
        console.error('Failed to load transactions:', e);
      }
    }

    // Load orders from localStorage
    const storedOrders = localStorage.getItem('wallet_orders');
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        setOrders(parsed);
      } catch (e) {
        console.error('Failed to load orders:', e);
      }
    }

    // Initialize portfolio from current balances
    initializePortfolio();
  }, [notificationsEnabled]);

  // Auto-update 'In Progress' and 'Completed' records
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prevTxs => {
        let updated = false;
        const newTxs = prevTxs.map(tx => {
          // Handle trades that are in progress (countdown running)
          if (tx.status === 'In Progress') {
            let duration = 0;
            if (tx.type === 'Trade' && tx.details?.time) duration = tx.details.time;
            if (tx.type === 'Arbitrage' && tx.details?.duration) duration = tx.details.duration;
            if (tx.type === 'Staking' && tx.details?.duration) duration = tx.details.duration;
            if (!duration) return tx;
            const start = new Date(tx.date).getTime();
            const end = start + duration * 1000;
            
            if (Date.now() >= end) {
              // Timer expired, move to Completed state
              updated = true;
              // Remove demo notification logic
              
              // Remove mock profit calculation
              const pnl = 0;
              
              // Remove demo notification
              
              return { 
                ...tx, 
                status: 'Completed' as const,
                pnl,
                details: {
                  ...tx.details,
                  result: 'Completed',
                  actualProfit: 0,
                  completedAt: new Date().toISOString()
                }
              };
            }
          }
          
          // Handle completed trades (move to Closed after delay)
          else if (tx.status === 'Completed') {
            const completedAt = tx.details?.completedAt ? new Date(tx.details.completedAt).getTime() : 0;
            const delayToClose = 5000; // 5 seconds delay before moving to Closed
            
            if (Date.now() >= completedAt + delayToClose) {
              updated = true;
              return { ...tx, status: 'Closed' as const };
            }
          }
          
          return tx;
        });
        
        if (updated) {
          setTransactions(newTxs);
        }
        return newTxs;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  // Recalculate total value and update history
  useEffect(() => {
    const value = portfolio.reduce((sum, a) => {
      if (a.symbol === 'USDT') return sum + a.balance; // USDT is always $1
      const price = prices[a.symbol] ?? 0;
      return sum + a.balance * price;
    }, 0);
    setTotalValue(value);
    setValueHistory(prev => {
      if (prev.length > 0 && Math.abs(prev[prev.length - 1].value - value) < 0.01) return prev;
      const capped = prev.length > 99 ? prev.slice(1) : prev;
      return [...capped, { timestamp: Date.now(), value }];
    });
  }, [portfolio, prices]);

  // Persist orders when they change
  useEffect(() => {
    localStorage.setItem('wallet_orders', JSON.stringify(orders));
  }, [orders]);

  return (
    <WalletContext.Provider value={{
      // Core balances
      balances,
      
      // Portfolio tracking
      portfolio,
      totalValue,
      valueHistory,
      
      // Unified transaction system
      transactions,
      
      // Unified order system
      orders,
      
      // Legacy compatibility
      balance,
      setBalance,
      
      // Unified methods
      updateBalance,
      executeTrade,
      executeArbitrage,
      executeStaking,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      getTransactionHistory,
      getTotalPortfolioValue,
      updatePortfolio
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
} 