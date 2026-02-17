import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFacebook, FaTelegram, FaXTwitter, FaInstagram } from 'react-icons/fa6';

const REFERRAL_LINK = 'https://kryvex.com/#/?code=93460388';

export default function Share() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(REFERRAL_LINK);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="flex items-center p-4 border-b border-[#23262F]">
        <button onClick={() => navigate(-1)} className="mr-2 text-2xl">←</button>
        <h2 className="flex-1 text-center font-bold text-lg">Invite Friends</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Illustration */}
        <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="Invite" className="w-40 h-40 mb-6" />
        <h3 className="text-2xl font-bold mb-2 text-center">Earn Together with Your Friends</h3>
        <p className="text-center text-[#ccc] mb-6 max-w-xl">
          Invite friends to join AI smart arbitrage and liquidity miners through your link. User A invites user B (A will get 10% of B's first recharge); user B invites user C (B will get 10% of C's first recharge). User A can get rewards by inviting user D, but inviting user C cannot get rewards.
        </p>
        <div className="w-full max-w-xl bg-[#23262F] rounded-xl p-4 flex flex-col items-center mb-6">
          <label className="text-sm text-[#aaa] mb-2 w-full">Referral code</label>
          <div className="flex w-full items-center bg-[#181A20] rounded-lg px-2 py-2">
            <input
              type="text"
              value={REFERRAL_LINK}
              readOnly
              className="flex-1 bg-transparent text-white outline-none border-none text-base"
            />
            <button
              onClick={handleCopy}
              className="ml-2 px-3 py-1 bg-[#F0B90B] text-black rounded-lg font-bold hover:bg-yellow-400 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="w-full max-w-xl flex flex-col items-center">
          <div className="text-[#aaa] mb-2">Share via social media</div>
          <div className="flex gap-6 text-2xl">
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(REFERRAL_LINK)}`} target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
            <a href={`https://t.me/share/url?url=${encodeURIComponent(REFERRAL_LINK)}`} target="_blank" rel="noopener noreferrer"><FaTelegram /></a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(REFERRAL_LINK)}`} target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
            <a href={`https://www.instagram.com/`} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          </div>
        </div>
      </div>
    </div>
  );
} 