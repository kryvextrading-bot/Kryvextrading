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
  PieChart,
  Rocket,
  Target,
  BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Shield,
    title: 'Institutional-Grade Custody',
    description: 'Your crypto assets are held in secure, insured custody accounts with multi-signature protection',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    color: 'text-blue-400'
  },
  {
    icon: TrendingUp,
    title: 'Professional Trading Suite',
    description: 'Access advanced trading tools, real-time market data, and institutional-grade liquidity',
    gradient: 'from-green-500/20 to-emerald-500/20',
    color: 'text-green-400'
  },
  {
    icon: Users,
    title: 'Dedicated IRA Specialists',
    description: '24/7 support from crypto and retirement planning experts, available when you need them',
    gradient: 'from-purple-500/20 to-pink-500/20',
    color: 'text-purple-400'
  },
  {
    icon: Globe,
    title: 'Global Compliance',
    description: 'Fully compliant with IRS regulations, SEC guidelines, and international tax treaties',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    color: 'text-yellow-400'
  }
];

const benefits = [
  {
    icon: Shield,
    title: 'Tax-Advantaged Growth',
    description: 'Traditional, Roth, and SEP IRA options with tax-deferred or tax-free growth'
  },
  {
    icon: Lock,
    title: 'Secure Custody',
    description: 'Bank-grade security with cold storage, multi-signature wallets, and insurance coverage'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Real-time portfolio tracking, performance metrics, and risk assessment tools'
  },
  {
    icon: Wallet,
    title: 'Multi-Currency Support',
    description: 'Trade 50+ cryptocurrencies including Bitcoin, Ethereum, and top altcoins'
  },
  {
    icon: Clock,
    title: 'Instant Settlement',
    description: 'Near-instant trade execution and settlement, 24/7/365'
  },
  {
    icon: Award,
    title: 'Industry Leading',
    description: 'A+ BBB rating, 4.8/5 Trustpilot score from 2,000+ verified customers'
  }
];

