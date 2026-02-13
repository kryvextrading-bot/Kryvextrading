import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Legal() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="flex items-center p-4 border-b border-[#23262F]">
        <button onClick={() => navigate(-1)} className="mr-2 text-2xl">←</button>
        <h2 className="flex-1 text-center font-bold text-lg uppercase">Introduction</h2>
      </div>
      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto text-sm md:text-base">
        <h1 className="text-3xl font-bold mb-4 lowercase">legal information</h1>
        <p className="mb-6">We are committed to providing investors with a legal, safe and information-protected financial investment environment. Here, you can safely obtain real-time information and professional analysis on a variety of investment products such as virtual currencies. Our goal is to help you make informed investment decisions and help you achieve your financial goals.</p>
        <h3 className="font-bold mb-2">Legality guarantee</h3>
        <p className="mb-6">Our financial investment website strictly follows relevant national laws, regulations and policy requirements, and holds legal business licenses and related qualifications. We maintain close cooperation with authoritative financial regulatory agencies to ensure that our business activities always comply with regulatory requirements. On our platform, you can conduct investment transactions with confidence without worrying about compliance issues.</p>
        <h3 className="font-bold mb-2">Information security protection</h3>
        <p className="mb-6">Information security is crucial for financial investment websites. We use advanced encryption technology and strict data protection measures to ensure that your personal information and transaction data are fully protected. Our servers use multiple firewalls and real-time security monitoring systems to effectively prevent hacker attacks and data leaks. At the same time, we regularly conduct security checks and upgrades on the system to ensure that information security is always at its best.</p>
        <h3 className="font-bold mb-2">Legal information protection</h3>
        <p className="mb-6">We attach great importance to the privacy and intellectual property rights of our users. On the premise of complying with relevant laws and regulations, we strictly keep users' personal information confidential and take measures to prevent unauthorized third parties from obtaining user information. We respect and protect intellectual property rights, and all articles, pictures, videos and other content on the website have been legally authorized or are original works. If there is any infringement, please contact us in time and we will deal with it as soon as possible.</p>
        <h3 className="font-bold mb-2">transparency and fairness</h3>
        <p className="mb-6">We adhere to the principles of transparency and fairness and provide investors with a fair trading environment. We publicly disclose transaction fees, interest rates and other relevant information on our website so that you can fully understand transaction costs when making investment decisions. In addition, we use advanced transaction execution technology to ensure that orders are executed quickly and accurately to protect your investment interests.</p>
        <p className="mt-6">As a legal, safe and well-protected financial investment website, we are always committed to providing investors with a safe and convenient investment environment. We know that trust is the cornerstone of financial services, so we will continue to work hard to win your trust and satisfaction with integrity, professionalism and efficient services. Here you can invest, learn and grow with confidence.</p>
      </div>
    </div>
  );
} 