import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowLeft,
  ChevronRight,
  Wallet,
  CreditCard,
  Percent,
  Calculator,
  FileText,
  History,
  RefreshCw,
  Info,
  Loader2,
  DollarSign,
  Landmark,
  FileCheck,
  PhoneCall
} from 'lucide-react';
import { motion } from 'framer-motion';

const LOAN_LIMIT = 1000000;
const DAILY_INTEREST_RATE = 0.003; // 0.3%
const MIN_LOAN_AMOUNT = 10000;
const MAX_LOAN_TERM = 365;
const INTEREST_FREE_DAYS = 1;

// Loan terms
const loanTerms = [
  { days: 7, label: '7 Days', interest: 0.3, popular: false },
  { days: 10, label: '10 Days', interest: 0.3, popular: true },
  { days: 20, label: '20 Days', interest: 0.3, popular: false },
  { days: 30, label: '30 Days', interest: 0.3, popular: false },
  { days: 60, label: '60 Days', interest: 0.35, popular: false },
  { days: 90, label: '90 Days', interest: 0.4, popular: false },
];

// Loan records mock data
const mockLoanHistory = [
  { id: 1, amount: 50000, term: 10, status: 'active', date: '2024-03-15', dueDate: '2024-03-25', interest: 1500, repaid: 0 },
  { id: 2, amount: 25000, term: 20, status: 'completed', date: '2024-02-01', dueDate: '2024-02-21', interest: 1500, repaid: 26500 },
  { id: 3, amount: 100000, term: 30, status: 'pending', date: '2024-03-10', dueDate: '2024-04-09', interest: 9000, repaid: 0 },
];

// FAQ items
const faqItems = [
  {
    question: 'How do I qualify for a loan?',
    answer: 'Complete KYC verification and maintain a minimum account balance of 10,000 USDT for at least 30 days.'
  },
  {
    question: 'What is the interest-free period?',
    answer: 'No interest is charged within 24 hours of loan disbursement. Interest accrues daily after the first day.'
  },
  {
    question: 'How is interest calculated?',
    answer: 'Interest is calculated daily on the outstanding principal amount at the selected term rate.'
  },
  {
    question: 'Can I repay early?',
    answer: 'Yes, early repayment is allowed with no prepayment penalties. Interest is calculated only for the days used.'
  }
];

