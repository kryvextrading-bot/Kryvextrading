// WalletContext.tsx - Fixed with proper integration and real-time updates
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from './UserSettingsContext';
import { useMarketData } from './MarketDataContext';
import { useAuth } from './AuthContext';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet-v2';
import { supabase } from '@/lib/supabase';
import walletApiService from '@/services/wallet-api';
import { walletService } from '@/services/wallet-service-new';
import BalanceSyncService from '@/services/balance-sync';
import { positionService } from '@/services/positionService';

// ==================== TYPES ====================

export type Transaction = {
  id: string;
  userId: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade' | 'Arbitrage' | 'Staking' | 'Swap' | 'Options' | 'Fee' | 'Funding' | 'Referral' | 'Airdrop';
  asset: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing' | 'Scheduled' | 'Cancelled';
  date: string;
  details?: any;
  pnl?: number;
  category?: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  metadata?: {
    shouldWin?: boolean;
    outcome?: 'win' | 'loss';
    network?: string;
    address?: string;
    txHash?: string;
    confirmations?: number;
    leverage?: number;
    direction?: 'up' | 'down';
    timeFrame?: number;
    payout?: number;
    expiresAt?: number;
  };
};

export type Asset = {
  symbol: string;
  name: string;
  balance: number;
  locked: number;
  value: number;
  price?: number;
  change24h?: number;
};

export type SpotOrder = {
  id: string;
  userId: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  filled: number;
  remaining: number;
  status: 'open' | 'filled' | 'cancelled' | 'expired';
  timestamp: string;
  metadata?: any;
};

export type FuturesPosition = {
  id: string;
  userId: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  status: 'open' | 'closed' | 'liquidated';
  takeProfit?: number;
  stopLoss?: number;
  createdAt: string;
  closedAt?: string;
};

export type OptionContract = {
  id: string;
  userId: string;
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  expiration: string;
  premium: number;
  quantity: number;
  status: 'active' | 'expired' | 'exercised';
  pnl?: number;
  metadata?: any;
};

export type ArbitrageContract = {
  id: string;
  userId: string;
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
  userId: string;
  asset: string;
  amount: number;
  apy: number;
  startTime: string;
  endTime?: string;
  rewards: number;
  status: 'active' | 'completed' | 'unstaked';
};

export type TradeExecution = {
  type: 'spot' | 'futures' | 'options';
  pair: string;
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  leverage?: number;
  strike?: number;
  expiration?: string;
  takeProfit?: number;
  stopLoss?: number;
  metadata?: any;
};

export type ArbitrageExecution = {
  product: any;
  amount: number;
  duration: number;
  metadata?: any;
};

export type StakingExecution = {
  asset: string;
  amount: number;
  duration: number;
  apy: number;
  metadata?: any;
};

export type TransactionFilters = {
  type?: string;
  status?: string;
  asset?: string;
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  userId?: string;
};

