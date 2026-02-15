import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletTransfer from '@/components/WalletTransfer';

export default function WalletTransferPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0E11] to-[#1A1D24]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#181A20]/95 backdrop-blur-xl border-b border-[#2B3139]">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-[#848E9C] hover:text-[#EAECEF] mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-[#EAECEF]">Wallet Transfer</h1>
          </div>
        </div>
      </div>

      {/* Transfer Component */}
      <WalletTransfer />
    </div>
  );
}
