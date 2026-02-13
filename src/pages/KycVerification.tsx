import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Camera, 
  FileText, 
  UserCheck, 
  Home, 
  Briefcase, 
  CreditCard,
  Fingerprint,
  Mail,
  MapPin,
  DollarSign,
  Building,
  Calendar,
  Phone,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Info,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';

// Step configuration
const steps = [
  {
    id: 0,
    title: 'Email & Consent',
    icon: Mail,
    description: 'Verify your email and accept terms'
  },
  {
    id: 1,
    title: 'Residence',
    icon: Home,
    description: 'Confirm your residential address'
  },
  {
    id: 2,
    title: 'Employment & Income',
    icon: Briefcase,
    description: 'Provide employment and income details'
  },
  {
    id: 3,
    title: 'ID Verification',
    icon: Fingerprint,
    description: 'Upload government ID and selfie'
  },
  {
    id: 4,
    title: 'First Transfer',
    icon: CreditCard,
    description: 'Verify account ownership'
  },
  {
    id: 5,
    title: 'E-Signature',
    icon: FileText,
    description: 'Sign terms and conditions'
  },
  {
    id: 6,
    title: 'Completed',
    icon: CheckCircle2,
    description: 'Verification complete'
  }
];

// Country options
const countries = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japan' },
  { value: 'SG', label: 'Singapore' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'NL', label: 'Netherlands' },
];

// Employment options
const employmentStatuses = [
  { value: 'employed', label: 'Employed (Full-time)' },
  { value: 'employed_part', label: 'Employed (Part-time)' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'student', label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'other', label: 'Other' }
];

// Income ranges
const incomeRanges = [
  { value: '0-20000', label: '$0 - $20,000' },
  { value: '20001-50000', label: '$20,001 - $50,000' },
  { value: '50001-100000', label: '$50,001 - $100,000' },
  { value: '100001-250000', label: '$100,001 - $250,000' },
  { value: '250001-500000', label: '$250,001 - $500,000' },
  { value: '500001+', label: '$500,001+' }
];

// Document types
const documentTypes = [
  { value: 'passport', label: 'International Passport', icon: FileText },
  { value: 'id_card', label: 'National ID Card', icon: FileText },
  { value: 'drivers_license', label: "Driver's License", icon: FileText },
  { value: 'residence_permit', label: 'Residence Permit', icon: FileText }
];

