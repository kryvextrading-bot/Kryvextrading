import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import HomePage from './pages/HomePage';
import AssetPage from './pages/AssetPage';
import Trading from './pages/Trading';
import TradingInterface from './pages/TradingInterface';
import Wallet from './pages/Wallet';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Account from './pages/Account';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';
import QuickAccess from './pages/QuickAccess';
import OptionsTradingPage from './pages/OptionsTradingPage';
import ArbitragePage from './pages/Arbitrage';
import Portfolio from './pages/Portfolio';
import LoanPage from './pages/Loan';
import KycVerification from './pages/KycVerification';
import LanguagePage from './pages/LanguagePage';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Legal from './pages/Legal';
import WhitePaper from './pages/WhitePaper';
import Share from './pages/Share';
import CreditScore from './pages/CreditScore';
import AdminDashboard from './pages/admin/Dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/account" element={<Account />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/quick-access" element={<QuickAccess />} />
      <Route path="/kyc-verification" element={<KycVerification />} />
      <Route path="/settings/language" element={<LanguagePage />} />
      <Route path="/asset/:symbol" element={<AssetPage />} />
      <Route path="/trading" element={<Trading />} />
      <Route path="/trading/interface" element={<TradingInterface />} />
      <Route path="/trading/options" element={<OptionsTradingPage />} />
      <Route path="/arbitrage" element={<ArbitragePage />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/loan" element={<LoanPage />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/white-paper" element={<WhitePaper />} />
      <Route path="/share" element={<Share />} />
      <Route path="/credit-score" element={<CreditScore />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 