const stats = [
  { value: '$2.5B+', label: 'Assets Under Management', icon: DollarSign },
  { value: '50,000+', label: 'Active Investors', icon: Users },
  { value: '99.99%', label: 'Uptime SLA', icon: Zap },
  { value: '50+', label: 'Supported Assets', icon: BarChart3 }
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Retired Educator',
    content: 'Swan IRA made it possible for me to diversify my retirement portfolio with crypto. The platform is intuitive and their support team is exceptional.',
    rating: 5,
    avatar: 'SC'
  },
  {
    name: 'Michael Rodriguez',
    role: 'Tech Entrepreneur',
    content: 'The institutional-grade trading tools and professional custody solution gave me the confidence to move my IRA into crypto. Best decision I made.',
    rating: 5,
    avatar: 'MR'
  },
  {
    name: 'Jennifer Park',
    role: 'Financial Advisor',
    content: 'I recommend Swan IRA to all my clients interested in crypto retirement accounts. Their compliance and security standards are unmatched.',
    rating: 5,
    avatar: 'JP'
  }
];

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0B0E11]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0B90B]/5 via-transparent to-[#F0B90B]/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-20 -left-20 w-72 h-72 bg-[#F0B90B]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-[#F0B90B]/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div 
            className="text-center space-y-6 md:space-y-8 max-w-5xl mx-auto"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div variants={fadeInUp}>
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 px-4 py-2 rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                IRS-Approved Crypto IRA Provider
              </Badge>
            </motion.div>
            
            {/* Heading */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-7xl font-bold"
              variants={fadeInUp}
            >
              <span className="bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent">
                The Premier
              </span>
              <br />
              <span className="text-[#EAECEF]">
                Crypto IRA Platform
              </span>
            </motion.h1>
            
            {/* Description */}
            <motion.p 
              className="text-lg md:text-xl text-[#848E9C] max-w-3xl mx-auto"
              variants={fadeInUp}
            >
              Secure, regulated, and designed for long-term wealth building. 
              Trade cryptocurrencies in your retirement account with institutional-grade protection.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              variants={fadeInUp}
            >
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold text-base md:text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F0B90B]/20 transition-all transform hover:scale-105"
              >
                <Link to="/register">
                  Open Your IRA
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] text-base md:text-lg px-8 py-6 rounded-xl"
              >
                <Link to="/about">
                  Schedule Consultation
                </Link>
              </Button>
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6 pt-8"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-xs text-[#848E9C]">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-xs text-[#848E9C]">Cold Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-xs text-[#848E9C]">SOC2 Type II</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#F0B90B]" />
                <span className="text-xs text-[#848E9C]">50K+ Investors</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 bg-[#0B0E11] border-y border-[#2B3139]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  variants={fadeInUp}
                >
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#F0B90B]" />
                    </div>
                  </div>
                  <div className="text-xl md:text-2xl font-bold text-[#EAECEF]">{stat.value}</div>
                  <div className="text-xs md:text-sm text-[#848E9C] mt-1">{stat.label}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 mb-4">
              Institutional Grade
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-4">
              Why Choose Swan IRA?
            </h2>
            <p className="text-lg text-[#848E9C] max-w-2xl mx-auto">
              Experience the future of retirement investing with our comprehensive crypto IRA platform, 
              built by financial and blockchain experts.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="bg-[#1E2329] border border-[#2B3139] hover:border-[#F0B90B]/50 transition-all duration-300 p-6 h-full">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <Icon className={`h-7 w-7 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">{feature.title}</h3>
                    <p className="text-sm text-[#848E9C] leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Benefits Grid Section */}
      <section className="py-16 md:py-24 bg-[#0B0E11] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F0B90B]/5 to-transparent" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Left Column - Benefits Grid */}
            <motion.div variants={fadeInUp}>
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 mb-4">
                Why Investors Choose Us
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-4">
                Everything You Need for 
                <span className="bg-gradient-to-r from-[#F0B90B] to-yellow-400 bg-clip-text text-transparent ml-2">
                  Crypto IRA Success
                </span>
              </h2>
              <p className="text-lg text-[#848E9C] mb-8">
                From secure custody to professional trading tools, we provide everything you need 
                to build and manage your cryptocurrency retirement portfolio.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-6 h-6 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-[#F0B90B]" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#EAECEF]">{benefit.title}</h4>
                        <p className="text-xs text-[#848E9C] mt-1">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-8">
                <Button 
                  asChild 
                  className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold px-6 py-6 rounded-xl"
                >
                  <Link to="/features">
                    View All Features
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            {/* Right Column - CTA Card */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-8 shadow-xl">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#F0B90B] blur-3xl opacity-20 rounded-full" />
                    <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-10 w-10 text-[#181A20]" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-[#EAECEF] mb-2">Ready to Start?</h3>
                    <p className="text-[#848E9C]">
                      Join 50,000+ investors who trust Swan IRA for their cryptocurrency retirement planning.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#F0B90B]" />
                      <span className="text-[#EAECEF]">No minimum investment</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#F0B90B]" />
                      <span className="text-[#EAECEF]">Zero account fees</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-[#F0B90B]" />
                      <span className="text-[#EAECEF]">5-minute setup</span>
                    </div>
                  </div>
                  
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold py-6 rounded-xl text-lg"
                  >
                    <Link to="/register">
                      Open Your IRA Today
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <p className="text-xs text-[#5E6673]">
                    *Terms and conditions apply. Crypto investments are subject to market risk.
                  </p>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 mb-4">
              Trusted by Investors
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-4">
              What Our Clients Say
            </h2>
            <p className="text-lg text-[#848E9C] max-w-2xl mx-auto">
              Join thousands of satisfied investors who have chosen Swan IRA for their retirement journey.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.name} variants={fadeInUp}>
                <Card className="bg-[#1E2329] border border-[#2B3139] p-6 h-full hover:border-[#F0B90B]/50 transition-all">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#F0B90B] text-[#F0B90B]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#EAECEF] mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F0B90B] to-yellow-500 flex items-center justify-center text-[#181A20] font-bold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#EAECEF]">{testimonial.name}</div>
                      <div className="text-xs text-[#848E9C]">{testimonial.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-[#F0B90B]/10 via-transparent to-[#F0B90B]/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            className="max-w-3xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
              <Rocket className="w-8 h-8 text-[#F0B90B]" />
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-4">
              Start Your Crypto IRA Journey Today
            </h2>
            <p className="text-lg text-[#848E9C] mb-8">
              Secure your financial future with cryptocurrency investments in a tax-advantaged IRA account. 
              Get started in minutes with our guided setup process.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B] hover:to-yellow-600 text-[#181A20] font-bold text-base md:text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F0B90B]/20 transition-all transform hover:scale-105"
              >
                <Link to="/register">
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] text-base md:text-lg px-8 py-6 rounded-xl"
              >
                <Link to="/contact">
                  Talk to an Expert
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-xs text-[#5E6673]">
              <span>🔒 256-bit SSL Encryption</span>
              <span>✓ SOC2 Type II Certified</span>
              <span>🏦 FDIC Insured up to $250K</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Note */}
      <div className="border-t border-[#2B3139] py-6">
        <div className="container mx-auto px-4">
          <p className="text-xs text-center text-[#5E6673]">
            Cryptocurrency investments are volatile and high risk. Past performance does not guarantee future results. 
            Swan IRA is not a registered investment advisor. All investments involve risk, including the possible loss of capital.
          </p>
        </div>
      </div>
    </div>
  );
}