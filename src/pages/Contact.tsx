// pages/Contact.tsx - COMPLETE PREMIUM REDESIGN

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Clock, Send, MessageSquare, 
  ChevronRight, CheckCircle, AlertCircle, Award,
  Shield, Zap, Globe, Users, Target, TrendingUp,
  Twitter, Github, Linkedin, Facebook, Instagram,
  Headphones, HelpCircle, BookOpen, FileText,
  ExternalLink, Copy, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

// ==================== TYPES ====================
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface FAQ {
  question: string;
  answer: string;
  category: 'general' | 'account' | 'trading' | 'security' | 'fees';
}

// ==================== CONSTANTS ====================
const BINANCE_YELLOW = '#F0B90B';
const BINANCE_DARK = '#0B0E11';
const BINANCE_CARD = '#1E2329';
const BINANCE_BORDER = '#2B3139';
const BINANCE_HOVER = '#373B42';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Support',
    value: 'kryvextrading@gmail.com',
    description: 'Get help with your account or trading questions',
    action: 'Send Email',
    color: 'from-blue-500 to-blue-400'
  },
  {
    icon: Phone,
    title: 'WhatsApp Support',
    value: '+1 (571) 629-5850',
    description: 'Speak with our Kryvex Trading specialists directly',
    action: 'Message Us',
    color: 'from-green-500 to-green-400'
  },
  {
    icon: MapPin,
    title: 'Office Address',
    value: '123 Financial District, New York, NY 10001',
    description: 'Visit our headquarters in Manhattan',
    action: 'Get Directions',
    color: 'from-purple-500 to-purple-400'
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: '24/7 Available',
    description: 'Round-the-clock customer support',
    action: 'Start Chat',
    color: 'from-orange-500 to-orange-400'
  }
];

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/kryvextrading', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/kryvextrading', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/kryvextrading', label: 'LinkedIn' },
  { icon: Facebook, href: 'https://facebook.com/kryvextrading', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/kryvextrading', label: 'Instagram' }
];

const faqs: FAQ[] = [
  {
    question: 'How do I open a crypto trading account?',
    answer: 'Opening a Kryvex Trading account is simple. Click "Get Started" on our homepage, complete the registration form with your email and personal details, verify your identity, and you\'ll be ready to trade within minutes. Our platform supports both individual and institutional accounts.',
    category: 'account'
  },
  {
    question: 'What cryptocurrencies can I trade?',
    answer: 'Kryvex Trading offers a comprehensive range of digital assets including Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Solana (SOL), Cardano (ADA), and many more. We continuously evaluate and add new tokens based on market demand and security standards.',
    category: 'trading'
  },
  {
    question: 'How secure is my investment?',
    answer: 'Security is our top priority. We use institutional-grade measures including 95% cold storage with multi-signature wallets, 2FA authentication, IP whitelisting, and real-time monitoring. Additionally, we maintain comprehensive insurance coverage and comply with all regulatory requirements.',
    category: 'security'
  },
  {
    question: 'What are the trading fees?',
    answer: 'Our fee structure is transparent and competitive: Maker fees start at 0.1%, Taker fees at 0.1%. Higher volume traders qualify for reduced fees. There are no hidden charges for deposits, and withdrawal fees vary by network. All fees are clearly displayed before any transaction.',
    category: 'fees'
  },
  {
    question: 'Do you offer leverage trading?',
    answer: 'Yes, we offer leveraged trading up to 100x on selected pairs through our futures platform. All leveraged positions include advanced risk management tools, real-time margin monitoring, and automatic liquidation protection to help manage your risk effectively.',
    category: 'trading'
  },
  {
    question: 'How do I deposit funds?',
    answer: 'Depositing funds is easy: Navigate to your Wallet, select Deposit, choose your preferred cryptocurrency and network, and use the generated address. For fiat deposits, we support bank transfers, credit/debit cards, and various payment processors depending on your region.',
    category: 'account'
  },
  {
    question: 'What customer support options are available?',
    answer: 'We offer 24/7 customer support through multiple channels: Live chat for instant assistance, email support with 2-hour response time, phone support for urgent matters, and an extensive knowledge base with video tutorials and detailed guides.',
    category: 'general'
  },
  {
    question: 'Is Kryvex Trading regulated?',
    answer: 'Yes, Kryvex Trading operates in compliance with international financial regulations. We maintain licenses in multiple jurisdictions, follow strict KYC/AML procedures, and regularly undergo third-party security audits to ensure the highest standards of compliance and safety.',
    category: 'security'
  }
];

