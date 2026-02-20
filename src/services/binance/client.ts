import CryptoJS from 'crypto-js';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  BinanceAccountInfo,
  BinanceBalance,
  BinanceBalanceWithValue,
  BinancePrice,
  Binance24hrTicker,
  BinanceOrder,
  BinanceTrade,
  BinanceWithdrawal,
  BinanceDeposit,
  BinanceExchangeInfo,
  BinanceConfig,
  BinanceApiError as IBinanceApiError,
  BinanceRateLimit as IBinanceRateLimit
} from './types';
import { BinanceApiError, BinanceAuthError, BinanceRateLimitError } from './errors';

export class BinanceClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly rateLimit: number;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;
  private axiosInstance: AxiosInstance;

  constructor(config: BinanceConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl || 'https://api.binance.com';
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.rateLimit = config.rateLimit || 1200; // requests per minute

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for rate limiting and signing
    this.axiosInstance.interceptors.request.use(async (config) => {
      // Apply rate limiting
      await this.applyRateLimit();

      // Sign request if it's a private endpoint
      if (this.isPrivateEndpoint(config.url || '')) {
        const timestamp = Date.now();
        let queryString = '';

        if (config.params) {
          queryString = new URLSearchParams(config.params).toString();
          queryString += `&timestamp=${timestamp}`;
        } else {
          queryString = `timestamp=${timestamp}`;
        }

        const signature = CryptoJS.HmacSHA256(queryString, this.apiSecret).toString(CryptoJS.enc.Hex);
        
        config.params = {
          ...config.params,
          timestamp,
          signature,
        };
      }

      return config;
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isAxiosError(error) && error.response) {
          const { status, data } = error.response;
          const url = error.config?.url;

          // Handle rate limiting
          if (status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
            throw new BinanceRateLimitError(
              data?.msg || 'Rate limit exceeded',
              retryAfter
            );
          }

          // Handle authentication errors
          if (status === 401 || status === 403) {
            throw new BinanceAuthError(data?.msg || 'Authentication failed');
          }

          // Handle other API errors
          if (data?.code && data?.msg) {
            throw new BinanceApiError(data.msg, data.code, status, url);
          }

          throw new BinanceApiError(error.message, undefined, status, url);
        }

        throw error;
      }
    );
  }

  private isPrivateEndpoint(url: string): boolean {
    const privateEndpoints = [
      '/api/v3/account',
      '/api/v3/order',
      '/api/v3/openOrders',
      '/api/v3/allOrders',
      '/api/v3/myTrades',
      '/sapi/v1/capital/withdraw',
      '/sapi/v1/capital/deposit/history',
      '/sapi/v1/capital/withdraw/history',
    ];
    return privateEndpoints.some(endpoint => url.includes(endpoint));
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeWindow = 60 * 1000; // 1 minute

    // Reset counter if window has passed
    if (now - this.lastRequestTime > timeWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // Check if we're approaching rate limit
    if (this.requestCount >= this.rateLimit) {
      const waitTime = timeWindow - (now - this.lastRequestTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
      }
    }

    this.requestCount++;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        const delay = this.retryDelay * (this.maxRetries - retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors, rate limits, and server errors
    if (error instanceof BinanceRateLimitError) return true;
    if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') return true;
    if (error.status >= 500 && error.status < 600) return true;
    return false;
  }

  // Account endpoints
  async getAccountInfo(): Promise<BinanceAccountInfo> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/api/v3/account');
      return response.data;
    });
  }

  async getBalances(): Promise<BinanceBalance[]> {
    const account = await this.getAccountInfo();
    return account.balances;
  }

  async getNonZeroBalances(): Promise<BinanceBalance[]> {
    const account = await this.getAccountInfo();
    return account.balances.filter(b => 
      parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    );
  }

  async getBalancesWithValues(): Promise<BinanceBalanceWithValue[]> {
    const [account, prices] = await Promise.all([
      this.getAccountInfo(),
      this.getAllPrices()
    ]);

    const priceMap = new Map(prices.map(p => [p.symbol.replace('USDT', ''), parseFloat(p.price)]));

    return account.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => {
        const total = parseFloat(b.free) + parseFloat(b.locked);
        const btcValue = total * (priceMap.get('BTC') || 0);
        const usdtValue = total * (priceMap.get(b.asset) || 0);
        
        return {
          ...b,
          total,
          btcValue,
          usdtValue,
          price: priceMap.get(b.asset) || 0,
          change24h: 0 // Would need separate 24hr ticker call
        };
      })
      .sort((a, b) => b.usdtValue - a.usdtValue);
  }

  // Market data endpoints
  async getPrices(symbols?: string[]): Promise<BinancePrice[]> {
    return this.retryRequest(async () => {
      const params: any = {};
      if (symbols?.length) {
        params.symbols = JSON.stringify(symbols);
      }

      const response = await this.axiosInstance.get('/api/v3/ticker/price', { params });
      return response.data;
    });
  }

  async getPrice(symbol: string): Promise<BinancePrice> {
    const response = await this.axiosInstance.get('/api/v3/ticker/price', {
      params: { symbol }
    });
    return response.data;
  }

  async getAllPrices(): Promise<BinancePrice[]> {
    return this.getPrices();
  }

  async get24hrTicker(symbol?: string): Promise<Binance24hrTicker | Binance24hrTicker[]> {
    const params: any = {};
    if (symbol) {
      params.symbol = symbol;
    }

    const response = await this.axiosInstance.get('/api/v3/ticker/24hr', { params });
    return response.data;
  }

  async getSymbol24hrTicker(symbol: string): Promise<Binance24hrTicker> {
    return this.get24hrTicker(symbol) as Promise<Binance24hrTicker>;
  }

  async getAll24hrTickers(): Promise<Binance24hrTicker[]> {
    return this.get24hrTicker() as Promise<Binance24hrTicker[]>;
  }

  // Order endpoints
  async createOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    quantity: string;
    price?: string;
    stopPrice?: string;
    icebergQty?: string;
    newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
  }): Promise<BinanceOrder> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.post('/api/v3/order', null, {
        params: {
          ...params,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  async cancelOrder(symbol: string, orderId: number): Promise<BinanceOrder> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.delete('/api/v3/order', {
        params: {
          symbol,
          orderId,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  async getOrder(symbol: string, orderId: number): Promise<BinanceOrder> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/api/v3/order', {
        params: {
          symbol,
          orderId,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  async getOpenOrders(symbol?: string): Promise<BinanceOrder[]> {
    return this.retryRequest(async () => {
      const params: any = { timestamp: Date.now() };
      if (symbol) {
        params.symbol = symbol;
      }

      const response = await this.axiosInstance.get('/api/v3/openOrders', { params });
      return response.data;
    });
  }

  async getAllOrders(symbol: string, limit: number = 500): Promise<BinanceOrder[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/api/v3/allOrders', {
        params: {
          symbol,
          limit,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  // Trade endpoints
  async getMyTrades(symbol: string, limit: number = 500): Promise<BinanceTrade[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/api/v3/myTrades', {
        params: {
          symbol,
          limit,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  // Withdrawal endpoints
  async withdraw(params: {
    coin: string;
    address: string;
    amount: string;
    network?: string;
    addressTag?: string;
    name?: string;
    walletType?: number;
  }): Promise<{ id: string }> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.post('/sapi/v1/capital/withdraw/apply', null, {
        params: {
          ...params,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  async getWithdrawalHistory(params?: {
    coin?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<BinanceWithdrawal[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/sapi/v1/capital/withdraw/history', {
        params: {
          ...params,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  async getDepositHistory(params?: {
    coin?: string;
    status?: number;
    startTime?: number;
    endTime?: number;
    limit?: number;
  }): Promise<BinanceDeposit[]> {
    return this.retryRequest(async () => {
      const response = await this.axiosInstance.get('/sapi/v1/capital/deposit/history', {
        params: {
          ...params,
          timestamp: Date.now(),
        }
      });
      return response.data;
    });
  }

  // Exchange info
  async getExchangeInfo(symbol?: string): Promise<BinanceExchangeInfo> {
    const params: any = {};
    if (symbol) {
      params.symbol = symbol;
    }

    const response = await this.axiosInstance.get('/api/v3/exchangeInfo', { params });
    return response.data;
  }

  // System status
  async getSystemStatus(): Promise<{ status: number; msg: string }> {
    const response = await this.axiosInstance.get('/sapi/v1/system/status');
    return response.data;
  }

  // Convenience methods for specific use cases
  async getTotalBalanceInUSDT(): Promise<number> {
    const balances = await this.getBalancesWithValues();
    return balances.reduce((sum, b) => sum + b.usdtValue, 0);
  }

  async getPortfolioSummary(): Promise<{
    totalUSDT: number;
    totalBTC: number;
    assets: BinanceBalanceWithValue[];
    topAssets: BinanceBalanceWithValue[];
    distribution: { asset: string; percentage: number }[];
  }> {
    const balances = await this.getBalancesWithValues();
    const totalUSDT = balances.reduce((sum, b) => sum + b.usdtValue, 0);
    const totalBTC = balances.reduce((sum, b) => sum + b.btcValue, 0);

    const distribution = balances
      .map(b => ({
        asset: b.asset,
        percentage: (b.usdtValue / totalUSDT) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const topAssets = balances
      .sort((a, b) => b.usdtValue - a.usdtValue)
      .slice(0, 5);

    return {
      totalUSDT,
      totalBTC,
      assets: balances,
      topAssets,
      distribution
    };
  }

  async getRecentTrades(symbol: string, limit: number = 10): Promise<BinanceTrade[]> {
    return this.getMyTrades(symbol, limit);
  }

  async getRecentOrders(symbol: string, limit: number = 10): Promise<BinanceOrder[]> {
    const orders = await this.getAllOrders(symbol, limit);
    return orders.slice(0, limit);
  }
}
