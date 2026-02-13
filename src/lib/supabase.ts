import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://trzvvacsfxfpwuekenfc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyenZhY3NmeGZwd3Vla2VuZmMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNjgxMjQwMCwiZXhwIjoyMDUyMzg4ODAwfQ.sb_publishable_xhmrUNQOfyYeqX44jlSAKA_HVQpKndg'

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
    }
  }
}
