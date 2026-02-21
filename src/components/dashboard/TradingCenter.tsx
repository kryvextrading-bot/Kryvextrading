import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { useNavigate } from 'react-router-dom';

const arbitrageProducts = [
  {
    id: 'arb-1d',
    label: '1 Day',
    tier: 'Basic',
    purchaseLimit: '$1,000',
    investmentRange: '$1,000 – $9,999',
    dailyIncome: '0.80% – 1.00%',
    cryptos: ['BTC', 'ETH', 'USDT'],
  },
  {
    id: 'arb-3d',
    label: '3 Days',
    tier: 'Bronze',
    purchaseLimit: '$5,000',
    investmentRange: '$5,000 – $49,999',
    dailyIncome: '1.01% – 1.19%',
    cryptos: ['BTC', 'ETH', 'USDT', 'SOL'],
  },
  {
    id: 'arb-7d',
    label: '7 Days',
    tier: 'Silver',
    purchaseLimit: '$10,000',
    investmentRange: '$10,000 – $99,999',
    dailyIncome: '1.20% – 1.29%',
    cryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'BNB'],
  },
  {
    id: 'arb-10d',
    label: '10 Days',
    tier: 'Gold',
    purchaseLimit: '$25,000',
    investmentRange: '$25,000 – $199,999',
    dailyIncome: '1.30% – 1.49%',
    cryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'ADA'],
  },
  {
    id: 'arb-15d',
    label: '15 Days',
    tier: 'Platinum',
    purchaseLimit: '$50,000',
    investmentRange: '$50,000 – $499,999',
    dailyIncome: '1.40% – 1.49%',
    cryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'ADA', 'XRP'],
  },
  {
    id: 'arb-25d',
    label: '25 Days',
    tier: 'Diamond',
    purchaseLimit: '$100,000',
    investmentRange: '$100,000 – $999,999',
    dailyIncome: '1.45% – 1.49%',
    cryptos: ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'ADA', 'XRP', 'DOT'],
  },
];

const stakingTiers = [
  { range: '1,000–10,000', yield: '0.10%–0.30%' },
  { range: '10,000–50,000', yield: '0.30%–0.70%' },
  { range: '50,000–200,000', yield: '0.75%–1.20%' },
  { range: '200,000–500,000', yield: '1.30%–1.80%' },
  { range: '500,000–9,999,999', yield: '1.85%–2.80%' },
];

const tradingPairs = [
  { label: 'BTC/USDT', price: 67668.18 },
  { label: 'ETH/USDT', price: 3492.89 },
  { label: 'SOL/USDT', price: 856.88 },
];
const timeRanges = [60, 120, 240, 360, 600];

const spotPairs = [
  { label: 'BTC/USDT', price: 67668.18 },
  { label: 'ETH/USDT', price: 3492.89 },
  { label: 'SOL/USDT', price: 856.88 },
];
const futuresPairs = [
  { label: 'BTC/USDT', price: 67668.18 },
  { label: 'ETH/USDT', price: 3492.89 },
];
const optionsPairs = tradingPairs;

