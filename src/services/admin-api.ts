import { supabase } from '@/lib/supabase';
import { AdminCache } from './admin-api/cache';
import { AdminRealtime } from './admin-api/real-time';
import { AdminMetrics } from './admin-api/metrics';
import { AdminExport } from './admin-api/export';
import { AdminAudit } from './admin-api/audit';
import { AdminQueryBuilder, AdminFilters, PaginatedResponse } from './admin-api/query-builder';
import {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  normalizeApiError
} from './admin-api/errors';
import type {
  User,
  Transaction,
  InvestmentProduct,
  UserInvestment,
  Order,
  Position,
  KYCDocument,
  DashboardStats
} from '@/types/admin';

export class AdminApiService {
  private cache = new AdminCache();
  private realtime = new AdminRealtime();
  private metrics = new AdminMetrics();
  private currentUser: { id: string; email: string; role: string } | null = null;

  constructor() {
    this.initializeMetrics();
  }

  private async initializeMetrics(): Promise<void> {
    // Start collecting metrics
    setInterval(async () => {
      try {
        const start = Date.now();
        await this.checkHealth();
        const latency = Date.now() - start;
        this.metrics.record('api_latency', latency);
      } catch (error) {
        this.metrics.record('api_error', 1);
      }
    }, 60000); // Every minute
  }

