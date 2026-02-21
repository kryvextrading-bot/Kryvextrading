// Transactions.tsx - Comprehensive Transaction History Table
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUpRight, ArrowDownLeft, RefreshCw, TrendingUp, Clock,
  Eye, EyeOff, Search, Filter, Download, Calendar,
  Plus, X, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  ArrowLeftRight as ArrowUpRightIcon, ArrowDownLeft as ArrowDownLeftIcon
} from 'lucide-react';
import { 
  FaFacebook, FaTelegram, FaXTwitter, FaInstagram, FaWhatsapp,
  FaLink, FaCopy, FaFileExport, FaFilter, FaCalendarAlt
} from 'react-icons/fa6';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { walletApiService } from '@/services/wallet-api';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Trade' | 'Referral Bonus' | 'Reward' | 'Fee' | 'Transfer';
  asset: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
  date: string;
  fromUser?: string;
  toUser?: string;
  description?: string;
  txHash?: string;
  confirmations?: number;
  network?: string;
  fee?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  metadata?: any;
}

interface TransactionStats {
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalTrades: number;
  totalVolume: number;
  averageTradeSize: number;
  successRate: number;
  totalFees: number;
  totalReferralEarnings: number;
}

export default function Transactions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdrawal' | 'trade' | 'referral' | 'failed'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Load transactions
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      if (user?.id) {
        const walletTransactions = await walletApiService.getUserTransactions(user.id);
        const formattedTransactions: Transaction[] = walletTransactions.map(tx => ({
          id: tx.id,
          type: tx.type === 'deposit' ? 'Deposit' : 
                tx.type === 'withdrawal' ? 'Withdrawal' : 
                tx.type === 'transfer' ? 'Trade' : 
                tx.type === 'fee' ? 'Fee' : 'Transfer',
          asset: tx.currency || 'USDT',
          amount: tx.amount || 0,
          status: tx.status === 'completed' ? 'Completed' : 
                 tx.status === 'pending' ? 'Pending' : 
                 tx.status === 'failed' ? 'Failed' : 'Processing',
          date: tx.created_at || new Date().toISOString(),
          description: tx.description,
          txHash: tx.tx_hash,
          network: tx.network,
          fee: tx.fee,
          balanceBefore: tx.balance_before,
          balanceAfter: tx.balance_after,
          metadata: tx.metadata
        }));
        
        // Sort by date (newest first)
        formattedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(formattedTransactions);
      }
      
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'deposit') return tx.type === 'Deposit' && matchesSearch;
    if (filterType === 'withdrawal') return tx.type === 'Withdrawal' && matchesSearch;
    if (filterType === 'trade') return tx.type === 'Trade' && matchesSearch;
    if (filterType === 'referral') return (tx.type === 'Referral Bonus' || tx.type === 'Reward') && matchesSearch;
    if (filterType === 'failed') return tx.status === 'Failed' && matchesSearch;
    
    return false;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return Math.abs(b.amount) - Math.abs(a.amount);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const dateFilteredTransactions = sortedTransactions.filter(tx => {
    if (dateRange === 'all') return true;
    
    const now = new Date();
    const daysAgo = new Date();
    
    switch (dateRange) {
      case '7d':
        daysAgo.setDate(now.getDate() - 7);
        break;
      case '30d':
        daysAgo.setDate(now.getDate() - 30);
        break;
      case '90d':
        daysAgo.setDate(now.getDate() - 90);
        break;
      case '1y':
        daysAgo.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return new Date(tx.date) >= daysAgo;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'Deposit': return <ArrowDownLeft className="text-green-500" />;
      case 'Withdrawal': return <ArrowUpRight className="text-red-500" />;
      case 'Trade': return <TrendingUp className="text-blue-500" />;
      case 'Referral Bonus':
      case 'Reward': return <FaGift className="text-yellow-500" />;
      case 'Fee': return <X className="text-gray-500" />;
      case 'Transfer': return <RefreshCw className="text-purple-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Failed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Deposit': return 'bg-green-100 text-green-700';
      case 'Withdrawal': return 'bg-red-100 text-red-700';
      case 'Trade': return 'bg-blue-100 text-blue-700';
      case 'Referral Bonus':
      case 'Reward': return 'bg-yellow-100 text-yellow-700';
      case 'Fee': return 'bg-gray-100 text-gray-700';
      case 'Transfer': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateStats = (): TransactionStats => {
    const totalTransactions = transactions.length;
    const totalDeposits = transactions.filter(t => t.type === 'Deposit').length;
    const totalWithdrawals = transactions.filter(t => t.type === 'Withdrawal').length;
    const totalTrades = transactions.filter(t => t.type === 'Trade').length;
    const totalVolume = transactions
      .filter(t => t.type === 'Trade')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const completedTrades = transactions.filter(t => t.type === 'Trade' && t.status === 'Completed');
    const successRate = totalTrades > 0 ? (completedTrades.length / totalTrades) * 100 : 0;
    const totalFees = transactions
      .filter(t => t.fee && t.fee > 0)
      .reduce((sum, t) => sum + t.fee, 0);
    const totalReferralEarnings = transactions
      .filter(t => (t.type === 'Referral Bonus' || t.type === 'Reward') && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const averageTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

    return {
      totalTransactions,
      totalDeposits,
      totalWithdrawals,
      totalTrades,
      totalVolume,
      averageTradeSize,
      successRate,
      totalFees,
      totalReferralEarnings
    };
  };

  const stats = calculateStats();

  const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
    const isPositive = transaction.type === 'Deposit' || transaction.type === 'Referral Bonus' || transaction.type === 'Reward';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 border-b border-gray-200"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isPositive ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {getTransactionIcon(transaction.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold text-gray-900 ${getTypeColor(transaction.type)}`}>
                {transaction.type}
              </span>
              <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                {transaction.status}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">{transaction.asset}</div>
            {transaction.fromUser && (
              <div className="text-xs text-gray-500">
                From: {transaction.fromUser}
              </div>
            )}
            {transaction.toUser && (
              <div className="text-xs text-gray-500">
                To: {transaction.toUser}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`font-bold text-lg ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? '+' : '-'}{Math.abs(transaction.amount).toFixed(6)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(transaction.date).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTransaction(transaction)}
            className="text-gray-600 hover:text-blue-600"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Copy transaction details */}}
            className="text-gray-600 hover:text-gray-800"
          >
            <FaCopy className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowUpRight className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* Export transactions */}}
                className="text-gray-600 hover:text-gray-800"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white border-gray-200 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                  <div className="text-sm text-gray-600">All time</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.totalTransactions}</div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">${stats.totalDeposits}</div>
                    <div className="text-sm text-gray-600">Total Deposits</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">${stats.totalWithdrawals}</div>
                    <div className="text-sm text-gray-600">Total Withdrawals</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{stats.totalTrades}</div>
                    <div className="text-sm text-gray-600">Total Trades</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white border-gray-200 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                  <div className="text-sm text-gray-600">Last 30 days</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900">${stats.totalVolume.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Volume</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.successRate.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{stats.averageTradeSize.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Avg Trade Size</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white border-gray-200 shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
                  <div className="text-sm text-gray-600">All time</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">${stats.totalFees.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Fees</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">${stats.totalReferralEarnings.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Referral Earnings</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <div className="mb-8">
          <Card className="bg-white border-gray-200 shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 bg-gray-50 border-gray-300 px-4 py-2 text-gray-900"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <FaFilter className="w-4 h-4 mr-2" />
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Filter by Type</Label>
                          <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="bg-gray-50 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="deposit">Deposits Only</SelectItem>
                              <SelectItem value="withdrawal">Withdrawals Only</SelectItem>
                              <SelectItem value="trade">Trades Only</SelectItem>
                              <SelectItem value="referral">Referrals Only</SelectItem>
                              <SelectItem value="failed">Failed Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mt-4">Sort By</Label>
                          <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="bg-gray-50 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                              <SelectItem value="type">Type</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mt-4">Date Range</Label>
                          <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="bg-gray-50 border-gray-300">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="7d">Last 7 Days</SelectItem>
                              <SelectItem value="30d">Last 30 Days</SelectItem>
                              <SelectItem value="90d">Last 90 Days</SelectItem>
                              <SelectItem value="1y">Last Year</SelectItem>
                              <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Transactions List */}
          <div className="space-y-2">
            {loading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-4 mb-2" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-4 w-12 mb-2" />
                  </div>
                ))}
              </>
            ) : dateFilteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-gray-500 text-lg mb-2">No transactions found</div>
                <div className="text-gray-400">Try adjusting your filters</div>
              </div>
            ) : (
              dateFilteredTransactions.slice(0, 20).map((transaction, index) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            )}
            )}
          </div>

          {dateFilteredTransactions.length > 20 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => {/* Load more */}}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Load More Transactions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </Card>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setSelectedTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Transaction ID</span>
                  <span className="font-mono text-gray-900">{selectedTransaction.id}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Type</span>
                  <Badge className={`${getTypeColor(selectedTransaction.type)} text-white`}>
                    {selectedTransaction.type}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <Badge className={`${getStatusColor(selectedTransaction.status)} text-white`}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-gray-900">
                    {new Date(selectedTransaction.date).toLocaleString()}
                  </span>
                </div>
              </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Asset</span>
                  <span className="text-gray-900">{selectedTransaction.asset}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Amount</span>
                  <span className={`font-bold text-lg ${
                    selectedTransaction.type === 'Deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTransaction.type === 'Deposit' ? '+' : '-'}{Math.abs(selectedTransaction.amount).toFixed(6)}
                  </span>
                </div>
              </div>
                
                {selectedTransaction.fee && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Fee</span>
                    <span className="text-gray-900">${selectedTransaction.fee.toFixed(6)}</span>
                  </div>
                </div>
                
                {selectedTransaction.balanceBefore !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Balance Before</span>
                    <span className="text-gray-900">${selectedTransaction.balanceBefore.toFixed(6)}</span>
                  </div>
                </div>
                
                {selectedTransaction.balanceAfter !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Balance After</span>
                    <span className="text-gray-900">${selectedTransaction.balanceAfter.toFixed(6)}</span>
                  </div>
                </div>
                
                {selectedTransaction.txHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Transaction Hash</span>
                    <span className="font-mono text-xs text-gray-900 break-all">
                      {selectedTransaction.txHash}
                    </span>
                  </div>
                </div>
                
                {selectedTransaction.network && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Network</span>
                    <span className="text-gray-900">{selectedTransaction.network}</span>
                  </div>
                </div>
                
                {selectedTransaction.fromUser && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">From</span>
                    <span className="text-gray-900">{selectedTransaction.fromUser}</span>
                  </div>
                </div>
                
                {selectedTransaction.toUser && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">To</span>
                    <span className="text-gray-900">{selectedTransaction.toUser}</span>
                  </div>
                </div>
                
                {selectedTransaction.confirmations !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Confirmations</span>
                    <span className="text-gray-900">{selectedTransaction.confirmations}</span>
                  </div>
                </div>
                
                {selectedTransaction.description && (
                  <div className="mt-6">
                    <span className="text-sm text-gray-500">Description</span>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
