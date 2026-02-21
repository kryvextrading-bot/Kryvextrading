// Wallet API Service - Integration with real database tables
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { notificationService } from './notification-service';

// Global type extension for wallet updates
declare global {
  interface Window {
    walletUpdates?: Array<{
      id: string;
      userId: string;
      amount: number;
      currency: string;
      timestamp: string;
    }>;
  }
}

// Broadcast function to notify frontend of balance updates
const broadcastBalanceUpdate = (userId: string, amount: number, currency: string) => {
  
  // Store update in a global variable for React to pick up
  // This avoids the React context issue with custom events
  if (!window.walletUpdates) {
    window.walletUpdates = [];
  }
  
  const update = {
    id: Date.now().toString(),
    userId,
    amount,
    currency,
    timestamp: new Date().toISOString()
  };
  
  window.walletUpdates.push(update);
  
  // Dispatch custom event with a delay to ensure React context is ready
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('balanceUpdate', {
      detail: { userId, amount, currency }
    }));
  }, 300);
  
};

export interface WalletBalance {
  id: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
  deposit_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  request_id?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee' | 'freeze' | 'unfreeze';
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  reference_id?: string;
  description?: string;
  created_at: string;
  status?: 'pending' | 'completed' | 'failed' | 'processing';
  network?: string;
  address?: string;
  tx_hash?: string;
}

