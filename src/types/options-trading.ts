export type OptionDirection = 'UP' | 'DOWN';
export type OptionStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';

export interface OptionOrder {
  id: string;
  userId: string;
  symbol: string;
  direction: OptionDirection;
  stake: number;
  entryPrice: number;
  expiryPrice: number | null;
  profit: number;
  fee: number;
  duration: number; // in seconds
  startTime: number; // timestamp in seconds
  endTime: number; // timestamp in seconds
  status: OptionStatus;
  payoutRate: number;
  fluctuationRange: number;
  createdAt: number;
  completedAt?: number;
  pnl?: number;
}

export interface ScheduledOptionTrade {
  id: string;
  userId: string;
  symbol: string;
  direction: OptionDirection;
  stake: number;
  duration: number;
  fluctuationRange: number;
  scheduledTimeUtc: number; // timestamp in seconds
  strikePrice: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAt: number;
}

export interface PriceCache {
  symbol: string;
  timestamp: number;
  price: number;
  volume?: number;
}

export interface UserIndicatorSettings {
  RSI: {
    period: number;
    enabled: boolean;
  };
  EMA: {
    periods: number[];
    enabled: boolean;
  };
  MACD: {
    fast: number;
    slow: number;
    signal: number;
    enabled: boolean;
  };
}
