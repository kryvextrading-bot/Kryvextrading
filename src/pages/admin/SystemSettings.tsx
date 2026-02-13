import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Save,
  RefreshCw,
  AlertTriangle,
  Lock,
  Users,
  DollarSign,
  Globe,
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Fingerprint,
  Key,
  Clock,
  History,
  HardDrive,
  Cpu,
  Network,
  Mail,
  Phone,
  MessageSquare,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Cloud,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  FileText,
  Terminal,
  Wifi,
  Gauge,
  Layers,
  Code,
  Box,
  Zap as ZapIcon,
  Upload,
  Download,
  GitBranch,
  Cloud as CloudIcon,
  Rocket,
  Radio,
  Wifi as WifiIcon,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Camera,
  Video,
  Mic,
  Headphones,
  Speaker,
  Printer,
  Scan,
  QrCode,
  BarChart,
  LineChart,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Medal,
  Crown,
  Flag,
  Map,
  Compass,
  Navigation,
  Anchor,
  Ship,
  Truck,
  Car,
  Train,
  Plane,
  Bike,
  Bus,
  Rocket as RocketIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import apiService from '@/services/api';

interface SystemSettings {
  security: {
    twoFactorRequired: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    ipWhitelist: string[];
    maintenanceMode: boolean;
    lockoutDuration: number;
    passwordExpiryDays: number;
    requirePasswordHistory: number;
    maxSessionsPerUser: number;
    allowedAuthMethods: string[];
  };
  transactions: {
    maxTransactionAmount: number;
    requireApprovalThreshold: number;
    autoApprovalEnabled: boolean;
    riskScoringEnabled: boolean;
    transactionTimeout: number;
    dailyWithdrawalLimit: number;
    monthlyWithdrawalLimit: number;
    minTransactionAmount: number;
    maxPendingTransactions: number;
    requireMemoForCrypto: boolean;
    withdrawalFeePercentage: number;
    depositFeePercentage: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    adminAlerts: boolean;
    transactionAlerts: boolean;
    securityAlerts: boolean;
    marketingEmails: boolean;
    dailySummary: boolean;
    weeklyReport: boolean;
    alertEmail: string;
    alertPhone: string;
    slackWebhook: string;
    discordWebhook: string;
    telegramBotToken: string;
    webhookUrl: string;
    webhookSecret: string;
  };
  system: {
    maintenanceMode: boolean;
    backupFrequency: string;
    backupTime: string;
    logRetentionDays: number;
    apiRateLimit: number;
    maxConcurrentUsers: number;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    cacheTTL: number;
    maxUploadSize: number;
    allowedFileTypes: string[];
    defaultLanguage: string;
    timezone: string;
    version: string;
    lastUpdateCheck: string;
    autoUpdateEnabled: boolean;
    updateChannel: 'stable' | 'beta' | 'alpha';
  };
  compliance: {
    kycRequired: boolean;
    amlScreeningEnabled: boolean;
    sanctionListEnabled: boolean;
    pepCheckEnabled: boolean;
    riskAssessmentEnabled: boolean;
    documentRetentionDays: number;
    auditLogRetentionDays: number;
    gdprEnabled: boolean;
    ccpaEnabled: boolean;
    dataRetentionPolicy: string;
    amlThreshold: number;
    reportingEnabled: boolean;
    geoBlocking: string[];
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
    minOrderSize: number;
    maxOrderSize: number;
    stopOrdersEnabled: boolean;
    limitOrdersEnabled: boolean;
    marketOrdersEnabled: boolean;
    orderBookDepth: number;
    priceDecimalPlaces: number;
    amountDecimalPlaces: number;
    tradingHours: string;
    maintenanceWindows: string[];
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
    apiKeyPrefix: string;
    apiKeyExpiry: number;
    oauthProviders: {
      google: boolean;
      github: boolean;
      microsoft: boolean;
      twitter: boolean;
    };
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
    slowQueryThreshold: number;
    enableQueryLogging: boolean;
    enableAuditLogging: boolean;
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
    ssoDomain: string;
    slackEnabled: boolean;
    discordEnabled: boolean;
    telegramEnabled: boolean;
    twilioEnabled: boolean;
    sendgridEnabled: boolean;
  };
  backup: {
    autoBackup: boolean;
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    retention: number;
    location: string;
    lastBackup: string | null;
    backupSize: number;
    encryptionEnabled: boolean;
    compressionEnabled: boolean;
    backupTime: string;
    backupDay: string;
    includeDatabase: boolean;
    includeFiles: boolean;
    includeLogs: boolean;
  };
  monitoring: {
    enableMonitoring: boolean;
    alertOnError: boolean;
    alertOnSlowResponse: boolean;
    slowResponseThreshold: number;
    errorRateThreshold: number;
    uptimeThreshold: number;
    monitoringInterval: number;
    metricsRetention: number;
    enablePerformanceTracking: boolean;
    enableUserTracking: boolean;
    enableErrorTracking: boolean;
    slackAlerts: boolean;
    emailAlerts: boolean;
    pagerDutyKey: string;
    datadogApiKey: string;
    newRelicLicenseKey: string;
  };
}

