// pages/PresalePage.tsx - Presale Token Trading Interface

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  TrendingUp, 
  Clock, 
  Zap, 
  Shield, 
  Info,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PresaleToken {
  id: string;
  name: string;
  symbol: string;
  description: string;
  price: number;
  totalSupply: number;
  sold: number;
  raised: number;
  goal: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'ended';
  minPurchase: number;
  maxPurchase: number;
  features: string[];
  contractAddress: string;
  website?: string;
  twitter?: string;
  telegram?: string;
}

const PresalePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedToken, setSelectedToken] = useState<PresaleToken | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'details'>('buy');
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Mock presale data
  const presaleTokens: PresaleToken[] = [
    {
      id: '1',
      name: 'Kryvex Token',
      symbol: 'KRX',
      description: 'Next-generation decentralized trading platform token with advanced AI-powered arbitrage capabilities.',
      price: 0.05,
      totalSupply: 100000000,
      sold: 45678234,
      raised: 2283911.70,
      goal: 5000000,
      startDate: '2024-02-01T00:00:00Z',
      endDate: '2024-03-01T00:00:00Z',
      status: 'active',
      minPurchase: 100,
      maxPurchase: 10000,
      features: ['AI Arbitrage', 'Liquidity Mining', 'Staking Rewards', 'Governance'],
      contractAddress: '0x1234567890123456789012345678901234567890',
      website: 'https://kryvex.com',
      twitter: 'https://twitter.com/kryvex',
      telegram: 'https://t.me/kryvex'
    },
    {
      id: '2',
      name: 'MetaVerse Coin',
      symbol: 'MVC',
      description: 'Virtual reality metaverse platform token for immersive digital experiences.',
      price: 0.025,
      totalSupply: 50000000,
      sold: 12345678,
      raised: 308641.95,
      goal: 1250000,
      startDate: '2024-02-15T00:00:00Z',
      endDate: '2024-03-15T00:00:00Z',
      status: 'upcoming',
      minPurchase: 50,
      maxPurchase: 5000,
      features: ['VR Worlds', 'NFT Marketplace', 'Social Gaming', 'Virtual Economy'],
      contractAddress: '0x9876543210987654321098765432109876543210'
    }
  ];

  const activeTokens = presaleTokens.filter(token => token.status === 'active');
  const upcomingTokens = presaleTokens.filter(token => token.status === 'upcoming');

  const handlePurchase = async () => {
    if (!selectedToken || !purchaseAmount) {
      toast({
        title: "Error",
        description: "Please select a token and enter purchase amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(purchaseAmount);
    
    if (amount < selectedToken.minPurchase) {
      toast({
        title: "Insufficient Amount",
        description: `Minimum purchase is ${selectedToken.minPurchase} USDT`,
        variant: "destructive"
      });
      return;
    }

    if (amount > selectedToken.maxPurchase) {
      toast({
        title: "Exceeds Maximum",
        description: `Maximum purchase is ${selectedToken.maxPurchase} USDT`,
        variant: "destructive"
      });
      return;
    }

    setIsPurchasing(true);
    
    try {
      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${amount} USDT worth of ${selectedToken.symbol} tokens`,
      });
      
      setPurchaseAmount('');
      setSelectedToken(null);
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Transaction failed. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getProgressPercentage = (token: PresaleToken) => {
    return (token.raised / token.goal) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E0F14] to-[#181A20]">
      {/* Header */}
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
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-[#848E9C] hover:text-[#EAECEF] transition-colors p-2 -ml-2 rounded-xl hover:bg-[#23262F]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center shadow-lg shadow-[#F0B90B]/20">
                  <Zap className="w-5 h-5 text-[#181A20]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#EAECEF]">Presale</h1>
                  <p className="text-xs text-[#848E9C]">Early token opportunities</p>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-3 bg-[#23262F] px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-sm text-[#848E9C]">Total Raised:</span>
                <span className="text-sm font-semibold text-[#EAECEF]">
                  ${presaleTokens.reduce((sum, token) => sum + token.raised, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Active Presales */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#EAECEF]">Active Presales</h2>
            <Badge className="bg-green-400/10 text-green-400 border-green-400/20">
              {activeTokens.length} Active
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTokens.map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={cn(
                  "bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] rounded-2xl p-6 cursor-pointer transition-all",
                  selectedToken?.id === token.id ? "ring-2 ring-[#F0B90B]/50" : "hover:border-[#F0B90B]/30"
                )}
                onClick={() => setSelectedToken(token)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-[#181A20]">{token.symbol}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#EAECEF]">{token.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-400/10 text-green-400 border-green-400/20 text-xs">
                          Active
                        </Badge>
                        <span className="text-xs text-[#848E9C]">
                          {formatTimeRemaining(token.endDate)} remaining
                        </span>
                      </div>
                    </div>
                  </div>
                  <Star className="w-5 h-5 text-yellow-400" />
                </div>

                {/* Description */}
                <p className="text-sm text-[#848E9C] mb-4 line-clamp-2">
                  {token.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#23262F] rounded-xl p-3">
                    <div className="text-xs text-[#848E9C] mb-1">Price</div>
                    <div className="text-lg font-bold text-[#EAECEF]">${token.price}</div>
                  </div>
                  <div className="bg-[#23262F] rounded-xl p-3">
                    <div className="text-xs text-[#848E9C] mb-1">Progress</div>
                    <div className="text-lg font-bold text-[#F0B90B]">
                      {getProgressPercentage(token).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#848E9C] mb-2">
                    <span>${token.raised.toLocaleString()} raised</span>
                    <span>${token.goal.toLocaleString()} goal</span>
                  </div>
                  <div className="w-full bg-[#23262F] rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage(token)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {token.features.map((feature, idx) => (
                    <Badge key={idx} className="bg-[#2B3139] text-[#848E9C] text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* Action Button */}
                <Button
                  onClick={() => setSelectedToken(token)}
                  className="w-full bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-semibold"
                >
                  Select for Purchase
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Presales */}
        {upcomingTokens.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#EAECEF]">Upcoming Presales</h2>
              <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20">
                {upcomingTokens.length} Upcoming
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingTokens.map((token, index) => (
                <motion.div
                  key={token.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-gradient-to-br from-[#1E2329] to-[#1A1F26] border border-[#2B3139] rounded-2xl p-6 opacity-75"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{token.symbol}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#EAECEF]">{token.name}</h3>
                      <Badge className="bg-blue-400/10 text-blue-400 border-blue-400/20 text-xs mt-1">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-[#848E9C] mb-4">
                    {token.description}
                  </p>
                  <div className="text-center text-sm text-[#848E9C]">
                    Starts: {new Date(token.startDate).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Purchase Modal */}
      <AnimatePresence>
        {selectedToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedToken(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-gradient-to-b from-[#1E2329] to-[#181A20] rounded-t-2xl md:rounded-2xl shadow-2xl border border-[#2B3139] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#2B3139] bg-[#1E2329]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#F0B90B]/80 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-[#181A20]">{selectedToken.symbol}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#EAECEF]">Purchase {selectedToken.name}</h3>
                    <p className="text-xs text-[#848E9C]">${selectedToken.price} per token</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-[#2B3139] rounded-xl transition-colors"
                  onClick={() => setSelectedToken(null)}
                >
                  <ChevronRight className="w-5 h-5 text-[#848E9C] rotate-45" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-5">
                {/* Token Info */}
                <div className="bg-[#23262F] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#848E9C]">Available Supply</span>
                    <span className="text-[#EAECEF] font-medium">
                      {(selectedToken.totalSupply - selectedToken.sold).toLocaleString()} {selectedToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#848E9C]">Min Purchase</span>
                    <span className="text-[#EAECEF] font-medium">${selectedToken.minPurchase}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#848E9C]">Max Purchase</span>
                    <span className="text-[#EAECEF] font-medium">${selectedToken.maxPurchase}</span>
                  </div>
                </div>

                {/* Purchase Form */}
                <div>
                  <Label className="text-sm text-[#848E9C] mb-2 block">Purchase Amount (USDT)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="bg-[#23262F] border-[#2B3139] text-[#EAECEF] h-12 text-lg rounded-xl pr-20 focus:border-[#F0B90B]"
                      min={selectedToken.minPurchase}
                      max={selectedToken.maxPurchase}
                      step="0.01"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => setPurchaseAmount(selectedToken.maxPurchase.toString())}
                        className="px-3 py-1.5 text-xs font-medium text-[#F0B90B] hover:text-yellow-400 transition-colors"
                      >
                        MAX
                      </button>
                      <span className="text-[#2B3139]">|</span>
                      <span className="px-2 text-sm font-medium text-[#EAECEF]">USDT</span>
                    </div>
                  </div>
                  {purchaseAmount && (
                    <div className="mt-2 text-sm text-[#848E9C]">
                      You will receive: {(parseFloat(purchaseAmount) / selectedToken.price).toFixed(2)} {selectedToken.symbol}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedToken(null)}
                    className="flex-1 border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#23262F] h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={!purchaseAmount || parseFloat(purchaseAmount) < selectedToken.minPurchase || isPurchasing}
                    className="flex-1 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/80 hover:from-[#F0B90B] hover:to-[#F0B90B] text-[#181A20] font-semibold h-12 rounded-xl shadow-lg shadow-[#F0B90B]/20 disabled:opacity-50"
                  >
                    {isPurchasing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#181A20] border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      'Purchase Tokens'
                    )}
                  </Button>
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-2 bg-[#23262F] rounded-xl p-3">
                  <Shield className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#848E9C]">
                    <p className="mb-1">Secure purchase • Smart contract verified</p>
                    <p>Contract: {selectedToken.contractAddress.slice(0, 10)}...{selectedToken.contractAddress.slice(-8)}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PresalePage;
