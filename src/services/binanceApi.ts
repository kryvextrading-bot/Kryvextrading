// Main Binance API exports
export type {
  BinanceAccountInfo,
  BinanceBalance,
  BinanceBalanceWithValue,
  BinancePrice,
  Binance24hrTicker,
  BinanceOrder,
  BinanceTrade,
  BinanceWithdrawal,
  BinanceDeposit,
  BinanceRateLimit,
  BinanceExchangeInfo,
  BinanceSymbolInfo,
  BinanceConfig
} from './binance/types';

export type {
  BinanceApiError as IBinanceApiError,
  BinanceRateLimit as IBinanceRateLimit
} from './binance/types';

export {
  BinanceApiError,
  BinanceAuthError,
  BinanceRateLimitError
} from './binance/errors';

export {
  BinanceClient
} from './binance/client';

export {
  createBinanceClient,
  createTestBinanceClient
} from './binance/factory';

// Legacy function exports for backward compatibility
import { createBinanceClient } from './binance/factory';
import { BinanceBalance } from './binance/types';

export const getBinanceBalances = async (apiKey: string, apiSecret: string): Promise<BinanceBalance[]> => {
  const client = createBinanceClient({ apiKey, apiSecret });
  return client.getBalances();
};

// Default export for backward compatibility
export { createBinanceClient as default } from './binance/factory';
