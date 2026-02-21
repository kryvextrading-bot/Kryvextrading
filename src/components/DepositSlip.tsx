import React, { useRef, useState } from 'react';
import { CheckCircle, Download, Printer, Calendar, DollarSign, Hash, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface TransactionSlipData {
  transactionId: string;
  date: string;
  time: string;
  asset: string;
  status: 'Completed' | 'Pending' | 'Processing';
  amount: number;
  amountUsd?: number;
  userName?: string;
  userEmail?: string;
  network?: string;
  address?: string;
  type: 'deposit' | 'withdrawal';
  fee?: number;
}

interface TransactionSlipProps {
  data: TransactionSlipData;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const TransactionSlip: React.FC<TransactionSlipProps> = ({ 
  data, 
  onClose, 
  showCloseButton = true 
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
      hour12: true
    });
  };

  const handlePrint = () => {
    if (slipRef.current) {
      const printContent = slipRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    
    setIsGenerating(true);
    
    try {
      // Capture the slip as an image
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const filename = `${data.type}-slip-${data.transactionId}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Action Buttons */}
        <div className="mb-6 flex justify-center gap-4">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print Slip
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Download PDF'}
          </button>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Transaction Slip */}
        <div
          ref={slipRef}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ minHeight: '600px' }}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r p-8 text-center ${
            data.type === 'deposit' 
              ? 'from-green-500 to-green-600' 
              : 'from-blue-500 to-blue-600'
          }`}>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                {data.type === 'deposit' ? (
                  <CheckCircle className="w-10 h-10 text-green-500" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-blue-500" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {data.type === 'deposit' ? 'PAYMENT APPROVED' : 'WITHDRAWAL PROCESSED'}
            </h1>
            <p className="text-green-100">
              Official {data.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Slip • kryvextrading.com
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Transaction Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Transaction ID */}
              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-lg font-semibold">{data.transactionId}</p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="text-lg font-semibold">{formatDate(data.date)}</p>
                  <p className="text-sm text-gray-600">{formatTime(data.date)}</p>
                </div>
              </div>

              {/* Asset */}
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Asset</p>
                  <p className="text-lg font-semibold">{data.asset}</p>
                  {data.network && (
                    <p className="text-sm text-gray-600">Network: {data.network}</p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    data.status === 'Completed' 
                      ? 'bg-green-100 text-green-800'
                      : data.status === 'Processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {data.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount Section */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {data.type === 'deposit' ? 'Amount Deposited' : 'Amount Withdrawn'}
              </h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {data.asset}
                </p>
                {data.amountUsd && (
                  <p className="text-lg text-gray-600">
                    Approximately ${data.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {data.fee && data.fee > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      {data.type === 'deposit' ? 'Deposit Fee' : 'Withdrawal Fee'}: {data.fee} {data.asset}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* User Information (if available) */}
            {(data.userName || data.userEmail) && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div className="space-y-2">
                  {data.userName && (
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{data.userName}</p>
                    </div>
                  )}
                  {data.userEmail && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{data.userEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address Information (if available) */}
            {data.address && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {data.type === 'deposit' ? 'Deposit Address' : 'Withdrawal Address'}
                </h3>
                <div className="font-mono text-sm bg-white p-3 rounded border break-all">
                  {data.address}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm">
              <p className="mb-2">Thank you for choosing KRYVEX!</p>
              <p>This is an automatically generated receipt. Please keep it for your records.</p>
              <p className="mt-4 text-xs">
                Generated on {formatDate(new Date().toISOString())} at {formatTime(new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
            <div className="text-8xl font-bold text-gray-400 transform rotate-45">KRYVEX</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSlip;
