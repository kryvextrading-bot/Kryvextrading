import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { adminApiService } from '@/services/admin-api';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Users, 
  UserCheck, 
  UserX, 
  Key, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Copy, 
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Activity,
  FileText,
  Database,
  Download as DownloadIcon,
  Upload,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown
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

// ==================== MAIN COMPONENT ====================
export default function RolePermissions() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [roleType, setRoleType] = useState<'system' | 'custom'>('custom');
  const [activeTab, setActiveTab] = useState('roles');

  // Load data from API
  const loadData = async () => {
    setLoading(true);
    try {
      // Load data from API
      const [rolesData, permissionsData, usersData, auditData] = await Promise.all([
        adminApiService.getRoles(),
        adminApiService.getPermissions(),
        adminApiService.getUsers(),
        adminApiService.getAuditLogs()
      ]);
      
      // Transform users data to match component interface
      const transformedUsers = usersData.map(user => ({
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0],
        email: user.email,
        role: user.admin_role || 'user',
        status: user.status,
        lastLogin: user.last_login,
        permissions: [] // Default permissions for now
      }));
      
      setRoles(rolesData);
      setPermissions(permissionsData);
      setUsers(transformedUsers);
      setAuditLogs(auditData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load role and permission data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter data based on search
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = auditLogs.filter(log =>
    log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#EAECEF]">Role & Permissions Management</h1>
          <p className="text-[#848E9C]">Manage user roles, permissions, and access controls</p>
        </div>
        <Button onClick={loadData} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-[#1E2329] rounded-lg p-1">
        <Button
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('roles')}
          className={activeTab === 'roles' ? 'bg-[#F0B90B] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'}
        >
          Roles
        </Button>
        <Button
          variant={activeTab === 'permissions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('permissions')}
          className={activeTab === 'permissions' ? 'bg-[#F0B90B] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'}
        >
          Permissions
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'bg-[#F0B90B] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'}
        >
          Users
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('audit')}
          className={activeTab === 'audit' ? 'bg-[#F0B90B] text-black' : 'text-[#848E9C] hover:text-[#EAECEF]'}
        >
          Audit Logs
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 text-[#848E9C] transform -translate-y-1/2" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search roles, permissions, users..."
          className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
        />
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#EAECEF]">Roles</CardTitle>
              <Button onClick={() => setShowRoleDialog(true)} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRoles.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
                <p className="text-[#848E9C]">No roles found</p>
                <p className="text-sm text-[#5E6673] mt-2">Create your first role to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2B3139]">
                    <TableHead className="text-[#848E9C]">Name</TableHead>
                    <TableHead className="text-[#848E9C]">Type</TableHead>
                    <TableHead className="text-[#848E9C]">Permissions</TableHead>
                    <TableHead className="text-[#848E9C]">Users</TableHead>
                    <TableHead className="text-[#848E9C]">Status</TableHead>
                    <TableHead className="text-[#848E9C]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id} className="border-[#2B3139]">
                      <TableCell className="text-[#EAECEF]">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: role.metadata?.color || '#848E9C' }} />
                          <span>{role.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={role.type === 'system' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}>
                          {role.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#848E9C]">{role.permissions.length}</TableCell>
                      <TableCell className="text-[#848E9C]">{role.users.length}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500/20 text-green-400">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRole(role)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingRole(role)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!role.isProtected && (
                            <Button size="sm" variant="ghost" className="text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#EAECEF]">Permissions</CardTitle>
              <Button onClick={() => setShowPermissionDialog(true)} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
                <Plus className="w-4 h-4 mr-2" />
                Add Permission
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {permissions.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
                <p className="text-[#848E9C]">No permissions found</p>
                <p className="text-sm text-[#5E6673] mt-2">Create permissions to control access to system resources</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <Card key={permission.id} className="bg-[#181A20] border border-[#2B3139] p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-[#EAECEF]">{permission.name}</h3>
                      <Badge className="text-xs bg-[#2B3139] text-[#848E9C]">
                        {permission.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#848E9C] mb-3">{permission.description}</p>
                    <div className="flex items-center gap-2 text-xs text-[#5E6673]">
                      <span>{permission.resource}</span>
                      <span>•</span>
                      <span>{permission.action}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[#EAECEF]">Users</CardTitle>
              <Button onClick={() => setShowUserDialog(true)} className="bg-[#F0B90B] text-black hover:bg-yellow-400">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
                <p className="text-[#848E9C]">No users found</p>
                <p className="text-sm text-[#5E6673] mt-2">Add users to manage their roles and permissions</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2B3139]">
                    <TableHead className="text-[#848E9C]">User</TableHead>
                    <TableHead className="text-[#848E9C]">Email</TableHead>
                    <TableHead className="text-[#848E9C]">Role</TableHead>
                    <TableHead className="text-[#848E9C]">Status</TableHead>
                    <TableHead className="text-[#848E9C]">MFA</TableHead>
                    <TableHead className="text-[#848E9C]">Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-[#2B3139]">
                      <TableCell className="text-[#EAECEF]">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-[#848E9C]">{user.email}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#2B3139] text-[#848E9C]">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          user.status === 'inactive' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <ShieldCheck className="w-4 h-4 text-green-400" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                        )}
                      </TableCell>
                      <TableCell className="text-[#848E9C]">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <Card className="bg-[#1E2329] border border-[#2B3139]">
          <CardHeader>
            <CardTitle className="text-[#EAECEF]">Audit Logs</CardTitle>
            <CardDescription className="text-[#848E9C]">
              Track all role and permission changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
                <p className="text-[#848E9C]">No audit logs found</p>
                <p className="text-sm text-[#5E6673] mt-2">Audit logs will appear here when changes are made</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2B3139]">
                    <TableHead className="text-[#848E9C]">Timestamp</TableHead>
                    <TableHead className="text-[#848E9C]">Admin</TableHead>
                    <TableHead className="text-[#848E9C]">Action</TableHead>
                    <TableHead className="text-[#848E9C]">Target</TableHead>
                    <TableHead className="text-[#848E9C]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuditLogs.map((log) => (
                    <TableRow key={log.id} className="border-[#2B3139]">
                      <TableCell className="text-[#848E9C]">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-[#EAECEF]">{log.adminEmail}</TableCell>
                      <TableCell>
                        <Badge className="bg-[#2B3139] text-[#848E9C]">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[#EAECEF]">{log.targetName}</TableCell>
                      <TableCell className="text-[#848E9C] text-sm">
                        {log.changes.length} changes
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
