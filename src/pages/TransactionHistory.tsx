import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'swap' | 'trade' | 'staking' | 'options';
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  currency: string;
  fromCurrency?: string;
  toCurrency?: string;
  description: string;
  date: string;
  txHash?: string;
  fee?: number;
}

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Sample transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      status: 'completed',
      amount: 1000,
      currency: 'USDT',
      description: 'Bank deposit',
      date: '2024-01-15T10:30:00Z',
      txHash: '0x1234...5678',
      fee: 2.5
    },
    {
      id: '2',
      type: 'trade',
      status: 'completed',
      amount: 0.05,
      currency: 'BTC',
      description: 'BTC/USDT trade',
      date: '2024-01-14T15:45:00Z',
      fee: 0.0001
    },
    {
      id: '3',
      type: 'withdrawal',
      status: 'pending',
      amount: 500,
      currency: 'USDT',
      description: 'Bank withdrawal',
      date: '2024-01-13T09:20:00Z',
      fee: 5
    },
    {
      id: '4',
      type: 'swap',
      status: 'completed',
      amount: 100,
      currency: 'ETH',
      fromCurrency: 'USDT',
      toCurrency: 'ETH',
      description: 'USDT to ETH swap',
      date: '2024-01-12T14:15:00Z',
      fee: 0.5
    },
    {
      id: '5',
      type: 'staking',
      status: 'completed',
      amount: 1000,
      currency: 'USDT',
      description: 'Staking reward',
      date: '2024-01-10T12:00:00Z'
    },
    {
      id: '6',
      type: 'options',
      status: 'failed',
      amount: 100,
      currency: 'USDT',
      description: 'Options trade - BTC Call',
      date: '2024-01-08T16:30:00Z',
      fee: 2
    }
  ]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || transaction.type === filterType;
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, searchTerm, filterType, filterStatus]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'swap':
        return <ArrowRightLeft className="w-4 h-4" />;
      case 'trade':
        return <TrendingUp className="w-4 h-4" />;
      case 'staking':
        return <CheckCircle className="w-4 h-4" />;
      case 'options':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'withdrawal':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'swap':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'trade':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'staking':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'options':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your transaction history is being exported to CSV.",
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="text-[#848E9C] hover:text-[#EAECEF] mb-4"
            onClick={() => navigate('/wallet')}
          >
            ← Back to Wallet
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F0B90B] rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#181A20]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EAECEF]">Transaction History</h1>
                <p className="text-[#848E9C]">View and manage all your transaction records</p>
              </div>
            </div>
            <Button 
              onClick={handleExport}
              variant="outline"
              className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-[#181A20] border-[#2B3139] p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#848E9C]" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="trade">Trades</SelectItem>
                <SelectItem value="swap">Swaps</SelectItem>
                <SelectItem value="staking">Staking</SelectItem>
                <SelectItem value="options">Options</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="bg-[#181A20] border-[#2B3139] p-6 hover:bg-[#1E2329] transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${getTransactionColor(transaction.type)}`}>
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#EAECEF] capitalize">{transaction.type}</h3>
                      <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-[#848E9C]">{transaction.description}</p>
                    {transaction.txHash && (
                      <p className="text-xs text-[#5E6673] mt-1">
                        Tx: {transaction.txHash}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-[#EAECEF]">
                    {transaction.type === 'deposit' || transaction.type === 'staking' ? '+' : '-'}
                    {transaction.amount} {transaction.currency}
                  </div>
                  {transaction.fee && (
                    <p className="text-xs text-[#848E9C]">
                      Fee: {transaction.fee} {transaction.currency}
                    </p>
                  )}
                  <p className="text-xs text-[#5E6673] mt-1">
                    {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <Card className="bg-[#181A20] border-[#2B3139] p-12 text-center">
            <Calendar className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#EAECEF] mb-2">No Transactions Found</h3>
            <p className="text-[#848E9C]">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? "No transactions match your current filters."
                : "You haven't made any transactions yet."}
            </p>
          </Card>
        )}

        {/* Summary Stats */}
        <Card className="bg-[#181A20] border-[#2B3139] p-6 mt-6">
          <h3 className="text-lg font-semibold text-[#EAECEF] mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[#848E9C]">Total Transactions</p>
              <p className="text-xl font-bold text-[#EAECEF]">{filteredTransactions.length}</p>
            </div>
            <div>
              <p className="text-sm text-[#848E9C]">Completed</p>
              <p className="text-xl font-bold text-green-400">
                {filteredTransactions.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#848E9C]">Pending</p>
              <p className="text-xl font-bold text-yellow-400">
                {filteredTransactions.filter(t => t.status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-[#848E9C]">Failed</p>
              <p className="text-xl font-bold text-red-400">
                {filteredTransactions.filter(t => t.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
