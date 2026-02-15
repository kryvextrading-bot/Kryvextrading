import { supabase } from '@/lib/supabase';

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

export class AdminQueryBuilder {
  private query: any;
  private filters: AdminFilters = {};

  constructor(private table: string) {
    this.query = supabase.from(table).select('*', { count: 'exact' });
  }

  applyFilters(filters: AdminFilters): this {
    this.filters = { ...this.filters, ...filters };

    // Search filter
    if (filters.search && this.getSearchableFields()) {
      const searchFields = this.getSearchableFields();
      const searchConditions = searchFields.map(field => 
        `${field}.ilike.%${filters.search}%`
      ).join(',');
      this.query = this.query.or(searchConditions);
    }

    // Status filter
    if (filters.status) {
      this.query = this.query.eq('status', filters.status);
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = this.getDateRange(filters);
      if (start) {
        this.query = this.query.gte('created_at', start);
      }
      if (end) {
        this.query = this.query.lte('created_at', end);
      }
    }

    // Sorting
    if (filters.sortBy) {
      const order = filters.sortOrder || 'desc';
      this.query = this.query.order(filters.sortBy, { ascending: order === 'asc' });
    } else {
      this.query = this.query.order('created_at', { ascending: false });
    }

    // Pagination
    if (filters.page && filters.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      this.query = this.query.range(from, to);
    }

    return this;
  }

  private getSearchableFields(): string[] {
    // Define searchable fields per table
    const searchableFields: Record<string, string[]> = {
      users: ['email', 'first_name', 'last_name', 'phone'],
      transactions: ['id', 'user_id', 'asset'],
      investment_products: ['name', 'description', 'category'],
      orders: ['id', 'symbol', 'user_id'],
      kyc_documents: ['document_type', 'status']
    };

    return searchableFields[this.table] || [];
  }

  private getDateRange(filters: AdminFilters): { start?: string; end?: string } {
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
      case 'custom':
        start = filters.startDate ? new Date(filters.startDate) : undefined;
        break;
    }

    return {
      start: start?.toISOString(),
      end: end?.toISOString()
    };
  }

  async execute<T>(): Promise<PaginatedResponse<T>> {
    const { data, error, count } = await this.query;
    
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0,
      page: this.filters.page || 1,
      limit: this.filters.limit || data?.length || 0,
      totalPages: Math.ceil((count || 0) / (this.filters.limit || 1))
    };
  }
}
