// Trading Constants
export const SUPPORTED_PAIRS = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 67000,
    change: 2.34,
    volume: 1250000000,
    high: 68500,
    low: 66500,
    minAmount: 0.0001,
    maxAmount: 100,
    stepSize: 0.0001,
    tickSize: 0.01
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3500,
    change: 1.56,
    volume: 800000000,
    high: 3550,
    low: 3450,
    minAmount: 0.001,
    maxAmount: 1000,
    stepSize: 0.001,
    tickSize: 0.01
  },
  {
    symbol: 'BNBUSDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    price: 580,
    change: -0.45,
    volume: 200000000,
    high: 585,
    low: 575,
    minAmount: 0.01,
    maxAmount: 10000,
    stepSize: 0.01,
    tickSize: 0.01
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 145,
    change: 3.21,
    volume: 150000000,
    high: 148,
    low: 142,
    minAmount: 0.1,
    maxAmount: 10000,
    stepSize: 0.1,
    tickSize: 0.01
  },
  {
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    price: 0.52,
    change: 0.78,
    volume: 50000000,
    high: 0.53,
    low: 0.51,
    minAmount: 1,
    maxAmount: 100000,
    stepSize: 1,
    tickSize: 0.0001
  }
];

export const ORDER_TYPES = ['market', 'limit', 'stop'] as const;
export type OrderType = typeof ORDER_TYPES[number];

export const DEFAULT_LEVERAGE = 10;
export const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 25, 33, 50, 100];

export const PROFIT_RATES = {
  60: { payout: 0.85, profit: 15 },
  120: { payout: 0.82, profit: 18 },
  240: { payout: 0.78, profit: 22 },
  360: { payout: 0.75, profit: 25 },
  600: { payout: 0.70, profit: 30 }
} as const;

export type TimeFrame = keyof typeof PROFIT_RATES;

export const TRADE_TYPES = ['spot', 'futures', 'options', 'arbitrage'] as const;
export type TradeType = typeof TRADE_TYPES[number];

export const ORDER_SIDES = ['buy', 'sell'] as const;
export type OrderSide = typeof ORDER_SIDES[number];

export const POSITION_TYPES = ['open', 'close'] as const;
export type PositionType = typeof POSITION_TYPES[number];

export const TRANSACTION_STATUS = ['pending', 'processing', 'completed', 'failed', 'cancelled', 'scheduled', 'active'] as const;
export type TransactionStatus = typeof TRANSACTION_STATUS[number];

export const TRANSACTION_TYPES = ['trade', 'option', 'deposit', 'withdrawal', 'fee', 'funding'] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number];

export const DEFAULT_FEES = {
  spot: {
    maker: 0.001, // 0.1%
    taker: 0.001  // 0.1%
  },
  futures: {
    maker: 0.0002, // 0.02%
    taker: 0.0004  // 0.04%
  },
  options: {
    fee: 0.001 // 0.1%
  }
};

export const LIQUIDATION_THRESHOLDS = {
  maintenanceMargin: 0.005, // 0.5%
  marginCall: 0.8, // 80% of maintenance margin
  liquidationFee: 0.005 // 0.5%
};