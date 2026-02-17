// API Service Layer for Kryvex Trading Platform - Clean Version
// This handles all backend communication and data management

import { supabase } from '@/lib/supabase';
import { adminApiService } from './admin-api';

// API Configuration
const API_BASE_URL = 'http://localhost:3001';

// Price data interfaces
export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

// Stub functions for price data (to be implemented with real APIs)
export async function getStockPrices(): Promise<PriceData[]> {
  // TODO: Implement with real stock API
  return [];
}

export async function getForexPrices(): Promise<PriceData[]> {
  // TODO: Implement with real forex API
  return [];
}

export async function getEtfPrices(): Promise<PriceData[]> {
  // TODO: Implement with real ETF API
  return [];
}

export async function getCryptoPrices(): Promise<PriceData[]> {
  // TODO: Implement with real crypto API
  return [];
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: "Active" | "Pending" | "Suspended";
  kycStatus: "Pending" | "Verified" | "Rejected";
  accountType: "Traditional IRA" | "Roth IRA";
  accountNumber: string;
  balance: number;
  lastLogin: string;
  registrationDate: string;
  twoFactorEnabled: boolean;
  riskTolerance: "Conservative" | "Moderate" | "Aggressive";
  investmentGoal: "Retirement" | "Wealth Building" | "Tax Savings";
  isAdmin: boolean;
  adminRole?: "finance" | "admin" | "superadmin" | "support";
  creditScore: number;
  mfaEnabled: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: string;
  asset: string;
  amount: number;
  value: number;
  status: string;
  date: string;
  fee: number;
  details: any;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  maintenance: boolean;
  maintenanceMessage: string;
  tradingEnabled: boolean;
  newRegistrations: boolean;
  kycRequired: boolean;
  twoFactorRequired: boolean;
  maxWithdrawalAmount: number;
  supportedAssets: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  adminId: string;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: string;
  resolved: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  pendingKYC: number;
  systemStatus: "healthy" | "warning" | "critical";
}

// Mock data for development
const mockUsers: User[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@email.com",
    phone: "+1234567890",
    status: "Active",
    kycStatus: "Verified",
    accountType: "Traditional IRA",
    accountNumber: "IRA123456789",
    balance: 50000,
    lastLogin: "2024-01-15T10:30:00Z",
    registrationDate: "2023-06-15T09:00:00Z",
    twoFactorEnabled: true,
    riskTolerance: "Moderate",
    investmentGoal: "Retirement",
    isAdmin: false,
    creditScore: 750,
    mfaEnabled: true
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@email.com",
    phone: "+1234567891",
    status: "Pending",
    kycStatus: "Pending",
    accountType: "Roth IRA",
    accountNumber: "ROTH987654321",
    balance: 25000,
    lastLogin: "2024-01-10T15:45:00Z",
    registrationDate: "2023-08-20T14:30:00Z",
    twoFactorEnabled: false,
    riskTolerance: "Conservative",
    investmentGoal: "Wealth Building",
    isAdmin: false,
    creditScore: 680,
    mfaEnabled: false
  },
  {
    id: "99",
    firstName: "Admin",
    lastName: "Laurent",
    email: "admin@swan-ira.com",
    phone: "+1234567899",
    status: "Active",
    kycStatus: "Verified",
    accountType: "Admin",
    accountNumber: "ADMIN001",
    balance: 0,
    lastLogin: "2024-01-16T08:00:00Z",
    registrationDate: "2023-01-01T00:00:00Z",
    twoFactorEnabled: true,
    riskTolerance: "Moderate",
    investmentGoal: "Retirement",
    isAdmin: true,
    adminRole: "superadmin",
    creditScore: 850,
    mfaEnabled: true
  }
];

const mockTransactions: Transaction[] = [
  {
    id: "1",
    userId: "1",
    userEmail: "john.doe@email.com",
    type: "buy",
    asset: "BTC",
    amount: 0.5,
    value: 25000,
    status: "completed",
    date: "2024-01-15T10:30:00Z",
    fee: 25,
    details: { exchange: "Coinbase", price: 50000 },
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:35:00Z"
  },
  {
    id: "2",
    userId: "2",
    userEmail: "jane.smith@email.com",
    type: "sell",
    asset: "ETH",
    amount: 2,
    value: 4000,
    status: "pending",
    date: "2024-01-16T14:20:00Z",
    fee: 8,
    details: { exchange: "Kraken", price: 2000 },
    created_at: "2024-01-16T14:20:00Z",
    updated_at: "2024-01-16T14:20:00Z"
  }
];

