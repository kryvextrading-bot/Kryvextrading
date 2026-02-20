import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Key, 
  Smartphone, 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function Security() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }

    // Simulate password change
    toast({
      title: "Password Updated",
      description: "Your password has been successfully changed.",
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handle2FAToggle = () => {
    if (!twoFactorEnabled) {
      // Navigate to 2FA setup
      navigate('/security/2fa-setup');
    } else {
      // Disable 2FA
      setTwoFactorEnabled(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    }
  };

  const securityFeatures = [
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Password Protection",
      description: "Strong password with special characters",
      status: "secure" as const,
      action: "Change"
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "Two-Factor Authentication",
      description: twoFactorEnabled ? "2FA is enabled" : "2FA is not enabled",
      status: twoFactorEnabled ? "secure" as const : "warning" as const,
      action: twoFactorEnabled ? "Manage" : "Enable"
    },
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email Verification",
      description: "Email is verified and secure",
      status: "secure" as const,
      action: "Manage"
    },
    {
      icon: <Key className="w-5 h-5" />,
      title: "API Keys",
      description: "No active API keys",
      status: "secure" as const,
      action: "Manage"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0E11] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="text-[#848E9C] hover:text-[#EAECEF] mb-4"
            onClick={() => navigate('/wallet')}
          >
            ← Back to Wallet
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#F0B90B] rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#181A20]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#EAECEF]">Security Settings</h1>
              <p className="text-[#848E9C]">Manage your account security and privacy</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Security Overview */}
          <Card className="bg-[#181A20] border-[#2B3139] p-6">
            <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">Security Overview</h2>
            <div className="grid gap-4">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[#1E2329] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      feature.status === 'secure' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#EAECEF]">{feature.title}</h3>
                      <p className="text-sm text-[#848E9C]">{feature.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {feature.status === 'secure' ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    )}
                    <Button variant="outline" size="sm" className="border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139]">
                      {feature.action}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Password Change */}
          <Card className="bg-[#181A20] border-[#2B3139] p-6">
            <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="text-[#EAECEF]">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#848E9C]"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="newPassword" className="text-[#EAECEF]">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword" className="text-[#EAECEF]">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]">
                Update Password
              </Button>
            </form>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="bg-[#181A20] border-[#2B3139] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF]">Two-Factor Authentication</h2>
                <p className="text-sm text-[#848E9C]">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={handle2FAToggle}
              />
            </div>
            
            {twoFactorEnabled ? (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">2FA is enabled</span>
                </div>
                <p className="text-xs text-green-300 mt-1">Your account is protected with two-factor authentication.</p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">2FA is not enabled</span>
                </div>
                <p className="text-xs text-yellow-300 mt-1">We recommend enabling two-factor authentication for better security.</p>
              </div>
            )}
          </Card>

          {/* Notification Settings */}
          <Card className="bg-[#181A20] border-[#2B3139] p-6">
            <h2 className="text-lg font-semibold text-[#EAECEF] mb-4">Security Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#EAECEF]">Email Notifications</Label>
                  <p className="text-sm text-[#848E9C]">Get email alerts for security events</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[#EAECEF]">SMS Notifications</Label>
                  <p className="text-sm text-[#848E9C]">Get SMS alerts for critical security events</p>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
