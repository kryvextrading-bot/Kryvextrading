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
  X
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'USDT' ? 'USD' : currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
                body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: ${theme === 'dark' ? '#0B0E11' : '#ffffff'}; }
                @media print {
                  body { margin: 0; padding: 0; }
                  .no-print { display: none; }
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
        useCORS: true,
        windowWidth: slipRef.current.scrollWidth,
        windowHeight: slipRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF with exact content dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      
      const filename = `KRYVEX-${data.type}-${data.transactionId.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
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
          text: `Transaction ${data.transactionId.slice(0, 8)} - ${data.amount} ${data.asset}`,
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
    <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-2 sm:p-4">
      <motion.div 
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Action Buttons - Compact on mobile */}
        <div className="mb-3 sm:mb-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 no-print">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrint}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2B3139] text-[#EAECEF] rounded-lg border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all text-xs sm:text-sm"
          >
            <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Print</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#F0B90B] text-[#0B0E11] rounded-lg hover:bg-[#F0B90B]/90 transition-all text-xs sm:text-sm font-medium shadow-lg shadow-[#F0B90B]/20"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">{isGenerating ? '...' : 'PDF'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2B3139] text-[#EAECEF] rounded-lg border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all text-xs sm:text-sm"
          >
            <QrCode className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">QR</span>
          </motion.button>

          {navigator.share && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2B3139] text-[#EAECEF] rounded-lg border border-[#3A3F4A] hover:border-[#F0B90B]/50 transition-all text-xs sm:text-sm"
            >
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Share</span>
            </motion.button>
          )}

          {showCloseButton && onClose && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2B3139] text-[#EAECEF] rounded-lg border border-[#3A3F4A] hover:border-[#F6465D]/50 transition-all text-xs sm:text-sm"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Close</span>
            </motion.button>
          )}
        </div>

        {/* Transaction Slip - Mobile Optimized */}
        <motion.div
          ref={slipRef}
          className="relative rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden border border-[#2B3139] bg-[#1E2329] text-[#EAECEF]"
          variants={fadeInUp}
        >
          {/* Background Tech Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMTB2NDBNMTAgMzBoNDBNMTUgMTVsMzAgMzBNMTUgNDVsMzAtMzAiIHN0cm9rZT0iI0YwQjkwQiIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] bg-repeat opacity-20" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#F0B90B]/5 via-transparent to-[#0ECB81]/5" />
          </div>

          {/* Premium Header with Gradient */}
          <div className={`relative overflow-hidden ${
            data.type === 'deposit' 
              ? 'bg-gradient-to-r from-[#0ECB81] to-[#0FB37E]' 
              : 'bg-gradient-to-r from-[#F0B90B] to-[#DBA40A]'
          }`}>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse" />
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative px-4 sm:px-6 py-4 sm:py-6 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="flex justify-center mb-2 sm:mb-3"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                  <TypeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight"
              >
                {data.type === 'deposit' ? 'PAYMENT APPROVED' : 'WITHDRAWAL PROCESSED'}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-white/80 text-[10px] sm:text-xs"
              >
                Official {data.type} slip • KRYVEX
              </motion.p>

              {/* KRYVEX Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/20 backdrop-blur-xl px-2 py-1 rounded-full border border-white/30"
              >
                <div className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  <span className="text-white text-[8px] sm:text-[10px] font-medium">KRYVEX</span>
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
              className="px-4 sm:px-6 pt-4"
            >
              <div className="bg-[#2B3139] p-3 sm:p-4 rounded-xl flex flex-col items-center justify-center">
                <QRCodeCanvas
                  value={JSON.stringify({
                    id: data.transactionId,
                    type: data.type,
                    amount: data.amount,
                    asset: data.asset,
                    date: data.date
                  })}
                  size={window.innerWidth < 640 ? 100 : 120}
                  bgColor="#2B3139"
                  fgColor="#EAECEF"
                  level="H"
                  includeMargin={false}
                />
                <p className="text-[10px] sm:text-xs text-[#848E9C] mt-2">Scan to verify transaction</p>
              </div>
            </motion.div>
          )}

          {/* Content - Compact for mobile */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Status Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center"
            >
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${getStatusColor(data.status)}`}>
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="text-xs sm:text-sm font-medium">{data.status}</span>
              </div>
            </motion.div>

            {/* Transaction ID - Simplified */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#2B3139]/50 rounded-xl p-3"
            >
              <p className="text-[10px] sm:text-xs text-[#848E9C] mb-1">TRANSACTION ID</p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs sm:text-sm break-all pr-2">{data.transactionId}</p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => copyToClipboard(data.transactionId, 'txid')}
                  className="p-1.5 bg-[#F0B90B]/10 rounded-lg hover:bg-[#F0B90B]/20 transition-colors shrink-0"
                >
                  {copied === 'txid' ? <Check className="w-3 h-3 text-[#0ECB81]" /> : <Copy className="w-3 h-3 text-[#F0B90B]" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Date, Time, Asset in a 3-column grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 gap-2"
            >
              <div className="bg-[#2B3139]/50 rounded-xl p-2.5">
                <Calendar className="w-3.5 h-3.5 text-[#F0B90B] mb-1" />
                <p className="text-[10px] text-[#848E9C]">DATE</p>
                <p className="text-xs font-medium">{formatDate(data.date)}</p>
              </div>
              <div className="bg-[#2B3139]/50 rounded-xl p-2.5">
                <Clock className="w-3.5 h-3.5 text-[#F0B90B] mb-1" />
                <p className="text-[10px] text-[#848E9C]">TIME</p>
                <p className="text-xs font-medium">{formatTime(data.date)}</p>
              </div>
              <div className="bg-[#2B3139]/50 rounded-xl p-2.5">
                <DollarSign className="w-3.5 h-3.5 text-[#F0B90B] mb-1" />
                <p className="text-[10px] text-[#848E9C]">ASSET</p>
                <p className="text-xs font-medium">{data.asset}</p>
                {data.network && (
                  <p className="text-[8px] text-[#848E9C] truncate">{data.network}</p>
                )}
              </div>
            </motion.div>

            {/* Amount Section - Highlighted */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#2B3139] to-[#1E2329] rounded-xl p-4 border border-[#3A3F4A]"
            >
              <h3 className="text-xs text-[#848E9C] mb-2 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#F0B90B]" />
                {data.type === 'deposit' ? 'AMOUNT RECEIVED' : 'AMOUNT SENT'}
              </h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-[#F0B90B] mb-1">
                  {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.asset}
                </p>
                {data.amountUsd && (
                  <p className="text-xs text-[#848E9C]">
                    ≈ {formatCurrency(data.amountUsd)}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Address (if available) - Compact */}
            {data.address && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="bg-[#2B3139]/50 rounded-xl p-3"
              >
                <p className="text-[10px] text-[#848E9C] mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#F0B90B]" />
                  {data.type === 'deposit' ? 'DEPOSIT ADDRESS' : 'WITHDRAWAL ADDRESS'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[10px] sm:text-xs break-all flex-1">{data.address}</p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => copyToClipboard(data.address!, 'address')}
                    className="p-1.5 bg-[#F0B90B]/10 rounded-lg hover:bg-[#F0B90B]/20 transition-colors shrink-0"
                  >
                    {copied === 'address' ? <Check className="w-3 h-3 text-[#0ECB81]" /> : <Copy className="w-3 h-3 text-[#F0B90B]" />}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Fee (if available) */}
            {data.fee && data.fee > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#2B3139]/50 rounded-xl p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#848E9C]">Network Fee</span>
                  <span className="text-xs font-medium">{data.fee} {data.asset}</span>
                </div>
              </motion.div>
            )}

            {/* User Info - Compact */}
            {data.userName && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-[#2B3139]/50 rounded-xl p-3"
              >
                <p className="text-[10px] text-[#848E9C] mb-1">ACCOUNT HOLDER</p>
                <p className="text-xs font-medium">{data.userName}</p>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center pt-3 border-t border-[#2B3139]"
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                <Award className="w-3 h-3 text-[#F0B90B]" />
                <p className="text-[10px] font-medium">KRYVEX TRADING</p>
              </div>
              <p className="text-[8px] text-[#848E9C]">
                This is an automatically generated receipt. No signature required.
              </p>
            </motion.div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            <div className="text-6xl sm:text-7xl font-black text-[#F0B90B] transform rotate-[-30deg] select-none">
              KRYVEX
            </div>
          </div>

          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-[#F0B90B]/20 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-[#F0B90B]/20 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-[#F0B90B]/20 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-[#F0B90B]/20 rounded-br-xl" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TransactionSlip;