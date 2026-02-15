import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Ban,
  Shield,
  FileText,
  Key,
  CreditCard,
  UserCheck,
  Upload,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  MoreVertical,
  Fingerprint,
  Globe,
  MapPin,
  Building,
  Briefcase,
  Download,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  ChevronRight,
  Star,
  Award,
  Zap,
  ShieldCheck,
  Lock,
  Unlock,
  Users,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Filter,
  PieChart,
  BarChart3,
  Wallet,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock3,
  CheckCircle as CheckCircleSolid,
  XCircle as XCircleSolid,
  AlertCircle as AlertCircleSolid,
  FileCheck,
  FileX,
  FileWarning,
  FileUp,
  FileDown,
  EyeOff,
  Eye as EyeIcon,
  Copy,
  Check,
  Link,
  Share2,
  Printer,
  Trash2,
  Archive,
  Tag,
  Gift,
  Award as AwardIcon,
  Medal,
  Crown,
  Sparkles,
  Rocket,
  Target,
  Users2,
  UserPlus,
  UserMinus,
  UserCog,
  ShieldAlert,
  ShieldOff,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  KeyRound,
  Fingerprint as FingerprintIcon,
  ScanFace,
  QrCode,
  BadgeCheck,
  BadgeX,
  BadgeAlert,
  BadgeInfo,
  BadgePlus,
  BadgeMinus,
  BadgeDollarSign,
  BadgePercent,
  BadgeEuro,
  BadgePoundSterling,
  BadgeJapaneseYen,
  BadgeIndianRupee,
  BadgeChineseYuan,
  BadgeRussianRuble,
  BadgeSouthKoreanWon,
  BadgeSwissFranc,
} from 'lucide-react';
import apiService, { User } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
};

const slideIn = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Status badges with animations
const StatusBadge = ({ status, type = 'default' }: { status: string; type?: 'default' | 'kyc' | 'role' }) => {
  const getStatusConfig = () => {
    if (type === 'kyc') {
      switch (status) {
        case 'Verified':
          return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircleSolid, label: 'Verified' };
        case 'Pending':
          return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock3, label: 'Pending' };
        case 'Rejected':
          return { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: XCircleSolid, label: 'Rejected' };
        default:
          return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircleSolid, label: 'Not Submitted' };
      }
    }
    
    switch (status) {
      case 'Active':
        return { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircleSolid, label: 'Active' };
      case 'Pending':
        return { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock3, label: 'Pending' };
      case 'Suspended':
        return { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: ShieldOff, label: 'Suspended' };
      default:
        return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: AlertCircleSolid, label: status };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <Badge className={cn("px-3 py-1 border", config.color)}>
        <Icon className="w-3.5 h-3.5 mr-1.5" />
        {config.label}
      </Badge>
    </motion.div>
  );
};