export interface BalanceUpdate {
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface WalletContextType {
  // Core balances
  balances: Record<string, BalanceUpdate>;
  
  // Portfolio tracking
  portfolio: Asset[];
  totalValue: number;
  valueHistory: { timestamp: number; value: number }[];
  loading: boolean;
  
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
  
  // Balance methods
  getBalance: (asset: string) => number;
  getLockedBalance: (asset: string) => number;
  getTotalBalance: (asset: string) => number;
  updateBalance: (asset: string, amount: number, operation: 'add' | 'subtract' | 'set') => Promise<void>;
  lockBalance: (asset: string, amount: number, reference: string) => Promise<boolean>;
  unlockBalance: (asset: string, amount: number, reference: string) => Promise<boolean>;
  
  // Trading methods
  executeTrade: (trade: TradeExecution) => Promise<Transaction>;
  executeArbitrage: (arbitrage: ArbitrageExecution) => Promise<Transaction>;
  executeStaking: (staking: StakingExecution) => Promise<Transaction>;
  
  // Transaction methods
  addTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  getTransactionHistory: (filters?: TransactionFilters) => Transaction[];
  
  // Portfolio methods
  getTotalPortfolioValue: (currency?: string) => number;
  updatePortfolio: (assets: Asset[]) => void;
  
  // Refresh
  refreshBalance: () => Promise<void>;
  
  // Admin operations
  addBalance: (userId: string, amount: number, currency: string, reason: string) => Promise<void>;
  removeBalance: (userId: string, amount: number, currency: string, reason: string) => Promise<void>;
  freezeBalance: (userId: string, currency: string, amount: number) => Promise<void>;
  unfreezeBalance: (userId: string, currency: string, amount: number) => Promise<void>;
  syncUserBalances: (userId: string) => Promise<void>;
}

// ==================== CONTEXT ====================

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notificationsEnabled } = useUserSettings();
  const { prices } = useMarketData();
  const auth = useAuth();
  const user = auth?.user;
  const { toast } = useToast();
  const {
    balances: unifiedBalances,
    locks: unifiedLocks,
    loading: unifiedLoading,
    refreshBalances,
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance
  } = useUnifiedWallet();
  
  // Refs
  const isMounted = useRef(true);
  const initialLoadDone = useRef(false);
  const pendingRefresh = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize balances
  const getInitialBalances = useCallback((): Record<string, BalanceUpdate> => ({
    USDT: { asset: 'USDT', available: 0, locked: 0, total: 0 },
    BTC: { asset: 'BTC', available: 0, locked: 0, total: 0 },
    ETH: { asset: 'ETH', available: 0, locked: 0, total: 0 },
    SOL: { asset: 'SOL', available: 0, locked: 0, total: 0 },
    BNB: { asset: 'BNB', available: 0, locked: 0, total: 0 },
    ADA: { asset: 'ADA', available: 0, locked: 0, total: 0 },
    XRP: { asset: 'XRP', available: 0, locked: 0, total: 0 },
    DOT: { asset: 'DOT', available: 0, locked: 0, total: 0 }
  }), []);

  // Initialize orders
  const getInitialOrders = useCallback(() => ({
    spot: [],
    futures: [],
    options: [],
    arbitrage: [],
    staking: []
  }), []);

  // Convert unified balances to BalanceUpdate format for compatibility
  const convertedBalances = useMemo((): Record<string, BalanceUpdate> => {
    const result: Record<string, BalanceUpdate> = {};
    
    // Start with unified balances
    Object.entries(unifiedBalances?.funding || {}).forEach(([asset, available]) => {
      result[asset] = {
        asset,
        available: available as number,
        locked: unifiedLocks[asset] || 0,
        total: (available as number) + (unifiedLocks[asset] || 0)
      };
    });
    
    // Ensure all default assets exist
    const defaultAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT'];
    defaultAssets.forEach(asset => {
      if (!result[asset]) {
        result[asset] = { asset, available: 0, locked: 0, total: 0 };
      }
    });
    
    return result;
  }, [unifiedBalances, unifiedLocks]);

  // Update local balances state when unified data changes
  const [balances, setBalances] = useState<Record<string, BalanceUpdate>>(getInitialBalances());
  
  useEffect(() => {
    setBalances(convertedBalances);
  }, [convertedBalances]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [orders, setOrders] = useState(getInitialOrders);
  const [portfolio, setPortfolio] = useState<Asset[]>([]);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [valueHistory, setValueHistory] = useState<{ timestamp: number; value: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  // Track mounted state
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Legacy compatibility
  const legacyBalance = useMemo(() => {
    return getFundingBalance('USDT');
  }, [getFundingBalance]);

  const legacySetBalance = useCallback((amount: number) => {
    console.log('[WalletContext] Setting balance:', amount);
    // Direct balance update for legacy compatibility
    setBalances(prev => ({
      ...prev,
      'USDT': { 
        asset: 'USDT', 
        available: Math.max(0, amount), 
        locked: prev['USDT']?.locked || 0, 
        total: Math.max(0, amount) + (prev['USDT']?.locked || 0)
      }
    }));
  }, []);

  // Get balance methods - now use unified wallet directly
  const getBalanceLocal = useCallback((asset: string): number => {
    const balance = getFundingBalance(asset);
    console.log(`[WalletContext] getBalance(${asset}):`, balance, 'type:', typeof balance);
    return balance;
  }, [getFundingBalance]);

  const getLockedBalanceLocal = useCallback((asset: string): number => {
    return getLockedBalance(asset);
  }, [getLockedBalance]);

  const getTotalBalanceLocal = useCallback((asset: string): number => {
    return getTotalBalance(asset);
  }, [getTotalBalance]);

  // Core balance update method
  const updateBalance = useCallback(async (asset: string, amount: number, operation: 'add' | 'subtract' | 'set'): Promise<void> => {
    if (!asset || amount < 0) return;

    setBalances(prev => {
      const current = prev[asset] || { asset, available: 0, locked: 0, total: 0 };
      let newAvailable: number;
      
      switch (operation) {
        case 'add':
          newAvailable = current.available + amount;
          break;
        case 'subtract':
          newAvailable = Math.max(0, current.available - amount);
          break;
        case 'set':
          newAvailable = Math.max(0, amount);
          break;
        default:
          return prev;
      }
      
      const updated: BalanceUpdate = {
        asset,
        available: newAvailable,
        locked: current.locked,
        total: newAvailable + current.locked
      };
      
      return { ...prev, [asset]: updated };
    });

    // Also update the database if user is authenticated
    if (user?.id) {
      try {
        if (operation === 'add') {
          await walletService.addBalance({
            userId: user.id,
            asset,
            amount,
            reference: 'balance_update',
            type: 'balance_adjustment'
          });
        } else if (operation === 'subtract') {
          await walletService.deductBalance({
            userId: user.id,
            asset,
            amount,
            reference: 'balance_update',
            type: 'balance_adjustment'
          });
        }
      } catch (error) {
        console.error('Failed to update balance in database:', error);
      }
    }
  }, [user?.id]);

  // Lock balance method
  const lockBalance = useCallback(async (asset: string, amount: number, reference: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const current = balances[asset];
      if (!current || current.available < amount) {
        return false;
      }

      // Update local state
      setBalances(prev => {
        const current = prev[asset] || { asset, available: 0, locked: 0, total: 0 };
        const updated: BalanceUpdate = {
          asset,
          available: current.available - amount,
          locked: current.locked + amount,
          total: current.available + current.locked
        };
        return { ...prev, [asset]: updated };
      });

      // Update database
      await walletService.lockBalance({
        userId: user.id,
        asset,
        amount,
        reference
      });

      return true;
    } catch (error) {
      console.error('Failed to lock balance:', error);
      return false;
    }
  }, [user?.id, balances]);

  // Unlock balance method
  const unlockBalance = useCallback(async (asset: string, amount: number, reference: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const current = balances[asset];
      if (!current || current.locked < amount) {
        return false;
      }

      // Update local state
      setBalances(prev => {
        const current = prev[asset] || { asset, available: 0, locked: 0, total: 0 };
        const updated: BalanceUpdate = {
          asset,
          available: current.available + amount,
          locked: current.locked - amount,
          total: current.available + current.locked
        };
        return { ...prev, [asset]: updated };
      });

      // Update database
      await walletService.unlockBalance({
        userId: user.id,
        asset,
        amount,
        reference
      });

      return true;
    } catch (error) {
      console.error('Failed to unlock balance:', error);
      return false;
    }
  }, [user?.id, balances]);

  // Add transaction
  const addTransaction = useCallback(async (tx: Transaction) => {
    setTransactions(prev => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const updated = [tx, ...prev].filter(t => new Date(t.date).getTime() >= thirtyDaysAgo);
      
      // Save to database
      if (user?.id) {
        walletApiService.getUserTransactions(user.id).catch(console.error);
      }
      
      return updated;
    });
  }, [user?.id]);

  // Execute trade
  const executeTrade = useCallback(async (trade: TradeExecution): Promise<Transaction> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const transactionId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [baseAsset, quoteAsset] = trade.pair.split('/');
    
    // Calculate cost/proceeds
    const price = trade.price || prices?.[baseAsset] || 0;
    const total = trade.amount * price;
    
    // Check balance
    if (trade.side === 'buy') {
      const quoteBalance = getBalanceLocal(quoteAsset);
      if (quoteBalance < total) {
        throw new Error(`Insufficient ${quoteAsset} balance. Required: ${total}, Available: ${quoteBalance}`);
      }
    } else {
      const baseBalance = getBalanceLocal(baseAsset);
      if (baseBalance < trade.amount) {
        throw new Error(`Insufficient ${baseAsset} balance. Required: ${trade.amount}, Available: ${baseBalance}`);
      }
    }
    
    // Lock the funds
    if (trade.side === 'buy') {
      await lockBalance(quoteAsset, total, transactionId);
    } else {
      await lockBalance(baseAsset, trade.amount, transactionId);
    }
    
    // Update balances (in a real system, this would happen after settlement)
    if (trade.side === 'buy') {
      await updateBalance(quoteAsset, total, 'subtract');
      await updateBalance(baseAsset, trade.amount, 'add');
    } else {
      await updateBalance(baseAsset, trade.amount, 'subtract');
      await updateBalance(quoteAsset, total, 'add');
    }
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      userId: user.id,
      type: 'Trade',
      asset: trade.pair,
      amount: trade.amount,
      status: 'Completed',
      date: new Date().toISOString(),
      details: {
        side: trade.side,
        price,
        type: trade.type,
        pair: trade.pair,
        leverage: trade.leverage
      },
      category: trade.type,
      metadata: trade.metadata
    };
    
    await addTransaction(transaction);
    
    // Add to orders if needed
    if (trade.type === 'spot') {
      const order: SpotOrder = {
        id: transactionId,
        userId: user.id,
        pair: trade.pair,
        type: trade.side,
        amount: trade.amount,
        price,
        filled: trade.amount,
        remaining: 0,
        status: 'filled',
        timestamp: new Date().toISOString(),
        metadata: trade.metadata
      };
      
      setOrders(prev => ({
        ...prev,
        spot: [...prev.spot, order]
      }));
    } else if (trade.type === 'futures' && trade.leverage) {
      const position: FuturesPosition = {
        id: transactionId,
        userId: user.id,
        symbol: trade.pair,
        side: trade.side === 'buy' ? 'long' : 'short',
        size: trade.amount,
        entryPrice: price,
        markPrice: price,
        pnl: 0,
        pnlPercentage: 0,
        leverage: trade.leverage,
        margin: total / trade.leverage,
        liquidationPrice: price * (trade.side === 'buy' ? 0.9 : 1.1),
        status: 'open',
        takeProfit: trade.takeProfit,
        stopLoss: trade.stopLoss,
        createdAt: new Date().toISOString()
      };
      
      setOrders(prev => ({
        ...prev,
        futures: [...prev.futures, position]
      }));
    }
    
    return transaction;
  }, [user?.id, getBalanceLocal, lockBalance, updateBalance, prices, addTransaction]);

  // Execute arbitrage
  const executeArbitrage = useCallback(async (arbitrage: ArbitrageExecution): Promise<Transaction> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const transactionId = `arb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check balance
    const usdtBalance = getBalanceLocal('USDT');
    if (usdtBalance < arbitrage.amount) {
      throw new Error(`Insufficient USDT balance. Required: ${arbitrage.amount}, Available: ${usdtBalance}`);
    }
    
    // Lock funds
    await lockBalance('USDT', arbitrage.amount, transactionId);
    
    // Update balance
    await updateBalance('USDT', arbitrage.amount, 'subtract');
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      userId: user.id,
      type: 'Arbitrage',
      asset: 'USDT',
      amount: arbitrage.amount,
      status: 'Processing',
      date: new Date().toISOString(),
      details: {
        product: arbitrage.product,
        duration: arbitrage.duration,
        startTime: new Date().toISOString()
      },
      category: 'arbitrage',
      metadata: arbitrage.metadata
    };
    
    await addTransaction(transaction);
    
    // Add to arbitrage contracts
    const contract: ArbitrageContract = {
      id: transactionId,
      userId: user.id,
      productId: arbitrage.product.id,
      productLabel: arbitrage.product.label,
      amount: arbitrage.amount,
      duration: arbitrage.duration,
      startTime: new Date().toISOString(),
      status: 'active',
      dailyRate: 0.01
    };
    
    setOrders(prev => ({
      ...prev,
      arbitrage: [...prev.arbitrage, contract]
    }));
    
    return transaction;
  }, [user?.id, getBalanceLocal, lockBalance, updateBalance, addTransaction]);

  // Execute staking
  const executeStaking = useCallback(async (staking: StakingExecution): Promise<Transaction> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const transactionId = `stake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check balance
    const assetBalance = getBalanceLocal(staking.asset);
    if (assetBalance < staking.amount) {
      throw new Error(`Insufficient ${staking.asset} balance. Required: ${staking.amount}, Available: ${assetBalance}`);
    }
    
    // Lock funds
    await lockBalance(staking.asset, staking.amount, transactionId);
    
    // Update balance
    await updateBalance(staking.asset, staking.amount, 'subtract');
    
    // Create transaction
    const transaction: Transaction = {
      id: transactionId,
      userId: user.id,
      type: 'Staking',
      asset: staking.asset,
      amount: staking.amount,
      status: 'Processing',
      date: new Date().toISOString(),
      details: {
        duration: staking.duration,
        apy: staking.apy,
        startTime: new Date().toISOString()
      },
      category: 'staking',
      metadata: staking.metadata
    };
    
    await addTransaction(transaction);
    
    // Calculate end time
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + staking.duration);
    
    // Add to staking positions
    const position: StakingPosition = {
      id: transactionId,
      userId: user.id,
      asset: staking.asset,
      amount: staking.amount,
      apy: staking.apy,
      startTime: new Date().toISOString(),
      endTime: endTime.toISOString(),
      rewards: 0,
      status: 'active'
    };
    
    setOrders(prev => ({
      ...prev,
      staking: [...prev.staking, position]
    }));
    
    return transaction;
  }, [user?.id, getBalanceLocal, lockBalance, updateBalance, addTransaction]);

  // Delete transaction
  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      
      // Delete from database
      if (user?.id) {
        // Note: We would need to implement deleteTransaction in walletApiService or supabase-api
        console.log('Delete transaction not yet implemented for:', id);
      }
      
      return updated;
    });
  }, [user?.id]);

  // Update transaction
  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      
      // Update in database
      if (user?.id) {
        // Note: We would need to implement updateTransaction in walletApiService or supabase-api
        console.log('Update transaction not yet implemented for:', id, updates);
      }
      
      return updated;
    });
  }, [user?.id]);

  // Get transaction history with filters
  const getTransactionHistory = useCallback((filters?: TransactionFilters): Transaction[] => {
    let filtered = [...transactions];
    
    if (filters) {
      if (filters.userId) {
        filtered = filtered.filter(t => t.userId === filters.userId);
      }
      if (filters.type) {
        filtered = filtered.filter(t => t.type === filters.type);
      }
      if (filters.status) {
        filtered = filtered.filter(t => t.status === filters.status);
      }
      if (filters.asset) {
        filtered = filtered.filter(t => t.asset === filters.asset);
      }
      if (filters.dateFrom) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
      }
      if (filters.dateTo) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
      }
      if (filters.category) {
        filtered = filtered.filter(t => t.category === filters.category);
      }
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  // Update portfolio
  const updatePortfolio = useCallback((assets: Asset[]) => {
    setPortfolio(assets);
  }, []);

  // Get total portfolio value
  const getTotalPortfolioValue = useCallback((currency?: string): number => {
    if (currency === 'USDT' || currency === 'USD') {
      return totalValue;
    }
    if (currency === 'BTC' && prices?.BTC) {
      return totalValue / prices.BTC;
    }
    return totalValue;
  }, [totalValue, prices]);

  // Helper function to get asset name
  const getAssetName = useCallback((symbol: string): string => {
    const names: Record<string, string> = {
      USDT: 'Tether',
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      BNB: 'Binance Coin',
      ADA: 'Cardano',
      XRP: 'Ripple',
      DOT: 'Polkadot',
      DOGE: 'Dogecoin'
    };
    return names[symbol] || symbol;
  }, []);

  // Refresh user balance from server
  const refreshBalance = useCallback(async () => {
    if (!user?.id) {
      setBalances(getInitialBalances());
      setPortfolio([]);
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous refreshes
    if (pendingRefresh.current) {
      console.log('[WalletContext] Refresh already pending, skipping...');
      return;
    }

    pendingRefresh.current = true;
    
    try {
      setLoading(true);
      
      // Fetch wallet balances
      const walletBalances = await walletApiService.getUserBalances(user.id);
      
      console.log('[WalletContext] Fetched wallet balances:', walletBalances);
      
      if (!isMounted.current) return;
      
      // Validate wallet balances structure
      if (!Array.isArray(walletBalances)) {
        console.error('[WalletContext] Invalid wallet balances response:', walletBalances);
        throw new Error('Invalid balance data received');
      }
      
      // Convert to balance updates
      const newBalances: Record<string, BalanceUpdate> = {};
      walletBalances.forEach(wallet => {
        if (!wallet || !wallet.currency) {
          console.warn('[WalletContext] Invalid wallet entry:', wallet);
          return;
        }
        
        newBalances[wallet.currency] = {
          asset: wallet.currency,
          available: typeof wallet.balance === 'number' ? wallet.balance : 0,
          locked: typeof wallet.locked_balance === 'number' ? wallet.locked_balance : 0,
          total: (typeof wallet.balance === 'number' ? wallet.balance : 0) + (typeof wallet.locked_balance === 'number' ? wallet.locked_balance : 0)
        };
        console.log(`[WalletContext] Updated balance for ${wallet.currency}:`, newBalances[wallet.currency]);
      });

      // Ensure all default assets exist
      const defaultAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT', 'DOGE'];
      defaultAssets.forEach(asset => {
        if (!newBalances[asset]) {
          newBalances[asset] = { asset, available: 0, locked: 0, total: 0 };
        }
      });

      setBalances(newBalances);

      // Update portfolio
      const assets: Asset[] = Object.entries(newBalances).map(([symbol, balance]) => ({
        symbol,
        name: getAssetName(symbol),
        balance: balance.available,
        locked: balance.locked,
        value: symbol === 'USDT' ? balance.available : (balance.available * (prices?.[symbol] || 0)),
        price: prices?.[symbol] || 0,
        change24h: 0
      }));

      updatePortfolio(assets);
      setLastUpdated(Date.now());
      
      // Load transactions
      const walletTransactions = await walletApiService.getUserTransactions(user.id);
      // Convert WalletTransaction to Transaction type
      const userTransactions: Transaction[] = walletTransactions.map(wt => ({
        id: wt.id,
        userId: wt.user_id,
        type: wt.type === 'deposit' ? 'Deposit' : 
              wt.type === 'withdrawal' ? 'Withdrawal' : 
              wt.type === 'transfer' ? 'Trade' :
              wt.type === 'fee' ? 'Fee' : 'Funding',
        asset: wt.currency,
        amount: wt.amount,
        status: 'Completed',
        date: wt.created_at,
        details: {
          reference: wt.reference_id,
          description: wt.description,
          balanceBefore: wt.balance_before,
          balanceAfter: wt.balance_after
        },
        metadata: {
          reference: wt.reference_id,
          network: 'wallet',
          address: '',
          txHash: ''
        } as Transaction['metadata']
      }));
      setTransactions(userTransactions);
      
      // Load positions
      const userPositions = await positionService.getUserPositions(user.id);
      setOrders(prev => ({
        ...prev,
        futures: userPositions
      }));

    } catch (error) {
      console.error('[WalletContext] Failed to refresh balance:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh wallet balance',
        variant: 'destructive'
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      pendingRefresh.current = false;
    }
  }, [user?.id, prices, getAssetName, updatePortfolio, toast, getInitialBalances]);

  // Sync user balances (admin)
  const syncUserBalances = useCallback(async (userId: string) => {
    try {
      await BalanceSyncService.syncUserBalance(userId);
      if (userId === user?.id) {
        await refreshBalance();
      }
      toast({
        title: 'Sync Complete',
        description: 'User balances synchronized'
      });
    } catch (error) {
      console.error('[WalletContext] Failed to sync balances:', error);
      toast({
        title: 'Sync Failed',
        description: 'Could not synchronize balances',
        variant: 'destructive'
      });
    }
  }, [user?.id, refreshBalance, toast]);

  // Admin operations - Add balance
  const addBalance = useCallback(async (userId: string, amount: number, currency: string, reason: string) => {
    try {
      await walletApiService.adminAddFunds(userId, amount, currency, reason);
      
      if (userId === user?.id) {
        await updateBalance(currency, amount, 'add');
        
        const transaction: Transaction = {
          id: `admin-add-${Date.now()}`,
          userId,
          type: 'Deposit',
          asset: currency,
          amount,
          status: 'Completed',
          date: new Date().toISOString(),
          details: { reason, adminAction: true }
        };
        
        await addTransaction(transaction);
        await refreshBalance();
      }
      
      // Trigger event for other components
      window.dispatchEvent(new CustomEvent('balanceUpdate', { 
        detail: { userId, amount, currency, reason }
      }));
      
      toast({
        title: 'Balance Added',
        description: `Added ${amount} ${currency} to user wallet`,
      });
      
    } catch (error) {
      console.error('[WalletContext] Failed to add balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to add balance',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user?.id, updateBalance, addTransaction, refreshBalance, toast]);

  // Admin operations - Remove balance
  const removeBalance = useCallback(async (userId: string, amount: number, currency: string, reason: string) => {
    try {
      await walletApiService.adminRemoveFunds(userId, amount, currency, reason);
      
      if (userId === user?.id) {
        await updateBalance(currency, amount, 'subtract');
        
        const transaction: Transaction = {
          id: `admin-remove-${Date.now()}`,
          userId,
          type: 'Withdrawal',
          asset: currency,
          amount,
          status: 'Completed',
          date: new Date().toISOString(),
          details: { reason, adminAction: true }
        };
        
        await addTransaction(transaction);
        await refreshBalance();
      }
      
      window.dispatchEvent(new CustomEvent('balanceUpdate', { 
        detail: { userId, amount, currency, reason }
      }));
      
      toast({
        title: 'Balance Removed',
        description: `Removed ${amount} ${currency} from user wallet`,
      });
      
    } catch (error) {
      console.error('[WalletContext] Failed to remove balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove balance',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user?.id, updateBalance, addTransaction, refreshBalance, toast]);

  // Admin operations - Freeze balance
  const freezeBalance = useCallback(async (userId: string, currency: string, amount: number) => {
    try {
      await walletApiService.freezeUserBalance(userId, currency, amount);
      
      if (userId === user?.id) {
        await lockBalance(currency, amount, `admin_freeze_${Date.now()}`);
      }
      
      toast({
        title: 'Balance Frozen',
        description: `Frozen ${amount} ${currency}`,
      });
      
    } catch (error) {
      console.error('[WalletContext] Failed to freeze balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to freeze balance',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user?.id, lockBalance, toast]);

  // Admin operations - Unfreeze balance
  const unfreezeBalance = useCallback(async (userId: string, currency: string, amount: number) => {
    try {
      await walletApiService.unfreezeUserBalance(userId, currency, amount);
      
      if (userId === user?.id) {
        await unlockBalance(currency, amount, `admin_unfreeze_${Date.now()}`);
      }
      
      toast({
        title: 'Balance Unfrozen',
        description: `Unfrozen ${amount} ${currency}`,
      });
      
    } catch (error) {
      console.error('[WalletContext] Failed to unfreeze balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to unfreeze balance',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user?.id, unlockBalance, toast]);

  // Set up Supabase real-time subscription for wallet changes - OPTIMIZED
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('wallet_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[WalletContext] Real-time wallet change detected:', payload);
          
          // Reduced debounce for instant updates
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
          
          refreshTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              refreshBalances();
            }
          }, 200); // Reduced from 1000ms to 200ms
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user?.id, refreshBalances]);

  // Listen for balance update events - OPTIMIZED
  useEffect(() => {
    const handleBalanceUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[WalletContext] Balance update event received:', customEvent.detail);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          refreshBalances();
        }
      }, 100); // Reduced from 500ms to 100ms
    };
    
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, [refreshBalances]);

  // Load initial data
  useEffect(() => {
    if (user?.id && !initialLoadDone.current) {
      refreshBalance().finally(() => {
        initialLoadDone.current = true;
      });
    } else if (!user?.id) {
      setBalances(getInitialBalances());
      setPortfolio([]);
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [user?.id, refreshBalance, getInitialBalances]);

  // Update portfolio with real data from unified wallet
  useEffect(() => {
    if (!user?.id || !unifiedBalances) {
      setPortfolio([]);
      return;
    }

    // Create portfolio from unified wallet balances
    const assets: Asset[] = [];
    
    // Add funding wallet assets
    Object.entries(unifiedBalances.funding || {}).forEach(([symbol, balance]) => {
      if (balance > 0) {
        const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
        const locked = getLockedBalance(symbol);
        assets.push({
          symbol,
          name: getAssetName(symbol),
          balance: balance as number,
          locked: locked,
          value: ((balance as number) + locked) * price,
          price,
          change24h: 0 // TODO: Get from market data
        });
      }
    });
    
    // Add trading wallet assets
    Object.entries(unifiedBalances.trading || {}).forEach(([symbol, tradingBalance]) => {
      const tb = tradingBalance as { available: number; locked: number; total: number };
      if (tb.total > 0) {
        const price = prices?.[symbol] || (symbol === 'USDT' ? 1 : 0);
        assets.push({
          symbol: symbol + '_TRADING',
          name: getAssetName(symbol) + ' (Trading)',
          balance: tb.available,
          locked: tb.locked,
          value: tb.total * price,
          price,
          change24h: 0 // TODO: Get from market data
        });
      }
    });
    
    console.log('💰 Portfolio updated from unified wallet:', assets);
    setPortfolio(assets);
  }, [user?.id, unifiedBalances, prices, getAssetName, getLockedBalance]);

  // Recalculate total value and update history
  useEffect(() => {
    const value = portfolio.reduce((sum, a) => {
      if (a.symbol === 'USDT') return sum + a.balance;
      const price = prices?.[a.symbol] ?? 0;
      return sum + a.balance * price;
    }, 0);
    
    setTotalValue(value);
    setValueHistory(prev => {
      if (prev.length > 0 && Math.abs(prev[prev.length - 1].value - value) < 0.01) return prev;
      const capped = prev.length > 99 ? prev.slice(1) : prev;
      return [...capped, { timestamp: Date.now(), value }];
    });
  }, [portfolio, prices]);

  // Update futures positions with mark prices
  useEffect(() => {
    if (orders.futures.length > 0 && prices) {
      const updatedPositions = orders.futures.map(position => {
        const currentPrice = prices[position.symbol.replace('/', '')] || position.markPrice;
        const pnl = position.side === 'long'
          ? (currentPrice - position.entryPrice) * position.size
          : (position.entryPrice - currentPrice) * position.size;
        const pnlPercentage = (pnl / position.margin) * 100;
        
        return {
          ...position,
          markPrice: currentPrice,
          pnl,
          pnlPercentage
        };
      });
      
      setOrders(prev => ({
        ...prev,
        futures: updatedPositions
      }));
    }
  }, [orders.futures, prices]);

  return (
    <WalletContext.Provider
      value={{
        balances,
        transactions,
        orders,
        portfolio,
        totalValue,
        valueHistory,
        loading,
        balance: legacyBalance,
        setBalance: legacySetBalance,
        getBalance: getBalanceLocal,
        getLockedBalance: getLockedBalanceLocal,
        getTotalBalance: getTotalBalanceLocal,
        updateBalance,
        lockBalance,
        unlockBalance,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        getTransactionHistory,
        getTotalPortfolioValue,
        updatePortfolio,
        refreshBalance: refreshBalances,
        addBalance,
        removeBalance,
        freezeBalance,
        unfreezeBalance,
        syncUserBalances
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// ==================== HOOK ====================
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}