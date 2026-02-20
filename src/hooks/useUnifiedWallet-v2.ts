/**
 * Comprehensive Unified Wallet Hook
 * Implements the flow: FUNDING → TRADING → LOCKS for different trading types
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedWalletService, WalletBalances, TradingLock, WalletTransaction } from '@/services/unified-wallet-service-v2';
import { toast } from 'react-hot-toast';

export function useUnifiedWallet() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalances>({
    funding: {},
    trading: {},
    locked: {}
  });
  const [locks, setLocks] = useState<TradingLock[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBalances = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Clear cache to force fresh data
      unifiedWalletService.invalidateCache(user.id);
      
      const data = await unifiedWalletService.getBalances(user.id);
      setBalances(data);
      
      const activeLocks = await unifiedWalletService.getActiveLocks(user.id);
      setLocks(activeLocks);
    } catch (error) {
      console.error('Error refreshing balances:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refreshTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const txHistory = await unifiedWalletService.getTransactionHistory(user.id, 20);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshBalances();
    refreshTransactions();
    
    // Refresh every 10 seconds
    const interval = setInterval(() => {
      refreshBalances();
      refreshTransactions();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [refreshBalances, refreshTransactions]);

  const getFundingBalance = useCallback((asset: string = 'USDT') => {
    return balances.funding[asset] || 0;
  }, [balances]);

  const getTradingBalance = useCallback((asset: string = 'USDT'): number => {
    const formattedBalances = { ...balances };
    Object.keys(formattedBalances.trading || {}).forEach((asset) => {
      console.log('🔍 Processing trading balance for asset:', asset, 'value:', formattedBalances.trading[asset], 'type:', typeof formattedBalances.trading[asset]);
      
      // If trading balance is an object, try to extract the balance value
      if (typeof formattedBalances.trading[asset] === 'object' && formattedBalances.trading[asset] !== null) {
        // Try to find balance property
        const extracted = Number((formattedBalances.trading[asset] as any).balance || (formattedBalances.trading[asset] as any).amount || 0) || 0;
        console.log('🔧 Extracted from object:', extracted);
        formattedBalances.trading[asset] = extracted;
      } else {
        const numValue = Number(formattedBalances.trading[asset]) || 0;
        console.log('✅ Used direct number conversion:', numValue);
        formattedBalances.trading[asset] = numValue;
      }
    });
    const numBalance = Number(formattedBalances.trading[asset]) || 0;
    console.log('✅ Final trading balance:', { asset, balance: numBalance });
    return numBalance;
  }, [balances]);

  const getLockedBalance = useCallback((asset: string = 'USDT') => {
    return balances.locked[asset] || 0;
  }, [balances]);

  const getTotalBalance = useCallback((asset: string = 'USDT') => {
    return (balances.funding[asset] || 0) + (balances.trading[asset] || 0) + (balances.locked[asset] || 0);
  }, [balances]);

  const transferToTrading = useCallback(async (
    asset: string,
    amount: number,
    reference: string
  ) => {
    if (!user?.id) {
      toast.error('Please login first');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await unifiedWalletService.transferToTrading(
      user.id,
      asset,
      amount,
      reference
    );

    if (result.success) {
      await refreshBalances();
      await refreshTransactions();
      toast.success(`✅ Transferred ${amount.toFixed(2)} ${asset} to trading wallet`);
    } else {
      toast.error(result.error || 'Transfer failed');
    }

    return result;
  }, [user?.id, refreshBalances, refreshTransactions]);

  const transferToFunding = useCallback(async (
    asset: string,
    amount: number,
    reference: string
  ) => {
    if (!user?.id) {
      toast.error('Please login first');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await unifiedWalletService.transferToFunding(
      user.id,
      asset,
      amount,
      reference
    );

    if (result.success) {
      await refreshBalances();
      await refreshTransactions();
      toast.success(`✅ Transferred ${amount.toFixed(2)} ${asset} to funding wallet`);
    } else {
      toast.error(result.error || 'Transfer failed');
    }

    return result;
  }, [user?.id, refreshBalances, refreshTransactions]);

  const lockFunds = useCallback(async (
    asset: string,
    amount: number,
    lockType: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking',
    referenceId: string,
    duration: number,
    metadata: any = {}
  ) => {
    if (!user?.id) {
      toast.error('Please login first');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await unifiedWalletService.lockFunds(
      user.id,
      asset,
      amount,
      lockType,
      referenceId,
      duration,
      metadata
    );

    if (result.success) {
      await refreshBalances();
      await refreshTransactions();
      toast.success(`🔒 Locked ${amount.toFixed(2)} ${asset} for ${lockType}`);
    } else {
      toast.error(result.error || 'Lock failed');
    }

    return result;
  }, [user?.id, refreshBalances, refreshTransactions]);

  const releaseFunds = useCallback(async (
    referenceId: string,
    outcome: 'win' | 'loss',
    profit?: number
  ) => {
    if (!user?.id) {
      toast.error('Please login first');
      return { success: false, error: 'Not authenticated' };
    }

    const result = await unifiedWalletService.releaseFunds(
      user.id,
      referenceId,
      outcome,
      profit
    );

    if (result.success) {
      await refreshBalances();
      await refreshTransactions();
      
      if (outcome === 'win') {
        toast.success(`🎉 Won! +${(profit || 0).toFixed(2)} USDT added to trading wallet`);
      } else {
        toast.error(`💔 Trade lost`);
      }
    } else {
      toast.error(result.error || 'Release failed');
    }

    return result;
  }, [user?.id, refreshBalances, refreshTransactions]);

  // Legacy functions for backward compatibility
  const deductBalance = useCallback(async (
    asset: string,
    amount: number,
    reference: string,
    metadata?: any
  ) => {
    // For options trading, we lock funds instead of deducting
    return lockFunds(asset, amount, 'options', reference, 60, metadata);
  }, [lockFunds]);

  const addBalance = useCallback(async (
    asset: string,
    amount: number,
    reference: string,
    metadata?: any
  ) => {
    // For wins, we release funds with profit
    return releaseFunds(reference, 'win', amount - (metadata?.stake || 0));
  }, [releaseFunds]);

  return {
    // Balances
    balances,
    locks,
    transactions,
    loading,
    getFundingBalance,
    getTradingBalance,
    getLockedBalance,
    getTotalBalance,
    
    // Transfers
    transferToTrading,
    transferToFunding,
    
    // Lock management
    lockFunds,
    releaseFunds,
    
    // Legacy compatibility
    deductBalance,
    addBalance,
    
    // Refresh
    refreshBalances,
    refreshTransactions
  };
}
