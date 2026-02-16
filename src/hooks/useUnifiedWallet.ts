import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedWalletService, WalletBalance, TradingLock } from '@/services/unified-wallet-service';

export interface TradingBalance {
  available: number;
  locked: number;
  total: number;
}

export function useUnifiedWallet() {
  const { user } = useAuth();
  
  // Funding wallet (for deposits/withdrawals)
  const [fundingBalances, setFundingBalances] = useState<Record<string, number>>({});
  const [fundingDetails, setFundingDetails] = useState<Record<string, WalletBalance>>({});
  
  // Trading wallet (for active trading)
  const [tradingBalances, setTradingBalances] = useState<Record<string, TradingBalance>>({});
  
  const [locks, setLocks] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeLocks: 0, totalLockedAmount: 0, locksByAsset: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = useCallback(async () => {
    if (!user?.id) {
      setFundingBalances({});
      setTradingBalances({});
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      console.log('🔄 [useUnifiedWallet] Starting optimized data refresh for user:', user.id);
      const data = await unifiedWalletService.refreshAllWalletData(user.id);
      
      console.log('📊 [useUnifiedWallet] Raw data from service:', data);
      
      // Process funding balances (from wallet_balances) - instant state update
      const funding: Record<string, number> = {};
      const details: Record<string, WalletBalance> = {};
      
      Object.entries(data.balances).forEach(([asset, balance]) => {
        // Skip trading wallet entries in funding
        if (!asset.includes('_TRADING')) {
          funding[asset] = balance.available;
          details[asset] = balance;
        }
      });
      
      // Process trading balances - simplified logic
      const trading: Record<string, TradingBalance> = {};
      
      Object.entries(data.balances).forEach(([asset, balance]) => {
        if (asset.includes('_TRADING')) {
          const baseAsset = asset.replace('_TRADING', '');
          trading[baseAsset] = {
            available: balance.available,
            locked: balance.locked,
            total: balance.total
          };
        }
      });
      
      // Instant state updates
      setFundingBalances(funding);
      setFundingDetails(details);
      setTradingBalances(trading);
      setLocks(data.locks);
      setStats(data.stats);
      
      console.log('✅ [useUnifiedWallet] Funding balances:', funding);
      console.log('✅ [useUnifiedWallet] Trading balances:', trading);
      
    } catch (error) {
      console.error('❌ [useUnifiedWallet] Failed to refresh wallet data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Get funding balance (for deposits/withdrawals)
  const getFundingBalance = useCallback((asset: string = 'USDT'): number => {
    return fundingBalances[asset] || 0;
  }, [fundingBalances]);

  // Get trading balance (for active trading)
  const getTradingBalance = useCallback((asset: string = 'USDT'): number => {
    return tradingBalances[asset]?.available || 0;
  }, [tradingBalances]);

  // Get locked balance (from active trades)
  const getLockedBalance = useCallback((asset: string = 'USDT'): number => {
    return stats.locksByAsset?.[asset] || fundingDetails[asset]?.locked || 0;
  }, [stats, fundingDetails]);

  // Get total balance (funding + trading + locked)
  const getTotalBalance = useCallback((asset: string = 'USDT'): number => {
    return getFundingBalance(asset) + getTradingBalance(asset) + getLockedBalance(asset);
  }, [getFundingBalance, getTradingBalance, getLockedBalance]);

  // Legacy compatibility
  const getBalance = useCallback((asset: string = 'USDT'): number => {
    return getFundingBalance(asset);
  }, [getFundingBalance]);

  // Transfer from funding to trading - with instant optimistic update
  const transferToTrading = useCallback(async (asset: string, amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    // Check if enough funding balance
    const fundingBalance = getFundingBalance(asset);
    if (fundingBalance < amount) {
      return { success: false, error: `Insufficient funding balance. Have ${fundingBalance}, need ${amount}` };
    }
    
    // Instant optimistic update - update UI immediately
    setFundingBalances(prev => ({
      ...prev,
      [asset]: (prev[asset] || 0) - amount
    }));
    
    setTradingBalances(prev => ({
      ...prev,
      [asset]: {
        available: (prev[asset]?.available || 0) + amount,
        locked: prev[asset]?.locked || 0,
        total: (prev[asset]?.total || 0) + amount
      }
    }));
    
    try {
      // Update database in background
      await unifiedWalletService.transferToTradingWallet(user.id, asset, amount);
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      setFundingBalances(prev => ({
        ...prev,
        [asset]: (prev[asset] || 0) + amount
      }));
      
      setTradingBalances(prev => ({
        ...prev,
        [asset]: {
          available: (prev[asset]?.available || 0) - amount,
          locked: prev[asset]?.locked || 0,
          total: (prev[asset]?.total || 0) - amount
        }
      }));
      
      console.error('Transfer failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Transfer failed' };
    }
  }, [user?.id, getFundingBalance]);

  // Transfer from trading to funding - with instant optimistic update
  const transferToFunding = useCallback(async (asset: string, amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    // Check if enough trading balance
    const tradingBalance = getTradingBalance(asset);
    if (tradingBalance < amount) {
      return { success: false, error: `Insufficient trading balance. Have ${tradingBalance}, need ${amount}` };
    }
    
    // Instant optimistic update - update UI immediately
    setTradingBalances(prev => ({
      ...prev,
      [asset]: {
        available: (prev[asset]?.available || 0) - amount,
        locked: prev[asset]?.locked || 0,
        total: (prev[asset]?.total || 0) - amount
      }
    }));
    
    setFundingBalances(prev => ({
      ...prev,
      [asset]: (prev[asset] || 0) + amount
    }));
    
    try {
      // Update database in background
      await unifiedWalletService.transferToFundingWallet(user.id, asset, amount);
      return { success: true };
    } catch (error) {
      // Revert optimistic update on error
      setTradingBalances(prev => ({
        ...prev,
        [asset]: {
          available: (prev[asset]?.available || 0) + amount,
          locked: prev[asset]?.locked || 0,
          total: (prev[asset]?.total || 0) + amount
        }
      }));
      
      setFundingBalances(prev => ({
        ...prev,
        [asset]: (prev[asset] || 0) - amount
      }));
      
      console.error('Transfer failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Transfer failed' };
    }
  }, [user?.id, getTradingBalance]);

  const getDepositAddress = useCallback((asset: string): string | undefined => {
    return fundingDetails[asset]?.depositAddress;
  }, [fundingDetails]);

  // Operations
  const addBalance = useCallback(async (asset: string, amount: number, type: string, reference: string, metadata?: any) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const result = await unifiedWalletService.addBalance({
      userId: user.id,
      asset,
      amount,
      reference,
      type: type as any,
      metadata
    });
    
    if (result.success) {
      await refreshData();
    }
    
    return result;
  }, [user?.id, refreshData]);

  const deductBalance = useCallback(async (asset: string, amount: number, type: string, reference: string, metadata?: any) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const result = await unifiedWalletService.deductBalance({
      userId: user.id,
      asset,
      amount,
      reference,
      type: type as any,
      metadata
    });
    
    if (result.success) {
      await refreshData();
    }
    
    return result;
  }, [user?.id, refreshData]);

  const lockBalance = useCallback(async (asset: string, amount: number, reference: string, metadata?: any) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const result = await unifiedWalletService.lockBalance({
      userId: user.id,
      asset,
      amount,
      reference,
      type: 'lock',
      metadata
    });
    
    if (result.success) {
      await refreshData();
    }
    
    return result;
  }, [user?.id, refreshData]);

  const unlockBalance = useCallback(async (asset: string, amount: number, reference: string, metadata?: any) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };
    
    const result = await unifiedWalletService.unlockBalance({
      userId: user.id,
      asset,
      amount,
      reference,
      type: 'unlock',
      metadata
    });
    
    if (result.success) {
      await refreshData();
    }
    
    return result;
  }, [user?.id, refreshData]);

  return {
    // Funding wallet
    fundingBalances,
    fundingDetails,
    getFundingBalance,
    
    // Trading wallet
    tradingBalances,
    getTradingBalance,
    
    // Locked funds
    getLockedBalance,
    getTotalBalance,
    
    // Locks and stats
    locks,
    stats,
    
    // Loading states
    loading,
    refreshing,
    
    // Transfer functions
    transferToTrading,
    transferToFunding,
    
    // Legacy compatibility
    balances: fundingBalances,
    getBalance,
    balanceDetails: fundingDetails,
    
    // Operations
    addBalance,
    deductBalance,
    lockBalance,
    unlockBalance,
    
    // Refresh
    refreshData
  };
}
