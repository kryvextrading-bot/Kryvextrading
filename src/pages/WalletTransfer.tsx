import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowUpDown, 
  Wallet, 
  TrendingUp, 
  Clock, 
  Shield, 
  ChevronRight,
  Info,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUnifiedWallet as useUnifiedWalletV2 } from '@/hooks/useUnifiedWallet-v2';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Asset interface
interface Asset {
  symbol: string;
  name: string;
  funding: number;
  trading: number;
  icon: string;
  price?: number;
}

export default function WalletTransferPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use real wallet data with default values to prevent errors
  const wallet = useUnifiedWalletV2() || {};
  
  const {
    getFundingBalance = (asset: string) => 0,
    getTradingBalance = (asset: string) => 0,
    getLockedBalance = (asset: string) => 0,
    getTotalBalance = (asset: string) => 0,
    transferToTrading = async () => ({ success: false, error: 'Not implemented' }),
    transferToFunding = async () => ({ success: false, error: 'Not implemented' }),
    refreshBalances = async () => {},
    loading: walletLoading = false,
    balances = { funding: {}, trading: {}, locked: {} }
  } = wallet;
  
  const [activeTab, setActiveTab] = useState<'funding-to-trading' | 'trading-to-funding'>('funding-to-trading');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Calculate total balances using useMemo for consistency
  const totalFundingBalance = useMemo(() => {
    return Object.values(balances?.funding || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.funding]);

  const totalTradingBalance = useMemo(() => {
    return Object.values(balances?.trading || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.trading]);

  const totalLockedBalance = useMemo(() => {
    return Object.values(balances?.locked || {}).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [balances?.locked]);

  const totalBalance = useMemo(() => {
    return totalFundingBalance + totalTradingBalance + totalLockedBalance;
  }, [totalFundingBalance, totalTradingBalance, totalLockedBalance]);

  // Real balances for the selected asset
  const fundingBalance = useMemo(() => {
    return Number(getFundingBalance(selectedAsset)) || 0;
  }, [getFundingBalance, selectedAsset]);

  const tradingBalance = useMemo(() => {
    return Number(getTradingBalance(selectedAsset)) || 0;
  }, [getTradingBalance, selectedAsset]);

  // Load available assets from real balances
  useEffect(() => {
    const loadAssets = async () => {
      if (!user?.id) return;
      
      try {
        // Get all unique assets from balances
        const allAssets = new Set<string>();
        
        // Add USDT always
        allAssets.add('USDT');
        
        // Add other assets that have balance
        if (balances?.funding) {
          Object.keys(balances.funding).forEach(symbol => {
            // Skip legacy trading wallet entries
            if (!symbol.includes('_TRADING') && Number(balances.funding[symbol]) > 0) {
              allAssets.add(symbol);
            }
          });
        }
        if (balances?.trading) {
          Object.keys(balances.trading).forEach(symbol => {
            // Skip legacy trading wallet entries and only use clean symbols
            if (!symbol.includes('_TRADING') && Number(balances.trading[symbol]) > 0) {
              allAssets.add(symbol);
            }
          });
        }
        
        const assetList: Asset[] = [];
        
        for (const symbol of allAssets) {
          const funding = Number(getFundingBalance(symbol)) || 0;
          const trading = Number(getTradingBalance(symbol)) || 0;
          
          // Only show assets with balance in either wallet
          if (funding > 0 || trading > 0 || symbol === 'USDT') {
            assetList.push({
              symbol,
              name: getAssetName(symbol),
              funding,
              trading,
              icon: getAssetIcon(symbol)
            });
          }
        }
        
        // Sort by total balance (funding + trading) descending
        assetList.sort((a, b) => (b.funding + b.trading) - (a.funding + a.trading));
        
        setAssets(assetList);
        
        // Set default selected asset to first with balance, or USDT
        if (assetList.length > 0) {
          setSelectedAsset(assetList[0].symbol);
        }
      } catch (error) {
        console.error('Error loading assets:', error);
      }
    };
    
    loadAssets();
  }, [user, balances, getFundingBalance, getTradingBalance]);

  // Helper function to get asset name
  const getAssetName = (symbol: string): string => {
    const names: Record<string, string> = {
      'USDT': 'Tether',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin',
      'SOL': 'Solana',
      'ADA': 'Cardano',
      'XRP': 'Ripple',
      'DOT': 'Polkadot',
      'DOGE': 'Dogecoin',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'ATOM': 'Cosmos',
      'LTC': 'Litecoin',
      'BCH': 'Bitcoin Cash',
      'ALGO': 'Algorand',
      'NEAR': 'NEAR Protocol',
      'FIL': 'Filecoin',
      'TRX': 'TRON'
    };
    return names[symbol] || symbol;
  };

  // Helper function to get asset icon
  const getAssetIcon = (symbol: string): string => {
    const icons: Record<string, string> = {
      'USDT': '₮',
      'BTC': '₿',
      'ETH': 'Ξ',
      'SOL': '◎',
      'XRP': '✕',
      'ADA': '₳',
      'DOGE': 'Ð',
      'BNB': '🟡',
      'AVAX': '🅰️',
      'DOT': '⚫',
      'MATIC': 'M',
      'TRX': 'T',
      'LINK': '🔗',
      'FIL': '🟦',
      'XMR': 'Ⓜ️',
      'ATOM': '⚛️',
      'LTC': 'Ł',
      'ARB': '🅰️'
    };
    return icons[symbol] || '◉';
  };

  // Format currency helper
  const formatCurrency = (value: number): string => {
    return value.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  const handleMaxClick = () => {
    const maxAmount = activeTab === 'funding-to-trading' 
      ? fundingBalance 
      : tradingBalance;
    setAmount(maxAmount.toString());
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please login to transfer funds",
        variant: "destructive"
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    
    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    // Check sufficient balance
    const availableBalance = activeTab === 'funding-to-trading' 
      ? fundingBalance 
      : tradingBalance;
      
    if (transferAmount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${formatCurrency(availableBalance)} ${selectedAsset} available`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      let result;
      
      if (activeTab === 'funding-to-trading') {
        // Transfer from funding to trading
        result = await transferToTrading(selectedAsset, transferAmount, `transfer_${Date.now()}`);
        
        if (result.success) {
          toast({
            title: "Transfer Successful",
            description: `Successfully transferred ${formatCurrency(transferAmount)} ${selectedAsset} to trading wallet`,
          });
        }
      } else {
        // Transfer from trading to funding
        result = await transferToFunding(selectedAsset, transferAmount, `transfer_${Date.now()}`);
        
        if (result.success) {
          toast({
            title: "Transfer Successful", 
            description: `Successfully transferred ${formatCurrency(transferAmount)} ${selectedAsset} to funding wallet`,
          });
        }
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Transfer failed');
      }
      
      // Refresh balances to show updated amounts
      await refreshBalances();
      
      // Clear amount and show success
      setAmount('');
      
      // Show success and navigate back after delay
      setTimeout(() => navigate('/wallet'), 1500);
      
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Transfer Failed",
        description: error instanceof Error ? error.message : 'An error occurred during transfer',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current asset data
  const currentAsset = assets.find(a => a.symbol === selectedAsset) || {
    symbol: selectedAsset,
    name: getAssetName(selectedAsset),
    funding: fundingBalance,
    trading: tradingBalance,
    icon: getAssetIcon(selectedAsset)
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E0F14] to-[#181A20]">
      {/* Premium Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139]/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#848E9C] hover:text-[#EAECEF] transition-colors p-2 -ml-2 rounded-xl hover:bg-[#23262F]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20">
                  <ArrowUpDown className="w-5 h-5 text-[#181A20]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#EAECEF]">Transfer Funds</h1>
                  <p className="text-xs text-[#848E9C]">Move assets between wallets</p>
                </div>
              </div>
            </div>

            {/* Balance Overview Badge */}
            <div className="hidden sm:flex items-center gap-3 bg-[#23262F] px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-sm text-[#848E9C]">Total:</span>
                <span className="text-sm font-semibold text-[#EAECEF]">
                  {walletLoading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    `${formatCurrency(totalBalance)} USDT`
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick Stats Cards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        >
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#848E9C]">Funding Wallet</span>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#EAECEF]">
              {walletLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatCurrency(totalFundingBalance)
              )}
            </div>
            <div className="text-xs text-[#848E9C] mt-1">Available for deposits/withdrawals</div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#848E9C]">Trading Wallet</span>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#EAECEF]">
              {walletLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatCurrency(totalTradingBalance)
              )}
            </div>
            <div className="text-xs text-[#848E9C] mt-1">Available for trading</div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#848E9C]">Locked Balance</span>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#EAECEF]">
              {walletLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatCurrency(totalLockedBalance)
              )}
            </div>
            <div className="text-xs text-[#848E9C] mt-1">In open orders</div>
          </Card>
        </motion.div>

        {/* Main Transfer Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] overflow-hidden">
            {/* Tabs */}
            <div className="p-6 pb-0">
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
                <TabsList className="grid grid-cols-2 w-full bg-[#23262F] p-1 rounded-xl">
                  <TabsTrigger 
                    value="funding-to-trading"
                    className={cn(
                      "text-sm py-2.5 rounded-lg transition-all",
                      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90",
                      "data-[state=active]:text-[#181A20] data-[state=active]:font-medium",
                      "data-[state=inactive]:text-[#848E9C] data-[state=inactive]:hover:text-[#EAECEF]"
                    )}
                  >
                    Funding → Trading
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trading-to-funding"
                    className={cn(
                      "text-sm py-2.5 rounded-lg transition-all",
                      "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F0B90B] data-[state=active]:to-[#F0B90B]/90",
                      "data-[state=active]:text-[#181A20] data-[state=active]:font-medium",
                      "data-[state=inactive]:text-[#848E9C] data-[state=inactive]:hover:text-[#EAECEF]"
                    )}
                  >
                    Trading → Funding
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funding-to-trading" className="mt-6">
                  <div className="space-y-6">
                    {/* Asset Selection */}
                    <div>
                      <Label className="text-sm text-[#848E9C] mb-2 block">Select Asset</Label>
                      {walletLoading ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3].map(i => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {assets.map((asset) => (
                            <motion.button
                              key={asset.symbol}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedAsset(asset.symbol)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                selectedAsset === asset.symbol
                                  ? "border-[#F0B90B] bg-[#F0B90B]/10"
                                  : "border-[#2B3139] bg-[#23262F] hover:border-[#F0B90B]/50"
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center text-sm">
                                {asset.icon}
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-[#EAECEF]">{asset.symbol}</div>
                                <div className="text-xs text-[#848E9C]">
                                  {formatCurrency(asset.funding)}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Transfer Direction Visual */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-right">
                        <div className="text-xs text-[#848E9C]">From</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Funding</div>
                        <div className="text-xs text-[#F0B90B]">
                          {walletLoading ? '...' : formatCurrency(currentAsset.funding)}
                        </div>
                      </div>
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-10 h-10 rounded-full bg-[#F0B90B]/10 flex items-center justify-center"
                      >
                        <ArrowRight className="w-5 h-5 text-[#F0B90B]" />
                      </motion.div>
                      <div className="text-left">
                        <div className="text-xs text-[#848E9C]">To</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Trading</div>
                        <div className="text-xs text-[#F0B90B]">
                          {walletLoading ? '...' : formatCurrency(currentAsset.trading)}
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-[#848E9C]">Amount</Label>
                        <span className="text-xs text-[#848E9C]">
                          Available: {walletLoading ? '...' : formatCurrency(currentAsset.funding)} {selectedAsset}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={walletLoading || currentAsset.funding <= 0}
                          className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-14 text-lg rounded-xl pr-24 focus:border-[#F0B90B] transition-colors disabled:opacity-50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={handleMaxClick}
                            disabled={walletLoading || currentAsset.funding <= 0}
                            className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] hover:bg-[#F0B90B]/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            MAX
                          </button>
                          <span className="text-[#2B3139]">|</span>
                          <span className="px-2 text-sm font-medium text-[#EAECEF]">
                            {selectedAsset}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Summary */}
                    <div className="bg-[#23262F] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">You transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {amount || '0'} {selectedAsset}
                        </span>
                      </div>
                      <Separator className="bg-[#2B3139]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Funding after transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {walletLoading ? '...' : amount && parseFloat(amount) > 0 
                            ? formatCurrency(currentAsset.funding - parseFloat(amount))
                            : formatCurrency(currentAsset.funding)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Trading after transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {walletLoading ? '...' : amount && parseFloat(amount) > 0 
                            ? formatCurrency(currentAsset.trading + parseFloat(amount))
                            : formatCurrency(currentAsset.trading)
                          }
                        </span>
                      </div>
                    </div>

                    {/* Info Message */}
                    <div className="flex items-start gap-2 bg-[#23262F] rounded-xl p-3">
                      <Info className="w-4 h-4 text-[#848E9C] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#848E9C]">
                        Transfers are instant and free. Funds will be available in your trading wallet immediately.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trading-to-funding" className="mt-6">
                  <div className="space-y-6">
                    {/* Asset Selection */}
                    <div>
                      <Label className="text-sm text-[#848E9C] mb-2 block">Select Asset</Label>
                      {walletLoading ? (
                        <div className="grid grid-cols-3 gap-2">
                          {[1,2,3].map(i => (
                            <Skeleton key={i} className="h-20 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {assets.map((asset) => (
                            <motion.button
                              key={asset.symbol}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedAsset(asset.symbol)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                selectedAsset === asset.symbol
                                  ? "border-[#F0B90B] bg-[#F0B90B]/10"
                                  : "border-[#2B3139] bg-[#23262F] hover:border-[#F0B90B]/50"
                              )}
                            >
                              <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center text-sm">
                                {asset.icon}
                              </div>
                              <div className="text-left">
                                <div className="text-sm font-medium text-[#EAECEF]">{asset.symbol}</div>
                                <div className="text-xs text-[#848E9C]">
                                  {formatCurrency(asset.trading)}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Transfer Direction Visual */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-right">
                        <div className="text-xs text-[#848E9C]">From</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Trading</div>
                        <div className="text-xs text-[#F0B90B]">
                          {walletLoading ? '...' : formatCurrency(currentAsset.trading)}
                        </div>
                      </div>
                      <motion.div
                        animate={{ x: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-10 h-10 rounded-full bg-[#F0B90B]/10 flex items-center justify-center"
                      >
                        <ArrowLeftIcon className="w-5 h-5 text-[#F0B90B]" />
                      </motion.div>
                      <div className="text-left">
                        <div className="text-xs text-[#848E9C]">To</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Funding</div>
                        <div className="text-xs text-[#F0B90B]">
                          {walletLoading ? '...' : formatCurrency(currentAsset.funding)}
                        </div>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-[#848E9C]">Amount</Label>
                        <span className="text-xs text-[#848E9C]">
                          Available: {walletLoading ? '...' : formatCurrency(currentAsset.trading)} {selectedAsset}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          disabled={walletLoading || currentAsset.trading <= 0}
                          className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-14 text-lg rounded-xl pr-24 focus:border-[#F0B90B] transition-colors disabled:opacity-50"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={handleMaxClick}
                            disabled={walletLoading || currentAsset.trading <= 0}
                            className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] hover:bg-[#F0B90B]/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            MAX
                          </button>
                          <span className="text-[#2B3139]">|</span>
                          <span className="px-2 text-sm font-medium text-[#EAECEF]">
                            {selectedAsset}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Summary */}
                    <div className="bg-[#23262F] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">You transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {amount || '0'} {selectedAsset}
                        </span>
                      </div>
                      <Separator className="bg-[#2B3139]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Trading after transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {walletLoading ? '...' : amount && parseFloat(amount) > 0 
                            ? formatCurrency(currentAsset.trading - parseFloat(amount))
                            : formatCurrency(currentAsset.trading)
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">Funding after transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {walletLoading ? '...' : amount && parseFloat(amount) > 0 
                            ? formatCurrency(currentAsset.funding + parseFloat(amount))
                            : formatCurrency(currentAsset.funding)
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-[#2B3139] p-6 bg-[#1A1F26]/50">
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="order-2 sm:order-1 border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#23262F] h-12 px-6 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!amount || parseFloat(amount) <= 0 || isSubmitting || walletLoading}
                  className={cn(
                    "order-1 sm:order-2 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80",
                    "hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-semibold",
                    "h-12 px-8 rounded-xl shadow-lg shadow-[#F0B90B]/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#181A20] border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    'Confirm Transfer'
                  )}
                </Button>
              </div>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 mt-4">
                <Shield className="w-3 h-3 text-[#F0B90B]" />
                <p className="text-xs text-[#848E9C]">
                  Secure transfer • Funds available immediately
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}