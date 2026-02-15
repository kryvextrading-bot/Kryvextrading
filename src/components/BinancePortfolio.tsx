import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBinance } from '@/hooks/useBinance';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { RefreshCw, Wallet, TrendingUp, AlertCircle } from 'lucide-react';

interface BinancePortfolioProps {
  apiKey: string;
  apiSecret: string;
}

export const BinancePortfolio: React.FC<BinancePortfolioProps> = ({ apiKey, apiSecret }) => {
  const { balances, totalBalance, loading, error, refresh } = useBinance(apiKey, apiSecret, {
    autoRefresh: true,
    refreshInterval: 30000,
  });

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h3 className="text-sm font-medium text-red-400">Connection Error</h3>
              <p className="text-xs text-red-300">{error.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#F0B90B]" />
            <CardTitle className="text-white">Binance Portfolio</CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={refresh}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && balances.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ) : (
          <>
            {/* Total Balance */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1">Total Balance (USDT)</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalBalance)}
              </p>
            </div>

            {/* Asset Distribution */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-400">Assets</p>
              {balances.slice(0, 5).map((asset) => (
                <div key={asset.asset} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
                        {asset.asset}
                      </Badge>
                      <span className="text-white">{asset.total.toFixed(4)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white">{formatCurrency(asset.usdtValue)}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {((asset.usdtValue / totalBalance) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <Progress 
                    value={(asset.usdtValue / totalBalance) * 100} 
                    className="h-1 bg-gray-700"
                  />
                </div>
              ))}
            </div>

            {/* View All Link */}
            {balances.length > 5 && (
              <Button
                variant="link"
                className="mt-4 text-xs text-[#F0B90B] p-0 h-auto"
                onClick={() => {/* Navigate to full portfolio */}}
              >
                View all {balances.length} assets
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
