import { supabase } from '@/lib/supabase';

export interface AuditEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AdminAudit {
  static async log(entry: AuditEntry): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resource_id: entry.resourceId,
          changes: entry.changes,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent,
          metadata: entry.metadata,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Failed to create audit log:', error);
      }
    } catch (error) {
      console.error('Error in audit logging:', error);
    }
  }

  static async getLogs(filters?: any): Promise<any> {
    const query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (filters?.search) {
      query.or(`action.ilike.%${filters.search}%,resource.ilike.%${filters.search}%`);
    }
    
    if (filters?.userId) {
      query.eq('user_id', filters.userId);
    }
    
    if (filters?.dateRange) {
      const now = new Date();
      let start: Date | undefined;
      let end: Date | undefined = filters.endDate ? new Date(filters.endDate) : undefined;

      switch (filters.dateRange) {
        case 'today':
          start = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          start = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          start = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          start = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          start = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      if (start) query.gte('created_at', start.toISOString());
      if (end) query.lte('created_at', end.toISOString());
    }
    
    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query.range(from, to);
    }
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0,
      page: filters?.page || 1,
      limit: filters?.limit || data?.length || 0,
      totalPages: Math.ceil((count || 0) / (filters?.limit || 1))
    };
  }

  private static getDateRange(filters: any): { start?: string; end?: string } {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined = filters.endDate ? new Date(filters.endDate) : undefined;

    switch (filters.dateRange) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        start = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    return {
      start: start?.toISOString(),
      end: end?.toISOString()
    };
  }
}
