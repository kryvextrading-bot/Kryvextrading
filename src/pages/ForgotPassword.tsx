import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Shield, Sparkles, Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "❌ Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "❌ Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      toast({
        title: "✅ Reset Email Sent",
        description: "Password reset instructions have been sent to your email",
      });
    } catch (error) {
      toast({
        title: "❌ Failed to Send",
        description: "Unable to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
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

  if (isSubmitted) {
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
          {/* Success Icon */}
          <motion.div 
            className="text-center mb-6"
            variants={fadeInUp}
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div variants={fadeInUp}>
            <Card className="bg-[#181A20] border border-[#2B3139] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">
                  Check Your Email
                </h2>
                
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-green-400" size={20} />
                    <div className="text-left">
                      <p className="text-sm text-[#EAECEF] font-medium">
                        Reset instructions sent to:
                      </p>
                      <p className="text-xs text-green-400 font-mono">
                        {email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-[#848E9C]">
                  <p>We've sent password reset instructions to your email address.</p>
                  <p>Please check your inbox and follow the link to reset your password.</p>
                  <p className="text-xs">If you don't see the email, check your spam folder.</p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={handleBackToLogin}
                    className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold h-12 rounded-xl text-base shadow-lg shadow-[#F0B90B]/20 transition-all"
                  >
                    Back to Login
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setIsSubmitted(false)}
                    className="w-full border border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139] h-12 rounded-xl text-base transition-all"
                  >
                    Try Another Email
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Security Footer */}
          <motion.div 
            className="mt-6 text-center"
            variants={fadeInUp}
          >
            <div className="flex items-center justify-center gap-4 text-[10px] text-[#5E6673]">
              <Shield size={12} />
              <span>Secure Reset Process</span>
              <Lock size={12} />
              <span>Encrypted Transfer</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="forgot-password-page min-h-screen bg-gradient-to-b from-[#0B0E11] to-[#1E2329] flex flex-col items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      
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
        {/* Back Button */}
        <motion.div 
          className="mb-6"
          variants={fadeInUp}
        >
          <Button 
            variant="ghost" 
            onClick={handleBackToLogin}
            className="text-[#848E9C] hover:text-[#EAECEF] transition-colors p-2"
          >
            <ArrowLeft className="mr-2" size={20} />
            Back to Login
          </Button>
        </motion.div>

        {/* Logo & Brand */}
        <motion.div 
          className="text-center mb-6"
          variants={fadeInUp}
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#F0B90B] blur-xl opacity-20 rounded-full" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#F0B90B]/20">
              <Key className="w-8 h-8 text-[#181A20]" />
            </div>
          </div>
          
          <motion.h1 
            className="text-2xl sm:text-3xl font-bold text-[#EAECEF] mb-2"
            variants={fadeInUp}
          >
            Forgot Password?
          </motion.h1>
          
          <motion.p 
            className="text-sm text-[#848E9C] max-w-xs mx-auto"
            variants={fadeInUp}
          >
            Enter your email address and we'll send you instructions to reset your password
          </motion.p>
        </motion.div>

        {/* Security Features */}
        <motion.div 
          className="flex flex-wrap gap-2 justify-center mb-6"
          variants={fadeInUp}
        >
          <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
            <Shield size={14} className="text-[#F0B90B]" />
            <span className="text-xs text-[#EAECEF]">Secure</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
            <Sparkles size={14} className="text-[#F0B90B]" />
            <span className="text-xs text-[#EAECEF]">Fast</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#23262F] px-3 py-1.5 rounded-full">
            <Lock size={14} className="text-[#F0B90B]" />
            <span className="text-xs text-[#EAECEF]">Encrypted</span>
          </div>
        </motion.div>

        {/* Forgot Password Form */}
        <motion.div variants={fadeInUp}>
          <Card className="bg-[#181A20] border border-[#2B3139] rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-blue-400" size={20} />
                <div className="flex-1">
                  <p className="text-xs text-blue-400 font-medium">
                    Password Reset
                  </p>
                  <p className="text-[10px] text-[#848E9C]">
                    We'll send you a secure link to create a new password
                  </p>
                </div>
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
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] placeholder-[#5E6673] pl-10 pr-4 py-3 h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all"
                    required
                  />
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
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Send Reset Link</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Alternative Options */}
            <div className="mt-6 pt-6 border-t border-[#2B3139]">
              <div className="text-center space-y-3">
                <p className="text-xs text-[#848E9C]">
                  Remember your password?
                </p>
                <Button 
                  variant="outline"
                  onClick={handleBackToLogin}
                  className="border border-[#2B3139] text-[#EAECEF] hover:bg-[#2B3139] h-10 rounded-xl text-sm transition-all"
                >
                  Back to Login
                </Button>
              </div>

              {/* Support Info */}
              <div className="mt-4 text-center">
                <p className="text-xs text-[#5E6673] mb-2">
                  Need help? Contact our support team
                </p>
                <div className="flex items-center justify-center gap-4 text-[10px] text-[#5E6673]">
                  <span>📧 support@kryvex.com</span>
                  <span>•</span>
                  <span>📞 1-800-KRYVEX</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Security Footer */}
        <motion.div 
          className="mt-6 text-center"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-center gap-4 text-[10px] text-[#5E6673]">
            <span>🔒 Secure Reset</span>
            <span>✓ SSL Encrypted</span>
            <span>⏱️ 24/7 Support</span>
          </div>
        </motion.div>
      </motion.div>

      </div>
  );
}
