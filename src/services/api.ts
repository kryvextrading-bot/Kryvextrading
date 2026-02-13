// API Service Layer for Swan IRA Platform
// This handles all backend communication and data management

import { Investment } from '@/types';

// API Configuration
const API_BASE_URL = 'http://localhost:3001';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'Active' | 'Pending' | 'Suspended';
  kycStatus: 'Verified' | 'Pending' | 'Rejected';
  accountType: 'Traditional IRA' | 'Roth IRA';
  accountNumber: string;
  balance: number;
  lastLogin: string;
  registrationDate: string;
  twoFactorEnabled: boolean;
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  investmentGoal: 'Retirement' | 'Wealth Building' | 'Tax Savings';
  isAdmin?: boolean;
  creditScore?: number;
  adminRole?: 'admin' | 'superadmin' | 'finance' | 'support';
  kyc?: {
    documents: { type: string; url: string; uploadedAt: string }[];
    submittedAt: string;
    verifiedAt?: string;
    notes?: string;
  };
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  type: 'Buy' | 'Sell' | 'Deposit' | 'Withdrawal';
  asset: string;
  amount: string;
  value: number;
  status: 'Completed' | 'Pending' | 'Failed';
  date: string;
  fee: number;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export interface SystemSettings {
  general: {
    platformName: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
  security: {
    twoFactorRequired: boolean;
    passwordMinLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    maxPasswordAge: number;
    rateLimitEnabled: boolean;
    rateLimitRequests: number;
    rateLimitWindow: number;
  };
  trading: {
    tradingEnabled: boolean;
    minTradeAmount: number;
    maxTradeAmount: number;
    autoApprovalLimit: number;
    requireKycForLargeTrades: boolean;
    largeTradeThreshold: number;
  };
}

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    kycStatus: 'Verified',
    kyc: {
      documents: [
        { type: 'ID Card', url: '/uploads/john-idcard.pdf', uploadedAt: '2024-07-10' },
        { type: 'Proof of Address', url: '/uploads/john-address.pdf', uploadedAt: '2024-07-10' }
      ],
      submittedAt: '2024-07-10',
      verifiedAt: '2024-07-11',
      notes: 'All documents verified.'
    },
    accountType: 'Traditional IRA',
    accountNumber: 'IRA-2024-001234',
    balance: 45230.50,
    lastLogin: '2 hours ago',
    registrationDate: '2024-01-15',
    twoFactorEnabled: true,
    riskTolerance: 'Moderate',
    investmentGoal: 'Retirement',
    isAdmin: true,
    adminRole: 'admin'
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    phone: '+1 (555) 234-5678',
    status: 'Pending',
    kycStatus: 'Pending',
    kyc: {
      documents: [
        { type: 'ID Card', url: '/uploads/jane-idcard.pdf', uploadedAt: '2024-07-12' }
      ],
      submittedAt: '2024-07-12',
      notes: 'Awaiting proof of address.'
    },
    accountType: 'Roth IRA',
    accountNumber: 'IRA-2024-001235',
    balance: 12450.00,
    lastLogin: '1 day ago',
    registrationDate: '2024-01-20',
    twoFactorEnabled: false,
    riskTolerance: 'Conservative',
    investmentGoal: 'Wealth Building'
  },
  {
    id: '3',
    firstName: 'Alice',
    lastName: 'Admin',
    email: 'alice.admin@email.com',
    phone: '+1 (555) 999-8888',
    status: 'Active',
    kycStatus: 'Verified',
    kyc: {
      documents: [
        { type: 'Passport', url: '/uploads/alice-passport.pdf', uploadedAt: '2024-07-09' }
      ],
      submittedAt: '2024-07-09',
      verifiedAt: '2024-07-10',
      notes: 'Passport verified.'
    },
    accountType: 'Roth IRA',
    accountNumber: 'IRA-2024-001236',
    balance: 99999.99,
    lastLogin: 'just now',
    registrationDate: '2024-07-15',
    twoFactorEnabled: true,
    riskTolerance: 'Aggressive',
    investmentGoal: 'Wealth Building',
    isAdmin: true,
    adminRole: 'superadmin'
  }
];

