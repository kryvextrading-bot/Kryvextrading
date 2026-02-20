import { useState, useEffect, useCallback } from 'react';
import { Position, PnLCalculation } from '@/types/trading';
import { positionService } from '@/services/positionService';
import { useAuth } from '@/contexts/AuthContext';

export interface UseRealTimePositionsReturn {
  positions: Position[];
  aggregatedPnL: PnLCalculation;
  loading: boolean;
  error: string | null;
  refreshPositions: () => Promise<void>;
  updateMarkPrices: (currentPrices: Record<string, number>) => Promise<void>;
  closePosition: (positionId: string, closePrice: number) => Promise<void>;
}

export const useRealTimePositions = (): UseRealTimePositionsReturn => {
  const { user } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate aggregated P&L
  const aggregatedPnL = useCallback((): PnLCalculation => {
    if (positions.length === 0) {
      return { unrealized: 0, realized: 0, percentage: 0 };
    }

    let totalUnrealized = 0;
    let totalMargin = 0;

    positions.forEach(position => {
      totalUnrealized += position.unrealizedPnl;
      totalMargin += position.margin;
    });

    return {
      unrealized: totalUnrealized,
      realized: 0, // Would need to sum from closed positions
      percentage: totalMargin > 0 ? (totalUnrealized / totalMargin) * 100 : 0
    };
  }, [positions]);

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userPositions = await positionService.getUserPositions(user.id);
      setPositions(userPositions);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
      setError('Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update mark prices for all positions
  const updateMarkPrices = useCallback(async (currentPrices: Record<string, number>) => {
    if (!user || positions.length === 0) return;

    try {
      await positionService.updateMarkPrices(positions, currentPrices);
      // Refresh positions after update
      await fetchPositions();
    } catch (err) {
      console.error('Failed to update mark prices:', err);
      setError('Failed to update prices');
    }
  }, [user, positions, fetchPositions]);

  // Close a position
  const closePosition = useCallback(async (positionId: string, closePrice: number) => {
    if (!user) return;

    try {
      await positionService.closePosition(positionId, closePrice);
      // Refresh positions after closing
      await fetchPositions();
    } catch (err) {
      console.error('Failed to close position:', err);
      setError('Failed to close position');
    }
  }, [user, fetchPositions]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      unsubscribe = await positionService.subscribeToPositionUpdates(
        user.id,
        (updatedPositions) => {
          setPositions(updatedPositions);
        }
      );
    };

    setupSubscription();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Set up periodic price updates (every 5 seconds)
  useEffect(() => {
    if (!user || positions.length === 0) return;

    const interval = setInterval(async () => {
      // Mock price updates - replace with real price feed
      const mockPrices: Record<string, number> = {};
      positions.forEach(position => {
        // Simulate small price movements
        const basePrice = position.markPrice;
        const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
        mockPrices[position.pair] = basePrice * (1 + variation);
      });

      await updateMarkPrices(mockPrices);
    }, 5000);

    return () => clearInterval(interval);
  }, [user, positions, updateMarkPrices]);

  return {
    positions,
    aggregatedPnL: aggregatedPnL(),
    loading,
    error,
    refreshPositions: fetchPositions,
    updateMarkPrices,
    closePosition
  };
};
