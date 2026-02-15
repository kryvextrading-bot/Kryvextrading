import {
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  Globe,
  CheckCircle,
  Sparkles,
  Zap,
  BarChart3,
  Wallet,
  Lock,
  Clock,
  Award,
  ChevronRight,
  Star,
  DollarSign,
  Rocket,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/* ============================= */
/* DATA */
/* ============================= */

const features = [
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description:
      'Cold storage custody, multi-signature wallets, 2FA authentication, and advanced risk monitoring systems.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    color: 'text-blue-400'
  },
  {
    icon: TrendingUp,
    title: 'Advanced Trading Engine',
    description:
      'Ultra-fast order execution, deep liquidity, real-time charts, and professional trading tools.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    color: 'text-green-400'
  },
  {
    icon: Globe,
    title: 'Global Market Access',
    description:
      'Trade 100+ crypto pairs across spot markets with 24/7 uptime and worldwide availability.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    color: 'text-yellow-400'
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    description:
      'Professional support team available around the clock to assist with trading and account security.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    color: 'text-purple-400'
  }
];

const stats = [
  { value: '$4.2B+', label: '24h Trading Volume', icon: DollarSign },
  { value: '120,000+', label: 'Active Traders', icon: Users },
  { value: '99.99%', label: 'Platform Uptime', icon: Zap },
  { value: '100+', label: 'Supported Assets', icon: BarChart3 }
];

const testimonials = [
  {
    name: 'David Kim',
    role: 'Professional Trader',
    content:
      'The execution speed and liquidity depth are exceptional. This platform gives me everything I need for serious trading.',
    rating: 5,
    avatar: 'DK'
  },
  {
    name: 'Amina Hassan',
    role: 'Crypto Investor',
    content:
      'Security and transparency are top-tier. I feel confident holding and trading large positions here.',
    rating: 5,
    avatar: 'AH'
  },
  {
    name: 'Lucas Meyer',
    role: 'Portfolio Manager',
    content:
      'The analytics tools and real-time data feed are incredibly powerful. It rivals institutional platforms.',
    rating: 5,
    avatar: 'LM'
  }
];

/* ============================= */
/* ANIMATIONS */
/* ============================= */

const fadeInUp = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12
    }
  }
};

/* ============================= */
/* COMPONENT */
/* ============================= */

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF]">

      {/* HERO */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/5 via-transparent to-[#F0B90B]/5" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Secure • Fast • Professional
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
            >
              Trade Crypto With
              <span className="block bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent">
                Institutional Precision
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-[#848E9C]"
            >
              Professional-grade crypto trading platform designed for speed,
              liquidity, and uncompromising security.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:to-yellow-600 text-[#181A20] font-bold px-8 py-6 rounded-xl transition-all hover:scale-105"
              >
                <Link to="/register">
                  Start Trading
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] px-8 py-6 rounded-xl"
              >
                <Link to="/markets">
                  Explore Markets
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 border-y border-[#2B3139]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center"
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} variants={fadeInUp}>
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F0B90B]" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-[#848E9C]">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold mb-4"
            >
              Built for Serious Traders
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-[#848E9C] max-w-2xl mx-auto"
            >
              From retail investors to high-volume professionals — our
              infrastructure delivers reliability and performance at scale.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="bg-[#1E2329] border border-[#2B3139] p-6 h-full hover:border-[#F0B90B]/50 transition-all">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <Icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#848E9C]">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 bg-gradient-to-r from-[#F0B90B]/10 via-transparent to-[#F0B90B]/10 text-center">
        <div className="container mx-auto px-4">
          <Rocket className="w-10 h-10 mx-auto text-[#F0B90B] mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Trade Smarter?
          </h2>
          <p className="text-lg text-[#848E9C] mb-8 max-w-2xl mx-auto">
            Join thousands of traders leveraging institutional-grade tools to
            navigate the crypto markets with confidence.
          </p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeInUp}
            className="inline-block"
          >
            <Button
              asChild
              size="lg"
              className="relative group bg-gradient-to-r from-[#F0B90B] via-[#F0B90B] to-yellow-500 hover:from-yellow-400 hover:via-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold px-10 py-7 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#F0B90B]/20 hover:shadow-xl hover:shadow-[#F0B90B]/30 border-2 border-[#F0B90B]/20 hover:border-[#F0B90B]/40"
            >
              <Link to="/register" className="flex items-center justify-center gap-3">
                <span className="relative z-10">Create Your Account</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:animate-shimmer" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