const mockTransactions: Transaction[] = [
  {
    id: 'TXN-001',
    userId: '1',
    userEmail: 'john.doe@email.com',
    type: 'Buy',
    asset: 'Bitcoin',
    amount: '0.5 BTC',
    value: 23450.00,
    status: 'Completed',
    date: '2024-01-15 14:30:00',
    fee: 12.50
  },
  {
    id: 'TXN-002',
    userId: '2',
    userEmail: 'jane.smith@email.com',
    type: 'Sell',
    asset: 'Ethereum',
    amount: '2.5 ETH',
    value: 7890.00,
    status: 'Pending',
    date: '2024-01-15 13:45:00',
    fee: 8.75
  }
];

const mockCryptoPrices: CryptoPrice[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 117727.00,
    change24h: 0.70,
    volume24h: 48163307000,
    marketCap: 2300000000000
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2967.59,
    change24h: 0.59,
    volume24h: 48596018000,
    marketCap: 356000000000
  }
];

// Add mock credit score data
let mockCreditScores: Record<string, number> = {
  '1': 100,
  '2': 85
};

// --- Investment Mock Data ---
const mockInvestments: Investment[] = [
  {
    id: '1',
    type: 'quant-trading',
    name: 'Crypto Growth Fund',
    description: 'A diversified crypto fund with algorithmic trading.',
    minInvestment: 1000,
    expectedReturn: 8.5,
    duration: '12 months',
    riskLevel: 'medium',
    icon: ''
  },
  {
    id: '2',
    type: 'node-staking',
    name: 'Stablecoin Staking',
    description: 'Stake stablecoins for steady returns.',
    minInvestment: 500,
    expectedReturn: 5.2,
    duration: '6 months',
    riskLevel: 'low',
    icon: ''
  },
  {
    id: '3',
    type: 'ai-arbitrage',
    name: 'DeFi Yield Pool',
    description: 'AI-powered DeFi arbitrage pool.',
    minInvestment: 2000,
    expectedReturn: 12.0,
    duration: '3 months',
    riskLevel: 'high',
    icon: ''
  }
];

// --- Alpha Vantage and Twelve Data utilities ---
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
const TWELVE_DATA_KEY = import.meta.env.VITE_TWELVE_DATA_KEY;

async function fetchAlphaVantageStock(symbol: string) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const quote = data["Global Quote"];
  return {
    symbol,
    name: symbol,
    price: parseFloat(quote["05. price"]),
    change: parseFloat(quote["10. change percent"]?.replace('%','')),
  };
}

async function fetchAlphaVantageForex(pair: string) {
  // pair: "EUR/USD" => "EURUSD"
  const from = pair.split('/')[0];
  const to = pair.split('/')[1];
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const rate = data["Realtime Currency Exchange Rate"];
  return {
    symbol: pair,
    name: pair,
    price: parseFloat(rate["5. Exchange Rate"]),
    change: 0, // Alpha Vantage does not provide change % for FX
  };
}

async function fetchAlphaVantageEtf(symbol: string) {
  // ETFs are fetched like stocks
  return fetchAlphaVantageStock(symbol);
}

async function fetchTwelveDataQuote(symbol: string) {
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${TWELVE_DATA_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    symbol,
    name: data.name || symbol,
    price: parseFloat(data.price),
    change: parseFloat(data.percent_change),
  };
}

export async function getStockPrices(symbols: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const symbol of symbols) {
    try {
      results.push(await fetchAlphaVantageStock(symbol));
    } catch {
      try {
        results.push(await fetchTwelveDataQuote(symbol));
      } catch {
        results.push({ symbol, name: symbol, price: 0, change: 0 });
      }
    }
  }
  return results;
}

export async function getForexPrices(pairs: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const pair of pairs) {
    try {
      results.push(await fetchAlphaVantageForex(pair));
    } catch {
      try {
        // Twelve Data uses e.g. "EUR/USD"
        results.push(await fetchTwelveDataQuote(pair));
      } catch {
        results.push({ symbol: pair, name: pair, price: 0, change: 0 });
      }
    }
  }
  return results;
}

export async function getEtfPrices(symbols: string[]): Promise<any[]> {
  const results: any[] = [];
  for (const symbol of symbols) {
    try {
      results.push(await fetchAlphaVantageEtf(symbol));
    } catch {
      try {
        results.push(await fetchTwelveDataQuote(symbol));
      } catch {
        results.push({ symbol, name: symbol, price: 0, change: 0 });
      }
    }
  }
  return results;
}