const defaultSettings: SystemSettings = {
  security: {
    twoFactorRequired: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireStrongPassword: true,
    ipWhitelist: [],
    maintenanceMode: false,
    lockoutDuration: 15,
    passwordExpiryDays: 90,
    requirePasswordHistory: 3,
    maxSessionsPerUser: 3,
    allowedAuthMethods: ['password', '2fa', 'biometric'],
  },
  transactions: {
    maxTransactionAmount: 100000,
    requireApprovalThreshold: 10000,
    autoApprovalEnabled: true,
    riskScoringEnabled: true,
    transactionTimeout: 300,
    dailyWithdrawalLimit: 50000,
    monthlyWithdrawalLimit: 200000,
    minTransactionAmount: 10,
    maxPendingTransactions: 50,
    requireMemoForCrypto: true,
    withdrawalFeePercentage: 0.1,
    depositFeePercentage: 0,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: true,
    transactionAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
    dailySummary: true,
    weeklyReport: true,
    alertEmail: 'admin@swanira.com',
    alertPhone: '',
    slackWebhook: '',
    discordWebhook: '',
    telegramBotToken: '',
    webhookUrl: '',
    webhookSecret: '',
  },
  system: {
    maintenanceMode: false,
    backupFrequency: 'daily',
    backupTime: '02:00',
    logRetentionDays: 90,
    apiRateLimit: 1000,
    maxConcurrentUsers: 1000,
    environment: 'production',
    debugMode: false,
    cacheTTL: 3600,
    maxUploadSize: 10,
    allowedFileTypes: ['.jpg', '.png', '.pdf', '.doc'],
    defaultLanguage: 'en',
    timezone: 'UTC',
    version: '2.4.0',
    lastUpdateCheck: new Date().toISOString(),
    autoUpdateEnabled: true,
    updateChannel: 'stable',
  },
  compliance: {
    kycRequired: true,
    amlScreeningEnabled: true,
    sanctionListEnabled: true,
    pepCheckEnabled: true,
    riskAssessmentEnabled: true,
    documentRetentionDays: 365,
    auditLogRetentionDays: 2555,
    gdprEnabled: false,
    ccpaEnabled: false,
    dataRetentionPolicy: 'standard',
    amlThreshold: 10000,
    reportingEnabled: true,
    geoBlocking: [],
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
    minOrderSize: 10,
    maxOrderSize: 1000000,
    stopOrdersEnabled: true,
    limitOrdersEnabled: true,
    marketOrdersEnabled: true,
    orderBookDepth: 50,
    priceDecimalPlaces: 2,
    amountDecimalPlaces: 6,
    tradingHours: '24/7',
    maintenanceWindows: ['Sunday 02:00-04:00 UTC'],
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
    apiKeyPrefix: 'sk_live_',
    apiKeyExpiry: 365,
    oauthProviders: {
      google: false,
      github: false,
      microsoft: false,
      twitter: false,
    },
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
    slowQueryThreshold: 1000,
    enableQueryLogging: false,
    enableAuditLogging: true,
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
    ssoDomain: '',
    slackEnabled: false,
    discordEnabled: false,
    telegramEnabled: false,
    twilioEnabled: false,
    sendgridEnabled: false,
  },
  backup: {
    autoBackup: true,
    frequency: 'daily',
    retention: 30,
    location: 's3://swanira-backups',
    lastBackup: new Date().toISOString(),
    backupSize: 1.2 * 1024 * 1024 * 1024,
    encryptionEnabled: true,
    compressionEnabled: true,
    backupTime: '02:00',
    backupDay: 'Sunday',
    includeDatabase: true,
    includeFiles: true,
    includeLogs: false,
  },
  monitoring: {
    enableMonitoring: true,
    alertOnError: true,
    alertOnSlowResponse: true,
    slowResponseThreshold: 2000,
    errorRateThreshold: 1,
    uptimeThreshold: 99.9,
    monitoringInterval: 60,
    metricsRetention: 30,
    enablePerformanceTracking: true,
    enableUserTracking: true,
    enableErrorTracking: true,
    slackAlerts: false,
    emailAlerts: true,
    pagerDutyKey: '',
    datadogApiKey: '',
    newRelicLicenseKey: '',
  },
};

interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, icon, children }) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
    <CardHeader>
      <CardTitle className="flex items-center text-[#EAECEF]">
        <span className="text-[#F0B90B] mr-2">{icon}</span>
        {title}
      </CardTitle>
      <CardDescription className="text-[#848E9C]">{description}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

