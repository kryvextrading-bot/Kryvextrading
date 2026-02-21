import { Home, Wallet, User, CreditCard, Settings, Shuffle, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { TrendingUp } from '@/components/icons/TrendingUp';
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

// Mobile navigation items (show fewer items to prevent overflow)
const mobileNavigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/trading', icon: TrendingUp, label: 'Trading' },
  { href: '/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/account', icon: User, label: 'Account' },
  { href: '/more', icon: MoreHorizontal, label: 'More' },
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
        {/* Desktop navigation - show all items */}
        <div className="hidden md:flex items-center justify-around w-full">
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

        {/* Mobile navigation - show fewer items */}
        <div className="flex md:hidden items-center justify-around w-full">
          {mobileNavigationItems.map((item) => {
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
      </div>
    </nav>
  );
}