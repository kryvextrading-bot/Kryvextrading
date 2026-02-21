// Share.tsx - Professional Share & Earn Page (No Transaction History)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaFacebookF, FaTelegram, FaXTwitter, FaInstagram, FaWhatsapp,
  FaCopy, FaTrophy, FaUsers, FaUserPlus, FaUserCheck, FaCoins
} from 'react-icons/fa6';
import { 
  ArrowUpRight, Eye, EyeOff, CheckCircle, Award, Share2,
  Users, TrendingUp, DollarSign, Clock, Sparkles
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

// Types
interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  pending_earnings: number;
  referral_code: string;
  referral_link: string;
}

export default function Share() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [loading, setLoading] = useState(true);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Load real data from Supabase
  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);

      // Get user's referral code and stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('referral_code, referral_earnings, referral_count, active_referrals')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Get user's referral link
      const referralCode = userData?.referral_code || user?.id.slice(0, 8);
      const referralLink = `https://www.kryvextrading.com/signup?ref=${referralCode}`;

      setReferralStats({
        total_referrals: userData?.referral_count || 0,
        active_referrals: userData?.active_referrals || 0,
        total_earnings: userData?.referral_earnings || 0,
        pending_earnings: (userData?.referral_earnings || 0) * 0.15, // 15% pending example
        referral_code: referralCode,
        referral_link: referralLink
      });

    } catch (error) {
      console.error('Failed to load referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!referralStats) return;
    
    navigator.clipboard.writeText(referralStats.referral_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Referral link copied!');
  };

  const shareOnSocial = (platform: string) => {
    if (!referralStats) return;
    
    const text = encodeURIComponent(`Join me on Kryvex Trading and get exclusive bonuses! 🚀\n\n${referralStats.referral_link}`);
    const url = referralStats.referral_link;
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      instagram: `https://www.instagram.com/` // Instagram doesn't have direct share URL
    };
    
    if (platform === 'instagram') {
      toast.success('Share your referral link on Instagram!');
      navigator.clipboard.writeText(referralStats.referral_link);
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
    }
  };

  const shareOptions = [
    { name: 'Facebook', icon: FaFacebookF, color: 'bg-[#1877F2] hover:bg-[#0E65D9]', action: () => shareOnSocial('facebook') },
    { name: 'Twitter', icon: FaXTwitter, color: 'bg-[#000000] hover:bg-[#333333]', action: () => shareOnSocial('twitter') },
    { name: 'Telegram', icon: FaTelegram, color: 'bg-[#0088cc] hover:bg-[#0077B5]', action: () => shareOnSocial('telegram') },
    { name: 'WhatsApp', icon: FaWhatsapp, color: 'bg-[#25D366] hover:bg-[#20B859]', action: () => shareOnSocial('whatsapp') },
    { name: 'Instagram', icon: FaInstagram, color: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]', action: () => shareOnSocial('instagram') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] via-[#0F1217] to-[#1A1D24]">
      {/* Header */}
      <div className="bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
              >
                <ArrowUpRight className="w-5 h-5 text-[#848E9C]" />
              </button>
              <h1 className="text-2xl font-bold text-[#EAECEF]">Share & Earn</h1>
              <Badge className="bg-gradient-to-r from-[#F0B90B] to-yellow-500 text-[#181A20] border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                Invite Friends, Earn Rewards
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-[#848E9C]"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
                className="border-[#2B3139] text-[#848E9C] hover:bg-[#2B3139]"
              >
                {showQR ? 'Hide QR' : 'Show QR'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-[#EAECEF] mb-3">
            Share Your Referral Link & Earn
          </h2>
          <p className="text-[#848E9C] max-w-2xl mx-auto">
            Invite your friends to join Kryvex Trading and earn commission from their trades. 
            The more active traders you refer, the more you earn!
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-[#1E2329] border-[#2B3139] shadow-xl overflow-hidden">
            {/* Stats Header */}
            <div className="bg-gradient-to-r from-[#F0B90B] to-yellow-500 p-8 text-[#181A20]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FaTrophy className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Your Referral Program</h3>
                    <p className="text-[#F0B90B]/90">Earn up to 30% commission on referral trades</p>
                  </div>
                </div>
                <div className="bg-[#F0B90B]/20 px-4 py-2 rounded-full text-sm font-medium">
                  Level 3 • Silver Tier
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 bg-white/20" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#F0B90B]/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUsers className="w-4 h-4" />
                      <span className="text-sm opacity-90 text-[#181A20]">Total Referrals</span>
                    </div>
                    <div className="text-2xl font-bold text-[#181A20]">{referralStats?.total_referrals || 0}</div>
                  </div>
                  
                  <div className="bg-[#F0B90B]/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUserCheck className="w-4 h-4" />
                      <span className="text-sm opacity-90 text-[#181A20]">Active</span>
                    </div>
                    <div className="text-2xl font-bold text-[#181A20]">{referralStats?.active_referrals || 0}</div>
                  </div>
                  
                  <div className="bg-[#F0B90B]/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm opacity-90 text-[#181A20]">Total Earned</span>
                    </div>
                    <div className="text-2xl font-bold text-[#F0B90B]">
                      {showBalance ? `$${referralStats?.total_earnings.toFixed(2) || '0.00'}` : '••••'}
                    </div>
                  </div>
                  
                  <div className="bg-[#F0B90B]/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm opacity-90 text-[#181A20]">Pending</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-300">
                      {showBalance ? `$${referralStats?.pending_earnings.toFixed(2) || '0.00'}` : '•••••'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Referral Link Section */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-[#EAECEF] mb-1">
                    Your Unique Referral Link
                  </h4>
                  <p className="text-sm text-[#848E9C]">
                    Share this link with your friends. You'll earn commission when they sign up and trade.
                  </p>
                </div>
                <Badge className="bg-[#F0B90B]/15 text-[#F0B90B] border-[#F0B90B]/20 px-3 py-1">
                  <Award className="w-3 h-3 mr-1" />
                  15% Commission
                </Badge>
              </div>

              {/* Link + QR Row */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-2 p-2 bg-[#F0B90B]/10 rounded-lg">
                      <FaCoins className="w-4 h-4 text-[#F0B90B]" />
                      <code className="text-sm font-mono text-[#F0B90B]">
                        {referralStats?.referral_code || 'loading...'}
                      </code>
                    </div>
                    <span className="text-xs text-[#848E9C]">Your referral code</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      value={referralStats?.referral_link || ''}
                      readOnly
                      className="flex-1 bg-[#23262F] border-[#2B3139] px-4 py-3 text-[#EAECEF] font-mono text-sm"
                    />
                    <Button
                      onClick={handleCopy}
                      className="bg-[#F0B90B] hover:bg-yellow-500 text-[#181A20] px-6 py-3 font-medium transition-colors min-w-[100px]"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {showQR && referralStats && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center"
                  >
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <QRCodeSVG
                        value={referralStats.referral_link}
                        size={120}
                        level="H"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Share Options */}
              <div>
                <h4 className="text-lg font-semibold text-[#EAECEF] mb-4">
                  Share on Social Media
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {shareOptions.map((option) => (
                    <Button
                      key={option.name}
                      onClick={option.action}
                      className={`${option.color} text-white border-0 transition-all hover:scale-105 hover:shadow-lg`}
                    >
                      <option.icon className="w-4 h-4 mr-2" />
                      {option.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Commission Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-[#F0B90B]/10 to-yellow-500/10 rounded-xl border border-[#F0B90B]/20">
                <div className="flex items-start gap-4">
                  <div className="bg-[#F0B90B] text-[#181A20] p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-[#EAECEF] mb-2">
                      How It Works
                    </h5>
                    <ul className="space-y-2 text-sm text-[#848E9C]">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F0B90B] rounded-full" />
                        Share your unique referral link with friends
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F0B90B] rounded-full" />
                        They sign up and start trading on Kryvex
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F0B90B] rounded-full" />
                        You earn 15% commission on their trading fees
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#F0B90B] rounded-full" />
                        Higher tiers earn up to 30% commission
                      </li>
                    </ul>
                    <div className="mt-4 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/referral-details')}
                        className="border-[#F0B90B] text-[#F0B90B] hover:bg-[#F0B90B]/10"
                      >
                        View Full Details
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => navigate('/referral-leaderboard')}
                        className="text-[#F0B90B] hover:text-yellow-400"
                      >
                        See Leaderboard →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-center"
        >
          <p className="text-[#848E9C] text-sm">
            Already referred someone? Check your 
            <button 
              onClick={() => navigate('/wallet')} 
              className="text-[#F0B90B] hover:text-yellow-400 font-medium mx-1"
            >
              wallet
            </button> 
            to see your earnings.
          </p>
        </motion.div>
      </div>
    </div>
  );
}