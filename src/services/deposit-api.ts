// Deposit Request API Service
import { supabase } from '@/lib/supabase';

export interface DepositRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  amount: number;
  currency: string;
  network: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  proof_file?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepositRequest {
  amount: string;
  currency: string;
  network: string;
  proof: File;
  userId: string;
  userEmail: string;
  userName: string;
}

export class DepositApiService {
  // Create a new deposit request
  static async createDepositRequest(data: CreateDepositRequest): Promise<DepositRequest> {
    try {
      console.log('📝 [DepositAPI] Creating deposit request:', data);

      // First, upload the proof file to storage
      let proofUrl = '';
      if (data.proof) {
        const fileExt = data.proof.name.split('.').pop();
        const fileName = `deposit-proof-${Date.now()}.${fileExt}`;
        const filePath = `deposit-proofs/${data.userId}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('deposit-proofs')
          .upload(filePath, data.proof);

        if (uploadError) {
          console.error('❌ [DepositAPI] Failed to upload proof:', uploadError);
          throw new Error('Failed to upload proof file');
        }

        proofUrl = uploadData.path;
        console.log('✅ [DepositAPI] Proof uploaded successfully:', proofUrl);
      }

      // Create the deposit request record
      const { data: requestData, error: requestError } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: data.userId,
          user_email: data.userEmail,
          user_name: data.userName,
          amount: parseFloat(data.amount),
          currency: data.currency,
          network: data.network,
          status: 'pending',
          proof_file: proofUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (requestError) {
        console.error('❌ [DepositAPI] Failed to create deposit request:', requestError);
        throw new Error('Failed to create deposit request');
      }

      console.log('✅ [DepositAPI] Deposit request created successfully:', requestData);
      return requestData;
    } catch (error) {
      console.error('💥 [DepositAPI] Error creating deposit request:', error);
      throw error;
    }
  }

  // Get all deposit requests for a user
  static async getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
    try {
      console.log('📋 [DepositAPI] Getting deposit requests for user:', userId);

      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DepositAPI] Failed to get deposit requests:', error);
        throw error;
      }

      console.log('✅ [DepositAPI] Retrieved deposit requests:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 [DepositAPI] Error getting deposit requests:', error);
      throw error;
    }
  }

  // Get all deposit requests (for admin)
  static async getAllDepositRequests(): Promise<DepositRequest[]> {
    try {
      console.log('📋 [DepositAPI] Getting all deposit requests');

      const { data, error } = await supabase
        .from('deposit_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DepositAPI] Failed to get all deposit requests:', error);
        throw error;
      }

      console.log('✅ [DepositAPI] Retrieved all deposit requests:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('💥 [DepositAPI] Error getting all deposit requests:', error);
      throw error;
    }
  }

  // Update deposit request status
  static async updateDepositStatus(requestId: string, status: DepositRequest['status'], reason?: string): Promise<DepositRequest> {
    try {
      console.log('🔄 [DepositAPI] Updating deposit request status:', { requestId, status, reason });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.admin_notes = reason;
      }

      const { data, error } = await supabase
        .from('deposit_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

      if (error) {
        console.error('❌ [DepositAPI] Failed to update deposit request status:', error);
        throw error;
      }

      console.log('✅ [DepositAPI] Deposit request status updated:', data);
      return data;
    } catch (error) {
      console.error('💥 [DepositAPI] Error updating deposit request status:', error);
      throw error;
    }
  }
}

export default DepositApiService;
