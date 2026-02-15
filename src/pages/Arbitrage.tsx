import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, DollarSign, Activity, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { tradingDataService } from '@/services/trading-data-service';
import { Skeleton } from '@/components/ui/skeleton';

interface ArbitrageOpportunity {
  id: string;
  exchange1: string;
  exchange2: string;
  pair: string;
  price1: number;
  price2: number;
  spread: number;
  spreadPercent: number;
  volume1: number;
  volume2: number;
  timestamp: number;
}

interface ArbitrageTrade {
  id: string;
  opportunity: ArbitrageOpportunity;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  profit: number;
  timestamp: number;
}

export default function Arbitrage() {
  const navigate = useNavigate();
  const { balances, addTransaction } = useWallet();
  const { user, isAuthenticated } = useAuth();
  
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [trades, setTrades] = useState<ArbitrageTrade[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Arbitrage contracts data
  const [contracts, setContracts] = useState<any[]>([]);
  const [arbitrageStats, setArbitrageStats] = useState<any>({ totalContracts: 0, activeContracts: 0, totalInvested: 0, totalProfit: 0 });
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Generate mock arbitrage opportunities
  useEffect(() => {
    const generateOpportunities = () => {
      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          id: '1',
          exchange1: 'Binance',
          exchange2: 'Coinbase',
          pair: 'BTC/USDT',
          price1: 67000,
          price2: 67150,
          spread: 150,
          spreadPercent: 0.22,
          volume1: 1000000,
          volume2: 950000,
          timestamp: Date.now()
        },
        {
          id: '2',
          exchange1: 'Kraken',
          exchange2: 'Binance',
          pair: 'ETH/USDT',
          price1: 3450,
          price2: 3465,
          spread: 15,
          spreadPercent: 0.43,
          volume1: 890000,
          volume2: 1200000,
          timestamp: Date.now()
        },
        {
          id: '3',
          exchange1: 'Coinbase',
          exchange2: 'Kraken',
          pair: 'SOL/USDT',
          price1: 145.50,
          price2: 146.20,
          spread: 0.70,
          spreadPercent: 0.48,
          volume1: 450000,
          volume2: 380000,
          timestamp: Date.now()
        }
      ];
      
      setOpportunities(mockOpportunities);
    };

    generateOpportunities();
    const interval = setInterval(generateOpportunities, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch arbitrage contracts data
  useEffect(() => {
    if (!user?.id) return;

    const fetchArbitrageContracts = async () => {
      setLoadingContracts(true);
      try {
        const [contractsData, statsData] = await Promise.all([
          tradingDataService.getUserArbitrageContracts(user.id),
          tradingDataService.getArbitrageStats(user.id)
        ]);
        setContracts(contractsData);
        setArbitrageStats(statsData);
      } catch (error) {
        console.error('Error fetching arbitrage contracts:', error);
      } finally {
        setLoadingContracts(false);
      }
    };

    fetchArbitrageContracts();
  }, [user?.id]);

  const handleExecuteArbitrage = useCallback(async () => {
    if (!isAuthenticated) {
      toast({
        title: '🔒 Authentication Required',
        description: 'Please login to execute arbitrage trades.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedOpportunity) {
      toast({
        title: 'Error',
        description: 'Please select an arbitrage opportunity.',
        variant: 'destructive'
      });
      return;
    }

    const tradeAmount = Number(amount);
    if (!tradeAmount || isNaN(tradeAmount) || tradeAmount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount.',
        variant: 'destructive'
      });
      return;
    }

    // Check balance using database balances
    const usdtBalance = dbBalances.USDT || 0;
    if (tradeAmount > usdtBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${tradeAmount.toFixed(2)} USDT but have ${usdtBalance.toFixed(2)} USDT.`,
        variant: 'destructive'
      });
      return;
    }

    try {
      setExecuting(true);
      setLoading(true);

      // Generate contract ID
      const contractId = `arbitrage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // ✅ STEP 1: Lock the investment in database
      console.log('🔒 [Arbitrage] Locking investment:', { asset: 'USDT', amount: tradeAmount, reference: contractId });
      
      const tradingLock = {
        user_id: user?.id,
        asset: 'USDT',
        amount: tradeAmount,
        lock_type: 'arbitrage',
        reference_id: contractId,
        status: 'locked',
        expires_at: new Date(Date.now() + 300000).toISOString(), // 5 minutes expiry
        metadata: {
          exchange1: selectedOpportunity.exchange1,
          exchange2: selectedOpportunity.exchange2,
          pair: selectedOpportunity.pair,
          spread: selectedOpportunity.spread,
          spreadPercent: selectedOpportunity.spreadPercent,
          tradeType: 'arbitrage'
        }
      };

      // Insert trading lock into database
      const { data: lockData, error: lockError } = await supabase
        .from('trading_locks')
        .insert([tradingLock])
        .select();

      if (lockError) {
        console.error('Error creating trading lock:', lockError);
        throw new Error('Failed to lock investment');
      }

      console.log('🔒 [Arbitrage] Created arbitrage trading lock:', lockData);

      // ✅ STEP 2: Update wallet balance in database
      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ 
          balance: dbBalances.USDT - tradeAmount,
          locked_balance: (dbBalances.USDT || 0) + tradeAmount
        })
        .eq('user_id', user?.id)
        .eq('currency', 'USDT');

      if (balanceError) {
        console.error('Error updating wallet balance:', balanceError);
        throw new Error('Failed to update wallet balance');
      }

      // Update local state
      setDbBalances(prev => ({
        ...prev,
        USDT: prev.USDT - tradeAmount
      }));

      // ✅ STEP 3: Create arbitrage contract record
      const estimatedProfit = tradeAmount * (selectedOpportunity.spreadPercent / 100);
      const duration = 3600; // 1 hour in seconds
      
      const { error: contractError } = await supabase
        .from('arbitrage_contracts')
        .insert([{
          id: contractId,
          user_id: user?.id,
          product_id: contractId,
          product_label: `${selectedOpportunity.exchange1}-${selectedOpportunity.exchange2}`,
          amount: tradeAmount,
          duration: duration,
          apy: selectedOpportunity.spreadPercent * 100,
          status: 'active',
          metadata: { 
            exchange1: selectedOpportunity.exchange1,
            exchange2: selectedOpportunity.exchange2,
            pair: selectedOpportunity.pair,
            spread: selectedOpportunity.spread,
            spreadPercent: selectedOpportunity.spreadPercent,
            lockId: lockData[0]?.id
          },
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + duration * 1000).toISOString()
        }]);

      if (contractError) {
        console.error('Error creating arbitrage contract:', contractError);
      }

      // ✅ STEP 4: Create transaction record
      const newTransaction = {
        id: contractId,
        userId: user!.id,
        type: 'Arbitrage',
        asset: selectedOpportunity.pair,
        amount: tradeAmount,
        status: 'Processing',
        date: new Date().toISOString(),
        category: 'arbitrage',
        details: {
          exchange1: selectedOpportunity.exchange1,
          exchange2: selectedOpportunity.exchange2,
          pair: selectedOpportunity.pair,
          spread: selectedOpportunity.spread,
          spreadPercent: selectedOpportunity.spreadPercent,
          estimatedProfit,
          tradingLockId: lockData[0]?.id
        }
      };
      
      await addTransaction(newTransaction);

      // Simulate arbitrage execution
      setTimeout(async () => {
        const success = Math.random() > 0.1; // 90% success rate
        const finalProfit = success ? estimatedProfit : -tradeAmount * 0.01; // 1% fee on failure
        
        // Update arbitrage contract
        await supabase
          .from('arbitrage_contracts')
          .update({ 
            status: success ? 'completed' : 'failed'
          })
          .eq('id', contractId);

        // Update transaction
        await supabase
          .from('transactions')
          .update({ 
            status: success ? 'Completed' : 'Failed',
            pnl: finalProfit
          })
          .eq('id', contractId);

        if (success) {
          // Add profit to wallet
          const returnAmount = tradeAmount + finalProfit;
          
          const { error: profitError } = await supabase
            .from('wallets')
            .update({ 
              balance: (dbBalances.USDT || 0) + returnAmount,
              locked_balance: Math.max(0, (dbBalances.USDT || 0) + tradeAmount - returnAmount)
            })
            .eq('user_id', user?.id)
            .eq('currency', 'USDT');

          if (!profitError) {
            setDbBalances(prev => ({
              ...prev,
              USDT: prev.USDT + returnAmount
            }));
          }

          // Update trading lock status to released
          await supabase
            .from('trading_locks')
            .update({ 
              status: 'released',
              released_at: new Date().toISOString()
            })
            .eq('id', lockData[0]?.id);

          toast({
            title: '✅ Arbitrage Successful!',
            description: `Profit: $${finalProfit.toFixed(2)}`,
          });
        } else {
          // Update trading lock status to failed
          await supabase
            .from('trading_locks')
            .update({ 
              status: 'failed',
              released_at: new Date().toISOString()
            })
            .eq('id', lockData[0]?.id);

          toast({
            title: '❌ Arbitrage Failed',
            description: `Loss: $${(tradeAmount * 0.01).toFixed(2)} (execution fee)`,
            variant: 'destructive'
          });
        }

        setExecuting(false);
        setLoading(false);
        setAmount('');
        setSelectedOpportunity(null);
      }, 3000);

      toast({
        title: '⏰ Arbitrage Executing',
        description: `Your arbitrage trade is being processed`,
      });

    } catch (error) {
      toast({
        title: '❌ Arbitrage Failed',
        description: error instanceof Error ? error.message : 'Failed to execute arbitrage',
        variant: 'destructive'
      });
      setExecuting(false);
      setLoading(false);
    }
  }, [isAuthenticated, selectedOpportunity, amount, dbBalances, addTransaction, user]);

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/trading')}
            className="text-[#848E9C] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trading
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[#EAECEF]">Arbitrage Trading</h1>
            <p className="text-[#848E9C]">Exploit price differences across exchanges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunities List */}
          <div className="lg:col-span-2">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#EAECEF]">Live Opportunities</h2>
                <Badge className="bg-green-500/20 text-green-400">
                  {opportunities.length} Available
                </Badge>
              </div>

              {opportunities.length === 0 ? (
                <div className="text-center py-12 text-[#848E9C]">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Arbitrage Opportunities Available</h3>
                  <p className="text-sm">Real-time arbitrage opportunities will appear here when available.</p>
                  <p className="text-xs mt-2">Connect to exchange APIs to start detecting price differences.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map(opp => (
                    <div
                      key={opp.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedOpportunity?.id === opp.id
                          ? 'border-[#F0B90B] bg-[#F0B90B]/10'
                          : 'border-[#2B3139] hover:border-[#F0B90B]/50'
                      }`}
                      onClick={() => setSelectedOpportunity(opp)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-[#EAECEF]">{opp.pair}</span>
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                            {opp.exchange1} → {opp.exchange2}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {opp.spreadPercent > 0.3 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-yellow-400" />
                          )}
                          <span className={`font-bold ${
                            opp.spreadPercent > 0.3 ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {opp.spreadPercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-[#848E9C]">{opp.exchange1}: </span>
                          <span className="text-[#EAECEF]">${opp.price1.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#848E9C]">{opp.exchange2}: </span>
                          <span className="text-[#EAECEF]">${opp.price2.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#848E9C]">Spread: </span>
                          <span className="text-green-400">${opp.spread.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-[#848E9C]">
                        <span>Vol: ${(opp.volume1 + opp.volume2 / 1000000).toFixed(1)}M</span>
                        <span>{new Date(opp.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Execute Trade */}
            <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
              <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">Execute Arbitrage</h2>
              
              {!selectedOpportunity ? (
                <div className="text-center py-8 text-[#848E9C]">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Select an opportunity to start trading</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-[#2B3139] rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#848E9C]">Selected Pair</span>
                      <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                        {selectedOpportunity.pair}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#848E9C]">Expected Return</span>
                      <span className="text-green-400 font-bold">
                        {selectedOpportunity.spreadPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#848E9C]">Route</span>
                      <span className="text-sm text-[#EAECEF]">
                        {selectedOpportunity.exchange1} → {selectedOpportunity.exchange2}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[#848E9C] mb-2">
                      Amount (USDT)
                    </label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-[#2B3139] border-[#2B3139] text-white"
                      disabled={executing}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-[#848E9C]">Available: {getBalance('USDT').toFixed(2)}</span>
                      {amount && (
                        <span className="text-xs text-green-400">
                          Est. Profit: ${(Number(amount) * selectedOpportunity.spreadPercent / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleExecuteArbitrage}
                    disabled={!amount || executing || !isAuthenticated}
                    className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
                  >
                    {executing ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Execute Arbitrage
                      </>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Arbitrage Contracts Status */}
            <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#EAECEF]">Active Contracts</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#848E9C]">Active:</span>
                  <span className="text-[#EAECEF] font-medium">{arbitrageStats.activeContracts}</span>
                  <span className="text-[#848E9C]">Invested:</span>
                  <span className="text-[#F0B90B] font-medium">{arbitrageStats.totalInvested.toFixed(2)} USDT</span>
                </div>
              </div>
              
              {loadingContracts ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 bg-[#2B3139]" />
                  <Skeleton className="h-16 bg-[#2B3139]" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-8 text-[#848E9C] text-sm">
                  No active arbitrage contracts. Start investing to see your contracts here.
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.slice(0, 5).map((contract, index) => (
                    <div key={contract.id} className="bg-[#2B3139] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-medium text-[#EAECEF]">{contract.product_label}</div>
                          <div className="text-xs text-[#848E9C]">APY: {contract.apy}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-[#EAECEF]">{contract.amount.toFixed(2)} USDT</div>
                          <div className="text-xs text-[#848E9C]">
                            {tradingDataService.formatLockDuration(contract.expires_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#848E9C]">Expected Profit: {(contract.amount * (contract.apy / 100) * (contract.duration / 8760)).toFixed(2)} USDT</span>
                        <Badge className={
                          contract.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          contract.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {contract.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {contracts.length > 5 && (
                    <div className="text-center text-xs text-[#848E9C]">
                      Showing 5 of {contracts.length} active contracts
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Recent Trades */}
            <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
              <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">Recent Trades</h2>
              
              {trades.length === 0 ? (
                <div className="text-center py-4 text-[#848E9C] text-sm">
                  No trades yet
                </div>
              ) : (
                <div className="space-y-2">
                  {trades.slice(0, 5).map(trade => (
                    <div key={trade.id} className="p-3 bg-[#2B3139] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#EAECEF]">{trade.opportunity.pair}</span>
                        <Badge className={
                          trade.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          trade.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {trade.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#848E9C]">${trade.amount.toFixed(2)}</span>
                        <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                          {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
