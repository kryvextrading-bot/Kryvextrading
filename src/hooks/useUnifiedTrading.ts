import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useTradingControl } from './useTradingControl';
import { unifiedTradingService } from '@/services/unified-trading-service';
import { useToast } from '@/hooks/use-toast';
import { TradeType } from '@/types/trading-unified';

export function useUnifiedTrading() {
  const { user } = useAuth();
  const { refreshBalance } = useWallet();
  const { shouldWin } = useTradingControl();
  const { toast } = useToast();

  const executeTrade = useCallback(async (
    type: TradeType,
    data: any,
    options?: { showToast?: boolean }
  ) => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to trade',
        variant: 'destructive'
      });
      return { success: false, error: 'Not authenticated' };
    }

    try {
      // Determine if trade should win based on admin settings
      const wins = await shouldWin(type);
      
      console.log(`🎯 [useUnifiedTrading] Executing ${type} trade:`, {
        userId: user.id,
        data,
        shouldWin: wins
      });

      console.log(`📋 [useUnifiedTrading] About to call unifiedTradingService.executeTrade...`);

      // Execute trade through unified service
      const result = await unifiedTradingService.executeTrade({
        userId: user.id,
        type,
        data
      });

      console.log(`📊 [useUnifiedTrading] Trade execution result:`, result);

      if (result.success) {
        // Refresh balance
        await refreshBalance();

        if (options?.showToast !== false) {
          if (wins) {
            toast({
              title: '✅ Trade Successful',
              description: `Your ${type} trade was profitable!`,
            });
          } else {
            toast({
              title: '❌ Trade Completed',
              description: `Your ${type} trade has been processed.`,
            });
          }
        }

        console.log(`✅ [useUnifiedTrading] Trade ${result.tradeId} completed:`, result);
      } else {
        throw new Error(result.error);
      }

      return result;

    } catch (error) {
      console.error(`❌ [useUnifiedTrading] Trade failed:`, error);
      
      toast({
        title: 'Trade Failed',
        description: error instanceof Error ? error.message : 'Failed to execute trade',
        variant: 'destructive'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [user?.id, shouldWin, refreshBalance, toast]);

  const closeFuturesPosition = useCallback(async (positionId: string, closePrice: number) => {
    try {
      const result = await unifiedTradingService.closeFuturesPosition(positionId, closePrice);
      
      await refreshBalance();
      
      toast({
        title: 'Position Closed',
        description: `Closed with PnL: ${result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)} USDT`,
      });
      
      return result;
    } catch (error) {
      toast({
        title: 'Failed to Close Position',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
      throw error;
    }
  }, [refreshBalance, toast]);

  const getUserTrades = useCallback(async (type?: TradeType) => {
    if (!user?.id) return [];
    return unifiedTradingService.getUserTrades(user.id, type);
  }, [user?.id]);

  const getUserPositions = useCallback(async () => {
    if (!user?.id) return [];
    return unifiedTradingService.getUserPositions(user.id);
  }, [user?.id]);

  const getUserOptions = useCallback(async () => {
    if (!user?.id) return [];
    return unifiedTradingService.getUserOptions(user.id);
  }, [user?.id]);

  const getUserArbitrage = useCallback(async () => {
    if (!user?.id) return [];
    return unifiedTradingService.getUserArbitrage(user.id);
  }, [user?.id]);

  return {
    executeTrade,
    closeFuturesPosition,
    getUserTrades,
    getUserPositions,
    getUserOptions,
    getUserArbitrage
  };
}
