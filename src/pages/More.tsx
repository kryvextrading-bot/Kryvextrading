import React from 'react';
import { ArrowLeft, Shuffle, ArrowUpDown, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp } from '@/components/icons/TrendingUp';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const moreItems = [
  { href: '/arbitrage', icon: Shuffle, label: 'Arbitrage', description: 'AI-powered arbitrage trading' },
  { href: '/wallet-transfer', icon: ArrowUpDown, label: 'Transfer', description: 'Transfer funds between wallets' },
  { href: '/portfolio', icon: CreditCard, label: 'Portfolio', description: 'View your portfolio performance' },
];

export default function More() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h1 className="text-lg font-semibold">More</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {moreItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link
                to={item.href}
                className="block p-4 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{t(item.label)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
