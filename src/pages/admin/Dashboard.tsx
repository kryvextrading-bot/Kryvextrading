import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, BarChart, Bar, AreaChart, Area
} from 'recharts';
import {
  Users, Shield, DollarSign, TrendingUp, Settings, Activity,
  AlertTriangle, CheckCircle, XCircle, Clock, Download, Filter,
  Search, Plus, Edit, Trash2, Save, RefreshCw, Eye, EyeOff,
  Home, Briefcase, CreditCard, Globe, Lock, UserCheck,
  Bell, Calendar, FileText, BarChart3, PieChart as PieChartIcon,
  ArrowUp, ArrowDown, ChevronRight, ChevronLeft, MoreHorizontal,
  Smartphone, Database, Cloud, Server, Cpu, Wifi, HardDrive,
  Zap, Copy, Upload, Download as DownloadIcon, Mail, MessageSquare,
  Phone, Headphones, Book, HelpCircle, Key, Fingerprint,
  ShieldAlert, ShieldCheck, AlertOctagon, Flag, Award, Star,
  Coffee, Moon, Sun, Monitor, Battery, Wind, Compass, Wallet
} from 'lucide-react';
import apiService from '@/services/api';
import { Investment, Transaction, User as UserType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import UserManagement from './UserManagementEnhanced';
import InvestmentAdminPanel from './InvestmentAdmin';
import TradingAdminPanel from './TradingAdmin';
import { TransactionManagement } from './TransactionManagement';
import { SystemSettings } from './SystemSettings';
import RolePermissions from './RolePermissions';
import WalletManagement from './WalletManagement';

// ==================== ADMIN SECTIONS ====================
const adminSections = [
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'wallet', label: 'Wallet Management', icon: Wallet },
  { key: 'finance', label: 'Financial', icon: DollarSign },
  { key: 'trading', label: 'Trading', icon: TrendingUp },
  { key: 'investment', label: 'Investment', icon: Briefcase },
  { key: 'platform', label: 'Platform', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// ==================== COLORS ====================
const COLORS = {
  primary: '#F0B90B',
  primaryDark: '#d4a10b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  background: '#181A20',
  card: '#1E2329',
  border: '#2B3139',
  text: '#EAECEF',
  textSecondary: '#848E9C',
  textMuted: '#5E6673',
};

const PIE_COLORS = ['#F0B90B', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444'];

// ==================== STATS CARD ====================
const StatsCard = ({ title, value, icon: Icon, change, changeType, subtitle, trend, trendValue }: any) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-[#848E9C]">{title}</p>
        <p className="text-xl font-bold text-[#EAECEF] mt-1">{value}</p>
        {subtitle && <p className="text-xs text-[#5E6673] mt-1">{subtitle}</p>}
        {change !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            changeType === 'positive' ? 'text-green-400' : 
            changeType === 'negative' ? 'text-red-400' : 'text-[#F0B90B]'
          }`}>
            {changeType === 'positive' && <ArrowUp size={12} />}
            {changeType === 'negative' && <ArrowDown size={12} />}
            <span>{change}</span>
          </div>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-[#F0B90B]'
          }`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {trend === 'down' && <TrendingDown size={12} />}
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

// ==================== MAIN ADMIN DASHBOARD ====================
export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  // Load real data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle URL parameters for tab navigation and specific item selection
  useEffect(() => {
    const tab = searchParams.get('tab');
    const userId = searchParams.get('userId');
    const tradeId = searchParams.get('tradeId');

    if (tab && adminSections.find(section => section.key === tab)) {
      setActiveTab(tab);
      
      // Handle specific item selection
      if (tab === 'users' && userId) {
        // Could trigger a modal or highlight specific user
        console.log('Viewing user:', userId);
      }
      if (tab === 'trading' && tradeId) {
        // Could trigger a modal or highlight specific trade
        console.log('Viewing trade:', tradeId);
      }
    }
  }, [searchParams]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [statsData, usersData, transactionsData, settingsData, auditData, securityData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getUsers(),
        apiService.getTransactions(),
        apiService.getSystemSettings(),
        apiService.getAuditLogs(),
        apiService.getSecurityEvents()
      ]);

      setStats(statsData);
      setUsers(usersData);
      setTransactions(transactionsData);
      setSettings(settingsData);
      setAuditLogs(auditData);
      setSecurityEvents(securityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20] p-4 sm:p-6 relative z-0">
      <div className="max-w-full mx-auto relative z-0">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#EAECEF]">Admin Dashboard</h1>
            <p className="text-sm sm:text-base text-[#848E9C]">Welcome back, {user?.first_name || 'Admin'}</p>
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-[#F0B90B] text-black hover:bg-yellow-400 w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Admin Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex bg-[#1E2329] p-1 sm:p-2 rounded-lg gap-1 sm:gap-2 min-w-max">
              {adminSections.map(section => (
                <TabsTrigger 
                  key={section.key} 
                  value={section.key} 
                  className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] text-xs px-2 py-2 sm:px-3 sm:py-3 h-auto flex flex-col items-center justify-center gap-1 whitespace-nowrap min-w-[60px] sm:min-w-[80px]"
                >
                  <section.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-center text-xs sm:text-xs hidden sm:inline">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents Container */}
          <div className="relative z-0 isolate px-0 sm:px-0">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-[#EAECEF]">Loading dashboard data...</span>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatsCard
                    title="Total Users"
                    value={stats.totalUsers?.toLocaleString() || '0'}
                    icon={Users}
                    change={stats.userGrowth}
                    changeType={stats.userGrowth > 0 ? 'positive' : 'negative'}
                    trend="up"
                    trendValue={`${Math.abs(stats.userGrowthRate || 0)}%`}
                  />
                  <StatsCard
                    title="Active Users"
                    value={stats.activeUsers?.toLocaleString() || '0'}
                    icon={Activity}
                    change={stats.activeUserGrowth}
                    changeType={stats.activeUserGrowth > 0 ? 'positive' : 'negative'}
                    trend="up"
                    trendValue={`${Math.abs(stats.activeUserGrowthRate || 0)}%`}
                  />
                  <StatsCard
                    title="Total Volume"
                    value={`$${stats.totalVolume?.toLocaleString() || '0'}`}
                    icon={DollarSign}
                    change={stats.volumeGrowth}
                    changeType={stats.volumeGrowth > 0 ? 'positive' : 'negative'}
                    trend="up"
                    trendValue={`${Math.abs(stats.volumeGrowthRate || 0)}%`}
                  />
                  <StatsCard
                    title="Success Rate"
                    value={`${stats.successRate?.toFixed(1) || '0'}%`}
                    icon={TrendingUp}
                    change={stats.successRateGrowth}
                    changeType={stats.successRateGrowth > 0 ? 'positive' : 'negative'}
                    trend="up"
                    trendValue={`${Math.abs(stats.successRateGrowthRate || 0)}%`}
                  />
                </div>
              ) : null}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            {/* Wallet Management Tab */}
            <TabsContent value="wallet">
              <WalletManagement />
            </TabsContent>

            {/* Finance Management Tab */}
            <TabsContent value="finance">
              <TransactionManagement />
            </TabsContent>

            {/* Trading Admin Tab */}
            <TabsContent value="trading">
              <TradingAdminPanel />
            </TabsContent>

            {/* Investment Admin Tab */}
            <TabsContent value="investment">
              <InvestmentAdminPanel />
            </TabsContent>

            {/* Platform Settings Tab */}
            <TabsContent value="platform">
              <SystemSettings />
            </TabsContent>

            {/* Security & Audit Tab */}
            <TabsContent value="security">
              <RolePermissions />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                <Card className="bg-[#1E2329] border border-[#2B3139]">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#EAECEF] mb-6">Analytics Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <Card className="bg-[#181A20] border border-[#2B3139] p-4">
                        <p className="text-xs text-[#848E9C]">User Growth</p>
                        <p className="text-2xl font-bold text-[#EAECEF] mt-1">+{((stats?.userGrowthRate || 0) * 100).toFixed(1)}%</p>
                      </Card>
                      <Card className="bg-[#181A20] border border-[#2B3139] p-4">
                        <p className="text-xs text-[#848E9C]">Trading Volume</p>
                        <p className="text-2xl font-bold text-[#EAECEF] mt-1">${((stats?.totalVolume || 0) / 1e6).toFixed(1)}M</p>
                      </Card>
                      <Card className="bg-[#181A20] border border-[#2B3139] p-4">
                        <p className="text-xs text-[#848E9C]">Revenue</p>
                        <p className="text-2xl font-bold text-[#EAECEF] mt-1">${((stats?.revenue || 0) / 1e6).toFixed(1)}M</p>
                      </Card>
                      <Card className="bg-[#181A20] border border-[#2B3139] p-4">
                        <p className="text-xs text-[#848E9C]">KYC Completion</p>
                        <p className="text-2xl font-bold text-green-400">72.5%</p>
                      </Card>
                    </div>
                    <div className="bg-[#181A20] rounded-lg p-4 text-center">
                      <BarChart3 className="w-12 h-12 text-[#F0B90B] mx-auto mb-2" />
                      <p className="text-[#848E9C]">Advanced analytics dashboard with custom reports coming soon</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
