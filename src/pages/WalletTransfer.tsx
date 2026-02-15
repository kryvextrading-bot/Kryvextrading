import React, { useState } from 'react';
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
import WalletTransfer from '@/components/WalletTransfer';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function WalletTransferPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'funding-to-trading' | 'trading-to-funding'>('funding-to-trading');
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data
  const balances = {
    funding: 12500.45,
    trading: 8750.23,
    locked: 1250.00
  };

  const assets = [
    { symbol: 'USDT', name: 'Tether', funding: 12500.45, trading: 8750.23, icon: '₮' },
    { symbol: 'BTC', name: 'Bitcoin', funding: 0.45, trading: 0.23, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', funding: 5.67, trading: 3.89, icon: 'Ξ' },
  ];

  const handleMaxClick = () => {
    const maxAmount = activeTab === 'funding-to-trading' 
      ? balances.funding 
      : balances.trading;
    setAmount(maxAmount.toString());
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate transfer
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    // Show success and navigate back
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
                <span className="text-sm font-semibold text-[#EAECEF]">$21,250.68</span>
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
            <div className="text-xl font-bold text-[#EAECEF]">${balances.funding.toLocaleString()}</div>
            <div className="text-xs text-[#848E9C] mt-1">Available for deposits</div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#848E9C]">Trading Wallet</span>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#EAECEF]">${balances.trading.toLocaleString()}</div>
            <div className="text-xs text-[#848E9C] mt-1">Available for trading</div>
          </Card>

          <Card className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#848E9C]">Locked Balance</span>
              <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[#F0B90B]" />
              </div>
            </div>
            <div className="text-xl font-bold text-[#EAECEF]">${balances.locked.toLocaleString()}</div>
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
                              <div className="text-xs text-[#848E9C]">${asset.funding.toLocaleString()}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Transfer Direction Visual */}
                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-right">
                        <div className="text-xs text-[#848E9C]">From</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Funding</div>
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
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-[#848E9C]">Amount</Label>
                        <span className="text-xs text-[#848E9C]">
                          Available: ${balances.funding.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-14 text-lg rounded-xl pr-24 focus:border-[#F0B90B] transition-colors"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={handleMaxClick}
                            className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] hover:bg-[#F0B90B]/10 rounded-lg transition-colors"
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
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">To trading wallet</span>
                        <span className="text-[#EAECEF] font-medium">
                          ${amount ? (parseFloat(amount) * (selectedAsset === 'USDT' ? 1 : 40000)).toLocaleString() : '0'} USD
                        </span>
                      </div>
                      <Separator className="bg-[#2B3139]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">After transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          ${(balances.funding - (parseFloat(amount) || 0)).toLocaleString()}
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
                    {/* Similar content but for trading to funding */}
                    <div>
                      <Label className="text-sm text-[#848E9C] mb-2 block">Select Asset</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {assets.map((asset) => (
                          <motion.button
                            key={asset.symbol}
                            whileHover={{ scale: 1.02 }}
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
                              <div className="text-xs text-[#848E9C]">${asset.trading.toLocaleString()}</div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4 py-2">
                      <div className="text-right">
                        <div className="text-xs text-[#848E9C]">From</div>
                        <div className="text-sm font-medium text-[#EAECEF]">Trading</div>
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
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm text-[#848E9C]">Amount</Label>
                        <span className="text-xs text-[#848E9C]">
                          Available: ${balances.trading.toLocaleString()}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-14 text-lg rounded-xl pr-24 focus:border-[#F0B90B] transition-colors"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() => setAmount(balances.trading.toString())}
                            className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] hover:bg-[#F0B90B]/10 rounded-lg transition-colors"
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

                    <div className="bg-[#23262F] rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">You transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          {amount || '0'} {selectedAsset}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">To funding wallet</span>
                        <span className="text-[#EAECEF] font-medium">
                          ${amount ? (parseFloat(amount) * (selectedAsset === 'USDT' ? 1 : 40000)).toLocaleString() : '0'} USD
                        </span>
                      </div>
                      <Separator className="bg-[#2B3139]" />
                      <div className="flex justify-between text-sm">
                        <span className="text-[#848E9C]">After transfer</span>
                        <span className="text-[#EAECEF] font-medium">
                          ${(balances.trading - (parseFloat(amount) || 0)).toLocaleString()}
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
                  disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
                  className={cn(
                    "order-1 sm:order-2 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80",
                    "hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-semibold",
                    "h-12 px-8 rounded-xl shadow-lg shadow-[#F0B90B]/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-[#F0B90B]/80"
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
                  Secure transfer • 2FA verification may be required
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Transfers (Optional) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#EAECEF]">Recent Transfers</h3>
              <button className="text-xs text-[#F0B90B] hover:text-yellow-400 transition-colors flex items-center gap-1">
                View All
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#2B3139]/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#23262F] flex items-center justify-center">
                      <ArrowUpDown className="w-4 h-4 text-[#F0B90B]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#EAECEF]">Funding → Trading</div>
                      <div className="text-xs text-[#848E9C]">Today, 10:30 AM</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#EAECEF]">1,000 USDT</div>
                    <Badge className="bg-green-500/15 text-green-400 border-green-500/20 text-[10px]">
                      <CheckCircle className="w-2 h-2 mr-1" />
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}