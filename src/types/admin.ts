import { Database } from '@/lib/supabase';

export type User = Database['public']['Tables']['users']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type InvestmentProduct = Database['public']['Tables']['investment_products']['Row']
export type UserInvestment = Database['public']['Tables']['user_investments']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Position = Database['public']['Tables']['positions']['Row']
export type KYCDocument = Database['public']['Tables']['kyc_documents']['Row']

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    pendingKYC: number;
    suspended: number;
    totalBalance: number;
    newToday: number;
    growthRate: number;
  };
  transactions: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalVolume: number;
    totalFees: number;
    averageValue: number;
  };
  investments: {
    total: number;
    active: number;
    totalInvested: number;
    averageReturn: number;
    totalReturns: number;
  };
  trading: {
    totalOrders: number;
    activeOrders: number;
    totalVolume: number;
    buyVolume: number;
    sellVolume: number;
    successRate: number;
  };
  system: {
    uptime: number;
    apiLatency: number;
    activeConnections: number;
    errorRate: number;
    lastBackup: string;
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  metric: string;
}

export interface AdminFilters {
  search?: string;
  status?: string;
  dateRange?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