// Loan Calculator Component
const LoanCalculator = ({ amount, term, interestRate }: { amount: number; term: number; interestRate: number }) => {
  const dailyInterest = amount * interestRate;
  const totalInterest = dailyInterest * term;
  const totalRepayment = amount + totalInterest;
  const interestFreeDays = INTEREST_FREE_DAYS;
  const actualInterestDays = Math.max(0, term - interestFreeDays);
  const actualInterest = amount * interestRate * actualInterestDays;
  
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-[#F0B90B]" />
        <span className="text-xs font-medium text-[#EAECEF]">Loan Summary</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#848E9C]">Principal Amount</span>
          <span className="font-mono text-[#EAECEF]">{amount.toLocaleString()} USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#848E9C]">Daily Interest</span>
          <span className="font-mono text-[#EAECEF]">{dailyInterest.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#848E9C]">Interest-Free Days</span>
          <span className="font-mono text-[#F0B90B]">{interestFreeDays} day</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#848E9C]">Total Interest ({term} days)</span>
          <span className="font-mono text-[#EAECEF]">{actualInterest.toFixed(2)} USDT</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-[#2B3139]">
          <span className="text-[#EAECEF] font-medium">Total Repayment</span>
          <span className="font-mono text-[#F0B90B] font-bold">
            {(amount + actualInterest).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-[#2B3139]">
        <div className="flex items-start gap-2">
          <Info className="w-3 h-3 text-[#848E9C] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#5E6673]">
            APR: {(interestRate * 365 * 100).toFixed(1)}%. No interest charged within 24 hours of disbursement.
          </p>
        </div>
      </div>
    </Card>
  );
};

// Loan History Card Component
const LoanHistoryCard = ({ loan }: { loan: typeof mockLoanHistory[0] }) => {
  const progress = loan.status === 'active' 
    ? ((loan.repaid / loan.amount) * 100) 
    : 100;
  
  return (
    <Card className="bg-[#1E2329] border border-[#2B3139] p-4 hover:border-[#F0B90B]/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            loan.status === 'active' ? 'bg-green-500/20' :
            loan.status === 'completed' ? 'bg-blue-500/20' :
            'bg-yellow-500/20'
          }`}>
            {loan.status === 'active' && <RefreshCw className="w-4 h-4 text-green-400" />}
            {loan.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            {loan.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
          </div>
          <div>
            <div className="text-sm font-medium text-[#EAECEF]">Loan #{loan.id}</div>
            <div className="text-xs text-[#848E9C]">{loan.date}</div>
          </div>
        </div>
        <Badge className={
          loan.status === 'active' ? 'bg-green-500/20 text-green-400' :
          loan.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
          'bg-yellow-500/20 text-yellow-400'
        }>
          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-[#848E9C]">Amount</div>
          <div className="text-sm font-mono text-[#EAECEF]">{loan.amount.toLocaleString()} USDT</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Term</div>
          <div className="text-sm font-mono text-[#EAECEF]">{loan.term} days</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Due Date</div>
          <div className="text-sm font-mono text-[#EAECEF]">{loan.dueDate}</div>
        </div>
        <div>
          <div className="text-xs text-[#848E9C]">Interest</div>
          <div className="text-sm font-mono text-[#EAECEF]">{loan.interest.toLocaleString()} USDT</div>
        </div>
      </div>
      
      {loan.status === 'active' && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[#848E9C]">Repayment Progress</span>
            <span className="text-[#EAECEF]">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-[#2B3139]" />
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#848E9C]">Repaid</span>
            <span className="text-[#EAECEF]">{loan.repaid.toLocaleString()} / {loan.amount.toLocaleString()} USDT</span>
          </div>
        </div>
      )}
      
      {loan.status === 'active' && (
        <div className="flex gap-2 mt-3 pt-2 border-t border-[#2B3139]">
          <Button size="sm" className="flex-1 bg-[#F0B90B] text-[#181A20] hover:bg-yellow-400 text-xs h-8">
            Repay Now
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-[#2B3139] text-[#EAECEF] text-xs h-8">
            View Details
          </Button>
        </div>
      )}
    </Card>
  );
};

// KYC Verification Banner
const KycBanner = ({ onVerify }: { onVerify: () => void }) => (
  <Card className="bg-gradient-to-r from-[#1E2329] to-[#2B3139] border border-yellow-500/30 p-6 mb-6">
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
        <Shield className="w-6 h-6 text-yellow-400" />
      </div>
      <div className="flex-1 text-center md:text-left">
        <h3 className="text-lg font-semibold text-[#EAECEF] mb-1">Identity Verification Required</h3>
        <p className="text-sm text-[#848E9C]">
          Complete KYC verification to unlock loans up to {LOAN_LIMIT.toLocaleString()} USDT with competitive rates.
        </p>
      </div>
      <Button 
        className="bg-yellow-500 hover:bg-yellow-600 text-[#181A20] font-bold px-6"
        onClick={onVerify}
      >
        Verify Now
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  </Card>
);

export default function LoanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('apply');
  const [loanTerm, setLoanTerm] = useState(10);
  const [amount, setAmount] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(loanTerms[1]);
  
  // Simulate KYC status - replace with actual from context
  const isKycVerified = user?.kycStatus === 'Verified' || false;
  
  // Mock loan statistics
  const loanStats = {
    totalBorrowed: 175000,
    activeLoans: 2,
    totalInterest: 12000,
    nextPayment: '2024-03-25',
    creditScore: 750,
    utilization: (175000 / LOAN_LIMIT) * 100
  };

  // Update selected term when loanTerm changes
  useEffect(() => {
    const term = loanTerms.find(t => t.days === loanTerm) || loanTerms[1];
    setSelectedTerm(term);
  }, [loanTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitting(false);
    // Show success message or redirect
    setActiveTab('history');
  };

  const handleVerify = () => navigate('/kyc-verification');

  // Calculate interest
  const selectedTermData = loanTerms.find(t => t.days === loanTerm) || loanTerms[1];
  const dailyInterestRate = DAILY_INTEREST_RATE * (selectedTermData.interest / 0.3); // Scale based on term
  const totalInterest = amount * dailyInterestRate * loanTerm;
  const interestFreeDays = INTEREST_FREE_DAYS;
  const actualInterestDays = Math.max(0, loanTerm - interestFreeDays);
  const actualInterest = amount * dailyInterestRate * actualInterestDays;
  const totalRepayment = amount + actualInterest;

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#848E9C]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
                <Coins className="w-5 h-5 text-[#F0B90B]" />
              </div>
              <h1 className="text-lg font-bold text-[#EAECEF]">Crypto Loans</h1>
            </div>
          </div>
          
          <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
            <CreditCard className="w-3 h-3 mr-1" />
            Up to {LOAN_LIMIT.toLocaleString()} USDT
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* KYC Banner */}
        {!isKycVerified && <KycBanner onVerify={handleVerify} />}
        
        {/* Loan Stats Card - Only for verified users */}
        {isKycVerified && (
          <Card className="bg-gradient-to-br from-[#1E2329] to-[#2B3139] border-0 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-[#F0B90B]" />
                </div>
                <div>
                  <div className="text-xs text-[#848E9C]">Available Credit</div>
                  <div className="text-2xl md:text-3xl font-bold text-[#EAECEF] font-mono">
                    {(LOAN_LIMIT - loanStats.totalBorrowed).toLocaleString()} USDT
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  className="flex-1 md:flex-none bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
                  onClick={() => setActiveTab('apply')}
                >
                  Apply Now
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none border-[#2B3139] text-[#EAECEF]"
                  onClick={() => setActiveTab('history')}
                >
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#2B3139]">
              <div>
                <div className="text-xs text-[#848E9C]">Loan Limit</div>
                <div className="text-sm font-mono text-[#EAECEF]">{LOAN_LIMIT.toLocaleString()} USDT</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Borrowed</div>
                <div className="text-sm font-mono text-[#EAECEF]">{loanStats.totalBorrowed.toLocaleString()} USDT</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Active Loans</div>
                <div className="text-sm font-mono text-[#EAECEF]}">{loanStats.activeLoans}</div>
              </div>
              <div>
                <div className="text-xs text-[#848E9C]">Credit Score</div>
                <div className="text-sm font-mono text-[#EAECEF]">{loanStats.creditScore}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#848E9C]">Credit Utilization</span>
                <span className="text-[#EAECEF]">{loanStats.utilization.toFixed(1)}%</span>
              </div>
              <Progress value={loanStats.utilization} className="h-1.5 bg-[#2B3139]" />
            </div>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-[#1E2329] p-1 rounded-xl mb-6">
            <TabsTrigger 
              value="apply" 
              className="text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              disabled={!isKycVerified}
            >
              Apply for Loan
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="text-sm data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              disabled={!isKycVerified}
            >
              Loan History
            </TabsTrigger>
          </TabsList>

          {/* Apply for Loan Tab */}
          <TabsContent value="apply" className="mt-0">
            <Card className="bg-[#1E2329] border border-[#2B3139] p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Loan Term Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-[#EAECEF]">
                      Loan Term
                    </Label>
                    <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
                      <Calendar className="w-3 h-3 mr-1" />
                      Interest-free first day
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {loanTerms.map(term => (
                      <Button
                        key={term.days}
                        type="button"
                        variant={loanTerm === term.days ? 'default' : 'outline'}
                        className={`
                          relative flex flex-col items-center py-3 h-auto
                          ${loanTerm === term.days 
                            ? 'bg-[#F0B90B] text-[#181A20] border-[#F0B90B]' 
                            : 'border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]/50'
                          }
                        `}
                        onClick={() => setLoanTerm(term.days)}
                      >
                        <span className="text-sm font-bold">{term.label}</span>
                        <span className={`text-xs ${loanTerm === term.days ? 'text-[#181A20]/70' : 'text-[#848E9C]'}`}>
                          {term.interest}% daily
                        </span>
                        {term.popular && (
                          <Badge className="absolute -top-2 -right-2 bg-[#F0B90B] text-[#181A20] text-[8px] px-1 py-0.5">
                            Popular
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Loan Amount Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-[#EAECEF]">
                      Loan Amount
                    </Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-[#F0B90B]" />
                      <span className="text-sm font-mono text-[#EAECEF]">
                        {amount.toLocaleString()} USDT
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <input
                      type="range"
                      min={MIN_LOAN_AMOUNT}
                      max={LOAN_LIMIT - loanStats.totalBorrowed}
                      step={1000}
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full h-2 bg-[#2B3139] rounded-lg appearance-none cursor-pointer accent-[#F0B90B]"
                      disabled={!isKycVerified}
                    />
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-[#848E9C]">Min: {MIN_LOAN_AMOUNT.toLocaleString()} USDT</span>
                      <span className="text-[#848E9C]">Max: {(LOAN_LIMIT - loanStats.totalBorrowed).toLocaleString()} USDT</span>
                    </div>
                    
                    {/* Quick Amount Selectors */}
                    <div className="flex gap-2">
                      {[50000, 100000, 250000, 500000].map(quickAmount => (
                        quickAmount <= (LOAN_LIMIT - loanStats.totalBorrowed) && (
                          <Button
                            key={quickAmount}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B] text-xs h-8"
                            onClick={() => setAmount(quickAmount)}
                          >
                            {quickAmount.toLocaleString()}
                          </Button>
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loan Calculator Toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full border border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] h-11"
                  onClick={() => setShowCalculator(!showCalculator)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {showCalculator ? 'Hide' : 'Show'} Loan Summary
                  <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showCalculator ? 'rotate-90' : ''}`} />
                </Button>

                {/* Loan Calculator */}
                {showCalculator && (
                  <LoanCalculator
                    amount={amount}
                    term={loanTerm}
                    interestRate={dailyInterestRate}
                  />
                )}

                {/* Terms & Conditions */}
                <div className="bg-[#2B3139]/30 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-[#F0B90B] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-[#848E9C]">
                        By submitting this loan application, you agree to our{' '}
                        <a href="/loan-terms" className="text-[#F0B90B] hover:underline">
                          Loan Terms & Conditions
                        </a>
                        . Late payments may incur additional fees and affect your credit score.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12 text-base"
                    disabled={submitting || !isKycVerified}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Apply for Loan
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-[#2B3139] text-[#EAECEF] hover:bg-[#23262F] h-12 text-base"
                    onClick={() => navigate('/contact')}
                  >
                    <PhoneCall className="w-5 h-5 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>

          {/* Loan History Tab */}
          <TabsContent value="history" className="mt-0">
            <div className="space-y-4">
              {mockLoanHistory.length === 0 ? (
                <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center">
                    <History className="w-8 h-8 text-[#5E6673]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#EAECEF] mb-2">No Loan History</h3>
                  <p className="text-sm text-[#848E9C] mb-4">
                    You haven't taken any loans yet. Apply for your first loan to get started.
                  </p>
                  <Button 
                    className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold"
                    onClick={() => setActiveTab('apply')}
                  >
                    Apply for Loan
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Card>
              ) : (
                mockLoanHistory.map(loan => (
                  <LoanHistoryCard key={loan.id} loan={loan} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        {isKycVerified && (
          <Card className="bg-[#1E2329] border border-[#2B3139] p-5 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#F0B90B]" />
              <h3 className="text-sm font-semibold text-[#EAECEF]">Frequently Asked Questions</h3>
            </div>
            
            <div className="space-y-3">
              {faqItems.map((faq, index) => (
                <div key={index} className="border-b border-[#2B3139] last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#F0B90B]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] text-[#F0B90B] font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-[#EAECEF] mb-1">{faq.question}</h4>
                      <p className="text-xs text-[#848E9C]">{faq.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Risk Disclaimer */}
        <div className="mt-6 p-4 bg-[#1E2329] border border-[#2B3139] rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#848E9C] shrink-0 mt-0.5" />
            <p className="text-xs text-[#5E6673] leading-relaxed">
              Borrowing involves risk. Loan amounts and interest rates are subject to change based on market conditions and creditworthiness. 
              Late payments may incur additional fees and negatively impact your credit score. Always borrow responsibly and ensure you understand the terms before proceeding.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input[type=range] {
            font-size: 16px;
          }
        }
      `}</style>
    </motion.div>
  );
}