import { 
  OrderSide, 
  OrderType, 
  PositionType, 
  TimeFrame, 
  TradeType,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES 
} from '../constants/trading';

export type TransactionStatus = typeof TRANSACTION_STATUS[number];
export type TransactionType = typeof TRANSACTION_TYPES[number];

export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change?: number;
  volume?: number;
  high?: number;
  low?: number;
  minAmount: number;
  maxAmount: number;
  stepSize: number;
  tickSize: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
}

export interface Trade {
  id: string;
  price: number;
  amount: number;
  total: number;
  side: OrderSide;
  time: number;
}

export interface Position {
  id: string;
  userId: string;
  pair: string;
  side: OrderSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  realizedPnl?: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
  status: 'open' | 'closed' | 'liquidated';
  metadata?: Record<string, any>;
  createdAt: string;
  closedAt?: string;
}

export interface Order {
  id: string;
  userId: string;
  pair: string;
  type: OrderType;
  side: OrderSide;
  amount: number;
  price: number;
  total: number;
  filled?: number;
  remaining?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  asset: string;
  amount: number;
  price: number;
  total: number;
  side?: OrderSide;
  status: TransactionStatus;
  fee?: number;
  pnl?: number;
  metadata?: {
    orderType?: OrderType;
    positionId?: string;
    direction?: 'up' | 'down';
    timeFrame?: TimeFrame;
    payout?: number;
    expiresAt?: number;
    shouldWin?: boolean;
    outcome?: 'win' | 'loss';
    [key: string]: any;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface OrderValidation {
  valid: boolean;
  error?: string;
}

export interface TradeExecution {
  order: Order;
  transaction: Transaction;
  position?: Position;
}

export interface BalanceUpdate {
  userId: string;
  asset: string;
  amount: number;
  type: 'credit' | 'debit' | 'lock' | 'unlock';
  reference: string;
  metadata?: Record<string, any>;
}

export interface MarginRequirements {
  initial: number;
  maintenance: number;
  liquidation: number;
}

export interface PnLCalculation {
  unrealized: number;
  realized: number;
  percentage: number;
}