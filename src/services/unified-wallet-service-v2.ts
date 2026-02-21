/**
 * Comprehensive Unified Wallet Service
 * Implements the flow: FUNDING → TRADING → LOCKS for different trading types
 */

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface WalletBalances {
  funding: { [asset: string]: number };
  trading: { [asset: string]: number };
  locked: { [asset: string]: number };
}

export interface WalletTransaction {
  id: string;
  userId: string;
  asset: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'lock' | 'release' | 'profit' | 'loss';
  subtype?: string;
  amount: number;
  balanceAfter: number;
  reference?: string;
  metadata?: any;
  createdAt: string;
}

export interface TradingLock {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  lockType: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  referenceId: string;
  status: 'locked' | 'released' | 'expired';
  expiresAt: string;
  createdAt: string;
  releasedAt?: string;
  metadata?: any;
}

export interface BalanceResult {
  success: boolean;
  error?: string;
  newFundingBalance?: number;
  newTradingBalance?: number;
  newLockedBalance?: number;
  transactionId?: string;
  lockId?: string;
}

class UnifiedWalletService {
  private balanceCache = new Map<string, { data: WalletBalances; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds cache

  /**
   * Get all wallet balances for a user
   */
  async getBalances(userId: string): Promise<WalletBalances> {
    try {
      // Check cache first
      const cacheKey = `balances_${userId}`;
      const cached = this.balanceCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      // Get wallet balances
      const { data: wallets, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Get active locks
      const { data: locks, error: lockError } = await supabase
        .from('trading_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'locked');

      if (lockError) throw lockError;

      // Calculate balances
      const funding: { [asset: string]: number } = {};
      const trading: { [asset: string]: number } = {};
      const locked: { [asset: string]: number } = {};

      wallets?.forEach(wallet => {
        // Try new columns first, fallback to old ones
        const fundingVal = Number(wallet.funding_balance || wallet.available || 0);
        const tradingVal = Number(wallet.trading_balance || 0);
        
        funding[wallet.asset] = fundingVal;
        trading[wallet.asset] = tradingVal;
        
        console.log(`💰 Wallet ${wallet.asset}: funding=${fundingVal}, trading=${tradingVal}`);
      });

      // Calculate locked amounts
      locks?.forEach(lock => {
        if (!locked[lock.asset]) locked[lock.asset] = 0;
        locked[lock.asset] += Number(lock.amount);
      });

      const result = { funding, trading, locked };
      
      console.log('📊 Service returning balances:', { 
        funding, 
        trading, 
        locked, 
        tradingTypes: Object.keys(trading).map(k => ({ asset: k, value: trading[k], type: typeof trading[k] }))
      });
      
      // Cache the result
      this.balanceCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error getting balances:', error);
      
      // Return empty balances on error
      return {
        funding: {},
        trading: {},
        locked: {}
      };
    }
  }

  /**
   * Transfer from funding to trading wallet
   */
  async transferToTrading(
    userId: string,
    asset: string,
    amount: number,
    reference: string
  ): Promise<BalanceResult> {
    try {
      console.log('💸 Transferring to trading:', { userId, asset, amount, reference });

      // Get current wallet
      const { data: wallet, error: fetchError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('asset', asset)
        .single();

      if (fetchError) {
        // Create wallet if it doesn't exist
        if (fetchError.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from('wallet_balances')
            .insert({
              user_id: userId,
              asset,
              funding_balance: 0,
              trading_balance: 0,
              total_locked: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (createError) throw createError;
          
          // Try fetching again
          const { data: newWallet, error: refetchError } = await supabase
            .from('wallet_balances')
            .select('*')
            .eq('user_id', userId)
            .eq('asset', asset)
            .single();
            
          if (refetchError) throw refetchError;
          
          return this.transferToTrading(userId, asset, amount, reference);
        }
        throw fetchError;
      }

      const currentFunding = Number(wallet.funding_balance || wallet.available || 0);
      const currentTrading = Number(wallet.trading_balance || 0);

      // Check if funding has enough balance
      if (currentFunding < amount) {
        return { 
          success: false, 
          error: `Insufficient funding balance. Available: ${currentFunding.toFixed(2)} ${asset}` 
        };
      }

      // Update balances - try new columns first, fallback to updating both
      const newFundingBalance = currentFunding - amount;
      const newTradingBalance = currentTrading + amount;
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Use new columns if they exist, otherwise update old ones
      if (wallet.funding_balance !== undefined) {
        updateData.funding_balance = newFundingBalance;
        updateData.trading_balance = newTradingBalance;
      } else {
        updateData.available = newFundingBalance;
      }

      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update(updateData)
        .eq('user_id', userId)
        .eq('asset', asset);

      if (updateError) throw updateError;

      // Record funding transaction (debit)
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          asset,
          type: 'transfer',
          subtype: 'funding_to_trading',
          amount: -amount,
          balance_after: newFundingBalance,
          reference,
          metadata: { from: 'funding', to: 'trading' },
          created_at: new Date().toISOString()
        });

      // Record trading transaction (credit)
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          asset,
          type: 'transfer',
          subtype: 'funding_to_trading',
          amount: amount,
          balance_after: newTradingBalance,
          reference,
          metadata: { from: 'funding', to: 'trading' },
          created_at: new Date().toISOString()
        });

      // Invalidate cache
      this.balanceCache.delete(`balances_${userId}`);

      console.log('✅ Transfer successful:', { newFundingBalance, newTradingBalance });

      return { 
        success: true, 
        newFundingBalance, 
        newTradingBalance 
      };
    } catch (error) {
      console.error('Error transferring to trading:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Transfer from trading to funding wallet (withdrawable)
   */
  async transferToFunding(
    userId: string,
    asset: string,
    amount: number,
    reference: string
  ): Promise<BalanceResult> {
    try {
      console.log('💸 Transferring to funding:', { userId, asset, amount, reference });

      const { data: wallet, error: fetchError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('asset', asset)
        .single();

      if (fetchError) throw fetchError;

      const currentTrading = Number(wallet.trading_balance || 0);
      const currentFunding = Number(wallet.funding_balance || 0);

      // Check if trading has enough balance
      if (currentTrading < amount) {
        return { 
          success: false, 
          error: `Insufficient trading balance. Available: ${currentTrading.toFixed(2)} ${asset}` 
        };
      }

      // Update balances
      const newTradingBalance = currentTrading - amount;
      const newFundingBalance = currentFunding + amount;

      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({
          trading_balance: newTradingBalance,
          funding_balance: newFundingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset', asset);

      if (updateError) throw updateError;

      // Record transactions
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          asset,
          type: 'transfer',
          subtype: 'trading_to_funding',
          amount: -amount,
          balance_after: newTradingBalance,
          reference,
          metadata: { from: 'trading', to: 'funding' },
          created_at: new Date().toISOString()
        });

      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          asset,
          type: 'transfer',
          subtype: 'trading_to_funding',
          amount: amount,
          balance_after: newFundingBalance,
          reference,
          metadata: { from: 'trading', to: 'funding' },
          created_at: new Date().toISOString()
        });

      // Invalidate cache
      this.balanceCache.delete(`balances_${userId}`);

      console.log('✅ Transfer to funding successful:', { newTradingBalance, newFundingBalance });

      return { 
        success: true, 
        newTradingBalance, 
        newFundingBalance 
      };
    } catch (error) {
      console.error('Error transferring to funding:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Lock funds for trading (spot, futures, options, arbitrage, staking)
   */
  async lockFunds(
    userId: string,
    asset: string,
    amount: number,
    lockType: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking',
    referenceId: string,
    duration: number, // in seconds
    metadata: any = {}
  ): Promise<BalanceResult> {
    try {
      console.log('🔒 Locking funds:', { userId, asset, amount, lockType, referenceId });

      // Check if trading balance has enough
      const { data: wallet, error: fetchError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('asset', asset)
        .single();

      if (fetchError) throw fetchError;

      const currentTrading = Number(wallet.trading_balance || 0);

      if (currentTrading < amount) {
        return { 
          success: false, 
          error: `Insufficient trading balance. Available: ${currentTrading.toFixed(2)} ${asset}` 
        };
      }

      const startTime = new Date();
      const expiresAt = new Date(startTime.getTime() + duration * 1000);

      // Create lock
      const { data: lock, error: lockError } = await supabase
        .from('trading_locks')
        .insert({
          user_id: userId,
          asset,
          amount,
          lock_type: lockType,
          reference_id: referenceId,
          status: 'locked',
          expires_at: expiresAt.toISOString(),
          metadata: {
            ...metadata,
            startTime: startTime.toISOString()
          }
        })
        .select()
        .single();

      if (lockError) throw lockError;

      // Update trading balance (funds are now locked)
      const newTradingBalance = currentTrading - amount;

      const { error: updateError } = await supabase
        .from('wallet_balances')
        .update({
          trading_balance: newTradingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('asset', asset);

      if (updateError) throw updateError;

      // Record lock transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          asset,
          type: 'lock',
          subtype: lockType,
          amount: -amount,
          balance_after: newTradingBalance,
          reference: referenceId,
          metadata: {
            lockId: lock.id,
            expiresAt: expiresAt.toISOString(),
            ...metadata
          },
          created_at: new Date().toISOString()
        });

      // Invalidate cache
      this.balanceCache.delete(`balances_${userId}`);

      console.log('✅ Funds locked successfully:', { lockId: lock.id, newTradingBalance });

      return { success: true, lockId: lock.id };
    } catch (error) {
      console.error('Error locking funds:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Release locked funds (after trade completion)
   */
  async releaseFunds(
    userId: string,
    referenceId: string,
    outcome: 'win' | 'loss',
    profit?: number
  ): Promise<BalanceResult> {
    try {
      console.log('🔓 Releasing funds:', { userId, referenceId, outcome, profit });

      // Get the lock
      const { data: lock, error: lockError } = await supabase
        .from('trading_locks')
        .select('*')
        .eq('reference_id', referenceId)
        .eq('status', 'locked')
        .single();

      if (lockError) throw lockError;

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('asset', lock.asset)
        .single();

      if (walletError) throw walletError;

      // Calculate amount to return
      let returnAmount = 0;
      if (outcome === 'win') {
        returnAmount = Number(lock.amount) + (profit || 0); // Return stake + profit
      } else {
        returnAmount = 0; // Loss - nothing to return
      }

      // Update lock status
      const { error: updateLockError } = await supabase
        .from('trading_locks')
        .update({
          status: 'released',
          released_at: new Date().toISOString(),
          metadata: {
            ...lock.metadata,
            outcome,
            profit: profit || 0,
            releasedAt: new Date().toISOString()
          }
        })
        .eq('id', lock.id);

      if (updateLockError) throw updateLockError;

      let newTradingBalance = Number(wallet.trading_balance || 0);

      // Only update balance if there's something to return (win)
      if (returnAmount > 0) {
        newTradingBalance += returnAmount;

        const { error: updateError } = await supabase
          .from('wallet_balances')
          .update({
            trading_balance: newTradingBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('asset', lock.asset);

        if (updateError) throw updateError;

        // Record release transaction
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            asset: lock.asset,
            type: 'release',
            subtype: outcome,
            amount: returnAmount,
            balance_after: newTradingBalance,
            reference: referenceId,
            metadata: {
              lockId: lock.id,
              stake: lock.amount,
              profit: profit || 0,
              outcome
            },
            created_at: new Date().toISOString()
          });
      } else {
        // Record loss transaction (no balance change)
        await supabase
          .from('wallet_transactions')
          .insert({
            user_id: userId,
            asset: lock.asset,
            type: 'release',
            subtype: 'loss',
            amount: 0,
            balance_after: newTradingBalance,
            reference: referenceId,
            metadata: {
              lockId: lock.id,
              stake: lock.amount,
              outcome: 'loss'
            },
            created_at: new Date().toISOString()
          });
      }

      // Invalidate cache
      this.balanceCache.delete(`balances_${userId}`);

      console.log('✅ Funds released successfully:', { outcome, returnAmount, newTradingBalance });

      return { 
        success: true, 
        outcome, 
        returnAmount,
        newTradingBalance
      };
    } catch (error) {
      console.error('Error releasing funds:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all active locks for a user
   */
  async getActiveLocks(userId: string): Promise<TradingLock[]> {
    try {
      const { data, error } = await supabase
        .from('trading_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'locked')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(lock => ({
        id: lock.id,
        userId: lock.user_id,
        asset: lock.asset,
        amount: Number(lock.amount),
        lockType: lock.lock_type as any,
        referenceId: lock.reference_id,
        status: lock.status as any,
        expiresAt: lock.expires_at,
        createdAt: lock.created_at,
        releasedAt: lock.released_at,
        metadata: lock.metadata
      }));
    } catch (error) {
      console.error('Error getting active locks:', error);
      return [];
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<WalletTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(tx => ({
        id: tx.id,
        userId: tx.user_id,
        asset: tx.asset,
        type: tx.type as any,
        subtype: tx.subtype,
        amount: Number(tx.amount),
        balanceAfter: Number(tx.balance_after),
        reference: tx.reference,
        metadata: tx.metadata,
        createdAt: tx.created_at
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for a user
   */
  invalidateCache(userId: string) {
    this.balanceCache.delete(`balances_${userId}`);
  }
}

export const unifiedWalletService = new UnifiedWalletService();
