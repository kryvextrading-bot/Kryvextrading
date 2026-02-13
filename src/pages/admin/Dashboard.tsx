import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Coffee, Moon, Sun, Monitor, Battery, Wind, Compass
} from 'lucide-react';
import apiService from '@/services/api';
import { Investment, Transaction, User as UserType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import UserManagement from './UserManagement';

// ==================== TYPES ====================
interface SystemSettings {
  general: {
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    supportEmail: string;
    maxLoginAttempts: number;
    sessionTimeout: number;
    twoFactorRequired: boolean;
    requireEmailVerification: boolean;
  };
  security: {
    minPasswordLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
    geoBlocking: string[];
    ipWhitelist: string[];
    deviceFingerprinting: boolean;
    biometricEnabled: boolean;
    maxSessionsPerUser: number;
    passwordExpiryDays: number;
  };
  trading: {
    spotEnabled: boolean;
    futuresEnabled: boolean;
    optionsEnabled: boolean;
    marginEnabled: boolean;
    maxLeverage: number;
    maintenanceFee: number;
    makerFee: number;
    takerFee: number;
    tradingHours: string;
    maintenanceWindows: string[];
    orderBookDepth: number;
    priceDecimalPlaces: number;
    amountDecimalPlaces: number;
    minOrderSize: number;
    maxOrderSize: number;
    stopOrdersEnabled: boolean;
    limitOrdersEnabled: boolean;
    marketOrdersEnabled: boolean;
  };
  backup: {
    autoBackup: boolean;
    frequency: 'hourly' | 'daily' | 'weekly';
    retention: number;
    location: string;
    lastBackup: string | null;
    backupSize: number;
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
  };
  system: {
    apiRateLimit: number;
    maxConcurrentSessions: number;
    cacheTimeout: number;
    maintenanceWindow: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    maxUploadSize: number;
    allowedFileTypes: string[];
    timezone: string;
    language: string;
    theme: 'light' | 'dark' | 'system';
  };
  notifications: {
    emailProvider: string;
    smsProvider: string;
    pushProvider: string;
    webhookUrl: string;
    emailTemplates: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    webhookEnabled: boolean;
    slackWebhook: string;
    discordWebhook: string;
    telegramBot: string;
    alertEmail: string;
    alertPhone: string;
  };
  compliance: {
    amlThreshold: number;
    reportingEnabled: boolean;
    auditRetention: number;
    geoBlocking: string[];
    kycRequired: boolean;
    amlScreeningEnabled: boolean;
    sanctionListEnabled: boolean;
    pepCheckEnabled: boolean;
    riskAssessmentEnabled: boolean;
    documentRetentionDays: number;
    dataRetentionPolicy: string;
    gdprEnabled: boolean;
    ccpaEnabled: boolean;
  };
  api: {
    rateLimit: number;
    rateLimitBurst: number;
    allowedOrigins: string[];
    authenticationMethods: ('apiKey' | 'jwt' | 'oauth2')[];
    jwtExpiry: number;
    requireHttps: boolean;
    enableCors: boolean;
    maxRequestSize: number;
    requestTimeout: number;
  };
  database: {
    connectionPool: number;
    queryTimeout: number;
    maxConnections: number;
    sslEnabled: boolean;
    backupSchedule: string;
    backupRetention: number;
    replicationEnabled: boolean;
    readReplicas: number;
  };
  integrations: {
    stripeEnabled: boolean;
    plaidEnabled: boolean;
    coinbaseEnabled: boolean;
    binanceEnabled: boolean;
    webhookUrl: string;
    webhookSecret: string;
    ssoEnabled: boolean;
    ssoProvider: 'google' | 'microsoft' | 'okta' | null;
    ssoClientId: string;
    ssoClientSecret: string;
  };
}

interface AuditLog {
  id: string;
  timestamp: string;
  admin: string;
  adminEmail: string;
  action: string;
  target: string;
  targetType: string;
  details: string;
  ipAddress: string;
  userAgent: string;
}

interface SecurityEvent {
  id: string;
  type: 'alert' | 'warning' | 'info';
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  source: string;
  resolved: boolean;
  investigation?: string;
  assignedTo?: string;
}

// ==================== ADMIN SECTIONS ====================
const adminSections = [
  { key: 'overview', label: 'Overview', icon: Home },
  { key: 'users', label: 'User Management', icon: Users },
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

// ==================== PLATFORM ADMIN PANEL ====================
function PlatformAdminPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSettings: SystemSettings = {
        general: {
          maintenanceMode: false,
          registrationEnabled: true,
          supportEmail: 'support@swanira.com',
          maxLoginAttempts: 5,
          sessionTimeout: 30,
          twoFactorRequired: true,
          requireEmailVerification: true,
        },
        security: {
          minPasswordLength: 8,
          requireSpecialChars: true,
          requireNumbers: true,
          requireUppercase: true,
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
          geoBlocking: ['KR', 'IR', 'CU'],
          ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
          deviceFingerprinting: true,
          biometricEnabled: true,
          maxSessionsPerUser: 3,
          passwordExpiryDays: 90,
        },
        trading: {
          spotEnabled: true,
          futuresEnabled: true,
          optionsEnabled: false,
          marginEnabled: true,
          maxLeverage: 10,
          maintenanceFee: 0.01,
          makerFee: 0.1,
          takerFee: 0.2,
          tradingHours: '24/7',
          maintenanceWindows: ['Sunday 02:00-04:00 UTC'],
          orderBookDepth: 50,
          priceDecimalPlaces: 2,
          amountDecimalPlaces: 6,
          minOrderSize: 10,
          maxOrderSize: 1000000,
          stopOrdersEnabled: true,
          limitOrdersEnabled: true,
          marketOrdersEnabled: true,
        },
        backup: {
          autoBackup: true,
          frequency: 'daily',
          retention: 30,
          location: 's3://swanira-backups',
          lastBackup: new Date().toISOString(),
          backupSize: 1.2 * 1024 * 1024 * 1024, // 1.2GB
          encryptionEnabled: true,
          compressionEnabled: true,
        },
        system: {
          apiRateLimit: 1000,
          maxConcurrentSessions: 1000,
          cacheTimeout: 3600,
          maintenanceWindow: 'Sunday 02:00-04:00 UTC',
          environment: 'production',
          debugMode: false,
          logLevel: 'info',
          maxUploadSize: 10,
          allowedFileTypes: ['.jpg', '.png', '.pdf', '.doc'],
          timezone: 'UTC',
          language: 'en',
          theme: 'dark',
        },
        notifications: {
          emailProvider: 'smtp.sendgrid.net',
          smsProvider: 'twilio',
          pushProvider: 'firebase',
          webhookUrl: 'https://api.swanira.com/webhooks',
          emailTemplates: true,
          smsEnabled: true,
          pushEnabled: true,
          webhookEnabled: false,
          slackWebhook: 'https://hooks.slack.com/services/...',
          discordWebhook: 'https://discord.com/api/webhooks/...',
          telegramBot: '1234567890:ABCdef...',
          alertEmail: 'alerts@swanira.com',
          alertPhone: '+1234567890',
        },
        compliance: {
          amlThreshold: 10000,
          reportingEnabled: true,
          auditRetention: 2555, // 7 years
          geoBlocking: ['KR', 'IR', 'CU'],
          kycRequired: true,
          amlScreeningEnabled: true,
          sanctionListEnabled: true,
          pepCheckEnabled: true,
          riskAssessmentEnabled: true,
          documentRetentionDays: 365,
          dataRetentionPolicy: 'strict',
          gdprEnabled: true,
          ccpaEnabled: false,
        },
        api: {
          rateLimit: 100,
          rateLimitBurst: 200,
          allowedOrigins: ['https://app.swanira.com', 'https://api.swanira.com'],
          authenticationMethods: ['apiKey', 'jwt'],
          jwtExpiry: 3600,
          requireHttps: true,
          enableCors: true,
          maxRequestSize: 10,
          requestTimeout: 30,
        },
        database: {
          connectionPool: 10,
          queryTimeout: 30,
          maxConnections: 100,
          sslEnabled: true,
          backupSchedule: '0 2 * * *',
          backupRetention: 30,
          replicationEnabled: true,
          readReplicas: 2,
        },
        integrations: {
          stripeEnabled: true,
          plaidEnabled: true,
          coinbaseEnabled: true,
          binanceEnabled: true,
          webhookUrl: 'https://api.swanira.com/webhooks',
          webhookSecret: 'whsec_...',
          ssoEnabled: false,
          ssoProvider: null,
          ssoClientId: '',
          ssoClientSecret: '',
        },
      };
      
      setSettings(mockSettings);
    } catch (err) {
      setError('Failed to load system settings');
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev?.[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess('Settings saved successfully');
      toast({
        title: "Success",
        description: "System settings have been updated.",
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRunBackup = async () => {
    try {
      toast({
        title: "Backup Started",
        description: "Manual backup process initiated.",
      });
      // Simulate backup
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSettings(prev => prev ? {
        ...prev,
        backup: {
          ...prev.backup,
          lastBackup: new Date().toISOString(),
          backupSize: 1.3 * 1024 * 1024 * 1024,
        }
      } : null);
      toast({
        title: "Backup Complete",
        description: "System backup completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Backup Failed",
        description: "Failed to complete backup",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#1E2329] border border-[#2B3139] p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
          <span className="ml-2 text-[#EAECEF]">Loading platform settings...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1E2329] border border-red-500/30 p-8">
        <div className="flex items-center justify-center text-red-400">
          <AlertTriangle className="w-6 h-6 mr-2" />
          <span>{error}</span>
        </div>
        <Button 
          className="mt-4 mx-auto bg-[#F0B90B] text-black"
          onClick={loadSettings}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 lg:grid-cols-7 bg-[#1E2329] p-1 rounded-lg">
          <TabsTrigger value="general" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            General
          </TabsTrigger>
          <TabsTrigger value="trading" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Trading
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Backup
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            System
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Compliance
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            API
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">General Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Maintenance Mode</Label>
                  <Switch
                    checked={settings?.general.maintenanceMode}
                    onCheckedChange={(checked) => handleChange('general', 'maintenanceMode', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Registration Enabled</Label>
                  <Switch
                    checked={settings?.general.registrationEnabled}
                    onCheckedChange={(checked) => handleChange('general', 'registrationEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Require 2FA</Label>
                  <Switch
                    checked={settings?.general.twoFactorRequired}
                    onCheckedChange={(checked) => handleChange('general', 'twoFactorRequired', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Email Verification</Label>
                  <Switch
                    checked={settings?.general.requireEmailVerification}
                    onCheckedChange={(checked) => handleChange('general', 'requireEmailVerification', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">Support Email</Label>
                  <Input
                    value={settings?.general.supportEmail || ''}
                    onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
                <div>
                  <Label className="text-[#EAECEF]">Max Login Attempts</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={settings?.general.maxLoginAttempts || 5}
                    onChange={(e) => handleChange('general', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>
                <div>
                  <Label className="text-[#EAECEF]">Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={settings?.general.sessionTimeout || 30}
                    onChange={(e) => handleChange('general', 'sessionTimeout', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Trading Settings */}
        <TabsContent value="trading" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">Trading Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Spot Trading</Label>
                  <Switch
                    checked={settings?.trading.spotEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'spotEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Futures Trading</Label>
                  <Switch
                    checked={settings?.trading.futuresEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'futuresEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Options Trading</Label>
                  <Switch
                    checked={settings?.trading.optionsEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'optionsEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Margin Trading</Label>
                  <Switch
                    checked={settings?.trading.marginEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'marginEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Stop Orders</Label>
                  <Switch
                    checked={settings?.trading.stopOrdersEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'stopOrdersEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Limit Orders</Label>
                  <Switch
                    checked={settings?.trading.limitOrdersEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'limitOrdersEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Market Orders</Label>
                  <Switch
                    checked={settings?.trading.marketOrdersEnabled}
                    onCheckedChange={(checked) => handleChange('trading', 'marketOrdersEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">Max Leverage</Label>
                  <Select
                    value={settings?.trading.maxLeverage?.toString() || '10'}
                    onValueChange={(value) => handleChange('trading', 'maxLeverage', parseInt(value))}
                  >
                    <SelectTrigger className="w-32 mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 5, 10, 20, 50, 100].map(lev => (
                        <SelectItem key={lev} value={lev.toString()}>{lev}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Maker Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings?.trading.makerFee || 0.1}
                    onChange={(e) => handleChange('trading', 'makerFee', parseFloat(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Taker Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings?.trading.takerFee || 0.2}
                    onChange={(e) => handleChange('trading', 'takerFee', parseFloat(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Maintenance Fee (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={settings?.trading.maintenanceFee || 0.01}
                    onChange={(e) => handleChange('trading', 'maintenanceFee', parseFloat(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Min Order Size (USDT)</Label>
                  <Input
                    type="number"
                    value={settings?.trading.minOrderSize || 10}
                    onChange={(e) => handleChange('trading', 'minOrderSize', parseFloat(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Max Order Size (USDT)</Label>
                  <Input
                    type="number"
                    value={settings?.trading.maxOrderSize || 1000000}
                    onChange={(e) => handleChange('trading', 'maxOrderSize', parseFloat(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Order Book Depth</Label>
                  <Input
                    type="number"
                    value={settings?.trading.orderBookDepth || 50}
                    onChange={(e) => handleChange('trading', 'orderBookDepth', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Price Decimal Places</Label>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={settings?.trading.priceDecimalPlaces || 2}
                    onChange={(e) => handleChange('trading', 'priceDecimalPlaces', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Amount Decimal Places</Label>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={settings?.trading.amountDecimalPlaces || 6}
                    onChange={(e) => handleChange('trading', 'amountDecimalPlaces', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[#2B3139]">
              <div>
                <Label className="text-[#EAECEF]">Trading Hours</Label>
                <Input
                  value={settings?.trading.tradingHours || '24/7'}
                  onChange={(e) => handleChange('trading', 'tradingHours', e.target.value)}
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              <div className="mt-4">
                <Label className="text-[#EAECEF]">Maintenance Windows</Label>
                <Textarea
                  value={settings?.trading.maintenanceWindows.join('\n') || ''}
                  onChange={(e) => handleChange('trading', 'maintenanceWindows', e.target.value.split('\n'))}
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  rows={2}
                  placeholder="One per line"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Database className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">Backup & Recovery</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Auto Backup</Label>
                  <Switch
                    checked={settings?.backup.autoBackup}
                    onCheckedChange={(checked) => handleChange('backup', 'autoBackup', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Backup Frequency</Label>
                  <Select
                    value={settings?.backup.frequency}
                    onValueChange={(value) => handleChange('backup', 'frequency', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Retention Period (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={settings?.backup.retention || 30}
                    onChange={(e) => handleChange('backup', 'retention', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Backup Location</Label>
                  <Input
                    value={settings?.backup.location || ''}
                    onChange={(e) => handleChange('backup', 'location', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="s3://bucket/path"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#181A20] rounded-lg p-4">
                  <p className="text-sm text-[#848E9C] mb-2">Last Backup</p>
                  <p className="text-lg font-bold text-[#EAECEF]">
                    {settings?.backup.lastBackup 
                      ? new Date(settings.backup.lastBackup).toLocaleString()
                      : 'Never'}
                  </p>
                </div>

                <div className="bg-[#181A20] rounded-lg p-4">
                  <p className="text-sm text-[#848E9C] mb-2">Backup Size</p>
                  <p className="text-lg font-bold text-[#EAECEF]">
                    {settings?.backup.backupSize 
                      ? `${(settings.backup.backupSize / (1024 * 1024 * 1024)).toFixed(2)} GB`
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Encryption Enabled</Label>
                  <Switch
                    checked={settings?.backup.encryptionEnabled}
                    onCheckedChange={(checked) => handleChange('backup', 'encryptionEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Compression Enabled</Label>
                  <Switch
                    checked={settings?.backup.compressionEnabled}
                    onCheckedChange={(checked) => handleChange('backup', 'compressionEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <Button 
                  onClick={handleRunBackup}
                  className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Run Manual Backup
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">System Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">Environment</Label>
                  <Select
                    value={settings?.system.environment}
                    onValueChange={(value) => handleChange('system', 'environment', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Log Level</Label>
                  <Select
                    value={settings?.system.logLevel}
                    onValueChange={(value) => handleChange('system', 'logLevel', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Timezone</Label>
                  <Select
                    value={settings?.system.timezone}
                    onValueChange={(value) => handleChange('system', 'timezone', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      <SelectItem value="Asia/Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Language</Label>
                  <Select
                    value={settings?.system.language}
                    onValueChange={(value) => handleChange('system', 'language', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">API Rate Limit (req/min)</Label>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    value={settings?.system.apiRateLimit || 1000}
                    onChange={(e) => handleChange('system', 'apiRateLimit', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Max Concurrent Sessions</Label>
                  <Input
                    type="number"
                    min={100}
                    max={100000}
                    value={settings?.system.maxConcurrentSessions || 1000}
                    onChange={(e) => handleChange('system', 'maxConcurrentSessions', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Cache Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={settings?.system.cacheTimeout || 3600}
                    onChange={(e) => handleChange('system', 'cacheTimeout', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Max Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings?.system.maxUploadSize || 10}
                    onChange={(e) => handleChange('system', 'maxUploadSize', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Debug Mode</Label>
                  <Switch
                    checked={settings?.system.debugMode}
                    onCheckedChange={(checked) => handleChange('system', 'debugMode', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Label className="text-[#EAECEF]">Allowed File Types</Label>
              <Input
                value={settings?.system.allowedFileTypes?.join(', ') || ''}
                onChange={(e) => handleChange('system', 'allowedFileTypes', e.target.value.split(',').map(t => t.trim()))}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                placeholder=".jpg, .png, .pdf, .doc"
              />
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">Notification Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Email Notifications</Label>
                  <Switch
                    checked={settings?.notifications.smsEnabled}
                    onCheckedChange={(checked) => handleChange('notifications', 'smsEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">SMS Notifications</Label>
                  <Switch
                    checked={settings?.notifications.smsEnabled}
                    onCheckedChange={(checked) => handleChange('notifications', 'smsEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Push Notifications</Label>
                  <Switch
                    checked={settings?.notifications.pushEnabled}
                    onCheckedChange={(checked) => handleChange('notifications', 'pushEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Webhook Notifications</Label>
                  <Switch
                    checked={settings?.notifications.webhookEnabled}
                    onCheckedChange={(checked) => handleChange('notifications', 'webhookEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Email Templates</Label>
                  <Switch
                    checked={settings?.notifications.emailTemplates}
                    onCheckedChange={(checked) => handleChange('notifications', 'emailTemplates', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">Email Provider</Label>
                  <Input
                    value={settings?.notifications.emailProvider || ''}
                    onChange={(e) => handleChange('notifications', 'emailProvider', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="smtp.sendgrid.net"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">SMS Provider</Label>
                  <Input
                    value={settings?.notifications.smsProvider || ''}
                    onChange={(e) => handleChange('notifications', 'smsProvider', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="twilio"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Webhook URL</Label>
                  <Input
                    value={settings?.notifications.webhookUrl || ''}
                    onChange={(e) => handleChange('notifications', 'webhookUrl', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="https://api.example.com/webhook"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Slack Webhook</Label>
                  <Input
                    value={settings?.notifications.slackWebhook || ''}
                    onChange={(e) => handleChange('notifications', 'slackWebhook', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Discord Webhook</Label>
                  <Input
                    value={settings?.notifications.discordWebhook || ''}
                    onChange={(e) => handleChange('notifications', 'discordWebhook', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Telegram Bot Token</Label>
                  <Input
                    value={settings?.notifications.telegramBot || ''}
                    onChange={(e) => handleChange('notifications', 'telegramBot', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="1234567890:ABCdef..."
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Alert Email</Label>
                  <Input
                    type="email"
                    value={settings?.notifications.alertEmail || ''}
                    onChange={(e) => handleChange('notifications', 'alertEmail', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="alerts@example.com"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Alert Phone</Label>
                  <Input
                    value={settings?.notifications.alertPhone || ''}
                    onChange={(e) => handleChange('notifications', 'alertPhone', e.target.value)}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Settings */}
        <TabsContent value="compliance" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">Compliance Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">KYC Required</Label>
                  <Switch
                    checked={settings?.compliance.kycRequired}
                    onCheckedChange={(checked) => handleChange('compliance', 'kycRequired', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">AML Screening</Label>
                  <Switch
                    checked={settings?.compliance.amlScreeningEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'amlScreeningEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Sanction List</Label>
                  <Switch
                    checked={settings?.compliance.sanctionListEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'sanctionListEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">PEP Check</Label>
                  <Switch
                    checked={settings?.compliance.pepCheckEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'pepCheckEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Risk Assessment</Label>
                  <Switch
                    checked={settings?.compliance.riskAssessmentEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'riskAssessmentEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">GDPR Compliance</Label>
                  <Switch
                    checked={settings?.compliance.gdprEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'gdprEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">CCPA Compliance</Label>
                  <Switch
                    checked={settings?.compliance.ccpaEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'ccpaEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">AML Threshold ($)</Label>
                  <Input
                    type="number"
                    value={settings?.compliance.amlThreshold || 10000}
                    onChange={(e) => handleChange('compliance', 'amlThreshold', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Audit Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings?.compliance.auditRetention || 2555}
                    onChange={(e) => handleChange('compliance', 'auditRetention', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Document Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings?.compliance.documentRetentionDays || 365}
                    onChange={(e) => handleChange('compliance', 'documentRetentionDays', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Data Retention Policy</Label>
                  <Select
                    value={settings?.compliance.dataRetentionPolicy}
                    onValueChange={(value) => handleChange('compliance', 'dataRetentionPolicy', value)}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Reporting Enabled</Label>
                  <Switch
                    checked={settings?.compliance.reportingEnabled}
                    onCheckedChange={(checked) => handleChange('compliance', 'reportingEnabled', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Label className="text-[#EAECEF]">Geo-Blocking (ISO codes)</Label>
              <Input
                value={settings?.compliance.geoBlocking?.join(', ') || ''}
                onChange={(e) => handleChange('compliance', 'geoBlocking', e.target.value.split(',').map(c => c.trim()))}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                placeholder="KR, IR, CU"
              />
              <p className="text-xs text-[#5E6673] mt-1">
                Comma-separated ISO country codes to block
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-4 pt-4">
          <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-[#F0B90B]" />
              <h3 className="text-lg font-bold text-[#EAECEF]">API Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-[#EAECEF]">Rate Limit (req/min)</Label>
                  <Input
                    type="number"
                    value={settings?.api.rateLimit || 100}
                    onChange={(e) => handleChange('api', 'rateLimit', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Rate Limit Burst</Label>
                  <Input
                    type="number"
                    value={settings?.api.rateLimitBurst || 200}
                    onChange={(e) => handleChange('api', 'rateLimitBurst', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">JWT Expiry (seconds)</Label>
                  <Input
                    type="number"
                    value={settings?.api.jwtExpiry || 3600}
                    onChange={(e) => handleChange('api', 'jwtExpiry', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Max Request Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings?.api.maxRequestSize || 10}
                    onChange={(e) => handleChange('api', 'maxRequestSize', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Request Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={settings?.api.requestTimeout || 30}
                    onChange={(e) => handleChange('api', 'requestTimeout', parseInt(e.target.value))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Require HTTPS</Label>
                  <Switch
                    checked={settings?.api.requireHttps}
                    onCheckedChange={(checked) => handleChange('api', 'requireHttps', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-[#EAECEF]">Enable CORS</Label>
                  <Switch
                    checked={settings?.api.enableCors}
                    onCheckedChange={(checked) => handleChange('api', 'enableCors', checked)}
                    className="data-[state=checked]:bg-[#F0B90B]"
                  />
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Authentication Methods</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['apiKey', 'jwt', 'oauth2'].map(method => (
                      <Button
                        key={method}
                        variant="outline"
                        size="sm"
                        className={`border-[#2B3139] ${
                          settings?.api.authenticationMethods.includes(method as any)
                            ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                            : 'text-[#EAECEF]'
                        }`}
                        onClick={() => {
                          const methods = settings?.api.authenticationMethods.includes(method as any)
                            ? settings.api.authenticationMethods.filter(m => m !== method)
                            : [...(settings?.api.authenticationMethods || []), method as any];
                          handleChange('api', 'authenticationMethods', methods);
                        }}
                      >
                        {method === 'apiKey' && <Key className="w-3 h-3 mr-1" />}
                        {method === 'jwt' && <Lock className="w-3 h-3 mr-1" />}
                        {method === 'oauth2' && <Fingerprint className="w-3 h-3 mr-1" />}
                        {method}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#EAECEF]">Allowed Origins</Label>
                  <Textarea
                    value={settings?.api.allowedOrigins?.join('\n') || ''}
                    onChange={(e) => handleChange('api', 'allowedOrigins', e.target.value.split('\n'))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    rows={3}
                    placeholder="One per line"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ==================== INVESTMENT ADMIN PANEL ====================
function InvestmentAdminPanel() {
  const [products, setProducts] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Investment, 'id'>>({
    name: '',
    type: 'quant-trading',
    description: '',
    minInvestment: 0,
    expectedReturn: 0,
    duration: '',
    riskLevel: 'medium',
    icon: '',
    status: 'active'
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getInvestments();
      setProducts(data);
    } catch (err) {
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (prod: Investment) => {
    const { id, ...rest } = prod;
    setForm(rest);
    setEditId(id);
    setModalOpen(true);
  };

  const openAdd = () => {
    setForm({
      name: '',
      type: 'quant-trading',
      description: '',
      minInvestment: 0,
      expectedReturn: 0,
      duration: '',
      riskLevel: 'medium',
      icon: '',
      status: 'active'
    });
    setEditId(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editId) {
        const updated = await apiService.updateInvestment(editId, form);
        setProducts(ps => ps.map(p => p.id === editId ? updated : p));
      } else {
        const created = await apiService.createInvestment(form);
        setProducts(ps => [...ps, created]);
      }
      setModalOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment product?')) return;
    setLoading(true);
    try {
      await apiService.deleteInvestment(id);
      setProducts(ps => ps.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete investment');
    } finally {
      setLoading(false);
    }
  };

  // Analytics
  const totalProducts = products.length;
  const totalMinInvestment = products.reduce((sum, p) => sum + p.minInvestment, 0);
  const avgExpectedReturn = totalProducts ? (products.reduce((sum, p) => sum + p.expectedReturn, 0) / totalProducts).toFixed(2) : '0.00';
  const activeProducts = products.filter(p => p.status === 'active').length;
  const riskCounts = products.reduce((acc, p) => {
    acc[p.riskLevel] = (acc[p.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const riskChartData = Object.entries(riskCounts).map(([risk, count]) => ({ risk, count }));
  const topProduct = products.reduce((max, p) => p.expectedReturn > (max?.expectedReturn ?? 0) ? p : max, null as Investment | null);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-400 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={totalProducts}
          icon={Briefcase}
          subtitle={`${activeProducts} active`}
        />
        <StatsCard
          title="Total Min Investment"
          value={`$${totalMinInvestment.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatsCard
          title="Avg Expected Return"
          value={`${avgExpectedReturn}%`}
          icon={TrendingUp}
        />
        <StatsCard
          title="Top Product"
          value={topProduct?.name || '-'}
          icon={Shield}
          subtitle={topProduct ? `${topProduct.expectedReturn}%` : ''}
        />
      </div>

      {/* Risk Level Distribution */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center gap-2 mb-6">
          <PieChartIcon className="w-5 h-5 text-[#F0B90B]" />
          <h3 className="text-lg font-bold text-[#EAECEF]">Risk Level Distribution</h3>
        </div>
        <div className="flex justify-center">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={riskChartData}>
              <XAxis dataKey="risk" stroke={COLORS.textSecondary} />
              <YAxis stroke={COLORS.textSecondary} />
              <Tooltip
                contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '8px' }}
                labelStyle={{ color: COLORS.primary }}
              />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Investment Products Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Investment Products</h3>
          </div>
          <Button
            onClick={openAdd}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#181A20] text-[#F0B90B]">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Min Investment</th>
                  <th className="px-4 py-3 text-left">Expected Return</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod, index) => (
                  <tr key={prod.id} className="border-b border-[#2B3139] hover:bg-[#23262F] transition-colors">
                    <td className="px-4 py-3 text-[#EAECEF] font-medium">{prod.name}</td>
                    <td className="px-4 py-3 text-[#EAECEF]">{prod.type}</td>
                    <td className="px-4 py-3 text-[#EAECEF]">${prod.minInvestment.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[#EAECEF]">{prod.expectedReturn}%</td>
                    <td className="px-4 py-3 text-[#EAECEF]">{prod.duration}</td>
                    <td className="px-4 py-3">
                      <Badge className={
                        prod.riskLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                        prod.riskLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {prod.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={prod.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                        {prod.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-[#F0B90B] hover:bg-[#F0B90B]/10"
                          onClick={() => openEdit(prod)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(prod.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1E2329] border border-[#F0B90B] rounded-xl p-6 w-full max-w-md"
          >
            <h4 className="text-lg font-bold text-[#F0B90B] mb-4">
              {editId ? 'Edit Product' : 'Add Product'}
            </h4>
            
            <div className="space-y-4">
              <div>
                <Label className="text-[#EAECEF]">Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="Product name"
                />
              </div>
              
              <div>
                <Label className="text-[#EAECEF]">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={value => setForm(f => ({ ...f, type: value as Investment['type'] }))}
                >
                  <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quant-trading">Quant Trading</SelectItem>
                    <SelectItem value="arbitrage">Arbitrage</SelectItem>
                    <SelectItem value="staking">Staking</SelectItem>
                    <SelectItem value="mining">Mining</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-[#EAECEF]">Description</Label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full mt-1 bg-[#181A20] border border-[#2B3139] rounded-lg px-3 py-2 text-[#EAECEF] placeholder:text-[#5E6673] focus:outline-none focus:border-[#F0B90B]"
                  rows={3}
                  placeholder="Product description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#EAECEF]">Min Investment</Label>
                  <Input
                    type="number"
                    value={form.minInvestment}
                    onChange={e => setForm(f => ({ ...f, minInvestment: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <Label className="text-[#EAECEF]">Expected Return (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.expectedReturn}
                    onChange={e => setForm(f => ({ ...f, expectedReturn: Number(e.target.value) }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="5.0"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#EAECEF]">Duration</Label>
                  <Input
                    value={form.duration}
                    onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                    placeholder="30 days"
                  />
                </div>
                <div>
                  <Label className="text-[#EAECEF]">Risk Level</Label>
                  <Select
                    value={form.riskLevel}
                    onValueChange={value => setForm(f => ({ ...f, riskLevel: value as Investment['riskLevel'] }))}
                  >
                    <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="text-[#EAECEF]">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={value => setForm(f => ({ ...f, status: value as 'active' | 'inactive' }))}
                >
                  <SelectTrigger className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="border-[#2B3139] text-[#EAECEF]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!form.name || !form.type || !form.description || form.minInvestment <= 0}
                className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
              >
                {editId ? 'Save Changes' : 'Add Product'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ==================== TRADING ADMIN PANEL ====================
function TradingAdminPanel() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetFilter, setAssetFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchTrades();
    
    // WebSocket connection for real-time updates
    if (liveUpdates) {
      const ws = new WebSocket('wss://api.swanira.com/admin/trades');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_trade') {
          setTrades(prev => [data.trade, ...prev]);
          // Show alert for large trades
          if (data.trade.amount * data.trade.price > 100000) {
            setAlerts(prev => [{
              id: Date.now(),
              message: `Large trade detected: ${data.trade.amount} ${data.trade.asset} by ${data.trade.userName}`,
              timestamp: new Date().toISOString(),
              severity: 'warning'
            }, ...prev.slice(0, 9)]);
          }
        } else if (data.type === 'trade_closed') {
          setTrades(prev => prev.map(t => 
            t.id === data.tradeId ? { ...t, status: 'closed', pnl: data.pnl } : t
          ));
        }
      };
      setWsConnection(ws);
      return () => ws.close();
    }
  }, [liveUpdates]);

  const fetchTrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const [spot, futures, options] = await Promise.all([
        apiService.getSpotOrders(),
        apiService.getFuturesOrders(),
        apiService.getOptionsOrders(),
      ]);

      const normalize = (orders: any[], type: string) => orders.map(o => ({
        id: o.id || o.orderId,
        user: o.user?.email || o.userEmail || 'Unknown',
        userName: o.user?.name || o.userName || 'Unknown',
        asset: o.asset || o.symbol || o.pair || 'N/A',
        type: o.side || o.type || type,
        amount: o.amount || o.qty || o.size || 0,
        price: o.price || o.avgPrice || o.executionPrice || 0,
        status: o.status || (o.closed ? 'closed' : 'open'),
        date: o.date || o.createdAt || o.time || new Date().toISOString(),
        pnl: o.pnl || o.profit || 0,
        fee: o.fee || 0,
        market: type
      }));

      const allTrades = [
        ...normalize(spot, 'Spot'),
        ...normalize(futures, 'Futures'),
        ...normalize(options, 'Options'),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTrades(allTrades);
    } catch (err) {
      setError('Failed to load trades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    const matchesAsset = assetFilter === 'All' || trade.asset === assetFilter;
    const matchesUser = userFilter === 'All' || trade.user === userFilter || trade.userName === userFilter;
    const matchesStatus = statusFilter === 'All' || trade.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      trade.id?.toString().includes(searchQuery) ||
      trade.user?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trade.asset?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesAsset && matchesUser && matchesStatus && matchesSearch;
  });

  const openTrades = filteredTrades.filter(t => t.status === 'open');
  const closedTrades = filteredTrades.filter(t => t.status === 'closed' || t.status === 'filled');

  // Analytics
  const totalTrades = filteredTrades.length;
  const totalVolume = filteredTrades.reduce((sum, t) => sum + (t.amount * t.price), 0);
  const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winTrades = closedTrades.filter(t => t.pnl > 0).length;
  const winRate = closedTrades.length ? ((winTrades / closedTrades.length) * 100).toFixed(1) : '0.0';
  
  // Chart data
  const volumeByDate = filteredTrades.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (t.amount * t.price);
    return acc;
  }, {} as Record<string, number>);
  
  const pnlByDate = closedTrades.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (t.pnl || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartDates = Object.keys(volumeByDate).sort();
  const volumeChartData = chartDates.map(date => ({ date, volume: volumeByDate[date] || 0 }));
  const pnlChartData = chartDates.map(date => ({ date, pnl: pnlByDate[date] || 0 }));

  // Asset distribution for pie chart
  const assetCounts = trades.reduce((acc, t) => {
    acc[t.asset] = (acc[t.asset] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const assetPieData = Object.entries(assetCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Unique values for filters
  const assets = ['All', ...Array.from(new Set(trades.map(t => t.asset))).filter(Boolean)];
  const users = ['All', ...Array.from(new Set(trades.map(t => t.userName || t.user))).filter(Boolean)];

  // Market manipulation detection
  const detectManipulation = () => {
    const largeTrades = trades.filter(t => t.amount * t.price > 100000);
    const rapidTrades = trades.filter((t, i, arr) => {
      if (i === 0) return false;
      const prevTime = new Date(arr[i-1].date).getTime();
      const currTime = new Date(t.date).getTime();
      return currTime - prevTime < 1000; // Less than 1 second apart
    });
    
    return {
      largeTrades: largeTrades.length,
      rapidTrades: rapidTrades.length,
      alerts: [
        ...(largeTrades.length > 10 ? [{ severity: 'warning', message: 'Unusual number of large trades detected' }] : []),
        ...(rapidTrades.length > 50 ? [{ severity: 'alert', message: 'Rapid trading pattern detected - possible bot activity' }] : [])
      ]
    };
  };

  const manipulation = detectManipulation();

  return (
    <div className="space-y-6">
      {/* Live Updates Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${liveUpdates ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-[#EAECEF]">Live Updates</span>
          <Switch
            checked={liveUpdates}
            onCheckedChange={setLiveUpdates}
            className="data-[state=checked]:bg-[#F0B90B]"
          />
        </div>
        {alerts.length > 0 && (
          <Badge className="bg-yellow-500/20 text-yellow-400">
            {alerts.length} New Alerts
          </Badge>
        )}
      </div>

      {/* Market Monitoring Alerts */}
      {manipulation.alerts.length > 0 && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Market Monitoring Alerts</p>
                {manipulation.alerts.map((alert, i) => (
                  <p key={i} className="text-xs text-[#EAECEF] mt-1">{alert.message}</p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatsCard title="Total Trades" value={totalTrades} icon={Activity} />
        <StatsCard title="Total Volume" value={`$${totalVolume.toLocaleString()}`} icon={DollarSign} />
        <StatsCard title="Total P&L" value={`$${totalPnl.toLocaleString()}`} icon={TrendingUp} change={winRate} changeType="positive" />
        <StatsCard title="Win Rate" value={`${winRate}%`} icon={Shield} />
        <StatsCard title="Open Positions" value={openTrades.length} icon={Clock} />
      </div>

      {/* Market Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-[#F0B90B]" />
            <h4 className="text-sm font-medium text-[#EAECEF]">Market Manipulation</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Large Trades</span>
              <Badge className={manipulation.largeTrades > 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                {manipulation.largeTrades}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Rapid Trades</span>
              <Badge className={manipulation.rapidTrades > 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}>
                {manipulation.rapidTrades}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#F0B90B]" />
            <h4 className="text-sm font-medium text-[#EAECEF]">Liquidity Health</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Bid-Ask Spread</span>
              <span className="text-xs text-green-400">0.05%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Order Book Depth</span>
              <span className="text-xs text-[#EAECEF]">$2.5M</span>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#F0B90B]" />
            <h4 className="text-sm font-medium text-[#EAECEF]">Circuit Breakers</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Volatility Index</span>
              <span className="text-xs text-green-400">Normal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#848E9C]">Price Limits</span>
              <span className="text-xs text-[#EAECEF]">±10%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Asset Distribution & Performance Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Asset Distribution</h3>
          </div>
          <div className="flex justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetPieData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '8px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">P&L Trend (7d)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlChartData.slice(-7)}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="date" stroke={COLORS.textSecondary} />
                <YAxis stroke={COLORS.textSecondary} />
                <Tooltip
                  contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="pnl" stroke={COLORS.success} fill="url(#pnlGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#848E9C]" />
            <Input
              placeholder="Search by ID, user, asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#848E9C]" />
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset}>{asset}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7d</SelectItem>
                <SelectItem value="30d">Last 30d</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Open Trades Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#F0B90B]" />
          <h3 className="text-lg font-bold text-[#EAECEF]">Open Trades ({openTrades.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#181A20] text-[#F0B90B]">
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">User</th>
                  <th className="px-4 py-2 text-left">Asset</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Price</th>
                  <th className="px-4 py-2 text-left">Value</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Market</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade, i) => (
                  <tr key={trade.id} className="border-b border-[#2B3139] hover:bg-[#23262F]">
                    <td className="px-4 py-2 text-[#EAECEF] font-mono text-xs">{trade.id}</td>
                    <td className="px-4 py-2 text-[#EAECEF]">{trade.userName || trade.user}</td>
                    <td className="px-4 py-2 text-[#EAECEF]">{trade.asset}</td>
                    <td className="px-4 py-2">
                      <Badge className={trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-[#EAECEF]">{trade.amount.toFixed(4)}</td>
                    <td className="px-4 py-2 text-[#EAECEF]">${trade.price.toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#EAECEF]">${(trade.amount * trade.price).toLocaleString()}</td>
                    <td className="px-4 py-2 text-[#848E9C] text-xs">
                      {new Date(trade.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <Badge className="bg-[#2B3139] text-[#EAECEF]">
                        {trade.market}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Closed Trades Table */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="w-5 h-5 text-[#F0B90B]" />
          <h3 className="text-lg font-bold text-[#EAECEF]">Closed Trades ({closedTrades.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#181A20] text-[#F0B90B]">
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Asset</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">P&L</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Market</th>
              </tr>
            </thead>
            <tbody>
              {closedTrades.map((trade, i) => (
                <tr key={trade.id} className="border-b border-[#2B3139] hover:bg-[#23262F]">
                  <td className="px-4 py-2 text-[#EAECEF] font-mono text-xs">{trade.id}</td>
                  <td className="px-4 py-2 text-[#EAECEF]">{trade.userName || trade.user}</td>
                  <td className="px-4 py-2 text-[#EAECEF]">{trade.asset}</td>
                  <td className="px-4 py-2">
                    <Badge className={trade.type === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                      {trade.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-[#EAECEF]">{trade.amount.toFixed(4)}</td>
                  <td className="px-4 py-2 text-[#EAECEF]">${trade.price.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)} USDT
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[#848E9C] text-xs">
                    {new Date(trade.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <Badge className="bg-[#2B3139] text-[#EAECEF]">
                      {trade.market}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ==================== SECURITY ADMIN PANEL ====================
function SecurityAdminPanel() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEventTab, setActiveEventTab] = useState('events');
  const [investigatingEvent, setInvestigatingEvent] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data - replace with actual API calls
      const mockAuditLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          admin: 'Alice Johnson',
          adminEmail: 'alice@swanira.com',
          action: 'User Login',
          target: 'admin@example.com',
          targetType: 'user',
          details: 'Successful login from IP 192.168.1.100',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          admin: 'Bob Smith',
          adminEmail: 'bob@swanira.com',
          action: 'KYC Approval',
          target: 'john.doe@example.com',
          targetType: 'user',
          details: 'KYC verification approved',
          ipAddress: '192.168.1.101',
          userAgent: 'Firefox/121.0'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          admin: 'Alice Johnson',
          adminEmail: 'alice@swanira.com',
          action: 'Role Change',
          target: 'sarah.j@example.com',
          targetType: 'user',
          details: 'Assigned admin role',
          ipAddress: '192.168.1.100',
          userAgent: 'Chrome/120.0.0.0'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          admin: 'Security Bot',
          adminEmail: 'security@swanira.com',
          action: 'Password Reset',
          target: 'mike.wilson@example.com',
          targetType: 'user',
          details: 'Automatic password reset due to suspicious activity',
          ipAddress: '45.33.22.11',
          userAgent: 'Unknown'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          admin: 'Carol Davis',
          adminEmail: 'carol@swanira.com',
          action: 'Transaction Rejection',
          target: 'TXN-2024-001237',
          targetType: 'transaction',
          details: 'High-risk transaction rejected - AML flag triggered',
          ipAddress: '10.0.0.50',
          userAgent: 'Safari/17.4'
        }
      ];

      const mockSecurityEvents: SecurityEvent[] = [
        {
          id: '1',
          type: 'alert',
          message: 'Multiple failed login attempts detected for user john.doe@example.com',
          timestamp: new Date().toISOString(),
          severity: 'high',
          source: 'Auth Service',
          resolved: false
        },
        {
          id: '2',
          type: 'warning',
          message: 'Unusual withdrawal request: $50,000 from account #12345',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          severity: 'medium',
          source: 'Risk Engine',
          resolved: false
        },
        {
          id: '3',
          type: 'info',
          message: '2FA enabled for user jane.smith@example.com',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          severity: 'low',
          source: 'Security Service',
          resolved: true
        },
        {
          id: '4',
          type: 'alert',
          message: 'Suspicious IP address detected: 45.33.22.11 (VPN/Proxy)',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          severity: 'high',
          source: 'IP Security',
          resolved: false
        },
        {
          id: '5',
          type: 'warning',
          message: 'Bulk user registration pattern detected from same IP range',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          severity: 'medium',
          source: 'Fraud Detection',
          resolved: true
        }
      ];

      setAuditLogs(mockAuditLogs);
      setSecurityEvents(mockSecurityEvents);
    } catch (err) {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigateEvent = async (eventId: string) => {
    setInvestigatingEvent(eventId);
    try {
      // Mock investigation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSecurityEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, resolved: true, investigation: 'Investigation completed - no action required' }
          : event
      ));
      
      setInvestigatingEvent(null);
    } catch (error) {
      setInvestigatingEvent(null);
    }
  };

  const exportAuditLogs = () => {
    const csv = [
      ['Timestamp', 'Admin', 'Admin Email', 'Action', 'Target', 'Target Type', 'Details', 'IP Address', 'User Agent'],
      ...auditLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.admin,
        log.adminEmail,
        log.action,
        log.target,
        log.targetType,
        log.details,
        log.ipAddress,
        log.userAgent
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <AlertTriangle className="w-5 h-5" />;
      case 'low': return <CheckCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Controls */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-[#F0B90B]" />
          <h3 className="text-lg font-bold text-[#EAECEF]">Security Controls</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[#EAECEF]">Enforce 2FA</Label>
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[#EAECEF]">IP Whitelisting</Label>
              <Switch className="data-[state=checked]:bg-[#F0B90B]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[#EAECEF]">Session Management</Label>
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[#EAECEF]">Device Fingerprinting</Label>
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-[#EAECEF]">Min Password Length</Label>
              <Input
                type="number"
                min={6}
                max={32}
                defaultValue={8}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
              />
            </div>
            <div>
              <Label className="text-[#EAECEF]">Password Expiry (days)</Label>
              <Input
                type="number"
                min={30}
                max={365}
                defaultValue={90}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
              />
            </div>
            <div>
              <Label className="text-[#EAECEF]">Max Failed Attempts</Label>
              <Input
                type="number"
                min={3}
                max={10}
                defaultValue={5}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-32"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
              <Label className="text-[#EAECEF]">Require special characters</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
              <Label className="text-[#EAECEF]">Require numbers</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked className="data-[state=checked]:bg-[#F0B90B]" />
              <Label className="text-[#EAECEF]">Require uppercase</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch className="data-[state=checked]:bg-[#F0B90B]" />
              <Label className="text-[#EAECEF]">Geo-blocking enabled</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 pt-6 border-t border-[#2B3139]">
          <Button className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold">
            <Save className="w-4 h-4 mr-2" />
            Save Security Settings
          </Button>
        </div>
      </Card>

      {/* Security Events & Logs */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Security Monitoring</h3>
          </div>
          <Tabs value={activeEventTab} onValueChange={setActiveEventTab}>
            <TabsList className="bg-[#181A20] p-1 rounded-lg">
              <TabsTrigger value="events" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Events
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
                Audit Logs
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
          </div>
        ) : (
          <>
            {activeEventTab === 'events' && (
              <div className="space-y-3">
                {securityEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {getSeverityIcon(event.severity)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{event.message}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs opacity-70">{event.source}</span>
                            <span className="text-xs opacity-70">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                            <Badge className={
                              event.resolved 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }>
                              {event.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                          {event.investigation && (
                            <p className="text-xs mt-2 text-[#848E9C] border-t border-[#2B3139] pt-2">
                              Investigation: {event.investigation}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!event.resolved && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8"
                            onClick={() => handleInvestigateEvent(event.id)}
                            disabled={investigatingEvent === event.id}
                          >
                            {investigatingEvent === event.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Investigating...
                              </>
                            ) : (
                              <>
                                <Search className="h-3 w-3 mr-1" />
                                Investigate
                              </>
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeEventTab === 'audit' && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#181A20] text-[#F0B90B]">
                        <th className="px-4 py-2 text-left">Timestamp</th>
                        <th className="px-4 py-2 text-left">Admin</th>
                        <th className="px-4 py-2 text-left">Action</th>
                        <th className="px-4 py-2 text-left">Target</th>
                        <th className="px-4 py-2 text-left">Details</th>
                        <th className="px-4 py-2 text-left">IP Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log, i) => (
                        <tr key={log.id} className="border-b border-[#2B3139] hover:bg-[#23262F]">
                          <td className="px-4 py-2 text-[#848E9C] text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <div className="text-[#EAECEF]">{log.admin}</div>
                              <div className="text-xs text-[#848E9C]">{log.adminEmail}</div>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge className="bg-[#F0B90B]/20 text-[#F0B90B]">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-[#EAECEF]">{log.target}</td>
                          <td className="px-4 py-2 text-[#848E9C] text-xs">{log.details}</td>
                          <td className="px-4 py-2 text-[#848E9C] font-mono text-xs">{log.ipAddress}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[#2B3139]">
                  <div className="text-xs text-[#848E9C]">
                    Showing {auditLogs.length} of {auditLogs.length} audit logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-[#2B3139] text-[#EAECEF]">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-[#2B3139] text-[#EAECEF]"
                      onClick={exportAuditLogs}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export Logs
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h4 className="text-lg font-bold text-[#EAECEF]">Active Threats</h4>
          </div>
          <div className="text-3xl font-bold text-red-400">
            {securityEvents.filter(e => !e.resolved && e.severity === 'high').length}
          </div>
          <p className="text-sm text-[#848E9C] mt-2">Requires immediate attention</p>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h4 className="text-lg font-bold text-[#EAECEF]">Warnings</h4>
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {securityEvents.filter(e => !e.resolved && e.severity === 'medium').length}
          </div>
          <p className="text-sm text-[#848E9C] mt-2">Under review</p>
        </Card>

        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="text-lg font-bold text-[#EAECEF]">Resolved Today</h4>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {securityEvents.filter(e => e.resolved).length}
          </div>
          <p className="text-sm text-[#848E9C] mt-2">Successfully handled</p>
        </Card>
      </div>
    </div>
  );
}

// ==================== ANALYTICS ADMIN PANEL ====================
function AnalyticsAdminPanel() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('users');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Mock analytics data - replace with actual API calls
      const mockData = {
        userGrowth: [
          { date: '2024-07-07', users: 1250, newUsers: 45, activeUsers: 890 },
          { date: '2024-07-08', users: 1295, newUsers: 52, activeUsers: 912 },
          { date: '2024-07-09', users: 1347, newUsers: 48, activeUsers: 934 },
          { date: '2024-07-10', users: 1395, newUsers: 61, activeUsers: 956 },
          { date: '2024-07-11', users: 1456, newUsers: 58, activeUsers: 978 },
          { date: '2024-07-12', users: 1514, newUsers: 67, activeUsers: 1002 },
          { date: '2024-07-13', users: 1589, newUsers: 72, activeUsers: 1025 },
        ],
        revenueAnalytics: [
          { date: '2024-07-07', revenue: 45230, fees: 1250, trades: 234 },
          { date: '2024-07-08', revenue: 48920, fees: 1380, trades: 256 },
          { date: '2024-07-09', revenue: 52150, fees: 1420, trades: 278 },
          { date: '2024-07-10', revenue: 46890, fees: 1190, trades: 245 },
          { date: '2024-07-11', revenue: 54320, fees: 1580, trades: 298 },
          { date: '2024-07-12', revenue: 58940, fees: 1720, trades: 312 },
          { date: '2024-07-13', revenue: 62150, fees: 1890, trades: 334 },
        ],
        tradingVolume: [
          { asset: 'BTC', volume: 1250000, trades: 1234, change: 12.5 },
          { asset: 'ETH', volume: 890000, trades: 987, change: 8.3 },
          { asset: 'USDT', volume: 2100000, trades: 2341, change: -2.1 },
          { asset: 'BNB', volume: 456000, trades: 567, change: 15.7 },
          { asset: 'SOL', volume: 678000, trades: 789, change: 22.3 },
        ],
        kycCompletion: [
          { status: 'Verified', count: 1256, percentage: 78.9 },
          { status: 'Pending', count: 234, percentage: 14.7 },
          { status: 'Rejected', count: 89, percentage: 5.6 },
          { status: 'Not Started', count: 10, percentage: 0.8 },
        ],
        geographicData: [
          { country: 'United States', users: 4567, percentage: 45.2 },
          { country: 'United Kingdom', users: 1234, percentage: 12.2 },
          { country: 'Canada', users: 987, percentage: 9.8 },
          { country: 'Australia', users: 756, percentage: 7.5 },
          { country: 'Germany', users: 645, percentage: 6.4 },
          { country: 'Others', users: 1911, percentage: 18.9 },
        ],
        deviceAnalytics: [
          { device: 'Desktop', users: 5678, percentage: 56.2 },
          { device: 'Mobile', users: 3456, percentage: 34.2 },
          { device: 'Tablet', users: 987, percentage: 9.8 },
          { device: 'Other', users: 34, percentage: 0.3 },
        ],
        keyMetrics: {
          totalUsers: 10155,
          activeUsers: 7890,
          totalRevenue: 368500,
          totalTrades: 1857,
          avgTradeSize: 198.5,
          conversionRate: 12.3,
          retentionRate: 78.9,
          churnRate: 2.1,
        }
      };
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-[#F0B90B] animate-spin" />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <Card className="bg-[#1E2329] border border-red-500/30 p-8">
          <div className="flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <span>Failed to load analytics data</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#EAECEF]">Analytics Dashboard</h2>
          <p className="text-sm text-[#848E9C] mt-1">
            Platform-wide analytics and performance metrics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={analyticsData.keyMetrics.totalUsers.toLocaleString()}
          icon={Users}
          change={12.5}
          changeType="positive"
          subtitle={`${analyticsData.keyMetrics.activeUsers.toLocaleString()} active`}
        />
        <StatsCard
          title="Total Revenue"
          value={`$${analyticsData.keyMetrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          change={8.3}
          changeType="positive"
          subtitle={`${analyticsData.keyMetrics.totalTrades} trades`}
        />
        <StatsCard
          title="Avg Trade Size"
          value={`$${analyticsData.keyMetrics.avgTradeSize}`}
          icon={TrendingUp}
          change={-2.1}
          changeType="negative"
          subtitle={`${analyticsData.keyMetrics.conversionRate}% conversion`}
        />
        <StatsCard
          title="Retention Rate"
          value={`${analyticsData.keyMetrics.retentionRate}%`}
          icon={Activity}
          change={1.2}
          changeType="positive"
          subtitle={`${analyticsData.keyMetrics.churnRate}% churn`}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">User Growth Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" />
              <Tooltip
                contentStyle={{ background: '#1E2329', border: '1px solid #F0B90B', borderRadius: '8px' }}
                labelStyle={{ color: '#F0B90B' }}
              />
              <Line type="monotone" dataKey="users" stroke="#F0B90B" strokeWidth={2} dot={{ fill: '#F0B90B' }} />
              <Line type="monotone" dataKey="activeUsers" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue Analytics */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Revenue Analytics</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={analyticsData.revenueAnalytics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="date" stroke="#848E9C" />
              <YAxis stroke="#848E9C" />
              <Tooltip
                contentStyle={{ background: '#1E2329', border: '1px solid #F0B90B', borderRadius: '8px' }}
                labelStyle={{ color: '#F0B90B' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F0B90B" fill="#F0B90B" fillOpacity={0.3} />
              <Area type="monotone" dataKey="fees" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Trading Volume by Asset */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Trading Volume by Asset</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analyticsData.tradingVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" />
              <XAxis dataKey="asset" stroke="#848E9C" />
              <YAxis stroke="#848E9C" />
              <Tooltip
                contentStyle={{ background: '#1E2329', border: '1px solid #F0B90B', borderRadius: '8px' }}
                labelStyle={{ color: '#F0B90B' }}
              />
              <Bar dataKey="volume" fill="#F0B90B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* KYC Completion Status */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">KYC Completion Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.kycCompletion}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#F0B90B"
                dataKey="count"
              >
                {analyticsData.kycCompletion.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Geographic and Device Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Geographic Distribution</h3>
          </div>
          <div className="space-y-3">
            {analyticsData.geographicData.map((country: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#F0B90B]" />
                  <span className="text-sm text-[#EAECEF]">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#848E9C]">{country.users.toLocaleString()}</span>
                  <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] text-xs">
                    {country.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Device Analytics */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Smartphone className="w-5 h-5 text-[#F0B90B]" />
            <h3 className="text-lg font-bold text-[#EAECEF]">Device Analytics</h3>
          </div>
          <div className="space-y-3">
            {analyticsData.deviceAnalytics.map((device: any, index: number) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                  <span className="text-sm text-[#EAECEF]">{device.device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#848E9C]">{device.users.toLocaleString()}</span>
                  <Badge className="bg-[#10b981]/20 text-[#10b981] text-xs">
                    {device.percentage}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Export Options */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#EAECEF]">Export Reports</h3>
            <p className="text-sm text-[#848E9C] mt-1">
              Download comprehensive analytics reports in various formats
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-[#2B3139] text-[#EAECEF]">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
            <Button className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==================== MAIN ADMIN DASHBOARD ====================
export default function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalTrades: 0,
    pendingKyc: 0
  });

  // Auth check
  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
    }
  }, [isAdmin, navigate]);

  // Load overview data
  useEffect(() => {
    if (tab !== 'finance' && tab !== 'overview') return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (tab === 'finance') {
          const data = await apiService.getTransactions();
          setTransactions(data);
        }
        
        if (tab === 'overview') {
          // Mock stats - replace with real API calls
          setStats({
            totalUsers: 15420,
            activeUsers: 8234,
            totalDeposits: 5280000,
            totalWithdrawals: 2150000,
            totalTrades: 45678,
            pendingKyc: 145
          });
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tab]);

  // Calculate revenue for chart
  const revenueByDay = transactions.reduce((acc, txn) => {
    if (txn.fee) {
      const day = new Date(txn.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + (txn.fee || 0);
    }
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(revenueByDay).map(([day, revenue]) => ({ day, revenue }));

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#181A20] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F0B90B] to-yellow-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#181A20]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#EAECEF]">Admin Control Panel</h1>
              <p className="text-xs text-[#848E9C]">
                Welcome back, {user?.firstName || 'Admin'} • {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              System Online
            </Badge>
            <Button 
              variant="outline" 
              className="border-[#2B3139] text-[#EAECEF]"
              onClick={() => navigate('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              Exit Admin
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        <Tabs value={tab} onValueChange={setTab} className="flex w-full">
          {/* Sidebar */}
          <div className="w-72 bg-[#1E2329] border-r border-[#2B3139] flex flex-col py-6 px-3">
            <div className="mb-6 px-3">
              <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30 px-3 py-1">
                Administrator Access
              </Badge>
            </div>
            
            <TabsList className="flex flex-col gap-1 bg-transparent">
              {adminSections.map((sec) => {
                const Icon = sec.icon;
                return (
                  <TabsTrigger
                    key={sec.key}
                    value={sec.key}
                    className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-left font-medium text-[#848E9C] hover:text-[#EAECEF] data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] transition-all"
                  >
                    <Icon className="w-5 h-5" />
                    {sec.label}
                    {sec.key === 'users' && stats.pendingKyc > 0 && (
                      <Badge className="ml-auto bg-yellow-500/20 text-yellow-400">
                        {stats.pendingKyc}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-auto pt-6 px-3">
              <Card className="bg-[#2B3139]/50 border-0 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-[#F0B90B]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#848E9C]">Signed in as</p>
                    <p className="text-sm font-medium text-[#EAECEF]">{user?.email}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatsCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={Users} change="+12% this month" changeType="positive" />
                <StatsCard title="Active Users" value={stats.activeUsers.toLocaleString()} icon={Activity} subtitle="Right now" />
                <StatsCard title="Total Deposits" value={`$${stats.totalDeposits.toLocaleString()}`} icon={DollarSign} change="+8.3%" changeType="positive" />
                <StatsCard title="Total Withdrawals" value={`$${stats.totalWithdrawals.toLocaleString()}`} icon={CreditCard} change="-2.1%" changeType="negative" />
                <StatsCard title="Total Trades" value={stats.totalTrades.toLocaleString()} icon={TrendingUp} subtitle="This month" />
                <StatsCard title="Pending KYC" value={stats.pendingKyc} icon={UserCheck} subtitle="Awaiting review" />
              </div>

              <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
                <h3 className="text-lg font-bold text-[#EAECEF] mb-2">Welcome to Swan IRA Admin</h3>
                <p className="text-[#848E9C]">
                  This is your comprehensive admin dashboard. Use the sidebar to manage users, 
                  view financial reports, monitor trading activity, configure investment products, 
                  adjust platform settings, and review security events.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card className="bg-[#2B3139]/50 border-0 p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#F0B90B]" />
                      <div>
                        <p className="text-sm font-medium text-[#EAECEF]">User Management</p>
                        <p className="text-xs text-[#848E9C]">View, edit, and manage users</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-[#2B3139]/50 border-0 p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-[#F0B90B]" />
                      <div>
                        <p className="text-sm font-medium text-[#EAECEF]">Financial Reports</p>
                        <p className="text-xs text-[#848E9C]">Track deposits and withdrawals</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="bg-[#2B3139]/50 border-0 p-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-[#F0B90B]" />
                      <div>
                        <p className="text-sm font-medium text-[#EAECEF]">Security Center</p>
                        <p className="text-xs text-[#848E9C]">Monitor threats and audit logs</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-0">
              <UserManagement />
            </TabsContent>

            {/* Finance Tab */}
            <TabsContent value="finance" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Assets" value="$1,200,000" icon={DollarSign} subtitle="Under management" />
                <StatsCard title="Total Liabilities" value="$350,000" icon={CreditCard} subtitle="Outstanding loans" />
                <StatsCard title="Net Worth" value="$850,000" icon={TrendingUp} change="+$45,000" changeType="positive" />
              </div>

              {/* Revenue Chart */}
              <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#F0B90B]" />
                    <h3 className="text-lg font-bold text-[#EAECEF]">Revenue (Last 7 Days)</h3>
                  </div>
                  <Select defaultValue="7d">
                    <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24h</SelectItem>
                      <SelectItem value="7d">Last 7d</SelectItem>
                      <SelectItem value="30d">Last 30d</SelectItem>
                      <SelectItem value="90d">Last 90d</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="h-64">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="flex items-center justify-center h-full text-red-400">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {error}
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                        <XAxis dataKey="day" stroke={COLORS.textSecondary} />
                        <YAxis stroke={COLORS.textSecondary} />
                        <Tooltip
                          contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.primary}`, borderRadius: '8px' }}
                          labelStyle={{ color: COLORS.primary }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} dot={{ fill: COLORS.primary }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-[#F0B90B]" />
                  <h3 className="text-lg font-bold text-[#EAECEF]">Recent Transactions</h3>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-6 h-6 text-[#F0B90B] animate-spin" />
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#181A20] text-[#F0B90B]">
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">User</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Amount</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((txn, i) => (
                          <tr key={txn.id} className="border-b border-[#2B3139] hover:bg-[#23262F]">
                            <td className="px-4 py-2 text-[#848E9C] text-xs">
                              {new Date(txn.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-[#EAECEF]">{txn.userEmail}</td>
                            <td className="px-4 py-2">
                              <Badge className={
                                txn.type === 'Deposit' ? 'bg-green-500/20 text-green-400' :
                                txn.type === 'Withdrawal' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'
                              }>
                                {txn.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-[#EAECEF]">${txn.value.toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <Badge className={
                                txn.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                txn.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }>
                                {txn.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-2 text-[#848E9C] font-mono text-xs">{txn.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Trading Tab */}
            <TabsContent value="trading" className="mt-0">
              <TradingAdminPanel />
            </TabsContent>

            {/* Investment Tab */}
            <TabsContent value="investment" className="mt-0">
              <InvestmentAdminPanel />
            </TabsContent>

            {/* Platform Tab */}
            <TabsContent value="platform" className="mt-0">
              <PlatformAdminPanel />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="mt-0">
              <SecurityAdminPanel />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0">
              <AnalyticsAdminPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Safe number helper
function safeNumber(val: any): number {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}