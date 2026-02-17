import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Simple API client for options trading
const API_BASE = 'http://localhost:3001/api';

class OptionsApi {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; success: boolean; error?: string }> {
    const url = `${API_BASE}${endpoint}`;
    
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

    const result = await response.json();
    return result as { data: T; success: boolean; error?: string };
  }

  async get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

const optionsApi = new OptionsApi();

export interface OptionOrder {
  id: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  entryPrice: number;
  expiryPrice: number | null;
  profit: number;
  fee: number;
  duration: number;
  fluctuationRange: number;
  payoutRate: number;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  pnl: number | null;
  startTime: string;
  endTime: string;
  createdAt: string;
  completedAt: string | null;
}

export interface ScheduledTrade {
  id: string;
  pairId: string;
  direction: 'UP' | 'DOWN';
  stake: number;
  duration: number;
  fluctuationRange: number;
  payoutRate: number;
  scheduledTime: string;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
  executedOrderId?: string;
  failureReason?: string;
  createdAt: string;
  executedAt?: string;
}

export interface FluctuationOption {
  label: string;
  value: number;
  payout: number;
}

export interface PurchaseRange {
  min: number;
  max: number;
}

export const useOptionTrading = (pairId: string) => {
  const [activeOrders, setActiveOrders] = useState<OptionOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<OptionOrder[]>([]);
  const [scheduledTrades, setScheduledTrades] = useState<ScheduledTrade[]>([]);
  const [loading, setLoading] = useState(false);
  const [fluctuationOptions, setFluctuationOptions] = useState<FluctuationOption[]>([]);
  const [purchaseRange, setPurchaseRange] = useState<PurchaseRange>({ min: 100, max: 50000 });

  /**
   * Load active orders
   */
  const loadActiveOrders = useCallback(async () => {
    try {
      const response = await optionsApi.get('/options/options/active');
      if (response.data.success) {
        setActiveOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load active orders:', error);
    }
  }, []);

  /**
   * Load completed orders
   */
  const loadCompletedOrders = useCallback(async () => {
    try {
      const response = await optionsApi.get('/options/options/completed');
      if (response.data.success) {
        setCompletedOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load completed orders:', error);
    }
  }, []);

  /**
   * Load scheduled trades
   */
  const loadScheduledTrades = useCallback(async () => {
    try {
      const response = await optionsApi.get('/options/options/scheduled');
      if (response.data.success) {
        setScheduledTrades(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load scheduled trades:', error);
    }
  }, []);

  /**
   * Load fluctuation options for duration
   */
  const loadFluctuationOptions = useCallback(async (duration: number) => {
    try {
      const response = await optionsApi.get(`/options/options/fluctuation-ranges/${duration}`);
      if (response.data.success) {
        setFluctuationOptions(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load fluctuation options:', error);
    }
  }, []);

  /**
   * Load purchase range for duration
   */
  const loadPurchaseRange = useCallback(async (duration: number) => {
    try {
      const response = await optionsApi.get(`/options/options/purchase-range/${duration}`);
      if (response.data.success) {
        setPurchaseRange(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load purchase range:', error);
    }
  }, []);

  /**
   * Purchase an option immediately
   */
  const purchaseOption = useCallback(async (data: {
    direction: 'UP' | 'DOWN';
    stake: number;
    duration: number;
    fluctuationRange: number;
    payoutRate: number;
  }) => {
    setLoading(true);
    try {
      const response = await optionsApi.post('/options/options/order', {
        pairId,
        ...data
      });

      if (response.data.success) {
        toast.success('Option purchased successfully');
        await loadActiveOrders();
        return response.data.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to purchase option');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pairId, loadActiveOrders]);

  /**
   * Schedule an option trade
   */
  const scheduleOption = useCallback(async (data: {
    direction: 'UP' | 'DOWN';
    stake: number;
    duration: number;
    fluctuationRange: number;
    payoutRate: number;
    scheduledTime: Date;
  }) => {
    setLoading(true);
    try {
      const response = await optionsApi.post('/options/options/schedule', {
        pairId,
        ...data,
        scheduledTime: data.scheduledTime.toISOString()
      });

      if (response.data.success) {
        toast.success('Trade scheduled successfully');
        await loadScheduledTrades();
        return response.data.data;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to schedule trade');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [pairId, loadScheduledTrades]);

  /**
   * Cancel a scheduled trade
   */
  const cancelScheduled = useCallback(async (tradeId: string) => {
    try {
      const response = await optionsApi.delete(`/options/options/schedule/${tradeId}`);
      
      if (response.data.success) {
        toast.success('Scheduled trade cancelled');
        await loadScheduledTrades();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel trade');
      throw error;
    }
  }, [loadScheduledTrades]);

  /**
   * Calculate expected profit
   */
  const calculateExpectedProfit = useCallback((stake: number, payoutRate: number): number => {
    return stake * payoutRate;
  }, []);

  /**
   * Validate amount against purchase range
   */
  const validateAmount = useCallback((amount: number): { valid: boolean; error?: string } => {
    if (amount < purchaseRange.min) {
      return { valid: false, error: `Minimum amount: $${purchaseRange.min.toLocaleString()}` };
    }
    if (amount > purchaseRange.max) {
      return { valid: false, error: `Maximum amount: $${purchaseRange.max.toLocaleString()}` };
    }
    return { valid: true };
  }, [purchaseRange]);

  // Load data on mount
  useEffect(() => {
    if (pairId) {
      loadActiveOrders();
      loadCompletedOrders();
      loadScheduledTrades();
    }
  }, [pairId, loadActiveOrders, loadCompletedOrders, loadScheduledTrades]);

  // Set up polling for active orders (every 5 seconds)
  useEffect(() => {
    if (!pairId) return;

    const interval = setInterval(() => {
      loadActiveOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [pairId, loadActiveOrders]);

  return {
    // Data
    activeOrders,
    completedOrders,
    scheduledTrades,
    fluctuationOptions,
    purchaseRange,
    loading,
    
    // Actions
    purchaseOption,
    scheduleOption,
    cancelScheduled,
    
    // Utilities
    calculateExpectedProfit,
    validateAmount,
    
    // Loaders
    loadFluctuationOptions,
    loadPurchaseRange,
    refresh: loadActiveOrders,
    refreshCompleted: loadCompletedOrders,
    refreshScheduled: loadScheduledTrades
  };
};
