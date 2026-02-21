import { supabase, supabaseAdmin, Database } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import { User, UserInsert, UserUpdate, validateUserInsert, validateUserUpdate } from '@/types/user-validation'

type Transaction = Database['public']['Tables']['transactions']['Row']
type KYCDocument = Database['public']['Tables']['kyc_documents']['Row']
type SystemSetting = Database['public']['Tables']['system_settings']['Row']
type Investment = Database['public']['Tables']['investments']['Row']

class SupabaseApiService {
  // Authentication
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (!data.user) {
        throw new Error('No user data returned')
      }
      
      // Get user profile by ID instead of email (more reliable)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()
      
      if (profileError) {
        // Log the error but don't throw - we still want to return the user
        console.error('Error fetching user profile:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        })
        
        // If profile doesn't exist, try to create it using upsert
        if (profileError.code === 'PGRST116') {
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .upsert([{
                id: data.user.id,
                email: data.user.email!,
                first_name: data.user.user_metadata?.first_name || '',
                last_name: data.user.user_metadata?.last_name || '',
                phone: '',
                status: 'Active',
                kyc_status: 'Pending',
                account_type: 'Traditional IRA',
                account_number: `ACC-${Date.now()}`,
                balance: 0,
                registration_date: new Date().toISOString(),
                two_factor_enabled: false,
                risk_tolerance: 'Moderate',
                investment_goal: 'Retirement',
                is_admin: false,
                credit_score: 0,
              }], {
                onConflict: 'id',
                ignoreDuplicates: false
              })
              .select()
              .single()
            
            if (createError && createError.code !== '23505') {
              console.error('Error creating user profile:', createError)
              return { user: data.user, profile: null }
            }
            
            return { user: data.user, profile: newProfile }
          } catch (createErr) {
            console.error('Failed to create profile:', createErr)
            return { user: data.user, profile: null }
          }
        }
        
        // For other errors, return user without profile
        return { user: data.user, profile: null }
      }
      
