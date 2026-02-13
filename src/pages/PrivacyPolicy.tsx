import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="flex items-center p-4 border-b border-[#23262F]">
        <button onClick={() => navigate(-1)} className="mr-2 text-2xl">←</button>
        <h2 className="flex-1 text-center font-bold text-lg">Privacy policy</h2>
      </div>
      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto text-sm md:text-base">
        <h3 className="font-bold mb-2">Introduction:</h3>
        <p className="mb-4">We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy outlines the types of information we collect, how we use it, and the measures we take to safeguard your data on our DeFi Blockchain website.</p>
        <h3 className="font-bold mb-2">Information We Collect:</h3>
        <p className="mb-2">We may collect the following types of information when you use our DeFi platform:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li><b>a. Personal Information:</b> This includes your name and address, phone number, and other contact information that you voluntarily provide when registering for an account or participating in our services.</li>
          <li><b>b. Transaction Information:</b> We collect information related to your transactions on our platform, such as transaction amounts, digital asset types, and wallet addresses.</li>
          <li><b>c. Technical Data:</b> We gather information about your device, browser, and IP address, as well as usage data, such as your browsing activities, preferences, and interaction with our platform.</li>
          <li><b>d. Cookies and Similar Technologies:</b> We use cookies and other tracking technologies to enhance your user experience, monitor platform performance, and facilitate user authentication.</li>
        </ul>
        <h3 className="font-bold mb-2">How We Use Your Information:</h3>
        <p className="mb-2">We use the information we collect for the following purposes:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>a. To provide, maintain, and improve our DeFi platform and services.</li>
          <li>b. To communicate with you and respond to your inquiries or support requests.</li>
          <li>c. To enforce our terms and conditions and protect against fraud, security threats, or illegal activities.</li>
          <li>d. To comply with legal and regulatory obligations.</li>
          <li>e. To analyze platform usage and improve user experience.</li>
        </ul>
        <h3 className="font-bold mb-2">Information Sharing and Disclosure:</h3>
        <p className="mb-2">We may share your information with third parties under the following circumstances:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>a. With service providers or partners who help us operate our platform and perform related functions, such as transaction processing, data storage, or analytics.</li>
          <li>b. In response to legal requests or to comply with laws, regulations, or court orders.</li>
          <li>c. To protect the rights, property, or safety of our platform, users, or the public.</li>
        </ul>
        <h3 className="font-bold mb-2">Data Security:</h3>
        <p className="mb-4">We implement industry-standard security measures, such as encryption and access controls, to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, please note that no method of data transmission or storage can guarantee absolute security.</p>
        <h3 className="font-bold mb-2">Data Retention:</h3>
        <p className="mb-4">We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, comply with legal obligations, or resolve disputes. Once your data is no longer required, we will delete or anonymize it.</p>
        <h3 className="font-bold mb-2">Your Rights and Choices:</h3>
        <p className="mb-4">You may have certain rights concerning your personal information, including the right to access, correct, or delete your data, or object to its processing. To exercise these rights, please contact us at [Your Company Email Address].</p>
        <h3 className="font-bold mb-2">Changes to This Privacy Policy:</h3>
        <p className="mb-4">We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any significant changes by posting an update on our platform or sending you an email notification.</p>
        <p className="mt-6">By using our DeFi platform, you acknowledge and agree to the terms of this Privacy Policy.</p>
      </div>
    </div>
  );
} 