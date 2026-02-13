import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  User as UserIcon,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  History,
  FileText,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Award,
  CreditCard,
  Wallet,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Settings,
  Save,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  Fingerprint,
  Building,
  Briefcase,
  GraduationCap,
  Home,
  Globe,
  Smartphone,
  Laptop,
  Tablet,
  AlertCircle,
  CheckCheck,
  Ban,
  Flag,
  Archive,
  DownloadCloud,
  UploadCloud,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Hash,
  Network,
  Wifi,
  Server,
  HardDrive,
  Cpu,
  Database,
  Cloud,
  GitBranch,
  Code,
  Terminal,
  Box,
  Layers,
  Zap as ZapIcon,
  CalendarDays,
  Filter as FilterIcon,
  X,
  Check,
  Plus,
  Minus,
  Sliders,
  Search as SearchIcon,
  Save as SaveIcon,
  FileSpreadsheet,
  FileJson,
  FileText as FileTextIcon,
  Printer,
  Share2,
  Bookmark,
  BookmarkCheck,
  Star,
  StarHalf,
  StarOff,
  Heart,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MessageSquare as MessageSquareIcon,
  Bell,
  BellOff,
  BellRing,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Headphones,
  Speaker,
  Printer as PrinterIcon,
  Scan,
  QrCode,
  Barcode,
  Rss,
  Radio,
  Satellite,
  Podcast,
  Wifi as WifiIcon,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Cast,
  Airplay,
  Monitor,
  MonitorOff,
  Smartphone as SmartphoneIcon,
  Tablet as TabletIcon,
  Laptop as LaptopIcon,
  Watch,
  WatchIcon,
  Gamepad,
  Gamepad2,
  Keyboard,
  KeyboardIcon,
  Mouse,
  MousePointer,
  MousePointerClick,
  Pointer,
  Hand,
  HandIcon,
  HandMetal,
  HandHeart,
  HandHelping,
  HandPlatter,
  Handshake,
  HeartHandshake,
  HandCoins,
  HandDollar,
  HandIcon as HandIcon2,
} from 'lucide-react';
import { format, subDays, subMonths, subYears } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ==================== TYPES ====================
interface AdvancedSearchFilters {
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  // Address
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Account
  accountNumber: string;
  accountType: string[];
  status: string[];
  kycStatus: string[];
  role: string[];
  
  // Financial
  minBalance: number;
  maxBalance: number;
  minDeposits: number;
  maxDeposits: number;
  minWithdrawals: number;
  maxWithdrawals: number;
  minTrades: number;
  maxTrades: number;
  minCreditScore: number;
  maxCreditScore: number;
  minIncome: number;
  maxIncome: number;
  minNetWorth: number;
  maxNetWorth: number;
  
  // Dates
  registrationStart: Date | null;
  registrationEnd: Date | null;
  lastLoginStart: Date | null;
  lastLoginEnd: Date | null;
  lastActiveDays: number | null;
  
  // Activity
  hasTwoFactor: boolean | null;
  hasTrades: boolean | null;
  hasDeposits: boolean | null;
  hasWithdrawals: boolean | null;
  hasKyc: boolean | null;
  
  // Risk & Compliance
  riskTolerance: string[];
  investmentExperience: string[];
  investmentGoal: string[];
  tags: string[];
  
  // Technical
  ipAddress: string;
  deviceType: string[];
  browser: string;
  os: string;
  
  // Boolean flags
  isAdmin: boolean | null;
  isVerified: boolean | null;
  isActive: boolean | null;
  
  // Custom ranges
  customRanges: {
    field: string;
    min: number;
    max: number;
  }[];
}

interface SavedFilter {
  id: string;
  name: string;
  filters: AdvancedSearchFilters;
  createdAt: string;
  createdBy: string;
}

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ title, value, icon: Icon, trend, trendValue, subtitle }: any) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-[#848E9C]">{title}</p>
        <p className="text-xl font-bold text-[#EAECEF] mt-1">{value}</p>
        {subtitle && <p className="text-xs text-[#5E6673] mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-[#F0B90B]'
          }`}>
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#F0B90B]" />
      </div>
    </div>
  </Card>
);

// ==================== USER AVATAR COMPONENT ====================
const UserAvatar = ({ user }: { user: User }) => {
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Pending': return 'bg-yellow-500';
      case 'Suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="relative">
      <Avatar className="h-10 w-10 bg-[#2B3139]">
        <AvatarFallback className="bg-[#2B3139] text-[#EAECEF]">
          {initials || <UserIcon className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>
      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1E2329] ${getStatusColor(user.status)}`} />
    </div>
  );
};