// Step Component
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#EAECEF]">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-xs text-[#848E9C]">
          {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
        </span>
      </div>
      <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2 bg-[#2B3139]" />
      
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between mt-6">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-green-500/20 text-green-400' :
                  isCurrent ? 'bg-[#F0B90B] text-[#181A20] ring-4 ring-[#F0B90B]/20' :
                  'bg-[#2B3139] text-[#848E9C]'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                isCurrent ? 'text-[#F0B90B]' :
                isCompleted ? 'text-green-400' :
                'text-[#848E9C]'
              }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Stepper */}
      <div className="md:hidden mt-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[#F0B90B] text-[#181A20]`}>
            {steps[currentStep].icon && (
              (() => {
                const Icon = steps[currentStep].icon;
                return <Icon size={16} />;
              })()
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-[#EAECEF]">{steps[currentStep].title}</div>
            <div className="text-xs text-[#848E9C]">{steps[currentStep].description}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ 
  label, 
  accept, 
  onChange, 
  value, 
  type 
}: { 
  label: string; 
  accept: string; 
  onChange: (file: File | null) => void; 
  value: File | null;
  type: 'document' | 'selfie' | 'video';
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
    
    if (file && (type === 'document' || type === 'selfie')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  return (
    <div className="space-y-2">
      <Label className="text-xs text-[#848E9C]">{label}</Label>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${
          value ? 'border-[#F0B90B] bg-[#F0B90B]/5' : 'border-[#2B3139] hover:border-[#F0B90B]/50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              value ? 'bg-[#F0B90B]/20' : 'bg-[#2B3139]'
            }`}>
              {type === 'document' && <FileText size={20} className={value ? 'text-[#F0B90B]' : 'text-[#848E9C]'} />}
              {type === 'selfie' && <Camera size={20} className={value ? 'text-[#F0B90B]' : 'text-[#848E9C]'} />}
              {type === 'video' && <Upload size={20} className={value ? 'text-[#F0B90B]' : 'text-[#848E9C]'} />}
            </div>
            <div className="flex-1">
              {value ? (
                <div className="text-sm text-[#EAECEF]">{value.name}</div>
              ) : (
                <>
                  <div className="text-sm text-[#EAECEF]">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-xs text-[#848E9C] mt-1">
                    {accept.split(',').join(', ')} • Max 10MB
                  </div>
                </>
              )}
            </div>
            {value && (
              <div className="text-[#F0B90B]">
                <CheckCircle2 size={20} />
              </div>
            )}
          </div>
          {preview && type === 'selfie' && (
            <div className="mt-3">
              <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Screen Component
const StatusScreen = ({ 
  status, 
  onDashboard 
}: { 
  status: 'under_review' | 'approved'; 
  onDashboard: () => void;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-[#181A20] flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-lg bg-[#1E2329] border border-[#2B3139] p-8 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F0B90B]/20 to-yellow-500/20 blur-3xl rounded-full" />
          <div className={`relative w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            status === 'approved' ? 'bg-green-500/20' : 'bg-yellow-500/20'
          }`}>
            {status === 'approved' ? (
              <CheckCircle2 size={40} className="text-green-400" />
            ) : (
              <Clock size={40} className="text-yellow-400" />
            )}
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">
          {status === 'approved' ? 'KYC Verification Approved!' : 'KYC Under Review'}
        </h2>
        
        <p className="text-[#848E9C] mb-6">
          {status === 'approved' 
            ? 'Your identity has been verified successfully. You now have full access to all platform features.'
            : 'Thank you for completing the verification process. Our team will review your documents within 1-2 business days. You will receive an email notification once approved.'}
        </p>
        
        {status === 'under_review' && (
          <div className="bg-[#2B3139]/50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-[#F0B90B] mt-0.5 shrink-0" />
              <div className="text-xs text-[#848E9C]">
                <span className="font-medium text-[#EAECEF]">What happens next?</span>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Document verification (10-30 minutes)</li>
                  <li>Background check (1-2 hours)</li>
                  <li>Final approval notification via email</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12"
          onClick={onDashboard}
        >
          Go to Dashboard
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </Card>
    </motion.div>
  );
};

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
    <div className="text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-[#F0B90B] blur-3xl opacity-20 rounded-full animate-pulse" />
        <Loader2 size={48} className="relative text-[#F0B90B] animate-spin mx-auto mb-4" />
      </div>
      <p className="text-[#848E9C] text-sm">Loading your verification progress...</p>
    </div>
  </div>
);

export default function KycVerification() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    email: '',
    consent: false,
    country: '',
    address: '',
    addressLine2: '',
    city: '',
    postal: '',
    state: '',
    taxId: '',
    employment: '',
    employmentOther: '',
    income: '',
    sourceOfFunds: '',
    docType: '',
    docFile: null as File | null,
    selfie: null as File | null,
    selfieVideo: null as File | null,
    transferConfirmed: false,
    smsCode: '',
    signed: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [kycStatus, setKycStatus] = useState<'incomplete' | 'under_review' | 'approved'>('incomplete');
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  
  const navigate = useNavigate();

  // Fetch progress on mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Simulate API call - replace with actual
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
      } catch (err) {
        setError('Failed to load KYC progress.');
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, []);

  // Timer for ID verification step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Save progress
  const saveStep = async (data: Partial<typeof form>, nextStep?: number) => {
    setForm(prev => ({ ...prev, ...data }));
    setSaving(true);
    setError('');
    
    try {
      // Simulate API call - replace with actual
      await new Promise(resolve => setTimeout(resolve, 500));
      if (nextStep !== undefined) setStep(nextStep);
    } catch (err) {
      setError('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // File upload
  const uploadFile = async (file: File, type: 'doc' | 'selfie' | 'video') => {
    setSaving(true);
    try {
      // Simulate upload - replace with actual
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('File upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Final submission
  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Simulate submission - replace with actual
      await new Promise(resolve => setTimeout(resolve, 1500));
      setKycStatus('under_review');
      setStep(6);
    } catch (err) {
      setError('Failed to submit KYC. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Format timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingScreen />;
  if (kycStatus === 'under_review') return <StatusScreen status="under_review" onDashboard={() => navigate('/dashboard')} />;
  if (kycStatus === 'approved') return <StatusScreen status="approved" onDashboard={() => navigate('/dashboard')} />;

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-[#848E9C]" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#EAECEF]">Identity Verification</h1>
            <p className="text-xs text-[#848E9C]">Complete all steps to unlock full platform access</p>
          </div>
          <Badge className="ml-auto bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
            <Lock size={12} className="mr-1" />
            Secure Process
          </Badge>
        </div>
        
        {/* Main Card */}
        <Card className="bg-[#1E2329] border border-[#2B3139] p-6 md:p-8">
          
          {/* Step Indicator */}
          <StepIndicator currentStep={step} />
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-400">{error}</div>
            </div>
          )}
          
          {/* Step 0: Email & Consent */}
          {step === 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">Email Verification</h2>
                <p className="text-xs text-[#848E9C]">We'll use this email for all verification communications</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-xs text-[#848E9C]">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#848E9C]" size={16} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={form.email}
                      onChange={(e) => saveStep({ email: e.target.value })}
                      className="pl-10 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                    />
                  </div>
                </div>
                
                <div className="bg-[#2B3139]/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#F0B90B]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield size={14} className="text-[#F0B90B]" />
                    </div>
                    <div className="text-xs text-[#848E9C]">
                      By proceeding, you agree to our{' '}
                      <a href="/terms" className="text-[#F0B90B] hover:underline">Terms of Service</a> and{' '}
                      <a href="/privacy" className="text-[#F0B90B] hover:underline">Privacy Policy</a>. 
                      Your information is encrypted and securely stored.
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="consent"
                    checked={form.consent}
                    onCheckedChange={(checked) => saveStep({ consent: checked as boolean })}
                    className="border-[#2B3139] data-[state=checked]:bg-[#F0B90B] data-[state=checked]:border-[#F0B90B]"
                  />
                  <Label htmlFor="consent" className="text-sm text-[#EAECEF]">
                    I agree to the Terms & Conditions
                  </Label>
                </div>
              </div>
              
              <Button
                className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                disabled={!form.email || !form.consent || saving}
                onClick={() => saveStep({}, 1)}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Continue
                    <ChevronRight size={16} />
                  </div>
                )}
              </Button>
            </motion.div>
          )}
          
          {/* Step 1: Residence Info */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">Residence Information</h2>
                <p className="text-xs text-[#848E9C]">Verify your current residential address</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Country of Residence</Label>
                  <Select 
                    value={form.country} 
                    onValueChange={(v) => saveStep({ country: v })}
                  >
                    <SelectTrigger className="w-full mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(country => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-[#848E9C]">Street Address</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => saveStep({ address: e.target.value })}
                    placeholder="Street address"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                  />
                </div>
                
                <div>
                  <Label className="text-xs text-[#848E9C]">Apt, Suite, etc. (Optional)</Label>
                  <Input
                    value={form.addressLine2}
                    onChange={(e) => saveStep({ addressLine2: e.target.value })}
                    placeholder="Apt, suite, unit"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#848E9C]">City</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => saveStep({ city: e.target.value })}
                      placeholder="City"
                      className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#848E9C]">Postal Code</Label>
                    <Input
                      value={form.postal}
                      onChange={(e) => saveStep({ postal: e.target.value })}
                      placeholder="Postal code"
                      className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-[#848E9C]">State / Province</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => saveStep({ state: e.target.value })}
                    placeholder="State or province"
                    className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                  />
                </div>
                
                {form.country === 'DE' && (
                  <div>
                    <Label className="text-xs text-[#848E9C]">Tax ID (Steuernummer)</Label>
                    <Input
                      value={form.taxId}
                      onChange={(e) => saveStep({ taxId: e.target.value })}
                      placeholder="Tax ID (optional for Germany)"
                      className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                    />
                    <p className="text-[10px] text-[#5E6673] mt-1">
                      Providing your tax ID helps expedite the verification process
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2B3139] text-[#EAECEF] h-11"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                  disabled={!form.country || !form.address || !form.city || !form.postal || !form.state || saving}
                  onClick={() => saveStep({}, 2)}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 2: Employment & Income */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">Employment & Income</h2>
                <p className="text-xs text-[#848E9C]">This information helps us comply with financial regulations</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-[#848E9C]">Employment Status</Label>
                  <Select 
                    value={form.employment} 
                    onValueChange={(v) => saveStep({ employment: v })}
                  >
                    <SelectTrigger className="w-full mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentStatuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {form.employment === 'other' && (
                  <div>
                    <Label className="text-xs text-[#848E9C]">Please specify</Label>
                    <Input
                      value={form.employmentOther}
                      onChange={(e) => saveStep({ employmentOther: e.target.value })}
                      placeholder="Employment status"
                      className="mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-xs text-[#848E9C]">Annual Income Range</Label>
                  <Select 
                    value={form.income} 
                    onValueChange={(v) => saveStep({ income: v })}
                  >
                    <SelectTrigger className="w-full mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                      <SelectValue placeholder="Select income range" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs text-[#848E9C]">Source of Funds</Label>
                  <Select 
                    value={form.sourceOfFunds} 
                    onValueChange={(v) => saveStep({ sourceOfFunds: v })}
                  >
                    <SelectTrigger className="w-full mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                      <SelectValue placeholder="Select primary source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Employment Salary</SelectItem>
                      <SelectItem value="business">Business Income</SelectItem>
                      <SelectItem value="investments">Investment Returns</SelectItem>
                      <SelectItem value="savings">Personal Savings</SelectItem>
                      <SelectItem value="inheritance">Inheritance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2B3139] text-[#EAECEF] h-11"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                  disabled={!form.employment || !form.income || !form.sourceOfFunds || saving}
                  onClick={() => saveStep({}, 3)}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Continue'}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 3: ID Verification */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">Identity Verification</h2>
                  <Badge className={timer < 120 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    <Clock size={12} className="mr-1" />
                    {formatTime(timer)} remaining
                  </Badge>
                </div>
                <p className="text-xs text-[#848E9C]">Upload a government-issued ID and take a selfie</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <Label className="text-xs text-[#848E9C]">Document Type</Label>
                  <Select 
                    value={form.docType} 
                    onValueChange={(v) => saveStep({ docType: v })}
                  >
                    <SelectTrigger className="w-full mt-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <FileUpload
                  label="Front of ID Document"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(file) => saveStep({ docFile: file })}
                  value={form.docFile}
                  type="document"
                />
                
                <FileUpload
                  label="Selfie Photo"
                  accept=".jpg,.jpeg,.png"
                  onChange={(file) => saveStep({ selfie: file })}
                  value={form.selfie}
                  type="selfie"
                />
                
                <FileUpload
                  label="Selfie Video (Optional)"
                  accept=".mp4,.mov"
                  onChange={(file) => saveStep({ selfieVideo: file })}
                  value={form.selfieVideo}
                  type="video"
                />
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-400">
                      <span className="font-semibold">Verification tips:</span>
                      <ul className="list-disc list-inside mt-1 text-blue-400/90">
                        <li>Ensure all four corners of the document are visible</li>
                        <li>Text should be clear and readable</li>
                        <li>No glare or reflections</li>
                        <li>Selfie should be well-lit and facing forward</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2B3139] text-[#EAECEF] h-11"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                  disabled={!form.docType || !form.docFile || !form.selfie || saving}
                  onClick={() => saveStep({}, 4)}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Submit Documents'}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 4: First Transfer */}
          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">First Fund Transfer</h2>
                <p className="text-xs text-[#848E9C]">Verify account ownership with a small transfer</p>
              </div>
              
              <div className="bg-[#2B3139]/30 rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#F0B90B]/20 flex items-center justify-center">
                    <CreditCard size={24} className="text-[#F0B90B]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#EAECEF]">Bank Transfer Instructions</div>
                    <div className="text-xs text-[#848E9C]">SWAN IRA • Account #12345678</div>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Amount</span>
                    <span className="font-mono text-[#EAECEF] font-bold">€1.00 EUR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Reference</span>
                    <span className="font-mono text-[#EAECEF]">KYC-{Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">IBAN</span>
                    <span className="font-mono text-[#EAECEF]">DE89 3704 0044 0532 0130 00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">BIC/SWIFT</span>
                    <span className="font-mono text-[#EAECEF]">COBADEFFXXX</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#2B3139]">
                  <p className="text-xs text-[#848E9C]">
                    Please transfer exactly €1.00 from a bank account in your name. 
                    The transfer will be credited within 1-2 business days.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2B3139] text-[#EAECEF] h-11"
                  onClick={() => setStep(3)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                  disabled={saving}
                  onClick={() => saveStep({ transferConfirmed: true }, 5)}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'I Completed the Transfer'}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 5: Electronic Signature */}
          {step === 5 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-[#EAECEF] mb-1">Electronic Signature</h2>
                <p className="text-xs text-[#848E9C]">Sign the client agreement to complete verification</p>
              </div>
              
              <div className="bg-[#2B3139]/30 rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#F0B90B]/10 flex items-center justify-center">
                    <Phone size={16} className="text-[#F0B90B]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#EAECEF]">SMS Verification</div>
                    <div className="text-xs text-[#848E9C]">Enter the 6-digit code sent to +49 •••• •••• 1234</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-[#848E9C]">Verification Code</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={form.smsCode}
                      onChange={(e) => saveStep({ smsCode: e.target.value })}
                      placeholder="000000"
                      className="flex-1 bg-[#181A20] border-[#2B3139] text-[#EAECEF] h-11 text-center font-mono text-lg tracking-widest"
                      maxLength={6}
                    />
                    <Button 
                      variant="outline" 
                      className="border-[#2B3139] text-[#EAECEF] h-11"
                    >
                      Resend
                    </Button>
                  </div>
                </div>
                
                <div className="bg-[#181A20] rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <FileText size={16} className="text-[#F0B90B] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#EAECEF]">
                      <span className="font-semibold">Client Agreement v2.4</span>
                      <p className="text-[#848E9C] mt-1">
                        By entering the verification code, you agree to the terms and conditions of Swan IRA's 
                        Crypto Retirement Account, including fee schedule, custody arrangements, and risk disclosures.
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="text-[#F0B90B] text-xs p-0 h-auto"
                    onClick={() => window.open('/terms', '_blank')}
                  >
                    Read Full Agreement
                    <ChevronRight size={12} className="ml-1" />
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-[#2B3139] text-[#EAECEF] h-11"
                  onClick={() => setStep(4)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                  disabled={!form.smsCode || form.smsCode.length < 6 || saving}
                  onClick={handleSubmit}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </div>
                  ) : (
                    'Sign & Submit'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* Step 6: Completed */}
          {step === 6 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F0B90B]/20 to-yellow-500/20 blur-3xl rounded-full" />
                <div className="relative w-20 h-20 mx-auto bg-gradient-to-r from-[#F0B90B] to-yellow-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-[#181A20]" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-[#EAECEF] mb-2">KYC Submitted!</h2>
              <p className="text-[#848E9C] mb-6">
                Thank you for completing the verification process. Our team will review your information within 1-2 business days.
              </p>
              
              <Button 
                className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-11"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
                <ChevronRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          )}
        </Card>
        
        {/* Security Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-[10px] text-[#5E6673]">
            <span>🔒 256-bit SSL Encryption</span>
            <span>✓ GDPR Compliant</span>
            <span>🏦 SOC2 Type II</span>
          </div>
          <p className="text-[10px] text-[#5E6673] mt-2">
            Your personal information is protected by bank-grade security measures.
            We never share your data without explicit consent.
          </p>
        </div>
      </div>
    </motion.div>
  );
}