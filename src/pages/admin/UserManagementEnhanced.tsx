import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Download,
  Grid,
  List,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  User as UserIcon,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  Eye,
  Edit,
  Ban,
  Shield,
  FileText,
  Key,
  CreditCard,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  UserCog,
  ShieldAlert,
  ShieldOff,
  ShieldCheck,
  BadgeCheck,
  BadgeX,
  BadgeAlert,
  BadgeInfo,
  BadgeDollarSign,
  BadgePercent,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Wallet,
  DollarSign,
  Star,
  Award,
  Medal,
  Crown,
  Sparkles,
  Rocket,
  Target,
  Zap,
  Flame,
  Droplet,
  Wind,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Snowflake,
  Umbrella,
  Tornado,
  Hurricane,
  Earthquake,
  Volcano,
  Mountain,
  Tree,
  Flower,
  Leaf,
  Seedling,
  Sprout,
  Wheat,
  Grain,
  Apple,
  Carrot,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Turtle,
  Elephant,
  Lion,
  Tiger,
  Bear,
  Wolf,
  Fox,
  Deer,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Turkey,
  Peacock,
  Eagle,
  Hawk,
  Owl,
  Raven,
  Crow,
  Parrot,
  Penguin,
  Flamingo,
  Swan,
  Dolphin,
  Whale,
  Shark,
  Octopus,
  Crab,
  Lobster,
  Shrimp,
  Squid,
  Jellyfish,
  Starfish,
  Coral,
  Shell,
  Sand,
  Rock,
  Stone,
  Crystal,
  Diamond,
  Ruby,
  Emerald,
  Sapphire,
  Topaz,
  Opal,
  Pearl,
  Amber,
  Coal,
  Iron,
  Copper,
  Bronze,
  Silver,
  Gold,
  Platinum,
  Titanium,
  Uranium,
  Plutonium,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import walletApiService from '@/services/wallet-api';

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
      staggerChildren: 0.05
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

const formatDate = (date: string | undefined): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatShortDate = (date: string | undefined): string => {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const getInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  if (user.email) {
    return user.email[0].toUpperCase();
  }
  return 'U';
};

const getStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'suspended':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getKycColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'verified':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'rejected':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'suspended':
      return Ban;
    default:
      return UserIcon;
  }
};

const getKycIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'verified':
      return BadgeCheck;
    case 'pending':
      return Clock;
    case 'rejected':
      return BadgeX;
    default:
      return FileText;
  }
};

const getCreditScoreColor = (score: number): string => {
  if (score >= 750) return 'text-emerald-400';
  if (score >= 670) return 'text-blue-400';
  if (score >= 580) return 'text-amber-400';
  return 'text-rose-400';
};

const getCreditScoreBadge = (score: number): string => {
  if (score >= 750) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 670) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (score >= 580) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
};

const getCreditScoreLabel = (score: number): string => {
  if (score >= 750) return 'Excellent';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
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
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-emerald-400" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-rose-400" />}
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

