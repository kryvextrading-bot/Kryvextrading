import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import Index from './pages/Index';
import HomePage from './pages/HomePage';
import AssetPage from './pages/AssetPage';
import Trading from './pages/Trading';
import TradingInterface from './pages/TradingInterface';
import Wallet from './pages/Wallet';
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
import ArbitragePage from './pages/ArbitrageSimple';
import Portfolio from './pages/Portfolio';
import LoanPage from './pages/Loan';
import KycVerification from './pages/KycVerification';
import LanguagePage from './pages/LanguagePage';
import Settings from './pages/Settings';
import SettingsNotifications from './pages/SettingsNotifications';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Legal from './pages/Legal';
import WhitePaper from './pages/WhitePaper';
import Share from './pages/Share';
import CreditScore from './pages/CreditScore';
import More from './pages/More';
import Security from './pages/Security';
import PaymentMethods from './pages/PaymentMethods';
import TransactionHistory from './pages/TransactionHistory';
import OrderHistoryPage from './pages/OrderHistoryPage';
import WalletTransfer from './pages/WalletTransfer';
import PresalePage from './pages/PresalePage';
import AdminDashboard from './pages/admin/Dashboard';
import UserDetailsPage from './pages/admin/UserDetailsPage';
import TradingAdminPanel from './pages/admin/TradingAdmin';
import AssetSelectorPage from './pages/AssetSelectorPage';
import TradingPage from './pages/TradingPage';
import ChartView from './pages/ChartView';

// Admin Dashboard Redirect Component
const AdminDashboardRedirect = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const redirectPath = (isAdmin || isSuperAdmin) ? '/admin/dashboard' : '/';
  return <Navigate to={redirectPath} replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/legal" element={<Legal />} />
      <Route path="/white-paper" element={<WhitePaper />} />
      <Route path="/share" element={<Share />} />
      <Route path="/more" element={<More />} />
      <Route path="/trading" element={<AssetSelectorPage />} />
      <Route path="/trading/:symbol" element={<TradingPage />} />
      <Route path="/trading/:symbol/:tab" element={<TradingPage />} />
      <Route path="/trading/:symbol/chart" element={<ChartView />} />
      <Route path="/trading/interface" element={<TradingInterface />} />
      <Route path="/trading/options" element={<OptionsTradingPage />} />
      <Route path="/arbitrage" element={<ArbitragePage />} />
      <Route path="*" element={<NotFound />} />
      
      {/* Auth Routes - redirect if already authenticated */}
      <Route path="/login" element={
        <ProtectedRoute requireAuth={false}>
          <Login />
        </ProtectedRoute>
      } />
      <Route path="/register" element={
        <ProtectedRoute requireAuth={false}>
          <Register />
        </ProtectedRoute>
      } />
      <Route path="/forgot-password" element={
        <ProtectedRoute requireAuth={false}>
          <ForgotPassword />
        </ProtectedRoute>
      } />
      
      {/* Protected Routes - require authentication */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminDashboardRedirect />
        </ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      } />
      <Route path="/wallet-transfer" element={
        <ProtectedRoute>
          <WalletTransfer />
        </ProtectedRoute>
      } />
      <Route path="/account" element={
        <ProtectedRoute>
          <Account />
        </ProtectedRoute>
      } />
      <Route path="/security" element={
        <ProtectedRoute>
          <Security />
        </ProtectedRoute>
      } />
      <Route path="/payment-methods" element={
        <ProtectedRoute>
          <PaymentMethods />
        </ProtectedRoute>
      } />
      <Route path="/transaction-history" element={
        <ProtectedRoute>
          <OrderHistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/wallet/transactions" element={
        <ProtectedRoute>
          <OrderHistoryPage />
        </ProtectedRoute>
      } />
      <Route path="/quick-access" element={
        <ProtectedRoute>
          <QuickAccess />
        </ProtectedRoute>
      } />
      <Route path="/kyc-verification" element={
        <ProtectedRoute>
          <KycVerification />
        </ProtectedRoute>
      } />
      <Route path="/settings/language" element={
        <ProtectedRoute>
          <LanguagePage />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/notifications" element={
        <ProtectedRoute>
          <SettingsNotifications />
        </ProtectedRoute>
      } />
      <Route path="/credit-score" element={
        <ProtectedRoute>
          <CreditScore />
        </ProtectedRoute>
      } />
      
      {/* Trading Routes - require authentication */}
      <Route path="/asset/:symbol" element={
        <ProtectedRoute>
          <AssetPage />
        </ProtectedRoute>
      } />
      <Route path="/portfolio" element={
        <ProtectedRoute>
          <Portfolio />
        </ProtectedRoute>
      } />
      <Route path="/loan" element={
        <ProtectedRoute>
          <LoanPage />
        </ProtectedRoute>
      } />
      <Route path="/presale" element={
        <ProtectedRoute>
          <PresalePage />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - require admin authentication */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/user/:userId" element={
        <ProtectedRoute requireAdmin>
          <UserDetailsPage />
        </ProtectedRoute>
      } />
      <Route path="/admin/trading-control" element={
        <ProtectedRoute requireAdmin>
          <TradingAdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  );
}