const mockSystemSettings: SystemSettings = {
  maintenance: false,
  maintenanceMessage: "",
  tradingEnabled: true,
  newRegistrations: true,
  kycRequired: true,
  twoFactorRequired: false,
  maxWithdrawalAmount: 10000,
  supportedAssets: ["BTC", "ETH", "LTC", "BCH", "ADA"]
};

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    action: "User Login",
    details: "Admin user logged in successfully",
    timestamp: "2024-01-16T08:00:00Z",
    adminId: "99"
  },
  {
    id: "2",
    action: "User Update",
    details: "Updated user KYC status",
    timestamp: "2024-01-15T16:30:00Z",
    adminId: "99"
  }
];

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: "1",
    type: "Failed Login Attempt",
    severity: "medium",
    description: "Multiple failed login attempts detected",
    timestamp: "2024-01-16T07:45:00Z",
    resolved: false
  }
];

const mockDashboardStats: DashboardStats = {
  totalUsers: 3,
  activeUsers: 2,
  totalTransactions: 2,
  totalVolume: 29000,
  pendingKYC: 1,
  systemStatus: "healthy"
};

// Helper function to transform Supabase user data to our User interface
function transformSupabaseUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    firstName: supabaseUser.first_name || '',
    lastName: supabaseUser.last_name || '',
    email: supabaseUser.email || '',
    phone: supabaseUser.phone || '',
    status: supabaseUser.status || 'Pending',
    kycStatus: supabaseUser.kyc_status || 'Pending',
    accountType: supabaseUser.account_type || 'Traditional IRA',
    accountNumber: supabaseUser.account_number || '',
    balance: supabaseUser.balance || 0,
    lastLogin: supabaseUser.last_login || '',
    registrationDate: supabaseUser.created_at || '',
    twoFactorEnabled: supabaseUser.two_factor_enabled || false,
    riskTolerance: supabaseUser.risk_tolerance || 'Moderate',
    investmentGoal: supabaseUser.investment_goal || 'Retirement',
    isAdmin: supabaseUser.is_admin || false,
    adminRole: supabaseUser.admin_role,
    creditScore: supabaseUser.credit_score || 700,
    mfaEnabled: supabaseUser.mfa_enabled || false
  };
}