const categories = [
  { value: 'all', label: 'All Questions' },
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'trading', label: 'Trading' },
  { value: 'security', label: 'Security' },
  { value: 'fees', label: 'Fees & Limits' }
];

// ==================== ANIMATION VARIANTS ====================
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const cardVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.2 }
  }
};

const shimmerEffect = {
  initial: { x: '-100%' },
  hover: { x: '100%' },
  transition: { duration: 0.8, ease: "easeInOut" }
};

// ==================== MAIN COMPONENT ====================
export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        priority: 'medium'
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('kryvextrading@gmail.com');
    setCopied(true);
    toast.success('Email copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-[#0B0E11] text-[#EAECEF]"
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 180]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-[#F0B90B]/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#5096FF]/5 rounded-full blur-3xl"
        />
      </div>

      {/* Hero Section */}
      <motion.section 
        variants={itemVariants}
        className="relative overflow-hidden py-20 lg:py-28"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center p-2 bg-[#F0B90B]/10 rounded-2xl mb-4"
            >
              <Headphones className="w-6 h-6 text-[#F0B90B]" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#F0B90B] via-yellow-400 to-[#F0B90B] bg-clip-text text-transparent">
              Contact Kryvex Trading
            </h1>
            
            <p className="text-lg md:text-xl text-[#848E9C] max-w-2xl mx-auto leading-relaxed">
              Have questions about your trading account? Our dedicated support team is available 24/7 to assist you with every aspect of your crypto journey.
            </p>

            {/* Live Status Badge */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-3 bg-[#1E2329] border border-[#2B3139] rounded-full px-4 py-2"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-[#848E9C]">All systems operational</span>
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20 ml-2">
                <Users className="w-3 h-3 mr-1" />
                24/7 Support
              </Badge>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Contact Information */}
      <motion.section 
        variants={itemVariants}
        className="py-16"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div
                  key={info.title}
                  variants={cardVariants}
                  custom={index}
                  whileHover="hover"
                  className="group relative"
                >
                  <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-6 hover:shadow-xl hover:shadow-[#F0B90B]/5 transition-all duration-300 overflow-hidden h-full">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      variants={shimmerEffect}
                      initial="initial"
                      whileHover="hover"
                    />
                    
                    <div className="relative z-10">
                      <div className={`w-14 h-14 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-7 w-7 text-[#0B0E11]" />
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2 text-[#EAECEF]">{info.title}</h3>
                      
                      <p className="text-[#F0B90B] font-medium mb-2 break-all">
                        {info.value}
                      </p>
                      
                      <p className="text-sm text-[#848E9C] mb-4">
                        {info.description}
                      </p>
                      
                      <button className="text-[#F0B90B] text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        {info.action}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Social Links */}
          <motion.div 
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <span className="text-sm text-[#848E9C]">Connect with us:</span>
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-[#1E2329] border border-[#2B3139] rounded-xl flex items-center justify-center hover:border-[#F0B90B] hover:bg-[#F0B90B]/10 transition-all duration-200 group"
                >
                  <Icon className="w-4 h-4 text-[#848E9C] group-hover:text-[#F0B90B]" />
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* Contact Form and FAQ */}
      <motion.section 
        variants={itemVariants}
        className="py-20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Form */}
            <motion.div variants={cardVariants}>
              <Card className="bg-[#1E2329] border-[#2B3139] p-6 lg:p-8 shadow-2xl">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-[#F0B90B]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#EAECEF]">Send us a Message</h2>
                    <p className="text-sm text-[#848E9C]">We typically respond within 2 hours</p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm text-[#848E9C]">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all duration-200"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm text-[#848E9C]">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm text-[#848E9C]">Subject</Label>
                      <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                        <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B]">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                          <SelectItem value="account" className="text-[#EAECEF] focus:bg-[#2B3139]">Account Questions</SelectItem>
                          <SelectItem value="trading" className="text-[#EAECEF] focus:bg-[#2B3139]">Trading Support</SelectItem>
                          <SelectItem value="technical" className="text-[#EAECEF] focus:bg-[#2B3139]">Technical Issues</SelectItem>
                          <SelectItem value="billing" className="text-[#EAECEF] focus:bg-[#2B3139]">Billing & Fees</SelectItem>
                          <SelectItem value="security" className="text-[#EAECEF] focus:bg-[#2B3139]">Security</SelectItem>
                          <SelectItem value="other" className="text-[#EAECEF] focus:bg-[#2B3139]">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm text-[#848E9C]">Priority Level</Label>
                      <Select value={formData.priority} onValueChange={(value: any) => handleInputChange('priority', value)}>
                        <SelectTrigger className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] h-12 rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E2329] border-[#2B3139]">
                          <SelectItem value="low" className="text-[#EAECEF] focus:bg-[#2B3139]">Low - General inquiry</SelectItem>
                          <SelectItem value="medium" className="text-[#EAECEF] focus:bg-[#2B3139]">Medium - Need assistance</SelectItem>
                          <SelectItem value="high" className="text-[#EAECEF] focus:bg-[#2B3139]">High - Urgent issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm text-[#848E9C]">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe your question or issue in detail..."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      rows={6}
                      required
                      className="bg-[#0B0E11] border-[#2B3139] text-[#EAECEF] rounded-xl focus:border-[#F0B90B] focus:ring-1 focus:ring-[#F0B90B] transition-all duration-200 resize-none"
                    />
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-[#F0B90B] to-yellow-500 hover:from-[#F0B90B]/90 hover:to-yellow-500/90 text-[#0B0E11] font-semibold h-14 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#F0B90B]/20 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center justify-center">
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0B0E11]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Send Message
                          </>
                        )}
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        variants={shimmerEffect}
                        initial="initial"
                        whileHover="hover"
                      />
                    </Button>
                  </motion.div>
                </form>

                {/* Response Time Guarantee */}
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#848E9C]">
                  <Clock className="w-4 h-4" />
                  <span>Average response time: </span>
                  <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
                    &lt; 2 hours
                  </Badge>
                </div>
              </Card>
            </motion.div>

            {/* FAQ Section */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center">
                    <HelpCircle className="h-6 w-6 text-[#F0B90B]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[#EAECEF]">Frequently Asked Questions</h2>
                    <p className="text-sm text-[#848E9C]">Find quick answers to common questions</p>
                  </div>
                </div>
              </div>

              {/* FAQ Filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                  <motion.button
                    key={category.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category.value
                        ? 'bg-[#F0B90B] text-[#0B0E11] shadow-lg shadow-[#F0B90B]/20'
                        : 'bg-[#1E2329] text-[#848E9C] hover:text-[#EAECEF] hover:bg-[#2B3139]'
                    }`}
                  >
                    {category.label}
                  </motion.button>
                ))}
              </div>

              {/* FAQ Accordion */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="wait">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      transition={{ delay: index * 0.05 }}
                      className="bg-[#1E2329] border border-[#2B3139] rounded-xl overflow-hidden hover:border-[#F0B90B]/30 transition-all duration-300"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === `faq-${index}` ? null : `faq-${index}`)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between group"
                      >
                        <span className="text-[#EAECEF] font-medium pr-8">{faq.question}</span>
                        <motion.div
                          animate={{ rotate: expandedFaq === `faq-${index}` ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronRight className="w-5 h-5 text-[#848E9C] group-hover:text-[#F0B90B] transition-colors" />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedFaq === `faq-${index}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-6 pb-4"
                          >
                            <div className="pt-2 border-t border-[#2B3139]">
                              <p className="text-[#848E9C] text-sm leading-relaxed">{faq.answer}</p>
                              <Badge className="mt-3 bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
                                {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                              </Badge>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Still Need Help */}
              <motion.div 
                variants={itemVariants}
                className="mt-6 bg-gradient-to-br from-[#F0B90B]/10 to-transparent rounded-xl p-6 border border-[#F0B90B]/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F0B90B] rounded-xl flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-[#0B0E11]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#EAECEF] mb-1">Still need help?</h3>
                    <p className="text-sm text-[#848E9C]">Our support team is available 24/7 to assist you</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = 'mailto:kryvextrading@gmail.com'}
                    className="px-6 py-3 bg-[#F0B90B] text-[#0B0E11] font-semibold rounded-xl hover:bg-[#F0B90B]/90 transition-colors shadow-lg shadow-[#F0B90B]/20"
                  >
                    Contact Support
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Office Location & Map */}
      <motion.section 
        variants={itemVariants}
        className="py-20"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="inline-flex items-center justify-center p-2 bg-[#F0B90B]/10 rounded-2xl mb-4"
            >
              <MapPin className="w-6 h-6 text-[#F0B90B]" />
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#EAECEF] mb-4">Visit Our Headquarters</h2>
            <p className="text-lg text-[#848E9C] max-w-2xl mx-auto">
              Located in the heart of New York's Financial District, our doors are always open for in-person consultations
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div 
              variants={cardVariants}
              className="lg:col-span-1"
            >
              <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-8 h-full">
                <MapPin className="h-12 w-12 text-[#F0B90B] mb-6" />
                <h3 className="text-xl font-semibold mb-2 text-[#EAECEF]">Kryvex Trading Headquarters</h3>
                <p className="text-[#848E9C] mb-4 leading-relaxed">
                  123 Financial District<br />
                  Suite 456<br />
                  New York, NY 10001<br />
                  United States
                </p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[#F0B90B]" />
                    </div>
                    <div>
                      <p className="text-[#EAECEF] font-medium">Office Hours</p>
                      <p className="text-[#848E9C]">Mon-Fri: 9:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-[#F0B90B]/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-4 h-4 text-[#F0B90B]" />
                    </div>
                    <div>
                      <p className="text-[#EAECEF] font-medium">Reception</p>
                      <p className="text-[#848E9C]">+1 (212) 555-0123</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-[#F0B90B] text-[#0B0E11] font-semibold rounded-xl hover:bg-[#F0B90B]/90 transition-colors text-center inline-flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Directions
                  </motion.a>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopyEmail}
                    className="px-4 py-3 bg-[#2B3139] text-[#EAECEF] rounded-xl hover:bg-[#373B42] transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>
              </Card>
            </motion.div>

            <motion.div 
              variants={cardVariants}
              className="lg:col-span-2"
            >
              <Card className="bg-[#1E2329] border-[#2B3139] p-0 overflow-hidden h-full">
                <div className="relative h-[400px] lg:h-full min-h-[400px] bg-[#0B0E11]">
                  {/* Map Placeholder - Replace with actual map integration */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1E2329] to-[#2B3139] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-[#F0B90B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-[#F0B90B]" />
                      </div>
                      <p className="text-[#EAECEF] font-medium mb-2">Interactive Map Loading</p>
                      <p className="text-sm text-[#848E9C]">123 Financial District, New York, NY 10001</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 px-6 py-2 bg-[#F0B90B] text-[#0B0E11] rounded-lg font-medium inline-flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in Google Maps
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Trust Badges */}
      <motion.section 
        variants={itemVariants}
        className="py-20 bg-gradient-to-b from-transparent to-[#1E2329]/50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#EAECEF] mb-4">Trusted by Traders Worldwide</h2>
            <p className="text-[#848E9C]">Join thousands of satisfied customers who trust Kryvex Trading</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Secure', value: 'Bank-grade Security' },
              { icon: Zap, label: 'Fast', value: 'Instant Execution' },
              { icon: Globe, label: 'Global', value: 'Worldwide Access' },
              { icon: Users, label: 'Community', value: '50K+ Traders' }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  variants={cardVariants}
                  custom={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-6 text-center hover:border-[#F0B90B]/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-[#F0B90B]/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-[#F0B90B]" />
                  </div>
                  <div className="text-lg font-bold text-[#EAECEF] mb-1">{item.value}</div>
                  <div className="text-xs text-[#848E9C]">{item.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, select, button, textarea {
            font-size: 16px !important;
          }
        }

        /* Binance style focus rings */
        *:focus-visible {
          outline: 2px solid #F0B90B;
          outline-offset: 2px;
        }
      `}</style>
    </motion.div>
  );
}