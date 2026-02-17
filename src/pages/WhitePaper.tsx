import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function WhitePaper() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="flex items-center p-4 border-b border-[#23262F]">
        <button onClick={() => navigate(-1)} className="mr-2 text-2xl">←</button>
        <h2 className="flex-1 text-center font-bold text-lg uppercase">White Paper</h2>
      </div>
      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto text-sm md:text-base">
        <h1 className="text-3xl font-bold mb-4">Swan IRA White Paper</h1>
        <h3 className="font-bold mb-2">Introduction</h3>
        <p className="mb-6">Swan IRA is a next-generation cryptocurrency investment platform designed to provide secure, compliant, and user-friendly digital asset management for individuals and institutions. Our mission is to empower users to invest in cryptocurrencies with confidence, transparency, and regulatory assurance.</p>
        <h3 className="font-bold mb-2">Mission & Vision</h3>
        <p className="mb-6">Our mission is to bridge traditional finance and the digital asset world, offering a seamless experience for buying, selling, and managing cryptocurrencies within a regulated environment. We envision a future where everyone can access the benefits of blockchain technology safely and efficiently.</p>
        <h3 className="font-bold mb-2">Platform Features</h3>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>Secure digital asset custody and management</li>
          <li>Regulatory compliance and KYC/AML procedures</li>
          <li>Intuitive trading interface for spot, futures, and options</li>
          <li>Automated AI-driven arbitrage and investment strategies</li>
          <li>Comprehensive account management and reporting</li>
          <li>Multi-layer security with cold storage and encryption</li>
        </ul>
        <h3 className="font-bold mb-2">Security & Compliance</h3>
        <p className="mb-6">Swan IRA adheres to the highest standards of security and regulatory compliance. We implement advanced encryption, multi-factor authentication, and regular security audits. Our platform complies with all relevant financial regulations, ensuring user assets and data are protected at all times.</p>
        <h3 className="font-bold mb-2">Tokenomics</h3>
        <p className="mb-6">The Swan IRA ecosystem is powered by a native utility token, enabling reduced fees, governance participation, and access to premium features. Token distribution and economics are designed to incentivize long-term growth and community engagement.</p>
        <h3 className="font-bold mb-2">Roadmap</h3>
        <ul className="list-disc pl-6 mb-6 space-y-1">
          <li>Q1 2024: Platform launch, spot trading, and KYC integration</li>
          <li>Q2 2024: Futures and options trading, mobile app release</li>
          <li>Q3 2024: AI-driven investment tools, staking, and lending</li>
          <li>Q4 2024: Global expansion, new asset listings, and DeFi integration</li>
        </ul>
        <h3 className="font-bold mb-2">Conclusion</h3>
        <p className="mb-6">Kryvex Trading is committed to building a secure, transparent, and innovative platform for cryptocurrency trading. We invite you to join our community and participate in the future of digital finance.</p>
        <p className="mt-6 text-xs text-gray-400">For the latest version and full details, visit the official Kryvex Trading White Paper at <a href="https://kryvex.com/#/web_view" className="text-[#F0B90B] underline" target="_blank" rel="noopener noreferrer">https://kryvex.com/#/web_view</a></p>
      </div>
    </div>
  );
} 