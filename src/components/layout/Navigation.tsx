import { Home, TrendingUp, Wallet, User, CreditCard, Settings, Shuffle, ArrowUpDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

const navigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/trading', icon: TrendingUp, label: 'Trading' },
  { href: '/arbitrage', icon: Shuffle, label: 'Arbitrage' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/wallet-transfer', icon: ArrowUpDown, label: 'Transfer' },
  { href: '/portfolio', icon: CreditCard, label: 'Portfolio' },
  { href: '/account', icon: User, label: 'Account' },
];

export function Navigation() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isAdmin, isSuperAdmin } = useAuth();

  // Hide navigation for admin users
  if (isAdmin || isSuperAdmin) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 mb-1",
                isActive && "text-primary"
              )} />
              <span className="text-xs font-medium">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}