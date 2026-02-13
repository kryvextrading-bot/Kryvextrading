import { ArrowRight, Bot, Coins, CreditCard, Pickaxe, Server, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const investmentOptions = [
  {
    id: 'quant-trading',
    name: 'Quant Trading',
    icon: TrendingUp,
    description: 'Algorithmic trading strategies',
    color: 'text-blue-500'
  },
  {
    id: 'node-staking',
    name: 'Node Staking',
    icon: Coins,
    description: 'Stake your crypto for rewards',
    color: 'text-green-500'
  },
  {
    id: 'loan',
    name: 'Loan',
    icon: CreditCard,
    description: 'Crypto-backed lending',
    color: 'text-purple-500'
  },
  {
    id: 'pre-sale',
    name: 'Pre-sale coin',
    icon: Pickaxe,
    description: 'Early access to new tokens',
    color: 'text-orange-500'
  },
];

const featuredOptions = [
  {
    id: 'liquidity-mining',
    name: 'Liquidity Miner',
    icon: Server,
    description: 'Provide liquidity and earn rewards',
    color: 'text-cyan-500'
  },
  {
    id: 'ai-arbitrage',
    name: 'Join AI Arbitrage',
    icon: Bot,
    description: 'AI-powered trading opportunities',
    color: 'text-indigo-500'
  },
];

export function InvestmentOptions() {
  return (
    <div className="space-y-6">
      {/* Main Investment Options */}
      <div className="grid grid-cols-2 gap-4">
        {investmentOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.id} className="p-4 bg-gradient-card hover:shadow-card transition-all duration-300 cursor-pointer group">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className={`p-3 rounded-full bg-secondary ${option.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{option.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Featured Options */}
      <div className="space-y-4">
        {featuredOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.id} className="p-4 bg-gradient-card hover:shadow-card transition-all duration-300 cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full bg-secondary ${option.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{option.name}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-primary">
                  <span className="text-sm font-medium">See more</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}