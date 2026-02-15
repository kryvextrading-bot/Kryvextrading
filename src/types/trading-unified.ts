// Unified trading types for all trading operations

export type TradeType = 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';

export type TradeSide = 'buy' | 'sell' | 'long' | 'short' | 'up' | 'down';

export type TradeStatus = 
  | 'pending'      // Order placed, waiting for execution
  | 'processing'   // Being processed
  | 'open'         // Position is open (futures/options)
  | 'completed'    // Successfully completed
  | 'failed'       // Failed
  | 'cancelled'    // Cancelled by user
  | 'expired'      // Expired (options)
  | 'liquidated'   // Liquidated (futures);

export interface BaseTrade {
  id: string;
  userId: string;
  type: TradeType;
  status: TradeStatus;
  asset: string;           // Trading pair or asset
  amount: number;          // Amount traded
  price?: number;          // Execution price
  total?: number;          // Total value (amount * price)
  fee?: number;            // Trading fee
  pnl?: number;            // Profit/Loss if applicable
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface SpotTrade extends BaseTrade {
  type: 'spot';
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  filled?: number;
  remaining?: number;
}

export interface FuturesTrade extends BaseTrade {
  type: 'futures';
  side: 'long' | 'short';
  positionType: 'open' | 'close';
  orderType: 'market' | 'limit' | 'stop';
  leverage: number;
  margin: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
}

export interface OptionsTrade extends BaseTrade {
  type: 'options';
  direction: 'up' | 'down';
  timeFrame: number;       // Expiry time in seconds
  strike?: number;         // Strike price
  payout: number;          // Potential payout
  expiresAt: number;       // Expiry timestamp
}

export interface ArbitrageTrade extends BaseTrade {
  type: 'arbitrage';
  productId: string;
  productLabel: string;
  duration: number;        // Duration in days
  dailyRate: number;       // Daily return rate
  startTime: string;
  endTime?: string;
}

export type AnyTrade = SpotTrade | FuturesTrade | OptionsTrade | ArbitrageTrade;

export interface TradeExecutionResult {
  success: boolean;
  tradeId: string;
  transaction?: AnyTrade;
  pnl?: number;
  error?: string;
  lockId?: string;
}

export interface TradeLock {
  id: string;
  userId: string;
  asset: string;
  amount: number;
  tradeType: TradeType;
  tradeId: string;
  status: 'locked' | 'released' | 'expired';
  createdAt: string;
  expiresAt: string;
  releasedAt?: string;
}