export function TradingCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quant');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [stakingAmount, setStakingAmount] = useState('');
  const [selectedPair, setSelectedPair] = useState(tradingPairs[0]);
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [tradeTime, setTradeTime] = useState(60);
  const [tradeAmount, setTradeAmount] = useState('');
  const [price, setPrice] = useState(selectedPair.price);
  const [tradeTab, setTradeTab] = useState('active');
  const [mainTab, setMainTab] = useState('spot');
  const { toast } = useToast();
  const { user } = useAuth();
  const { balance, portfolio, addTransaction, transactions, updatePortfolio, totalValue } = useWallet();
  const { currency } = useUserSettings();
  const usdtBalance = portfolio?.find(a => a.symbol === 'USDT')?.balance ?? 0;

  // Mock real-time price feed
  useEffect(() => {
    setPrice(selectedPair.price);
    const interval = setInterval(() => {
      setPrice((p) => parseFloat((p + (Math.random() - 0.5) * (selectedPair.price * 0.001)).toFixed(2)));
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const handleStartArbitrage = () => {
    navigate('/arbitrage');
  };

  const handleStartStaking = () => {
    navigate('/staking');
  };

  const handleStartOptions = () => {
    navigate('/options');
  };

  const handleMainTabChange = (tab) => {
    if (tab === 'spot') navigate('/spot');
    else if (tab === 'futures') navigate('/futures');
    else if (tab === 'options') navigate('/options');
    setMainTab(tab);
  };

  const handleBuy = () => {
    const amount = Number(tradeAmount);
    if (!tradeAmount || isNaN(amount) || amount <= 0 || amount > usdtBalance) {
      toast({ title: 'Error', description: 'Enter a valid trade amount.', variant: 'destructive' });
      return;
    }
    addTransaction({
      id: Date.now().toString(),
      type: 'Trade',
      asset: selectedPair.label,
      amount,
      status: 'In Progress',
      date: new Date().toISOString(),
      details: { direction, time: tradeTime, price },
    });
    updatePortfolio(portfolio.map(a => a.symbol === 'USDT' ? { ...a, balance: a.balance - amount } : a));
    toast({ title: 'Trade Placed', description: `You placed a ${direction.toUpperCase()} trade on ${selectedPair.label} for ${formatCurrency(amount, currency)}.` });
    setTradeAmount('');
  };

  const getEstimatedEarnings = () => {
    const amt = Number(stakingAmount);
    if (!amt || amt <= 0) return '0.00';
    // Use mid yield for estimate
    let rate = 0.002;
    if (amt >= 1000 && amt < 10000) rate = 0.002;
    else if (amt < 50000) rate = 0.005;
    else if (amt < 200000) rate = 0.00975;
    else if (amt < 500000) rate = 0.0155;
    else rate = 0.02325;
    return (amt * rate).toFixed(2);
  };

  const expectedProfit = () => {
    const amt = Number(tradeAmount);
    if (!amt) return '0.00';
    // Mock: 80% payout
    return (amt * 0.8).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="quant">Quant Trading</TabsTrigger>
          <TabsTrigger value="staking">Node Staking</TabsTrigger>
          <TabsTrigger value="options">Options Trading</TabsTrigger>
        </TabsList>
        <TabsContent value="quant">
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Arbitrage Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {arbitrageProducts.map((prod) => (
                <div
                  key={prod.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedProduct?.id === prod.id ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-300'}`}
                  onClick={() => setSelectedProduct(prod)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">{prod.label}</span>
                    <Badge>{prod.tier}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Purchase Limit: <b>{formatCurrency(Number(prod.purchaseLimit.replace(/,/g, '')), currency)}</b></div>
                  <div className="text-xs text-muted-foreground mb-1">Investment Range: <b>{formatCurrency(Number(prod.investmentRange.replace(/,/g, '')), currency)}</b></div>
                  <div className="text-xs text-muted-foreground mb-1">Daily Income: <b>{prod.dailyIncome}</b></div>
                  <div className="flex gap-2 mt-2">
                    {prod.cryptos.map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <Input
                type="number"
                placeholder="Enter investment amount"
                value={investmentAmount}
                onChange={e => setInvestmentAmount(e.target.value)}
                className="max-w-xs"
                disabled={!selectedProduct}
              />
              <Button onClick={handleStartArbitrage} disabled={!selectedProduct || !investmentAmount}>
                Start Arbitrage
              </Button>
            </div>
            <div className="text-right text-muted-foreground text-sm mt-2">Available Balance: <span className="font-semibold">{formatCurrency(usdtBalance, 'USD')} USDT</span></div>
          </Card>
        </TabsContent>
        <TabsContent value="staking">
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Node Staking</h2>
            <div className="mb-4 flex items-center gap-4">
              <span className="font-semibold">USDT Wallet:</span>
              <Badge variant="outline">{formatCurrency(usdtBalance, currency)}</Badge>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Yield Rate Table</h3>
              <table className="w-full text-sm border rounded">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left">Staking Range (USDT)</th>
                    <th className="p-2 text-left">Yield Rate (Daily)</th>
                  </tr>
                </thead>
                <tbody>
                  {stakingTiers.map((tier, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{tier.range}</td>
                      <td className="p-2">{tier.yield}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
              <Input
                type="number"
                placeholder="Enter staking amount"
                value={stakingAmount}
                onChange={e => setStakingAmount(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleStartStaking} disabled={!stakingAmount}>
                Start Staking
              </Button>
              <div className="ml-4 text-sm">
                <span className="font-medium">Estimated Daily Earnings: </span>
                <span className="text-green-600 font-bold">{formatCurrency(Number(getEstimatedEarnings()), currency)}</span>
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="options">
          <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Options Trading</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="font-medium">Trading Pair</label>
                  <select
                    className="block w-full mt-1 border rounded p-2 bg-background"
                    value={selectedPair.label}
                    onChange={e => setSelectedPair(tradingPairs.find(p => p.label === e.target.value) || tradingPairs[0])}
                  >
                    {tradingPairs.map((p) => (
                      <option key={p.label} value={p.label}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 items-center">
                  <label className="font-medium">Direction:</label>
                  <Button variant={direction === 'up' ? 'default' : 'outline'} onClick={() => setDirection('up')}>Up</Button>
                  <Button variant={direction === 'down' ? 'default' : 'outline'} onClick={() => setDirection('down')}>Down</Button>
                </div>
                <div>
                  <label className="font-medium">Time Range</label>
                  <div className="flex gap-2 mt-1">
                    {timeRanges.map((t) => (
                      <Button key={t} variant={tradeTime === t ? 'default' : 'outline'} onClick={() => setTradeTime(t)}>{t}s</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-medium">Trade Amount</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={tradeAmount}
                    onChange={e => setTradeAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-4 items-center mt-2">
                  <span className="text-sm">Purchase Range: <b>${formatCurrency(10, currency)} – ${formatCurrency(10000, currency)}</b></span>
                  <span className="text-sm">Available Balance: <b>{formatCurrency(totalValue, 'USD')} USD</b></span>
                </div>
                <div className="flex gap-4 items-center mt-2">
                  <span className="text-sm">Expected Profit: <b className="text-green-600">${formatCurrency(Number(expectedProfit()), currency)}</b></span>
                </div>
                <Button className="mt-4 w-full" onClick={handleStartOptions} disabled={!tradeAmount}>Buy</Button>
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 font-medium">Real-Time Price</div>
                <div className="text-3xl font-bold mb-4">{selectedPair.label}: ${price}</div>
                <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">(Price Chart Coming Soon)</div>
              </div>
            </div>
            <div className="mt-6">
              <Tabs value={tradeTab} onValueChange={setTradeTab}>
                <TabsList className="mb-2">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="active">
                  <div className="space-y-2">
                    {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').length === 0 && <div className="text-muted-foreground">No active trades</div>}
                    {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').map((r) => (
                      <Card key={r.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium">{r.asset} ({r.details?.direction?.toUpperCase?.() ?? ''})</div>
                          <div className="text-xs text-muted-foreground">Amount: {formatCurrency(r.amount, currency)} | Time: {r.details?.time ?? ''}s | Price: ${r.details?.price ?? ''}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Started: {new Date(r.date).toLocaleString()}</div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="scheduled">
                  <div className="text-muted-foreground">No scheduled trades</div>
                </TabsContent>
                <TabsContent value="completed">
                  <div className="space-y-2">
                    {transactions.filter(r => r.type === 'Trade' && r.status === 'Completed').length === 0 && <div className="text-muted-foreground">No completed trades</div>}
                    {transactions.filter(r => r.type === 'Trade' && r.status === 'Completed').map((r) => (
                      <Card key={r.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-medium">{r.asset} ({r.details?.direction?.toUpperCase?.() ?? ''})</div>
                          <div className="text-xs text-muted-foreground">Amount: {formatCurrency(r.amount, currency)} | Time: {r.details?.time ?? ''}s | Price: ${r.details?.price ?? ''}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">Started: {new Date(r.date).toLocaleString()}</div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Main Trading Modes */}
      <div className="mt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div className="flex gap-6 items-center">
            <span className="font-semibold">Wallet Balance:</span>
            <Badge variant="outline">{formatCurrency(usdtBalance, currency)}</Badge>
            <span className="font-semibold ml-6">Real-time PnL:</span>
            <span className={balance >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{balance >= 0 ? '+' : ''}{formatCurrency(balance, currency)}</span>
          </div>
          <Input className="max-w-xs" placeholder="Search assets... (Coming soon)" disabled />
        </div>
        <Tabs value={mainTab} onValueChange={handleMainTabChange}>
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="spot">Spot Trade</TabsTrigger>
            <TabsTrigger value="futures">Futures Trade</TabsTrigger>
            <TabsTrigger value="options">Options Trade</TabsTrigger>
          </TabsList>
          <TabsContent value="spot">
            <Card className="p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="font-medium">Trading Pair</label>
                    <select
                      className="block w-full mt-1 border rounded p-2 bg-background"
                      value={spotPairs[0].label}
                      onChange={e => setSelectedPair(spotPairs.find(p => p.label === e.target.value) || spotPairs[0])}
                    >
                      {spotPairs.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <Button onClick={handleBuy} disabled={!tradeAmount}>Buy</Button>
                    <Button variant="destructive" onClick={() => handleBuy()} disabled={!tradeAmount}>Sell</Button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 font-medium">Live Price</div>
                  <div className="text-3xl font-bold mb-4">{spotPairs[0].label}: ${price}</div>
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">(Chart Coming Soon)</div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Trade History</h4>
                <div className="space-y-2">
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').length === 0 && <div className="text-muted-foreground">No trades yet</div>}
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').map((t) => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset} ({t.details?.direction?.toUpperCase?.() ?? ''})</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Price: ${t.details?.price ?? ''}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Placed: {new Date(t.date).toLocaleString()}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="futures">
            <Card className="p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="font-medium">Trading Pair</label>
                    <select
                      className="block w-full mt-1 border rounded p-2 bg-background"
                      value={futuresPairs[0].label}
                      onChange={e => setSelectedPair(futuresPairs.find(p => p.label === e.target.value) || futuresPairs[0])}
                    >
                      {futuresPairs.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 items-center">
                    <label className="font-medium">Direction:</label>
                    <Button variant={direction === 'up' ? 'default' : 'outline'} onClick={() => setDirection('up')}>Buy</Button>
                    <Button variant={direction === 'down' ? 'default' : 'outline'} onClick={() => setDirection('down')}>Sell</Button>
                  </div>
                  <div>
                    <label className="font-medium">Leverage</label>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={1} // Mock leverage
                      onChange={e => setDirection('up')} // Mock leverage change
                      className="w-full"
                    />
                    <div className="text-xs mt-1">1x</div>
                  </div>
                  <div>
                    <label className="font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <Button onClick={handleBuy} disabled={!tradeAmount}>Open Position</Button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 font-medium">Live Price</div>
                  <div className="text-3xl font-bold mb-4">{futuresPairs[0].label}: ${price}</div>
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">(Chart Coming Soon)</div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Trade History</h4>
                <div className="space-y-2">
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').length === 0 && <div className="text-muted-foreground">No trades yet</div>}
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').map((t) => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset} ({t.details?.direction?.toUpperCase?.() ?? ''}) x1</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Price: ${t.details?.price ?? ''}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Placed: {new Date(t.date).toLocaleString()}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
          <TabsContent value="options">
            <Card className="p-6 mb-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="font-medium">Trading Pair</label>
                    <select
                      className="block w-full mt-1 border rounded p-2 bg-background"
                      value={optionsPairs[0].label}
                      onChange={e => setSelectedPair(optionsPairs.find(p => p.label === e.target.value) || optionsPairs[0])}
                    >
                      {optionsPairs.map((p) => (
                        <option key={p.label} value={p.label}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-4 items-center">
                    <label className="font-medium">Direction:</label>
                    <Button variant={direction === 'up' ? 'default' : 'outline'} onClick={() => setDirection('up')}>Up</Button>
                    <Button variant={direction === 'down' ? 'default' : 'outline'} onClick={() => setDirection('down')}>Down</Button>
                  </div>
                  <div>
                    <label className="font-medium">Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={tradeAmount}
                      onChange={e => setTradeAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4 mt-2">
                    <Button onClick={handleBuy} disabled={!tradeAmount}>Buy</Button>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="mb-2 font-medium">Live Price</div>
                  <div className="text-3xl font-bold mb-4">{optionsPairs[0].label}: ${price}</div>
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center text-muted-foreground">(Chart Coming Soon)</div>
                </div>
              </div>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Trade History</h4>
                <div className="space-y-2">
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').length === 0 && <div className="text-muted-foreground">No trades yet</div>}
                  {transactions.filter(r => r.type === 'Trade' && r.status === 'In Progress').map((t) => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset} ({t.details?.direction?.toUpperCase?.() ?? ''})</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Price: ${t.details?.price ?? ''}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Placed: {new Date(t.date).toLocaleString()}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* TODO: Add portfolio categories, search bar, wallet balance, PnL, trading history, etc. */}
    </div>
  );
} 