import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService, { User } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function UserManagement() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [suspensionDialog, setSuspensionDialog] = useState<User | null>(null);
  const [kycDialog, setKycDialog] = useState<User | null>(null);
  const [documentsDialog, setDocumentsDialog] = useState<User | null>(null);
  const [creditDialog, setCreditDialog] = useState<User | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<User | null>(null);

  // Load users from API on mount and refresh
  const loadUsers = async () => {
    try {
      console.log('🔄 [UserManagement] Loading users...');
      const usersData = await apiService.getUsers();
      console.log('📊 [UserManagement] Loaded users:', usersData.length);
      setUsers(usersData);
    } catch (error) {
      console.error('💥 [UserManagement] Failed to load users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  // User management functions
  const handleSuspendUser = async (user: User, reason: string) => {
    try {
      console.log('🚫 [UserManagement] Suspending user:', user.id);
      // Update user status to suspended
      await apiService.updateUser(user.id, { status: 'Suspended' });
      
      // Create suspension record
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
      const newScore = change === 'increase' ? user.creditScore + score : user.creditScore - score;
      
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

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users based on search
  useEffect(() => {
    let filtered = [...users];

    if (search) {
      filtered = filtered.filter(user =>
        user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [users, search]);

  return (
    <div className="min-h-screen bg-[#181A20] p-4 sm:p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#EAECEF]">User Management</h1>
            <p className="text-sm sm:text-base text-[#848E9C]">Manage and monitor all platform users</p>
          </div>
          <Button onClick={loadUsers} className="bg-[#F0B90B] text-black hover:bg-yellow-400 w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Users
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 text-[#848E9C]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, email..."
              className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF]"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.firstName?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-[#EAECEF]">
                      {user.firstName} {user.lastName}
                    </h3>
                    <p className="text-sm text-[#848E9C]">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={
                        user.status === 'Active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : user.status === 'Pending' 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }>
                        {user.status}
                      </Badge>
                      {user.isAdmin && (
                        <Badge className="bg-blue-500/20 text-blue-400 ml-2">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Menu */}
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2 hover:bg-[#2B3139] border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:border-[#F0B90B]/50 text-xs"
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  {isSuperAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 px-2 hover:bg-[#2B3139] border-[#2B3139] text-[#848E9C] hover:text-[#EAECEF] hover:border-[#F0B90B]/50 text-xs">
                          <MoreVertical className="h-3 w-3 mr-1" />
                          More
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1E2329] border-[#2B3139]">
                        <DropdownMenuLabel className="text-[#EAECEF]">User Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingUser(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[#2B3139]" />
                        {user.status === 'Active' ? (
                          <DropdownMenuItem onClick={() => setSuspensionDialog(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUnsuspendUser(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                            <UserCheck className="mr-2 h-4 w-4" />
                            Unsuspend User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-[#2B3139]" />
                        <DropdownMenuItem onClick={() => setKycDialog(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                          <FileText className="mr-2 h-4 w-4" />
                          Manage KYC
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDocumentsDialog(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                          <Upload className="mr-2 h-4 w-4" />
                          View Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCreditDialog(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Credit Score
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setPasswordDialog(user)} className="text-[#EAECEF] hover:bg-[#2B3139]">
                          <Key className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="text-sm text-[#848E9C] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">Account Type:</span>
                  <span className="text-[#EAECEF]">{user.accountType || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">Balance:</span>
                  <span className="text-[#EAECEF]">${user.balance?.toLocaleString() || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">Credit Score:</span>
                  <span className={`font-semibold ${
                    user.creditScore >= 700 ? 'text-green-400' :
                    user.creditScore >= 600 ? 'text-yellow-400' :
                    user.creditScore >= 500 ? 'text-orange-400' : 'text-red-400'
                  }`}>
                    {user.creditScore || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">KYC Status:</span>
                  <Badge className={
                    user.kycStatus === 'Verified' 
                      ? 'bg-green-500/20 text-green-400'
                      : user.kycStatus === 'Pending' 
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  }>
                    {user.kycStatus || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">Last Login:</span>
                  <span className="text-[#EAECEF]">{user.lastLogin || 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E6673]">Registered:</span>
                  <span className="text-[#EAECEF]">{new Date(user.registrationDate).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Suspension Dialog */}
        {suspensionDialog && (
          <Dialog open={!!suspensionDialog} onOpenChange={(open) => !open && setSuspensionDialog(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-400" />
                  Suspend User
                </DialogTitle>
                <DialogDescription>
                  Suspend {suspensionDialog.firstName} {suspensionDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Suspension Reason</Label>
                  <Textarea 
                    placeholder="Enter reason for suspension..."
                    className="bg-[#181A20] border-[#2B3139]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSuspensionDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSuspendUser(suspensionDialog, 'Admin suspension')}>
                  Suspend User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* KYC Management Dialog */}
        {kycDialog && (
          <Dialog open={!!kycDialog} onOpenChange={(open) => !open && setKycDialog(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Manage KYC Status
                </DialogTitle>
                <DialogDescription>
                  Update KYC verification status for {kycDialog.firstName} {kycDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Current Status</Label>
                  <Badge className={
                    kycDialog.kycStatus === 'Verified' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }>
                    {kycDialog.kycStatus || 'Unknown'}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKycDialog(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleRejectKYC(kycDialog, 'KYC rejected by admin')}
                >
                  Reject KYC
                </Button>
                <Button 
                  onClick={() => handleApproveKYC(kycDialog)}
                >
                  Approve KYC
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* User Details Modal */}
        {viewingUser && (
          <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-2xl">
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Complete user information and management options
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>First Name</Label>
                      <Input value={viewingUser.firstName || ''} readOnly />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input value={viewingUser.lastName || ''} readOnly />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={viewingUser.email || ''} readOnly />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={viewingUser.phone || ''} readOnly />
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Input value={viewingUser.accountType || ''} readOnly />
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input value={viewingUser.accountNumber || ''} readOnly />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Status</Label>
                      <Select value={viewingUser.status || ''} disabled>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder={viewingUser.status || 'Select Status'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>KYC Status</Label>
                      <Select value={viewingUser.kycStatus || ''} disabled>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder={viewingUser.kycStatus || 'Select KYC Status'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Admin Role</Label>
                      <Select value={viewingUser.adminRole || ''} disabled={!isSuperAdmin}>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder={viewingUser.adminRole || 'Select Role'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit User Dialog */}
        {editingUser && (
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-blue-400" />
                  Edit User Information
                </DialogTitle>
                <DialogDescription>
                  Update user details and account information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>First Name</Label>
                      <Input 
                        value={editingUser.firstName || ''} 
                        onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input 
                        value={editingUser.lastName || ''} 
                        onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        value={editingUser.email || ''} 
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={editingUser.phone || ''} 
                        onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Account Type</Label>
                      <Select value={editingUser.accountType || ''} onValueChange={(value) => setEditingUser({...editingUser, accountType: value})}>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder="Select Account Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Standard">Standard</SelectItem>
                          <SelectItem value="Premium">Premium</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Account Number</Label>
                      <Input 
                        value={editingUser.accountNumber || ''} 
                        onChange={(e) => setEditingUser({...editingUser, accountNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={editingUser.status || ''} onValueChange={(value) => setEditingUser({...editingUser, status: value})}>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>KYC Status</Label>
                      <Select value={editingUser.kycStatus || ''} onValueChange={(value) => setEditingUser({...editingUser, kycStatus: value})}>
                        <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                          <SelectValue placeholder="Select KYC Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Verified">Verified</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <Label>Admin Role</Label>
                        <Select value={editingUser.adminRole || ''} onValueChange={(value) => setEditingUser({...editingUser, adminRole: value})}>
                          <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleSaveUser(editingUser)}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Credit Score Dialog */}
        {creditDialog && (
          <Dialog open={!!creditDialog} onOpenChange={(open) => !open && setCreditDialog(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-400" />
                  Update Credit Score
                </DialogTitle>
                <DialogDescription>
                  Adjust credit score for {creditDialog.firstName} {creditDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Current Score</Label>
                  <Input value={creditDialog.creditScore?.toString() || '0'} readOnly />
                </div>
                <div>
                  <Label>Adjustment</Label>
                  <Select defaultValue="increase">
                    <SelectTrigger className="bg-[#181A20] border-[#2B3139]">
                      <SelectValue placeholder="Select adjustment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase">Increase Score</SelectItem>
                      <SelectItem value="decrease">Decrease Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input type="number" placeholder="Enter amount..." />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea placeholder="Enter reason for adjustment..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreditDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateCreditScore(creditDialog, 50, 'increase', 'Credit score adjustment')}>
                  Update Score
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Password Reset Dialog */}
        {passwordDialog && (
          <Dialog open={!!passwordDialog} onOpenChange={(open) => !open && setPasswordDialog(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-yellow-400" />
                  Reset Password
                </DialogTitle>
                <DialogDescription>
                  Send password reset link to {passwordDialog.firstName} {passwordDialog.lastName} ({passwordDialog.email})
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-[#181A20] p-4 rounded-lg">
                  <p className="text-sm text-[#848E9C]">
                    This will send a password reset link to the user's email address. 
                    The user will be able to create a new password using the link.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleResetPassword(passwordDialog)}>
                  Send Reset Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Documents Dialog */}
        {documentsDialog && (
          <Dialog open={!!documentsDialog} onOpenChange={(open) => !open && setDocumentsDialog(null)}>
            <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  User Documents
                </DialogTitle>
                <DialogDescription>
                  Documents uploaded by {documentsDialog.firstName} {documentsDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h4 className="text-lg font-semibold text-[#EAECEF] mb-2">Document Management</h4>
                  <p className="text-[#848E9C] mb-4">
                    View and manage documents uploaded by this user
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div className="bg-[#181A20] p-4 rounded-lg">
                      <h5 className="font-medium text-[#EAECEF] mb-2">KYC Status</h5>
                      <Badge className={
                        documentsDialog.kycStatus === 'verified' 
                          ? 'bg-green-500/20 text-green-400' 
                          : documentsDialog.kycStatus === 'pending' 
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }>
                        {documentsDialog.kycStatus || 'Not Submitted'}
                      </Badge>
                    </div>
                    
                    <div className="bg-[#181A20] p-4 rounded-lg">
                      <h5 className="font-medium text-[#EAECEF] mb-2">Total Documents</h5>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {documentsDialog.documents?.length || 0} files
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-6 text-sm text-[#848E9C]">
                    <p>• KYC documents can be managed from the KYC dialog</p>
                    <p>• Additional documents will appear here when uploaded</p>
                    <p>• Users can upload documents from their profile page</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDocumentsDialog(null)}>
                  Close
                </Button>
                <Button onClick={() => setKycDialog(documentsDialog)}>
                  <FileText className="h-4 w-4 mr-2" />
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