// ==================== USER CARD COMPONENT ====================
const UserCard = ({ 
  user, 
  onView, 
  onEdit, 
  onSuspend, 
  onUnsuspend, 
  onKyc, 
  onDocuments, 
  onCredit, 
  onPassword,
  isSuperAdmin 
}: any) => {
  const StatusIcon = getStatusIcon(user.status);
  const KycIcon = getKycIcon(user.kycStatus);

  return (
    <motion.div
      variants={fadeInScale}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
    >
      <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Header with actions */}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-gray-700">
                {user.avatar ? (
                  <AvatarImage src={user.avatar} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] text-black font-bold">
                    {getInitials(user)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(user.status)}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {user.status}
                  </Badge>
                  {user.isAdmin && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-white hover:bg-gray-800"
                      onClick={() => onView(user)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View details</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isSuperAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-gray-500 hover:text-white hover:bg-gray-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 w-48">
                    <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    <DropdownMenuItem onClick={() => onEdit(user)} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit User
                    </DropdownMenuItem>
                    
                    {user.status === 'Active' ? (
                      <DropdownMenuItem onClick={() => onSuspend(user)} className="text-amber-400 hover:text-amber-300 hover:bg-gray-700">
                        <Ban className="w-4 h-4 mr-2" />
                        Suspend
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onUnsuspend(user)} className="text-emerald-400 hover:text-emerald-300 hover:bg-gray-700">
                        <UserCheck className="w-4 h-4 mr-2" />
                        Unsuspend
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    <DropdownMenuItem onClick={() => onKyc(user)} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <FileText className="w-4 h-4 mr-2" />
                      Manage KYC
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onDocuments(user)} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Documents
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onCredit(user)} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Credit Score
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onPassword(user)} className="text-gray-300 hover:text-white hover:bg-gray-700">
                      <Key className="w-4 h-4 mr-2" />
                      Reset Password
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Quick info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-900/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Account Type</p>
                <p className="text-sm font-medium text-white">{user.accountType || 'Standard'}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Balance</p>
                <p className="text-sm font-medium text-white">{formatCompactCurrency(user.walletBalance || 0)}</p>
              </div>
            </div>

            {/* KYC Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">KYC Status</span>
              <Badge className={getKycColor(user.kycStatus)}>
                <KycIcon className="w-3 h-3 mr-1" />
                {user.kycStatus || 'Not Submitted'}
              </Badge>
            </div>

            {/* Credit Score */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Credit Score</span>
                <span className={cn("text-sm font-bold", getCreditScoreColor(user.creditScore || 0))}>
                  {user.creditScore || 0} - {getCreditScoreLabel(user.creditScore || 0)}
                </span>
              </div>
              <Progress 
                value={(user.creditScore || 0) / 850 * 100} 
                className="h-1 bg-gray-700"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 text-gray-500">
                <CalendarIcon className="w-3 h-3" />
                <span>Joined {formatShortDate(user.registrationDate)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Last login {formatShortDate(user.lastLogin)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ==================== USER TABLE ROW COMPONENT ====================
const UserTableRow = ({ 
  user, 
  onView, 
  onEdit, 
  onSuspend, 
  onUnsuspend, 
  onKyc, 
  onDocuments, 
  onCredit, 
  onPassword,
  isSuperAdmin 
}: any) => {
  const StatusIcon = getStatusIcon(user.status);
  const KycIcon = getKycIcon(user.kycStatus);

  return (
    <TableRow className="border-gray-700 hover:bg-gray-800/50 group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] text-black text-xs">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(user.status)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {user.status}
        </Badge>
        {user.isAdmin && (
          <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <Badge className={getKycColor(user.kycStatus)}>
          <KycIcon className="w-3 h-3 mr-1" />
          {user.kycStatus || 'Not Submitted'}
        </Badge>
      </TableCell>
      <TableCell className="text-white">{user.accountType || 'Standard'}</TableCell>
      <TableCell className="text-white">{formatCompactCurrency(user.walletBalance || 0)}</TableCell>
      <TableCell>
        <span className={cn("font-medium", getCreditScoreColor(user.creditScore || 0))}>
          {user.creditScore || 0}
        </span>
      </TableCell>
      <TableCell className="text-gray-500 text-sm">{formatShortDate(user.registrationDate)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => onView(user)}
                >
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {isSuperAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem onClick={() => onEdit(user)} className="text-gray-300 hover:text-white">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {user.status === 'Active' ? (
                  <DropdownMenuItem onClick={() => onSuspend(user)} className="text-amber-400">
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onUnsuspend(user)} className="text-emerald-400">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Unsuspend
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onKyc(user)} className="text-gray-300 hover:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  KYC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCredit(user)} className="text-gray-300 hover:text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Credit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPassword(user)} className="text-gray-300 hover:text-white">
                  <Key className="w-4 h-4 mr-2" />
                  Password
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

// ==================== USER DETAILS DIALOG ====================
const UserDetailsDialog = ({ user, open, onClose }: { user: User | null; open: boolean; onClose: () => void }) => {
  if (!user) return null;

  const StatusIcon = getStatusIcon(user.status);
  const KycIcon = getKycIcon(user.kycStatus);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-black" />
            </div>
            User Details
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Complete user information and account details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-gray-700">
              <AvatarFallback className="bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] text-black text-xl">
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(user.status)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {user.status}
                </Badge>
                <Badge className={getKycColor(user.kycStatus)}>
                  <KycIcon className="w-3 h-3 mr-1" />
                  {user.kycStatus || 'Not Submitted'}
                </Badge>
                {user.isAdmin && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-gray-700" />

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">First Name</p>
                <p className="text-sm font-medium text-white">{user.firstName || 'Not provided'}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Name</p>
                <p className="text-sm font-medium text-white">{user.lastName || 'Not provided'}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-white">{user.email}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm font-medium text-white">{user.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Account Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Account Type</p>
                <p className="text-sm font-medium text-white">{user.accountType || 'Standard'}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Account Number</p>
                <p className="text-sm font-medium text-white font-mono">{user.accountNumber || 'Not assigned'}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Balance</p>
                <p className="text-lg font-bold text-white">{formatCurrency(user.walletBalance || 0)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Credit Score</p>
                <p className={cn("text-lg font-bold", getCreditScoreColor(user.creditScore || 0))}>
                  {user.creditScore || 0}
                  <span className="text-xs ml-1 text-gray-500">{getCreditScoreLabel(user.creditScore || 0)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Registration Date</p>
                <p className="text-sm font-medium text-white">{formatDate(user.registrationDate)}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Login</p>
                <p className="text-sm font-medium text-white">{formatDate(user.lastLogin)}</p>
              </div>
            </div>
          </div>

          {/* Admin Role */}
          {user.adminRole && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Admin Role</h3>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-sm font-medium text-white capitalize">{user.adminRole}</p>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== EDIT USER DIALOG ====================
const EditUserDialog = ({ user, open, onClose, onSave }: any) => {
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-[#F0B90B]" />
            Edit User
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Update user information and account settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">First Name</Label>
              <Input
                value={formData.firstName || ''}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Last Name</Label>
              <Input
                value={formData.lastName || ''}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Email</Label>
            <Input
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-400">Phone</Label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Account Type</Label>
              <Select
                value={formData.accountType || ''}
                onValueChange={(value) => setFormData({ ...formData, accountType: value })}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400">Account Number</Label>
              <Input
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-400">Status</Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => setFormData({ ...formData, status: value as any })}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400">KYC Status</Label>
              <Select
                value={formData.kycStatus || ''}
                onValueChange={(value) => setFormData({ ...formData, kycStatus: value as any })}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select KYC status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <Label className="text-gray-400">Admin Role</Label>
              <Select
                value={formData.adminRole || ''}
                onValueChange={(value) => setFormData({ ...formData, adminRole: value })}
              >
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
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
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black hover:from-yellow-400 hover:to-yellow-500"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== SUSPENSION DIALOG ====================
const SuspensionDialog = ({ user, open, onClose, onConfirm }: any) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(user, reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-400" />
            Suspend User
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Suspend {user?.firstName} {user?.lastName}'s account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium mb-1">Warning</p>
                <p className="text-xs text-gray-400">
                  Suspending this user will prevent them from accessing their account, making trades, and performing any platform actions.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Suspension Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for suspension..."
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
            Suspend User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== KYC DIALOG ====================
const KycDialog = ({ user, open, onClose, onApprove, onReject }: any) => {
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#F0B90B]" />
            Manage KYC
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Review and update KYC status for {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Status</span>
              <Badge className={getKycColor(user?.kycStatus)}>
                {user?.kycStatus || 'Not Submitted'}
              </Badge>
            </div>
            
            {user?.kycStatus === 'Pending' && (
              <div className="mt-4 space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-400">
                    This user has submitted KYC documents for verification. Please review their documents before making a decision.
                  </p>
                </div>

                <div>
                  <Label className="text-gray-400">Rejection Reason (if rejecting)</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="bg-gray-800/50 border-gray-700 text-white mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}
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
          {user?.kycStatus !== 'Verified' && (
            <Button
              onClick={() => onApprove(user)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          )}
          {user?.kycStatus !== 'Rejected' && (
            <Button
              variant="destructive"
              onClick={() => onReject(user, rejectionReason || 'KYC rejected by admin')}
              disabled={user?.kycStatus === 'Pending' && !rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== CREDIT SCORE DIALOG ====================
const CreditScoreDialog = ({ user, open, onClose, onUpdate }: any) => {
  const [score, setScore] = useState(50);
  const [changeType, setChangeType] = useState<'increase' | 'decrease'>('increase');
  const [reason, setReason] = useState('');

  const handleUpdate = () => {
    onUpdate(user, score, changeType, reason);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Update Credit Score
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Adjust credit score for {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Current Score</p>
            <div className="flex items-end justify-between">
              <p className={cn("text-3xl font-bold", getCreditScoreColor(user?.creditScore || 0))}>
                {user?.creditScore || 0}
              </p>
              <p className="text-xs text-gray-500">{getCreditScoreLabel(user?.creditScore || 0)}</p>
            </div>
          </div>

          <div>
            <Label className="text-gray-400">Adjustment Type</Label>
            <Select value={changeType} onValueChange={(value: any) => setChangeType(value)}>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="increase">Increase Score</SelectItem>
                <SelectItem value="decrease">Decrease Score</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400">Amount</Label>
            <Input
              type="number"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value) || 0)}
              min={1}
              max={200}
              className="bg-gray-800/50 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-400">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for adjustment..."
              className="bg-gray-800/50 border-gray-700 text-white mt-2"
              rows={3}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-400">
              New score will be: <span className="font-bold">
                {changeType === 'increase' ? (user?.creditScore || 0) + score : (user?.creditScore || 0) - score}
              </span>
            </p>
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
            onClick={handleUpdate}
            disabled={!reason.trim()}
            className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black hover:from-yellow-400 hover:to-yellow-500"
          >
            Update Score
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== PASSWORD RESET DIALOG ====================
const PasswordResetDialog = ({ user, open, onClose, onConfirm }: any) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            Reset Password
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Send password reset link to {user?.email}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-400 font-medium mb-1">Confirm Password Reset</p>
                <p className="text-xs text-gray-400">
                  This will send a password reset link to {user?.email}. The user will be able to create a new password using this link. This action cannot be undone.
                </p>
              </div>
            </div>
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
            onClick={() => onConfirm(user)}
            className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black hover:from-yellow-400 hover:to-yellow-500"
          >
            Send Reset Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== DOCUMENTS DIALOG ====================
const DocumentsDialog = ({ user, open, onClose, onManageKyc }: any) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#F0B90B]" />
            User Documents
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Documents uploaded by {user?.firstName} {user?.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* KYC Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">KYC Documents</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">ID Document</span>
                    <Badge className={getKycColor(user?.kycStatus)}>
                      {user?.kycStatus || 'Not Submitted'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>Passport / National ID</span>
                    </div>
                    {user?.kyc?.documents && user.kyc.documents.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {user.kyc.documents.map((doc: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#F0B90B]" />
                              <span className="text-sm text-white">{doc.type}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No KYC documents uploaded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Proof of Address</span>
                    <Badge className="bg-gray-500/20 text-gray-400">
                      Not Required
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>Utility Bill / Bank Statement</span>
                    </div>
                    <div className="text-center py-4 text-gray-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No address proof uploaded</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Documents */}
          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-3">Additional Documents</h4>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Total Documents</span>
                    <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                      {user?.documents?.length || 0} files
                    </Badge>
                  </div>
                  
                  {user?.documents && user.documents.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {user.documents.map((doc: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#F0B90B]" />
                            <div>
                              <p className="text-sm font-medium text-white">{doc.name || `Document ${index + 1}`}</p>
                              <p className="text-xs text-gray-500">
                                {doc.uploadedAt ? formatShortDate(doc.uploadedAt) : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Upload className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No additional documents uploaded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KYC Status Summary */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-white">KYC Status Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Badge className={getKycColor(user?.kycStatus)}>
                    {user?.kycStatus || 'Not Submitted'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">Current Status</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    {user?.kyc?.submittedAt ? formatShortDate(user.kyc.submittedAt) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Submitted Date</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">
                    {user?.kyc?.verifiedAt ? formatShortDate(user.kyc.verifiedAt) : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Verified Date</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Close
          </Button>
          <Button
            onClick={() => onManageKyc(user)}
            className="bg-gradient-to-r from-[#F0B90B] to-[#d4a10b] text-black hover:from-yellow-400 hover:to-yellow-500"
          >
            <FileText className="w-4 h-4 mr-2" />
            Manage KYC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function UserManagement() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search and filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Dialogs
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [suspensionDialog, setSuspensionDialog] = useState<User | null>(null);
  const [kycDialog, setKycDialog] = useState<User | null>(null);
  const [documentsDialog, setDocumentsDialog] = useState<User | null>(null);
  const [creditDialog, setCreditDialog] = useState<User | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<User | null>(null);

  // Load users with wallet balances
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Handle API call - apiService.getUsers() returns User[] directly
      let usersData;
      try {
        usersData = await apiService.getUsers();
            } catch (apiError) {
        console.error('❌ [UserManagement] API call failed:', apiError);
        usersData = [];
      }
      
      // Fetch wallet balances for each user
      const usersWithBalances = await Promise.all(
        usersData.map(async (user) => {
          try {
            const walletBalances = await walletApiService.getUserBalances(user.id);
            const totalBalance = walletBalances.reduce((sum, wallet) => sum + wallet.balance, 0);
                return {
              ...user,
              walletBalance: totalBalance
            };
          } catch (error) {
            console.error(`❌ [UserManagement] Failed to fetch wallet balance for user ${user.id}:`, error);
            return {
              ...user,
              walletBalance: 0
            };
          }
        })
      );
      
      setUsers(usersWithBalances);
    } catch (error) {
      console.error('💥 [UserManagement] Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Refresh wallet balance for a specific user
  const refreshUserWalletBalance = async (userId: string) => {
    try {
      const walletBalances = await walletApiService.getUserBalances(userId);
      const totalBalance = walletBalances.reduce((sum, wallet) => sum + wallet.balance, 0);
      
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, walletBalance: totalBalance }
          : user
      ));
      
    } catch (error) {
      console.error(`❌ [UserManagement] Failed to refresh wallet balance for user ${userId}:`, error);
    }
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  // Set up real-time wallet balance updates
  useEffect(() => {
    const handleWalletUpdate = (event: CustomEvent) => {
      if (event.detail?.userId) {
        refreshUserWalletBalance(event.detail.userId);
      }
    };

    window.addEventListener('balanceUpdate', handleWalletUpdate as EventListener);
    
    return () => {
      window.removeEventListener('balanceUpdate', handleWalletUpdate as EventListener);
    };
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = [...users];
    
    console.log('  - Search term:', search);
    console.log('  - Status filter:', statusFilter);
    console.log('  - KYC filter:', kycFilter);

    if (search) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.phone?.toLowerCase().includes(search.toLowerCase())
      );
      }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status?.toLowerCase() === statusFilter.toLowerCase());
      }

    if (kycFilter !== 'all') {
      filtered = filtered.filter(user => user.kycStatus?.toLowerCase() === kycFilter.toLowerCase());
      }

    setFilteredUsers(filtered);
  }, [users, search, statusFilter, kycFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const pendingKyc = users.filter(u => u.kycStatus === 'Pending').length;
    const suspendedUsers = users.filter(u => u.status === 'Suspended').length;
    const totalBalance = users.reduce((sum, u) => sum + (u.balance || 0), 0);

    return {
      totalUsers: users.length,
      activeUsers,
      pendingKyc,
      suspendedUsers,
      totalBalance,
      growthRate: 12.5, // Calculate from historical data
      kycRate: users.length > 0 ? (users.filter(u => u.kycStatus === 'Verified').length / users.length) * 100 : 0
    };
  }, [users]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "User list has been updated",
    });
  };

  const handleSuspendUser = async (user: User, reason: string) => {
    try {
      await apiService.updateUser(user.id, { status: 'Suspended' });
      
      await apiService.createAuditLog({
        userId: user.id,
        action: 'suspend',
        details: `User suspended: ${reason}`,
        adminId: 'current-admin'
      });

      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: 'Suspended' } : u
      ));
      
      setSuspensionDialog(null);
      toast({
        title: "User Suspended",
        description: `${user.firstName} ${user.lastName} has been suspended`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to suspend user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    try {
      console.log('✅ [UserManagement] Unsuspending user:', user.id);
      await apiService.updateUser(user.id, { status: 'Active' });
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: 'Active' } : u
      ));
      
      toast({
        title: "User Unsuspended",
        description: `${user.firstName} ${user.lastName} has been reactivated`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to unsuspend user:', error);
      toast({
        title: "Error",
        description: "Failed to unsuspend user",
        variant: "destructive",
      });
    }
  };

  const handleApproveKYC = async (user: User) => {
    try {
      console.log('✅ [UserManagement] Approving KYC:', user.id);
      await apiService.updateUser(user.id, { kycStatus: 'Verified' });
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, kycStatus: 'Verified' } : u
      ));
      
      setKycDialog(null);
      toast({
        title: "KYC Approved",
        description: `${user.firstName} ${user.lastName}'s KYC has been verified`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to approve KYC:', error);
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive",
      });
    }
  };

  const handleRejectKYC = async (user: User, reason: string) => {
    try {
      console.log('❌ [UserManagement] Rejecting KYC:', user.id);
      await apiService.updateUser(user.id, { kycStatus: 'Rejected' });
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, kycStatus: 'Rejected' } : u
      ));
      
      setKycDialog(null);
      toast({
        title: "KYC Rejected",
        description: `${user.firstName} ${user.lastName}'s KYC has been rejected`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to reject KYC:', error);
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCreditScore = async (user: User, score: number, change: 'increase' | 'decrease', reason: string) => {
    try {
      console.log('📈 [UserManagement] Updating credit score:', { userId: user.id, score, change, reason });
      const newScore = change === 'increase' ? (user.creditScore || 0) + score : (user.creditScore || 0) - score;
      
      await apiService.updateUser(user.id, { creditScore: newScore });
      
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, creditScore: newScore } : u
      ));
      
      setCreditDialog(null);
      toast({
        title: "Credit Score Updated",
        description: `${user.firstName} ${user.lastName}'s credit score ${change === 'increase' ? 'increased' : 'decreased'} to ${newScore}`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to update credit score:', error);
      toast({
        title: "Error",
        description: "Failed to update credit score",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      console.log('🔑 [UserManagement] Resetting password:', user.id);
      await apiService.resetUserPassword(user.id);
      
      setPasswordDialog(null);
      toast({
        title: "Password Reset",
        description: `Password reset link sent to ${user.email}`,
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to reset password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      console.log('💾 [UserManagement] Saving user data:', userData);
      await apiService.updateUser(editingUser!.id, userData);
      
      setUsers(prev => prev.map(u => 
        u.id === editingUser!.id ? { ...u, ...userData } : u
      ));
      
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User information has been updated",
      });
    } catch (error) {
      console.error('💥 [UserManagement] Failed to save user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'KYC Status', 'Account Type', 'Balance', 'Credit Score', 'Registration Date', 'Last Login'];
    const rows = filteredUsers.map(user => [
      user.id,
      user.firstName || '',
      user.lastName || '',
      user.email || '',
      user.phone || '',
      user.status || '',
      user.kycStatus || '',
      user.accountType || 'Standard',
      user.balance || 0,
      user.creditScore || 0,
      user.registrationDate || '',
      user.lastLogin || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${filteredUsers.length} users exported`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F0B90B]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 bg-gradient-to-br from-[#F0B90B] to-[#d4a10b] rounded-xl flex items-center justify-center"
              >
                <Users className="w-5 h-5 text-black" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage and monitor all platform users
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1 border border-gray-700/50">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0",
                        viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500'
                      )}
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Grid view</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={cn(
                        "h-8 w-8 p-0",
                        viewMode === 'table' ? 'bg-gray-700 text-white' : 'text-gray-500'
                      )}
                      onClick={() => setViewMode('table')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Table view</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Export button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExport}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export users</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Refresh button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="border-gray-700 hover:bg-gray-800"
                  >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            trend="up"
            trendValue={`${stats.growthRate}%`}
            subtitle="+12 this week"
            loading={loading}
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            icon={UserCheck}
            color="success"
            subtitle={`${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total`}
            loading={loading}
          />
          <StatsCard
            title="Pending KYC"
            value={stats.pendingKyc}
            icon={Clock}
            color="warning"
            subtitle={`${stats.kycRate.toFixed(1)}% completed`}
            loading={loading}
          />
          <StatsCard
            title="Suspended"
            value={stats.suspendedUsers}
            icon={Ban}
            color="danger"
            subtitle="Require attention"
            loading={loading}
          />
          <StatsCard
            title="Total Balance"
            value={formatCompactCurrency(stats.totalBalance)}
            icon={Wallet}
            color="info"
            trend="up"
            trendValue="8.2%"
            loading={loading}
          />
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email, phone..."
                      className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Status filter */}
                <div className="w-full lg:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* KYC filter */}
                <div className="w-full lg:w-48">
                  <Select value={kycFilter} onValueChange={setKycFilter}>
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="Filter by KYC" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All KYC Status</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Results count */}
                <div className="flex items-center px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <span className="text-sm text-gray-500">
                    {filteredUsers.length} of {users.length} users
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Users Grid/Table */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded" />
                      <div className="h-3 bg-gray-700 rounded" />
                      <div className="h-3 bg-gray-700 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onView={setViewingUser}
                  onEdit={setEditingUser}
                  onSuspend={setSuspensionDialog}
                  onUnsuspend={handleUnsuspendUser}
                  onKyc={setKycDialog}
                  onDocuments={setDocumentsDialog}
                  onCredit={setCreditDialog}
                  onPassword={setPasswordDialog}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 backdrop-blur-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-gray-500">User</TableHead>
                      <TableHead className="text-gray-500">Status</TableHead>
                      <TableHead className="text-gray-500">KYC</TableHead>
                      <TableHead className="text-gray-500">Type</TableHead>
                      <TableHead className="text-gray-500">Balance</TableHead>
                      <TableHead className="text-gray-500">Credit</TableHead>
                      <TableHead className="text-gray-500">Joined</TableHead>
                      <TableHead className="text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {filteredUsers.map((user) => (
                        <UserTableRow
                          key={user.id}
                          user={user}
                          onView={setViewingUser}
                          onEdit={setEditingUser}
                          onSuspend={setSuspensionDialog}
                          onUnsuspend={handleUnsuspendUser}
                          onKyc={setKycDialog}
                          onDocuments={setDocumentsDialog}
                          onCredit={setCreditDialog}
                          onPassword={setPasswordDialog}
                          isSuperAdmin={isSuperAdmin}
                        />
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && filteredUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {search || statusFilter !== 'all' || kycFilter !== 'all' 
                ? "Try adjusting your filters"
                : "No users have been created yet"}
            </p>
            {(search || statusFilter !== 'all' || kycFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setKycFilter('all');
                }}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Clear Filters
              </Button>
            )}
          </motion.div>
        )}

        {/* Dialogs */}
        <UserDetailsDialog
          user={viewingUser}
          open={!!viewingUser}
          onClose={() => setViewingUser(null)}
        />

        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />

        <SuspensionDialog
          user={suspensionDialog}
          open={!!suspensionDialog}
          onClose={() => setSuspensionDialog(null)}
          onConfirm={handleSuspendUser}
        />

        <KycDialog
          user={kycDialog}
          open={!!kycDialog}
          onClose={() => setKycDialog(null)}
          onApprove={handleApproveKYC}
          onReject={handleRejectKYC}
        />

        <CreditScoreDialog
          user={creditDialog}
          open={!!creditDialog}
          onClose={() => setCreditDialog(null)}
          onUpdate={handleUpdateCreditScore}
        />

        <PasswordResetDialog
          user={passwordDialog}
          open={!!passwordDialog}
          onClose={() => setPasswordDialog(null)}
          onConfirm={handleResetPassword}
        />

        <DocumentsDialog
          user={documentsDialog}
          open={!!documentsDialog}
          onClose={() => setDocumentsDialog(null)}
          onManageKyc={setKycDialog}
        />
      </div>
    </div>
  );
}