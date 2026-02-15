import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';
import { useMarketData } from './MarketDataContext';
import { walletService } from '@/services/wallet-service-new';
import { BalanceUpdate, Transaction, WalletBalance } from '@/types/wallet';

interface WalletContextType {
  // Core balances
  balances: Record<string, BalanceUpdate>;
  loading: boolean;
  
  // Balance methods
  getBalance: (asset: string) => number;
  getLockedBalance: (asset: string) => number;
  getTotalBalance: (asset: string) => number;
  updateBalance: (asset: string, amount: number, operation: 'add' | 'subtract' | 'set') => Promise<void>;
  lockBalance: (asset: string, amount: number, reference: string) => Promise<boolean>;
  unlockBalance: (asset: string, amount: number, reference: string) => Promise<boolean>;
  
  // Transaction methods
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => Promise<void>;
  
  // Portfolio
  portfolio: { symbol: string; balance: number; value: number; }[];
  totalValue: number;
  
  // Refresh
  refreshBalance: () => Promise<void>;
  
  // Admin methods
  addBalance: (userId: string, amount: number, currency: string, reason: string) => Promise<void>;
  removeBalance: (userId: string, amount: number, currency: string, reason: string) => Promise<void>;
  freezeBalance: (userId: string, currency: string, amount: number) => Promise<void>;
  unfreezeBalance: (userId: string, currency: string, amount: number) => Promise<void>;
  
  // Legacy
  balance: number;
  setBalance: (amt: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { prices } = useMarketData();
  const { toast } = useToast();
  
  const isMounted = useRef(true);
  const [balances, setBalances] = useState<Record<string, BalanceUpdate>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<{ symbol: string; balance: number; value: number; }[]>([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ==================== CORE BALANCE METHODS ====================
  
  const getBalance = useCallback((asset: string): number => {
    return balances[asset]?.available || 0;
  }, [balances]);

  const getLockedBalance = useCallback((asset: string): number => {
    return balances[asset]?.locked || 0;
  }, [balances]);

  const getTotalBalance = useCallback((asset: string): number => {
    return balances[asset]?.total || 0;
  }, [balances]);

  const updateBalance = useCallback(async (asset: string, amount: number, operation: 'add' | 'subtract' | 'set') => {
    setBalances(prev => {
      const current = prev[asset] || { asset, available: 0, locked: 0, total: 0 };
      let newAvailable: number;
      
      switch (operation) {
        case 'add': newAvailable = current.available + amount; break;
        case 'subtract': newAvailable = Math.max(0, current.available - amount); break;
        case 'set': newAvailable = Math.max(0, amount); break;
        default: return prev;
      }
      
      const updated = {
        ...prev,
        [asset]: {
          asset,
          available: newAvailable,
          locked: current.locked,
          total: newAvailable + current.locked
        }
      };
      return updated;
    });
  }, []);

  const lockBalance = useCallback(async (asset: string, amount: number, reference: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    const current = balances[asset];
    if (!current || current.available < amount) return false;
    
    setBalances(prev => ({
      ...prev,
      [asset]: {
        asset,
        available: prev[asset].available - amount,
        locked: prev[asset].locked + amount,
        total: prev[asset].available + prev[asset].locked
      }
    }));
    
    return true;
  }, [user?.id, balances]);

  const unlockBalance = useCallback(async (asset: string, amount: number, reference: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    const current = balances[asset];
    if (!current || current.locked < amount) return false;
    
    setBalances(prev => ({
      ...prev,
      [asset]: {
        asset,
        available: prev[asset].available + amount,
        locked: prev[asset].locked - amount,
        total: prev[asset].available + prev[asset].locked
      }
    }));
    
    return true;
  }, [user?.id, balances]);

  // ==================== TRANSACTION METHODS ====================
  
  const addTransaction = useCallback(async (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev].slice(0, 100));
  }, []);

  // ==================== REFRESH BALANCE ====================
  
  const refreshBalance = useCallback(async () => {
    if (!user?.id) {
      setBalances({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const walletBalances = await walletService.getUserBalances(user.id);
      
      if (!isMounted.current) return;

      const newBalances: Record<string, BalanceUpdate> = {};
      walletBalances.forEach(w => {
        newBalances[w.asset] = w;
      });

      setBalances(newBalances);
      
      // Update portfolio
      const assets = Object.entries(newBalances).map(([symbol, balance]) => ({
        symbol,
        balance: balance.available,
        value: symbol === 'USDT' ? balance.available : (balance.available * (prices?.[symbol] || 0))
      }));
      setPortfolio(assets);
      
      const total = assets.reduce((sum, a) => sum + a.value, 0);
      setTotalValue(total);
      
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user?.id, prices]);

  // ==================== ADMIN METHODS ====================
  
  const addBalance = useCallback(async (userId: string, amount: number, currency: string, reason: string) => {
    await walletService.addBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_${Date.now()}`,
      type: 'deposit',
      metadata: { reason }
    });
    
    if (userId === user?.id) {
      await refreshBalance();
    }
    
    toast({ title: 'Balance Added', description: `Added ${amount} ${currency}` });
  }, [user?.id, refreshBalance, toast]);

  const removeBalance = useCallback(async (userId: string, amount: number, currency: string, reason: string) => {
    await walletService.deductBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_${Date.now()}`,
      type: 'withdrawal',
      metadata: { reason }
    });
    
    if (userId === user?.id) {
      await refreshBalance();
    }
    
    toast({ title: 'Balance Removed', description: `Removed ${amount} ${currency}` });
  }, [user?.id, refreshBalance, toast]);

  const freezeBalance = useCallback(async (userId: string, currency: string, amount: number) => {
    await walletService.lockBalance({
      userId,
      asset: currency,
      amount,
      reference: `freeze_${Date.now()}`,
      type: 'lock'
    });
    toast({ title: 'Balance Frozen', description: `Frozen ${amount} ${currency}` });
  }, [toast]);

  const unfreezeBalance = useCallback(async (userId: string, currency: string, amount: number) => {
    await walletService.unlockBalance({
      userId,
      asset: currency,
      amount,
      reference: `unfreeze_${Date.now()}`,
      type: 'unlock'
    });
    toast({ title: 'Balance Unfrozen', description: `Unfrozen ${amount} ${currency}` });
  }, [toast]);

  // ==================== LEGACY ====================
  
  const balance = useMemo(() => getBalance('USDT'), [getBalance]);
  const setBalance = useCallback((amt: number) => {
    updateBalance('USDT', amt, 'set');
  }, [updateBalance]);

  // ==================== INITIAL LOAD ====================
  
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const value = {
    balances,
    loading,
    getBalance,
    getLockedBalance,
    getTotalBalance,
    updateBalance,
    lockBalance,
    unlockBalance,
    transactions,
    addTransaction,
    portfolio,
    totalValue,
    refreshBalance,
    addBalance,
    removeBalance,
    freezeBalance,
    unfreezeBalance,
    balance,
    setBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};

export default WalletProvider;
