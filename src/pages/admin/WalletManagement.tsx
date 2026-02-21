import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { adminApiService } from '@/services/admin-api';
import { walletApiService } from '@/services/wallet-api-new';
import { depositService } from '@/services/depositService';
import BalanceSyncService from '@/services/balance-sync';
import DepositSlip from '@/components/DepositSlip';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { cn } from '@/lib/utils';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  Download,
  Settings,
  Shield,
  AlertCircle,
  Plus,
  Minus,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Link,
  ExternalLink,
  QrCode,
  Scan,
  Zap,
  Activity,
  PieChart,
  BarChart3,
  LineChart,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Fingerprint,
  Key,
  ShieldAlert,
  Bell,
  Home,
  Briefcase,
  CreditCard,
  Send,
  Upload,
  Trash2,
  Edit,
  Save,
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  TrendingDown,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Mountain,
  Apple,
  Carrot,
  Fish,
  Cat,
  Dog,
  Turtle,
  Horse,
  Pig,
  Chicken,
  Duck,
  Penguin,
  Whale,
  Shark,
  Starfish,
  Sand,
  Rock,
} from 'lucide-react';

// ==================== TYPES ====================
interface WalletRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';
  method: string;
  address: string;
  transactionHash?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  processedAt?: string;
  fee?: number;
  notes?: string;
  riskScore: number;
  kycVerified: boolean;
  metadata?: Record<string, any>;
}

interface WalletStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalVolume: number;
  avgProcessingTime: number;
  successRate: number;
  totalFees: number;
  activeWallets: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'fee';
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  description?: string;
}

// ==================== ANIMATION VARIANTS ====================
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const pulseAnimation = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// ==================== HELPER FUNCTIONS ====================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};

const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatShortDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'approved':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'processing':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'rejected':
    case 'failed':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return Clock;
    case 'approved':
      return CheckCircle;
    case 'processing':
      return RefreshCw;
    case 'completed':
      return CheckCircle;
    case 'rejected':
    case 'failed':
      return XCircle;
    default:
      return AlertCircle;
  }
};

const getTypeColor = (type: string): string => {
  return type === 'deposit' 
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
    : 'bg-rose-500/20 text-rose-400 border-rose-500/30';
};

const getTypeIcon = (type: string) => {
  return type === 'deposit' ? ArrowDownLeft : ArrowUpRight;
};

const getRiskColor = (score: number): string => {
  if (score < 20) return 'text-emerald-400';
  if (score < 50) return 'text-amber-400';
  if (score < 80) return 'text-orange-400';
  return 'text-rose-400';
};

const getRiskBadge = (score: number): string => {
  if (score < 20) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score < 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  if (score < 80) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
};

const getRiskLabel = (score: number): string => {
  if (score < 20) return 'Low Risk';
  if (score < 50) return 'Medium Risk';
  if (score < 80) return 'High Risk';
  return 'Critical Risk';
};

const truncateHash = (hash: string, chars = 8): string => {
  if (!hash) return '';
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  subtitle, 
  color = 'primary',
  loading = false 
}: any) => {
  const getGradient = () => {
    switch (color) {
      case 'primary': return 'from-[#F0B90B] to-[#d4a10b]';
      case 'success': return 'from-emerald-500 to-green-600';
      case 'danger': return 'from-rose-500 to-red-600';
      case 'info': return 'from-blue-500 to-cyan-600';
      case 'warning': return 'from-orange-500 to-amber-600';
      case 'purple': return 'from-purple-500 to-violet-600';
      default: return 'from-[#F0B90B] to-[#d4a10b]';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-700 rounded" />
                <div className="h-6 w-24 bg-gray-700 rounded" />
              </div>
              <div className="h-12 w-12 bg-gray-700 rounded-xl" />
            </div>
            <div className="h-4 w-32 bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white mt-1"
              >
                {value}
              </motion.p>
            </div>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                getGradient()
              )}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend === 'up' && <ArrowUp className="w-3 h-3 text-emerald-400" />}
              {trend === 'down' && <ArrowDown className="w-3 h-3 text-rose-400" />}
              <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                {trendValue}
              </span>
            </div>
          )}
        </CardContent>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-2xl" />
      </Card>
    </motion.div>
  );
};

