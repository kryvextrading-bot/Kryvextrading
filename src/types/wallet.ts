// Shared wallet types to avoid circular dependencies
export interface BalanceOperation {
  userId: string;
  asset: string;
  amount: number;
  reference: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'fee' | 'transfer' | 'adjustment' | 'lock' | 'unlock';
  metadata?: Record<string, any>;
}

export interface BalanceResult {
  success: boolean;
  newBalance?: number;
  error?: string;
  transactionId?: string;
}

export interface WalletBalance {
  asset: string;
  available: number;
  locked: number;
  total: number;
  updatedAt: string;
}

export interface BalanceUpdate {
  asset: string;
  available: number;
  locked: number;
  total: number;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade' | 'Arbitrage' | 'Staking' | 'Swap' | 'Options' | 'Fee' | 'Funding' | 'Referral' | 'Airdrop';
  asset: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing' | 'Scheduled' | 'Cancelled';
  date: string;
  details?: any;
  pnl?: number;
  category?: 'spot' | 'futures' | 'options' | 'arbitrage' | 'staking';
  metadata?: {
    shouldWin?: boolean;
    outcome?: 'win' | 'loss';
    network?: string;
    address?: string;
    txHash?: string;
    confirmations?: number;
    leverage?: number;
    direction?: 'up' | 'down';
    timeFrame?: number;
    payout?: number;
    expiresAt?: number;
  };
}
