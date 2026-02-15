import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  ArrowUpDown, 
  ArrowDown, 
  ArrowUp, 
  Wallet, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { useToast } from '@/hooks/use-toast';

// Utility function
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

interface WalletTransferProps {
  onClose?: () => void;
}

export default function WalletTransfer({ onClose }: WalletTransferProps) {
  const { 
    getFundingBalance, 
    getTradingBalance, 
    transferToTrading, 
    transferToFunding,
    loading,
    refreshData,
    tradingBalances,
    fundingBalances
  } = useUnifiedWallet();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [transferType, setTransferType] = useState<'to-trading' | 'to-funding'>('to-trading');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Refresh data when component mounts
  useEffect(() => {
    console.log('🔄 [WalletTransfer] Component mounted, refreshing data...');
    refreshData();
  }, [refreshData]);

  const fundingBalance = getFundingBalance(selectedAsset);
  const tradingBalance = getTradingBalance(selectedAsset);
  const transferAmount = Number(amount) || 0;

  // Debug logs
  console.log('💰 [WalletTransfer] Balance debug:', {
    selectedAsset,
    fundingBalance,
    tradingBalance,
    tradingBalances,
    fundingBalances,
    loading
  });

  const handleTransfer = async () => {
    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    if (transferType === 'to-trading' && transferAmount > fundingBalance) {
      toast({
        title: "Insufficient Balance",
        description: `Insufficient funding balance. You have ${formatCurrency(fundingBalance)}`,
        variant: "destructive"
      });
      return;
    }

    if (transferType === 'to-funding' && transferAmount > tradingBalance) {
      toast({
        title: "Insufficient Balance", 
        description: `Insufficient trading balance. You have ${formatCurrency(tradingBalance)}`,
        variant: "destructive"
      });
      return;
    }

    setIsTransferring(true);
    
    try {
      const result = transferType === 'to-trading' 
        ? await transferToTrading(selectedAsset, transferAmount)
        : await transferToFunding(selectedAsset, transferAmount);

      if (result.success) {
        setShowSuccess(true);
        setAmount('');
        
        setTimeout(() => {
          setShowSuccess(false);
          if (onClose) onClose();
        }, 2000);
        
        toast({
          title: "Transfer Successful",
          description: `Successfully transferred ${formatCurrency(transferAmount)} ${selectedAsset}`
        });
      } else {
        toast({
          title: "Transfer Failed",
          description: result.error || 'Transfer failed',
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Transfer Failed", 
        description: 'Transfer failed. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const assets = [
    { symbol: 'USDT', name: 'Tether', icon: '₮' },
    { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { symbol: 'SOL', name: 'Solana', icon: '◎' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] to-[#1A1D24] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F0B90B] rounded-xl flex items-center justify-center">
              <ArrowUpDown className="w-5 h-5 text-[#181A20]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#EAECEF]">Wallet Transfer</h1>
              <p className="text-sm text-[#848E9C]">Move funds between funding and trading wallets</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshData()}
              disabled={loading}
              className="text-[#848E9C] hover:text-[#EAECEF]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-[#848E9C] hover:text-[#EAECEF]"
              >
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Success Animation */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-[#1E2329] border border-[#F0B90B] rounded-2xl p-8 max-w-sm"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-[#EAECEF] mb-2">Transfer Successful!</h3>
                  <p className="text-[#848E9C] text-center">
                    {formatCurrency(transferAmount)} {selectedAsset} transferred successfully
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transfer Type Selector */}
        <Card className="bg-[#1E2329] border-[#2B3139] mb-6">
          <Tabs value={transferType} onValueChange={(value: any) => setTransferType(value)} className="w-full">
            <div className="p-4">
              <TabsList className="grid grid-cols-2 w-full bg-[#181A20] p-1 rounded-xl">
                <TabsTrigger 
                  value="to-trading" 
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                >
                  <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Funding → Trading</span>
                  <span className="sm:hidden">Fund → Trade</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="to-funding" 
                  className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]"
                >
                  <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Trading → Funding</span>
                  <span className="sm:hidden">Trade → Fund</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Balance Overview */}
            <div className="p-4 border-t border-[#2B3139]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#181A20] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-[#848E9C]" />
                    <span className="text-sm text-[#848E9C]">Funding Wallet</span>
                  </div>
                  <div className="text-xl font-bold text-[#EAECEF]">
                    {formatCurrency(fundingBalance)}
                  </div>
                  <div className="text-xs text-[#848E9C] mt-1">
                    Available for withdrawal
                  </div>
                </div>
                
                <div className="bg-[#181A20] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#848E9C]" />
                    <span className="text-sm text-[#848E9C]">Trading Wallet</span>
                  </div>
                  <div className="text-xl font-bold text-[#EAECEF]">
                    {formatCurrency(tradingBalance)}
                  </div>
                  <div className="text-xs text-[#848E9C] mt-1">
                    Used for trading only
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </Card>

        {/* Asset Selection */}
        <Card className="bg-[#1E2329] border-[#2B3139] mb-6">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[#EAECEF] mb-3">Select Asset</h3>
            <div className="grid grid-cols-2 gap-3">
              {assets.map((asset) => (
                <motion.button
                  key={asset.symbol}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedAsset === asset.symbol
                      ? 'border-[#F0B90B] bg-[#F0B90B]/10'
                      : 'border-[#2B3139] bg-[#181A20] hover:border-[#F0B90B]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{asset.icon}</span>
                      <div className="text-left">
                        <div className="font-medium text-[#EAECEF]">{asset.symbol}</div>
                        <div className="text-xs text-[#848E9C]">{asset.name}</div>
                      </div>
                    </div>
                    {selectedAsset === asset.symbol && (
                      <div className="w-2 h-2 bg-[#F0B90B] rounded-full" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </Card>

        {/* Transfer Form */}
        <Card className="bg-[#1E2329] border-[#2B3139] mb-6">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[#EAECEF] mb-3">Transfer Amount</h3>
            
            <div className="relative mb-4">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-12 pr-20"
                disabled={loading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm text-[#848E9C]">{selectedAsset}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmount(transferType === 'to-trading' ? fundingBalance.toString() : tradingBalance.toString())}
                  className="text-xs px-2 py-1 h-auto bg-[#2B3139] hover:bg-[#374151] text-[#EAECEF]"
                >
                  MAX
                </Button>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mb-4">
              {[10, 50, 100, 500, 1000].map((value) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setAmount(value.toString())}
                  className="flex-1 bg-[#181A20] hover:bg-[#2B3139] text-[#EAECEF] border border-[#2B3139]"
                >
                  {value}
                </Button>
              ))}
            </div>

            {/* Transfer Info */}
            <div className="bg-[#181A20] rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#848E9C]">You will transfer:</span>
                <span className="font-bold text-[#EAECEF]">
                  {transferAmount > 0 ? formatCurrency(transferAmount) : formatCurrency(0)} {selectedAsset}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#848E9C]">From:</span>
                <span className="font-medium text-[#EAECEF]">
                  {transferType === 'to-trading' ? 'Funding Wallet' : 'Trading Wallet'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#848E9C]">To:</span>
                <span className="font-medium text-[#EAECEF]">
                  {transferType === 'to-trading' ? 'Trading Wallet' : 'Funding Wallet'}
                </span>
              </div>
            </div>

            {/* Warning */}
            {(transferType === 'to-trading' && transferAmount > fundingBalance) ||
             (transferType === 'to-funding' && transferAmount > tradingBalance) ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">
                    Insufficient balance in {transferType === 'to-trading' ? 'funding' : 'trading'} wallet
                  </span>
                </div>
              </div>
            ) : null}

            {/* Transfer Button */}
            <Button
              onClick={handleTransfer}
              disabled={
                isTransferring || 
                loading || 
                transferAmount <= 0 ||
                (transferType === 'to-trading' && transferAmount > fundingBalance) ||
                (transferType === 'to-funding' && transferAmount > tradingBalance)
              }
              className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {isTransferring ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Transfer {formatCurrency(transferAmount)} {selectedAsset}
                </div>
              )}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-500/10 border border-blue-500/30">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">Important Notes</h4>
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• Only funding wallet can be used for withdrawals</li>
                  <li>• Only trading wallet can be used for trading/arbitrage</li>
                  <li>• Transfers are instant and irreversible</li>
                  <li>• Minimum transfer amount is 10 {selectedAsset}</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
