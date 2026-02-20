// Balance Sync Service - Keeps users table balance in sync with wallets table
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export class BalanceSyncService {
  // Sync user balance from wallets table to users table
  static async syncUserBalance(userId: string): Promise<void> {
    try {
      console.log('🔄 [BalanceSync] Syncing balance for user:', userId);
      
      // Get total balance from wallets table
      const { data: wallets, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('❌ [BalanceSync] Failed to fetch wallet balances:', error);
        throw error;
      }

      // Calculate total balance across all currencies (convert to USDT equivalent)
      const totalBalance = wallets.reduce((sum, wallet) => {
        // For now, just sum the balance as if all are USDT
        // In a real implementation, you'd convert based on current exchange rates
        return sum + (wallet.balance || 0);
      }, 0);

      console.log(`💰 [BalanceSync] Total wallet balance for user ${userId}: ${totalBalance}`);

      // Update users table with the total balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: totalBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ [BalanceSync] Failed to update user balance:', updateError);
        throw updateError;
      }

      console.log(`✅ [BalanceSync] Successfully synced balance for user ${userId}: ${totalBalance}`);
      
      // Broadcast balance update to frontend
      window.dispatchEvent(new CustomEvent('balanceUpdate', {
        detail: { userId, amount: totalBalance, currency: 'USDT' }
      }));
      
    } catch (error) {
      console.error('💥 [BalanceSync] Failed to sync user balance:', error);
      throw error;
    }
  }

  // Sync all users' balances from wallets table
  static async syncAllUsersBalances(): Promise<void> {
    try {
      console.log('🔄 [BalanceSync] Syncing all user balances...');
      
      // Get all users
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name');

      if (error) {
        console.error('❌ [BalanceSync] Failed to fetch users:', error);
        throw error;
      }

      console.log(`👥 [BalanceSync] Found ${users.length} users to sync`);

      // Sync each user's balance
      const results = await Promise.allSettled(
        users.map(user => 
          this.syncUserBalance(user.id).catch(error => {
            console.error(`❌ [BalanceSync] Failed to sync balance for user ${user.email}:`, error);
            return { error };
          })
        )
      );

      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;

      console.log(`✅ [BalanceSync] Sync completed: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        toast({
          title: "Partial Sync Complete",
          description: `${successful} users synced, ${failed} failed`,
          variant: "default",
        });
      } else {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${successful} user balances`,
        });
      }
      
    } catch (error) {
      console.error('💥 [BalanceSync] Failed to sync all user balances:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync user balances",
        variant: "destructive",
      });
    }
  }

  // Get user balance difference between users and wallets tables
  static async getBalanceDifference(userId: string): Promise<{ usersBalance: number; walletsBalance: number; difference: number }> {
    try {
      // Get balance from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ [BalanceSync] Failed to fetch user balance:', userError);
        return { usersBalance: 0, walletsBalance: 0, difference: 0 };
      }

      // Get balance from wallets table
      const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (walletError) {
        console.error('❌ [BalanceSync] Failed to fetch wallet balances:', walletError);
        return { usersBalance: userData.balance || 0, walletsBalance: 0, difference: -(userData.balance || 0) };
      }

      const walletsBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
      const usersBalance = userData.balance || 0;
      const difference = walletsBalance - usersBalance;

      return { usersBalance, walletsBalance, difference };
    } catch (error) {
      console.error('❌ [BalanceSync] Failed to get balance difference:', error);
      return { usersBalance: 0, walletsBalance: 0, difference: 0 };
    }
  }
}

export default BalanceSyncService;
