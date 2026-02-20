import { supabase } from '@/lib/supabase';

// ==================== TYPES ====================

export interface ArbitrageInvestmentRequest {
  userId: string;
  productId: string;
  productLabel: string;
  amount: number;
  duration: number; // Duration in hours
  apy: number; // Annual Percentage Yield
  asset?: string;
}

export interface ArbitrageInvestmentResult {
  success: boolean;
  contractId?: string;
  lockId?: string;
  investedAmount?: number;
  durationHours?: number;
  apy?: number;
  expectedProfit?: number;
  expiresAt?: string;
  remainingAvailable?: number;
  totalLocked?: number;
  error?: string;
}

export interface ArbitrageContract {
  id: string;
  userId: string;
  productId: string;
  productLabel: string;
  amount: number;
  duration: number;
  apy: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  createdAt: string;
  expiresAt: string;
  completedAt?: string;
  profitAmount: number;
  actualApy: number;
  metadata?: any;
}

export interface ArbitrageCompletionRequest {
  contractId: string;
  finalProfit?: number;
  actualApy?: number;
  status?: 'completed' | 'cancelled';
}

export interface ArbitrageCompletionResult {
  success: boolean;
  contractId?: string;
  investmentAmount?: number;
  profitAmount?: number;
  totalReturn?: number;
  apy?: number;
  actualApy?: number;
  status?: string;
  completedAt?: string;
  error?: string;
}

export interface ArbitrageContractsResponse {
  userId: string;
  contracts: ArbitrageContract[];
  totalInvested: number;
  totalProfit: number;
  activeContracts: number;
  completedContracts: number;
  cancelledContracts: number;
}

// ==================== ARBITRAGE LOCK SERVICE ====================

class ArbitrageLockService {
  // ==================== INVESTMENT OPERATIONS ====================
  