// ==================== KYC BADGE COMPONENT ====================
const KycBadge = ({ status }: { status: string }) => {
  const getConfig = () => {
    switch (status) {
      case 'Verified':
        return { icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
      case 'Pending':
        return { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' };
      case 'Rejected':
        return { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
      default:
        return { icon: ShieldQuestion, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.bg} ${config.color} ${config.border} border`}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

// ==================== ROLE BADGE COMPONENT ====================
const RoleBadge = ({ role, isAdmin }: { role?: string; isAdmin?: boolean }) => {
  const roleValue = role || (isAdmin ? 'admin' : 'user');
  
  const getConfig = () => {
    switch (roleValue) {
      case 'superadmin':
        return { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30', label: 'Super Admin' };
      case 'admin':
        return { icon: ShieldCheck, color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30', label: 'Admin' };
      case 'finance':
        return { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', label: 'Finance' };
      case 'support':
        return { icon: UserCheck, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', label: 'Support' };
      default:
        return { icon: UserIcon, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30', label: 'User' };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge className={`${config.bg} ${config.color} ${config.border} border`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// ==================== ADVANCED SEARCH FILTERS COMPONENT ====================
const AdvancedSearchFilters = ({
  filters,
  onFilterChange,
  onApply,
  onClear,
  onSave,
  savedFilters,
  onLoadSavedFilter,
  onDeleteSavedFilter,
}: {
  filters: AdvancedSearchFilters;
  onFilterChange: (filters: AdvancedSearchFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onSave: (name: string) => void;
  savedFilters: SavedFilter[];
  onLoadSavedFilter: (filter: SavedFilter) => void;
  onDeleteSavedFilter: (id: string) => void;
}) => {
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: false,
    account: false,
    financial: false,
    dates: false,
    activity: false,
    risk: false,
    technical: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = (key: keyof AdvancedSearchFilters, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const updateNumericRange = (
    minKey: keyof AdvancedSearchFilters,
    maxKey: keyof AdvancedSearchFilters,
    min: number,
    max: number
  ) => {
    onFilterChange({ ...filters, [minKey]: min, [maxKey]: max });
  };

  const accountTypes = ['Traditional IRA', 'Roth IRA', 'SEP IRA', 'Simple IRA', '401(k)'];
  const statuses = ['Active', 'Pending', 'Suspended'];
  const kycStatuses = ['Verified', 'Pending', 'Rejected'];
  const roles = ['user', 'admin', 'superadmin', 'finance', 'support'];
  const riskTolerances = ['Conservative', 'Moderate', 'Aggressive'];
  const investmentExperiences = ['Beginner', 'Intermediate', 'Expert'];
  const investmentGoals = ['Retirement', 'Wealth Building', 'Growth', 'Income', 'Preservation'];
  const deviceTypes = ['Desktop', 'Mobile', 'Tablet'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera', 'Other'];
  const operatingSystems = ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Other'];

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-[#F0B90B]" />
            <CardTitle className="text-[#EAECEF]">Advanced Search</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              className="border-[#2B3139] text-[#EAECEF]"
            >
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={onApply}
              className="bg-[#F0B90B] hover:bg-yellow-400 text-black"
            >
              <Search className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {/* Personal Information Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('personal')}
          >
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Personal Information</span>
            </div>
            {expandedSections.personal ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.personal && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#848E9C]">First Name</Label>
                  <Input
                    value={filters.firstName}
                    onChange={(e) => updateFilter('firstName', e.target.value)}
                    placeholder="John"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#848E9C]">Last Name</Label>
                  <Input
                    value={filters.lastName}
                    onChange={(e) => updateFilter('lastName', e.target.value)}
                    placeholder="Doe"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">Email</Label>
                <Input
                  type="email"
                  value={filters.email}
                  onChange={(e) => updateFilter('email', e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">Phone</Label>
                <Input
                  value={filters.phone}
                  onChange={(e) => updateFilter('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Address Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('address')}
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Address</span>
            </div>
            {expandedSections.address ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.address && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">Street</Label>
                <Input
                  value={filters.street}
                  onChange={(e) => updateFilter('street', e.target.value)}
                  placeholder="123 Main St"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#848E9C]">City</Label>
                  <Input
                    value={filters.city}
                    onChange={(e) => updateFilter('city', e.target.value)}
                    placeholder="New York"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#848E9C]">State</Label>
                  <Input
                    value={filters.state}
                    onChange={(e) => updateFilter('state', e.target.value)}
                    placeholder="NY"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#848E9C]">ZIP Code</Label>
                  <Input
                    value={filters.zipCode}
                    onChange={(e) => updateFilter('zipCode', e.target.value)}
                    placeholder="10001"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#848E9C]">Country</Label>
                  <Input
                    value={filters.country}
                    onChange={(e) => updateFilter('country', e.target.value)}
                    placeholder="USA"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('account')}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Account</span>
            </div>
            {expandedSections.account ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.account && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">Account Number</Label>
                <Input
                  value={filters.accountNumber}
                  onChange={(e) => updateFilter('accountNumber', e.target.value)}
                  placeholder="IRA-2024-001234"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">Account Type</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {accountTypes.map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.accountType.includes(type)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newTypes = filters.accountType.includes(type)
                          ? filters.accountType.filter(t => t !== type)
                          : [...filters.accountType, type];
                        updateFilter('accountType', newTypes);
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">Status</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {statuses.map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.status.includes(status)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newStatus = filters.status.includes(status)
                          ? filters.status.filter(s => s !== status)
                          : [...filters.status, status];
                        updateFilter('status', newStatus);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">KYC Status</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {kycStatuses.map(status => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.kycStatus.includes(status)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newStatus = filters.kycStatus.includes(status)
                          ? filters.kycStatus.filter(s => s !== status)
                          : [...filters.kycStatus, status];
                        updateFilter('kycStatus', newStatus);
                      }}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#848E9C]">Role</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {roles.map(role => (
                    <Button
                      key={role}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.role.includes(role)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newRole = filters.role.includes(role)
                          ? filters.role.filter(r => r !== role)
                          : [...filters.role, role];
                        updateFilter('role', newRole);
                      }}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.isAdmin || false}
                  onCheckedChange={(checked) => updateFilter('isAdmin', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Is Admin</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.isVerified || false}
                  onCheckedChange={(checked) => updateFilter('isVerified', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Is Verified</Label>
              </div>
            </div>
          )}
        </div>

        {/* Financial Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('financial')}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Financial</span>
            </div>
            {expandedSections.financial ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.financial && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">Balance Range ($)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minBalance}
                    onChange={(e) => updateFilter('minBalance', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxBalance}
                    onChange={(e) => updateFilter('maxBalance', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Total Deposits ($)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minDeposits}
                    onChange={(e) => updateFilter('minDeposits', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxDeposits}
                    onChange={(e) => updateFilter('maxDeposits', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Total Withdrawals ($)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minWithdrawals}
                    onChange={(e) => updateFilter('minWithdrawals', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxWithdrawals}
                    onChange={(e) => updateFilter('maxWithdrawals', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Number of Trades</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minTrades}
                    onChange={(e) => updateFilter('minTrades', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxTrades}
                    onChange={(e) => updateFilter('maxTrades', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Credit Score</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={300}
                    max={850}
                    value={filters.minCreditScore}
                    onChange={(e) => updateFilter('minCreditScore', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    min={300}
                    max={850}
                    value={filters.maxCreditScore}
                    onChange={(e) => updateFilter('maxCreditScore', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Annual Income ($)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minIncome}
                    onChange={(e) => updateFilter('minIncome', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxIncome}
                    onChange={(e) => updateFilter('maxIncome', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Net Worth ($)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={filters.minNetWorth}
                    onChange={(e) => updateFilter('minNetWorth', parseInt(e.target.value) || 0)}
                    placeholder="Min"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={filters.maxNetWorth}
                    onChange={(e) => updateFilter('maxNetWorth', parseInt(e.target.value) || 0)}
                    placeholder="Max"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.hasTrades || false}
                  onCheckedChange={(checked) => updateFilter('hasTrades', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Has Trades</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.hasDeposits || false}
                  onCheckedChange={(checked) => updateFilter('hasDeposits', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Has Deposits</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.hasWithdrawals || false}
                  onCheckedChange={(checked) => updateFilter('hasWithdrawals', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Has Withdrawals</Label>
              </div>
            </div>
          )}
        </div>

        {/* Dates Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('dates')}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Dates</span>
            </div>
            {expandedSections.dates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.dates && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">Registration Date Range</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      >
                        {filters.registrationStart ? format(filters.registrationStart, 'PP') : 'Start Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1E2329] border-[#2B3139]">
                      <Calendar
                        mode="single"
                        selected={filters.registrationStart || undefined}
                        onSelect={(date) => updateFilter('registrationStart', date)}
                        className="bg-[#1E2329] text-[#EAECEF]"
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[#848E9C]">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      >
                        {filters.registrationEnd ? format(filters.registrationEnd, 'PP') : 'End Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1E2329] border-[#2B3139]">
                      <Calendar
                        mode="single"
                        selected={filters.registrationEnd || undefined}
                        onSelect={(date) => updateFilter('registrationEnd', date)}
                        className="bg-[#1E2329] text-[#EAECEF]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Last Login Date Range</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      >
                        {filters.lastLoginStart ? format(filters.lastLoginStart, 'PP') : 'Start Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1E2329] border-[#2B3139]">
                      <Calendar
                        mode="single"
                        selected={filters.lastLoginStart || undefined}
                        onSelect={(date) => updateFilter('lastLoginStart', date)}
                        className="bg-[#1E2329] text-[#EAECEF]"
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-[#848E9C]">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      >
                        {filters.lastLoginEnd ? format(filters.lastLoginEnd, 'PP') : 'End Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#1E2329] border-[#2B3139]">
                      <Calendar
                        mode="single"
                        selected={filters.lastLoginEnd || undefined}
                        onSelect={(date) => updateFilter('lastLoginEnd', date)}
                        className="bg-[#1E2329] text-[#EAECEF]"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Last Active (days)</Label>
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={filters.lastActiveDays || ''}
                  onChange={(e) => updateFilter('lastActiveDays', parseInt(e.target.value) || null)}
                  placeholder="Days since last login"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Risk & Compliance Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('risk')}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Risk & Compliance</span>
            </div>
            {expandedSections.risk ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.risk && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">Risk Tolerance</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {riskTolerances.map(risk => (
                    <Button
                      key={risk}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.riskTolerance.includes(risk)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newRisks = filters.riskTolerance.includes(risk)
                          ? filters.riskTolerance.filter(r => r !== risk)
                          : [...filters.riskTolerance, risk];
                        updateFilter('riskTolerance', newRisks);
                      }}
                    >
                      {risk}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Investment Experience</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {investmentExperiences.map(exp => (
                    <Button
                      key={exp}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.investmentExperience.includes(exp)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newExps = filters.investmentExperience.includes(exp)
                          ? filters.investmentExperience.filter(e => e !== exp)
                          : [...filters.investmentExperience, exp];
                        updateFilter('investmentExperience', newExps);
                      }}
                    >
                      {exp}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Investment Goal</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {investmentGoals.map(goal => (
                    <Button
                      key={goal}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.investmentGoal.includes(goal)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newGoals = filters.investmentGoal.includes(goal)
                          ? filters.investmentGoal.filter(g => g !== goal)
                          : [...filters.investmentGoal, goal];
                        updateFilter('investmentGoal', newGoals);
                      }}
                    >
                      {goal}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Tags (comma-separated)</Label>
                <Input
                  value={filters.tags.join(', ')}
                  onChange={(e) => updateFilter('tags', e.target.value.split(',').map(t => t.trim()))}
                  placeholder="vip, premium, flagged"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.hasKyc || false}
                  onCheckedChange={(checked) => updateFilter('hasKyc', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Has KYC Documents</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={filters.hasTwoFactor || false}
                  onCheckedChange={(checked) => updateFilter('hasTwoFactor', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Has 2FA Enabled</Label>
              </div>
            </div>
          )}
        </div>

        {/* Technical Section */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('technical')}
          >
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Technical</span>
            </div>
            {expandedSections.technical ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.technical && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              <div>
                <Label className="text-xs text-[#848E9C]">IP Address</Label>
                <Input
                  value={filters.ipAddress}
                  onChange={(e) => updateFilter('ipAddress', e.target.value)}
                  placeholder="192.168.1.1"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Device Type</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {deviceTypes.map(device => (
                    <Button
                      key={device}
                      size="sm"
                      variant="outline"
                      className={`border-[#2B3139] ${
                        filters.deviceType.includes(device)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const newDevices = filters.deviceType.includes(device)
                          ? filters.deviceType.filter(d => d !== device)
                          : [...filters.deviceType, device];
                        updateFilter('deviceType', newDevices);
                      }}
                    >
                      {device}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Browser</Label>
                <Input
                  value={filters.browser}
                  onChange={(e) => updateFilter('browser', e.target.value)}
                  placeholder="Chrome"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#848E9C]">Operating System</Label>
                <Input
                  value={filters.os}
                  onChange={(e) => updateFilter('os', e.target.value)}
                  placeholder="Windows"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Ranges */}
        <div className="border border-[#2B3139] rounded-lg">
          <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#23262F]"
            onClick={() => toggleSection('custom')}
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#F0B90B]" />
              <span className="text-sm font-medium text-[#EAECEF]">Custom Ranges</span>
            </div>
            {expandedSections.custom ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          {expandedSections.custom && (
            <div className="p-3 border-t border-[#2B3139] space-y-3">
              {filters.customRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={range.field}
                    onChange={(e) => {
                      const newRanges = [...filters.customRanges];
                      newRanges[index].field = e.target.value;
                      updateFilter('customRanges', newRanges);
                    }}
                    placeholder="Field name"
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <Input
                    type="number"
                    value={range.min}
                    onChange={(e) => {
                      const newRanges = [...filters.customRanges];
                      newRanges[index].min = parseInt(e.target.value) || 0;
                      updateFilter('customRanges', newRanges);
                    }}
                    placeholder="Min"
                    className="w-20 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-[#848E9C]">to</span>
                  <Input
                    type="number"
                    value={range.max}
                    onChange={(e) => {
                      const newRanges = [...filters.customRanges];
                      newRanges[index].max = parseInt(e.target.value) || 0;
                      updateFilter('customRanges', newRanges);
                    }}
                    placeholder="Max"
                    className="w-20 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newRanges = filters.customRanges.filter((_, i) => i !== index);
                      updateFilter('customRanges', newRanges);
                    }}
                    className="text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  updateFilter('customRanges', [
                    ...filters.customRanges,
                    { field: '', min: 0, max: 0 }
                  ]);
                }}
                className="w-full border-[#2B3139] text-[#EAECEF]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Range
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-[#2B3139] p-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-[#2B3139] text-[#EAECEF]">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1E2329] border-[#2B3139]">
                {savedFilters.length === 0 ? (
                  <DropdownMenuItem disabled className="text-[#848E9C]">
                    No saved filters
                  </DropdownMenuItem>
                ) : (
                  savedFilters.map((filter) => (
                    <DropdownMenuItem
                      key={filter.id}
                      className="flex items-center justify-between"
                      onClick={() => onLoadSavedFilter(filter)}
                    >
                      <span className="text-[#EAECEF]">{filter.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSavedFilter(filter.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              className="border-[#2B3139] text-[#EAECEF]"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Current Filters
            </Button>
          </div>
          <div className="text-xs text-[#848E9C]">
            {Object.values(filters).filter(v => 
              Array.isArray(v) ? v.length > 0 : 
              typeof v === 'string' ? v !== '' : 
              typeof v === 'number' ? v > 0 : 
              v !== null && v !== false
            ).length} active filters
          </div>
        </div>
      </CardFooter>

      {/* Save Filter Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-[#1E2329] border-[#F0B90B]">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B]">Save Filter</DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Enter a name for this filter to save it for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#848E9C]">Filter Name</Label>
              <Input
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
                placeholder="e.g., VIP Users, High Risk, Pending KYC"
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="border-[#2B3139] text-[#EAECEF]"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(saveFilterName);
                  setShowSaveDialog(false);
                  setSaveFilterName('');
                }}
                disabled={!saveFilterName.trim()}
                className="bg-[#F0B90B] hover:bg-yellow-400 text-black"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Filter
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ==================== EXPORT OPTIONS COMPONENT ====================
const ExportOptions = ({
  users,
  onExport,
  onClose,
}: {
  users: User[];
  onExport: (format: string, options: ExportOptions) => void;
  onClose: () => void;
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeFields, setIncludeFields] = useState({
    personal: true,
    contact: true,
    account: true,
    financial: true,
    activity: true,
    compliance: true,
    technical: true,
  });
  const [dateRange, setDateRange] = useState('all');
  const [fileName, setFileName] = useState(`users_export_${format(new Date(), 'yyyyMMdd_HHmmss')}`);
  const [compression, setCompression] = useState(false);
  const [encryption, setEncryption] = useState(false);
  const [password, setPassword] = useState('');

  const handleExport = () => {
    onExport(exportFormat, {
      includeFields,
      dateRange,
      fileName,
      compression,
      encryption,
      password: encryption ? password : undefined,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2329] border-[#F0B90B] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#F0B90B]">Export Options</DialogTitle>
          <DialogDescription className="text-[#848E9C]">
            Configure export settings for {users.length} users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-[#848E9C]">Export Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-[#848E9C]">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-[#848E9C]">File Name</Label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>

          <div>
            <Label className="text-xs text-[#848E9C] mb-2 block">Include Fields</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.personal}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, personal: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Personal</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.contact}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, contact: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Contact</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.account}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, account: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Account</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.financial}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, financial: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Financial</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.activity}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, activity: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Activity</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.compliance}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, compliance: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Compliance</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={includeFields.technical}
                  onCheckedChange={(checked) => setIncludeFields(prev => ({ ...prev, technical: checked }))}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
                <Label className="text-xs text-[#EAECEF]">Technical</Label>
              </div>
            </div>
          </div>

          <Separator className="bg-[#2B3139]" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-[#848E9C]">Advanced Options</Label>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#EAECEF]">Compress File</Label>
                <Switch
                  checked={compression}
                  onCheckedChange={setCompression}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#EAECEF]">Encrypt File</Label>
                <Switch
                  checked={encryption}
                  onCheckedChange={setEncryption}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </div>
              {encryption && (
                <div>
                  <Label className="text-xs text-[#848E9C]">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#2B3139] text-[#EAECEF]">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            Export {users.length} Users
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    accountNumber: '',
    accountType: [],
    status: [],
    kycStatus: [],
    role: [],
    minBalance: 0,
    maxBalance: 0,
    minDeposits: 0,
    maxDeposits: 0,
    minWithdrawals: 0,
    maxWithdrawals: 0,
    minTrades: 0,
    maxTrades: 0,
    minCreditScore: 0,
    maxCreditScore: 0,
    minIncome: 0,
    maxIncome: 0,
    minNetWorth: 0,
    maxNetWorth: 0,
    registrationStart: null,
    registrationEnd: null,
    lastLoginStart: null,
    lastLoginEnd: null,
    lastActiveDays: null,
    hasTwoFactor: null,
    hasTrades: null,
    hasDeposits: null,
    hasWithdrawals: null,
    hasKyc: null,
    riskTolerance: [],
    investmentExperience: [],
    investmentGoal: [],
    tags: [],
    ipAddress: '',
    deviceType: [],
    browser: '',
    os: '',
    isAdmin: null,
    isVerified: null,
    isActive: null,
    customRanges: [],
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [fundsModal, setFundsModal] = useState<{ user: User; type: 'add' | 'withdraw' } | null>(null);
  const [fundsAmount, setFundsAmount] = useState(0);
  const [pendingTxModal, setPendingTxModal] = useState<User | null>(null);
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [tradeHistoryModal, setTradeHistoryModal] = useState<User | null>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [auditLogModal, setAuditLogModal] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [kycModal, setKycModal] = useState<{ user: User; kyc: any } | null>(null);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof User>('registrationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Load users from API on mount and refresh
  const loadUsers = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(mockUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    
    // Load saved filters from localStorage
    const saved = localStorage.getItem('savedUserFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and sort users
  useEffect(() => {
    let filtered = [...users];

    // Basic search
    if (search) {
      filtered = filtered.filter(u =>
        u.firstName.toLowerCase().includes(search.toLowerCase()) ||
        u.lastName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.accountNumber?.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.toLowerCase().includes(search.toLowerCase()) ||
        u.address?.city?.toLowerCase().includes(search.toLowerCase()) ||
        u.address?.state?.toLowerCase().includes(search.toLowerCase()) ||
        u.address?.country?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    // KYC filter
    if (kycFilter !== 'all') {
      filtered = filtered.filter(u => u.kycStatus === kycFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => {
        const role = u.adminRole || (u.isAdmin ? 'admin' : 'user');
        return role === roleFilter;
      });
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(u => 
        new Date(u.registrationDate).toISOString().split('T')[0] === dateFilter
      );
    }

    // Advanced filters
    if (showAdvancedSearch) {
      // Personal info filters
      if (advancedFilters.firstName) {
        filtered = filtered.filter(u => 
          u.firstName.toLowerCase().includes(advancedFilters.firstName.toLowerCase())
        );
      }
      if (advancedFilters.lastName) {
        filtered = filtered.filter(u => 
          u.lastName.toLowerCase().includes(advancedFilters.lastName.toLowerCase())
        );
      }
      if (advancedFilters.email) {
        filtered = filtered.filter(u => 
          u.email.toLowerCase().includes(advancedFilters.email.toLowerCase())
        );
      }
      if (advancedFilters.phone) {
        filtered = filtered.filter(u => 
          u.phone?.toLowerCase().includes(advancedFilters.phone.toLowerCase())
        );
      }

      // Address filters
      if (advancedFilters.street) {
        filtered = filtered.filter(u => 
          u.address?.street?.toLowerCase().includes(advancedFilters.street.toLowerCase())
        );
      }
      if (advancedFilters.city) {
        filtered = filtered.filter(u => 
          u.address?.city?.toLowerCase().includes(advancedFilters.city.toLowerCase())
        );
      }
      if (advancedFilters.state) {
        filtered = filtered.filter(u => 
          u.address?.state?.toLowerCase().includes(advancedFilters.state.toLowerCase())
        );
      }
      if (advancedFilters.zipCode) {
        filtered = filtered.filter(u => 
          u.address?.zipCode?.toLowerCase().includes(advancedFilters.zipCode.toLowerCase())
        );
      }
      if (advancedFilters.country) {
        filtered = filtered.filter(u => 
          u.address?.country?.toLowerCase().includes(advancedFilters.country.toLowerCase())
        );
      }

      // Account filters
      if (advancedFilters.accountNumber) {
        filtered = filtered.filter(u => 
          u.accountNumber?.toLowerCase().includes(advancedFilters.accountNumber.toLowerCase())
        );
      }
      if (advancedFilters.accountType.length > 0) {
        filtered = filtered.filter(u => 
          advancedFilters.accountType.includes(u.accountType || '')
        );
      }
      if (advancedFilters.status.length > 0) {
        filtered = filtered.filter(u => 
          advancedFilters.status.includes(u.status)
        );
      }
      if (advancedFilters.kycStatus.length > 0) {
        filtered = filtered.filter(u => 
          advancedFilters.kycStatus.includes(u.kycStatus)
        );
      }
      if (advancedFilters.role.length > 0) {
        filtered = filtered.filter(u => {
          const role = u.adminRole || (u.isAdmin ? 'admin' : 'user');
          return advancedFilters.role.includes(role);
        });
      }
      if (advancedFilters.isAdmin !== null) {
        filtered = filtered.filter(u => u.isAdmin === advancedFilters.isAdmin);
      }
      if (advancedFilters.isVerified !== null) {
        filtered = filtered.filter(u => u.kycStatus === 'Verified' === advancedFilters.isVerified);
      }
      if (advancedFilters.isActive !== null) {
        filtered = filtered.filter(u => u.status === 'Active' === advancedFilters.isActive);
      }

      // Financial filters
      if (advancedFilters.minBalance > 0) {
        filtered = filtered.filter(u => u.balance >= advancedFilters.minBalance);
      }
      if (advancedFilters.maxBalance > 0) {
        filtered = filtered.filter(u => u.balance <= advancedFilters.maxBalance);
      }
      if (advancedFilters.minDeposits > 0) {
        filtered = filtered.filter(u => (u.totalDeposits || 0) >= advancedFilters.minDeposits);
      }
      if (advancedFilters.maxDeposits > 0) {
        filtered = filtered.filter(u => (u.totalDeposits || 0) <= advancedFilters.maxDeposits);
      }
      if (advancedFilters.minWithdrawals > 0) {
        filtered = filtered.filter(u => (u.totalWithdrawals || 0) >= advancedFilters.minWithdrawals);
      }
      if (advancedFilters.maxWithdrawals > 0) {
        filtered = filtered.filter(u => (u.totalWithdrawals || 0) <= advancedFilters.maxWithdrawals);
      }
      if (advancedFilters.minTrades > 0) {
        filtered = filtered.filter(u => (u.totalTrades || 0) >= advancedFilters.minTrades);
      }
      if (advancedFilters.maxTrades > 0) {
        filtered = filtered.filter(u => (u.totalTrades || 0) <= advancedFilters.maxTrades);
      }
      if (advancedFilters.minCreditScore > 0) {
        filtered = filtered.filter(u => (u.creditScore || 0) >= advancedFilters.minCreditScore);
      }
      if (advancedFilters.maxCreditScore > 0) {
        filtered = filtered.filter(u => (u.creditScore || 0) <= advancedFilters.maxCreditScore);
      }
      if (advancedFilters.minIncome > 0) {
        filtered = filtered.filter(u => (u.annualIncome || 0) >= advancedFilters.minIncome);
      }
      if (advancedFilters.maxIncome > 0) {
        filtered = filtered.filter(u => (u.annualIncome || 0) <= advancedFilters.maxIncome);
      }
      if (advancedFilters.minNetWorth > 0) {
        filtered = filtered.filter(u => (u.netWorth || 0) >= advancedFilters.minNetWorth);
      }
      if (advancedFilters.maxNetWorth > 0) {
        filtered = filtered.filter(u => (u.netWorth || 0) <= advancedFilters.maxNetWorth);
      }

      // Date filters
      if (advancedFilters.registrationStart) {
        filtered = filtered.filter(u => 
          new Date(u.registrationDate) >= advancedFilters.registrationStart!
        );
      }
      if (advancedFilters.registrationEnd) {
        filtered = filtered.filter(u => 
          new Date(u.registrationDate) <= advancedFilters.registrationEnd!
        );
      }
      if (advancedFilters.lastLoginStart) {
        filtered = filtered.filter(u => 
          new Date(u.lastLogin) >= advancedFilters.lastLoginStart!
        );
      }
      if (advancedFilters.lastLoginEnd) {
        filtered = filtered.filter(u => 
          new Date(u.lastLogin) <= advancedFilters.lastLoginEnd!
        );
      }
      if (advancedFilters.lastActiveDays) {
        const cutoff = subDays(new Date(), advancedFilters.lastActiveDays);
        filtered = filtered.filter(u => new Date(u.lastLogin) >= cutoff);
      }

      // Activity filters
      if (advancedFilters.hasTwoFactor !== null) {
        filtered = filtered.filter(u => u.twoFactorEnabled === advancedFilters.hasTwoFactor);
      }
      if (advancedFilters.hasTrades !== null) {
        filtered = filtered.filter(u => (u.totalTrades || 0) > 0 === advancedFilters.hasTrades);
      }
      if (advancedFilters.hasDeposits !== null) {
        filtered = filtered.filter(u => (u.totalDeposits || 0) > 0 === advancedFilters.hasDeposits);
      }
      if (advancedFilters.hasWithdrawals !== null) {
        filtered = filtered.filter(u => (u.totalWithdrawals || 0) > 0 === advancedFilters.hasWithdrawals);
      }
      if (advancedFilters.hasKyc !== null) {
        filtered = filtered.filter(u => (u.kycDocuments?.length || 0) > 0 === advancedFilters.hasKyc);
      }

      // Risk & compliance filters
      if (advancedFilters.riskTolerance.length > 0) {
        filtered = filtered.filter(u => 
          u.riskTolerance && advancedFilters.riskTolerance.includes(u.riskTolerance)
        );
      }
      if (advancedFilters.investmentExperience.length > 0) {
        filtered = filtered.filter(u => 
          u.investmentExperience && advancedFilters.investmentExperience.includes(u.investmentExperience)
        );
      }
      if (advancedFilters.investmentGoal.length > 0) {
        filtered = filtered.filter(u => 
          u.investmentGoal && advancedFilters.investmentGoal.includes(u.investmentGoal)
        );
      }
      if (advancedFilters.tags.length > 0) {
        filtered = filtered.filter(u => 
          advancedFilters.tags.some(tag => u.tags?.includes(tag))
        );
      }

      // Technical filters
      if (advancedFilters.ipAddress) {
        // This would need actual IP data
      }
      if (advancedFilters.deviceType.length > 0) {
        // This would need actual device data
      }
      if (advancedFilters.browser) {
        // This would need actual browser data
      }
      if (advancedFilters.os) {
        // This would need actual OS data
      }

      // Custom ranges
      advancedFilters.customRanges.forEach(range => {
        if (range.field && range.min > 0) {
          filtered = filtered.filter(u => (u as any)[range.field] >= range.min);
        }
        if (range.field && range.max > 0) {
          filtered = filtered.filter(u => (u as any)[range.field] <= range.max);
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, search, statusFilter, kycFilter, roleFilter, dateFilter, sortField, sortDirection, advancedFilters, showAdvancedSearch]);

  // Calculate statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const pendingKyc = users.filter(u => u.kycStatus === 'Pending').length;
  const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);

  // Bulk selection handlers
  const allSelected = selectedIds.length > 0 && filteredUsers.every(u => selectedIds.includes(u.id));
  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredUsers.map(u => u.id));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    try {
      if (action === 'activate') {
        setUsers(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, status: 'Active' } : u));
        toast({ title: "Users Activated", description: `${selectedIds.length} users have been activated.` });
      }
      if (action === 'suspend') {
        setUsers(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, status: 'Suspended' } : u));
        toast({ title: "Users Suspended", description: `${selectedIds.length} users have been suspended.` });
      }
      if (action.startsWith('role:')) {
        const role = action.split(':')[1] as any;
        setUsers(prev => prev.map(u => selectedIds.includes(u.id) ? { ...u, adminRole: role, isAdmin: !!role } : u));
        toast({ title: "Roles Updated", description: `${selectedIds.length} users have been assigned new roles.` });
      }
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Bulk Action Failed",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  };

  // Export users to multiple formats
  const handleExport = (format: string, options: any) => {
    const dataToExport = filteredUsers.map(u => {
      const data: any = {};
      
      if (options.includeFields.personal) {
        data.firstName = u.firstName;
        data.lastName = u.lastName;
      }
      if (options.includeFields.contact) {
        data.email = u.email;
        data.phone = u.phone;
      }
      if (options.includeFields.account) {
        data.accountNumber = u.accountNumber;
        data.accountType = u.accountType;
        data.status = u.status;
        data.kycStatus = u.kycStatus;
        data.role = u.adminRole || (u.isAdmin ? 'admin' : 'user');
      }
      if (options.includeFields.financial) {
        data.balance = u.balance;
        data.totalDeposits = u.totalDeposits;
        data.totalWithdrawals = u.totalWithdrawals;
        data.totalTrades = u.totalTrades;
        data.winRate = u.winRate;
        data.creditScore = u.creditScore;
        data.annualIncome = u.annualIncome;
        data.netWorth = u.netWorth;
      }
      if (options.includeFields.activity) {
        data.registrationDate = u.registrationDate;
        data.lastLogin = u.lastLogin;
        data.twoFactorEnabled = u.twoFactorEnabled;
      }
      if (options.includeFields.compliance) {
        data.kycDocuments = u.kycDocuments?.join(', ');
        data.riskTolerance = u.riskTolerance;
        data.investmentExperience = u.investmentExperience;
        data.investmentGoal = u.investmentGoal;
        data.tags = u.tags?.join(', ');
      }
      if (options.includeFields.technical) {
        // Add technical fields if available
      }
      
      return data;
    });

    switch (format) {
      case 'csv':
        exportCSV(dataToExport, options.fileName);
        break;
      case 'excel':
        exportExcel(dataToExport, options.fileName);
        break;
      case 'json':
        exportJSON(dataToExport, options.fileName);
        break;
      case 'pdf':
        exportPDF(dataToExport, options.fileName);
        break;
    }

    toast({
      title: "Export Complete",
      description: `${filteredUsers.length} users exported to ${format.toUpperCase()}.`,
    });

    setShowExportOptions(false);
  };

  const exportCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = (data: any[], filename: string) => {
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h]?.toString() || ''));
    
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [240, 185, 11] },
    });
    
    doc.save(`${filename}.pdf`);
  };

  // Save filter
  const handleSaveFilter = (name: string) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters: advancedFilters,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    };
    
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedUserFilters', JSON.stringify(updated));
    
    toast({
      title: "Filter Saved",
      description: `Filter "${name}" has been saved successfully.`,
    });
  };

  const handleLoadSavedFilter = (filter: SavedFilter) => {
    setAdvancedFilters(filter.filters);
    setShowAdvancedSearch(true);
    toast({
      title: "Filter Loaded",
      description: `Loaded filter: ${filter.name}`,
    });
  };

  const handleDeleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedUserFilters', JSON.stringify(updated));
    
    toast({
      title: "Filter Deleted",
      description: "Saved filter has been removed.",
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setKycFilter('all');
    setRoleFilter('all');
    setDateFilter('');
    setAdvancedFilters({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      accountNumber: '',
      accountType: [],
      status: [],
      kycStatus: [],
      role: [],
      minBalance: 0,
      maxBalance: 0,
      minDeposits: 0,
      maxDeposits: 0,
      minWithdrawals: 0,
      maxWithdrawals: 0,
      minTrades: 0,
      maxTrades: 0,
      minCreditScore: 0,
      maxCreditScore: 0,
      minIncome: 0,
      maxIncome: 0,
      minNetWorth: 0,
      maxNetWorth: 0,
      registrationStart: null,
      registrationEnd: null,
      lastLoginStart: null,
      lastLoginEnd: null,
      lastActiveDays: null,
      hasTwoFactor: null,
      hasTrades: null,
      hasDeposits: null,
      hasWithdrawals: null,
      hasKyc: null,
      riskTolerance: [],
      investmentExperience: [],
      investmentGoal: [],
      tags: [],
      ipAddress: '',
      deviceType: [],
      browser: '',
      os: '',
      isAdmin: null,
      isVerified: null,
      isActive: null,
      customRanges: [],
    });
    toast({
      title: "Filters Cleared",
      description: "All search filters have been reset.",
    });
  };

  // User actions
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSave = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleSuspend = (user: User) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    toast({
      title: newStatus === 'Active' ? "User Activated" : "User Suspended",
      description: `${user.firstName} ${user.lastName} has been ${newStatus === 'Active' ? 'activated' : 'suspended'}.`,
    });
  };

  const handleDelete = (user: User) => {
    if (!isSuperAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only super admins can delete users.",
        variant: "destructive",
      });
      return;
    }
    
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast({
      title: "User Deleted",
      description: `${user.firstName} ${user.lastName} has been removed.`,
    });
  };

  // Admin financial actions
  const handleForceWin = async (userId: string) => {
    try {
      await apiService.setUserTradesWinLoss(userId, 'win');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, winRate: (u.winRate || 0) + 10 } : u));
      toast({ title: "Force Win Applied", description: "All trades for this user are now wins." });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to apply force win",
        variant: "destructive",
      });
    }
  };

  const handleForceLoss = async (userId: string) => {
    try {
      await apiService.setUserTradesWinLoss(userId, 'loss');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, winRate: (u.winRate || 0) - 10 } : u));
      toast({ title: "Force Loss Applied", description: "All trades for this user are now losses." });
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to apply force loss",
        variant: "destructive",
      });
    }
  };

  const handleAddFunds = async () => {
    if (fundsModal) {
      try {
        await apiService.addFundsToUser(fundsModal.user.id, fundsAmount);
        setUsers(us => us.map(u => u.id === fundsModal.user.id ? { ...u, balance: u.balance + fundsAmount } : u));
        toast({
          title: "Funds Added",
          description: `${fundsAmount} USDT added to ${fundsModal.user.firstName}'s wallet.`,
        });
      } catch (error) {
        toast({
          title: "Failed to Add Funds",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setFundsModal(null);
        setFundsAmount(0);
      }
    }
  };

  const handleWithdrawFunds = async () => {
    if (fundsModal) {
      try {
        await apiService.withdrawFundsFromUser(fundsModal.user.id, fundsAmount);
        setUsers(us => us.map(u => u.id === fundsModal.user.id ? { ...u, balance: Math.max(0, u.balance - fundsAmount) } : u));
        toast({
          title: "Funds Withdrawn",
          description: `${fundsAmount} USDT withdrawn from ${fundsModal.user.firstName}'s wallet.`,
        });
      } catch (error) {
        toast({
          title: "Failed to Withdraw Funds",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setFundsModal(null);
        setFundsAmount(0);
      }
    }
  };

  // Modal handlers
  const openFundsModal = (user: User, type: 'add' | 'withdraw') => {
    setFundsModal({ user, type });
    setFundsAmount(0);
  };

  const openPendingTxModal = async (user: User) => {
    try {
      const txs = (await apiService.getTransactions()).filter(
        (t: any) => t.userId === user.id && (t.type === 'Deposit' || t.type === 'Withdrawal') && t.status === 'Pending'
      );
      setPendingTx(txs);
      setPendingTxModal(user);
    } catch (error) {
      toast({
        title: "Failed to Load Transactions",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleApproveTx = async (txId: string) => {
    try {
      await apiService.approveTransaction(txId, 'approved');
      setPendingTx(txs => txs.filter(t => t.id !== txId));
      toast({ title: "Transaction Approved" });
    } catch (error) {
      toast({
        title: "Failed to Approve",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectTx = async (txId: string) => {
    try {
      await apiService.approveTransaction(txId, 'rejected');
      setPendingTx(txs => txs.filter(t => t.id !== txId));
      toast({ title: "Transaction Rejected" });
    } catch (error) {
      toast({
        title: "Failed to Reject",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const openTradeHistoryModal = async (user: User) => {
    setLoadingHistory(true);
    setTradeHistoryModal(user);
    try {
      const txs = (await apiService.getTransactions()).filter(
        (t: any) => t.userId === user.id && (t.type === 'Buy' || t.type === 'Sell' || t.type === 'trade')
      );
      setTradeHistory(txs);
    } catch (error) {
      setTradeHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openAuditLogModal = (user: User) => {
    setLoadingAudit(true);
    setAuditLogModal(user);
    // Mock data - replace with actual API call
    setTimeout(() => {
      setAuditLogs([
        { action: 'Funds Added', amount: 1000, date: '2024-07-15', by: 'admin.sarah' },
        { action: 'Force Win', date: '2024-07-14', by: 'admin.john' },
        { action: 'KYC Approved', date: '2024-07-13', by: 'superadmin' },
        { action: 'Account Updated', date: '2024-07-12', by: 'admin.sarah' },
        { action: 'Password Changed', date: '2024-07-11', by: 'user' },
      ]);
      setLoadingAudit(false);
    }, 400);
  };

  const openKycModal = async (user: User) => {
    setLoadingKyc(true);
    setKycError(null);
    try {
      const kyc = await apiService.getUserKyc(user.id);
      setKycModal({ user, kyc });
    } catch (e) {
      setKycError('Failed to load KYC details.');
      setKycModal({ user, kyc: null });
    } finally {
      setLoadingKyc(false);
    }
  };

  return (
    <motion.div 
      className="space-y-6 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#EAECEF]">User Management</h2>
            {pendingKyc > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {pendingKyc} KYC Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#848E9C] mt-1">
            Manage users, roles, and account settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadUsers} 
            disabled={loading}
            className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => setShowExportOptions(true)}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          trend={totalUsers > 0 ? 'up' : undefined}
          trendValue={`+${totalUsers - 3} this month`}
        />
        <StatsCard
          title="Active Users"
          value={activeUsers}
          icon={UserCheck}
          subtitle={`${((activeUsers / totalUsers) * 100).toFixed(1)}% of total`}
        />
        <StatsCard
          title="Pending KYC"
          value={pendingKyc}
          icon={Clock}
          trend={pendingKyc > 0 ? 'up' : 'down'}
          trendValue={`${pendingKyc} awaiting review`}
        />
        <StatsCard
          title="Total Balance"
          value={`$${totalBalance.toLocaleString()}`}
          icon={Wallet}
          subtitle="Across all accounts"
        />
      </div>

      {/* Filters Card */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#F0B90B]" />
              <CardTitle className="text-[#EAECEF]">Filters</CardTitle>
              <CardDescription className="text-[#848E9C]">
                ({filteredUsers.length} of {users.length} users)
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-[#848E9C]">
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Quick Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
                  <Input
                    placeholder="Name, email, account..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF] placeholder:text-[#5E6673]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">KYC Status</Label>
                <Select value={kycFilter} onValueChange={setKycFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All KYC</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-[#848E9C]">Registration Date</Label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="w-full border-[#2B3139] text-[#EAECEF]"
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  {showAdvancedSearch ? 'Hide Advanced' : 'Advanced Search'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Advanced Search */}
      {showAdvancedSearch && (
        <AdvancedSearchFilters
          filters={advancedFilters}
          onFilterChange={setAdvancedFilters}
          onApply={() => {
            setShowAdvancedSearch(false);
            toast({
              title: "Filters Applied",
              description: "Advanced search filters have been applied.",
            });
          }}
          onClear={handleClearFilters}
          onSave={handleSaveFilter}
          savedFilters={savedFilters}
          onLoadSavedFilter={handleLoadSavedFilter}
          onDeleteSavedFilter={handleDeleteSavedFilter}
        />
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <Card className="bg-[#F0B90B]/10 border border-[#F0B90B]/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCheck className="h-5 w-5 text-[#F0B90B]" />
                <span className="text-sm text-[#EAECEF]">
                  {selectedIds.length} user{selectedIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('activate')}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('suspend')}>
                  <UserMinus className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      Assign Role
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkAction('role:')}>Standard User</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('role:admin')}>Admin</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('role:finance')}>Finance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('role:support')}>Support</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isSuperAdmin && (
                  <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#F0B90B]" />
              <CardTitle className="text-[#EAECEF]">Users</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={`${sortField}-${sortDirection}`} 
                onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  setSortField(field as keyof User);
                  setSortDirection(direction as 'asc' | 'desc');
                }}
              >
                <SelectTrigger className="w-48 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registrationDate-desc">Newest First</SelectItem>
                  <SelectItem value="registrationDate-asc">Oldest First</SelectItem>
                  <SelectItem value="lastLogin-desc">Last Login (Recent)</SelectItem>
                  <SelectItem value="balance-desc">Balance (High-Low)</SelectItem>
                  <SelectItem value="balance-asc">Balance (Low-High)</SelectItem>
                  <SelectItem value="creditScore-desc">Credit Score (High-Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <CardDescription className="text-[#848E9C]">
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-[#F0B90B] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2B3139]">
                    <th className="pb-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="rounded border-[#2B3139] bg-[#181A20] text-[#F0B90B]"
                      />
                    </th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">User</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Contact</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Status</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">KYC</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Role</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Balance</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Credit</th>
                    <th className="pb-3 text-left text-[#F0B90B] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#2B3139] hover:bg-[#23262F] transition-colors">
                      <td className="py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={() => handleSelect(user.id)}
                          className="rounded border-[#2B3139] bg-[#181A20] text-[#F0B90B]"
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div>
                            <div className="font-medium text-[#EAECEF]">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-[#848E9C]">{user.accountNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-[#EAECEF]">
                            <Mail className="h-3 w-3 text-[#848E9C]" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[#EAECEF]">
                            <Phone className="h-3 w-3 text-[#848E9C]" />
                            {user.phone || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge className={
                          user.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          user.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <KycBadge status={user.kycStatus} />
                      </td>
                      <td className="py-3">
                        <RoleBadge role={user.adminRole} isAdmin={user.isAdmin} />
                      </td>
                      <td className="py-3">
                        <div className="font-mono text-[#EAECEF]">
                          ${user.balance.toLocaleString()}
                        </div>
                        <div className="text-xs text-[#848E9C]">
                          {user.totalTrades || 0} trades
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[#EAECEF]">{user.creditScore || 0}</span>
                          <div className="w-16">
                            <Progress 
                              value={((user.creditScore || 0) / 850) * 100} 
                              className="h-1 bg-[#2B3139]" 
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                            onClick={() => setViewingUser(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#848E9C] hover:text-[#F0B90B]"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleSuspend(user)}>
                                {user.status === 'Active' ? (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate User
                                  </>
                                )}
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuItem onClick={() => handleForceWin(user.id)}>
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Force Win
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleForceLoss(user.id)}>
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    Force Loss
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openFundsModal(user, 'add')}>
                                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                                    Add Funds
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openFundsModal(user, 'withdraw')}>
                                    <ArrowUpRight className="h-4 w-4 mr-2" />
                                    Withdraw Funds
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openPendingTxModal(user)}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Pending Transactions
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => openTradeHistoryModal(user)}>
                                <History className="h-4 w-4 mr-2" />
                                Trade History
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openAuditLogModal(user)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Audit Logs
                              </DropdownMenuItem>
                              {user.kycDocuments && user.kycDocuments.length > 0 && (
                                <DropdownMenuItem onClick={() => openKycModal(user)}>
                                  <Fingerprint className="h-4 w-4 mr-2" />
                                  View KYC
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {isSuperAdmin && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(user)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options Modal */}
      {showExportOptions && (
        <ExportOptions
          users={filteredUsers}
          onExport={handleExport}
          onClose={() => setShowExportOptions(false)}
        />
      )}

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1E2329] border border-[#F0B90B]">
          <DialogHeader>
            <DialogTitle className="text-[#F0B90B]">Edit User</DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSave={handleSave}
              onCancel={() => {
                setEditModalOpen(false);
                setSelectedUser(null);
              }}
              isSuperAdmin={isSuperAdmin}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Modal */}
      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {/* Funds Modal */}
      {fundsModal && (
        <Dialog open={!!fundsModal} onOpenChange={() => setFundsModal(null)}>
          <DialogContent className="max-w-md bg-[#1E2329] border border-[#F0B90B]">
            <DialogHeader>
              <DialogTitle className="text-[#F0B90B]">
                {fundsModal.type === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </DialogTitle>
              <DialogDescription className="text-[#848E9C]">
                {fundsModal.type === 'add' ? 'Add funds to' : 'Withdraw funds from'} {fundsModal.user.firstName}'s wallet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-[#848E9C]">Amount (USDT)</Label>
                <Input
                  type="number"
                  value={fundsAmount}
                  onChange={(e) => setFundsAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="bg-[#181A20] rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#848E9C]">Current Balance</span>
                  <span className="text-[#EAECEF] font-mono">${fundsModal.user.balance.toLocaleString()}</span>
                </div>
                {fundsAmount > 0 && (
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#2B3139]">
                    <span className="text-[#848E9C]">New Balance</span>
                    <span className="text-[#EAECEF] font-mono">
                      ${(fundsModal.type === 'add' 
                        ? fundsModal.user.balance + fundsAmount 
                        : Math.max(0, fundsModal.user.balance - fundsAmount)
                      ).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={() => setFundsModal(null)} className="border-[#2B3139] text-[#EAECEF]">
                  Cancel
                </Button>
                <Button 
                  onClick={fundsModal.type === 'add' ? handleAddFunds : handleWithdrawFunds}
                  disabled={fundsAmount <= 0}
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
                >
                  {fundsModal.type === 'add' ? 'Add Funds' : 'Withdraw Funds'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Pending Transactions Modal */}
      {pendingTxModal && (
        <Dialog open={!!pendingTxModal} onOpenChange={() => setPendingTxModal(null)}>
          <DialogContent className="max-w-2xl bg-[#1E2329] border border-[#F0B90B]">
            <DialogHeader>
              <DialogTitle className="text-[#F0B90B]">
                Pending Transactions
              </DialogTitle>
              <DialogDescription className="text-[#848E9C]">
                {pendingTxModal.firstName} {pendingTxModal.lastName} - Awaiting approval
              </DialogDescription>
            </DialogHeader>
            {pendingTx.length === 0 ? (
              <div className="text-center py-8 text-[#848E9C]">
                No pending transactions
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2B3139]">
                        <th className="pb-2 text-left text-[#F0B90B]">ID</th>
                        <th className="pb-2 text-left text-[#F0B90B]">Type</th>
                        <th className="pb-2 text-left text-[#F0B90B]">Amount</th>
                        <th className="pb-2 text-left text-[#F0B90B]">Date</th>
                        <th className="pb-2 text-left text-[#F0B90B]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTx.map((tx) => (
                        <tr key={tx.id} className="border-b border-[#2B3139]">
                          <td className="py-2 text-[#EAECEF] font-mono text-xs">{tx.id}</td>
                          <td className="py-2">
                            <Badge className={tx.type === 'Deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="py-2 text-[#EAECEF]">${tx.amount}</td>
                          <td className="py-2 text-[#848E9C] text-xs">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleApproveTx(tx.id)} className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" onClick={() => handleRejectTx(tx.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingTxModal(null)} className="border-[#2B3139] text-[#EAECEF]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Trade History Modal */}
      {tradeHistoryModal && (
        <Dialog open={!!tradeHistoryModal} onOpenChange={() => setTradeHistoryModal(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#1E2329] border border-[#F0B90B]">
            <DialogHeader>
              <DialogTitle className="text-[#F0B90B]">
                Trade History
              </DialogTitle>
              <DialogDescription className="text-[#848E9C]">
                {tradeHistoryModal.firstName} {tradeHistoryModal.lastName} - All trades
              </DialogDescription>
            </DialogHeader>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 text-[#F0B90B] animate-spin" />
              </div>
            ) : tradeHistory.length === 0 ? (
              <div className="text-center py-8 text-[#848E9C]">
                No trade history found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2B3139]">
                      <th className="pb-2 text-left text-[#F0B90B]">ID</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Type</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Asset</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Amount</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Price</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Total</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Status</th>
                      <th className="pb-2 text-left text-[#F0B90B]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#2B3139]">
                        <td className="py-2 text-[#EAECEF] font-mono text-xs">{tx.id}</td>
                        <td className="py-2">
                          <Badge className={tx.type === 'Buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-2 text-[#EAECEF]">{tx.asset}</td>
                        <td className="py-2 text-[#EAECEF]">{tx.amount}</td>
                        <td className="py-2 text-[#EAECEF]">${tx.price}</td>
                        <td className="py-2 text-[#EAECEF]">${tx.value}</td>
                        <td className="py-2">
                          <Badge className={
                            tx.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                            tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }>
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="py-2 text-[#848E9C] text-xs">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setTradeHistoryModal(null)} className="border-[#2B3139] text-[#EAECEF]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Audit Logs Modal */}
      {auditLogModal && (
        <Dialog open={!!auditLogModal} onOpenChange={() => setAuditLogModal(null)}>
          <DialogContent className="max-w-2xl bg-[#1E2329] border border-[#F0B90B]">
            <DialogHeader>
              <DialogTitle className="text-[#F0B90B]">
                Audit Logs
              </DialogTitle>
              <DialogDescription className="text-[#848E9C]">
                {auditLogModal.firstName} {auditLogModal.lastName} - Admin actions
              </DialogDescription>
            </DialogHeader>
            {loadingAudit ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 text-[#F0B90B] animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8 text-[#848E9C]">
                No audit logs found
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#181A20] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-[#F0B90B]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#EAECEF]">{log.action}</p>
                        <p className="text-xs text-[#848E9C]">by {log.by}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#EAECEF]">{log.date}</p>
                      {log.amount && <p className="text-xs text-[#848E9C]">${log.amount}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAuditLogModal(null)} className="border-[#2B3139] text-[#EAECEF]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* KYC Modal */}
      {kycModal && (
        <Dialog open={!!kycModal} onOpenChange={() => setKycModal(null)}>
          <DialogContent className="max-w-2xl bg-[#1E2329] border border-[#F0B90B]">
            <DialogHeader>
              <DialogTitle className="text-[#F0B90B]">
                KYC Documents
              </DialogTitle>
              <DialogDescription className="text-[#848E9C]">
                {kycModal.user.firstName} {kycModal.user.lastName} - Identity verification
              </DialogDescription>
            </DialogHeader>
            {loadingKyc ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 text-[#F0B90B] animate-spin" />
              </div>
            ) : kycError ? (
              <div className="text-center py-8 text-red-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                {kycError}
              </div>
            ) : kycModal.kyc ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">KYC Status</p>
                    <KycBadge status={kycModal.user.kycStatus} />
                  </div>
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Submitted At</p>
                    <p className="text-sm text-[#EAECEF]">{kycModal.kyc.submittedAt}</p>
                  </div>
                </div>
                
                {kycModal.kyc.verifiedAt && (
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C]">Verified At</p>
                    <p className="text-sm text-[#EAECEF]">{kycModal.kyc.verifiedAt}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-[#848E9C] mb-2">Documents</p>
                  <div className="space-y-2">
                    {kycModal.kyc.documents.map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#181A20] rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-[#F0B90B]" />
                          <div>
                            <p className="text-sm text-[#EAECEF] capitalize">{doc.type.replace('_', ' ')}</p>
                            <p className="text-xs text-[#848E9C]">Uploaded {doc.uploadedAt}</p>
                          </div>
                        </div>
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#F0B90B] hover:text-yellow-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {kycModal.kyc.notes && (
                  <div className="bg-[#181A20] rounded-lg p-3">
                    <p className="text-xs text-[#848E9C] mb-1">Notes</p>
                    <p className="text-sm text-[#EAECEF]">{kycModal.kyc.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[#848E9C]">
                No KYC details found
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setKycModal(null)} className="border-[#2B3139] text-[#EAECEF]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}