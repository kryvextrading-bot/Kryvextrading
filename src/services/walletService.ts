import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface Balance {
  userId: string;
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface BalanceUpdate {
  userId: string;
  asset: string;
  amount: number;
  type: 'credit' | 'debit' | 'lock' | 'unlock';
  reference: string;
  metadata?: Record<string, any>;
}

class WalletService {
  // ==================== BALANCE MANAGEMENT ====================
  
  async getBalance(userId: string, asset: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('available')
      .eq('userId', userId)
      .eq('asset', asset)
      .maybeSingle();

    if (error) throw error;
    return data?.available || 0;
  }

  async getAllBalances(userId: string): Promise<Balance[]> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    return data || [];
  }

  async deductBalance(params: {
    userId: string;
    asset: string;
    amount: number;
    reference: string;
    type: string;
  }): Promise<void> {
    const { userId, asset, amount, reference, type } = params;

    // Start transaction
    const { error: balanceError } = await supabase
      .rpc('deduct_balance', {
        p_user_id: userId,
        p_asset: asset,
        p_amount: amount
      });

    if (balanceError) throw balanceError;

    // Record ledger entry
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert({
        id: uuidv4(),
        userId,
        asset,
        amount: -amount,
        type,
        reference,
        timestamp: new Date().toISOString()
      });

    if (ledgerError) throw ledgerError;
  }

  async addBalance(params: {
    userId: string;
    asset: string;
    amount: number;
    reference: string;
    type: string;
  }): Promise<void> {
    const { userId, asset, amount, reference, type } = params;

    // Update balance
    const { error: balanceError } = await supabase
      .rpc('add_balance', {
        p_user_id: userId,
        p_asset: asset,
        p_amount: amount
      });

    if (balanceError) throw balanceError;

    // Record ledger entry
    const { error: ledgerError } = await supabase
      .from('ledger_entries')
      .insert({
        id: uuidv4(),
        userId,
        asset,
        amount,
        type,
        reference,
        timestamp: new Date().toISOString()
      });

    if (ledgerError) throw ledgerError;
  }

  async lockBalance(params: {
    userId: string;
    asset: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    const { userId, asset, amount, reference } = params;

    const { error } = await supabase
      .rpc('lock_balance', {
        p_user_id: userId,
        p_asset: asset,
        p_amount: amount,
        p_reference: reference
      });

    if (error) throw error;
  }

  async unlockBalance(params: {
    userId: string;
    asset: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    const { userId, asset, amount, reference } = params;

    const { error } = await supabase
      .rpc('unlock_balance', {
        p_user_id: userId,
        p_asset: asset,
        p_amount: amount,
        p_reference: reference
      });

    if (error) throw error;
  }

  // ==================== BALANCE VERIFICATION ====================
  
  async verifyBalance(userId: string, asset: string, required: number): Promise<boolean> {
    const balance = await this.getBalance(userId, asset);
    return balance >= required;
  }

  async getBalanceWithLocked(userId: string, asset: string): Promise<{ available: number; locked: number; total: number }> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('available, locked')
      .eq('userId', userId)
      .eq('asset', asset)
      .maybeSingle();

    if (error) throw error;
    
    return {
      available: data?.available || 0,
      locked: data?.locked || 0,
      total: (data?.available || 0) + (data?.locked || 0)
    };
  }

  // ==================== TRANSACTION HISTORY ====================
  
  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getBalanceHistory(userId: string, asset: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('balance_history')
      .select('*')
      .eq('userId', userId)
      .eq('asset', asset)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export const walletService = new WalletService();