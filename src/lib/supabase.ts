import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Debug environment variables
console.log('🔍 [Supabase] Environment variables:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  anonKey: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  serviceKey: supabaseServiceKey ? '✅ Set' : '❌ Missing'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})

// Service role client for admin operations (bypasses RLS)
// Use fallback if service key is not available
const adminKey = supabaseServiceKey || supabaseAnonKey

console.log('🔧 [Supabase] Admin client key:', adminKey ? '✅ Using admin key' : '❌ Using anon key as fallback')

export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
})

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          status: 'Active' | 'Pending' | 'Suspended'
          kyc_status: 'Verified' | 'Pending' | 'Rejected'
          account_type: 'Traditional IRA' | 'Roth IRA'
          account_number: string | null
          balance: number
          last_login: string | null
          registration_date: string
          two_factor_enabled: boolean
          risk_tolerance: 'Conservative' | 'Moderate' | 'Aggressive'
          investment_goal: 'Retirement' | 'Wealth Building' | 'Tax Savings'
          is_admin: boolean
          admin_role: 'admin' | 'superadmin' | 'finance' | 'support' | null
          credit_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          user_email: string
          type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal' | 'Trade'
          asset: string
          amount: number
          value: number
          status: 'Completed' | 'Pending' | 'Failed'
          date: string
          fee: number
          details: any | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Row']>
      }
      kyc_documents: {
        Row: {
          id: string
          user_id: string
          document_type: string
          document_url: string
          uploaded_at: string
          verified_at: string | null
          notes: string | null
          status: 'Pending' | 'Verified' | 'Rejected'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['kyc_documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['kyc_documents']['Row']>
      }
      system_settings: {
        Row: {
          id: string
          category: 'general' | 'security' | 'trading'
          key: string
          value: any
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['system_settings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['system_settings']['Row']>
      }
      investments: {
        Row: {
          id: string
          type: string
          name: string
          description: string
          min_investment: number
          expected_return: number
          duration: string
          risk_level: 'low' | 'medium' | 'high'
          icon: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['investments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['investments']['Row']>
      }
      investment_products: {
        Row: {
          id: string
          type: 'quant-trading' | 'node-staking' | 'ai-arbitrage' | 'defi' | 'mining' | 'real-estate' | 'private-equity'
          name: string
          description: string | null
          long_description: string | null
          min_investment: number
          max_investment: number | null
          expected_return: number
          actual_return: number | null
          duration: string
          duration_days: number | null
          risk_level: 'low' | 'medium' | 'high' | 'very-high'
          management_fee: number
          performance_fee: number
          early_withdrawal_penalty: number | null
          lockup_period: string | null
          status: 'active' | 'inactive' | 'coming-soon' | 'ended' | 'paused'
          icon: string | null
          image_url: string | null
          tags: string[]
          featured: boolean
          popular: boolean
          total_invested: number
          investors_count: number
          available_from: string | null
          available_to: string | null
          max_capacity: number | null
          documents: any | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['investment_products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['investment_products']['Row']>
      }
      user_investments: {
        Row: {
          id: string
          user_id: string
          product_id: string
          amount: number
          current_value: number
          returns: number
          returns_percentage: number
          status: 'active' | 'pending' | 'completed' | 'cancelled'
          start_date: string
          maturity_date: string | null
          last_distribution_date: string | null
          distribution_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'at_maturity' | null
          total_distributions: number
          notes: string | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_investments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_investments']['Row']>
      }
      orders: {
        Row: {
          id: string
          user_id: string
          pair_id: string | null
          symbol: string
          type: 'market' | 'limit' | 'stop' | 'stop_limit'
          side: 'buy' | 'sell'
          amount: number
          price: number | null
          stop_price: number | null
          filled_amount: number
          status: 'open' | 'closed' | 'cancelled' | 'expired'
          executed_price: number | null
          executed_value: number | null
          fee: number
          fee_asset: string | null
          leverage: number
          margin: number | null
          liquidation_price: number | null
          take_profit: number | null
          stop_loss: number | null
          expires_at: string | null
          executed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      positions: {
        Row: {
          id: string
          user_id: string
          symbol: string
          side: 'buy' | 'sell'
          quantity: number
          entry_price: number
          current_price: number | null
          liquidation_price: number | null
          margin: number
          leverage: number
          unrealized_pnl: number
          realized_pnl: number
          status: 'open' | 'closed' | 'liquidated'
          opened_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['positions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['positions']['Row']>
      }
      trading_pairs: {
        Row: {
          id: string
          base_asset: string
          quote_asset: string
          symbol: string
          min_order_size: number
          max_order_size: number
          price_precision: number
          amount_precision: number
          min_notional: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trading_pairs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trading_pairs']['Row']>
      }
      deposit_requests: {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string | null
          amount: number
          currency: string
          network: string
          address: string
          status: 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Completed'
          proof_url: string | null
          proof_file_name: string | null
          admin_notes: string | null
          processed_by: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['deposit_requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['deposit_requests']['Row']>
      }
      trade_outcomes: {
        Row: {
          id: string
          user_id: string
          enabled: boolean
          outcome_type: 'win' | 'loss' | 'default'
          spot_enabled: boolean
          futures_enabled: boolean
          options_enabled: boolean
          arbitrage_enabled: boolean
          futures_current_pnl: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trade_outcomes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trade_outcomes']['Row']>
      }
    }
  }
}
