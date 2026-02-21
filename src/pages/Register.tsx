import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Sparkles,
  ChevronRight,
  AlertCircle,
  Fingerprint,
  CreditCard,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

// Password strength indicator component
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.match(/[a-z]/)) score += 1;
    if (pwd.match(/[A-Z]/)) score += 1;
    if (pwd.match(/[0-9]/)) score += 1;
    if (pwd.match(/[^a-zA-Z0-9]/)) score += 1;
    return score;
  };

  const strength = getStrength(password);
  const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500'
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < strength ? strengthColor[strength - 1] : 'bg-[#2B3139]'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-xs text-[#848E9C]">
          Password strength: <span className={`font-medium ${
            strength === 5 ? 'text-green-400' : 
            strength >= 3 ? 'text-blue-400' : 
            'text-yellow-400'
          }`}>{strengthText[strength - 1] || 'Very Weak'}</span>
        </span>
        <span className="text-[10px] text-[#5E6673]">8+ characters</span>
      </div>
    </div>
  );
}

// Feature badge component
function FeatureBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
      {icon}
      <span className="text-xs text-[#EAECEF]">{text}</span>
    </div>
  );
}

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });

  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordMatch(false);
      toast({
        title: "❌ Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: '',
      });
      
      // Check if email confirmation is required
      if (result.requiresConfirmation) {
        toast({
          title: "📧 Registration Successful!",
          description: "Please check your email to confirm your account. You'll be able to login after confirmation.",
        });
        
        // Redirect to login page with a message
        navigate('/login?message=email-confirmation-required');
        return;
      }
      
      toast({
        title: "✨ Account Created Successfully!",
        description: "Welcome to Kryvex Trading! Please complete your KYC verification to start trading.",
      });
      
      navigate('/');
    } catch (error) {
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('rate limit') || error.message.includes('Too many registration attempts')) {
          errorMessage = "⏱️ Too many registration attempts. Please wait a few minutes before trying again.";
        } else if (error.message.includes('already registered') || error.message.includes('This email is already registered')) {
          errorMessage = "📧 This email is already registered. Please try logging in instead.";
        } else if (error.message.includes('check your email to confirm')) {
          errorMessage = "📧 Please check your email to confirm your registration before logging in.";
        } else if (error.message.includes('Password should be')) {
          errorMessage = "🔑 Password requirements not met. Please choose a stronger password.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "❌ Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'password' || field === 'confirmPassword') {
      setPasswordMatch(true);
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0E11] to-[#1E2329] flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl max-h-3xl">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {/* Logo & Brand */}
        <motion.div 
          className="text-center mb-6"
          variants={fadeInUp}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#F0B90B] blur-xl opacity-20 rounded-full" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F0B90B]/20">
              <span className="text-[#181A20] font-bold text-3xl">S</span>
            </div>
          </div>
          
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-[#EAECEF] mb-2"
            variants={fadeInUp}
          >
            Create Account
          </motion.h1>
          
          <motion.p 
            className="text-sm text-[#848E9C] max-w-xs mx-auto"
            variants={fadeInUp}
          >
            Join Kryvex Trading and start your crypto investment journey with institutional-grade security
          </motion.p>
        </motion.div>

        {/* Trust Badges - Mobile Optimized */}
        <motion.div 
          className="flex flex-wrap gap-2 justify-center mb-6"
          variants={fadeInUp}
        >
          <FeatureBadge icon={<Shield size={14} className="text-[#F0B90B]" />} text="FDIC Insured" />
          <FeatureBadge icon={<Fingerprint size={14} className="text-[#F0B90B]" />} text="Biometric" />
          <FeatureBadge icon={<CreditCard size={14} className="text-[#F0B90B]" />} text="Instant Deposits" />
          <FeatureBadge icon={<Globe size={14} className="text-[#F0B90B]" />} text="Global Access" />
        </motion.div>

        {/* Registration Card */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#181A20] border border-[#2B3139] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            
            {/* Welcome Bonus Banner */}
            <div className="bg-gradient-to-r from-[#F0B90B]/20 to-yellow-500/20 rounded-xl p-3 mb-6 border border-[#F0B90B]/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0B90B] flex items-center justify-center">
                  <Sparkles size={16} className="text-[#181A20]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#EAECEF]">🎁 Welcome Bonus</p>
                  <p className="text-[10px] text-[#848E9C]">Get up to $50 BTC when you complete KYC</p>
                </div>
                <Badge className="bg-[#F0B90B] text-[#181A20] text-[10px] px-2 py-1">
                  Limited Time
                </Badge>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Fields - Grid optimized for mobile */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-medium text-[#EAECEF]">
                    First Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-4 py-3 h-11 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-medium text-[#EAECEF]">
                    Last Name
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Last"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-4 py-3 h-11 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-[#EAECEF]">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-4 py-3 h-11 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-[#EAECEF]">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-12 py-3 h-11 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#848E9C] hover:text-[#F0B90B] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={formData.password} />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-[#EAECEF]">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full bg-[#1E2329] border ${
                      !passwordMatch && formData.confirmPassword 
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-[#2B3139] focus:border-[#F0B90B]'
                    } text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-12 py-3 h-11 rounded-xl focus:ring-1 ${
                      !passwordMatch && formData.confirmPassword 
                        ? 'focus:ring-red-500' 
                        : 'focus:ring-[#F0B90B]'
                    } transition-all text-sm`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#848E9C] hover:text-[#F0B90B] transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!passwordMatch && formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                    <AlertCircle size={12} />
                    <span>Passwords do not match</span>
                  </div>
                )}
              </div>

              {/* Terms & Marketing Checkboxes */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked as boolean)}
                    className="mt-1 border-[#2B3139] data-[state=checked]:bg-[#F0B90B] data-[state=checked]:border-[#F0B90B]"
                    required
                  />
                  <Label htmlFor="agreeToTerms" className="text-xs text-[#848E9C] leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-[#F0B90B] hover:text-yellow-400 transition-colors font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-[#F0B90B] hover:text-yellow-400 transition-colors font-medium">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeToMarketing"
                    checked={formData.agreeToMarketing}
                    onCheckedChange={(checked) => handleInputChange('agreeToMarketing', checked as boolean)}
                    className="mt-1 border-[#2B3139] data-[state=checked]:bg-[#F0B90B] data-[state=checked]:border-[#F0B90B]"
                  />
                  <Label htmlFor="agreeToMarketing" className="text-xs text-[#848E9C] leading-relaxed">
                    I agree to receive marketing communications and updates from Kryvex Trading
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold h-12 rounded-xl text-base shadow-lg shadow-[#F0B90B]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                disabled={!formData.agreeToTerms || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#181A20] border-t-transparent rounded-full animate-spin" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#848E9C]">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-[#F0B90B] hover:text-yellow-400 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Sign in
                  <ChevronRight size={14} />
                </Link>
              </p>
            </div>

            {/* Security Features */}
            <div className="mt-6 pt-6 border-t border-[#2B3139]">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Shield size={16} className="text-[#F0B90B]" />
                  <span className="text-[10px] text-[#848E9C]">256-bit SSL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Fingerprint size={16} className="text-[#F0B90B]" />
                  <span className="text-[10px] text-[#848E9C]">2FA Ready</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle size={16} className="text-[#F0B90B]" />
                  <span className="text-[10px] text-[#848E9C]">FDIC Insured</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Terms Footer */}
        <motion.div 
          className="mt-6 text-center"
          variants={fadeInUp}
        >
          <p className="text-[10px] text-[#5E6673]">
            By creating an account, you confirm that you have read and understood our{' '}
            <Link to="/terms" className="text-[#848E9C] hover:text-[#F0B90B] transition-colors">
              Terms
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#848E9C] hover:text-[#F0B90B] transition-colors">
              Privacy Policy
            </Link>
          </p>
          
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[#5E6673]">
            <span>🔒 Secure Registration</span>
            <span>✓ Verified by Comodo</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Optimization Styles */}
      <style>{`
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important; /* Prevents zoom on mobile */
          }
          .rounded-2xl {
            border-radius: 1.5rem;
          }
          button {
            min-height: 48px;
          }
          input {
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
}