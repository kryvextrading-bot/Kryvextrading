import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Settings,
  Save,
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Globe,
  Building,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Zap,
  Award,
  Medal,
  Crown,
  Sparkles,
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
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Info,
  HelpCircle,
  BookOpen,
  FileText,
  Archive,
  Download,
  Upload,
  Printer,
  Mail,
  MessageSquare,
  Bell,
  Clock,
  Calendar,
  Hash,
  AtSign,
  Link,
  Unlink,
  ExternalLink,
  GitBranch,
  GitMerge,
  GitPullRequest,
  Code,
  Terminal,
  Box,
  Layers,
  Cpu,
  HardDrive,
  Database,
  Cloud as CloudIcon,
  Server,
  Network,
  Wifi,
  Bluetooth,
  Radio,
  Satellite,
  Podcast,
  Rss,
  Share,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Heart,
  HeartOff,
  Star,
  StarOff,
  Bookmark,
  BookmarkCheck,
  Flag,
  FlagOff,
  Ban,
  Circle,
  CircleDot,
  CircleOff,
  Square,
  SquareCheck,
  SquareX,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info as InfoIcon,
  HelpCircle as HelpCircleIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  Sliders,
  Settings as SettingsIcon,
  Tool,
  Wrench,
  Hammer,
  Screwdriver,
  Nut,
  Bolt,
  Cog,
  Gauge,
  Speedometer,
  Tachometer,
  Thermometer,
  Compass,
  Map,
  MapPin,
  Navigation,
  Anchor,
  Ship,
  Truck,
  Car,
  Train,
  Plane,
  Bike,
  Bus,
  Rocket,
  Satellite as SatelliteIcon,
  Space,
  Planet,
  Star as StarIcon,
  Galaxy,
  Comet,
  Asteroid,
  Meteor,
  BlackHole,
  Wormhole,
  TimeMachine,
  Portal,
  Dimension,
  Universe,
  Multiverse,
  Infinity,
  Atom,
  Molecule,
  Dna,
  Gene,
  Cell,
  Bacteria,
  Virus,
  Microbe,
  Fungus,
  Plant,
  Animal,
  Human,
  Robot,
  Android,
  Ios,
  Windows,
  Linux,
  Apple as AppleIcon,
  Google,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Twitch,
  Discord,
  Slack,
  Teams,
  Zoom,
  Meet,
  Hangouts,
  Skype,
  Whatsapp,
  Telegram,
  Signal,
  Wechat,
  Line,
  Kakao,
  Viber,
  Snapchat,
  TikTok,
  Reddit,
  Pinterest,
  Tumblr,
  Flickr,
  Deviantart,
  Behance,
  Dribbble,
  Figma,
  Sketch,
  Photoshop,
  Illustrator,
  Indesign,
  Lightroom,
  Premiere,
  AfterEffects,
  Audition,
  Animate,
  Dreamweaver,
  Muse,
  Fireworks,
  Flash,
  Flex,
  Air,
  Shockwave,
  Director,
  Authorware,
  ColdFusion,
  JRun,
  WebLogic,
  WebSphere,
  JBoss,
  Tomcat,
  Jetty,
  GlassFish,
  Payara,
  WildFly,
  Undertow,
  Netty,
  Grizzly,
  Mina,
  Camel,
  ActiveMQ,
  Artemis,
  HornetQ,
  RabbitMQ,
  Kafka,
  Pulsar,
  RocketMQ,
  SQS,
  SNS,
  Lambda,
  API Gateway,
  DynamoDB,
  MongoDB,
  PostgreSQL,
  MySQL,
  MariaDB,
  Oracle,
  SQLServer,
  DB2,
  Sybase,
  Informix,
  Teradata,
  Hive,
  Pig,
  Spark,
  Flink,
  Storm,
  Samza,
  Beam,
  Dataflow,
  Dataproc,
  EMR,
  Glue,
  Athena,
  Redshift,
  BigQuery,
  Snowflake,
  Databricks,
  Synapse,
  Fabric,
  PowerBI,
  Tableau,
  Qlik,
  Looker,
  Mode,
  Periscope,
  Chartio,
  Metabase,
  Superset,
  Redash,
  Grafana,
  Kibana,
  Splunk,
  Datadog,
  NewRelic,
  AppDynamics,
  Dynatrace,
  Instana,
  Prometheus,
  Thanos,
  Cortex,
  Mimir,
  Loki,
  Tempo,
  Jaeger,
  Zipkin,
  SkyWalking,
  Pinpoint,
  Scout,
  Sentry,
  Rollbar,
  Bugsnag,
  Airbrake,
  Honeybadger,
  Exceptionless,
  Raygun,
  TrackJS,
  LogRocket,
  FullStory,
  Hotjar,
  Mouseflow,
  CrazyEgg,
  LuckyOrange,
  Clicky,
  Matomo,
  Piwik,
  GoogleAnalytics,
  AdobeAnalytics,
  Mixpanel,
  Amplitude,
  Segment,
  Rudderstack,
  Freshpaint,
  Heap,
  Kissmetrics,
  Woopra,
  CustomerIO,
  Braze,
  Leanplum,
  Appboy,
  UrbanAirship,
  Airship,
  OneSignal,
  Pushwoosh,
  Pusher,
  PubNub,
  Ably,
  SocketIO,
  WS,
  WSS,
  MQTT,
  CoAP,
  AMQP,
  STOMP,
  XMPP,
  SIP,
  RTP,
  RTSP,
  RTMP,
  HLS,
  DASH,
  MPEG,
  H264,
  H265,
  VP8,
  VP9,
  AV1,
  HEVC,
  AAC,
  MP3,
  OGG,
  FLAC,
  WAV,
  AIFF,
  MIDI,
  MOD,
  S3M,
  XM,
  IT,
  MTM,
  UMX
} from 'lucide-react';

