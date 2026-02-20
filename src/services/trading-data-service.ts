import { supabase } from '@/lib/supabase';

// ==================== TYPES ====================

export interface TradingLock {
  id: string;
  user_id: string;
  asset: string;
  amount: number;
  lock_type: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  reference_id: string;
  status: 'locked' | 'released' | 'expired' | 'failed';
  created_at: string;
  expires_at: string;
  released_at?: string;
  metadata?: any;
}

export interface ArbitrageContract {
  id: string;
  user_id: string;
  product_id: string;
  product_label: string;
  amount: number;
  duration: number;
  apy: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  expires_at: string;
  completed_at?: string;
  profit_amount: number;
  actual_apy: number;
  metadata?: any;
}

export interface ArbitrageLock {
  id: string;
  contract_id: string;
  user_id: string;
  asset: string;
  amount: number;
  lock_type: 'investment' | 'profit_release' | 'refund';
  reference_id: string;
  status: 'locked' | 'released' | 'expired' | 'failed';
  created_at: string;
  expires_at: string;
  released_at?: string;
  metadata?: any;
}

export interface TradingStats {
  activeLocks: number;
  totalLockedAmount: number;
  totalLockedByAsset: Record<string, number>;
}

export interface ArbitrageStats {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
  expiredContracts: number;
  totalInvested: number;
  totalProfit: number;
  averageApy: number;
  averageActualApy: number;
  uniqueUsers: number;
}

// ==================== TRADING DATA SERVICE ====================

class TradingDataService {
  // ==================== TRADING LOCKS ====================
  
  async getUserTradingLocks(userId: string, status?: string): Promise<TradingLock[]> {
    try {
      let query = supabase
        .from('trading_locks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching trading locks:', error);
      return [];
    }
  }

  async getActiveTradingLocks(userId: string): Promise<TradingLock[]> {
    return this.getUserTradingLocks(userId, 'locked');
  }

  async getTradingStats(userId?: string): Promise<TradingStats> {
    try {
      let query = supabase
        .from('trading_locks')
        .select('status, amount, asset, expires_at');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const locks = data || [];
      const activeLocks = locks.filter(l => l.status === 'locked' && new Date(l.expires_at) > new Date());
      
      const totalLockedAmount = activeLocks.reduce((sum, lock) => sum + lock.amount, 0);
      const totalLockedByAsset = activeLocks.reduce((acc, lock) => {
        acc[lock.asset] = (acc[lock.asset] || 0) + lock.amount;
        return acc;
      }, {} as Record<string, number>);
      
      return {
        activeLocks: activeLocks.length,
        totalLockedAmount,
        totalLockedByAsset
      };
    } catch (error) {
      console.error('Error fetching trading stats:', error);
      return {
        activeLocks: 0,
        totalLockedAmount: 0,
        totalLockedByAsset: {}
      };
    }
  }

  // ==================== ARBITRAGE CONTRACTS ====================
  
  async getUserArbitrageContracts(userId: string, status?: string): Promise<ArbitrageContract[]> {
    try {
      let query = supabase
        .from('arbitrage_contracts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching arbitrage contracts:', error);
      return [];
    }
  }

  async getActiveArbitrageContracts(userId: string): Promise<ArbitrageContract[]> {
    return this.getUserArbitrageContracts(userId, 'active');
  }

