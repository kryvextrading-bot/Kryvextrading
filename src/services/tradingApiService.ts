/**
 * Trading API Service
 * Handles real trading execution with admin outcome control
 */

interface SpotTradeRequest {
  pair: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price: number;
  total: number;
}

interface FuturesTradeRequest {
  pair: string;
  side: 'buy' | 'sell';
  positionType: 'open' | 'close';
  orderType: 'market' | 'limit' | 'stop';
  amount: number;
  price: number;
  leverage: number;
  margin: number;
}

interface OptionsTradeRequest {
  pair: string;
  direction: 'up' | 'down';
  amount: number;
  timeFrame: number;
  payout: number;
}

interface TradeResponse {
  success: boolean;
  trade: {
    id: string;
    pair: string;
    side: string;
    type: string;
    amount: number;
    price: number;
    total: number;
    status: string;
    outcome: 'win' | 'loss';
    pnl: number;
    message: string;
    metadata: {
      shouldWin: boolean;
      timestamp: number;
    };
  };
}

class TradingApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  }

  private async makeRequest(endpoint: string, data: any): Promise<any> {
    // For testing, we'll use a mock token since the test server doesn't require auth
    const token = localStorage.getItem('authToken') || 'mock-jwt-token-test';
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Trade execution failed');
    }

    return response.json();
  }

  // Execute spot trade with admin outcome control
  async executeSpotTrade(params: SpotTradeRequest): Promise<TradeResponse> {
    console.log('🚀 Executing spot trade:', params);
    
    try {
      const response = await this.makeRequest('/api/trading/spot', params);
      console.log('✅ Spot trade executed:', response);
      return response;
    } catch (error) {
      console.error('❌ Spot trade failed:', error);
      throw error;
    }
  }

  // Execute futures trade with admin outcome control
  async executeFuturesTrade(params: FuturesTradeRequest): Promise<TradeResponse> {
    console.log('🚀 Executing futures trade:', params);
    
    try {
      const response = await this.makeRequest('/api/trading/futures', params);
      console.log('✅ Futures trade executed:', response);
      return response;
    } catch (error) {
      console.error('❌ Futures trade failed:', error);
      throw error;
    }
  }

  // Execute options trade with admin outcome control
  async executeOptionsTrade(params: OptionsTradeRequest): Promise<TradeResponse> {
    console.log('🚀 Executing options trade:', params);
    
    try {
      const response = await this.makeRequest('/api/trading/options', params);
      console.log('✅ Options trade executed:', response);
      return response;
    } catch (error) {
      console.error('❌ Options trade failed:', error);
      throw error;
    }
  }

  // Get trading history
  async getTradingHistory(): Promise<any[]> {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch(`${this.baseUrl}/api/trading/history`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trading history');
    }

    const data = await response.json();
    return data.history || [];
  }
}

// Admin control service
class AdminControlService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
  }

  // Enable/disable force win
  async setForceWin(enabled: boolean): Promise<any> {
    console.log(`👑 Setting force win to: ${enabled}`);
    
    const response = await fetch(`${this.baseUrl}/api/admin/force-win`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled }),
    });

    if (!response.ok) {
      throw new Error('Failed to update force win setting');
    }

    const data = await response.json();
    console.log('✅ Force win setting updated:', data);
    return data;
  }

  // Get current admin settings
  async getSettings(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/admin/settings`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin settings');
    }

    return response.json();
  }
}

export const tradingApiService = new TradingApiService();
export const adminControlService = new AdminControlService();