// ==================== TYPES ====================
interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'user' | 'trading' | 'investment' | 'finance' | 'compliance' | 'system' | 'analytics' | 'admin';
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'reject' | 'export' | 'import';
  constraints?: {
    ipRestricted?: boolean;
    timeRestricted?: boolean;
    mfaRequired?: boolean;
    approvalRequired?: boolean;
    maxAmount?: number;
  };
}

interface Role {
  id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  permissions: string[]; // Permission IDs
  users: string[]; // User IDs
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isDefault?: boolean;
  isProtected?: boolean;
  priority: number; // Lower number = higher priority
  metadata?: {
    color?: string;
    icon?: string;
    badge?: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string; // Role ID
  department?: string;
  title?: string;
  mfaEnabled: boolean;
  lastLogin?: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminEmail: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'revoke';
  targetType: 'role' | 'permission' | 'user';
  targetId: string;
  targetName: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  ipAddress: string;
  userAgent: string;
}

// ==================== MOCK DATA ====================
const mockPermissions: Permission[] = [
  // User Management
  {
    id: 'user_view',
    name: 'View Users',
    description: 'View user profiles and basic information',
    category: 'user',
    resource: 'user',
    action: 'read',
  },
  {
    id: 'user_create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'user',
    resource: 'user',
    action: 'create',
  },
  {
    id: 'user_edit',
    name: 'Edit Users',
    description: 'Modify user profiles and settings',
    category: 'user',
    resource: 'user',
    action: 'update',
  },
  {
    id: 'user_delete',
    name: 'Delete Users',
    description: 'Permanently delete user accounts',
    category: 'user',
    resource: 'user',
    action: 'delete',
    constraints: {
      mfaRequired: true,
      approvalRequired: true,
    },
  },
  {
    id: 'user_suspend',
    name: 'Suspend Users',
    description: 'Temporarily suspend user accounts',
    category: 'user',
    resource: 'user',
    action: 'update',
  },
  {
    id: 'user_activate',
    name: 'Activate Users',
    description: 'Activate suspended user accounts',
    category: 'user',
    resource: 'user',
    action: 'update',
  },
  {
    id: 'user_kyc_view',
    name: 'View KYC Documents',
    description: 'View user KYC verification documents',
    category: 'user',
    resource: 'user.kyc',
    action: 'read',
    constraints: {
      mfaRequired: true,
    },
  },
  {
    id: 'user_kyc_approve',
    name: 'Approve KYC',
    description: 'Approve user KYC verification',
    category: 'user',
    resource: 'user.kyc',
    action: 'approve',
  },
  {
    id: 'user_kyc_reject',
    name: 'Reject KYC',
    description: 'Reject user KYC verification',
    category: 'user',
    resource: 'user.kyc',
    action: 'reject',
  },

  // Trading
  {
    id: 'trade_view',
    name: 'View Trades',
    description: 'View all trading activity',
    category: 'trading',
    resource: 'trade',
    action: 'read',
  },
  {
    id: 'trade_execute',
    name: 'Execute Trades',
    description: 'Execute trades on behalf of users',
    category: 'trading',
    resource: 'trade',
    action: 'create',
  },
  {
    id: 'trade_cancel',
    name: 'Cancel Trades',
    description: 'Cancel open orders',
    category: 'trading',
    resource: 'trade',
    action: 'delete',
  },
  {
    id: 'trade_force_win',
    name: 'Force Win',
    description: 'Force user trades to be winning',
    category: 'trading',
    resource: 'trade',
    action: 'manage',
  },
  {
    id: 'trade_force_loss',
    name: 'Force Loss',
    description: 'Force user trades to be losing',
    category: 'trading',
    resource: 'trade',
    action: 'manage',
  },

  // Investment
  {
    id: 'investment_view',
    name: 'View Investments',
    description: 'View investment products',
    category: 'investment',
    resource: 'investment',
    action: 'read',
  },
  {
    id: 'investment_create',
    name: 'Create Investments',
    description: 'Create new investment products',
    category: 'investment',
    resource: 'investment',
    action: 'create',
  },
  {
    id: 'investment_edit',
    name: 'Edit Investments',
    description: 'Modify investment products',
    category: 'investment',
    resource: 'investment',
    action: 'update',
  },
  {
    id: 'investment_delete',
    name: 'Delete Investments',
    description: 'Delete investment products',
    category: 'investment',
    resource: 'investment',
    action: 'delete',
  },

  // Finance
  {
    id: 'transaction_view',
    name: 'View Transactions',
    description: 'View all financial transactions',
    category: 'finance',
    resource: 'transaction',
    action: 'read',
  },
  {
    id: 'transaction_approve',
    name: 'Approve Transactions',
    description: 'Approve pending transactions',
    category: 'finance',
    resource: 'transaction',
    action: 'approve',
    constraints: {
      maxAmount: 100000,
    },
  },
  {
    id: 'transaction_reject',
    name: 'Reject Transactions',
    description: 'Reject pending transactions',
    category: 'finance',
    resource: 'transaction',
    action: 'reject',
  },
  {
    id: 'transaction_refund',
    name: 'Refund Transactions',
    description: 'Process transaction refunds',
    category: 'finance',
    resource: 'transaction',
    action: 'manage',
  },
  {
    id: 'funds_add',
    name: 'Add Funds',
    description: 'Add funds to user accounts',
    category: 'finance',
    resource: 'user.funds',
    action: 'update',
    constraints: {
      maxAmount: 50000,
    },
  },
  {
    id: 'funds_withdraw',
    name: 'Withdraw Funds',
    description: 'Withdraw funds from user accounts',
    category: 'finance',
    resource: 'user.funds',
    action: 'update',
    constraints: {
      maxAmount: 50000,
    },
  },

  // Compliance
  {
    id: 'compliance_view',
    name: 'View Compliance',
    description: 'View compliance reports',
    category: 'compliance',
    resource: 'compliance',
    action: 'read',
  },
  {
    id: 'compliance_report',
    name: 'Generate Reports',
    description: 'Generate compliance reports',
    category: 'compliance',
    resource: 'compliance',
    action: 'create',
  },
  {
    id: 'compliance_audit',
    name: 'Audit Logs',
    description: 'View audit logs',
    category: 'compliance',
    resource: 'audit',
    action: 'read',
  },
  {
    id: 'compliance_export',
    name: 'Export Data',
    description: 'Export compliance data',
    category: 'compliance',
    resource: 'compliance',
    action: 'export',
  },

  // System
  {
    id: 'system_view',
    name: 'View System',
    description: 'View system settings',
    category: 'system',
    resource: 'system',
    action: 'read',
  },
  {
    id: 'system_edit',
    name: 'Edit System',
    description: 'Modify system settings',
    category: 'system',
    resource: 'system',
    action: 'update',
  },
  {
    id: 'system_maintenance',
    name: 'Maintenance Mode',
    description: 'Toggle maintenance mode',
    category: 'system',
    resource: 'system',
    action: 'manage',
  },
  {
    id: 'system_backup',
    name: 'Backup System',
    description: 'Perform system backups',
    category: 'system',
    resource: 'system',
    action: 'create',
  },

  // Analytics
  {
    id: 'analytics_view',
    name: 'View Analytics',
    description: 'View analytics dashboards',
    category: 'analytics',
    resource: 'analytics',
    action: 'read',
  },
  {
    id: 'analytics_export',
    name: 'Export Analytics',
    description: 'Export analytics data',
    category: 'analytics',
    resource: 'analytics',
    action: 'export',
  },
  {
    id: 'analytics_custom',
    name: 'Custom Reports',
    description: 'Create custom analytics reports',
    category: 'analytics',
    resource: 'analytics',
    action: 'create',
  },

  // Admin
  {
    id: 'admin_view',
    name: 'View Admin',
    description: 'View admin dashboard',
    category: 'admin',
    resource: 'admin',
    action: 'read',
  },
  {
    id: 'admin_role_view',
    name: 'View Roles',
    description: 'View role definitions',
    category: 'admin',
    resource: 'admin.role',
    action: 'read',
  },
  {
    id: 'admin_role_create',
    name: 'Create Roles',
    description: 'Create new roles',
    category: 'admin',
    resource: 'admin.role',
    action: 'create',
  },
  {
    id: 'admin_role_edit',
    name: 'Edit Roles',
    description: 'Modify existing roles',
    category: 'admin',
    resource: 'admin.role',
    action: 'update',
  },
  {
    id: 'admin_role_delete',
    name: 'Delete Roles',
    description: 'Delete custom roles',
    category: 'admin',
    resource: 'admin.role',
    action: 'delete',
    constraints: {
      mfaRequired: true,
    },
  },
  {
    id: 'admin_permission_view',
    name: 'View Permissions',
    description: 'View permission definitions',
    category: 'admin',
    resource: 'admin.permission',
    action: 'read',
  },
  {
    id: 'admin_permission_assign',
    name: 'Assign Permissions',
    description: 'Assign permissions to roles',
    category: 'admin',
    resource: 'admin.permission',
    action: 'update',
  },
  {
    id: 'admin_user_assign',
    name: 'Assign Roles',
    description: 'Assign roles to users',
    category: 'admin',
    resource: 'admin.user',
    action: 'update',
  },
];

const mockRoles: Role[] = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    description: 'Full system access with all permissions',
    type: 'system',
    permissions: mockPermissions.map(p => p.id),
    users: ['1', '2'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-15T10:30:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 1,
    metadata: {
      color: 'purple',
      icon: '👑',
      badge: 'SUPER',
    },
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Administrative access with most permissions',
    type: 'system',
    permissions: mockPermissions.filter(p => 
      !p.id.includes('delete') && 
      !p.id.includes('force') &&
      !p.id.includes('backup')
    ).map(p => p.id),
    users: ['3', '4'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-14T15:45:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 2,
    metadata: {
      color: 'blue',
      icon: '⚙️',
      badge: 'ADMIN',
    },
  },
  {
    id: 'finance',
    name: 'Finance Manager',
    description: 'Access to financial operations and reports',
    type: 'system',
    permissions: mockPermissions.filter(p => 
      p.category === 'finance' || 
      p.category === 'compliance' ||
      p.id === 'user_view'
    ).map(p => p.id),
    users: ['5'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-13T09:20:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 3,
    metadata: {
      color: 'green',
      icon: '💰',
      badge: 'FINANCE',
    },
  },
  {
    id: 'compliance',
    name: 'Compliance Officer',
    description: 'Access to compliance and audit features',
    type: 'system',
    permissions: mockPermissions.filter(p => 
      p.category === 'compliance' || 
      p.id === 'user_kyc_view' ||
      p.id === 'user_view'
    ).map(p => p.id),
    users: ['6'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-12T14:10:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 4,
    metadata: {
      color: 'yellow',
      icon: '⚖️',
      badge: 'COMPLIANCE',
    },
  },
  {
    id: 'trader',
    name: 'Trader',
    description: 'Access to trading operations',
    type: 'system',
    permissions: mockPermissions.filter(p => 
      p.category === 'trading' ||
      p.id === 'investment_view' ||
      p.id === 'user_view'
    ).map(p => p.id),
    users: ['7'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-11T11:30:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 5,
    metadata: {
      color: 'orange',
      icon: '📈',
      badge: 'TRADER',
    },
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Basic access for customer support',
    type: 'system',
    permissions: mockPermissions.filter(p => 
      p.id === 'user_view' ||
      p.id === 'user_kyc_view' ||
      p.id === 'trade_view' ||
      p.id === 'investment_view' ||
      p.id === 'transaction_view'
    ).map(p => p.id),
    users: ['8', '9'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-07-10T16:45:00Z',
    createdBy: 'system',
    isDefault: true,
    isProtected: true,
    priority: 6,
    metadata: {
      color: 'teal',
      icon: '🎧',
      badge: 'SUPPORT',
    },
  },
  {
    id: 'custom_1',
    name: 'Investment Analyst',
    description: 'Custom role for investment analysis team',
    type: 'custom',
    permissions: mockPermissions.filter(p => 
      p.category === 'investment' ||
      p.category === 'analytics' ||
      p.id === 'user_view'
    ).map(p => p.id),
    users: [],
    createdAt: '2024-07-01T08:00:00Z',
    updatedAt: '2024-07-01T08:00:00Z',
    createdBy: 'superadmin',
    isDefault: false,
    isProtected: false,
    priority: 10,
    metadata: {
      color: 'cyan',
      icon: '🔍',
      badge: 'ANALYST',
    },
  },
  {
    id: 'custom_2',
    name: 'Risk Manager',
    description: 'Custom role for risk management',
    type: 'custom',
    permissions: mockPermissions.filter(p => 
      p.category === 'compliance' ||
      p.category === 'trading' ||
      p.id === 'analytics_view'
    ).map(p => p.id),
    users: [],
    createdAt: '2024-07-05T10:30:00Z',
    updatedAt: '2024-07-05T10:30:00Z',
    createdBy: 'superadmin',
    isDefault: false,
    isProtected: false,
    priority: 11,
    metadata: {
      color: 'red',
      icon: '⚠️',
      badge: 'RISK',
    },
  },
];

const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@swanira.com',
    role: 'superadmin',
    department: 'Executive',
    title: 'Chief Technology Officer',
    mfaEnabled: true,
    lastLogin: '2024-07-15T09:30:00Z',
    status: 'active',
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.c@swanira.com',
    role: 'superadmin',
    department: 'Executive',
    title: 'Chief Security Officer',
    mfaEnabled: true,
    lastLogin: '2024-07-15T08:45:00Z',
    status: 'active',
  },
  {
    id: '3',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@swanira.com',
    role: 'admin',
    department: 'IT',
    title: 'System Administrator',
    mfaEnabled: true,
    lastLogin: '2024-07-15T10:15:00Z',
    status: 'active',
  },
  {
    id: '4',
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.k@swanira.com',
    role: 'admin',
    department: 'IT',
    title: 'Database Administrator',
    mfaEnabled: true,
    lastLogin: '2024-07-14T16:20:00Z',
    status: 'active',
  },
  {
    id: '5',
    firstName: 'Jessica',
    lastName: 'Wong',
    email: 'jessica.w@swanira.com',
    role: 'finance',
    department: 'Finance',
    title: 'Finance Manager',
    mfaEnabled: true,
    lastLogin: '2024-07-15T11:00:00Z',
    status: 'active',
  },
  {
    id: '6',
    firstName: 'Robert',
    lastName: 'Martinez',
    email: 'robert.m@swanira.com',
    role: 'compliance',
    department: 'Compliance',
    title: 'Compliance Officer',
    mfaEnabled: true,
    lastLogin: '2024-07-15T09:45:00Z',
    status: 'active',
  },
  {
    id: '7',
    firstName: 'Amanda',
    lastName: 'Taylor',
    email: 'amanda.t@swanira.com',
    role: 'trader',
    department: 'Trading',
    title: 'Senior Trader',
    mfaEnabled: false,
    lastLogin: '2024-07-14T14:30:00Z',
    status: 'active',
  },
  {
    id: '8',
    firstName: 'Kevin',
    lastName: 'Brown',
    email: 'kevin.b@swanira.com',
    role: 'support',
    department: 'Support',
    title: 'Support Lead',
    mfaEnabled: true,
    lastLogin: '2024-07-15T08:00:00Z',
    status: 'active',
  },
  {
    id: '9',
    firstName: 'Lisa',
    lastName: 'Davis',
    email: 'lisa.d@swanira.com',
    role: 'support',
    department: 'Support',
    title: 'Support Agent',
    mfaEnabled: false,
    lastLogin: '2024-07-14T22:15:00Z',
    status: 'active',
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-07-15T10:30:00Z',
    adminId: '1',
    adminEmail: 'sarah.j@swanira.com',
    action: 'create',
    targetType: 'role',
    targetId: 'custom_3',
    targetName: 'Data Analyst',
    changes: [
      { field: 'name', oldValue: null, newValue: 'Data Analyst' },
      { field: 'permissions', oldValue: null, newValue: 'analytics_view,analytics_export' },
    ],
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome/120.0.0.0',
  },
  {
    id: '2',
    timestamp: '2024-07-14T15:45:00Z',
    adminId: '2',
    adminEmail: 'michael.c@swanira.com',
    action: 'update',
    targetType: 'permission',
    targetId: 'user_delete',
    targetName: 'Delete Users',
    changes: [
      { field: 'constraints.mfaRequired', oldValue: false, newValue: true },
    ],
    ipAddress: '192.168.1.101',
    userAgent: 'Firefox/121.0',
  },
  {
    id: '3',
    timestamp: '2024-07-13T09:20:00Z',
    adminId: '1',
    adminEmail: 'sarah.j@swanira.com',
    action: 'assign',
    targetType: 'user',
    targetId: '10',
    targetName: 'John Smith',
    changes: [
      { field: 'role', oldValue: 'user', newValue: 'finance' },
    ],
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome/120.0.0.0',
  },
  {
    id: '4',
    timestamp: '2024-07-12T14:10:00Z',
    adminId: '3',
    adminEmail: 'emily.r@swanira.com',
    action: 'delete',
    targetType: 'role',
    targetId: 'custom_4',
    targetName: 'Test Role',
    changes: [],
    ipAddress: '192.168.1.102',
    userAgent: 'Safari/17.4',
  },
  {
    id: '5',
    timestamp: '2024-07-11T11:30:00Z',
    adminId: '2',
    adminEmail: 'michael.c@swanira.com',
    action: 'revoke',
    targetType: 'user',
    targetId: '11',
    targetName: 'Jane Doe',
    changes: [
      { field: 'role', oldValue: 'admin', newValue: 'user' },
    ],
    ipAddress: '192.168.1.101',
    userAgent: 'Firefox/121.0',
  },
];

// ==================== HELPER FUNCTIONS ====================
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'user': return <Users className="w-4 h-4" />;
    case 'trading': return <TrendingUp className="w-4 h-4" />;
    case 'investment': return <Briefcase className="w-4 h-4" />;
    case 'finance': return <DollarSign className="w-4 h-4" />;
    case 'compliance': return <Shield className="w-4 h-4" />;
    case 'system': return <Settings className="w-4 h-4" />;
    case 'analytics': return <BarChart3 className="w-4 h-4" />;
    case 'admin': return <ShieldCheck className="w-4 h-4" />;
    default: return <HelpCircle className="w-4 h-4" />;
  }
};

const getRoleColor = (color: string) => {
  switch (color) {
    case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'green': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'yellow': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'orange': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'teal': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    case 'cyan': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'red': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== STATS CARD COMPONENT ====================
const StatsCard = ({ title, value, icon: Icon, subtitle }: any) => (
  <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#848E9C]">{title}</p>
          <p className="text-xl font-bold text-[#EAECEF] mt-1">{value}</p>
          {subtitle && <p className="text-xs text-[#5E6673] mt-1">{subtitle}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#F0B90B]" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== ROLE CARD COMPONENT ====================
const RoleCard = ({
  role,
  onEdit,
  onDelete,
  onDuplicate,
  onViewPermissions,
  isSuperAdmin,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onViewPermissions: () => void;
  isSuperAdmin: boolean;
}) => {
  const userCount = role.users.length;
  const permissionCount = role.permissions.length;

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${getRoleColor(role.metadata?.color || 'gray')}`}>
              {role.metadata?.icon || '👤'}
            </div>
            <div>
              <CardTitle className="text-[#EAECEF] flex items-center gap-2">
                {role.name}
                {role.isProtected && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    <Lock className="w-3 h-3 mr-1" />
                    Protected
                  </Badge>
                )}
                {role.type === 'system' && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    System
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-[#848E9C]">
                {role.description}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1E2329] border-[#2B3139]">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewPermissions}>
                <Eye className="w-4 h-4 mr-2" />
                View Permissions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!role.isProtected && isSuperAdmin && (
                <DropdownMenuItem onClick={onDelete} className="text-red-400">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Role
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#848E9C]" />
            <span className="text-[#EAECEF]">{userCount} users</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#848E9C]" />
            <span className="text-[#EAECEF]">{permissionCount} permissions</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-[#848E9C]">
          Last updated: {formatDate(role.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== PERMISSION GROUP COMPONENT ====================
const PermissionGroup = ({
  category,
  permissions,
  selectedPermissions,
  onTogglePermission,
  onToggleAll,
}: {
  category: string;
  permissions: Permission[];
  selectedPermissions: string[];
  onTogglePermission: (permissionId: string) => void;
  onToggleAll: (permissionIds: string[]) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const allSelected = permissions.every(p => selectedPermissions.includes(p.id));
  const someSelected = permissions.some(p => selectedPermissions.includes(p.id)) && !allSelected;

  return (
    <Card className="bg-[#1E2329] border border-[#2B3139]">
      <CardHeader className="py-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <CardTitle className="text-[#EAECEF] text-sm capitalize">{category}</CardTitle>
            <Badge className="bg-[#2B3139] text-[#848E9C]">
              {permissions.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onToggleAll(permissions.map(p => p.id));
              }}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {permissions.map((permission) => (
              <div
                key={permission.id}
                className="flex items-start gap-2 p-2 bg-[#181A20] rounded-lg hover:bg-[#23262F] transition-colors"
              >
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => onTogglePermission(permission.id)}
                    className="rounded border-[#2B3139] bg-[#181A20] text-[#F0B90B]"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-[#EAECEF]">
                      {permission.name}
                    </Label>
                    <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                      {permission.action}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#848E9C] mt-0.5">{permission.description}</p>
                  {permission.constraints && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {permission.constraints.mfaRequired && (
                        <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">
                          <Lock className="w-2 h-2 mr-0.5" />
                          MFA
                        </Badge>
                      )}
                      {permission.constraints.approvalRequired && (
                        <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                          <CheckCircle className="w-2 h-2 mr-0.5" />
                          Approval
                        </Badge>
                      )}
                      {permission.constraints.maxAmount && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                          Max ${permission.constraints.maxAmount.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

// ==================== ROLE FORM DIALOG ====================
const RoleFormDialog = ({
  open,
  onClose,
  role,
  onSave,
  allPermissions,
}: {
  open: boolean;
  onClose: () => void;
  role?: Role | null;
  onSave: (roleData: Partial<Role>) => void;
  allPermissions: Permission[];
}) => {
  const [formData, setFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: [],
    metadata: {
      color: 'blue',
      icon: '👤',
      badge: '',
    },
    priority: 10,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (role) {
      setFormData(role);
      setSelectedPermissions(role.permissions);
    } else {
      setFormData({
        name: '',
        description: '',
        permissions: [],
        metadata: {
          color: 'blue',
          icon: '👤',
          badge: '',
        },
        priority: 10,
      });
      setSelectedPermissions([]);
    }
  }, [role]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleToggleAllInCategory = (permissionIds: string[]) => {
    const allSelected = permissionIds.every(id => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !permissionIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...permissionIds])]);
    }
  };

  const handleSave = () => {
    onSave({
      ...formData,
      permissions: selectedPermissions,
    });
    onClose();
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const colors = ['purple', 'blue', 'green', 'yellow', 'orange', 'teal', 'cyan', 'red'];
  const icons = ['👑', '⚙️', '💰', '⚖️', '📈', '🎧', '🔍', '⚠️', '👤', '🌟', '💎', '🔮'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0B90B]">
            {role ? 'Edit Role' : 'Create New Role'}
          </DialogTitle>
          <DialogDescription className="text-[#848E9C]">
            {role ? 'Modify role details and permissions' : 'Define a new role with custom permissions'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#181A20] p-1 rounded-lg">
            <TabsTrigger value="details" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
              Role Details
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
              Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 pt-4">
            <div>
              <Label className="text-xs text-[#848E9C]">Role Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Investment Analyst"
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
              />
            </div>

            <div>
              <Label className="text-xs text-[#848E9C]">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this role's responsibilities"
                rows={3}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
              />
            </div>

            <div>
              <Label className="text-xs text-[#848E9C]">Priority (lower number = higher priority)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] w-24"
              />
            </div>

            <div>
              <Label className="text-xs text-[#848E9C]">Color Theme</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {colors.map(color => (
                  <Button
                    key={color}
                    size="sm"
                    variant="outline"
                    className={`border-[#2B3139] capitalize ${formData.metadata?.color === color ? getRoleColor(color) : 'text-[#EAECEF]'}`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, color }
                    }))}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-[#848E9C]">Icon</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {icons.map(icon => (
                  <Button
                    key={icon}
                    size="sm"
                    variant="outline"
                    className={`border-[#2B3139] text-lg ${formData.metadata?.icon === icon ? 'bg-[#F0B90B] text-black' : 'text-[#EAECEF]'}`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      metadata: { ...prev.metadata, icon }
                    }))}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-[#848E9C]">Badge Text (optional)</Label>
              <Input
                value={formData.metadata?.badge}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, badge: e.target.value }
                }))}
                placeholder="e.g., ANALYST"
                className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
              />
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 pt-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <PermissionGroup
                  key={category}
                  category={category}
                  permissions={perms}
                  selectedPermissions={selectedPermissions}
                  onTogglePermission={handleTogglePermission}
                  onToggleAll={(ids) => handleToggleAllInCategory(ids)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name}
            className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
          >
            <Save className="w-4 h-4 mr-2" />
            {role ? 'Update Role' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== USER ASSIGNMENT DIALOG ====================
const UserAssignmentDialog = ({
  open,
  onClose,
  role,
  users,
  onAssign,
  onUnassign,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  users: User[];
  onAssign: (userId: string) => void;
  onUnassign: (userId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!role) return null;

  const assignedUserIds = role.users;
  const availableUsers = users.filter(u => !assignedUserIds.includes(u.id) && u.status === 'active');
  const assignedUsers = users.filter(u => assignedUserIds.includes(u.id));

  const filteredAvailable = availableUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAssigned = assignedUsers.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#F0B90B]">
            Manage Users - {role.name}
          </DialogTitle>
          <DialogDescription className="text-[#848E9C]">
            Assign or remove users from this role
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Available Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-[#848E9C]">Available Users</Label>
                <Badge className="bg-[#2B3139] text-[#848E9C]">
                  {filteredAvailable.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-4 text-[#848E9C] text-sm">
                    No users available
                  </div>
                ) : (
                  filteredAvailable.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-[#181A20] rounded-lg hover:bg-[#23262F] transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#EAECEF]">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-[#848E9C]">{user.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-green-400 hover:text-green-300"
                        onClick={() => onAssign(user.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Assign
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-[#848E9C]">Assigned Users</Label>
                <Badge className="bg-[#2B3139] text-[#848E9C]">
                  {filteredAssigned.length}
                </Badge>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {filteredAssigned.length === 0 ? (
                  <div className="text-center py-4 text-[#848E9C] text-sm">
                    No users assigned
                  </div>
                ) : (
                  filteredAssigned.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 bg-[#181A20] rounded-lg hover:bg-[#23262F] transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#EAECEF]">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-[#848E9C]">{user.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-red-400 hover:text-red-300"
                        onClick={() => onUnassign(user.id)}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== PERMISSION VIEWER DIALOG ====================
const PermissionViewerDialog = ({
  open,
  onClose,
  role,
  allPermissions,
}: {
  open: boolean;
  onClose: () => void;
  role: Role | null;
  allPermissions: Permission[];
}) => {
  if (!role) return null;

  const rolePermissions = allPermissions.filter(p => role.permissions.includes(p.id));
  const permissionsByCategory = rolePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1E2329] border-[#F0B90B] text-[#EAECEF] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#F0B90B] flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Permissions - {role.name}
          </DialogTitle>
          <DialogDescription className="text-[#848E9C]">
            {role.permissions.length} total permissions assigned
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <Card key={category} className="bg-[#1E2329] border border-[#2B3139]">
              <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <CardTitle className="text-[#EAECEF] text-sm capitalize">{category}</CardTitle>
                  <Badge className="bg-[#2B3139] text-[#848E9C]">
                    {perms.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {perms.map((perm) => (
                    <div key={perm.id} className="p-2 bg-[#181A20] rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#EAECEF]">{perm.name}</span>
                            <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                              {perm.action}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#848E9C] mt-0.5">{perm.description}</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      {perm.constraints && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {perm.constraints.mfaRequired && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">
                              <Lock className="w-2 h-2 mr-0.5" />
                              MFA Required
                            </Badge>
                          )}
                          {perm.constraints.approvalRequired && (
                            <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                              <CheckCircle className="w-2 h-2 mr-0.5" />
                              Approval Required
                            </Badge>
                          )}
                          {perm.constraints.maxAmount && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                              Max ${perm.constraints.maxAmount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ==================== AUDIT LOGS COMPONENT ====================
const AuditLogs = ({ logs }: { logs: AuditLog[] }) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500/20 text-green-400';
      case 'update': return 'bg-yellow-500/20 text-yellow-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      case 'assign': return 'bg-blue-500/20 text-blue-400';
      case 'revoke': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="bg-[#1E2329] border border-[#2B3139]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getActionColor(log.action)}>
                    {log.action}
                  </Badge>
                  <span className="text-xs text-[#848E9C]">
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-[#EAECEF]">
                  <span className="font-medium">{log.adminEmail}</span> {log.action}ed{' '}
                  <span className="font-medium">{log.targetType}</span> "{log.targetName}"
                </p>
                {log.changes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    {expanded === log.id ? 'Hide' : 'Show'} Changes
                  </Button>
                )}
                {expanded === log.id && (
                  <div className="mt-2 space-y-1 bg-[#181A20] rounded-lg p-2">
                    {log.changes.map((change, i) => (
                      <div key={i} className="text-xs">
                        <span className="text-[#848E9C]">{change.field}:</span>{' '}
                        <span className="text-red-400 line-through mr-2">
                          {JSON.stringify(change.oldValue)}
                        </span>
                        <span className="text-green-400">{JSON.stringify(change.newValue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right text-[10px] text-[#5E6673]">
                <div>{log.ipAddress}</div>
                <div className="truncate max-w-[200px]">{log.userAgent}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function RolePermissions() {
  const { isSuperAdmin, user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions, setPermissions] = useState<Permission[]>(mockPermissions);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserAssignment, setShowUserAssignment] = useState(false);
  const [showPermissionViewer, setShowPermissionViewer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('roles');

  // Filter roles based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalRoles = roles.length;
  const systemRoles = roles.filter(r => r.type === 'system').length;
  const customRoles = roles.filter(r => r.type === 'custom').length;
  const totalUsers = users.length;
  const usersWithRoles = users.filter(u => u.role).length;

  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowRoleForm(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setShowRoleForm(true);
  };

  const handleDuplicateRole = (role: Role) => {
    const duplicatedRole: Role = {
      ...role,
      id: `custom_${Date.now()}`,
      name: `${role.name} (Copy)`,
      type: 'custom',
      users: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.id || 'unknown',
      isDefault: false,
      isProtected: false,
      priority: role.priority + 1,
    };
    setRoles(prev => [...prev, duplicatedRole]);
    toast({
      title: "Role Duplicated",
      description: `${duplicatedRole.name} has been created.`,
    });
  };

  const handleSaveRole = (roleData: Partial<Role>) => {
    if (selectedRole) {
      // Update existing role
      setRoles(prev => prev.map(r =>
        r.id === selectedRole.id
          ? { ...r, ...roleData, updatedAt: new Date().toISOString() }
          : r
      ));
      toast({
        title: "Role Updated",
        description: `${roleData.name} has been updated.`,
      });
    } else {
      // Create new role
      const newRole: Role = {
        id: `custom_${Date.now()}`,
        name: roleData.name || '',
        description: roleData.description || '',
        type: 'custom',
        permissions: roleData.permissions || [],
        users: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user?.id || 'unknown',
        isDefault: false,
        isProtected: false,
        priority: roleData.priority || 10,
        metadata: roleData.metadata,
      };
      setRoles(prev => [...prev, newRole]);
      toast({
        title: "Role Created",
        description: `${newRole.name} has been created.`,
      });
    }
  };

  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRole = () => {
    if (roleToDelete) {
      setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
      toast({
        title: "Role Deleted",
        description: `${roleToDelete.name} has been removed.`,
      });
      setShowDeleteConfirm(false);
      setRoleToDelete(null);
    }
  };

  const handleAssignUser = (roleId: string, userId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === roleId
        ? { ...r, users: [...r.users, userId] }
        : r
    ));
    toast({
      title: "User Assigned",
      description: "User has been assigned to the role.",
    });
  };

  const handleUnassignUser = (roleId: string, userId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === roleId
        ? { ...r, users: r.users.filter(id => id !== userId) }
        : r
    ));
    toast({
      title: "User Removed",
      description: "User has been removed from the role.",
    });
  };

  const handleExport = () => {
    const data = roles.map(r => ({
      name: r.name,
      description: r.description,
      type: r.type,
      users: r.users.length,
      permissions: r.permissions.length,
      created: new Date(r.createdAt).toLocaleDateString(),
      updated: new Date(r.updatedAt).toLocaleDateString(),
    }));

    const csv = [
      ['Name', 'Description', 'Type', 'Users', 'Permissions', 'Created', 'Updated'],
      ...data.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `${roles.length} roles exported.`,
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Data Refreshed",
        description: "Role data has been updated.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-[#EAECEF]">Role & Permission Management</h1>
            <Badge className="bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30">
              {totalRoles} Roles
            </Badge>
          </div>
          <p className="text-sm text-[#848E9C] mt-1">
            Manage roles, permissions, and access control across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-[#2B3139] text-[#848E9C] hover:border-[#F0B90B] hover:text-[#F0B90B]"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          {isSuperAdmin && (
            <Button
              onClick={handleCreateRole}
              className="bg-[#F0B90B] hover:bg-yellow-400 text-black font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Roles"
          value={totalRoles}
          icon={Shield}
          subtitle={`${systemRoles} system · ${customRoles} custom`}
        />
        <StatsCard
          title="Total Permissions"
          value={permissions.length}
          icon={Key}
          subtitle="Across all roles"
        />
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          subtitle={`${usersWithRoles} with roles`}
        />
        <StatsCard
          title="Protected Roles"
          value={roles.filter(r => r.isProtected).length}
          icon={Lock}
          subtitle="System-protected roles"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#1E2329] p-1 rounded-lg max-w-md">
          <TabsTrigger value="roles" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Roles
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Permissions
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20]">
            Audit Logs
          </TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4 pt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#848E9C]" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => handleEditRole(role)}
                onDelete={() => handleDeleteRole(role)}
                onDuplicate={() => handleDuplicateRole(role)}
                onViewPermissions={() => {
                  setSelectedRole(role);
                  setShowPermissionViewer(true);
                }}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4 pt-4">
          <div className="space-y-4">
            {Object.entries(
              permissions.reduce((acc, perm) => {
                if (!acc[perm.category]) acc[perm.category] = [];
                acc[perm.category].push(perm);
                return acc;
              }, {} as Record<string, Permission[]>)
            ).map(([category, perms]) => (
              <Card key={category} className="bg-[#1E2329] border border-[#2B3139]">
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <CardTitle className="text-[#EAECEF] text-sm capitalize">{category}</CardTitle>
                    <Badge className="bg-[#2B3139] text-[#848E9C]">
                      {perms.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <div key={perm.id} className="p-2 bg-[#181A20] rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#EAECEF]">{perm.name}</span>
                              <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                                {perm.action}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#848E9C] mt-0.5">{perm.description}</p>
                          </div>
                        </div>
                        {perm.constraints && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {perm.constraints.mfaRequired && (
                              <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px]">
                                <Lock className="w-2 h-2 mr-0.5" />
                                MFA
                              </Badge>
                            )}
                            {perm.constraints.approvalRequired && (
                              <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">
                                <CheckCircle className="w-2 h-2 mr-0.5" />
                                Approval
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4 pt-4">
          <AuditLogs logs={auditLogs} />
        </TabsContent>
      </Tabs>

      {/* Role Form Dialog */}
      <RoleFormDialog
        open={showRoleForm}
        onClose={() => setShowRoleForm(false)}
        role={selectedRole}
        onSave={handleSaveRole}
        allPermissions={permissions}
      />

      {/* User Assignment Dialog */}
      <UserAssignmentDialog
        open={showUserAssignment}
        onClose={() => setShowUserAssignment(false)}
        role={selectedRole}
        users={users}
        onAssign={(userId) => handleAssignUser(selectedRole!.id, userId)}
        onUnassign={(userId) => handleUnassignUser(selectedRole!.id, userId)}
      />

      {/* Permission Viewer Dialog */}
      <PermissionViewerDialog
        open={showPermissionViewer}
        onClose={() => setShowPermissionViewer(false)}
        role={selectedRole}
        allPermissions={permissions}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-[#1E2329] border-red-500/50 text-[#EAECEF] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Role
            </DialogTitle>
            <DialogDescription className="text-[#848E9C]">
              Are you sure you want to delete "{roleToDelete?.name}"? This action cannot be undone.
              {roleToDelete?.users && roleToDelete.users.length > 0 && (
                <p className="text-yellow-400 mt-2">
                  Warning: This role is currently assigned to {roleToDelete.users.length} user(s).
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteRole}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      `}</style>
    </motion.div>
  );
}