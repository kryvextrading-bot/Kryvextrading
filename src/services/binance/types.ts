export interface BinanceAccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BinanceBalance[];
  permissions: string[];
}

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
  total?: number;
  btcValue?: number;
  usdtValue?: number;
}

export interface BinanceBalanceWithValue extends BinanceBalance {
  total: number;
  btcValue: number;
  usdtValue: number;
  price: number;
  change24h: number;
}

export interface BinancePrice {
  symbol: string;
  price: string;
  time: number;
}

export interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceOrder {
  symbol: string;
  orderId: number;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cummulativeQuoteQty: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'PENDING_CANCEL' | 'REJECTED' | 'EXPIRED';
  timeInForce: 'GTC' | 'IOC' | 'FOK';
  type: 'LIMIT' | 'MARKET' | 'STOP_LOSS' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT' | 'TAKE_PROFIT_LIMIT' | 'LIMIT_MAKER';
  side: 'BUY' | 'SELL';
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface BinanceTrade {
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

export interface BinanceWithdrawal {
  id: string;
  amount: string;
  transactionFee: string;
  address: string;
  asset: string;
  txId: string;
  applyTime: number;
  status: number; // 0: Email Sent, 1: Cancelled, 2: Awaiting Approval, 3: Rejected, 4: Processing, 5: Failure, 6: Completed
}

export interface BinanceDeposit {
  id: string;
  amount: string;
  coin: string;
  network: string;
  status: number; // 0: pending, 1: success
  address: string;
  addressTag: string;
  txId: string;
  insertTime: number;
  transferType: number;
  confirmTimes: string;
}

export interface BinanceApiError {
  code: number;
  msg: string;
}

export interface BinanceRateLimit {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: BinanceRateLimit[];
  exchangeFilters: any[];
  symbols: BinanceSymbolInfo[];
}

export interface BinanceSymbolInfo {
  symbol: string;
  status: 'TRADING' | 'BREAK' | 'HALT';
  baseAsset: string;
  baseAssetPrecision: number;
  quoteAsset: string;
  quotePrecision: number;
  quoteAssetPrecision: number;
  baseCommissionPrecision: number;
  quoteCommissionPrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  ocoAllowed: boolean;
  quoteOrderQtyMarketAllowed: boolean;
  allowTrailingStop: boolean;
  cancelReplaceAllowed: boolean;
  isSpotTradingAllowed: boolean;
  isMarginTradingAllowed: boolean;
  filters: any[];
  permissions: string[];
}

export interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  rateLimit?: number;
}
