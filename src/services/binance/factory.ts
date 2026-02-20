import { BinanceConfig } from './types';
import { BinanceClient } from './client';

export const createBinanceClient = (config: BinanceConfig): BinanceClient => {
  if (!config.apiKey || !config.apiSecret) {
    throw new Error('Binance API key and secret are required');
  }

  // Validate API key format (starts and ends with specific characters)
  if (!config.apiKey.match(/^[A-Za-z0-9]{64}$/)) {
    throw new Error('Invalid Binance API key format');
  }

  return new BinanceClient(config);
};

export const createTestBinanceClient = (): BinanceClient => {
  return new BinanceClient({
    apiKey: 'test_key',
    apiSecret: 'test_secret',
    baseUrl: 'https://testnet.binance.vision',
  });
};
