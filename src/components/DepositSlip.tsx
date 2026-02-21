import React, { useRef, useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Download, 
  Printer, 
  Calendar, 
  DollarSign, 
  Hash, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft,
  Copy,
  Check,
  Shield,
  Globe,
  Zap,
  Award,
  TrendingUp,
  Wallet,
  Lock,
  Sparkles,
  QrCode,
  Share2,
  Mail,
  MessageSquare
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';

// Binance Color Palette
const COLORS = {
  binance: {
    yellow: '#F0B90B',
    yellowDark: '#DBA40A',
    yellowLight: '#FCD535',
    black: '#0B0E11',
    dark: '#1E2329',
    card: '#2B3139',
    cardHover: '#373B42',
    border: '#3A3F4A',
  },
  text: {
    primary: '#EAECEF',
    secondary: '#B7BDC6',
    tertiary: '#848E9C',
    disabled: '#5E6673',
  },
  green: {
    primary: '#0ECB81',
    dark: '#0FB37E',
    bg: 'rgba(14, 203, 129, 0.1)',
  },
  red: {
    primary: '#F6465D',
    dark: '#D63F53',
    bg: 'rgba(246, 70, 93, 0.1)',
  },
  blue: {
    primary: '#5096FF',
    dark: '#4785E6',
    bg: 'rgba(80, 150, 255, 0.1)',
  },
  purple: {
    primary: '#A66AE6',
    dark: '#955FD1',
    bg: 'rgba(166, 106, 230, 0.1)',
  },
};

interface TransactionSlipData {
  transactionId: string;
  date: string;
  time?: string;
  asset: string;
  status: 'Completed' | 'Pending' | 'Processing' | 'Failed';
  amount: number;
  amountUsd?: number;
  userName?: string;
  userEmail?: string;
  userId?: string;
  network?: string;
  address?: string;
  type: 'deposit' | 'withdrawal';
  fee?: number;
  confirmations?: number;
  txHash?: string;
  blockNumber?: number;
  timestamp?: number;
  memo?: string;
  reference?: string;
  category?: 'spot' | 'futures' | 'options' | 'staking' | 'arbitrage';
  profit?: number;
  roi?: number;
}

interface TransactionSlipProps {
  data: TransactionSlipData;
  onClose?: () => void;
  showCloseButton?: boolean;
  theme?: 'light' | 'dark';
}

const TransactionSlip: React.FC<TransactionSlipProps> = ({ 
  data, 
  onClose, 
  showCloseButton = true,
  theme = 'dark'
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(value);
  };

  const handlePrint = () => {
    if (slipRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>KRYVEX Transaction Slip - ${data.transactionId}</title>
              <style>
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: white; }
                @media print {
                  body { margin: 0; padding: 0; }
                }
              </style>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            </head>
            <body>
              ${slipRef.current.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        backgroundColor: theme === 'dark' ? '#0B0E11' : '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `KRYVEX-${data.type}-${data.transactionId}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `KRYVEX ${data.type} Slip`,
          text: `Transaction ${data.transactionId} - ${data.amount} ${data.asset}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-[#0ECB81]/20 text-[#0ECB81] border-[#0ECB81]/30';
      case 'Processing':
        return 'bg-[#F0B90B]/20 text-[#F0B90B] border-[#F0B90B]/30';
      case 'Pending':
        return 'bg-[#5096FF]/20 text-[#5096FF] border-[#5096FF]/30';
      case 'Failed':
        return 'bg-[#F6465D]/20 text-[#F6465D] border-[#F6465D]/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = () => {
    return data.type === 'deposit' ? ArrowDownLeft : ArrowUpRight;
  };

  const TypeIcon = getTypeIcon();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0B0E11]' : 'bg-gray-50'} flex items-center justify-center p-4`}>
      <motion.div 
        className="w-full max-w-3xl"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Premium Action Buttons */}
        <div className="mb-6 flex flex-wrap justify-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2B3139] to-[#1E2329] text-[#EAECEF] rounded-xl border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Print
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/90 text-[#0B0E11] rounded-xl hover:from-[#F0B90B] hover:to-[#F0B90B] transition-all shadow-lg shadow-[#F0B90B]/20 font-medium"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'PDF'}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2B3139] to-[#1E2329] text-[#EAECEF] rounded-xl border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all shadow-lg"
          >
            <QrCode className="w-4 h-4" />
            QR
          </motion.button>

          {navigator.share && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2B3139] to-[#1E2329] text-[#EAECEF] rounded-xl border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all shadow-lg"
            >
              <Share2 className="w-4 h-4" />
              Share
            </motion.button>
          )}

          {showCloseButton && onClose && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#2B3139] to-[#1E2329] text-[#EAECEF] rounded-xl border border-[#3A3F4A] hover:border-[#F6465D]/50 transition-all shadow-lg"
            >
              Close
            </motion.button>
          )}
        </div>

        {/* Transaction Slip */}
        <motion.div
          ref={slipRef}
          className={`relative rounded-2xl shadow-2xl overflow-hidden border ${
            theme === 'dark' ? 'bg-[#1E2329] border-[#2B3139]' : 'bg-white border-gray-200'
          }`}
          style={{ minHeight: '650px' }}
          variants={fadeInUp}
        >
          {/* Premium Header with Gradient */}
          <div className={`relative overflow-hidden ${
            data.type === 'deposit' 
              ? 'bg-gradient-to-r from-[#0ECB81] to-[#0FB37E]' 
              : 'bg-gradient-to-r from-[#F0B90B] to-[#DBA40A]'
          }`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative px-8 py-8 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex justify-center mb-4"
              >
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                  <TypeIcon className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight"
              >
                {data.type === 'deposit' ? 'DEPOSIT CONFIRMED' : 'WITHDRAWAL PROCESSED'}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white/80 text-sm"
              >
                kryvextrading.com • {new Date().toLocaleDateString()}
              </motion.p>

              {/* Kryvex Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/30"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-xs font-medium">KRYVEX TRADING</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* QR Code Section (if enabled) */}
          {showQR && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 pt-6"
            >
              <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-[#2B3139]' : 'bg-gray-100'} flex flex-col items-center justify-center`}>
                <QRCodeCanvas
                  value={JSON.stringify({
                    id: data.transactionId,
                    type: data.type,
                    amount: data.amount,
                    asset: data.asset,
                    date: data.date
                  })}
                  size={150}
                  bgColor={theme === 'dark' ? '#2B3139' : '#ffffff'}
                  fgColor={theme === 'dark' ? '#EAECEF' : '#000000'}
                  level="H"
                  includeMargin={false}
                />
                <p className="text-xs text-[#848E9C] mt-2">Scan to verify transaction</p>
              </div>
            </motion.div>
          )}

          {/* Content */}
          <div className={`p-8 ${theme === 'dark' ? 'text-[#EAECEF]' : 'text-gray-900'}`}>
            {/* Status Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-6"
            >
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(data.status)}`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{data.status}</span>
              </div>
            </motion.div>

            {/* Transaction Details Grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
              {/* Transaction ID */}
              <div className={`flex items-start gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}>
                <Hash className="w-5 h-5 text-[#F0B90B] mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-[#848E9C] mb-1">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-medium break-all">{data.transactionId}</p>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(data.transactionId, 'txid')}
                      className="p-1 hover:bg-[#2B3139] rounded transition-colors"
                    >
                      {copied === 'txid' ? <Check className="w-3 h-3 text-[#0ECB81]" /> : <Copy className="w-3 h-3 text-[#848E9C]" />}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className={`flex items-start gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}>
                <Calendar className="w-5 h-5 text-[#F0B90B] mt-1" />
                <div>
                  <p className="text-sm text-[#848E9C] mb-1">Date & Time</p>
                  <p className="font-medium">{formatDate(data.date)}</p>
                  <p className="text-sm text-[#848E9C]">{formatTime(data.date)}</p>
                </div>
              </div>

              {/* Asset */}
              <div className={`flex items-start gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}>
                <DollarSign className="w-5 h-5 text-[#F0B90B] mt-1" />
                <div>
                  <p className="text-sm text-[#848E9C] mb-1">Asset</p>
                  <p className="font-medium text-lg">{data.asset}</p>
                  {data.network && (
                    <p className="text-xs text-[#848E9C]">Network: {data.network}</p>
                  )}
                </div>
              </div>

              {/* Reference */}
              {data.reference && (
                <div className={`flex items-start gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}>
                  <Hash className="w-5 h-5 text-[#F0B90B] mt-1" />
                  <div>
                    <p className="text-sm text-[#848E9C] mb-1">Reference</p>
                    <p className="font-mono text-sm">{data.reference}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Amount Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className={`p-6 rounded-xl mb-8 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-[#2B3139] to-[#1E2329]' 
                  : 'bg-gradient-to-br from-gray-100 to-gray-200'
              } border ${theme === 'dark' ? 'border-[#3A3F4A]' : 'border-gray-300'}`}
            >
              <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#EAECEF]' : 'text-gray-900'}`}>
                <Wallet className="w-5 h-5 text-[#F0B90B]" />
                {data.type === 'deposit' ? 'Amount Received' : 'Amount Sent'}
              </h3>
              <div className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-[#F0B90B] mb-2">
                  {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} {data.asset}
                </p>
                {data.amountUsd && (
                  <p className={`text-lg ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-600'}`}>
                    ≈ {formatCurrency(data.amountUsd)}
                  </p>
                )}
              </div>
            </motion.div>

            {/* User Information */}
            {(data.userName || data.userEmail) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className={`p-6 rounded-xl mb-8 ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}
              >
                <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-600'}`}>
                  <Shield className="w-4 h-4 text-[#F0B90B]" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.userName && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Account Holder</p>
                      <p className="font-medium">{data.userName}</p>
                    </div>
                  )}
                  {data.userEmail && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{data.userEmail}</p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(data.userEmail!, 'email')}
                          className="p-1 hover:bg-[#2B3139] rounded transition-colors"
                        >
                          {copied === 'email' ? <Check className="w-3 h-3 text-[#0ECB81]" /> : <Copy className="w-3 h-3 text-[#848E9C]" />}
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {data.userId && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">User ID</p>
                      <p className="font-mono text-sm">{data.userId.slice(0, 8)}...{data.userId.slice(-8)}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Address Information */}
            {data.address && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className={`p-6 rounded-xl mb-8 ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}
              >
                <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-600'}`}>
                  <Globe className="w-4 h-4 text-[#F0B90B]" />
                  {data.type === 'deposit' ? 'Deposit Address' : 'Withdrawal Address'}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-[#1E2329] p-3 rounded-xl border border-[#2B3139] break-all flex-1">
                    {data.address}
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => copyToClipboard(data.address!, 'address')}
                    className="p-3 bg-gradient-to-r from-[#F0B90B] to-[#F0B90B]/90 text-[#0B0E11] rounded-xl hover:from-[#F0B90B] hover:to-[#F0B90B] transition-all shadow-lg shadow-[#F0B90B]/20"
                  >
                    {copied === 'address' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </motion.button>
                </div>
                {data.memo && (
                  <div className="mt-3 pt-3 border-t border-[#2B3139]">
                    <p className="text-xs text-[#848E9C] mb-1">Destination Tag / Memo</p>
                    <p className="font-mono text-sm">{data.memo}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Transaction Details */}
            {(data.txHash || data.confirmations || data.fee) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className={`p-6 rounded-xl mb-8 ${theme === 'dark' ? 'bg-[#2B3139]/50' : 'bg-gray-100'}`}
              >
                <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-600'}`}>
                  <Zap className="w-4 h-4 text-[#F0B90B]" />
                  Transaction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.txHash && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Transaction Hash</p>
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs break-all">{data.txHash.slice(0, 20)}...{data.txHash.slice(-8)}</p>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => copyToClipboard(data.txHash!, 'txhash')}
                          className="p-1 hover:bg-[#2B3139] rounded transition-colors"
                        >
                          {copied === 'txhash' ? <Check className="w-3 h-3 text-[#0ECB81]" /> : <Copy className="w-3 h-3 text-[#848E9C]" />}
                        </motion.button>
                      </div>
                    </div>
                  )}
                  {data.blockNumber && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Block Number</p>
                      <p className="font-mono text-sm">{data.blockNumber}</p>
                    </div>
                  )}
                  {data.confirmations !== undefined && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Confirmations</p>
                      <p className="font-mono text-sm">{data.confirmations}</p>
                    </div>
                  )}
                  {data.fee && data.fee > 0 && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Network Fee</p>
                      <p className="font-mono text-sm">{data.fee} {data.asset}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Profit/ROI for Trading */}
            {(data.profit !== undefined || data.roi !== undefined) && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className={`p-6 rounded-xl mb-8 ${
                  (data.profit || 0) >= 0 
                    ? 'bg-gradient-to-r from-[#0ECB81]/20 to-transparent' 
                    : 'bg-gradient-to-r from-[#F6465D]/20 to-transparent'
                }`}
              >
                <h3 className={`text-sm font-medium mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-600'}`}>
                  <TrendingUp className="w-4 h-4 text-[#F0B90B]" />
                  Trade Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.profit !== undefined && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">Profit/Loss</p>
                      <p className={`text-lg font-bold ${data.profit >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {data.profit >= 0 ? '+' : ''}{data.profit} {data.asset}
                      </p>
                    </div>
                  )}
                  {data.roi !== undefined && (
                    <div>
                      <p className="text-xs text-[#848E9C] mb-1">ROI</p>
                      <p className={`text-lg font-bold ${data.roi >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {data.roi >= 0 ? '+' : ''}{data.roi}%
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-center pt-6 border-t border-[#2B3139]"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="w-5 h-5 text-[#F0B90B]" />
                <p className="text-sm font-medium">KRYVEX TRADING PLATFORM</p>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-[#848E9C]' : 'text-gray-500'} mb-2`}>
                This is an automatically generated receipt. Please keep it for your records.
              </p>
              <p className={`text-[10px] ${theme === 'dark' ? 'text-[#5E6673]' : 'text-gray-400'}`}>
                kryvextrading.com • Licensed Trading Platform • All transactions are secure
              </p>
            </motion.div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
            <div className="text-8xl font-black text-[#F0B90B] transform rotate-[-30deg] select-none">
              KRYVEX
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#F0B90B]/20 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#F0B90B]/20 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#F0B90B]/20 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#F0B90B]/20 rounded-br-2xl" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TransactionSlip;