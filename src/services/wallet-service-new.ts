import { BalanceOperation, BalanceResult, WalletBalance } from '@/types/wallet';
import { walletApiService } from './wallet-api-new';

class WalletService {
  // ==================== USER METHODS ====================
  
  async getUserBalances(userId: string): Promise<WalletBalance[]> {
    return walletApiService.getUserBalances(userId);
  }

  async getBalance(userId: string, asset: string): Promise<number> {
    return walletApiService.getBalance(userId, asset);
  }

  async getLockedBalance(userId: string, asset: string): Promise<number> {
    return walletApiService.getLockedBalance(userId, asset);
  }

  async addBalance(operation: BalanceOperation): Promise<BalanceResult> {
    return walletApiService.addBalance(operation);
  }

  async deductBalance(operation: BalanceOperation): Promise<BalanceResult> {
    return walletApiService.deductBalance(operation);
  }

  async lockBalance(operation: BalanceOperation): Promise<BalanceResult> {
    return walletApiService.lockBalance(operation);
  }

  async unlockBalance(operation: BalanceOperation): Promise<BalanceResult> {
    return walletApiService.unlockBalance(operation);
  }

  // ==================== VALIDATION METHODS ====================
  
  async hasSufficientBalance(userId: string, asset: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId, asset);
    return balance >= amount;
  }

  async hasSufficientLockedBalance(userId: string, asset: string, amount: number): Promise<boolean> {
    const locked = await this.getLockedBalance(userId, asset);
    return locked >= amount;
  }

  // ==================== BATCH OPERATIONS ====================
  
  async batchTransfer(operations: BalanceOperation[]): Promise<BalanceResult[]> {
    const results: BalanceResult[] = [];
    
    for (const operation of operations) {
      if (operation.type === 'deposit' || operation.type === 'unlock') {
        results.push(await this.addBalance(operation));
      } else {
        results.push(await this.deductBalance(operation));
      }
    }
    
    return results;
  }

  // ==================== LEDGER METHODS ====================
  
  async getTransactionHistory(userId: string, limit?: number): Promise<any[]> {
    return walletApiService.getLedgerEntries(userId, limit);
  }
}

export const walletService = new WalletService();
