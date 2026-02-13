import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { TradingProvider } from './contexts/TradingContext';
import { AuthProvider } from './contexts/AuthContext';
import { Navigation } from './components/layout/Navigation';
import { WalletProvider } from './contexts/WalletContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { useUserSettings } from './contexts/UserSettingsContext';
import { useEffect } from 'react';
import { MarketDataProvider } from './contexts/MarketDataContext';
import PriceTicker from './components/PriceTicker';
import { OrderProvider } from './contexts/OrderContext';
import { AccountsProvider } from './contexts/AccountsContext';

export default function App() {
  return (
    <AccountsProvider>
      <MarketDataProvider>
        <UserSettingsProvider>
          <ThemedApp />
        </UserSettingsProvider>
      </MarketDataProvider>
    </AccountsProvider>
  );
}

function ThemedApp() {
  const { theme } = useUserSettings();
  useEffect(() => {
    let appliedTheme = theme;
    if (theme === 'system') {
      appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.body.dataset.theme = appliedTheme;
  }, [theme]);
  return (
    <AuthProvider>
      <WalletProvider>
        <OrderProvider>
          <TradingProvider>
            <BrowserRouter>
              <PriceTicker />
              <div className="min-h-screen bg-background">
                <AppRoutes />
                <Navigation />
              </div>
            </BrowserRouter>
          </TradingProvider>
        </OrderProvider>
      </WalletProvider>
    </AuthProvider>
  );
}
