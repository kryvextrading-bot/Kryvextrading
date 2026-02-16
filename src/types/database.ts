// Database schema types - matches actual database column names
export interface LedgerEntry {
  id: string;
  user_id: string;  // Match database column name
  asset: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  transaction_type: string;  // Match database
  reference?: string;
  description?: string;
  metadata?: Record<string, any>;
  related_transaction_id?: string;
  created_at: string;  // Match database
  updated_at: string;
}

export interface WalletBalance {
  id: string;
  user_id: string;
  asset: string;
  available: number;
  locked: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee';
  currency: string;
  amount: number;
  reference_id?: string;
  description?: string;
  balance_before?: number;
  balance_after?: number;
  created_at: string;
}

// Mapping functions to convert between frontend and database formats
export function toLedgerEntry(entry: Partial<LedgerEntry>): LedgerEntry {
  return {
    id: entry.id || '',
    user_id: entry.user_id || '',
    asset: entry.asset || '',
    amount: entry.amount || 0,
    balance_before: entry.balance_before || 0,
    balance_after: entry.balance_after || 0,
    transaction_type: entry.transaction_type || 'deposit',
    reference: entry.reference,
    description: entry.description,
    metadata: entry.metadata || {},
    related_transaction_id: entry.related_transaction_id,
    created_at: entry.created_at || new Date().toISOString(),
    updated_at: entry.updated_at || new Date().toISOString()
  };
}

export function validateLedgerEntry(entry: Partial<LedgerEntry>): string[] {
  const errors: string[] = [];
  const required = ['user_id', 'asset', 'amount', 'transaction_type'];
  
  required.forEach(field => {
    if (!entry[field as keyof LedgerEntry]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  if (entry.amount !== undefined && (typeof entry.amount !== 'number' || entry.amount < 0)) {
    errors.push('Amount must be a non-negative number');
  }
  
  if (entry.transaction_type && !['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'trade', 'fee', 'lock', 'unlock', 'profit', 'loss', 'arbitrage', 'staking', 'options', 'refund', 'adjustment'].includes(entry.transaction_type)) {
    errors.push(`Invalid transaction_type: ${entry.transaction_type}`);
  }
  
  return errors;
}
