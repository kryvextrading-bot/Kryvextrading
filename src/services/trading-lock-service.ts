import { supabase } from '@/lib/supabase';

// ==================== TYPES ====================

export interface TradingLockRequest {
  userId: string;
  asset: string;
  amount: number;
  lockType: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  referenceId: string;
  expiresMinutes?: number;
}

export interface TradingLockResult {
  success: boolean;
  lockId?: string;
  lockedAmount?: number;
  expiresAt?: string;
  remainingAvailable?: number;
  totalLocked?: number;
  error?: string;
}

export interface TradingLockInfo {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  lockType: string;
  referenceId: string;
  status: 'locked' | 'released' | 'expired' | 'failed';
  createdAt: string;
  expiresAt: string;
  releasedAt?: string;
  metadata?: any;
}

export interface ReleaseLockRequest {
  lockId: string;
  releaseAmount?: number;
  success?: boolean;
  reason?: string;
}

export interface ReleaseLockResult {
  success: boolean;
  lockId?: string;
  releasedAmount?: number;
  remainingLocked?: number;
  status?: string;
  error?: string;
}

export interface UserLockedBalance {
  userId: string;
  totalLocked: number;
  activeLocks: number;
  locks?: TradingLockInfo[];
  locksByAsset?: Record<string, { lockedAmount: number; lockCount: number }>;
}

// ==================== TRADING LOCK SERVICE ====================

class TradingLockService {
  // ==================== LOCK OPERATIONS ====================
  
