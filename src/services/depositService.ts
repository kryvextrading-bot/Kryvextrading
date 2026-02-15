import { supabase } from '@/lib/supabase';

export interface DepositRequest {
  id?: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  amount: number;
  currency: string;
  network: string;
  address: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed';
  proof_url?: string;
  proof_file_name?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepositTransaction {
  id?: string;
  deposit_request_id: string;
  user_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  status: 'Pending' | 'Completed' | 'Failed';
  balance_before?: number;
  balance_after?: number;
  transaction_hash?: string;
  network_fee?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletBalance {
  id?: string;
  user_id: string;
  currency: string;
  balance: number;
  locked_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  created_at?: string;
  updated_at?: string;
}

export interface AdminActionLog {
  id?: string;
  admin_id: string;
  action_type: 'deposit_approve' | 'deposit_reject' | 'deposit_process' | 'user_balance_adjust' | 'system_config';
  target_user_id?: string;
  target_resource_id?: string;
  resource_type?: string;
  action_details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

class DepositService {
  // Create a new deposit request
  async createDepositRequest(depositRequest: Omit<DepositRequest, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: DepositRequest; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .insert([depositRequest])
        .select()
        .single();

      if (error) {
        console.error('Error creating deposit request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error creating deposit request:', error);
      return { success: false, error: 'Failed to create deposit request' };
    }
  }

  // Get all deposit requests (for admin)
  async getAllDepositRequests(): Promise<{ success: boolean; data?: DepositRequest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposit requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching deposit requests:', error);
      return { success: false, error: 'Failed to fetch deposit requests' };
    }
  }

  // Get user's deposit requests
  async getUserDepositRequests(userId: string): Promise<{ success: boolean; data?: DepositRequest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user deposit requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching user deposit requests:', error);
      return { success: false, error: 'Failed to fetch deposit requests' };
    }
  }

  // Update deposit request status (for admin)
  async updateDepositStatus(
    requestId: string, 
    status: 'Approved' | 'Rejected' | 'Processing' | 'Completed',
    adminId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; data?: DepositRequest; error?: string }> {
    try {
      const updateData: any = {
        status,
        processed_by: adminId,
        processed_at: new Date().toISOString(),
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('deposit_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('Error updating deposit status:', error);
        return { success: false, error: error.message };
      }

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        action_type: status === 'Approved' ? 'deposit_approve' : 'deposit_reject',
        target_resource_id: requestId,
        resource_type: 'deposit_request',
        action_details: {
          old_status: 'Pending',
          new_status: status,
          admin_notes: adminNotes
        }
      });

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating deposit status:', error);
      return { success: false, error: 'Failed to update deposit status' };
    }
  }

  // Add funds to user wallet (called when deposit is approved)
  async addFundsToWallet(
    userId: string,
    currency: string,
    amount: number,
    description?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      // Call the database function to add funds
      const { data, error } = await supabase
        .rpc('add_funds_to_wallet', {
          p_user_id: userId,
          p_currency: currency,
          p_amount: amount,
          p_description: description
        });

      if (error) {
        console.error('Error adding funds to wallet:', error);
        return { success: false, error: error.message };
      }

      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          return { success: true, newBalance: result.new_balance };
        } else {
          return { success: false, error: result.error_message };
        }
      }

      return { success: false, error: 'Unexpected response from database' };
    } catch (error) {
      console.error('Unexpected error adding funds to wallet:', error);
      return { success: false, error: 'Failed to add funds to wallet' };
    }
  }

  // Get user wallet balances
  async getUserWalletBalances(userId: string): Promise<{ success: boolean; data?: WalletBalance[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_wallet_balances')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching wallet balances:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching wallet balances:', error);
      return { success: false, error: 'Failed to fetch wallet balances' };
    }
  }

  // Get wallet balance for specific currency
  async getWalletBalance(userId: string, currency: string): Promise<{ success: boolean; data?: WalletBalance; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_wallet_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('currency', currency)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching wallet balance:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching wallet balance:', error);
      return { success: false, error: 'Failed to fetch wallet balance' };
    }
  }

  // Get deposit transactions for user
  async getUserDepositTransactions(userId: string): Promise<{ success: boolean; data?: DepositTransaction[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposit transactions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching deposit transactions:', error);
      return { success: false, error: 'Failed to fetch deposit transactions' };
    }
  }

  // Log admin actions
  async logAdminAction(actionLog: Omit<AdminActionLog, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('admin_action_logs')
        .insert([actionLog]);

      if (error) {
        console.error('Error logging admin action:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error logging admin action:', error);
      return { success: false, error: 'Failed to log admin action' };
    }
  }

  // Get admin action logs
  async getAdminActionLogs(): Promise<{ success: boolean; data?: AdminActionLog[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin action logs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching admin action logs:', error);
      return { success: false, error: 'Failed to fetch admin action logs' };
    }
  }

  // Process approved deposit (add funds and update status)
  async processApprovedDeposit(
    requestId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the deposit request details
      const { data: request, error: fetchError } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return { success: false, error: 'Deposit request not found' };
      }

      if (request.status !== 'Approved') {
        return { success: false, error: 'Deposit request is not approved' };
      }

      // Add funds to user wallet
      const walletResult = await this.addFundsToWallet(
        request.user_id,
        request.currency,
        parseFloat(request.amount.toString()),
        `Deposit approved: ${request.network} deposit`
      );

      if (!walletResult.success) {
        return { success: false, error: walletResult.error };
      }

      // Update deposit request status to completed
      const { error: updateError } = await supabase
        .from('deposit_requests')
        .update({
          status: 'Completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating deposit request to completed:', updateError);
        return { success: false, error: 'Failed to complete deposit request' };
      }

      // Log the processing action
      await this.logAdminAction({
        admin_id: adminId,
        action_type: 'deposit_process',
        target_user_id: request.user_id,
        target_resource_id: requestId,
        resource_type: 'deposit_request',
        action_details: {
          amount: request.amount,
          currency: request.currency,
          new_balance: walletResult.newBalance
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Unexpected error processing approved deposit:', error);
      return { success: false, error: 'Failed to process approved deposit' };
    }
  }
}

export const depositService = new DepositService();
