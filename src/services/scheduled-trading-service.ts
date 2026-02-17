import { ScheduledTrade } from '@/types/trading-unified';

export interface ScheduledTradingService {
  getUserScheduledTrades(userId: string): Promise<ScheduledTrade[]>;
  createScheduledTrade(trade: Omit<ScheduledTrade, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; tradeId?: string; error?: string }>;
  cancelScheduledTrade(tradeId: string): Promise<{ success: boolean; error?: string }>;
}

class ScheduledTradingServiceImpl implements ScheduledTradingService {
  private baseUrl = '/api/scheduled-trades';

  async getUserScheduledTrades(userId: string): Promise<ScheduledTrade[]> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled trades');
      }
      
      const trades = await response.json();
      return trades as ScheduledTrade[];
    } catch (error) {
      console.error('Error fetching scheduled trades:', error);
      throw error;
    }
  }

  async createScheduledTrade(trade: Omit<ScheduledTrade, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; tradeId?: string; error?: string }> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...trade,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create scheduled trade');
      }

      const result = await response.json();
      return { success: true, tradeId: result.tradeId };
    } catch (error) {
      console.error('Error creating scheduled trade:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async cancelScheduledTrade(tradeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${tradeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel scheduled trade');
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling scheduled trade:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const scheduledTradingService = new ScheduledTradingServiceImpl();