  /**
   * Lock funds for arbitrage investment
   */
  async lockInvestment(request: ArbitrageInvestmentRequest): Promise<ArbitrageInvestmentResult> {
    try {
      const result = await supabase.rpc('lock_arbitrage_investment', {
        p_user_id: request.userId,
        p_product_id: request.productId,
        p_product_label: request.productLabel,
        p_amount: request.amount,
        p_duration: request.duration,
        p_apy: request.apy,
        p_asset: request.asset || 'USDT'
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as ArbitrageInvestmentResult;
    } catch (error) {
      console.error('Error locking arbitrage investment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Complete arbitrage contract
   */
  async completeContract(request: ArbitrageCompletionRequest): Promise<ArbitrageCompletionResult> {
    try {
      const result = await supabase.rpc('complete_arbitrage_contract', {
        p_contract_id: request.contractId,
        p_final_profit: request.finalProfit,
        p_actual_apy: request.actualApy,
        p_status: request.status || 'completed'
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as ArbitrageCompletionResult;
    } catch (error) {
      console.error('Error completing arbitrage contract:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cancel arbitrage contract
   */
  async cancelContract(contractId: string, reason: string = 'user_cancelled'): Promise<ArbitrageCompletionResult> {
    try {
      const result = await supabase.rpc('cancel_arbitrage_contract', {
        p_contract_id: contractId,
        p_reason: reason
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as ArbitrageCompletionResult;
    } catch (error) {
      console.error('Error cancelling arbitrage contract:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== QUERY OPERATIONS ====================
  
  /**
   * Get user's arbitrage contracts
   */
  async getUserContracts(userId: string, status?: string, limit: number = 50): Promise<ArbitrageContractsResponse> {
    try {
      const result = await supabase.rpc('get_user_arbitrage_contracts', {
        p_user_id: userId,
        p_status: status,
        p_limit: limit
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as ArbitrageContractsResponse;
    } catch (error) {
      console.error('Error getting user contracts:', error);
      return {
        userId,
        contracts: [],
        totalInvested: 0,
        totalProfit: 0,
        activeContracts: 0,
        completedContracts: 0,
        cancelledContracts: 0
      };
    }
  }

  /**
   * Get active arbitrage contracts
   */
  async getActiveContracts(limit: number = 100): Promise<ArbitrageContract[]> {
    try {
      const { data, error } = await supabase
        .from('active_arbitrage_contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active contracts:', error);
      return [];
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string): Promise<ArbitrageContract | null> {
    try {
      const { data, error } = await supabase
        .from('arbitrage_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting contract by ID:', error);
      return null;
    }
  }

  // ==================== VALIDATION OPERATIONS ====================
  
  /**
   * Validate investment request
   */
  validateInvestmentRequest(request: ArbitrageInvestmentRequest): string[] {
    const errors: string[] = [];
    
    if (!request.userId) errors.push('User ID is required');
    if (!request.productId) errors.push('Product ID is required');
    if (!request.productLabel) errors.push('Product label is required');
    if (!request.amount || request.amount <= 0) errors.push('Amount must be positive');
    if (!request.duration || request.duration <= 0 || request.duration > 8760) errors.push('Duration must be 1-8760 hours');
    if (!request.apy || request.apy <= 0 || request.apy > 100) errors.push('APY must be 0-100%');
    
    return errors;
  }

  /**
   * Check if user has sufficient balance for investment
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

  // ==================== CALCULATION OPERATIONS ====================
  
  /**
   * Calculate expected profit
   */
  calculateExpectedProfit(amount: number, apy: number, durationHours: number): number {
    return amount * (apy / 100) * (durationHours / 8760);
  }

  /**
   * Calculate actual APY
   */
  calculateActualApy(investment: number, profit: number, durationHours: number): number {
    return (profit / investment) * (8760 / durationHours) * 100;
  }

  /**
   * Calculate time remaining
   */
  calculateTimeRemaining(expiresAt: string): {
    days: number;
    hours: number;
    minutes: number;
    totalMinutes: number;
    isExpired: boolean;
  } {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    const isExpired = diffMs <= 0;
    const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
    
    return {
      days: Math.floor(totalMinutes / (60 * 24)),
      hours: Math.floor((totalMinutes % (60 * 24)) / 60),
      minutes: totalMinutes % 60,
      totalMinutes,
      isExpired
    };
  }

  // ==================== MONITORING OPERATIONS ====================
  
  /**
   * Get arbitrage summary statistics
   */
  async getArbitrageSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('arbitrage_summary')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting arbitrage summary:', error);
      return null;
    }
  }

  /**
   * Get contract performance metrics
   */
  async getPerformanceMetrics(userId?: string): Promise<any> {
    try {
      let query = supabase
        .from('arbitrage_contracts')
        .select('status', 'amount', 'profit_amount', 'apy', 'actual_apy', 'duration');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const contracts = data || [];
      
      return {
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
        completedContracts: contracts.filter(c => c.status === 'completed').length,
        cancelledContracts: contracts.filter(c => c.status === 'cancelled').length,
        totalInvested: contracts.reduce((sum, c) => sum + c.amount, 0),
        totalProfit: contracts.reduce((sum, c) => sum + c.profit_amount, 0),
        averageApy: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.apy, 0) / contracts.length : 0,
        averageActualApy: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.actual_apy, 0) / contracts.length : 0,
        averageDuration: contracts.length > 0 ? contracts.reduce((sum, c) => sum + c.duration, 0) / contracts.length : 0,
        profitRate: contracts.length > 0 ? (contracts.reduce((sum, c) => sum + c.profit_amount, 0) / contracts.reduce((sum, c) => sum + c.amount, 0)) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return null;
    }
  }

  // ==================== MAINTENANCE OPERATIONS ====================
  
  /**
   * Clean up expired contracts
   */
  async cleanupExpiredContracts(): Promise<number> {
    try {
      const result = await supabase.rpc('cleanup_expired_arbitrage');
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.data as number;
    } catch (error) {
      console.error('Error cleaning up expired contracts:', error);
      return 0;
    }
  }

  // ==================== BATCH OPERATIONS ====================
  
  /**
   * Get contracts expiring soon
   */
  async getContractsExpiringSoon(hoursThreshold: number = 24, limit: number = 50): Promise<ArbitrageContract[]> {
    try {
      const thresholdTime = new Date(Date.now() + hoursThreshold * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('arbitrage_contracts')
        .select('*')
        .eq('status', 'active')
        .lte('expires_at', thresholdTime.toISOString())
        .order('expires_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting contracts expiring soon:', error);
      return [];
    }
  }

  /**
   * Get user's investment portfolio
   */
  async getUserInvestmentPortfolio(userId: string): Promise<any> {
    try {
      const contracts = await this.getUserContracts(userId);
      
      const portfolio = contracts.contracts.map(contract => ({
        contractId: contract.id,
        productId: contract.productId,
        productLabel: contract.productLabel,
        amount: contract.amount,
        apy: contract.apy,
        actualApy: contract.actualApy,
        status: contract.status,
        createdAt: contract.createdAt,
        expiresAt: contract.expiresAt,
        profitAmount: contract.profitAmount,
        timeRemaining: this.calculateTimeRemaining(contract.expiresAt),
        expectedProfit: this.calculateExpectedProfit(contract.amount, contract.apy, contract.duration),
        isExpired: contract.expiresAt < new Date().toISOString(),
        daysActive: Math.floor((new Date().getTime() - new Date(contract.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      }));

      return {
        userId,
        portfolio,
        summary: {
          totalInvested: contracts.totalInvested,
          totalProfit: contracts.totalProfit,
          activeContracts: contracts.activeContracts,
          completedContracts: contracts.completedContracts,
          cancelledContracts: contracts.cancelledContracts,
          averageApy: contracts.contracts.length > 0 ? contracts.contracts.reduce((sum, c) => sum + c.apy, 0) / contracts.contracts.length : 0,
          profitRate: contracts.totalInvested > 0 ? (contracts.totalProfit / contracts.totalInvested) * 100 : 0
        }
      };
    } catch (error) {
      console.error('Error getting investment portfolio:', error);
      return { userId, portfolio: [], summary: {} };
    }
  }
}

export const arbitrageLockService = new ArbitrageLockService();

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate contract ID
 */
export function generateContractId(): string {
  return `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format contract duration
 */
export function formatDuration(hours: number): string {
  if (hours >= 8760) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  } else if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}

/**
 * Format profit amount
 */
export function formatProfit(amount: number, currency: string = 'USDT'): string {
  const formatted = amount.toFixed(2);
  return amount >= 0 ? `+${formatted} ${currency}` : `${formatted} ${currency}`;
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(investment: number, profit: number): number {
  if (investment === 0) return 0;
  return (profit / investment) * 100;
}

/**
 * Validate contract completion
 */
export function validateContractCompletion(contract: ArbitrageContract, finalProfit?: number): string[] {
  const errors: string[] = [];
  
  if (contract.status !== 'active') {
    errors.push('Contract is not active');
  }
  
  if (finalProfit !== undefined && finalProfit < 0) {
    errors.push('Profit cannot be negative');
  }
  
  const expectedProfit = contract.amount * (contract.apy / 100) * (contract.duration / 8760);
  if (finalProfit !== undefined && finalProfit > expectedProfit * 2) {
    errors.push('Profit exceeds expected maximum');
  }
  
  return errors;
}

export default arbitrageLockService;
