export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: number;
  icon: string;
  chart?: number[];
}

export interface Portfolio {
  totalBalance: number;
  currency: string;
  assets: {
    symbol: string;
    amount: number;
    value: number;
  }[];
}

export interface Investment {
  id: string;
  type: 'quant-trading' | 'node-staking' | 'loan' | 'pre-sale' | 'liquidity-mining' | 'ai-arbitrage';
  name: string;
  description: string;
  minInvestment: number;
  expectedReturn: number;
  duration: string;
  riskLevel: 'low' | 'medium' | 'high';
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  time: string;
  category: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'stake' | 'loan';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  date: string;
  description: string;
}