// Helper function to transform Supabase transaction data
function transformSupabaseTransaction(supabaseTransaction: any): Transaction {
  return {
    id: supabaseTransaction.id,
    userId: supabaseTransaction.user_id,
    userEmail: supabaseTransaction.user_email,
    type: supabaseTransaction.type,
    asset: supabaseTransaction.asset,
    amount: supabaseTransaction.amount,
    value: supabaseTransaction.value,
    status: supabaseTransaction.status,
    date: supabaseTransaction.date || supabaseTransaction.created_at,
    fee: supabaseTransaction.fee || 0,
    details: supabaseTransaction.details || {},
    created_at: supabaseTransaction.created_at,
    updated_at: supabaseTransaction.updated_at
  };
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // User Management - Using Supabase via adminApiService
  async getUsers(): Promise<User[]> {
    try {
      const response = await adminApiService.getUsers();
      return response.data.map(transformSupabaseUser);
    } catch (error) {
      console.error('Error fetching users from Supabase:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const supabaseUser = await adminApiService.getUserById(id);
      if (!supabaseUser) throw new Error('User not found');
      return transformSupabaseUser(supabaseUser);
    } catch (error) {
      console.error('Error fetching user from Supabase:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      // Transform the data to Supabase format
      const supabaseData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        status: data.status,
        kyc_status: data.kycStatus,
        account_type: data.accountType,
        account_number: data.accountNumber,
        balance: data.balance,
        last_login: data.lastLogin,
        two_factor_enabled: data.twoFactorEnabled,
        risk_tolerance: data.riskTolerance,
        investment_goal: data.investmentGoal,
        is_admin: data.isAdmin,
        admin_role: data.adminRole,
        credit_score: data.creditScore,
        mfa_enabled: data.mfaEnabled
      };
      
      // Remove undefined values
      Object.keys(supabaseData).forEach(key => {
        if (supabaseData[key] === undefined) delete supabaseData[key];
      });
      
      const updatedUser = await adminApiService.updateUser(id, supabaseData);
      return transformSupabaseUser(updatedUser);
    } catch (error) {
      console.error('Error updating user in Supabase:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await adminApiService.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user from Supabase:', error);
      throw error;
    }
  }

  // Transaction Management - Using Supabase via adminApiService
  async getTransactions(): Promise<Transaction[]> {
    try {
      const response = await adminApiService.getTransactions();
      return response.data.map(transformSupabaseTransaction);
    } catch (error) {
      console.error('Error fetching transactions from Supabase:', error);
      throw error;
    }
  }

  async getTransaction(id: string): Promise<Transaction> {
    try {
      const supabaseTransactions = await adminApiService.getTransactions();
      const supabaseTransaction = supabaseTransactions.find(t => t.id === id);
      if (!supabaseTransaction) throw new Error('Transaction not found');
      return transformSupabaseTransaction(supabaseTransaction);
    } catch (error) {
      console.error('Error fetching transaction from Supabase:', error);
      throw error;
    }
  }

  // Dashboard Statistics - Using Supabase via adminApiService
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalVolume: number;
    pendingTransactions: number;
    totalBalance: number;
  }> {
    try {
      const stats = await adminApiService.getDashboardStats();
      return {
        totalUsers: stats.users?.total || 0,
        activeUsers: stats.users?.active || 0,
        totalVolume: stats.trading?.totalVolume || 0,
        pendingTransactions: stats.transactions?.pending || 0,
        totalBalance: stats.users?.totalBalance || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats from Supabase:', error);
      // Return empty stats instead of mock data
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalVolume: 0,
        pendingTransactions: 0,
        totalBalance: 0
      };
    }
  }

  // System Settings - Using Supabase via adminApiService
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const settings = await adminApiService.getSystemSettings();
      return {
        maintenance: settings.maintenance,
        maintenanceMessage: settings.maintenance_message,
        tradingEnabled: settings.trading_enabled,
        newRegistrations: settings.new_registrations,
        kycRequired: settings.kyc_required,
        twoFactorRequired: settings.two_factor_required,
        maxWithdrawalAmount: settings.max_withdrawal_amount,
        supportedAssets: settings.supported_assets || []
      };
    } catch (error) {
      console.error('Error fetching system settings from Supabase:', error);
      throw error;
    }
  }

  // Audit Logs - Using Supabase via adminApiService
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const logs = await adminApiService.getAuditLogs();
      // Handle both array and paginated response formats
      const logsArray = Array.isArray(logs) ? logs : logs?.data || [];
      return logsArray.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
        adminId: log.admin_id
      }));
    } catch (error) {
      console.error('Error fetching audit logs from Supabase:', error);
      return [];
    }
  }

  // Security Events - Using Supabase via adminApiService
  async getSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      const events = await adminApiService.getSecurityEvents();
      return events.map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        description: event.description,
        timestamp: event.timestamp,
        resolved: event.resolved
      }));
    } catch (error) {
      console.error('Error fetching security events from Supabase:', error);
      throw error;
    }
  }

  // Multi-exchange price data for arbitrage
  async getMultiExchangePrices(pairs: string[]): Promise<Record<string, Record<string, number>>> {
    // Mock implementation for development
    const mockPrices: Record<string, Record<string, number>> = {};
    
    // Generate mock prices for each pair
    pairs.forEach(pair => {
      const basePrice = pair === 'BTCUSDT' ? 95000 + Math.random() * 5000 : 
                       pair === 'ETHUSDT' ? 3500 + Math.random() * 200 : 
                       100 + Math.random() * 50;
      
      mockPrices[pair] = {
        'Binance': basePrice * (1 + (Math.random() - 0.5) * 0.002),
        'Coinbase': basePrice * (1 + (Math.random() - 0.5) * 0.003),
        'Kraken': basePrice * (1 + (Math.random() - 0.5) * 0.0025),
        'Bybit': basePrice * (1 + (Math.random() - 0.5) * 0.0018),
        'OKX': basePrice * (1 + (Math.random() - 0.5) * 0.0022)
      };
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockPrices;
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Also export as default for compatibility
export default apiService;
