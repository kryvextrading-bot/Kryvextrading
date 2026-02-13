import React, { useState, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useWallet } from '@/contexts/WalletContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { Trash2 } from 'lucide-react';

function getCountdown(date: string, durationSeconds?: number) {
  if (!durationSeconds) return null;
  const start = new Date(date).getTime();
  const end = start + durationSeconds * 1000;
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function RecordsModal({ open, onClose }) {
  const { transactions, portfolio, deleteTransaction } = useWallet();
  const [tab, setTab] = useState('all');
  // Filter state
  const [assetFilter, setAssetFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { currency } = useUserSettings();

  // Asset options
  const assetOptions = portfolio.map(a => a.symbol);
  const typeOptions = ['Trade', 'Arbitrage', 'Staking', 'Deposit', 'Withdrawal'];
  const statusOptions = ['Completed', 'Pending', 'Failed', 'In Progress', 'Win', 'Loss'];

  // Filtering logic
  function filterRecords(records) {
    return records.filter(t =>
      (assetFilter === 'all' || t.asset === assetFilter) &&
      (typeFilter === 'all' || t.type === typeFilter) &&
      (statusFilter === 'all' || t.status === statusFilter) &&
      (search === '' ||
        t.asset.toLowerCase().includes(search.toLowerCase()) ||
        (t.details?.label && t.details.label.toLowerCase().includes(search.toLowerCase())) ||
        t.amount.toString().includes(search) ||
        (t.pnl && t.pnl.toString().includes(search))
      )
    );
  }

  // Only include transactions from the last 7 days
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentTransactions = transactions.filter(t => new Date(t.date).getTime() >= sevenDaysAgo);

  // Categorize records
  const trades = useMemo(() => recentTransactions.filter(t => t.type === 'Trade'), [recentTransactions]);
  const arbitrage = useMemo(() => recentTransactions.filter(t => t.type === 'Arbitrage'), [recentTransactions]);
  const staking = useMemo(() => recentTransactions.filter(t => t.type === 'Staking'), [recentTransactions]);
  const deposits = useMemo(() => recentTransactions.filter(t => t.type === 'Deposit'), [recentTransactions]);
  const withdrawals = useMemo(() => recentTransactions.filter(t => t.type === 'Withdrawal'), [recentTransactions]);

  return (
    <Dialog open={open} onClose={onClose} className="z-50">
      <div className="fixed inset-0 bg-black/60 z-40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
          <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" onClick={onClose}>&times;</button>
          <h2 className="text-2xl font-bold mb-4">Records</h2>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Asset" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {assetOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typeOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="w-40" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Tabs */}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-6 w-full mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
              <TabsTrigger value="staking">Staking</TabsTrigger>
              <TabsTrigger value="deposits">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {filterRecords(recentTransactions).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium flex gap-2 items-center">
                          <Badge variant="outline">{t.type}</Badge>
                          <span>{t.asset}</span>
                          {t.details?.label && <span className="text-xs text-muted-foreground">({t.details.label})</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                        {t.pnl !== undefined && <div className="text-xs">PnL: {formatCurrency(t.pnl, currency)}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        {t.status === 'In Progress' && t.details?.time && (
                          <span className="text-xs text-yellow-600 font-mono">{getCountdown(t.date, t.details.time)}</span>
                        )}
                        {t.status === 'In Progress' && t.details?.duration && (
                          <span className="text-xs text-yellow-600 font-mono">{getCountdown(t.date, t.details.duration)}</span>
                        )}
                        {(t.status === 'Win' || t.status === 'Loss') && t.pnl !== undefined && (
                          <span className={t.status === 'Win' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{t.status}</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="trades">
              {filterRecords(recentTransactions.filter(t => t.type === 'Trade')).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No trade records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions.filter(t => t.type === 'Trade')).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset}</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        {t.status === 'In Progress' && t.details?.time && (
                          <span className="text-xs text-yellow-600 font-mono">{getCountdown(t.date, t.details.time)}</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="arbitrage">
              {filterRecords(recentTransactions.filter(t => t.type === 'Arbitrage')).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No arbitrage records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions.filter(t => t.type === 'Arbitrage')).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset} {t.details?.label && `(${t.details.label})`}</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        {t.status === 'In Progress' && t.details?.duration && (
                          <span className="text-xs text-yellow-600 font-mono">{getCountdown(t.date, t.details.duration)}</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="staking">
              {filterRecords(recentTransactions.filter(t => t.type === 'Staking')).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No staking records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions.filter(t => t.type === 'Staking')).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset}</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        {t.status === 'In Progress' && t.details?.duration && (
                          <span className="text-xs text-yellow-600 font-mono">{getCountdown(t.date, t.details.duration)}</span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="deposits">
              {filterRecords(recentTransactions.filter(t => t.type === 'Deposit')).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No deposit records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions.filter(t => t.type === 'Deposit')).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset}</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="withdrawals">
              {filterRecords(recentTransactions.filter(t => t.type === 'Withdrawal')).length === 0 ? (
                <div className="text-muted-foreground text-center py-8">No withdrawal records yet.</div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {filterRecords(recentTransactions.filter(t => t.type === 'Withdrawal')).map(t => (
                    <Card key={t.id} className="p-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{t.asset}</div>
                        <div className="text-xs text-muted-foreground">Amount: {formatCurrency(t.amount, currency)} | Date: {new Date(t.date).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} title="Delete record">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Dialog>
  );
} 