// ==================== REQUEST CARD COMPONENT ====================
const RequestCard = ({ request, onView, onApprove, onReject, onProcess, onAddFunds, onRemoveFunds }: any) => {
  const StatusIcon = getStatusIcon(request.status);
  const TypeIcon = getTypeIcon(request.type);

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                request.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )}>
                <TypeIcon className={cn(
                  "w-4 h-4",
                  request.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                )} />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{request.userName}</p>
                <p className="text-xs text-gray-500">{request.userEmail}</p>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {request.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Amount */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="text-lg font-bold text-white">
                {request.currency} {request.amount.toLocaleString()}
              </span>
            </div>

            {/* Method & Risk */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Method</span>
              <Badge variant="outline" className="border-gray-700">
                {request.method}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Risk Score</span>
              <Badge className={getRiskBadge(request.riskScore)}>
                {request.riskScore} - {getRiskLabel(request.riskScore)}
              </Badge>
            </div>

            {/* KYC Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">KYC Status</span>
              {request.kycVerified ? (
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge className="bg-rose-500/20 text-rose-400">
                  <BadgeX className="w-3 h-3 mr-1" />
                  Not Verified
                </Badge>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Created</span>
              <span className="text-xs text-gray-400">{formatShortDate(request.createdAt)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onView(request)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {request.status === 'pending' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300"
                          onClick={() => onApprove(request.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Approve</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300"
                          onClick={() => onReject(request)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reject</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}

              {request.status === 'approved' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-8 text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => onProcess(request.id)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Process
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start processing</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  <DropdownMenuLabel className="text-white">Wallet Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={() => onAddFunds(request.userId)} className="text-gray-300 hover:text-white">
                    <Plus className="w-4 h-4 mr-2 text-emerald-400" />
                    Add Funds
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRemoveFunds(request.userId)} className="text-gray-300 hover:text-white">
                    <Minus className="w-4 h-4 mr-2 text-rose-400" />
                    Remove Funds
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== REQUEST DETAILS DIALOG ====================
const RequestDetailsDialog = ({ request, open, onClose, onApprove, onReject }: any) => {
  if (!request) return null;

  const StatusIcon = getStatusIcon(request.status);
  const TypeIcon = getTypeIcon(request.type);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-black" />
            </div>
            Wallet Request Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Complete information for request {request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                request.type === 'deposit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )}>
                <TypeIcon className={cn(
                  "w-6 h-6",
                  request.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                )} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="text-lg font-mono text-white">{request.id}</p>
              </div>
            </div>
            <Badge className={getStatusColor(request.status)}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {request.status}
            </Badge>
          </div>

          <Separator className="bg-gray-700" />

          {/* User Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="text-sm font-medium text-white">{request.userName}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-white">{request.userEmail}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">User ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono text-white">{request.userId.slice(0, 8)}...</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopy(request.userId)}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">KYC Status</p>
                {request.kycVerified ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge className="bg-rose-500/20 text-rose-400">
                    <BadgeX className="w-3 h-3 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Transaction Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <Badge className={getTypeColor(request.type)}>
                  <TypeIcon className="w-3 h-3 mr-1" />
                  {request.type}
                </Badge>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Amount</p>
                <p className="text-lg font-bold text-white">
                  {request.currency} {request.amount.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Method</p>
                <p className="text-sm font-medium text-white">{request.method}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Fee</p>
                <p className="text-sm font-medium text-white">
                  {request.fee ? `${request.currency} ${request.fee}` : 'No fee'}
                </p>
              </div>
            </div>
          </div>

          {/* Address & Transaction Hash */}
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Wallet Address</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleCopy(request.address)}
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  Copy
                </Button>
              </div>
              <p className="text-sm font-mono text-white break-all">{request.address}</p>
            </div>

            {request.transactionHash && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">Transaction Hash</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => window.open(`https://etherscan.io/tx/${request.transactionHash}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
                <p className="text-sm font-mono text-white break-all">{request.transactionHash}</p>
              </div>
            )}
          </div>

          {/* Risk Assessment */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Risk Assessment</h3>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Risk Score</span>
                <Badge className={getRiskBadge(request.riskScore)}>
                  {request.riskScore} - {getRiskLabel(request.riskScore)}
                </Badge>
              </div>
              <Progress 
                value={request.riskScore} 
                className="h-2 bg-gray-700"
              />
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-emerald-400">Low</span>
                <span className="text-amber-400">Medium</span>
                <span className="text-orange-400">High</span>
                <span className="text-rose-400">Critical</span>
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Description</h3>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-white">{request.description}</p>
            </div>
          </div>

          {request.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Notes</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm text-white">{request.notes}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-white">{formatDate(request.createdAt)}</p>
              </div>
              {request.processedAt && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Processed</p>
                  <p className="text-sm text-white">{formatDate(request.processedAt)}</p>
                </div>
              )}
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-white">{formatDate(request.updatedAt)}</p>
              </div>
              {request.processedBy && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Processed By</p>
                  <p className="text-sm text-white">{request.processedBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {request.metadata && Object.keys(request.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Additional Data</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <pre className="text-xs text-gray-400 overflow-auto">
                  {JSON.stringify(request.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Close
          </Button>
          {request.status === 'pending' && (
            <>
              <Button
                onClick={() => onApprove(request.id)}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => onReject(request)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== REJECTION DIALOG ====================
const RejectionDialog = ({ open, onClose, onConfirm }: any) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-400" />
            Reject Request
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Please provide a reason for rejecting this request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium mb-1">Warning</p>
                <p className="text-xs text-gray-400">
                  Rejecting this request will notify the user and prevent the transaction from being processed.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Rejection Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="bg-gray-800/50 border-gray-700 text-white mt-2"
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            Reject Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== FUND MANAGEMENT DIALOG ====================
const FundManagementDialog = ({ open, onClose, onConfirm, action, users, preSelectedUserId }: any) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reason, setReason] = useState('');

  // Set pre-selected user when dialog opens or preSelectedUserId changes
  useEffect(() => {
    if (preSelectedUserId && selectedUserId !== preSelectedUserId) {
      setSelectedUserId(preSelectedUserId);
    }
  }, [preSelectedUserId, selectedUserId]);

  const handleConfirm = () => {
    onConfirm({ userId: selectedUserId, amount: parseFloat(amount), currency, reason });
    setSelectedUserId('');
    setAmount('');
    setCurrency('USD');
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'add' ? (
              <>
                <Plus className="w-5 h-5 text-emerald-400" />
                Add Funds to Wallet
              </>
            ) : (
              <>
                <Minus className="w-5 h-5 text-rose-400" />
                Remove Funds from Wallet
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {action === 'add' 
              ? 'Manually add funds to a user wallet' 
              : 'Manually remove funds from a user wallet'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-gray-400">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white mt-2">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Amount</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="bg-gray-800/50 border-gray-700 text-white mt-2"
              />
            </div>
            <div>
              <Label className="text-gray-400">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="BTC">BTC</SelectItem>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="SOL">SOL</SelectItem>
                  <SelectItem value="BNB">BNB</SelectItem>
                  <SelectItem value="ADA">ADA</SelectItem>
                  <SelectItem value="XRP">XRP</SelectItem>
                  <SelectItem value="DOT">DOT</SelectItem>
                  <SelectItem value="LINK">LINK</SelectItem>
                  <SelectItem value="MATIC">MATIC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for ${action}ing funds...`}
              className="bg-gray-800/50 border-gray-700 text-white mt-2"
              rows={3}
            />
          </div>

          {action === 'remove' && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-rose-400 font-medium mb-1">Warning</p>
                  <p className="text-xs text-gray-400">
                    Removing funds will decrease the user's wallet balance. This action cannot be undone.
                    Please verify the user has sufficient balance before proceeding.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedUserId || !amount || parseFloat(amount) <= 0 || !reason.trim()}
            className={action === 'add' 
              ? 'bg-emerald-500 hover:bg-emerald-600' 
              : 'bg-rose-500 hover:bg-rose-600'
            }
          >
            {action === 'add' ? 'Add Funds' : 'Remove Funds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function WalletManagement() {
  const { toast } = useToast();
  
  // State
  const [requests, setRequests] = useState<WalletRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<WalletRequest[]>([]);
  const [users, setUsers] = useState<any[]>([]); // Add users state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection
  const [selectedRequest, setSelectedRequest] = useState<WalletRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [selectedUserForFund, setSelectedUserForFund] = useState<string>(''); // Add pre-selected user state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState<string>('');
  const [fundCurrency, setFundCurrency] = useState<string>('USDT');
  
  // Deposit Slip State
  const [showDepositSlip, setShowDepositSlip] = useState(false);
  const [depositSlipData, setDepositSlipData] = useState<any>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(true);
  
  // Stats
  const [stats, setStats] = useState<WalletStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalVolume: 0,
    avgProcessingTime: 0,
    successRate: 0,
    totalFees: 0,
    activeWallets: 0
  });

  // Load users for dropdown
  const loadUsers = async () => {
    try {
      const usersResponse = await adminApiService.getUsers();
      const usersData = usersResponse.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('❌ [WalletManagement] Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  // Load wallet requests
  const loadWalletRequests = async () => {
    try {
      setLoading(true);
      
      // Get wallet requests from our new wallet API service (includes admin actions)
      const walletRequests = await walletApiService.getWalletRequests();
      
      // Get deposit requests from Supabase using depositService
      let depositRequests = [];
      try {
        const result = await depositService.getAllDepositRequests();
        if (result.success && result.data) {
          depositRequests = result.data;
        } else if (result.error) {
          console.error('Error fetching deposit requests:', result.error);
        }
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
      }
      
      // Transform Supabase deposit requests to wallet request format
      const transformedDepositRequests: WalletRequest[] = depositRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        userEmail: req.user_email,
        userName: req.user_name || req.user_email?.split('@')[0] || 'Unknown',
        type: 'deposit',
        amount: req.amount,
        currency: req.currency || 'USD',
        status: req.status,
        method: req.method || 'bank_transfer',
        address: req.address || `0x${req.user_id?.slice(0, 8)}...`,
        transactionHash: req.id,
        description: `Deposit request - ${req.currency} ${req.amount}`,
        fee: 0,
        riskScore: 0,
        kycVerified: false,
        processedBy: req.processed_by,
        processedAt: req.processed_at,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        metadata: req.metadata || {}
      }));
      
      // Transform database wallet requests to match frontend interface
      const transformedDatabaseRequests = walletRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        userEmail: req.user?.email || 'unknown@example.com',
        userName: req.user ? 
          `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() || 
          req.user.email?.split('@')[0] || 'Unknown' : 'Unknown',
        type: req.type,
        amount: parseFloat(req.amount),
        currency: req.currency,
        status: req.status,
        method: req.method,
        address: req.address,
        transactionHash: req.transaction_hash,
        description: req.description,
        fee: parseFloat(req.fee || 0),
        riskScore: req.risk_score || 0,
        kycVerified: true, // Assume verified if they have wallet requests
        processedBy: req.processed_by,
        processedAt: req.processed_at,
        createdAt: req.created_at,
        updatedAt: req.updated_at,
        metadata: {
          adminNotes: req.admin_notes,
          riskScore: req.risk_score
        }
      }));
      
      // Combine all requests
      const allRequests = [...transformedDatabaseRequests, ...transformedDepositRequests];
      
      // Sort by date (newest first)
      allRequests.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      
      setRequests(allRequests);
      setFilteredRequests(allRequests);
      calculateStats(allRequests);
      
    } catch (error) {
      console.error('❌ [WalletManagement] Error loading wallet requests:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (requestData: WalletRequest[]) => {
    const stats: WalletStats = {
      totalRequests: requestData.length,
      pendingRequests: requestData.filter(r => r.status === 'pending').length,
      approvedRequests: requestData.filter(r => r.status === 'approved').length,
      rejectedRequests: requestData.filter(r => r.status === 'rejected').length,
      totalVolume: requestData.reduce((sum, r) => sum + r.amount, 0),
      avgProcessingTime: 0,
      successRate: requestData.length > 0 ? (requestData.filter(r => r.status === 'completed').length / requestData.length) * 100 : 0,
      totalFees: requestData.reduce((sum, r) => sum + (r.fee || 0), 0),
      activeWallets: 0
    };
    setStats(stats);
  };

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    if (currencyFilter !== 'all') {
      filtered = filtered.filter(req => req.currency === currencyFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter, currencyFilter]);

  // Handle request approval
  const handleApprove = async (requestId: string) => {
    try {
      
      const request = requests.find(req => req.id === requestId);
      if (!request) {
        toast({
          title: "Error",
          description: "Request not found",
          variant: "destructive",
        });
        return;
      }

      // Check if this is a deposit request from main server
      const isDepositRequest = requestId.startsWith('deposit-') || request.type === 'deposit';
      
      if (isDepositRequest) {
        // Get current admin user ID (you might get this from auth context)
        const adminId = 'current-admin-id'; // Replace with actual admin ID from auth
        
        // Update deposit request status in main server with admin ID
        try {
          const response = await fetch(`/api/deposit-requests/${requestId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              status: 'Approved',
              adminId: adminId,
              adminNotes: 'Approved by admin'
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update deposit request status');
          }

          const result = await response.json();
          
          // If server processed approval and added funds, show success and deposit slip
          if (result.success) {
            toast({
              title: "Deposit Approved & Processed",
              description: `${request.currency} ${request.amount.toLocaleString()} has been added to user wallet`,
            });
            
            // Show deposit slip for approved deposit
            if (request.type === 'deposit') {
              const slipData = {
                transactionId: request.id,
                date: request.updatedAt || new Date().toISOString(),
                time: request.updatedAt || new Date().toISOString(),
                asset: request.currency,
                status: 'Completed' as const,
                amount: request.amount,
                amountUsd: request.amount, // Assuming 1:1 for now, you can add conversion logic
                userName: request.userName,
                userEmail: request.userEmail,
                network: request.method,
                address: request.address
              };
              
              setDepositSlipData(slipData);
              setShowDepositSlip(true);
            }
          }
        } catch (error) {
          console.error('Error updating deposit request:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : 'Failed to approve deposit',
            variant: "destructive",
          });
        }
      } else {
        try {
          // Process wallet balance change for all approved requests
          if (request.type === 'deposit') {
            try {
              await walletApiService.adminAddFunds(
                request.userId, 
                request.amount, 
                request.currency, 
                `Approved deposit: ${request.description}`
              );
              
              // Update to completed after successful processing
              setRequests(prev => prev.map(req => 
                req.id === requestId 
                  ? { ...req, status: 'completed' }
                  : req
              ));
              
              toast({
                title: "Success",
                description: `${request.currency} ${request.amount.toLocaleString()} has been added to user wallet`,
              });
            } catch (error) {
              console.error('Error adding funds to wallet:', error);
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to add funds to wallet',
                variant: "destructive",
              });
            }
          } else {
            try {
              await walletApiService.adminRemoveFunds(
                request.userId, 
                request.amount, 
                request.currency, 
                `Approved withdrawal: ${request.description}`
              );
              
              // Update to completed after successful processing
              setRequests(prev => prev.map(req => 
                req.id === requestId 
                  ? { ...req, status: 'completed' }
                  : req
              ));
              
              toast({
                title: "Withdrawal Approved & Processed",
                description: `${request.currency} ${request.amount.toLocaleString()} has been deducted from user wallet`,
              });
            } catch (error) {
              console.error('Error removing funds from wallet:', error);
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to remove funds from wallet',
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Error processing request:', error);
          toast({
            title: "Error",
            description: "Failed to process request",
            variant: "destructive",
          });
        }
      }
      
    } catch (error) {
      console.error('❌ [WalletManagement] Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  // Reject wallet request
  const rejectWalletRequest = async (requestId: string, notes: string) => {
    try {
      console.log('❌ [WalletManagement] Rejecting request:', requestId);
      
      const request = requests.find(req => req.id === requestId);
      if (!request) return;
      
      // Update request status to rejected
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', processedAt: new Date().toISOString() }
          : req
      ));
      
      setShowRejectionDialog(false);
      setShowDetails(false);
      
      toast({
        title: "Request Rejected",
        description: `Request has been rejected`,
        variant: "destructive",
      });
      
      console.log('✅ [WalletManagement] Request rejected:', requestId);
    } catch (error) {
      console.error('❌ [WalletManagement] Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Handle fund action
  const handleFundAction = async () => {
    try {
      if (!selectedUser || !fundAction || !fundAmount) return;
      
      const amount = parseFloat(fundAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }
      
      if (fundAction === 'add') {
        await walletApiService.adminAddFunds(
          selectedUser.id, 
          amount, 
          fundCurrency, 
          `Admin manual fund addition`
        );
        
        toast({
          title: "Funds Added",
          description: `${fundCurrency} ${amount.toLocaleString()} has been added to user wallet`,
        });
      } else if (fundAction === 'remove') {
        await walletApiService.adminRemoveFunds(
          selectedUser.id, 
          amount, 
          fundCurrency, 
          `Admin manual fund removal`
        );
        
        toast({
          title: "Funds Removed",
          description: `${fundCurrency} ${amount.toLocaleString()} has been removed from user wallet`,
        });
      }
      
      setShowFundDialog(false);
      loadWalletRequests();
      
      toast({
        title: "Fund Action Completed",
        description: `${fundAction} action completed successfully`,
      });
      
    } catch (error) {
      console.error('❌ [WalletManagement] Error processing fund action:', error);
      toast({
        title: "Error",
        description: "Failed to process fund action",
        variant: "destructive",
      });
    }
  };

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    try {
      await loadWalletRequests();
      toast({
        title: "Data Refreshed",
        description: "Wallet requests have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Handle request rejection
  const handleReject = async (requestId: string, reason: string) => {
    try {
      console.log('❌ [WalletManagement] Rejecting request:', requestId);
      
      // Update request status to rejected
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', processedAt: new Date().toISOString() }
          : req
      ));

      toast({
        title: "Request Rejected",
        description: "Wallet request has been rejected",
      });
      
      console.log('✅ [WalletManagement] Request rejected:', requestId);
    } catch (error) {
      console.error('❌ [WalletManagement] Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Handle fund management (alias for handleFundAction)
  const handleFundManagement = handleFundAction;

  // Filter requests
  useEffect(() => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(req => req.type === typeFilter);
    }

    if (currencyFilter !== 'all') {
      filtered = filtered.filter(req => req.currency === currencyFilter);
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, typeFilter, currencyFilter]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadWalletRequests();
  }, []);

  // Handle sync all balances
  const handleSyncAllBalances = async () => {
    try {
      setLoading(true);
      await BalanceSyncService.syncAllUsersBalances();
      // Refresh data after sync
      await refreshData();
    } catch (error) {
      console.error('Failed to sync balances:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet Management</h1>
          <p className="text-gray-400">Manage user wallet requests and transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSyncAllBalances} disabled={loading} variant="outline" className="border-green-600 text-green-400 hover:bg-green-600/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Balances
          </Button>
          <Button onClick={refreshData} disabled={refreshing} className="bg-blue-600 hover:bg-blue-700">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Wallet className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <div className="bg-yellow-600 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">{stats.completedRequests}</p>
              </div>
              <div className="bg-green-600 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Volume</p>
                <p className="text-2xl font-bold text-white">${stats.totalVolume.toLocaleString()}</p>
              </div>
              <div className="bg-purple-600 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deposit">Deposit</SelectItem>
                <SelectItem value="withdrawal">Withdrawal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="BNB">BNB</SelectItem>
                <SelectItem value="ADA">ADA</SelectItem>
                <SelectItem value="XRP">XRP</SelectItem>
                <SelectItem value="DOT">DOT</SelectItem>
                <SelectItem value="LINK">LINK</SelectItem>
                <SelectItem value="MATIC">MATIC</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => setShowFundDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Funds
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-400">ID</TableHead>
                <TableHead className="text-gray-400">User</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Amount</TableHead>
                <TableHead className="text-gray-400">Currency</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Method</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="border-gray-700">
                  <TableCell className="text-white">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono">{request.id.slice(0, 8)}...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(request.id)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div>
                      <div className="font-medium">{request.userName}</div>
                      <div className="text-sm text-gray-400">{request.userEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <Badge variant={request.type === 'deposit' ? 'default' : 'secondary'}>
                      {request.type === 'deposit' ? (
                        <ArrowDownLeft className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      )}
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {request.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-white">{request.currency}</TableCell>
                  <TableCell className="text-white">
                    <Badge
                      variant={
                        request.status === 'completed' ? 'default' :
                        request.status === 'pending' ? 'secondary' :
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {request.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">{request.method}</TableCell>
                  <TableCell className="text-white">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approveRequest(request.id)}
                            className="text-green-400 hover:text-green-300"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectionDialog(true);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Request Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed information about the wallet request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Request ID</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-mono text-sm">{selectedRequest.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(selectedRequest.id)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">User</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedRequest.userName}</div>
                    <div className="text-sm text-gray-400">{selectedRequest.userEmail}</div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Type</Label>
                  <div className="mt-1">
                    <Badge variant={selectedRequest.type === 'deposit' ? 'default' : 'secondary'}>
                      {selectedRequest.type}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Amount</Label>
                  <div className="mt-1 font-medium">
                    {selectedRequest.amount.toLocaleString()} {selectedRequest.currency}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedRequest.status === 'completed' ? 'default' :
                        selectedRequest.status === 'pending' ? 'secondary' :
                        selectedRequest.status === 'approved' ? 'default' :
                        selectedRequest.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Method</Label>
                  <div className="mt-1">{selectedRequest.method}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Created</Label>
                  <div className="mt-1">
                    {new Date(selectedRequest.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Processed</Label>
                  <div className="mt-1">
                    {selectedRequest.processedAt 
                      ? new Date(selectedRequest.processedAt).toLocaleString()
                      : 'Not processed yet'
                    }
                  </div>
                </div>
              </div>
              
              {selectedRequest.description && (
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <div className="mt-1 p-3 bg-gray-700 rounded-md">
                    {selectedRequest.description}
                  </div>
                </div>
              )}
              
              {selectedRequest.address && (
                <div>
                  <Label className="text-gray-400">Address</Label>
                  <div className="mt-1 p-3 bg-gray-700 rounded-md font-mono text-sm">
                    {selectedRequest.address}
                  </div>
                </div>
              )}
              
              {selectedRequest.transactionHash && (
                <div>
                  <Label className="text-gray-400">Transaction Hash</Label>
                  <div className="mt-1 p-3 bg-gray-700 rounded-md font-mono text-sm">
                    {selectedRequest.transactionHash}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  onClick={() => {
                    approveRequest(selectedRequest.id);
                    setShowDetails(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setSelectedRequest(selectedRequest);
                    setShowRejectionDialog(true);
                    setShowDetails(false);
                  }}
                  variant="destructive"
                >
                  Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Rejection Reason</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  rejectWalletRequest(selectedRequest.id, rejectionNotes);
                }
              }}
              variant="destructive"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fund Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Manage User Funds</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add or remove funds from user wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">User</Label>
              <Select value={selectedUser?.id || ''} onValueChange={(value) => {
                const user = users.find(u => u.id === value);
                setSelectedUser(user);
              }}>
                <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400">Action</Label>
              <Select value={fundAction} onValueChange={setFundAction}>
                <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="add">Add Funds</SelectItem>
                  <SelectItem value="remove">Remove Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Amount</Label>
                <Input
                  type="number"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="mt-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label className="text-gray-400">Currency</Label>
                <Select value={fundCurrency} onValueChange={setFundCurrency}>
                  <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="BTC">BTC</SelectItem>
                    <SelectItem value="ETH">ETH</SelectItem>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="BNB">BNB</SelectItem>
                    <SelectItem value="ADA">ADA</SelectItem>
                    <SelectItem value="XRP">XRP</SelectItem>
                    <SelectItem value="DOT">DOT</SelectItem>
                    <SelectItem value="LINK">LINK</SelectItem>
                    <SelectItem value="MATIC">MATIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFundDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFundAction}
              disabled={!selectedUser || !fundAction || !fundAmount}
              className={fundAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {fundAction === 'add' ? 'Add Funds' : 'Remove Funds'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Slip Modal */}
      {showDepositSlip && depositSlipData && (
        <DepositSlip
          data={depositSlipData}
          onClose={() => {
            setShowDepositSlip(false);
            setDepositSlipData(null);
          }}
          showCloseButton={true}
        />
      )}
    </div>
  );
};