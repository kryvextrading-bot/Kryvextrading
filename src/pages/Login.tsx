import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAdmin } = useAuth();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setPendingRedirect(true);
      toast({
        title: "✨ Welcome Back!",
        description: "Successfully signed in to Swan IRA.",
      });
    } catch (error) {
      toast({
        title: "❌ Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pendingRedirect && user) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
      setPendingRedirect(false);
    }
  }, [pendingRedirect, user, isAdmin, navigate, from]);

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
    <div className="login-page min-h-screen bg-gradient-to-b from-[#0B0E11] to-[#1E2329] flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      
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
          className="text-center mb-8"
          variants={fadeInUp}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#F0B90B] blur-xl opacity-20 rounded-full" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F0B90B]/20">
              <span className="text-[#181A20] font-bold text-3xl">S</span>
            </div>
          </div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl font-bold text-[#EAECEF] mb-2"
            variants={fadeInUp}
          >
            Welcome Back
          </motion.h1>
          
          <motion.p 
            className="text-[#848E9C] text-sm sm:text-base"
            variants={fadeInUp}
          >
            Sign in to continue to Swan IRA
          </motion.p>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#181A20] border border-[#2B3139] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            
            {/* Feature Badges - Mobile Optimized */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
                <Shield size={14} className="text-[#F0B90B]" />
                <span className="text-xs text-[#EAECEF]">Secure</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
                <Zap size={14} className="text-[#F0B90B]" />
                <span className="text-xs text-[#EAECEF]">Fast</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
                <Sparkles size={14} className="text-[#F0B90B]" />
                <span className="text-xs text-[#EAECEF]">24/7 Support</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-[#EAECEF]">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-4 py-3 h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-[#EAECEF]">
                    Password
                  </Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-[#F0B90B] hover:text-yellow-400 transition-colors flex items-center gap-1"
                  >
                    <Lock size={12} />
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#848E9C] group-focus-within:text-[#F0B90B] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-12 py-3 h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all"
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
              </div>

              {/* Remember Me & Security Note */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-4 h-4 rounded border transition-colors ${
                      rememberMe 
                        ? 'bg-[#F0B90B] border-[#F0B90B]' 
                        : 'border-[#2B3139] bg-[#1E2329]'
                    } flex items-center justify-center`}
                  >
                    {rememberMe && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#181A20" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </button>
                  <span className="text-xs text-[#848E9C]">Remember me</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Shield size={12} className="text-[#848E9C]" />
                  <span className="text-xs text-[#848E9C]">256-bit SSL</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold h-12 rounded-xl text-base shadow-lg shadow-[#F0B90B]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#181A20] border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#848E9C]">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-[#F0B90B] hover:text-yellow-400 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Sign up
                  <ChevronRight size={14} />
                </Link>
              </p>
            </div>

            {/* Demo Credentials - Mobile Optimized */}
            <div className="mt-6 pt-6 border-t border-[#2B3139]">
              <p className="text-xs text-center text-[#5E6673] mb-3">
                ⚡ Demo credentials for testing
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1E2329] rounded-lg p-2">
                  <div className="text-[#848E9C]">User</div>
                  <div className="text-[#EAECEF] font-mono truncate">user@demo.com</div>
                  <div className="text-[#848E9C] text-[10px]">••••••••</div>
                </div>
                <div className="bg-[#1E2329] rounded-lg p-2">
                  <div className="text-[#848E9C]">Admin</div>
                  <div className="text-[#EAECEF] font-mono truncate">admin@demo.com</div>
                  <div className="text-[#848E9C] text-[10px]">••••••••</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Terms & Privacy */}
        <motion.div 
          className="mt-8 text-center"
          variants={fadeInUp}
        >
          <p className="text-xs text-[#5E6673]">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-[#848E9C] hover:text-[#F0B90B] transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-[#848E9C] hover:text-[#F0B90B] transition-colors">
              Privacy Policy
            </Link>
          </p>
          
          {/* Security Footer */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-[#5E6673]">
            <span>🔒 256-bit SSL</span>
            <span>🛡️ 2FA Available</span>
            <span>✓ SOC2 Type II</span>
          </div>
        </motion.div>

        {/* Version Info - Mobile */}
        <div className="mt-4 text-center text-[10px] text-[#5E6673]">
          <span>Version 2.4.0 | © 2024 Swan IRA</span>
        </div>
      </motion.div>

      </div>
  );
}