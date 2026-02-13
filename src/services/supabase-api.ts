import { supabase, Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type KYCDocument = Database['public']['Tables']['kyc_documents']['Row']
type SystemSetting = Database['public']['Tables']['system_settings']['Row']
type Investment = Database['public']['Tables']['investments']['Row']

class SupabaseApiService {
  // Authentication
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    return { user: data.user, profile }
  }

  async signUp(email: string, password: string, userData: Partial<User>) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
            },
            emailRedirectTo: undefined
          }
        });
        
        if (error) {
          // Handle rate limiting specifically
          if (error.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          // Handle user already exists error
          if (error.status === 422 && error.message.includes('user_already_exists')) {
            throw new Error('This email is already registered. Please login instead.');
          }
          throw error;
        }
        
        // Create user profile (only if signup was successful)
        if (data.user && !data.user.identities?.length) {
          // Email confirmation required, don't create profile yet
          return { user: data.user, profile: null };
        }
        
        if (data.user) {
          // Try to get/create user profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          if (profileError && profileError.code !== 'PGRST116') {
            // Profile doesn't exist or other error, try to create it
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email,
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                phone: userData.phone || '',
                status: 'Active',
                kyc_status: 'Verified',
                account_type: userData.account_type || 'Traditional IRA',
                account_number: `IRA-2024-${Date.now()}`,
                balance: 0,
                registration_date: new Date().toISOString(),
                two_factor_enabled: false,
                risk_tolerance: userData.risk_tolerance || 'Moderate',
                investment_goal: userData.investment_goal || 'Retirement',
                is_admin: false,
                credit_score: 0,
              })
              .select()
              .single()
            
            if (createError) throw createError;
            return { user: data.user, profile: newProfile };
          }
          
          return { user: data.user, profile };
        }
      } catch (error) {
        if (attempt === maxRetries) {
          // If this is the last attempt, throw the error with a user-friendly message
          if (error instanceof Error && error.message.includes('rate limit')) {
            throw new Error('Too many registration attempts. Please wait a few minutes before trying again.');
          }
          throw error;
        }
        // For other errors on non-final attempts, wait and retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
        }
      }
    }
    
    throw new Error('Registration failed after multiple attempts. Please try again later.');
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email!)
      .single()
    
    return { user, profile }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getUser(id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updatedUser
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Transaction Management
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const { data: updatedTransaction, error } = await supabase
      .from('transactions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updatedTransaction
  }

  async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // KYC Documents
  async getKYCDocuments(userId: string): Promise<KYCDocument[]> {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async uploadKYCDocument(userId: string, documentType: string, file: File): Promise<KYCDocument> {
    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName)
    
    // Create document record
    const { data, error } = await supabase
      .from('kyc_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        document_url: publicUrl,
        uploaded_at: new Date().toISOString(),
        status: 'Pending',
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateKYCStatus(id: string, status: 'Pending' | 'Verified' | 'Rejected', notes?: string): Promise<KYCDocument> {
    const { data, error } = await supabase
      .from('kyc_documents')
      .update({ 
        status, 
        notes,
        verified_at: status === 'Verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  async updateSystemSetting(category: string, key: string, value: any): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ category, key, value, updated_at: new Date().toISOString() })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Investments
  async getInvestments(): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  async createInvestment(investment: Omit<Investment, 'id' | 'created_at' | 'updated_at'>): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  async updateInvestment(id: string, data: Partial<Investment>): Promise<Investment> {
    const { data: updatedInvestment, error } = await supabase
      .from('investments')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return updatedInvestment
  }

  async deleteInvestment(id: string): Promise<void> {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  // Dashboard Statistics
  async getDashboardStats() {
    const { data: users } = await supabase
      .from('users')
      .select('id, status, balance')
    
    const { data: transactions } = await supabase
      .from('transactions')
      .select('value, status')
    
    const totalUsers = users?.length || 0
    const activeUsers = users?.filter(u => u.status === 'Active').length || 0
    const totalBalance = users?.reduce((sum, u) => sum + u.balance, 0) || 0
    const totalVolume = transactions?.reduce((sum, t) => sum + t.value, 0) || 0
    const pendingTransactions = transactions?.filter(t => t.status === 'Pending').length || 0

    return {
      totalUsers,
      activeUsers,
      totalBalance,
      totalVolume,
      pendingTransactions,
    }
  }
}

export const supabaseApi = new SupabaseApiService()
export default supabaseApi