// API Service Class
class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  private token: string | null = null;

  // Authentication
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User Management
  async getUsers(): Promise<User[]> {
    // In production, this would be: return this.request<User[]>('/users');
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUsers), 500);
    });
  }

  async getUser(id: string): Promise<User> {
    const user = mockUsers.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(user), 300);
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockUsers[userIndex]), 300);
    });
  }

  async deleteUser(id: string): Promise<void> {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    mockUsers.splice(userIndex, 1);
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 300);
    });
  }

  // Transaction Management
  async getTransactions(): Promise<Transaction[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransactions), 500);
    });
  }

  async getTransaction(id: string): Promise<Transaction> {
    const transaction = mockTransactions.find(t => t.id === id);
    if (!transaction) throw new Error('Transaction not found');
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(transaction), 300);
    });
  }

  async approveTransaction(id: string, status: 'approved' | 'rejected'): Promise<Transaction> {
    const transactionIndex = mockTransactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) throw new Error('Transaction not found');
    
    mockTransactions[transactionIndex].status = status === 'approved' ? 'Completed' : 'Failed';
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransactions[transactionIndex]), 300);
    });
  }

  async rejectTransaction(id: string): Promise<Transaction> {
    const transactionIndex = mockTransactions.findIndex(t => t.id === id);
    if (transactionIndex === -1) throw new Error('Transaction not found');
    
    mockTransactions[transactionIndex].status = 'Failed';
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTransactions[transactionIndex]), 300);
    });
  }

  // Crypto Data
  async getCryptoPrices(): Promise<CryptoPrice[]> {
    try {
      // Fetch live prices from CoinGecko
      const response = await fetch('/api/coingecko/prices?ids=bitcoin,ethereum,tether&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
      const data = await response.json();
      return [
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          price: data.bitcoin.usd,
          change24h: data.bitcoin.usd_24h_change || 0,
          volume24h: data.bitcoin.usd_24h_vol || 0,
          marketCap: data.bitcoin.usd_market_cap || 0,
        },
        {
          symbol: 'ETH',
          name: 'Ethereum',
          price: data.ethereum.usd,
          change24h: data.ethereum.usd_24h_change || 0,
          volume24h: data.ethereum.usd_24h_vol || 0,
          marketCap: data.ethereum.usd_market_cap || 0,
        },
        {
          symbol: 'USDT',
          name: 'Tether',
          price: data.tether.usd,
          change24h: data.tether.usd_24h_change || 0,
          volume24h: data.tether.usd_24h_vol || 0,
          marketCap: data.tether.usd_market_cap || 0,
        },
      ];
    } catch (error) {
      // Fallback to mock data if API fails
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockCryptoPrices), 500);
      });
    }
  }

  async getCryptoPrice(symbol: string): Promise<CryptoPrice> {
    const crypto = mockCryptoPrices.find(c => c.symbol === symbol);
    if (!crypto) throw new Error('Crypto not found');
    
    return new Promise((resolve) => {
      setTimeout(() => resolve(crypto), 300);
    });
  }

  /**
   * Fetches prices for given symbols from multiple exchanges (Binance, KuCoin, OKX, CoinGecko fallback).
   * Returns an object: { exchange: { symbol: price, ... }, ... }
   * Example: { binance: { BTCUSDT: 60000 }, kucoin: { BTCUSDT: 60100 }, ... }
   */
  async getMultiExchangePrices(symbols: string[]): Promise<{ [exchange: string]: { [symbol: string]: number } }> {
    const result: { [exchange: string]: { [symbol: string]: number } } = {};
    // Binance
    try {
      const binancePrices: { [symbol: string]: number } = {};
      for (const symbol of symbols) {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        const data = await res.json();
        binancePrices[symbol] = parseFloat(data.price);
      }
      result['binance'] = binancePrices;
    } catch {}
    // KuCoin
    try {
      const kucoinPrices: { [symbol: string]: number } = {};
      for (const symbol of symbols) {
        const res = await fetch(`/api/kucoin/orderbook?symbol=${symbol}`);
        const data = await res.json();
        kucoinPrices[symbol] = parseFloat(data.data.price);
      }
      result['kucoin'] = kucoinPrices;
    } catch {}
    // OKX
    try {
      const okxPrices: { [symbol: string]: number } = {};
      for (const symbol of symbols) {
        // OKX uses e.g. BTC-USDT
        const okxSymbol = symbol.replace('USDT', '-USDT');
        const res = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${okxSymbol}`);
        const data = await res.json();
        okxPrices[symbol] = parseFloat(data.data?.[0]?.last || '0');
      }
      result['okx'] = okxPrices;
    } catch {}
    // CoinGecko fallback
    try {
      const ids = symbols.map(s => s.startsWith('BTC') ? 'bitcoin' : s.startsWith('ETH') ? 'ethereum' : s.startsWith('SOL') ? 'solana' : '').filter(Boolean).join(',');
      if (ids) {
        const res = await fetch(`http://localhost:3001/api/coingecko/prices?ids=${ids}&vs_currencies=usd`);
        const data = await res.json();
        const cgPrices: { [symbol: string]: number } = {};
        if (symbols.includes('BTCUSDT')) cgPrices['BTCUSDT'] = data.bitcoin?.usd;
        if (symbols.includes('ETHUSDT')) cgPrices['ETHUSDT'] = data.ethereum?.usd;
        if (symbols.includes('SOLUSDT')) cgPrices['SOLUSDT'] = data.solana?.usd;
        result['coingecko'] = cgPrices;
      }
    } catch {}
    return result;
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    const defaultSettings: SystemSettings = {
      general: {
        platformName: 'Swan IRA',
        supportEmail: 'support@swan-ira.com',
        maintenanceMode: false,
        registrationEnabled: true,
        maxLoginAttempts: 5,
        sessionTimeout: 30
      },
      security: {
        twoFactorRequired: true,
        passwordMinLength: 8,
        requireSpecialChars: true,
        requireNumbers: true,
        requireUppercase: true,
        maxPasswordAge: 90,
        rateLimitEnabled: true,
        rateLimitRequests: 100,
        rateLimitWindow: 15
      },
      trading: {
        tradingEnabled: true,
        minTradeAmount: 10,
        maxTradeAmount: 100000,
        autoApprovalLimit: 1000,
        requireKycForLargeTrades: true,
        largeTradeThreshold: 10000
      }
    };

    return new Promise((resolve) => {
      setTimeout(() => resolve(defaultSettings), 500);
    });
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(settings as SystemSettings), 300);
    });
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }

      const result = await response.json();
      this.setToken(result.token);
      return result;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  async register(userData: Partial<User>): Promise<{ token: string; user: User }> {
    // Generate a new user object with all required fields
    const newUser: User = {
      id: (Math.max(0, ...mockUsers.map(u => +u.id || 0)) + 1).toString(),
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      status: 'Pending',
      kycStatus: 'Pending',
      accountType: 'Roth IRA',
      accountNumber: `IRA-2024-00${Math.floor(1000 + Math.random() * 9000)}`,
      balance: 0,
      lastLogin: 'just now',
      registrationDate: new Date().toISOString().slice(0, 10),
      twoFactorEnabled: false,
      riskTolerance: 'Moderate',
      investmentGoal: 'Wealth Building',
      isAdmin: false,
      creditScore: 0,
      adminRole: undefined,
      kyc: {
        documents: [],
        submittedAt: '',
        notes: '',
      },
    };
    mockUsers.push(newUser);
    // Simulate token
    const token = `mock-token-${newUser.id}`;
    this.setToken(token);
    return new Promise((resolve) => {
      setTimeout(() => resolve({ token, user: newUser }), 300);
    });
  }

  async logout(): Promise<void> {
    this.clearToken();
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 300);
    });
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalVolume: number;
    pendingTransactions: number;
    totalBalance: number;
  }> {
    const totalUsers = mockUsers.length;
    const activeUsers = mockUsers.filter(u => u.status === 'Active').length;
    const totalVolume = mockTransactions.reduce((sum, t) => sum + t.value, 0);
    const pendingTransactions = mockTransactions.filter(t => t.status === 'Pending').length;
    const totalBalance = mockUsers.reduce((sum, u) => sum + u.balance, 0);

    return new Promise((resolve) => {
      setTimeout(() => resolve({
        totalUsers,
        activeUsers,
        totalVolume,
        pendingTransactions,
        totalBalance
      }), 500);
    });
  }

  // Spot Order Management
  async getSpotOrders(): Promise<any[]> {
    return this.request<any[]>('/spotOrders');
  }
  async createSpotOrder(order: any): Promise<any> {
    return this.request<any>('/spotOrders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
  async updateSpotOrder(id: string, order: any): Promise<any> {
    return this.request<any>(`/spotOrders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }
  async deleteSpotOrder(id: string): Promise<void> {
    return this.request<void>(`/spotOrders/${id}`, {
      method: 'DELETE',
    });
  }

  // Futures Order Management
  async getFuturesOrders(): Promise<any[]> {
    return this.request<any[]>('/futuresOrders');
  }
  async createFuturesOrder(order: any): Promise<any> {
    return this.request<any>('/futuresOrders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
  async updateFuturesOrder(id: string, order: any): Promise<any> {
    return this.request<any>(`/futuresOrders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }
  async deleteFuturesOrder(id: string): Promise<void> {
    return this.request<void>(`/futuresOrders/${id}`, {
      method: 'DELETE',
    });
  }

  // Options Order Management
  async getOptionsOrders(): Promise<any[]> {
    return this.request<any[]>('/optionsOrders');
  }
  async createOptionsOrder(order: any): Promise<any> {
    return this.request<any>('/optionsOrders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }
  async updateOptionsOrder(id: string, order: any): Promise<any> {
    return this.request<any>(`/optionsOrders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    });
  }
  async deleteOptionsOrder(id: string): Promise<void> {
    return this.request<void>(`/optionsOrders/${id}`, {
      method: 'DELETE',
    });
  }

  async getCreditScore(userId: string): Promise<number> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockCreditScores[userId] ?? 0), 300);
    });
  }
  async setCreditScore(userId: string, score: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        mockCreditScores[userId] = score;
        resolve();
      }, 300);
    });
  }

  /**
   * Fetch all investment products (mock)
   */
  async getInvestments(): Promise<Investment[]> {
    return new Promise((resolve) => setTimeout(() => resolve([...mockInvestments]), 400));
  }

  /**
   * Create a new investment product (mock)
   */
  async createInvestment(investment: Omit<Investment, 'id'>): Promise<Investment> {
    const newInvestment: Investment = { ...investment, id: (Math.max(0, ...mockInvestments.map(i => +i.id)) + 1).toString() };
    mockInvestments.push(newInvestment);
    return new Promise((resolve) => setTimeout(() => resolve(newInvestment), 400));
  }

  /**
   * Update an investment product (mock)
   */
  async updateInvestment(id: string, investment: Partial<Investment>): Promise<Investment> {
    const idx = mockInvestments.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Investment not found');
    mockInvestments[idx] = { ...mockInvestments[idx], ...investment };
    return new Promise((resolve) => setTimeout(() => resolve(mockInvestments[idx]), 400));
  }

  /**
   * Delete an investment product (mock)
   */
  async deleteInvestment(id: string): Promise<void> {
    const idx = mockInvestments.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Investment not found');
    mockInvestments.splice(idx, 1);
    return new Promise((resolve) => setTimeout(() => resolve(), 400));
  }

  /**
   * Admin: Set all trades for a user as win or loss
   */
  async setUserTradesWinLoss(userId: string, outcome: 'win' | 'loss'): Promise<void> {
    mockTransactions.forEach(t => {
      const type = (t.type || '').toLowerCase();
      if (t.userId === userId && (type === 'buy' || type === 'sell' || type === 'trade')) {
        t.status = 'Completed';
        // Optionally, you could add a custom field to mock data for win/loss if needed
      }
    });
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Admin: Add funds to a user's wallet
   */
  async addFundsToUser(userId: string, amount: number): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) user.balance += amount;
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Admin: Withdraw funds from a user's wallet
   */
  async withdrawFundsFromUser(userId: string, amount: number): Promise<void> {
    const user = mockUsers.find(u => u.id === userId);
    if (user) user.balance = Math.max(0, user.balance - amount);
    return new Promise(resolve => setTimeout(resolve, 300));
  }

  async getUserKyc(userId: string): Promise<any> {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    return new Promise(resolve => setTimeout(() => resolve(user.kyc), 300));
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 