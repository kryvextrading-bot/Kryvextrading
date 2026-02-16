import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface WalletBalance {
  asset: string;
  available: number;
  locked: number;
  total: number;
  depositAddress?: string;
  isActive?: boolean;
  updatedAt: string;
}

export interface TradingLock {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  lockType: string;
  referenceId: string;
  status: 'locked' | 'released' | 'expired';
  expiresAt: string;
  createdAt: string;
  releasedAt?: string;
  metadata?: any;
}

export interface BalanceOperation {
  userId: string;
  asset: string;
  amount: number;
  reference: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'transfer' | 'lock' | 'unlock' | 'profit' | 'loss' | 'arbitrage' | 'staking';
  metadata?: Record<string, any>;
}

export interface BalanceResult {
  success: boolean;
  newAvailable?: number;
  newLocked?: number;
  error?: string;
  transactionId?: string;
  lockId?: string;
}

class UnifiedWalletService {
  // In-memory cache for instant reads
  private balanceCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache

  private getCacheKey(userId: string, operation: string): string {
    return `${userId}_${operation}`;
  }

  private setCache(key: string, data: any): void {
    this.balanceCache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any | null {
    const cached = this.balanceCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.balanceCache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private invalidateCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.balanceCache.forEach((_, key) => {
      if (key.startsWith(userId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.balanceCache.delete(key));
  }
  // ==================== GET BALANCES (FROM WALLET_BALANCES) ====================

  async getUserBalances(userId: string): Promise<Record<string, WalletBalance>> {
    try {
      // Check cache first for instant response
      const cacheKey = this.getCacheKey(userId, 'balances');
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('📋 [UnifiedWalletService] Cache hit for balances');
        return cached;
      }

      // Get from wallet_balances (primary)
      const { data: balances, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Get deposit addresses from wallets table
      const { data: wallets } = await supabase
        .from('wallets')
        .select('currency, deposit_address, is_active')
        .eq('user_id', userId);

      const result: Record<string, WalletBalance> = {};

      // Process balances
      if (balances && balances.length > 0) {
        balances.forEach(b => {
          const wallet = wallets?.find(w => w.currency === b.asset);
          result[b.asset] = {
            asset: b.asset,
            available: Number(b.available) || 0,
            locked: Number(b.locked) || 0,
            total: (Number(b.available) || 0) + (Number(b.locked) || 0),
            depositAddress: wallet?.deposit_address,
            isActive: wallet?.is_active,
            updatedAt: b.updated_at
          };
        });
      }

      // If no balances, try wallets table directly
      if (Object.keys(result).length === 0 && wallets && wallets.length > 0) {
        for (const w of wallets) {
          // Create entry in wallet_balances
          await this.initializeAsset(userId, w.currency);
          
          result[w.currency] = {
            asset: w.currency,
            available: 0,
            locked: 0,
            total: 0,
            depositAddress: w.deposit_address,
            isActive: w.is_active,
            updatedAt: new Date().toISOString()
          };
        }
      }

      // Cache the result
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error getting user balances:', error);
      return {};
    }
  }

  async getBalance(userId: string, asset: string = 'USDT'): Promise<number> {
    const { data } = await supabase
      .from('wallet_balances')
      .select('available')
      .eq('user_id', userId)
      .eq('asset', asset)
      .maybeSingle();

    return Number(data?.available) || 0;
  }

  async getLockedBalance(userId: string, asset: string = 'USDT'): Promise<number> {
    const { data } = await supabase
      .from('wallet_balances')
      .select('locked')
      .eq('user_id', userId)
      .eq('asset', asset)
      .maybeSingle();

    return Number(data?.locked) || 0;
  }

  async getDepositAddress(userId: string, asset: string): Promise<string | null> {
    const { data } = await supabase
      .from('wallets')
      .select('deposit_address')
      .eq('user_id', userId)
      .eq('currency', asset)
      .maybeSingle();

    return data?.deposit_address || null;
  }

  // ==================== INITIALIZE ASSET ====================

  private async initializeAsset(userId: string, asset: string): Promise<void> {
    await supabase
      .from('wallet_balances')
      .upsert({
        user_id: userId,
        asset,
        available: 0,
        locked: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, asset' });
  }

  // ==================== TRADING LOCKS (FROM TRADING_LOCKS) ====================

  async getActiveLocks(userId: string): Promise<TradingLock[]> {
    const { data, error } = await supabase
      .from('trading_locks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'locked')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting active locks:', error);
      return [];
    }

    return (data || []).map(lock => ({
      id: lock.id,
      userId: lock.user_id,
      asset: lock.asset,
      amount: Number(lock.amount),
      lockType: lock.lock_type,
      referenceId: lock.reference_id,
      status: lock.status,
      expiresAt: lock.expires_at,
      createdAt: lock.created_at,
      releasedAt: lock.released_at,
      metadata: lock.metadata
    }));
  }

  async getLockStats(userId: string): Promise<{ activeLocks: number; totalLockedAmount: number; locksByAsset: Record<string, number> }> {
    const locks = await this.getActiveLocks(userId);
    
    const totalLockedAmount = locks.reduce((sum, lock) => sum + lock.amount, 0);
    const locksByAsset: Record<string, number> = {};
    
    locks.forEach(lock => {
      locksByAsset[lock.asset] = (locksByAsset[lock.asset] || 0) + lock.amount;
    });

    return {
      activeLocks: locks.length,
      totalLockedAmount,
      locksByAsset
    };
  }

  // ==================== BALANCE OPERATIONS (UPDATE BOTH TABLES) ====================

  async addBalance(operation: BalanceOperation): Promise<BalanceResult> {
    const transactionId = uuidv4();

    try {
      // Get current balance
      const currentAvailable = await this.getBalance(operation.userId, operation.asset);
      const currentLocked = await this.getLockedBalance(operation.userId, operation.asset);
      const newAvailable = currentAvailable + operation.amount;

      // Update wallet_balances
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: operation.userId,
          asset: operation.asset,
          available: newAvailable,
          locked: currentLocked,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, asset' });

      if (updateError) throw updateError;

      // Also update wallets table for backward compatibility
      await supabase
        .from('wallets')
        .update({
          balance: newAvailable,
          locked_balance: currentLocked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', operation.userId)
        .eq('currency', operation.asset);

      return {
        success: true,
        newAvailable,
        newLocked: currentLocked,
        transactionId
      };
    } catch (error) {
      console.error('Error adding balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deductBalance(operation: BalanceOperation): Promise<BalanceResult> {
    const transactionId = uuidv4();

    try {
      // Invalidate cache for this user
      this.invalidateCache(operation.userId);

      // Get current balance
      const currentAvailable = await this.getBalance(operation.userId, operation.asset);
      
      if (currentAvailable < operation.amount) {
        throw new Error(`Insufficient balance: have ${currentAvailable}, need ${operation.amount}`);
      }

      const currentLocked = await this.getLockedBalance(operation.userId, operation.asset);
      const newAvailable = currentAvailable - operation.amount;

      // Update wallet_balances
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: operation.userId,
          asset: operation.asset,
          available: newAvailable,
          locked: currentLocked,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, asset' });

      if (updateError) throw updateError;

      // Update wallets table
      await supabase
        .from('wallets')
        .update({
          balance: newAvailable,
          locked_balance: currentLocked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', operation.userId)
        .eq('currency', operation.asset);

      return {
        success: true,
        newAvailable,
        newLocked: currentLocked
      };
    } catch (error) {
      console.error('Error deducting balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async lockBalance(operation: BalanceOperation): Promise<BalanceResult> {
    const lockId = uuidv4();

    try {
      // Get current balances
      const currentAvailable = await this.getBalance(operation.userId, operation.asset);
      const currentLocked = await this.getLockedBalance(operation.userId, operation.asset);

      if (currentAvailable < operation.amount) {
        throw new Error(`Insufficient balance to lock: have ${currentAvailable}, need ${operation.amount}`);
      }

      const newAvailable = currentAvailable - operation.amount;
      const newLocked = currentLocked + operation.amount;

      // Update wallet_balances
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: operation.userId,
          asset: operation.asset,
          available: newAvailable,
          locked: newLocked,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, asset' });

      if (updateError) throw updateError;

      // Update wallets table
      await supabase
        .from('wallets')
        .update({
          balance: newAvailable,
          locked_balance: newLocked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', operation.userId)
        .eq('currency', operation.asset);

      // Create lock record in trading_locks
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minute expiry

      await supabase
        .from('trading_locks')
        .insert({
          id: lockId,
          user_id: operation.userId,
          asset: operation.asset,
          amount: operation.amount,
          lock_type: operation.type,
          reference_id: operation.reference,
          status: 'locked',
          expires_at: expiresAt.toISOString(),
          metadata: operation.metadata || {},
          created_at: new Date().toISOString()
        });

      return {
        success: true,
        newAvailable,
        newLocked,
        lockId
      };
    } catch (error) {
      console.error('Error locking balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async unlockBalance(operation: BalanceOperation): Promise<BalanceResult> {
    try {
      // Get current balances
      const currentAvailable = await this.getBalance(operation.userId, operation.asset);
      const currentLocked = await this.getLockedBalance(operation.userId, operation.asset);

      if (currentLocked < operation.amount) {
        throw new Error(`Insufficient locked balance: have ${currentLocked}, need ${operation.amount}`);
      }

      const newAvailable = currentAvailable + operation.amount;
      const newLocked = currentLocked - operation.amount;

      // Update wallet_balances
      const { error: updateError } = await supabase
        .from('wallet_balances')
        .upsert({
          user_id: operation.userId,
          asset: operation.asset,
          available: newAvailable,
          locked: newLocked,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, asset' });

      if (updateError) throw updateError;

      // Update wallets table
      await supabase
        .from('wallets')
        .update({
          balance: newAvailable,
          locked_balance: newLocked,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', operation.userId)
        .eq('currency', operation.asset);

      // Update lock status
      await supabase
        .from('trading_locks')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('reference_id', operation.reference);

      return {
        success: true,
        newAvailable,
        newLocked
      };
    } catch (error) {
      console.error('Error unlocking balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== WALLET TRANSFERS ====================

  async transferToTradingWallet(userId: string, asset: string, amount: number): Promise<BalanceResult> {
    try {
      // Check funding wallet balance
      const fundingBalance = await this.getBalance(userId, asset);
      if (fundingBalance < amount) {
        throw new Error(`Insufficient ${asset} balance in funding wallet`);
      }

      // Deduct from funding wallet
      const deductResult = await this.deductBalance({
        userId,
        asset,
        amount,
        reference: `transfer_to_trading_${Date.now()}`,
        type: 'transfer',
        metadata: { direction: 'funding_to_trading' }
      });

      if (!deductResult.success) {
        throw new Error(deductResult.error || 'Failed to deduct from funding wallet');
      }

      // Add to trading wallet (we'll use a separate table or flag)
      await supabase
        .from('wallet_balances')
        .upsert({
          user_id: userId,
          asset: `${asset}_TRADING`, // Prefix to identify trading wallet
          available: amount,
          locked: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,asset' });

      return {
        success: true,
        newAvailable: deductResult.newAvailable,
        transactionId: `transfer_${Date.now()}`
      };

    } catch (error) {
      console.error('Failed to transfer to trading wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async transferToFundingWallet(userId: string, asset: string, amount: number): Promise<BalanceResult> {
    try {
      // Check trading wallet balance
      const { data: tradingBalance } = await supabase
        .from('wallet_balances')
        .select('available')
        .eq('user_id', userId)
        .eq('asset', `${asset}_TRADING`)
        .maybeSingle();

      const available = Number(tradingBalance?.available) || 0;
      if (available < amount) {
        throw new Error(`Insufficient ${asset} balance in trading wallet`);
      }

      // Deduct from trading wallet
      const newTradingBalance = available - amount;
      await supabase
        .from('wallet_balances')
        .update({
          available: newTradingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset', `${asset}_TRADING`);

      // Add to funding wallet
      const addResult = await this.addBalance({
        userId,
        asset,
        amount,
        reference: `transfer_from_trading_${Date.now()}`,
        type: 'transfer',
        metadata: { direction: 'trading_to_funding' }
      });

      if (!addResult.success) {
        throw new Error(addResult.error || 'Failed to add to funding wallet');
      }

      return {
        success: true,
        newAvailable: addResult.newAvailable,
        transactionId: `transfer_${Date.now()}`
      };

    } catch (error) {
      console.error('Failed to transfer to funding wallet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getTradingWalletBalance(userId: string, asset: string): Promise<number> {
    const { data } = await supabase
      .from('wallet_balances')
      .select('available')
      .eq('user_id', userId)
      .eq('asset', `${asset}_TRADING`)
      .maybeSingle();

    return Number(data?.available) || 0;
  }

  async getTradingBalances(userId: string): Promise<Record<string, { available: number; locked: number; total: number }>> {
    try {
      // Get from wallet_balances for any dedicated trading wallet entries only
      const { data: balances } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .like('asset', '%_TRADING');
      
      const trading: Record<string, { available: number; locked: number; total: number }> = {};
      
      // Process trading-specific balances only (no mock data)
      if (balances) {
        balances.forEach(b => {
          const baseAsset = b.asset.replace('_TRADING', '');
          trading[baseAsset] = {
            available: b.available,
            locked: b.locked || 0,
            total: b.available + (b.locked || 0)
          };
        });
      }
      
      // No mock trading balances - only show real transferred amounts
      return trading;
    } catch (error) {
      console.error('Error getting trading balances:', error);
      return {};
    }
  }

  async getFundingWalletBalance(userId: string, asset: string): Promise<number> {
    return await this.getBalance(userId, asset);
  }

  // ==================== REFRESH ALL DATA ====================

  async refreshAllWalletData(userId: string): Promise<{
    balances: Record<string, WalletBalance>;
    locks: TradingLock[];
    stats: { activeLocks: number; totalLockedAmount: number; locksByAsset: Record<string, number> };
  }> {
    // Single optimized query to get all balance data at once
    const { data: allBalances } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId);

    // Single query to get all locks
    const { data: locks } = await supabase
      .from('trading_locks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'locked');

    // Get wallet info for deposit addresses
    const { data: wallets } = await supabase
      .from('wallets')
      .select('currency, deposit_address, is_active')
      .eq('user_id', userId);

    // Process all data in memory
    const balances: Record<string, WalletBalance> = {};
    const stats = { 
      activeLocks: locks?.length || 0, 
      totalLockedAmount: 0, 
      locksByAsset: {} as Record<string, number> 
    };

    // Process balances
    if (allBalances) {
      allBalances.forEach(b => {
        const wallet = wallets?.find(w => w.currency === b.asset);
        balances[b.asset] = {
          asset: b.asset,
          available: Number(b.available) || 0,
          locked: Number(b.locked) || 0,
          total: (Number(b.available) || 0) + (Number(b.locked) || 0),
          depositAddress: wallet?.deposit_address,
          isActive: wallet?.is_active,
          updatedAt: b.updated_at
        };
      });
    }

    // Process locks and update stats
    if (locks) {
      locks.forEach(lock => {
        stats.totalLockedAmount += lock.amount;
        stats.locksByAsset[lock.asset] = (stats.locksByAsset[lock.asset] || 0) + lock.amount;
      });
    }

    return {
      balances,
      locks: locks || [],
      stats
    };
  }
}

export const unifiedWalletService = new UnifiedWalletService();