// Metric card component
const MetricCard = ({ title, value, icon: Icon, trend, color = 'blue' }: any) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    rose: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br p-6",
        colorClasses[color]
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-400">{title}</span>
          <div className={cn(
            "p-2 rounded-lg",
            `bg-${color}-500/10`
          )}>
            <Icon className={cn("w-4 h-4", `text-${color}-400`)} />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold text-white">{value}</div>
            {trend && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {trend.direction === 'up' ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-rose-400" />
                )}
                <span className={trend.direction === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
                  {trend.value}
                </span>
                <span className="text-gray-500">vs last month</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Action button component
const ActionButton = ({ icon: Icon, label, onClick, variant = 'default', tooltip }: any) => {
  const variants = {
    default: 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 border-gray-700/50',
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/30',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200",
              variants[variant]
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{label}</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip || label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Document card component
const DocumentCard = ({ document, type, status, onView, onDownload }: any) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircleSolid className="w-4 h-4 text-emerald-400" />;
      case 'pending':
        return <Clock3 className="w-4 h-4 text-amber-400" />;
      case 'rejected':
        return <XCircleSolid className="w-4 h-4 text-rose-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gray-700/30 rounded-lg">
          <FileText className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{document.name || type}</span>
            {getStatusIcon()}
          </div>
          <p className="text-xs text-gray-500">
            Uploaded {document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onView}>
                  <Eye className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Document</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

// Activity timeline component
const ActivityTimeline = ({ activities }: { activities: any[] }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={index}
          variants={slideIn}
          custom={index}
          className="flex gap-4"
        >
          <div className="relative">
            <div className={cn(
              "w-2 h-2 mt-2 rounded-full",
              activity.type === 'success' ? 'bg-emerald-400' :
              activity.type === 'warning' ? 'bg-amber-400' :
              activity.type === 'error' ? 'bg-rose-400' :
              'bg-blue-400'
            )}>
              <div className={cn(
                "absolute inset-0 rounded-full animate-ping",
                activity.type === 'success' ? 'bg-emerald-400/50' :
                activity.type === 'warning' ? 'bg-amber-400/50' :
                activity.type === 'error' ? 'bg-rose-400/50' :
                'bg-blue-400/50'
              )} />
            </div>
            {index < activities.length - 1 && (
              <div className="absolute top-4 left-1 w-0.5 h-full bg-gray-700" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium text-white">{activity.title}</p>
            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
            <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Credit score gauge component
const CreditScoreGauge = ({ score }: { score: number }) => {
  const getScoreColor = () => {
    if (score >= 750) return 'text-emerald-400';
    if (score >= 670) return 'text-blue-400';
    if (score >= 580) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreLabel = () => {
    if (score >= 750) return 'Excellent';
    if (score >= 670) return 'Good';
    if (score >= 580) return 'Fair';
    return 'Poor';
  };

  const percentage = (score / 850) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="relative"
    >
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className={getScoreColor()}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: percentage / 100 }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                strokeDasharray: "364.4",
                strokeDashoffset: "364.4"
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className={cn("text-3xl font-bold", getScoreColor())}
            >
              {score}
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs text-gray-500"
            >
              {getScoreLabel()}
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [suspensionDialog, setSuspensionDialog] = useState<User | null>(null);
  const [kycDialog, setKycDialog] = useState<User | null>(null);
  const [documentsDialog, setDocumentsDialog] = useState<User | null>(null);
  const [creditDialog, setCreditDialog] = useState<User | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser(userId);
    }
  }, [userId]);

  const loadUser = async (id: string) => {
    try {
      setLoading(true);
      const users = await apiService.getUsers();
      const foundUser = users.find(u => u.id === id);
      if (foundUser) {
        setUser(foundUser);
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (user: User, reason: string) => {
    try {
      await apiService.updateUser(user.id, { status: 'Suspended' });
      setUser({ ...user, status: 'Suspended' as any });
      setSuspensionDialog(null);
      setSuspensionReason('');
      toast({
        title: "User Suspended",
        description: `${user.firstName} ${user.lastName} has been suspended`,
      });
    } catch (error) {
      console.error('Failed to suspend user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive",
      });
    }
  };

  const handleUnsuspendUser = async (user: User) => {
    try {
      await apiService.updateUser(user.id, { status: 'Active' });
      setUser({ ...user, status: 'Active' });
      toast({
        title: "User Unsuspended",
        description: `${user.firstName} ${user.lastName} has been reactivated`,
      });
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      toast({
        title: "Error",
        description: "Failed to unsuspend user",
        variant: "destructive",
      });
    }
  };

  const handleApproveKYC = async (user: User) => {
    try {
      await apiService.updateUser(user.id, { kycStatus: 'Verified' });
      setUser({ ...user, kycStatus: 'Verified' });
      setKycDialog(null);
      toast({
        title: "KYC Approved",
        description: `${user.firstName} ${user.lastName}'s KYC has been verified`,
      });
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      toast({
        title: "Error",
        description: "Failed to approve KYC",
        variant: "destructive",
      });
    }
  };

  const handleRejectKYC = async (user: User, reason: string) => {
    try {
      await apiService.updateUser(user.id, { kycStatus: 'Rejected' });
      setUser({ ...user, kycStatus: 'Rejected' });
      setKycDialog(null);
      toast({
        title: "KYC Rejected",
        description: `${user.firstName} ${user.lastName}'s KYC has been rejected`,
      });
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      toast({
        title: "Error",
        description: "Failed to reject KYC",
        variant: "destructive",
      });
    }
  };

  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      await apiService.updateUser(editingUser!.id, userData);
      setUser({ ...user!, ...userData });
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User information has been updated",
      });
    } catch (error) {
      console.error('Failed to save user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      await apiService.resetUserPassword(user.id);
      setPasswordDialog(null);
      toast({
        title: "Password Reset",
        description: `Password reset link sent to ${user.email}`,
      });
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCreditScore = async (user: User, score: number, change: 'increase' | 'decrease', reason: string) => {
    try {
      const newScore = change === 'increase' ? user.creditScore + score : user.creditScore - score;
      await apiService.updateUser(user.id, { creditScore: newScore });
      setUser({ ...user, creditScore: newScore });
      setCreditDialog(null);
      toast({
        title: "Credit Score Updated",
        description: `${user.firstName} ${user.lastName}'s credit score ${change === 'increase' ? 'increased' : 'decreased'} to ${newScore}`,
      });
    } catch (error) {
      console.error('Failed to update credit score:', error);
      toast({
        title: "Error",
        description: "Failed to update credit score",
        variant: "destructive",
      });
    }
  };

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: "Email address copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
        <div className="fixed inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full animate-pulse" />
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-gray-400"
            >
              Loading user details...
            </motion.p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/20 rounded-full mb-4">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-gray-500 mb-6">The user you're looking for doesn't exist or has been removed.</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate('/admin/dashboard')} className="bg-blue-500 hover:bg-blue-600">
                Back to Dashboard
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Detailed view and management
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                <ActionButton
                  icon={Edit}
                  label="Edit"
                  onClick={() => setEditingUser(user)}
                  variant="primary"
                  tooltip="Edit user information"
                />
                {user.status === 'Active' ? (
                  <ActionButton
                    icon={Ban}
                    label="Suspend"
                    onClick={() => setSuspensionDialog(user)}
                    variant="warning"
                    tooltip="Suspend user account"
                  />
                ) : (
                  <ActionButton
                    icon={UserCheck}
                    label="Unsuspend"
                    onClick={() => handleUnsuspendUser(user)}
                    variant="success"
                    tooltip="Reactivate user account"
                  />
                )}
                <ActionButton
                  icon={Key}
                  label="Password"
                  onClick={() => setPasswordDialog(user)}
                  variant="default"
                  tooltip="Reset user password"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                    <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem onClick={() => setKycDialog(user)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Manage KYC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDocumentsDialog(user)}>
                      <Upload className="w-4 h-4 mr-2" />
                      View Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCreditDialog(user)}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Update Credit Score
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </motion.div>

        {/* User Profile Header */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <motion.div variants={scaleIn} className="relative">
                  <Avatar className="w-24 h-24 border-4 border-gray-700">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                      {user.firstName?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-gray-800",
                      user.status === 'Active' ? 'bg-emerald-500' :
                      user.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                  />
                </motion.div>

                <motion.div variants={fadeInUp} className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                    <h2 className="text-2xl font-bold">
                      {user.firstName} {user.lastName}
                    </h2>
                    <div className="flex gap-2">
                      <StatusBadge status={user.status} />
                      {user.kycStatus && <StatusBadge status={user.kycStatus} type="kyc" />}
                      {user.isAdmin && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          <Shield className="w-3.5 h-3.5 mr-1.5" />
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 ml-1"
                        onClick={handleCopyEmail}
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </motion.div>
                    
                    {user.phone && (
                      <motion.div
                        variants={fadeInUp}
                        className="flex items-center gap-2 text-gray-400"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{user.phone}</span>
                      </motion.div>
                    )}
                    
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">
                        Joined {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown'}
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border border-gray-700/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-gray-700">
              Financial
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-gray-700">
              Documents
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-gray-700">
              Activity
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gray-700">
              Security
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Balance"
                    value={`$${user.balance?.toLocaleString() || '0'}`}
                    icon={Wallet}
                    color="blue"
                    trend={{ direction: 'up', value: '12.5%' }}
                  />
                  <MetricCard
                    title="Credit Score"
                    value={user.creditScore || 0}
                    icon={TrendingUp}
                    color="green"
                    trend={{ direction: 'up', value: '5.2%' }}
                  />
                  <MetricCard
                    title="Total Loans"
                    value="$45,000"
                    icon={CreditCard}
                    color="amber"
                    trend={{ direction: 'down', value: '8.1%' }}
                  />
                  <MetricCard
                    title="KYC Status"
                    value={user.kycStatus || 'Pending'}
                    icon={Shield}
                    color="purple"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Personal Information */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-400" />
                        Personal Information
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Detailed user information and contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-gray-500">Full Name</Label>
                            <p className="text-sm font-medium mt-1">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Email Address</Label>
                            <p className="text-sm font-medium mt-1 flex items-center gap-2">
                              {user.email}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={handleCopyEmail}
                              >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Phone Number</Label>
                            <p className="text-sm font-medium mt-1">
                              {user.phone || 'Not provided'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-gray-500">Account Type</Label>
                            <p className="text-sm font-medium mt-1">
                              {user.accountType || 'Standard'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Account Number</Label>
                            <p className="text-sm font-medium mt-1 font-mono">
                              {user.accountNumber || 'Not assigned'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Member Since</Label>
                            <p className="text-sm font-medium mt-1">
                              {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Quick Actions
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        Frequently used operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <motion.div whileHover={{ x: 4 }} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Send className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Send Message</p>
                              <p className="text-xs text-gray-500">Contact user directly</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </motion.div>

                        <motion.div whileHover={{ x: 4 }} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <FileText className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">View Statements</p>
                              <p className="text-xs text-gray-500">Account statements</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </motion.div>

                        <motion.div whileHover={{ x: 4 }} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                              <Shield className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Security Settings</p>
                              <p className="text-xs text-gray-500">Manage permissions</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Financial Tab */}
            {activeTab === 'financial' && (
              <motion.div
                key="financial"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Credit Score Card */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Credit Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                      <CreditScoreGauge score={user.creditScore || 650} />
                      <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Excellent</p>
                          <p className="text-xs font-medium">750+</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Good</p>
                          <p className="text-xs font-medium">670-749</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Fair</p>
                          <p className="text-xs font-medium">580-669</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financial Overview */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-amber-400" />
                        Financial Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-500">Current Balance</p>
                            <p className="text-2xl font-bold">${user.balance?.toLocaleString() || '0.00'}</p>
                          </div>
                          <div className="p-3 bg-emerald-500/20 rounded-full">
                            <Wallet className="w-6 h-6 text-emerald-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Total Deposits</p>
                            <p className="text-lg font-bold">$125,000</p>
                            <p className="text-xs text-emerald-400 mt-1">+12.5%</p>
                          </div>
                          <div className="p-4 bg-gray-700/30 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">Total Withdrawals</p>
                            <p className="text-lg font-bold">$80,000</p>
                            <p className="text-xs text-rose-400 mt-1">-8.3%</p>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-700/30 rounded-lg">
                          <p className="text-sm text-gray-500 mb-3">Monthly Activity</p>
                          <div className="h-32 flex items-end gap-2">
                            {[65, 45, 75, 55, 85, 70, 90].map((height, i) => (
                              <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: i * 0.1 }}
                                className="flex-1 bg-blue-500/20 rounded-t-lg relative group"
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ${height * 100}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                            <span>Jul</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <motion.div
                key="documents"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* KYC Documents */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-blue-400" />
                        KYC Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Fingerprint className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">ID Verification</p>
                            <p className="text-xs text-gray-500">Government ID / Passport</p>
                          </div>
                        </div>
                        <StatusBadge status={user.kycStatus || 'Pending'} type="kyc" />
                      </div>

                      {user.kyc?.documents?.map((doc, index) => (
                        <DocumentCard
                          key={index}
                          document={doc}
                          type={doc.type}
                          status={doc.status}
                          onView={() => {}}
                          onDownload={() => {}}
                        />
                      ))}

                      {(!user.kyc?.documents || user.kyc.documents.length === 0) && (
                        <div className="text-center py-8">
                          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No KYC documents uploaded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Documents */}
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Additional Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user.documents && user.documents.length > 0 ? (
                        user.documents.map((doc, index) => (
                          <DocumentCard
                            key={index}
                            document={doc}
                            type="Document"
                            status="verified"
                            onView={() => {}}
                            onDownload={() => {}}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-sm text-gray-500">No additional documents</p>
                          <p className="text-xs text-gray-600 mt-1">Documents will appear here when uploaded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <motion.div
                key="activity"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-400" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityTimeline activities={[
                      {
                        title: 'Account Login',
                        description: 'Successful login from Chrome on Windows',
                        time: '2 minutes ago',
                        type: 'success'
                      },
                      {
                        title: 'Password Change',
                        description: 'Password was changed successfully',
                        time: '1 hour ago',
                        type: 'warning'
                      },
                      {
                        title: 'KYC Document Uploaded',
                        description: 'ID document uploaded for verification',
                        time: '3 hours ago',
                        type: 'info'
                      },
                      {
                        title: 'Failed Login Attempt',
                        description: 'Failed login attempt from unknown device',
                        time: '5 hours ago',
                        type: 'error'
                      },
                      {
                        title: 'Profile Updated',
                        description: 'Phone number was updated',
                        time: '1 day ago',
                        type: 'info'
                      }
                    ]} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        Security Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-emerald-400" />
                          <div>
                            <p className="text-sm font-medium">Two-Factor Authentication</p>
                            <p className="text-xs text-gray-500">Protect your account with 2FA</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Fingerprint className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-medium">Biometric Login</p>
                            <p className="text-xs text-gray-500">Use fingerprint or face ID</p>
                          </div>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-amber-400" />
                          <div>
                            <p className="text-sm font-medium">Email Notifications</p>
                            <p className="text-xs text-gray-500">Security alerts via email</p>
                          </div>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-purple-400" />
                        Login Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium">Chrome on Windows</span>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400">Current</Badge>
                        </div>
                        <p className="text-xs text-gray-500">IP: 192.168.1.1 • Last active: Now</p>
                      </div>

                      <div className="p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">Mobile App</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">IP: 192.168.1.2 • Last active: 2 hours ago</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Edit className="w-5 h-5 text-blue-400" />
                  Edit User Information
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Update user details and account information
                </DialogDescription>
              </DialogHeader>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
              >
                <div>
                  <Label>First Name</Label>
                  <Input 
                    value={editingUser.firstName || ''} 
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    value={editingUser.lastName || ''} 
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={editingUser.email || ''} 
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={editingUser.phone || ''} 
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </motion.div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)} className="border-gray-600">
                  Cancel
                </Button>
                <Button onClick={() => handleSaveUser(editingUser)} className="bg-blue-500 hover:bg-blue-600">
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Suspension Dialog */}
        {suspensionDialog && (
          <Dialog open={!!suspensionDialog} onOpenChange={(open) => !open && setSuspensionDialog(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Ban className="w-5 h-5 text-rose-400" />
                  Suspend User
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Suspend {suspensionDialog.firstName} {suspensionDialog.lastName}'s account
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label>Suspension Reason</Label>
                <Textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSuspensionDialog(null)} className="border-gray-600">
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleSuspendUser(suspensionDialog, suspensionReason)}
                >
                  Suspend User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* KYC Dialog */}
        {kycDialog && (
          <Dialog open={!!kycDialog} onOpenChange={(open) => !open && setKycDialog(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Manage KYC
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Manage KYC verification for {kycDialog.firstName} {kycDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <span>Current Status:</span>
                  <StatusBadge status={kycDialog.kycStatus || 'Pending'} type="kyc" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKycDialog(null)} className="border-gray-600">
                  Close
                </Button>
                {kycDialog.kycStatus !== 'Verified' && (
                  <Button onClick={() => handleApproveKYC(kycDialog)} className="bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve KYC
                  </Button>
                )}
                {kycDialog.kycStatus !== 'Rejected' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleRejectKYC(kycDialog, 'Rejected by admin')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject KYC
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Credit Score Dialog */}
        {creditDialog && (
          <Dialog open={!!creditDialog} onOpenChange={(open) => !open && setCreditDialog(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Update Credit Score
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Adjust credit score for {creditDialog.firstName} {creditDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <Label>Current Score</Label>
                  <p className="text-3xl font-bold mt-1">{creditDialog.creditScore || 0}</p>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setCreditDialog(null)} className="border-gray-600">
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateCreditScore(creditDialog, 50, 'increase', 'Good performance')} className="bg-emerald-500 hover:bg-emerald-600">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  +50 Points
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateCreditScore(creditDialog, 50, 'decrease', 'Poor performance')}
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  -50 Points
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Password Reset Dialog */}
        {passwordDialog && (
          <Dialog open={!!passwordDialog} onOpenChange={(open) => !open && setPasswordDialog(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Key className="w-5 h-5 text-blue-400" />
                  Reset Password
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Send password reset link to {passwordDialog.email}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialog(null)} className="border-gray-600">
                  Cancel
                </Button>
                <Button onClick={() => handleResetPassword(passwordDialog)} className="bg-blue-500 hover:bg-blue-600">
                  Send Reset Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Documents Dialog */}
        {documentsDialog && (
          <Dialog open={!!documentsDialog} onOpenChange={(open) => !open && setDocumentsDialog(null)}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Upload className="w-5 h-5 text-blue-400" />
                  User Documents
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  Documents uploaded by {documentsDialog.firstName} {documentsDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* KYC Documents */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-white">KYC Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentsDialog.kyc?.documents && documentsDialog.kyc.documents.length > 0 ? (
                      documentsDialog.kyc.documents.map((doc, index) => (
                        <DocumentCard
                          key={index}
                          document={doc}
                          type={doc.type}
                          status={doc.status}
                          onView={() => {}}
                          onDownload={() => {}}
                        />
                      ))
                    ) : (
                      <Card className="bg-gray-700/30 border-gray-600 col-span-2">
                        <CardContent className="p-8 text-center">
                          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500">No KYC documents uploaded</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Additional Documents */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-white">Additional Documents</h4>
                  <Card className="bg-gray-700/30 border-gray-600">
                    <CardContent className="p-6">
                      {documentsDialog.documents && documentsDialog.documents.length > 0 ? (
                        <div className="space-y-3">
                          {documentsDialog.documents.map((doc, index) => (
                            <DocumentCard
                              key={index}
                              document={doc}
                              type={doc.name || `Document ${index + 1}`}
                              status="verified"
                              onView={() => {}}
                              onDownload={() => {}}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500">No additional documents uploaded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* KYC Status Summary */}
                <Card className="bg-gray-700/30 border-gray-600">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4 text-white">KYC Status Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <StatusBadge status={documentsDialog.kycStatus || 'Pending'} type="kyc" />
                        <p className="text-xs text-gray-500 mt-2">Current Status</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-lg font-semibold text-white">
                          {documentsDialog.kyc?.submittedAt ? new Date(documentsDialog.kyc.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Submitted Date</p>
                      </div>
                      <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-lg font-semibold text-white">
                          {documentsDialog.kyc?.verifiedAt ? new Date(documentsDialog.kyc.verifiedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500">Verified Date</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDocumentsDialog(null)} className="border-gray-600">
                  Close
                </Button>
                <Button onClick={() => setKycDialog(documentsDialog)} className="bg-blue-500 hover:bg-blue-600">
                  <FileText className="w-4 h-4 mr-2" />
                  Manage KYC
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}