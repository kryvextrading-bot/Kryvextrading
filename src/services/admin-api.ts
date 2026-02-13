import { supabase, Database } from '@/lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type InvestmentProduct = Database['public']['Tables']['investment_products']['Row']
type UserInvestment = Database['public']['Tables']['user_investments']['Row']
type Order = Database['public']['Tables']['orders']['Row']
type Position = Database['public']['Tables']['positions']['Row']
type KYCDocument = Database['public']['Tables']['kyc_documents']['Row']

// Admin API Service for dashboard data
export class AdminApiService {
  // ==================== USER MANAGEMENT ====================
  
  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  // ==================== TRANSACTION MANAGEMENT ====================
  
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching transactions:', error)
      throw error
    }
  }

  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      throw error
    }
  }

  async updateTransactionStatus(transactionId: string, status: 'Completed' | 'Pending' | 'Failed'): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({ status })
        .eq('id', transactionId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating transaction status:', error)
      throw error
    }
  }

  // ==================== INVESTMENT PRODUCTS ====================
  
  async getInvestmentProducts(): Promise<InvestmentProduct[]> {
    try {
      const { data, error } = await supabase
        .from('investment_products')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching investment products:', error)
      throw error
    }
  }

  async createInvestmentProduct(product: Omit<InvestmentProduct, 'id' | 'created_at' | 'updated_at'>): Promise<InvestmentProduct> {
    try {
      const { data, error } = await supabase
        .from('investment_products')
        .insert(product)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating investment product:', error)
      throw error
    }
  }

  async updateInvestmentProduct(productId: string, updates: Partial<InvestmentProduct>): Promise<InvestmentProduct> {
    try {
      const { data, error } = await supabase
        .from('investment_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating investment product:', error)
      throw error
    }
  }

  async deleteInvestmentProduct(productId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('investment_products')
        .delete()
        .eq('id', productId)
      
      if (error) throw error
    } catch (error) {
      console.error('Error deleting investment product:', error)
      throw error
    }
  }

  // ==================== USER INVESTMENTS ====================
  
  async getUserInvestments(): Promise<UserInvestment[]> {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user investments:', error)
      throw error
    }
  }

  async getUserInvestmentsByUser(userId: string): Promise<UserInvestment[]> {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user investments:', error)
      throw error
    }
  }

  // ==================== TRADING DATA ====================
  
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching positions:', error)
      throw error
    }
  }

  // ==================== KYC DOCUMENTS ====================
  
  async getKYCDocuments(): Promise<KYCDocument[]> {
    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching KYC documents:', error)
      throw error
    }
  }

  async updateKYCDocumentStatus(documentId: string, status: 'Pending' | 'Verified' | 'Rejected', notes?: string): Promise<KYCDocument> {
    try {
      const updateData: Partial<KYCDocument> = { status }
      if (notes) updateData.notes = notes
      if (status === 'Verified') updateData.verified_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('kyc_documents')
        .update(updateData)
        .eq('id', documentId)
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating KYC document status:', error)
      throw error
    }
  }

  // ==================== DASHBOARD STATISTICS ====================
  
  async getDashboardStats() {
    try {
      const [users, transactions, investments, orders] = await Promise.all([
        this.getUsers(),
        this.getTransactions(),
        this.getInvestmentProducts(),
        this.getOrders()
      ])

      const activeUsers = users.filter(u => u.status === 'Active').length
      const pendingKYC = users.filter(u => u.kyc_status === 'Pending').length
      const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0)
      const completedTransactions = transactions.filter(t => t.status === 'Completed').length
      const pendingTransactions = transactions.filter(t => t.status === 'Pending').length
      const totalInvested = investments.reduce((sum, inv) => sum + (inv.total_invested || 0), 0)
      const activeOrders = orders.filter(o => o.status === 'open').length

      return {
        users: {
          total: users.length,
          active: activeUsers,
          pendingKYC,
          totalBalance
        },
        transactions: {
          total: transactions.length,
          completed: completedTransactions,
          pending: pendingTransactions
        },
        investments: {
          total: investments.length,
          totalInvested,
          active: investments.filter(inv => inv.status === 'active').length
        },
        trading: {
          totalOrders: orders.length,
          activeOrders,
          totalVolume: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  // ==================== WALLET REQUESTS ====================
  
  async getWalletRequests() {
    // This would be implemented based on your wallet request table structure
    // For now, returning empty array as placeholder
    return []
  }

  // ==================== ROLE AND PERMISSIONS ====================
  
  async getRoles() {
    // This would be implemented based on your roles table structure
    // For now, returning empty array as placeholder
    return []
  }

  async getPermissions() {
    // This would be implemented based on your permissions table structure
    // For now, returning empty array as placeholder
    return []
  }

  async getAuditLogs() {
    // This would be implemented based on your audit logs table structure
    // For now, returning empty array as placeholder
    return []
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService()