  /**
   * Lock balance for trading
   */
  async lockBalance(request: TradingLockRequest): Promise<TradingLockResult> {
    try {
      const result = await supabase.rpc('lock_trading_balance', {
        p_user_id: request.userId,
        p_asset: request.asset,
        p_amount: request.amount,
        p_lock_type: request.lockType,
        p_reference_id: request.referenceId,
        p_expires_minutes: request.expiresMinutes || 30
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as TradingLockResult;
    } catch (error) {
      console.error('Error locking balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release trading lock
   */
  async releaseLock(request: ReleaseLockRequest): Promise<ReleaseLockResult> {
    try {
      const result = await supabase.rpc('release_trading_lock', {
        p_lock_id: request.lockId,
        p_release_amount: request.releaseAmount,
        p_success: request.success !== false,
        p_reason: request.reason || 'trade_completed'
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as ReleaseLockResult;
    } catch (error) {
      console.error('Error releasing lock:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== QUERY OPERATIONS ====================
  
  /**
   * Get user's locked balances
   */
  async getUserLockedBalance(userId: string, asset?: string): Promise<UserLockedBalance> {
    try {
      const result = await supabase.rpc('get_user_locked_balance', {
        p_user_id: userId,
        p_asset: asset || null
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as UserLockedBalance;
    } catch (error) {
      console.error('Error getting locked balance:', error);
      return {
        userId,
        totalLocked: 0,
        activeLocks: 0
      };
    }
  }

  /**
   * Get user's active locks
   */
  async getUserActiveLocks(userId: string, limit: number = 50): Promise<TradingLockInfo[]> {
    try {
      const { data, error } = await supabase
        .from('trading_locks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'locked')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active locks:', error);
      return [];
    }
  }

  /**
   * Get lock by reference ID
   */
  async getLockByReference(referenceId: string): Promise<TradingLockInfo | null> {
    try {
      const { data, error } = await supabase
        .from('trading_locks')
        .select('*')
        .eq('reference_id', referenceId)
        .eq('status', 'locked')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting lock by reference:', error);
      return null;
    }
  }

  // ==================== BATCH OPERATIONS ====================
  
  /**
   * Lock multiple balances for batch operations
   */
  async lockMultipleBalances(requests: TradingLockRequest[]): Promise<TradingLockResult[]> {
    const results: TradingLockResult[] = [];
    
    for (const request of requests) {
      const result = await this.lockBalance(request);
      results.push(result);
      
      // If any lock fails, release all previously locked balances
      if (!result.success && results.length > 0) {
        await this.releaseMultipleLocks(
          results
            .filter(r => r.success)
            .map(r => ({ lockId: r.lockId!, success: false, reason: 'batch_failed' }))
        );
        return results;
      }
    }
    
    return results;
  }

  /**
   * Release multiple locks
   */
  async releaseMultipleLocks(requests: ReleaseLockRequest[]): Promise<ReleaseLockResult[]> {
    const results: ReleaseLockResult[] = [];
    
    for (const request of requests) {
      const result = await this.releaseLock(request);
      results.push(result);
    }
    
    return results;
  }

  // ==================== VALIDATION OPERATIONS ====================
  
  /**
   * Check if user has sufficient balance for trade
   */
  async hasSufficientBalance(userId: string, asset: string, amount: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('available')
        .eq('user_id', userId)
        .eq('asset', asset)
        .single();

      if (error) throw error;
      return (data?.available || 0) >= amount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Check if user has sufficient available balance (excluding locked funds)
   */
  async hasSufficientAvailableBalance(userId: string, asset: string, amount: number): Promise<boolean> {
    const lockedBalance = await this.getUserLockedBalance(userId, asset);
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('available')
      .eq('user_id', userId)
      .eq('asset', asset)
      .single();

    if (error) throw error;
    const availableBalance = (data?.available || 0) - (lockedBalance.totalLocked || 0);
    return availableBalance >= amount;
  }

  // ==================== MONITORING OPERATIONS ====================
  
  /**
   * Get active locks for monitoring
   */
  async getActiveLocks(limit: number = 100): Promise<TradingLockInfo[]> {
    try {
      const { data, error } = await supabase
        .from('active_trading_locks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active locks:', error);
      return [];
    }
  }

  /**
   * Get lock statistics
   */
  async getLockStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lock_summary_by_asset')
        .select('*')
        .order('total_locked_amount', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting lock statistics:', error);
      return [];
    }
  }

  // ==================== MAINTENANCE OPERATIONS ====================
  
  /**
   * Clean up expired locks
   */
  async cleanupExpiredLocks(): Promise<number> {
    try {
      const result = await supabase.rpc('cleanup_expired_locks');
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as number;
    } catch (error) {
      console.error('Error cleaning up expired locks:', error);
      return 0;
    }
  }

  // ==================== UTILITY METHODS ====================
  
  /**
   * Format lock duration
   */
  formatLockDuration(expiresAt: string): string {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }

  /**
   * Check if lock is expiring soon
   */
  isLockExpiringSoon(expiresAt: string, thresholdMinutes: number = 5): boolean {
    const now = new Date();
    const expires = new Date(expiresAt);
    const thresholdTime = new Date(now.getTime() + thresholdMinutes * 60 * 1000);
    
    return expires <= thresholdTime;
  }

  /**
   * Calculate lock utilization
   */
  calculateLockUtilization(userId: string): Promise<number> {
    return this.getUserLockedBalance(userId).then(locked => {
      // This would need total balance calculation
      return locked.totalLocked > 0 ? 
        (locked.totalLocked / (locked.totalLocked + 10000)) * 100 : 0; // Assuming 10000 base balance
    });
  }
}

export const tradingLockService = new TradingLockService();

// ==================== HELPER FUNCTIONS ====================

/**
 * Create lock reference ID
 */
export function createLockReferenceId(tradeType: string, symbol: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${tradeType}_${symbol}_${timestamp}_${random}`;
}

/**
 * Validate lock request
 */
export function validateLockRequest(request: TradingLockRequest): string[] {
  const errors: string[] = [];
  
  if (!request.userId) errors.push('User ID is required');
  if (!request.asset) errors.push('Asset is required');
  if (!request.amount || request.amount <= 0) errors.push('Amount must be positive');
  if (!request.lockType) errors.push('Lock type is required');
  if (!request.referenceId) errors.push('Reference ID is required');
  
  const validTypes = ['spot', 'futures', 'options', 'arbitrage', 'staking'];
  if (!validTypes.includes(request.lockType)) {
    errors.push('Invalid lock type');
  }
  
  return errors;
}

/**
 * Calculate lock expiration time
 */
export function calculateLockExpiration(lockType: string, customMinutes?: number): Date {
  const now = new Date();
  const defaultDurations = {
    spot: 30,      // 30 minutes
    futures: 60,    // 1 hour
    options: 45,   // 45 minutes
    arbitrage: 120, // 2 hours
    staking: 1440  // 24 hours
  };
  
  const minutes = customMinutes || defaultDurations[lockType as keyof typeof defaultDurations] || 30;
  return new Date(now.getTime() + minutes * 60 * 1000);
}

export default tradingLockService;
