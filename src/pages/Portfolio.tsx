import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3, 
  Clock, 
  RefreshCw,
  ChevronRight,
  Wallet,
  Shield,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Activity,
  Award,
  Target,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';
import PortfolioValueChart from '@/components/PortfolioValueChart';
import AssetAllocationPieChart from '@/components/AssetAllocationPieChart';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useMarketData } from '@/contexts/MarketDataContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

// Performance Metric Card Component
function MetricCard({ title, value, change, icon, subValue, isPositive }: any) {
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
            {icon}
          </div>
          <span className="text-xs text-[#848E9C]">{title}</span>
        </div>
        {change !== undefined && (
          <Badge className={`${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-0`}>
            {isPositive ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
            {change}%
          </Badge>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xl font-bold text-[#EAECEF] font-mono">{value}</div>
        {subValue && <div className="text-xs text-[#848E9C]">{subValue}</div>}
      </div>
    </Card>
  );
}

// Asset Allocation Item Component
function AllocationItem({ asset, index }: { asset: any; index: number }) {
  const colors = ['#F0B90B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899'];
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#2B3139] last:border-0">
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ backgroundColor: `${colors[index % colors.length]}20`, color: colors[index % colors.length] }}
        >
          {asset.symbol.charAt(0)}
        </div>
        <div>
          <div className="text-sm font-medium text-[#EAECEF]">{asset.name}</div>
          <div className="text-xs text-[#848E9C]">{asset.symbol}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-[#EAECEF]">{asset.percentage.toFixed(1)}%</div>
        <div className="text-xs text-[#848E9C]">${asset.value.toFixed(2)}</div>
      </div>
    </div>
  );
}

// Holdings Table Component
function HoldingsTable({ portfolio, hideBalances }: { portfolio: any[]; hideBalances: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[#848E9C] border-b border-[#2B3139]">
            <th className="text-left py-3 font-medium">Asset</th>
            <th className="text-right py-3 font-medium">Balance</th>
            <th className="text-right py-3 font-medium">Price</th>
            <th className="text-right py-3 font-medium">Value</th>
            <th className="text-right py-3 font-medium">Allocation</th>
            <th className="text-right py-3 font-medium">24h Change</th>
          </tr>
        </thead>
        <tbody>
          {portfolio.map((asset) => (
            <tr key={asset.symbol} className="border-b border-[#2B3139] hover:bg-[#23262F] transition-colors">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center text-sm">
                    {asset.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-[#EAECEF]">{asset.symbol}</div>
                    <div className="text-xs text-[#848E9C]">{asset.name}</div>
                  </div>
                </div>
              </td>
              <td className="text-right font-mono text-[#EAECEF]">
                {hideBalances ? '••••••' : asset.balance.toFixed(6)}
              </td>
              <td className="text-right font-mono text-[#EAECEF]">
                ${asset.price?.toFixed(2) || '0.00'}
              </td>
              <td className="text-right font-mono text-[#EAECEF]">
                ${asset.value.toFixed(2)}
              </td>
              <td className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 bg-[#2B3139] rounded-full h-1.5">
                    <div 
                      className="bg-[#F0B90B] h-1.5 rounded-full" 
                      style={{ width: `${asset.percentage}%` }}
                    />
                  </div>
                  <span className="text-[#EAECEF] text-xs">{asset.percentage.toFixed(1)}%</span>
                </div>
              </td>
              <td className="text-right">
                <Badge className={asset.change > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                  {asset.change > 0 ? '+' : ''}{asset.change || 0}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Portfolio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { portfolio, totalValue, valueHistory, transactions } = useWallet();
  const { currency, setCurrency } = useUserSettings();
  const { prices } = useMarketData();
  
  // UI State
  const [hideBalances, setHideBalances] = useState(false);
  const [timeframe, setTimeframe] = useState('1M');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Calculate portfolio metrics
  const totalPortfolioValue = portfolio.reduce((sum, asset) => sum + asset.value, 0);
  
  // Asset allocation with percentages
  const assetAllocation = portfolio.map(asset => ({
    ...asset,
    percentage: totalPortfolioValue > 0 ? (asset.value / totalPortfolioValue) * 100 : 0,
    price: prices?.[asset.symbol] || 0,
    change: ((prices?.[asset.symbol] || 0) - (asset.buyPrice || 0)) / (asset.buyPrice || 1) * 100
  })).sort((a, b) => b.value - a.value);

  // Performance metrics
  const periodReturns = {
    '1D': { value: 234.56, percentage: 1.23 },
    '1W': { value: 1234.56, percentage: 5.67 },
    '1M': { value: 3456.78, percentage: 12.34 },
    '1Y': { value: 12345.67, percentage: 45.67 }
  };

  // Calculate daily change
  const yesterdayValue = valueHistory.length > 1 ? valueHistory[valueHistory.length - 2].value : totalValue;
  const dailyChange = totalValue - yesterdayValue;
  const dailyChangePercent = ((dailyChange / yesterdayValue) * 100) || 0;
  const isPositiveChange = dailyChange >= 0;

  // Portfolio diversification score (simplified calculation)
  const diversificationScore = Math.min(100, portfolio.length * 10);
  
  // Risk level based on portfolio composition
  const riskLevel = portfolio.some(a => a.symbol === 'BTC' || a.symbol === 'ETH') ? 'Moderate' : 'Conservative';

  // Top performer
  const topPerformer = assetAllocation.length > 0 
    ? assetAllocation.reduce((prev, current) => (prev.change > current.change ? prev : current))
    : null;

  // Navigation protection
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Calculate balance in selected currency
  let displayBalance = totalValue;
  if (currency === 'BTC' && prices?.['BTC']) {
    displayBalance = totalValue / prices['BTC'];
  } else if (currency === 'USDT') {
    displayBalance = totalValue;
  }

  if (!user) return null;

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="portfolio-page min-h-screen bg-[#181A20] pb-24"
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-[#181A20]" />
            </div>
            <h1 className="text-lg font-bold text-[#EAECEF]">Investment Portfolio</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
              aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
            >
              {hideBalances ? <EyeOff size={20} className="text-[#848E9C]" /> : <Eye size={20} className="text-[#848E9C]" />}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              <RefreshCw size={20} className="text-[#848E9C]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-4 space-y-5">
        
        {/* Portfolio Value Overview */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet size={18} className="text-[#F0B90B]" />
                <span className="text-sm text-[#848E9C]">Total Invested Capital</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="bg-[#181A20] text-[#F0B90B] text-xs font-semibold px-2 py-1.5 rounded-lg border border-[#2B3139] outline-none"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-2 font-mono">
                  {hideBalances ? '••••••' : (
                    currency === 'BTC' 
                      ? `${displayBalance.toFixed(6)} BTC` 
                      : `$${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#848E9C]">
                    ≈ ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                  </span>
                  <Badge className={`${isPositiveChange ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} border-0`}>
                    {isPositiveChange ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                    {dailyChangePercent.toFixed(2)}% (24h)
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] h-10 px-4"
                  onClick={() => navigate('/analytics')}
                >
                  <BarChart3 size={16} className="mr-2" />
                  Analytics
                </Button>
                <Button 
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-10 px-4"
                  onClick={() => navigate('/wallet/deposit')}
                >
                  Deposit
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Key Performance Metrics */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          variants={fadeInUp}
        >
          <MetricCard
            title="Total Return"
            value={hideBalances ? '••••••' : `+$${periodReturns['1Y'].value.toLocaleString()}`}
            change={periodReturns['1Y'].percentage}
            isPositive={true}
            icon={<TrendingUp size={16} className="text-[#F0B90B]" />}
            subValue="Since inception"
          />
          
          <MetricCard
            title="Assets Under Management"
            value={portfolio.length.toString()}
            icon={<PieChart size={16} className="text-[#F0B90B]" />}
            subValue={`${portfolio.filter(a => a.value > 0).length} active positions`}
          />
          
          <MetricCard
            title="Diversification Score"
            value={`${diversificationScore}`}
            icon={<Target size={16} className="text-[#F0B90B]" />}
            subValue={`${portfolio.length} of 12 asset classes`}
          />
          
          <MetricCard
            title="Risk Profile"
            value={riskLevel}
            icon={<Shield size={16} className="text-[#F0B90B]" />}
            subValue="Moderate-Low volatility"
          />
        </motion.div>

        {/* Portfolio Analytics Tabs */}
        <motion.div variants={fadeInUp}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#EAECEF]">Portfolio Analysis</h2>
              <TabsList className="bg-[#1E2329] p-1 rounded-lg">
                <TabsTrigger 
                  value="overview" 
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded"
                >
                  Performance
                </TabsTrigger>
                <TabsTrigger 
                  value="allocation" 
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded"
                >
                  Allocation
                </TabsTrigger>
                <TabsTrigger 
                  value="holdings" 
                  className="text-xs px-3 py-1.5 data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded"
                >
                  Holdings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Performance Tab */}
            <TabsContent value="overview" className="mt-0">
              <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-[#848E9C]">Historical Performance</span>
                  <div className="flex gap-2">
                    {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
                      <button
                        key={tf}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          timeframe === tf 
                            ? 'bg-[#F0B90B] text-[#181A20] font-medium' 
                            : 'text-[#848E9C] hover:text-[#EAECEF]'
                        }`}
                        onClick={() => setTimeframe(tf)}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
                <PortfolioValueChart valueHistory={valueHistory} timeframe={timeframe} />
                
                {/* Period Returns Table */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#2B3139]">
                  {Object.entries(periodReturns).map(([period, data]) => (
                    <div key={period} className="text-center">
                      <div className="text-xs text-[#848E9C] mb-1">{period}</div>
                      <div className="text-sm font-bold text-[#EAECEF]">+${data.value.toLocaleString()}</div>
                      <div className="text-xs text-green-400">+{data.percentage}%</div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Allocation Tab */}
            <TabsContent value="allocation" className="mt-0">
              <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                {portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-[#848E9C] text-sm mb-2">No assets in portfolio</div>
                    <Button 
                      className="bg-[#F0B90B] text-[#181A20] font-bold text-xs h-8"
                      onClick={() => navigate('/wallet')}
                    >
                      Start Investing
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <PieChart size={16} className="text-[#F0B90B]" />
                        <span className="text-xs text-[#848E9C]">Asset Distribution</span>
                      </div>
                      <AssetAllocationPieChart portfolio={portfolio} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Award size={16} className="text-[#F0B90B]" />
                        <span className="text-xs text-[#848E9C]">Top Holdings</span>
                      </div>
                      <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {assetAllocation.slice(0, 8).map((asset, index) => (
                          <AllocationItem key={asset.symbol} asset={asset} index={index} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Holdings Tab */}
            <TabsContent value="holdings" className="mt-0">
              <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
                {portfolio.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-3">📋</div>
                    <div className="text-[#848E9C] text-sm">No holdings to display</div>
                  </div>
                ) : (
                  <HoldingsTable portfolio={assetAllocation} hideBalances={hideBalances} />
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Recent Transactions - Professional Format */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#F0B90B]" />
                <span className="text-sm font-medium text-[#EAECEF]">Recent Transactions</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[#F0B90B] text-xs"
                onClick={() => navigate('/wallet/transactions')}
              >
                View All
                <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-[#848E9C] text-sm">No transaction history</div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto custom-scrollbar pr-2">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-[#2B3139] last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.type === 'Deposit' ? 'bg-green-500/20' : 
                        tx.type === 'Withdrawal' ? 'bg-red-500/20' : 'bg-[#F0B90B]/20'
                      }`}>
                        {tx.type === 'Deposit' ? <ArrowDownLeft size={14} className="text-green-400" /> : 
                         tx.type === 'Withdrawal' ? <ArrowUpRight size={14} className="text-red-400" /> : 
                         <RefreshCw size={14} className="text-[#F0B90B]" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#EAECEF]">{tx.type}</div>
                        <div className="text-xs text-[#848E9C]">{new Date(tx.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        tx.type === 'Deposit' ? 'text-green-400' : 
                        tx.type === 'Withdrawal' ? 'text-red-400' : 'text-[#F0B90B]'
                      }`}>
                        {tx.type === 'Deposit' ? '+' : '-'}{tx.amount.toFixed(6)} {tx.asset}
                      </div>
                      <div className="text-xs text-[#848E9C]">
                        ${(tx.amount * (prices?.[tx.asset] || 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Portfolio Summary & Recommendations */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center shrink-0">
                <Target size={16} className="text-[#F0B90B]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#EAECEF] mb-1">Portfolio Summary</h3>
                <p className="text-xs text-[#848E9C] mb-3 leading-relaxed">
                  Your portfolio is well-diversified across {portfolio.length} assets. 
                  {topPerformer && ` ${topPerformer.symbol} is your top performer with ${topPerformer.change?.toFixed(1)}% return.`}
                  {diversificationScore < 50 && ' Consider adding more assets to improve diversification.'}
                  {diversificationScore >= 70 && ' Excellent diversification across multiple asset classes.'}
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-0">
                    Sharpe Ratio: 1.24
                  </Badge>
                  <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-0">
                    Volatility: 12.3%
                  </Badge>
                  <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-0">
                    Beta: 0.89
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Risk Disclosure */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#1E2329] border border-[#2B3139] p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-[#848E9C] shrink-0 mt-0.5" />
              <p className="text-[10px] text-[#5E6673] leading-relaxed">
                Past performance does not guarantee future results. Investment values may fluctuate. 
                All figures are estimated and subject to market conditions. Last updated: {new Date().toLocaleString()}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      </motion.div>
  );
}