  private async checkAuth(): Promise<void> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new UnauthorizedError();
    }

    // Cache current user info
    if (!this.currentUser || this.currentUser.id !== user.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, email, is_admin, admin_role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new ForbiddenError('User profile not found');
      }

      if (!profile.is_admin) {
        throw new ForbiddenError('Admin access required');
      }

      this.currentUser = {
        id: profile.id,
        email: profile.email,
        role: profile.admin_role || 'admin'
      };
    }
  }

  private async withAuth<T>(fn: () => Promise<T>): Promise<T> {
    await this.checkAuth();
    try {
      const result = await fn();
      this.metrics.record('api_success', 1);
      return result;
    } catch (error) {
      this.metrics.record('api_error', 1);
      throw error;
    }
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  // ==================== USER MANAGEMENT ====================

  async getUsers(filters?: AdminFilters): Promise<PaginatedResponse<User>> {
    return this.withAuth(async () => {
      const cacheKey = this.getCacheKey('users', filters);
      const cached = this.cache.get<PaginatedResponse<User>>(cacheKey);
      if (cached) return cached;

      const query = new AdminQueryBuilder('users')
        .applyFilters(filters || {});
      
      const result = await query.execute<User>();
      this.cache.set(cacheKey, result, 30000);
      
      return result;
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.withAuth(async () => {
      const cacheKey = this.getCacheKey('user', { id });
      const cached = this.cache.get<User>(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      this.cache.set(cacheKey, data, 60000);
      return data;
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.withAuth(async () => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate cache
      this.cache.invalidatePattern(/user/);
      this.cache.invalidatePattern(/users/);

      // Log audit
      await AdminAudit.log({
        userId: this.currentUser!.id,
        action: 'UPDATE_USER',
        resource: 'users',
        resourceId: id,
        changes: updates
      });

      return data;
    });
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(filters?: AdminFilters): Promise<PaginatedResponse<Transaction>> {
    return this.withAuth(async () => {
      const cacheKey = this.getCacheKey('transactions', filters);
      const cached = this.cache.get<PaginatedResponse<Transaction>>(cacheKey);
      if (cached) return cached;

      const query = new AdminQueryBuilder('transactions')
        .applyFilters(filters || {});
      
      const result = await query.execute<Transaction>();
      this.cache.set(cacheKey, result, 15000);
      
      return result;
    });
  }

  // ==================== SYSTEM SETTINGS ====================

  async getSystemSettings(): Promise<any> {
    return this.withAuth(async () => {
      // Since system_settings table doesn't exist, return default settings
      return {
        maintenance: false,
        maintenance_message: '',
        trading_enabled: true,
        new_registrations: true,
        kyc_required: true,
        two_factor_required: false,
        max_withdrawal_amount: 10000,
        supported_assets: ['BTC', 'ETH', 'USDT']
      };
    });
  }

  // ==================== SECURITY EVENTS ====================

  async getSecurityEvents(): Promise<any[]> {
    return this.withAuth(async () => {
      // Since security_events table doesn't exist, return empty array
      return [];
    });
  }

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats(): Promise<DashboardStats> {
    return this.withAuth(async () => {
      const cacheKey = 'dashboard_stats';
      const cached = this.cache.get<DashboardStats>(cacheKey);
      if (cached) return cached;

      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: pendingKYC },
        { count: suspendedUsers },
        { count: totalTransactions },
        { count: completedTransactions },
        { count: pendingTransactions },
        { count: failedTransactions }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
        supabase.from('kyc_documents').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Suspended'),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'Completed'),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'Failed')
      ]);

      const stats: DashboardStats = {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          pendingKYC: pendingKYC || 0,
          suspended: suspendedUsers || 0,
          totalBalance: 0, // Would need to calculate from user balances
          newToday: 0, // Would need to calculate from today's registrations
          growthRate: 0 // Would need to calculate from historical data
        },
        transactions: {
          total: totalTransactions || 0,
          completed: completedTransactions || 0,
          pending: pendingTransactions || 0,
          failed: failedTransactions || 0,
          totalVolume: 0, // Would need to calculate from transaction amounts
          totalFees: 0, // Would need to calculate from transaction fees
          averageValue: 0 // Would need to calculate from transaction amounts
        },
        investments: {
          total: 0,
          active: 0,
          totalInvested: 0,
          averageReturn: 0,
          totalReturns: 0
        },
        trading: {
          totalOrders: 0,
          activeOrders: 0,
          totalVolume: 0,
          buyVolume: 0,
          sellVolume: 0,
          successRate: 0
        },
        system: {
          uptime: 0,
          apiLatency: this.metrics.getAverage('api_latency'),
          activeConnections: 0,
          errorRate: 0,
          lastBackup: new Date().toISOString()
        }
      };

      this.cache.set(cacheKey, stats, 60000);
      return stats;
    });
  }

  // ==================== HEALTH CHECK ====================

  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const start = Date.now();
    try {
      const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      const latency = Date.now() - start;
      
      if (error) {
        return { status: 'unhealthy', latency };
      }
      
      return { status: 'healthy', latency };
    } catch {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }

  // ==================== ROLES & PERMISSIONS ====================

  async getRoles(): Promise<any[]> {
    return this.withAuth(async () => {
      // Since roles table doesn't exist, return mock data
      return [
        { id: '1', name: 'super_admin', description: 'Full system access' },
        { id: '2', name: 'admin', description: 'Administrative access' },
        { id: '3', name: 'finance', description: 'Financial operations access' },
        { id: '4', name: 'support', description: 'Customer support access' }
      ];
    });
  }

  async getPermissions(): Promise<any[]> {
    return this.withAuth(async () => {
      // Since permissions table doesn't exist, return mock data
      return [
        { id: '1', resource: 'users', action: 'read', description: 'View user information' },
        { id: '2', resource: 'users', action: 'write', description: 'Modify user information' },
        { id: '3', resource: 'transactions', action: 'read', description: 'View transactions' },
        { id: '4', resource: 'transactions', action: 'write', description: 'Process transactions' },
        { id: '5', resource: 'kyc', action: 'read', description: 'View KYC documents' },
        { id: '6', resource: 'kyc', action: 'write', description: 'Verify KYC documents' }
      ];
    });
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogs(filters?: AdminFilters): Promise<PaginatedResponse<any>> {
    return this.withAuth(async () => {
      // Since audit_logs table doesn't exist, return mock data
      const mockLogs = [
        {
          id: '1',
          user_id: 'admin-1',
          action: 'LOGIN',
          resource: 'auth',
          changes: null,
          ip_address: '127.0.0.1',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'admin-1',
          action: 'UPDATE_USER',
          resource: 'users',
          resource_id: 'user-123',
          changes: { status: 'Active' },
          ip_address: '127.0.0.1',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      return {
        data: mockLogs,
        total: mockLogs.length,
        page: 1,
        limit: 10,
        totalPages: 1
      };
    });
  }
}

// Export singleton instance
export const adminApiService = new AdminApiService();

// Export types
export * from '@/types/admin';
export * from './admin-api/errors';
