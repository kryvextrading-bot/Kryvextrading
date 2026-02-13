import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Eye
} from 'lucide-react';
import apiService, { User } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B90B] mx-auto"></div>
            <p className="mt-4 text-[#848E9C]">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-[#848E9C]">User not found</p>
            <Button className="mt-4" onClick={() => navigate('/admin/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">User Details</h1>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {isSuperAdmin && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingUser(user)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                {user.status === 'Active' ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSuspensionDialog(user)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUnsuspendUser(user)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Unsuspend
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setKycDialog(user)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  KYC
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDocumentsDialog(user)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Documents
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCreditDialog(user)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Credit Score
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPasswordDialog(user)}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {user.firstName?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <CardDescription className="text-[#848E9C]">
                      {user.email}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
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
                        <Badge className="bg-blue-500/20 text-blue-400">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#848E9C]">Phone</Label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#848E9C]" />
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">Account Type</Label>
                    <p className="text-[#EAECEF]">{user.accountType || 'Standard'}</p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">Account Number</Label>
                    <p className="text-[#EAECEF]">{user.accountNumber || 'Not assigned'}</p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">Member Since</Label>
                    <p className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-[#848E9C]" />
                      {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">Last Login</Label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#848E9C]" />
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">KYC Status</Label>
                    <Badge className={
                      user.kycStatus === 'Verified' 
                        ? 'bg-green-500/20 text-green-400' 
                        : user.kycStatus === 'Pending' 
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                    }>
                      {user.kycStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Info */}
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#848E9C]">Balance</Label>
                    <p className="text-2xl font-bold text-[#EAECEF]">
                      ${user.balance?.toLocaleString() || '0.00'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-[#848E9C]">Credit Score</Label>
                    <p className={`text-2xl font-bold ${
                      user.creditScore >= 700 ? 'text-green-400' :
                      user.creditScore >= 600 ? 'text-yellow-400' :
                      user.creditScore >= 500 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {user.creditScore || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity & Stats */}
          <div className="space-y-6">
            <Card className="bg-[#1E2329] border-[#2B3139]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Account Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#848E9C]">Account Status</span>
                  <Badge className={
                    user.status === 'Active' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }>
                    {user.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#848E9C]">Verification</span>
                  <Badge className={
                    user.kycStatus === 'Verified' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }>
                    {user.kycStatus}
                  </Badge>
                </div>
                <Separator className="bg-[#2B3139]" />
                <div className="text-sm text-[#848E9C]">
                  <p>Account created: {user.registrationDate ? new Date(user.registrationDate).toLocaleDateString() : 'Unknown'}</p>
                  <p>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div>
                  <Label>First Name</Label>
                  <Input 
                    value={editingUser.firstName || ''} 
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                    className="bg-[#181A20] border-[#2B3139]"
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    value={editingUser.lastName || ''} 
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                    className="bg-[#181A20] border-[#2B3139]"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    value={editingUser.email || ''} 
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="bg-[#181A20] border-[#2B3139]"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    value={editingUser.phone || ''} 
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="bg-[#181A20] border-[#2B3139]"
                  />
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
                  Suspend {suspensionDialog.firstName} {suspensionDialog.lastName}'s account
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label>Suspension Reason</Label>
                <Textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Enter reason for suspension..."
                  className="bg-[#181A20] border-[#2B3139]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSuspensionDialog(null)}>
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
            <DialogContent className="bg-[#1E2329] text-[#EAECEF]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  Manage KYC
                </DialogTitle>
                <DialogDescription>
                  Manage KYC verification for {kycDialog.firstName} {kycDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center justify-between mb-4">
                  <span>Current Status:</span>
                  <Badge className={
                    kycDialog.kycStatus === 'Verified' 
                      ? 'bg-green-500/20 text-green-400' 
                      : kycDialog.kycStatus === 'Pending' 
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  }>
                    {kycDialog.kycStatus}
                  </Badge>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setKycDialog(null)}>
                  Close
                </Button>
                {kycDialog.kycStatus !== 'Verified' && (
                  <Button onClick={() => handleApproveKYC(kycDialog)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve KYC
                  </Button>
                )}
                {kycDialog.kycStatus !== 'Rejected' && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleRejectKYC(kycDialog, 'Rejected by admin')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
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
              <div className="py-4">
                <div className="mb-4">
                  <Label>Current Score</Label>
                  <p className="text-2xl font-bold">{creditDialog.creditScore || 0}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreditDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateCreditScore(creditDialog, 50, 'increase', 'Good performance')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  +50 Points
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateCreditScore(creditDialog, 50, 'decrease', 'Poor performance')}
                >
                  <TrendingUp className="h-4 w-4 mr-2 rotate-180" />
                  -50 Points
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
                  <Key className="h-5 w-5 text-blue-400" />
                  Reset Password
                </DialogTitle>
                <DialogDescription>
                  Send password reset link to {passwordDialog.email}
                </DialogDescription>
              </DialogHeader>
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
            <DialogContent className="bg-[#1E2329] text-[#EAECEF] max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  User Documents
                </DialogTitle>
                <DialogDescription>
                  Documents uploaded by {documentsDialog.firstName} {documentsDialog.lastName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* KYC Documents */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#EAECEF]">KYC Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-[#181A20] border-[#2B3139]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-[#EAECEF]">ID Document</span>
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
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[#848E9C]">
                            <FileText className="h-4 w-4" />
                            <span>Passport / National ID</span>
                          </div>
                          {documentsDialog.kyc?.documents && documentsDialog.kyc.documents.length > 0 ? (
                            <div className="space-y-2">
                              {documentsDialog.kyc.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-[#0B0E11] rounded">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm text-[#EAECEF]">{doc.type}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                      <Upload className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-[#848E9C]">
                              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No KYC documents uploaded</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#181A20] border-[#2B3139]">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-[#EAECEF]">Proof of Address</span>
                          <Badge className="bg-gray-500/20 text-gray-400">
                            Not Required
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-[#848E9C]">
                            <FileText className="h-4 w-4" />
                            <span>Utility Bill / Bank Statement</span>
                          </div>
                          <div className="text-center py-4 text-[#848E9C]">
                            <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No address proof uploaded</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Additional Documents */}
                <div>
                  <h4 className="text-lg font-semibold mb-3 text-[#EAECEF]">Additional Documents</h4>
                  <Card className="bg-[#181A20] border-[#2B3139]">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[#EAECEF]">Total Documents</span>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            {(documentsDialog.documents && documentsDialog.documents.length) || 0} files
                          </Badge>
                        </div>
                        
                        {documentsDialog.documents && documentsDialog.documents.length > 0 ? (
                          <div className="space-y-2">
                            {documentsDialog.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-[#0B0E11] rounded">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-blue-400" />
                                  <div>
                                    <p className="text-sm font-medium text-[#EAECEF]">{doc.name || `Document ${index + 1}`}</p>
                                    <p className="text-xs text-[#848E9C]">
                                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                    <Upload className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-[#848E9C]">
                            <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No additional documents uploaded</p>
                            <p className="text-xs mt-1">User can upload documents from their profile</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* KYC Status Summary */}
                <Card className="bg-[#181A20] border-[#2B3139]">
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3 text-[#EAECEF]">KYC Status Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <Badge className={
                          documentsDialog.kycStatus === 'verified' 
                            ? 'bg-green-500/20 text-green-400' 
                            : documentsDialog.kycStatus === 'pending' 
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }>
                          {documentsDialog.kycStatus || 'Not Submitted'}
                        </Badge>
                        <p className="text-xs text-[#848E9C] mt-1">Current Status</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[#EAECEF]">
                          {documentsDialog.kyc?.submittedAt ? new Date(documentsDialog.kyc.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-[#848E9C]">Submitted Date</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-[#EAECEF]">
                          {documentsDialog.kyc?.verifiedAt ? new Date(documentsDialog.kyc.verifiedAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-xs text-[#848E9C]">Verified Date</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