      return { user: data.user, profile }
      
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async signUp(email: string, password: string, userData: UserInsert) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    // Validate user data before proceeding
    const validationErrors = validateUserInsert({ ...userData, email });
    if (validationErrors.length > 0) {
      console.error('🚨 User validation failed:', validationErrors);
      console.error('🔍 User data being validated:', { ...userData, email });
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Step 1: Create auth user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
            },
            emailRedirectTo: window.location.origin
          }
        });
        
        if (signUpError) {
          // Handle user already exists error - don't retry
          if (signUpError.message?.includes('User already registered') || 
              signUpError.message?.includes('already exists') ||
              signUpError.message?.includes('already been registered') ||
              signUpError.status === 422) {
            throw new Error('This email is already registered. Please login instead.');
          }
          
          // Handle rate limiting specifically
          if (signUpError.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
            console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw signUpError;
        }
        
        if (!authData.user) {
          throw new Error('No user data returned from sign up');
        }
        
        console.log('✅ [SupabaseAPI] Auth user created:', authData.user.id);

        // Step 2: Create user profile using admin client to bypass RLS
        try {
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              phone: userData.phone || '',
              status: 'Active',
              kyc_status: 'Pending',
              account_type: userData.account_type || 'Traditional IRA',
              account_number: `ACC-${Date.now()}`,
              balance: 0,
              registration_date: new Date().toISOString(),
              two_factor_enabled: false,
              risk_tolerance: userData.risk_tolerance || 'Moderate',
              investment_goal: userData.investment_goal || 'Retirement',
              is_admin: false,
              credit_score: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (profileError) {
            console.error('❌ [SupabaseAPI] Profile creation error:', profileError);
            
            // Cleanup auth user if profile creation fails
            if (authData.user) {
              await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            }
            
            if (profileError.code === '42501') {
              throw new Error('Database permission error. Please contact support.');
            }
            
            throw new Error('Failed to create user profile. Please try again.');
          }

          console.log('✅ [SupabaseAPI] User profile created');

          // Step 3: Initialize notification settings using admin client
          try {
            // Insert notification settings
            await supabaseAdmin
              .from('notification_settings')
              .insert({
                user_id: authData.user.id,
                email_notifications: true,
                push_notifications: true,
                trading_alerts: true,
                price_alerts: false,
                security_alerts: true,
                marketing_emails: false,
                system_updates: true,
                sound_enabled: true,
                desktop_notifications: true,
                mobile_notifications: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            // Insert notification preferences for all channels
            const channels = ['email', 'push', 'sms', 'in-app'];
            for (const channel of channels) {
              await supabaseAdmin
                .from('notification_preferences')
                .insert({
                  user_id: authData.user.id,
                  channel,
                  email_alerts: true,
                  sms_alerts: false,
                  push_alerts: true,
                  transaction_alerts: true,
                  security_alerts: true,
                  marketing_emails: false,
                  daily_summary: true,
                  weekly_report: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
            }

            // Create welcome notification
            await supabaseAdmin
              .from('notifications')
              .insert({
                user_id: authData.user.id,
                type: 'welcome',
                title: '🎉 Welcome to Kryvex Trading!',
                message: 'Thank you for joining Kryvex. Complete your KYC verification to start trading.',
                status: 'unread',
                priority: 'high',
                created_at: new Date().toISOString()
              });

            console.log('✅ [SupabaseAPI] Notification settings initialized');
          } catch (notificationError) {
            console.warn('⚠️ [SupabaseAPI] Failed to initialize notification settings:', notificationError);
            // Don't fail the entire signup if notifications fail
          }

          // Step 4: Initialize wallet balances using admin client
          try {
            await supabaseAdmin.rpc('ensure_user_has_wallets', { p_user_id: authData.user.id });
            console.log('✅ [SupabaseAPI] Wallet balances initialized');
          } catch (walletError) {
            console.warn('⚠️ [SupabaseAPI] Failed to initialize wallet balances:', walletError);
            // Don't fail the entire signup if wallet initialization fails
          }

          // Step 5: Auto-login if email confirmation is required
          if (authData.user && !authData.session) {
            console.log('📧 [SupabaseAPI] Email confirmation required, attempting auto-login...');
            
            try {
              const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
              });
              
              if (signInError) {
                console.error('❌ [SupabaseAPI] Auto sign-in failed:', signInError);
                return { 
                  user: authData.user, 
                  profile, 
                  requiresConfirmation: false
                };
              }
              
              console.log('✅ [SupabaseAPI] Auto-login successful');
              return { user: signInData.user, profile, requiresConfirmation: false };
            } catch (autoLoginError) {
              console.error('❌ [SupabaseAPI] Auto login failed:', autoLoginError);
              return { 
                user: authData.user, 
                profile, 
                requiresConfirmation: false
              };
            }
          }
          
          console.log('✅ [SupabaseAPI] Signup completed successfully');
          return { user: authData.user, profile, requiresConfirmation: false };
          
        } catch (profileErr) {
          console.error('❌ [SupabaseAPI] Failed to create profile:', profileErr);
          
          // Cleanup auth user if profile creation fails
          if (authData.user) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          }
          
          throw new Error('Failed to create user profile. Please try again.');
        }
        
      } catch (error) {
        // Don't retry for "already registered" errors
        if (error instanceof Error && (
          error.message.includes('already registered') ||
          error.message.includes('This email is already registered')
        )) {
          throw error; // Already user-friendly message
        }
        
        if (attempt === maxRetries) {
          // If this is last attempt, throw error with a user-friendly message
          if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
              throw new Error('Too many registration attempts. Please wait a few minutes before trying again.');
            }
            if (error.message.includes('already registered')) {
              throw error; // Already a user-friendly message
            }
          }
          throw new Error('Registration failed. Please try again later.');
        }
        
        // For other errors on non-final attempts, wait and retry
        console.log(`Signup attempt ${attempt} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, baseDelay * attempt));
      }
    }
    
    throw new Error('Registration failed after multiple attempts. Please try again later.');
  }

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Authentication timeout')), 25000);
      });

      const userPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any;
      
      if (!user) return null
      
      // Get profile by ID with timeout
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      const profileTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 15000);
      });
      
      const { data: profile, error: profileError } = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
      
      if (profileError) {
        console.error('Error fetching current user profile:', profileError)
        return { user, profile: null }
      }
      
      // If no profile exists, try to create one using upsert
      if (!profile) {
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .upsert([{
              id: user.id,
              email: user.email!,
              first_name: user.user_metadata?.first_name || '',
              last_name: user.user_metadata?.last_name || '',
              phone: '',
              status: 'Active',
              kyc_status: 'Pending',
              account_type: 'Traditional IRA',
              account_number: `ACC-${Date.now()}`,
              balance: 0,
              registration_date: new Date().toISOString(),
              two_factor_enabled: false,
              risk_tolerance: 'Moderate',
              investment_goal: 'Retirement',
              is_admin: false,
              credit_score: 0,
            }], {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select()
            .single()
          
          if (createError && createError.code !== '23505') {
            console.error('Error creating user profile:', createError)
            return { user, profile: null }
          }
          
          return { user, profile: newProfile }
        } catch (createErr) {
          console.error('Failed to create profile:', createErr)
          return { user, profile: null }
        }
      }
      
      return { user, profile }
      
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Failed to get users:', error)
      throw error
    }
  }

  async getUser(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching user:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Failed to get user:', error)
      return null
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      if (error) {
        // Check if it's a PGRST116 error (no rows returned)
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching user by email:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Failed to get user by email:', error)
      return null
    }
  }

  async updateUser(id: string, data: UserUpdate): Promise<User | null> {
    try {
      // Validate update data
      const validationErrors = validateUserUpdate(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle()
      
      if (error) {
        console.error('Error updating user:', error)
        return null
      }
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      return null
    }
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
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching transactions:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get transactions:', error)
      throw error
    }
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching user transactions:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get user transactions:', error)
      throw error
    }
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
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching KYC documents:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get KYC documents:', error)
      throw error
    }
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
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })
      
      if (error) {
        console.error('Error fetching system settings:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get system settings:', error)
      throw error
    }
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
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching investments:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get investments:', error)
      throw error
    }
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching user investments:', error)
        throw error
      }
      return data || []
    } catch (error) {
      console.error('Failed to get user investments:', error)
      throw error
    }
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
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, status, balance')
      
      if (usersError) {
        console.error('Error fetching users for stats:', usersError)
        throw usersError
      }
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('value, status')
      
      if (transactionsError) {
        console.error('Error fetching transactions for stats:', transactionsError)
        throw transactionsError
      }
      
      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.status === 'Active').length || 0
      const totalBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0
      const totalVolume = transactions?.reduce((sum, t) => sum + (t.value || 0), 0) || 0
      const pendingTransactions = transactions?.filter(t => t.status === 'Pending').length || 0

      return {
        totalUsers,
        activeUsers,
        totalBalance,
        totalVolume,
        pendingTransactions,
      }
    } catch (error) {
      console.error('Failed to get dashboard stats:', error)
      throw error
    }
  }

  // Admin specific methods
  async adminAddFunds(userId: string, amount: number, currency: string, reason: string): Promise<void> {
    try {
      // Get current user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single()
      
      if (userError) throw userError
      
      // Update user balance
      const newBalance = (user.balance || 0) + amount
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (updateError) throw updateError
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'Deposit',
          asset: currency,
          amount: amount,
          value: amount,
          status: 'Completed',
          fee: 0,
          description: `Admin deposit: ${reason}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (transactionError) throw transactionError
      
    } catch (error) {
      console.error('Failed to add funds:', error)
      throw error
    }
  }

  async adminRemoveFunds(userId: string, amount: number, currency: string, reason: string): Promise<void> {
    try {
      // Get current user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single()
      
      if (userError) throw userError
      
      // Check if user has sufficient balance
      if ((user.balance || 0) < amount) {
        throw new Error('Insufficient balance')
      }
      
      // Update user balance
      const newBalance = (user.balance || 0) - amount
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
      
      if (updateError) throw updateError
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'Withdrawal',
          asset: currency,
          amount: amount,
          value: amount,
          status: 'Completed',
          fee: 0,
          description: `Admin withdrawal: ${reason}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (transactionError) throw transactionError
      
    } catch (error) {
      console.error('Failed to remove funds:', error)
      throw error
    }
  }

  async resetUserPassword(userId: string): Promise<void> {
    try {
      // Get user email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single()
      
      if (userError) throw userError
      
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      
    } catch (error) {
      console.error('Failed to reset password:', error)
      throw error
    }
  }

  async createAuditLog(log: { userId: string; action: string; details: string; adminId: string }): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: log.userId,
          action: log.action,
          details: log.details,
          admin_id: log.adminId,
          created_at: new Date().toISOString()
        })
      
      if (error) throw error
      
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging should not break main functionality
    }
  }
}

export const supabaseApi = new SupabaseApiService()
export default supabaseApi