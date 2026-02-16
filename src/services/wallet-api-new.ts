import { supabase } from '@/lib/supabase';
import { BalanceOperation } from '@/types/wallet';
import { BalanceResult, WalletBalance } from '@/services/unified-wallet-service';
import { v4 as uuidv4 } from 'uuid';

class WalletApiService {
  // ==================== USER BALANCE METHODS ====================
  
  async getUserBalances(userId: string): Promise<WalletBalance[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_balances')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      // If no balances exist, create default ones
      if (!data || data.length === 0) {
        return await this.initializeUserBalances(userId);
      }
      
      return data.map(w => ({
        asset: w.asset,
        available: w.available,
        locked: w.locked || 0,
        total: w.available + (w.locked || 0),
        updatedAt: w.updated_at
      }));
    } catch (error) {
      console.error('Error getting user balances:', error);
      return [];
    }
  }

  async initializeUserBalances(userId: string): Promise<WalletBalance[]> {
    const defaultAssets = ['USDT', 'BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'XRP', 'DOGE'];
    const balances = [];

    for (const asset of defaultAssets) {
      const { data, error } = await supabase
        .from('wallet_balances')
        .insert({
          user_id: userId,
          asset,
          available: 0,
          locked: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error && data) {
        balances.push({
          asset: data.asset,
          available: data.available,
          locked: data.locked || 0,
          total: data.available + (data.locked || 0),
          updatedAt: data.updated_at
        });
      }
    }

    return balances;
  }

  // ==================== BALANCE OPERATIONS ====================
  
  async addBalance(operation: BalanceOperation): Promise<BalanceResult> {
    try {
      const transactionId = uuidv4();
      
      // Start a Supabase transaction
      const { data, error } = await supabase
        .rpc('add_balance', {
          p_user_id: operation.userId,
          p_asset: operation.asset,
          p_amount: operation.amount,
          p_reference: operation.reference,
          p_type: operation.type
        });

      if (error) throw error;

      // Record in ledger
      await this.recordLedgerEntry({
        ...operation,
        id: transactionId,
        amount: operation.amount
      });

      return {
        success: true,
        newAvailable: data,
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
    try {
      const transactionId = uuidv4();
      
      const { data, error } = await supabase
        .rpc('deduct_balance', {
          p_user_id: operation.userId,
          p_asset: operation.asset,
          p_amount: operation.amount,
          p_reference: operation.reference,
          p_type: operation.type
        });

      if (error) throw error;

      // Record in ledger
      await this.recordLedgerEntry({
        ...operation,
        id: transactionId,
        amount: -operation.amount
      });

      return {
        success: true,
        newAvailable: data,
        transactionId
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
    try {
      const transactionId = uuidv4();
      
      const { data, error } = await supabase
        .rpc('lock_balance', {
          p_user_id: operation.userId,
          p_asset: operation.asset,
          p_amount: operation.amount,
          p_reference: operation.reference
        });

      if (error) throw error;

      // Record in ledger
      await this.recordLedgerEntry({
        ...operation,
        id: transactionId,
        amount: -operation.amount,
        type: 'lock'
      });

      return {
        success: true,
        transactionId
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
      const transactionId = uuidv4();
      
      const { data, error } = await supabase
        .rpc('unlock_balance', {
          p_user_id: operation.userId,
          p_asset: operation.asset,
          p_amount: operation.amount,
          p_reference: operation.reference
        });

      if (error) throw error;

      // Record in ledger
      await this.recordLedgerEntry({
        ...operation,
        id: transactionId,
        amount: operation.amount,
        type: 'unlock'
      });

      return {
        success: true,
        transactionId
      };
    } catch (error) {
      console.error('Error unlocking balance:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==================== LEDGER METHODS ====================
  
  private async recordLedgerEntry(entry: any): Promise<void> {
    try {
      await supabase
        .from('ledger_entries')
        .insert({
          id: entry.id,
          user_id: entry.userId,
          asset: entry.asset,
          amount: entry.amount,
          type: entry.type,
          reference: entry.reference,
          metadata: entry.metadata || {},
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error recording ledger entry:', error);
    }
  }

  async getLedgerEntries(userId: string, limit: number = 100): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ledger_entries')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting ledger entries:', error);
      return [];
    }
  }

  // ==================== ADMIN METHODS ====================
  
  async adminAddFunds(userId: string, amount: number, currency: string, reason: string): Promise<BalanceResult> {
    return this.addBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_${Date.now()}`,
      type: 'deposit',
      metadata: { reason, adminAction: true }
    });
  }

  async adminRemoveFunds(userId: string, amount: number, currency: string, reason: string): Promise<BalanceResult> {
    return this.deductBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_${Date.now()}`,
      type: 'withdrawal',
      metadata: { reason, adminAction: true }
    });
  }

  async freezeUserBalance(userId: string, currency: string, amount: number): Promise<BalanceResult> {
    return this.lockBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_freeze_${Date.now()}`,
      type: 'lock',
      metadata: { reason: 'admin_freeze' }
    });
  }

  async unfreezeUserBalance(userId: string, currency: string, amount: number): Promise<BalanceResult> {
    return this.unlockBalance({
      userId,
      asset: currency,
      amount,
      reference: `admin_unfreeze_${Date.now()}`,
      type: 'unlock',
      metadata: { reason: 'admin_unfreeze' }
    });
  }

  // ==================== UTILITY METHODS ====================
  
  async getBalance(userId: string, asset: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('available')
      .eq('user_id', userId)
      .eq('asset', asset)
      .maybeSingle();

    if (error) throw error;
    return data?.available || 0;
  }

  async getLockedBalance(userId: string, asset: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('locked')
      .eq('user_id', userId)
      .eq('asset', asset)
      .maybeSingle();

    if (error) throw error;
    return data?.locked || 0;
  }
}

export const walletApiService = new WalletApiService();
export default new WalletApiService();