export interface WalletRequest {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  method: string;
  address: string;
  transaction_hash?: string;
  description?: string;
  fee: number;
  risk_score: number;
  admin_notes?: string;
  processed_by?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

class WalletApiService {
  // Get user wallet balances
  async getUserBalances(userId: string): Promise<WalletBalance[]> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ [WalletAPI] Failed to get user balances:', error);
      throw error;
    }
  }

  // Get user wallet transactions
  async getUserTransactions(userId: string): Promise<WalletTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ [WalletAPI] Failed to get user transactions:', error);
      throw error;
    }
  }

  // Get wallet requests
  async getWalletRequests(): Promise<WalletRequest[]> {
    try {
      
      // Fetch real wallet requests from Supabase with explicit relationship
      const { data: walletRequests, error: walletError } = await supabase
        .from('wallet_requests')
        .select(`
          *,
          user:users!wallet_requests_user_id_fkey(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (walletError) {
        console.error('❌ [WalletAPI] Error fetching wallet requests:', walletError);
        throw walletError;
      }
      
      return walletRequests || [];
    } catch (error) {
      console.error('❌ [WalletAPI] Failed to get wallet requests:', error);
      throw error;
    }
  }

  // Admin: Add funds to user wallet
  async adminAddFunds(userId: string, amount: number, currency: string, reason: string): Promise<void> {
    try {

      // 1. Get current wallet balance using admin client
      const { data: currentBalance, error: balanceError } = await supabaseAdmin
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }

      const currentBalanceAmount = currentBalance?.balance || 0;
      const newBalance = currentBalanceAmount + amount;

      // 2. Update or create wallet balance record using admin client
      if (currentBalance) {
        // Update existing balance
        const { error: updateError } = await supabaseAdmin
          .from('wallets')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('currency', currency);

        if (updateError) throw updateError;
      } else {
        // Create new balance record
        const { error: insertError } = await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: userId,
            currency: currency,
            balance: amount,
            locked_balance: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // 3. Create wallet transaction record using admin client
      const { error: transactionError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          currency: currency,
          balance_before: currentBalanceAmount,
          balance_after: newBalance,
          description: `Admin deposit: ${reason}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      // 4. Create wallet request record using admin client
      const { error: requestError } = await supabaseAdmin
        .from('wallet_requests')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: amount,
          currency: currency,
          status: 'completed',
          method: 'admin',
          address: 'admin-action',
          description: reason,
          fee: 0,
          risk_score: 0,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (requestError) throw requestError;

      // 5. Broadcast balance update to frontend
      broadcastBalanceUpdate(userId, amount, currency);

    } catch (error) {
      console.error('❌ [WalletAPI] Failed to add funds:', error);
      throw error;
    }
  }

  // Admin: Remove funds from user wallet
  async adminRemoveFunds(userId: string, amount: number, currency: string, reason: string): Promise<void> {
    try {

      // 1. Get current wallet balance using admin client
      const { data: currentBalance, error: balanceError } = await supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (balanceError) throw balanceError;
      if (!currentBalance) throw new Error('Wallet balance not found');
      if (currentBalance.balance < amount) throw new Error('Insufficient balance');

      const currentBalanceAmount = currentBalance.balance;
      const newBalance = currentBalanceAmount - amount;

      // 2. Update wallet balance using admin client
      const { error: updateError } = await supabaseAdmin
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('currency', currency);

      if (updateError) throw updateError;

      // 3. Create wallet transaction record using admin client
      const { error: transactionError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount: amount,
          currency: currency,
          balance_before: currentBalanceAmount,
          balance_after: newBalance,
          description: `Admin withdrawal: ${reason}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      // 4. Create wallet request record using admin client
      const { error: requestError } = await supabaseAdmin
        .from('wallet_requests')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount: amount,
          currency: currency,
          status: 'completed',
          method: 'admin',
          address: 'admin-action',
          description: reason,
          fee: 0,
          risk_score: 0,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (requestError) throw requestError;

      // 5. Broadcast balance update to frontend (negative amount for removal)
      broadcastBalanceUpdate(userId, -amount, currency);

      // 6. Create notification for user
      await notificationService.createNotification({
        user_id: userId,
        type: 'withdrawal',
        title: 'Withdrawal Completed',
        message: `Your withdrawal of ${amount} ${currency} has been completed. Reason: ${reason}`,
        priority: 'high',
        action_url: '/wallet',
        action_text: 'View Wallet',
        metadata: {
          transaction_id: `admin_${Date.now()}`,
          amount: amount,
          currency: currency,
          reason: reason,
          new_balance: newBalance
        }
      });

    } catch (error) {
      console.error('❌ [WalletAPI] Failed to remove funds:', error);
      throw error;
    }
  }

  // Admin: Freeze user balance
  async freezeUserBalance(userId: string, currency: string, amount: number): Promise<void> {
    try {

      // 1. Get current wallet balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (balanceError) throw balanceError;
      if (!currentBalance) throw new Error('Wallet balance not found');
      if (currentBalance.balance < amount) throw new Error('Insufficient balance to freeze');

      const availableBalance = currentBalance.balance;
      const currentFrozen = currentBalance.locked_balance;
      const newAvailableBalance = availableBalance - amount;
      const newFrozenBalance = currentFrozen + amount;

      // 2. Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newAvailableBalance,
          locked_balance: newFrozenBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('currency', currency);

      if (updateError) throw updateError;

      // 3. Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'freeze',
          amount: amount,
          currency: currency,
          balance_before: availableBalance,
          balance_after: newAvailableBalance,
          description: `Admin freeze: ${amount} ${currency}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

    } catch (error) {
      console.error('❌ [WalletAPI] Failed to freeze balance:', error);
      throw error;
    }
  }

  // Admin: Unfreeze user balance
  async unfreezeUserBalance(userId: string, currency: string, amount: number): Promise<void> {
    try {

      // 1. Get current wallet balance
      const { data: currentBalance, error: balanceError } = await supabase
        .from('wallets')
        .select('balance, locked_balance')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (balanceError) throw balanceError;
      if (!currentBalance) throw new Error('Wallet balance not found');
      if (currentBalance.locked_balance < amount) throw new Error('Insufficient frozen balance to unfreeze');

      const availableBalance = currentBalance.balance;
      const currentFrozen = currentBalance.locked_balance;
      const newAvailableBalance = availableBalance + amount;
      const newFrozenBalance = currentFrozen - amount;

      // 2. Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newAvailableBalance,
          locked_balance: newFrozenBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('currency', currency);

      if (updateError) throw updateError;

      // 3. Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'unfreeze',
          amount: amount,
          currency: currency,
          balance_before: availableBalance,
          balance_after: newAvailableBalance,
          description: `Admin unfreeze: ${amount} ${currency}`,
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

    } catch (error) {
      console.error('❌ [WalletAPI] Failed to unfreeze balance:', error);
      throw error;
    }
  }

  // Get wallet summary by user
  async getWalletSummaryByUser(userId: string): Promise<{
    totalBalance: number;
    totalFrozen: number;
    currencies: string[];
    recentTransactions: number;
  }> {
    try {
      // Get balances
      const { data: balances, error: balanceError } = await supabaseAdmin
        .from('wallets')
        .select('currency, balance, locked_balance')
        .eq('user_id', userId);

      if (balanceError) throw balanceError;

      // Get transaction count
      const { count: transactionCount, error: countError } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      const totalBalance = balances?.reduce((sum, b) => sum + b.balance, 0) || 0;
      const totalFrozen = balances?.reduce((sum, b) => sum + b.locked_balance, 0) || 0;
      const currencies = balances?.map(b => b.currency) || [];

      return {
        totalBalance,
        totalFrozen,
        currencies,
        recentTransactions: transactionCount || 0
      };
    } catch (error) {
      console.error('❌ [WalletAPI] Failed to get wallet summary:', error);
      throw error;
    }
  }
}

export const walletApiService = new WalletApiService();
export default walletApiService;