const SettingRow: React.FC<SettingRowProps> = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
    <div className="space-y-1">
      <Label className="text-[#EAECEF] text-sm font-medium">{label}</Label>
      {description && <p className="text-xs text-[#848E9C]">{description}</p>}
    </div>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('security');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setValidationErrors({});
      const data = await apiService.getSystemSettings();
      // Merge API response with default settings to ensure all properties exist
      const mergedSettings = {
        ...defaultSettings,
        ...(data as any),
        // Merge nested objects to preserve all properties
        security: { ...defaultSettings.security, ...(data as any).security },
        transactions: { ...defaultSettings.transactions, ...(data as any).transactions },
        notifications: { ...defaultSettings.notifications, ...(data as any).notifications },
        system: { ...defaultSettings.system, ...(data as any).system },
        compliance: { ...defaultSettings.compliance, ...(data as any).compliance },
        trading: { ...defaultSettings.trading, ...(data as any).trading },
        api: { ...defaultSettings.api, ...(data as any).api },
        database: { ...defaultSettings.database, ...(data as any).database },
        integrations: { ...defaultSettings.integrations, ...(data as any).integrations },
        backup: { ...defaultSettings.backup, ...(data as any).backup },
        monitoring: { ...defaultSettings.monitoring, ...(data as any).monitoring },
      };
      setSettings(mergedSettings);
      setLastSaved(new Date());
      toast({
        title: "Settings Loaded",
        description: "System settings loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
      // Fallback to default settings
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    // Validate before saving
    const errors = validateSettings();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await apiService.updateSystemSettings(settings);
      setUnsavedChanges(false);
      setLastSaved(new Date());
      toast({
        title: "Success",
        description: "System settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const validateSettings = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Security validation
    if (settings.security.passwordMinLength < 6) {
      errors.passwordMinLength = "Password length must be at least 6 characters";
    }
    if (settings.security.sessionTimeout < 5) {
      errors.sessionTimeout = "Session timeout must be at least 5 minutes";
    }
    if (settings.security.maxLoginAttempts < 3) {
      errors.maxLoginAttempts = "Max login attempts must be at least 3";
    }

    // Transaction validation
    if (settings.transactions.maxTransactionAmount < settings.transactions.requireApprovalThreshold) {
      errors.transactionAmount = "Max transaction amount must be greater than approval threshold";
    }
    if (settings.transactions.minTransactionAmount < 1) {
      errors.minTransactionAmount = "Minimum transaction amount must be at least 1";
    }

    // System validation
    if (settings.system.logRetentionDays < 30) {
      errors.logRetentionDays = "Log retention must be at least 30 days";
    }
    if (settings.system.apiRateLimit < 100) {
      errors.apiRateLimit = "API rate limit must be at least 100 requests/min";
    }

    // API validation
    if (settings.api.rateLimit < 10) {
      errors.apiRateLimit = "API rate limit must be at least 10 requests/min";
    }
    if (settings.api.jwtExpiry < 300) {
      errors.jwtExpiry = "JWT expiry must be at least 5 minutes";
    }

    // Database validation
    if (settings.database.connectionPool < 1) {
      errors.connectionPool = "Connection pool must be at least 1";
    }
    if (settings.database.queryTimeout < 1) {
      errors.queryTimeout = "Query timeout must be at least 1 second";
    }

    return errors;
  };

  const updateSetting = <T extends keyof SystemSettings>(
    section: T,
    key: keyof SystemSettings[T],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setUnsavedChanges(true);
    
    // Clear validation error for this field
    if (validationErrors[`${section}.${String(key)}`]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${String(key)}`];
        return newErrors;
      });
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings(defaultSettings);
      setUnsavedChanges(true);
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to defaults",
      });
    }
  };

  const getValidationError = (field: string): string | null => {
    return validationErrors[field] || null;
  };

  const handleRunBackup = async () => {
    toast({
      title: "Backup Started",
      description: "Manual backup process initiated.",
    });
    // Simulate backup
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSettings(prev => ({
      ...prev,
      backup: {
        ...prev.backup,
        lastBackup: new Date().toISOString(),
        backupSize: prev.backup.backupSize * 1.1,
      }
    }));
    toast({
      title: "Backup Complete",
      description: "System backup completed successfully.",
    });
  };

  const handleTestWebhook = async () => {
    toast({
      title: "Testing Webhook",
      description: "Test webhook sent successfully.",
    });
  };

  const handleCheckUpdates = async () => {
    toast({
      title: "Checking Updates",
      description: "Checking for system updates...",
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSettings(prev => ({
      ...prev,
      system: {
        ...prev.system,
        lastUpdateCheck: new Date().toISOString(),
      }
    }));
    toast({
      title: "Up to Date",
      description: "System is running the latest version.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-[#2B3139] rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-[#2B3139] rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-[#2B3139] rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-[#2B3139] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#EAECEF]">System Settings</h2>
            {unsavedChanges && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <p className="text-sm text-[#848E9C] mt-1">
            Configure system parameters, security settings, and platform behavior
          </p>
          {lastSaved && (
            <p className="text-xs text-[#5E6673] mt-1">
              Last saved: {lastSaved.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={loadSettings}
            disabled={isLoading || isSaving}
            className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={resetToDefaults}
            disabled={isSaving}
            className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F]"
          >
            Reset
          </Button>
          <Button 
            onClick={saveSettings}
            disabled={isSaving || !unsavedChanges}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* System Status Bar */}
      <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-[#EAECEF]">System Status:</span>
              <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F0B90B] rounded-full" />
              <span className="text-sm text-[#EAECEF]">Version:</span>
              <Badge className="bg-blue-500/20 text-blue-400">
                v{settings.system.version}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#F0B90B] rounded-full" />
              <span className="text-sm text-[#EAECEF]">Environment:</span>
              <Badge className={
                settings.system.environment === 'production' 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-yellow-500/20 text-yellow-400'
              }>
                {settings.system.environment}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#848E9C]">
            <span className="flex items-center gap-1">
              <HardDrive size={14} /> {settings.system.logRetentionDays}d retention
            </span>
            <span className="flex items-center gap-1">
              <Activity size={14} /> {settings.system.apiRateLimit} req/min
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {settings.system.maxConcurrentUsers} users
            </span>
            <span className="flex items-center gap-1">
              <Database size={14} /> {settings.backup.frequency} backups
            </span>
          </div>
        </div>
      </Card>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 bg-[#1E2329] p-1 rounded-xl">
          <TabsTrigger 
            value="security" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="trading" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Activity className="w-4 h-4 mr-2" />
            Trading
          </TabsTrigger>
          <TabsTrigger 
            value="notifications" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger 
            value="system" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Settings className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger 
            value="compliance" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger 
            value="api" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Code className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger 
            value="database" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger 
            value="integrations" 
            className="text-xs md:text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Authentication"
              description="Configure user authentication and session settings"
              icon={<Lock className="w-5 h-5" />}
            >
              <SettingRow 
                label="Two-Factor Authentication" 
                description="Require 2FA for all users"
              >
                <Switch
                  checked={settings.security.twoFactorRequired}
                  onCheckedChange={(checked) => updateSetting('security', 'twoFactorRequired', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow 
                label="Session Timeout" 
                description="Minutes of inactivity before logout"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-xs text-[#848E9C]">min</span>
                </div>
              </SettingRow>
              {getValidationError('sessionTimeout') && (
                <p className="text-xs text-red-400 mt-1">{getValidationError('sessionTimeout')}</p>
              )}

              <SettingRow 
                label="Max Login Attempts" 
                description="Failed attempts before lockout"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={3}
                    max={20}
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </SettingRow>

              <SettingRow 
                label="Lockout Duration" 
                description="Minutes user is locked out"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-xs text-[#848E9C]">min</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="Password Minimum Length" 
                description="Minimum characters required"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={6}
                    max={32}
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              </SettingRow>
              {getValidationError('passwordMinLength') && (
                <p className="text-xs text-red-400 mt-1">{getValidationError('passwordMinLength')}</p>
              )}

              <SettingRow 
                label="Password Expiry" 
                description="Days until password expires"
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={30}
                    max={365}
                    value={settings.security.passwordExpiryDays}
                    onChange={(e) => updateSetting('security', 'passwordExpiryDays', parseInt(e.target.value))}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <span className="text-xs text-[#848E9C]">days</span>
                </div>
              </SettingRow>

              <SettingRow 
                label="Require Strong Password" 
                description="Must contain uppercase, lowercase, numbers, special chars"
              >
                <Switch
                  checked={settings.security.requireStrongPassword}
                  onCheckedChange={(checked) => updateSetting('security', 'requireStrongPassword', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow 
                label="Max Sessions Per User" 
                description="Concurrent sessions allowed"
              >
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.security.maxSessionsPerUser}
                  onChange={(e) => updateSetting('security', 'maxSessionsPerUser', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="System Security"
              description="System-wide security configurations"
              icon={<ShieldCheck className="w-5 h-5" />}
            >
              <SettingRow 
                label="Maintenance Mode" 
                description="Block user access for maintenance"
              >
                <Switch
                  checked={settings.security.maintenanceMode}
                  onCheckedChange={(checked) => updateSetting('security', 'maintenanceMode', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow 
                label="IP Whitelist" 
                description="Comma-separated IP addresses"
              >
                <Input
                  placeholder="192.168.1.1, 10.0.0.1"
                  value={settings.security.ipWhitelist.join(', ')}
                  onChange={(e) => updateSetting('security', 'ipWhitelist', e.target.value.split(',').map(ip => ip.trim()))}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow 
                label="Allowed Auth Methods" 
                description="Select authentication methods"
              >
                <div className="flex flex-wrap gap-2">
                  {['password', '2fa', 'biometric'].map(method => (
                    <Button
                      key={method}
                      variant="outline"
                      size="sm"
                      className={`border-[#2B3139] ${
                        settings.security.allowedAuthMethods.includes(method)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const methods = settings.security.allowedAuthMethods.includes(method)
                          ? settings.security.allowedAuthMethods.filter(m => m !== method)
                          : [...settings.security.allowedAuthMethods, method];
                        updateSetting('security', 'allowedAuthMethods', methods);
                      }}
                    >
                      {method === 'password' && <Key className="w-3 h-3 mr-1" />}
                      {method === '2fa' && <Fingerprint className="w-3 h-3 mr-1" />}
                      {method === 'biometric' && <Eye className="w-3 h-3 mr-1" />}
                      {method}
                    </Button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow 
                label="Require Password History" 
                description="Number of previous passwords to remember"
              >
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.security.requirePasswordHistory}
                  onChange={(e) => updateSetting('security', 'requirePasswordHistory', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Transaction Limits"
              description="Configure transaction amount limits"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <SettingRow label="Maximum Transaction Amount ($)">
                <Input
                  type="number"
                  min={1000}
                  max={10000000}
                  value={settings.transactions.maxTransactionAmount}
                  onChange={(e) => updateSetting('transactions', 'maxTransactionAmount', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Minimum Transaction Amount ($)">
                <Input
                  type="number"
                  min={1}
                  value={settings.transactions.minTransactionAmount}
                  onChange={(e) => updateSetting('transactions', 'minTransactionAmount', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('minTransactionAmount') && (
                <p className="text-xs text-red-400">{getValidationError('minTransactionAmount')}</p>
              )}

              <SettingRow label="Daily Withdrawal Limit ($)">
                <Input
                  type="number"
                  value={settings.transactions.dailyWithdrawalLimit}
                  onChange={(e) => updateSetting('transactions', 'dailyWithdrawalLimit', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Monthly Withdrawal Limit ($)">
                <Input
                  type="number"
                  value={settings.transactions.monthlyWithdrawalLimit}
                  onChange={(e) => updateSetting('transactions', 'monthlyWithdrawalLimit', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Transaction Processing"
              description="Configure transaction processing settings"
              icon={<Server className="w-5 h-5" />}
            >
              <SettingRow label="Auto-Approval Enabled">
                <Switch
                  checked={settings.transactions.autoApprovalEnabled}
                  onCheckedChange={(checked) => updateSetting('transactions', 'autoApprovalEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Risk Scoring Enabled">
                <Switch
                  checked={settings.transactions.riskScoringEnabled}
                  onCheckedChange={(checked) => updateSetting('transactions', 'riskScoringEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Transaction Timeout (seconds)">
                <Input
                  type="number"
                  min={30}
                  max={3600}
                  value={settings.transactions.transactionTimeout}
                  onChange={(e) => updateSetting('transactions', 'transactionTimeout', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Approval Threshold ($)">
                <Input
                  type="number"
                  value={settings.transactions.requireApprovalThreshold}
                  onChange={(e) => updateSetting('transactions', 'requireApprovalThreshold', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('transactionAmount') && (
                <p className="text-xs text-red-400">{getValidationError('transactionAmount')}</p>
              )}

              <SettingRow label="Require Memo for Crypto">
                <Switch
                  checked={settings.transactions.requireMemoForCrypto}
                  onCheckedChange={(checked) => updateSetting('transactions', 'requireMemoForCrypto', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Withdrawal Fee (%)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={5}
                  value={settings.transactions.withdrawalFeePercentage}
                  onChange={(e) => updateSetting('transactions', 'withdrawalFeePercentage', parseFloat(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Deposit Fee (%)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={5}
                  value={settings.transactions.depositFeePercentage}
                  onChange={(e) => updateSetting('transactions', 'depositFeePercentage', parseFloat(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Max Pending Transactions">
                <Input
                  type="number"
                  value={settings.transactions.maxPendingTransactions}
                  onChange={(e) => updateSetting('transactions', 'maxPendingTransactions', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Trading Tab */}
        <TabsContent value="trading" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Trading Configuration"
              description="Enable/disable trading markets"
              icon={<Activity className="w-5 h-5" />}
            >
              <SettingRow label="Spot Trading">
                <Switch
                  checked={settings.trading.spotEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'spotEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Futures Trading">
                <Switch
                  checked={settings.trading.futuresEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'futuresEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Options Trading">
                <Switch
                  checked={settings.trading.optionsEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'optionsEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Margin Trading">
                <Switch
                  checked={settings.trading.marginEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'marginEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Maximum Leverage">
                <Select
                  value={settings.trading.maxLeverage.toString()}
                  onValueChange={(value) => updateSetting('trading', 'maxLeverage', parseInt(value))}
                >
                  <SelectTrigger className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 5, 10, 20, 50, 100].map(lev => (
                      <SelectItem key={lev} value={lev.toString()}>{lev}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Trading Hours">
                <Input
                  value={settings.trading.tradingHours}
                  onChange={(e) => updateSetting('trading', 'tradingHours', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="24/7"
                />
              </SettingRow>

              <SettingRow label="Maintenance Windows">
                <Textarea
                  value={settings.trading.maintenanceWindows.join('\n')}
                  onChange={(e) => updateSetting('trading', 'maintenanceWindows', e.target.value.split('\n'))}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  rows={2}
                  placeholder="One per line"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Order Settings"
              description="Configure order types and limits"
              icon={<Layers className="w-5 h-5" />}
            >
              <SettingRow label="Market Orders">
                <Switch
                  checked={settings.trading.marketOrdersEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'marketOrdersEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Limit Orders">
                <Switch
                  checked={settings.trading.limitOrdersEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'limitOrdersEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Stop Orders">
                <Switch
                  checked={settings.trading.stopOrdersEnabled}
                  onCheckedChange={(checked) => updateSetting('trading', 'stopOrdersEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Minimum Order Size (USDT)">
                <Input
                  type="number"
                  value={settings.trading.minOrderSize}
                  onChange={(e) => updateSetting('trading', 'minOrderSize', parseFloat(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Maximum Order Size (USDT)">
                <Input
                  type="number"
                  value={settings.trading.maxOrderSize}
                  onChange={(e) => updateSetting('trading', 'maxOrderSize', parseFloat(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Order Book Depth">
                <Input
                  type="number"
                  value={settings.trading.orderBookDepth}
                  onChange={(e) => updateSetting('trading', 'orderBookDepth', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Price Decimal Places">
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={settings.trading.priceDecimalPlaces}
                  onChange={(e) => updateSetting('trading', 'priceDecimalPlaces', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Amount Decimal Places">
                <Input
                  type="number"
                  min={0}
                  max={8}
                  value={settings.trading.amountDecimalPlaces}
                  onChange={(e) => updateSetting('trading', 'amountDecimalPlaces', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Fee Configuration"
              description="Trading fee settings"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <SettingRow label="Maker Fee (%)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={settings.trading.makerFee}
                  onChange={(e) => updateSetting('trading', 'makerFee', parseFloat(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Taker Fee (%)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={settings.trading.takerFee}
                  onChange={(e) => updateSetting('trading', 'takerFee', parseFloat(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Maintenance Fee (%)">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  value={settings.trading.maintenanceFee}
                  onChange={(e) => updateSetting('trading', 'maintenanceFee', parseFloat(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Notification Channels"
              description="Configure how notifications are sent"
              icon={<Bell className="w-5 h-5" />}
            >
              <SettingRow label="Email Notifications">
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="SMS Notifications">
                <Switch
                  checked={settings.notifications.smsNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Push Notifications">
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Alert Email Address">
                <Input
                  type="email"
                  value={settings.notifications.alertEmail}
                  onChange={(e) => updateSetting('notifications', 'alertEmail', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="admin@example.com"
                />
              </SettingRow>

              <SettingRow label="Alert Phone Number">
                <Input
                  value={settings.notifications.alertPhone}
                  onChange={(e) => updateSetting('notifications', 'alertPhone', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="+1234567890"
                />
              </SettingRow>

              <SettingRow label="Slack Webhook">
                <Input
                  value={settings.notifications.slackWebhook}
                  onChange={(e) => updateSetting('notifications', 'slackWebhook', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="https://hooks.slack.com/..."
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleTestWebhook}
                  className="border-[#2B3139]"
                >
                  Test
                </Button>
              </SettingRow>

              <SettingRow label="Discord Webhook">
                <Input
                  value={settings.notifications.discordWebhook}
                  onChange={(e) => updateSetting('notifications', 'discordWebhook', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </SettingRow>

              <SettingRow label="Telegram Bot Token">
                <Input
                  value={settings.notifications.telegramBotToken}
                  onChange={(e) => updateSetting('notifications', 'telegramBotToken', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="1234567890:ABCdef..."
                />
              </SettingRow>

              <SettingRow label="Webhook URL">
                <Input
                  value={settings.notifications.webhookUrl}
                  onChange={(e) => updateSetting('notifications', 'webhookUrl', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="https://api.example.com/webhook"
                />
              </SettingRow>

              <SettingRow label="Webhook Secret">
                <Input
                  type="password"
                  value={settings.notifications.webhookSecret}
                  onChange={(e) => updateSetting('notifications', 'webhookSecret', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="whsec_..."
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Alert Types"
              description="Configure which alerts to send"
              icon={<AlertTriangle className="w-5 h-5" />}
            >
              <SettingRow label="Admin Alerts">
                <Switch
                  checked={settings.notifications.adminAlerts}
                  onCheckedChange={(checked) => updateSetting('notifications', 'adminAlerts', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Transaction Alerts">
                <Switch
                  checked={settings.notifications.transactionAlerts}
                  onCheckedChange={(checked) => updateSetting('notifications', 'transactionAlerts', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Security Alerts">
                <Switch
                  checked={settings.notifications.securityAlerts}
                  onCheckedChange={(checked) => updateSetting('notifications', 'securityAlerts', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <Separator className="bg-[#2B3139] my-2" />

              <SettingRow label="Daily Summary">
                <Switch
                  checked={settings.notifications.dailySummary}
                  onCheckedChange={(checked) => updateSetting('notifications', 'dailySummary', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Weekly Report">
                <Switch
                  checked={settings.notifications.weeklyReport}
                  onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReport', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Marketing Emails">
                <Switch
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) => updateSetting('notifications', 'marketingEmails', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="System Configuration"
              description="Core system settings"
              icon={<Settings className="w-5 h-5" />}
            >
              <SettingRow label="Environment">
                <Select
                  value={settings.system.environment}
                  onValueChange={(value) => updateSetting('system', 'environment', value as any)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="staging">Staging</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Version">
                <div className="flex items-center gap-2">
                  <Input
                    value={settings.system.version}
                    onChange={(e) => updateSetting('system', 'version', e.target.value)}
                    className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  />
                  <Button size="sm" variant="outline" onClick={handleCheckUpdates}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Check
                  </Button>
                </div>
              </SettingRow>

              <SettingRow label="Auto Update Enabled">
                <Switch
                  checked={settings.system.autoUpdateEnabled}
                  onCheckedChange={(checked) => updateSetting('system', 'autoUpdateEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Update Channel">
                <Select
                  value={settings.system.updateChannel}
                  onValueChange={(value) => updateSetting('system', 'updateChannel', value as any)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="alpha">Alpha</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Debug Mode">
                <Switch
                  checked={settings.system.debugMode}
                  onCheckedChange={(checked) => updateSetting('system', 'debugMode', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Default Language">
                <Select
                  value={settings.system.defaultLanguage}
                  onValueChange={(value) => updateSetting('system', 'defaultLanguage', value)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Timezone">
                <Select
                  value={settings.system.timezone}
                  onValueChange={(value) => updateSetting('system', 'timezone', value)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">EST</SelectItem>
                    <SelectItem value="PST">PST</SelectItem>
                    <SelectItem value="CET">CET</SelectItem>
                    <SelectItem value="JST">JST</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Last Update Check">
                <div className="text-sm text-[#EAECEF]">
                  {new Date(settings.system.lastUpdateCheck).toLocaleString()}
                </div>
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Performance"
              description="Performance and scaling settings"
              icon={<Gauge className="w-5 h-5" />}
            >
              <SettingRow label="API Rate Limit (requests/min)">
                <Input
                  type="number"
                  min={100}
                  max={10000}
                  value={settings.system.apiRateLimit}
                  onChange={(e) => updateSetting('system', 'apiRateLimit', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('apiRateLimit') && (
                <p className="text-xs text-red-400">{getValidationError('apiRateLimit')}</p>
              )}

              <SettingRow label="Max Concurrent Users">
                <Input
                  type="number"
                  min={100}
                  max={100000}
                  value={settings.system.maxConcurrentUsers}
                  onChange={(e) => updateSetting('system', 'maxConcurrentUsers', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Cache TTL (seconds)">
                <Input
                  type="number"
                  value={settings.system.cacheTTL}
                  onChange={(e) => updateSetting('system', 'cacheTTL', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Max Upload Size (MB)">
                <Input
                  type="number"
                  value={settings.system.maxUploadSize}
                  onChange={(e) => updateSetting('system', 'maxUploadSize', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Allowed File Types">
                <Input
                  value={settings.system.allowedFileTypes.join(', ')}
                  onChange={(e) => updateSetting('system', 'allowedFileTypes', e.target.value.split(',').map(t => t.trim()))}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder=".jpg, .png, .pdf"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Backup & Retention"
              description="Configure backup and data retention"
              icon={<Database className="w-5 h-5" />}
            >
              <SettingRow label="Auto Backup">
                <Switch
                  checked={settings.backup.autoBackup}
                  onCheckedChange={(checked) => updateSetting('backup', 'autoBackup', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Backup Frequency">
                <Select
                  value={settings.backup.frequency}
                  onValueChange={(value) => updateSetting('backup', 'frequency', value as any)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Backup Time">
                <Input
                  type="time"
                  value={settings.backup.backupTime}
                  onChange={(e) => updateSetting('backup', 'backupTime', e.target.value)}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Backup Day">
                <Select
                  value={settings.backup.backupDay}
                  onValueChange={(value) => updateSetting('backup', 'backupDay', value)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Retention (days)">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.backup.retention}
                  onChange={(e) => updateSetting('backup', 'retention', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Backup Location">
                <Input
                  value={settings.backup.location}
                  onChange={(e) => updateSetting('backup', 'location', e.target.value)}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="s3://bucket/path"
                />
              </SettingRow>

              <SettingRow label="Encryption Enabled">
                <Switch
                  checked={settings.backup.encryptionEnabled}
                  onCheckedChange={(checked) => updateSetting('backup', 'encryptionEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Compression Enabled">
                <Switch
                  checked={settings.backup.compressionEnabled}
                  onCheckedChange={(checked) => updateSetting('backup', 'compressionEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Include Database">
                <Switch
                  checked={settings.backup.includeDatabase}
                  onCheckedChange={(checked) => updateSetting('backup', 'includeDatabase', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Include Files">
                <Switch
                  checked={settings.backup.includeFiles}
                  onCheckedChange={(checked) => updateSetting('backup', 'includeFiles', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Include Logs">
                <Switch
                  checked={settings.backup.includeLogs}
                  onCheckedChange={(checked) => updateSetting('backup', 'includeLogs', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Last Backup">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#EAECEF]">
                    {settings.backup.lastBackup ? new Date(settings.backup.lastBackup).toLocaleString() : 'Never'}
                  </span>
                  <Button size="sm" variant="outline" onClick={handleRunBackup}>
                    <Zap className="w-3 h-3 mr-1" />
                    Run Now
                  </Button>
                </div>
              </SettingRow>

              <SettingRow label="Backup Size">
                <span className="text-sm text-[#EAECEF]">
                  {(settings.backup.backupSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                </span>
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="KYC/AML Settings"
              description="Configure compliance requirements"
              icon={<Shield className="w-5 h-5" />}
            >
              <SettingRow label="KYC Required">
                <Switch
                  checked={settings.compliance.kycRequired}
                  onCheckedChange={(checked) => updateSetting('compliance', 'kycRequired', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="AML Screening">
                <Switch
                  checked={settings.compliance.amlScreeningEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'amlScreeningEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Sanction List Screening">
                <Switch
                  checked={settings.compliance.sanctionListEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'sanctionListEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="PEP Screening">
                <Switch
                  checked={settings.compliance.pepCheckEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'pepCheckEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Risk Assessment">
                <Switch
                  checked={settings.compliance.riskAssessmentEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'riskAssessmentEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="AML Threshold ($)">
                <Input
                  type="number"
                  value={settings.compliance.amlThreshold}
                  onChange={(e) => updateSetting('compliance', 'amlThreshold', parseInt(e.target.value))}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Reporting Enabled">
                <Switch
                  checked={settings.compliance.reportingEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'reportingEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Data Retention"
              description="Configure data retention policies"
              icon={<History className="w-5 h-5" />}
            >
              <SettingRow label="Document Retention (days)">
                <Input
                  type="number"
                  min={30}
                  max={7300}
                  value={settings.compliance.documentRetentionDays}
                  onChange={(e) => updateSetting('compliance', 'documentRetentionDays', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Audit Log Retention (days)">
                <Input
                  type="number"
                  min={365}
                  max={7300}
                  value={settings.compliance.auditLogRetentionDays}
                  onChange={(e) => updateSetting('compliance', 'auditLogRetentionDays', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <Separator className="bg-[#2B3139] my-2" />

              <SettingRow label="GDPR Compliance">
                <Switch
                  checked={settings.compliance.gdprEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'gdprEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="CCPA Compliance">
                <Switch
                  checked={settings.compliance.ccpaEnabled}
                  onCheckedChange={(checked) => updateSetting('compliance', 'ccpaEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Data Retention Policy">
                <Select
                  value={settings.compliance.dataRetentionPolicy}
                  onValueChange={(value) => updateSetting('compliance', 'dataRetentionPolicy', value)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              <SettingRow label="Geo-Blocking">
                <Input
                  value={settings.compliance.geoBlocking.join(', ')}
                  onChange={(e) => updateSetting('compliance', 'geoBlocking', e.target.value.split(',').map(c => c.trim()))}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="US, CN, RU"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="API Configuration"
              description="Configure API settings and limits"
              icon={<Code className="w-5 h-5" />}
            >
              <SettingRow label="Rate Limit (req/min)">
                <Input
                  type="number"
                  min={10}
                  max={10000}
                  value={settings.api.rateLimit}
                  onChange={(e) => updateSetting('api', 'rateLimit', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Rate Limit Burst">
                <Input
                  type="number"
                  min={10}
                  max={20000}
                  value={settings.api.rateLimitBurst}
                  onChange={(e) => updateSetting('api', 'rateLimitBurst', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="JWT Expiry (seconds)">
                <Input
                  type="number"
                  min={300}
                  max={86400}
                  value={settings.api.jwtExpiry}
                  onChange={(e) => updateSetting('api', 'jwtExpiry', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('jwtExpiry') && (
                <p className="text-xs text-red-400">{getValidationError('jwtExpiry')}</p>
              )}

              <SettingRow label="API Key Prefix">
                <Input
                  value={settings.api.apiKeyPrefix}
                  onChange={(e) => updateSetting('api', 'apiKeyPrefix', e.target.value)}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="sk_live_"
                />
              </SettingRow>

              <SettingRow label="API Key Expiry (days)">
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  value={settings.api.apiKeyExpiry}
                  onChange={(e) => updateSetting('api', 'apiKeyExpiry', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Require HTTPS">
                <Switch
                  checked={settings.api.requireHttps}
                  onCheckedChange={(checked) => updateSetting('api', 'requireHttps', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Enable CORS">
                <Switch
                  checked={settings.api.enableCors}
                  onCheckedChange={(checked) => updateSetting('api', 'enableCors', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Max Request Size (MB)">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.api.maxRequestSize}
                  onChange={(e) => updateSetting('api', 'maxRequestSize', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Request Timeout (seconds)">
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={settings.api.requestTimeout}
                  onChange={(e) => updateSetting('api', 'requestTimeout', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Authentication Methods"
              description="Configure API authentication"
              icon={<Lock className="w-5 h-5" />}
            >
              <SettingRow label="Authentication Methods">
                <div className="flex flex-wrap gap-2">
                  {['apiKey', 'jwt', 'oauth2'].map(method => (
                    <Button
                      key={method}
                      variant="outline"
                      size="sm"
                      className={`border-[#2B3139] ${
                        settings.api.authenticationMethods.includes(method as any)
                          ? 'bg-[#F0B90B] text-black border-[#F0B90B]'
                          : 'text-[#EAECEF]'
                      }`}
                      onClick={() => {
                        const methods = settings.api.authenticationMethods.includes(method as any)
                          ? settings.api.authenticationMethods.filter(m => m !== method)
                          : [...settings.api.authenticationMethods, method as any];
                        updateSetting('api', 'authenticationMethods', methods);
                      }}
                    >
                      {method === 'apiKey' && <Key className="w-3 h-3 mr-1" />}
                      {method === 'jwt' && <Lock className="w-3 h-3 mr-1" />}
                      {method === 'oauth2' && <Fingerprint className="w-3 h-3 mr-1" />}
                      {method}
                    </Button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="OAuth Providers">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#EAECEF]">Google</span>
                    <Switch
                      checked={settings.api.oauthProviders.google}
                      onCheckedChange={(checked) => updateSetting('api', 'oauthProviders', { ...settings.api.oauthProviders, google: checked })}
                      className="data-[state=checked]:bg-[#F0B90B]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#EAECEF]">GitHub</span>
                    <Switch
                      checked={settings.api.oauthProviders.github}
                      onCheckedChange={(checked) => updateSetting('api', 'oauthProviders', { ...settings.api.oauthProviders, github: checked })}
                      className="data-[state=checked]:bg-[#F0B90B]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#EAECEF]">Microsoft</span>
                    <Switch
                      checked={settings.api.oauthProviders.microsoft}
                      onCheckedChange={(checked) => updateSetting('api', 'oauthProviders', { ...settings.api.oauthProviders, microsoft: checked })}
                      className="data-[state=checked]:bg-[#F0B90B]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#EAECEF]">Twitter</span>
                    <Switch
                      checked={settings.api.oauthProviders.twitter}
                      onCheckedChange={(checked) => updateSetting('api', 'oauthProviders', { ...settings.api.oauthProviders, twitter: checked })}
                      className="data-[state=checked]:bg-[#F0B90B]"
                    />
                  </div>
                </div>
              </SettingRow>

              <SettingRow label="Allowed Origins">
                <Textarea
                  value={settings.api.allowedOrigins.join('\n')}
                  onChange={(e) => updateSetting('api', 'allowedOrigins', e.target.value.split('\n'))}
                  className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  rows={3}
                  placeholder="One per line"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Connection Settings"
              description="Configure database connection parameters"
              icon={<Database className="w-5 h-5" />}
            >
              <SettingRow label="Connection Pool">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.database.connectionPool}
                  onChange={(e) => updateSetting('database', 'connectionPool', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('connectionPool') && (
                <p className="text-xs text-red-400">{getValidationError('connectionPool')}</p>
              )}

              <SettingRow label="Max Connections">
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  value={settings.database.maxConnections}
                  onChange={(e) => updateSetting('database', 'maxConnections', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Query Timeout (seconds)">
                <Input
                  type="number"
                  min={1}
                  max={300}
                  value={settings.database.queryTimeout}
                  onChange={(e) => updateSetting('database', 'queryTimeout', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
              {getValidationError('queryTimeout') && (
                <p className="text-xs text-red-400">{getValidationError('queryTimeout')}</p>
              )}

              <SettingRow label="Slow Query Threshold (ms)">
                <Input
                  type="number"
                  min={100}
                  max={10000}
                  value={settings.database.slowQueryThreshold}
                  onChange={(e) => updateSetting('database', 'slowQueryThreshold', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="SSL Enabled">
                <Switch
                  checked={settings.database.sslEnabled}
                  onCheckedChange={(checked) => updateSetting('database', 'sslEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Enable Query Logging">
                <Switch
                  checked={settings.database.enableQueryLogging}
                  onCheckedChange={(checked) => updateSetting('database', 'enableQueryLogging', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Enable Audit Logging">
                <Switch
                  checked={settings.database.enableAuditLogging}
                  onCheckedChange={(checked) => updateSetting('database', 'enableAuditLogging', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Replication & Backup"
              description="Configure replication and backup settings"
              icon={<Server className="w-5 h-5" />}
            >
              <SettingRow label="Replication Enabled">
                <Switch
                  checked={settings.database.replicationEnabled}
                  onCheckedChange={(checked) => updateSetting('database', 'replicationEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Read Replicas">
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={settings.database.readReplicas}
                  onChange={(e) => updateSetting('database', 'readReplicas', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>

              <SettingRow label="Backup Schedule (cron)">
                <Input
                  value={settings.database.backupSchedule}
                  onChange={(e) => updateSetting('database', 'backupSchedule', e.target.value)}
                  className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                  placeholder="0 2 * * *"
                />
              </SettingRow>

              <SettingRow label="Backup Retention (days)">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.database.backupRetention}
                  onChange={(e) => updateSetting('database', 'backupRetention', parseInt(e.target.value))}
                  className="w-24 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                />
              </SettingRow>
            </SettingSection>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingSection
              title="Payment Providers"
              description="Configure payment gateway integrations"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <SettingRow label="Stripe Enabled">
                <Switch
                  checked={settings.integrations.stripeEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'stripeEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Plaid Enabled">
                <Switch
                  checked={settings.integrations.plaidEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'plaidEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Coinbase Enabled">
                <Switch
                  checked={settings.integrations.coinbaseEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'coinbaseEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Binance Enabled">
                <Switch
                  checked={settings.integrations.binanceEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'binanceEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="Communication"
              description="Configure communication integrations"
              icon={<Mail className="w-5 h-5" />}
            >
              <SettingRow label="Slack Enabled">
                <Switch
                  checked={settings.integrations.slackEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'slackEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Discord Enabled">
                <Switch
                  checked={settings.integrations.discordEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'discordEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Telegram Enabled">
                <Switch
                  checked={settings.integrations.telegramEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'telegramEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="Twilio Enabled">
                <Switch
                  checked={settings.integrations.twilioEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'twilioEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="SendGrid Enabled">
                <Switch
                  checked={settings.integrations.sendgridEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'sendgridEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>
            </SettingSection>

            <SettingSection
              title="SSO Integration"
              description="Configure Single Sign-On"
              icon={<Fingerprint className="w-5 h-5" />}
            >
              <SettingRow label="SSO Enabled">
                <Switch
                  checked={settings.integrations.ssoEnabled}
                  onCheckedChange={(checked) => updateSetting('integrations', 'ssoEnabled', checked)}
                  className="data-[state=checked]:bg-[#F0B90B]"
                />
              </SettingRow>

              <SettingRow label="SSO Provider">
                <Select
                  value={settings.integrations.ssoProvider || 'none'}
                  onValueChange={(value) => updateSetting('integrations', 'ssoProvider', value === 'none' ? null : value as any)}
                >
                  <SelectTrigger className="w-32 bg-[#181A20] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="microsoft">Microsoft</SelectItem>
                    <SelectItem value="okta">Okta</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              {settings.integrations.ssoProvider && (
                <>
                  <SettingRow label="Client ID">
                    <Input
                      value={settings.integrations.ssoClientId}
                      onChange={(e) => updateSetting('integrations', 'ssoClientId', e.target.value)}
                      className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      placeholder="client_id_123"
                    />
                  </SettingRow>

                  <SettingRow label="Client Secret">
                    <Input
                      type="password"
                      value={settings.integrations.ssoClientSecret}
                      onChange={(e) => updateSetting('integrations', 'ssoClientSecret', e.target.value)}
                      className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      placeholder="••••••••"
                    />
                  </SettingRow>

                  <SettingRow label="Domain">
                    <Input
                      value={settings.integrations.ssoDomain}
                      onChange={(e) => updateSetting('integrations', 'ssoDomain', e.target.value)}
                      className="bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
                      placeholder="company.okta.com"
                    />
                  </SettingRow>
                </>
              )}
            </SettingSection>
          </div>
        </TabsContent>
      </Tabs>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">You have unsaved changes</p>
                <p className="text-xs text-[#EAECEF] mt-1">
                  Your changes will be lost if you navigate away without saving.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSettings()}
                  className="border-yellow-500/30 text-yellow-400"
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={saveSettings}
                  className="bg-yellow-500 text-black hover:bg-yellow-600"
                  disabled={isSaving}
                >
                  Save Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}