  async getArbitrageStats(userId?: string): Promise<ArbitrageStats> {
    try {
      let query = supabase
        .from('arbitrage_contracts')
        .select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const contracts = data || [];
      
      const stats: ArbitrageStats = {
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        completedContracts: contracts.filter(c => c.status === 'completed').length,
        cancelledContracts: contracts.filter(c => c.status === 'cancelled').length,
        expiredContracts: contracts.filter(c => c.status === 'expired').length,
        totalInvested: contracts.reduce((sum, c) => sum + c.amount, 0),
        totalProfit: contracts.reduce((sum, c) => sum + c.profit_amount, 0),
        averageApy: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.apy, 0) / contracts.length : 0,
        averageActualApy: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.actual_apy, 0) / contracts.length : 0,
        uniqueUsers: new Set(contracts.map(c => c.user_id)).size
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching arbitrage stats:', error);
      return {
        totalContracts: 0,
        activeContracts: 0,
        completedContracts: 0,
        cancelledContracts: 0,
        expiredContracts: 0,
        totalInvested: 0,
        totalProfit: 0,
        averageApy: 0,
        averageActualApy: 0,
        uniqueUsers: 0
      };
    }
  }

  // ==================== COMBINED DATA ====================
  
  async getUserDashboardData(userId: string): Promise<{
    tradingStats: TradingStats;
    arbitrageStats: ArbitrageStats;
    recentTradingLocks: TradingLock[];
    recentArbitrageContracts: ArbitrageContract[];
  }> {
    try {
      const [tradingStats, arbitrageStats, recentTradingLocks, recentArbitrageContracts] = await Promise.all([
        this.getTradingStats(userId),
        this.getArbitrageStats(userId),
        this.getUserTradingLocks(userId, 'locked').then(locks => locks.slice(0, 5)),
        this.getUserArbitrageContracts(userId, 'active').then(contracts => contracts.slice(0, 5))
      ]);
      
      return {
        tradingStats,
        arbitrageStats,
        recentTradingLocks,
        recentArbitrageContracts
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        tradingStats: { activeLocks: 0, totalLockedAmount: 0, totalLockedByAsset: {} },
        arbitrageStats: { totalContracts: 0, activeContracts: 0, completedContracts: 0, cancelledContracts: 0, expiredContracts: 0, totalInvested: 0, totalProfit: 0, averageApy: 0, averageActualApy: 0, uniqueUsers: 0 },
        recentTradingLocks: [],
        recentArbitrageContracts: []
      };
    }
  }

  // ==================== UTILITY METHODS ====================
  
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

  calculateTimeRemaining(expiresAt: string): {
    totalMs: number;
    totalMinutes: number;
    totalHours: number;
    totalDays: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    return {
      totalMs: diffMs,
      totalMinutes: Math.max(0, Math.floor(diffMs / (1000 * 60))),
      totalHours: Math.max(0, Math.floor(diffMs / (1000 * 60 * 60))),
      totalDays: Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24))),
      isExpired: diffMs <= 0
    };
  }

  calculateArbitrageProfit(contract: ArbitrageContract): number {
    return contract.profit_amount || 0;
  }

  calculateArbitrageROI(contract: ArbitrageContract): number {
    if (contract.amount === 0) return 0;
    return (contract.profit_amount / contract.amount) * 100;
  }

  // ==================== ADMIN METHODS ====================
  
  async getAllTradingLocks(status?: string): Promise<TradingLock[]> {
    try {
      let query = supabase
        .from('trading_locks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all trading locks:', error);
      return [];
    }
  }

  async getAllArbitrageContracts(status?: string): Promise<ArbitrageContract[]> {
    try {
      let query = supabase
        .from('arbitrage_contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all arbitrage contracts:', error);
      return [];
    }
  }

  async getSystemStats(): Promise<{
    tradingStats: TradingStats;
    arbitrageStats: ArbitrageStats;
  }> {
    try {
      const [tradingStats, arbitrageStats] = await Promise.all([
        this.getTradingStats(),
        this.getArbitrageStats()
      ]);
      
      return { tradingStats, arbitrageStats };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return {
        tradingStats: { activeLocks: 0, totalLockedAmount: 0, totalLockedByAsset: {} },
        arbitrageStats: { totalContracts: 0, activeContracts: 0, completedContracts: 0, cancelledContracts: 0, expiredContracts: 0, totalInvested: 0, totalProfit: 0, averageApy: 0, averageActualApy: 0, uniqueUsers: 0 }
      };
    }
  }
}

export const tradingDataService = new TradingDataService();
