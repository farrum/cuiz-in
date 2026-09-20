import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ADVISOR_LIFELINES, 
  AdvisorId, 
  getAllUsersShardHoldings, 
  getAllShardTransactions, 
  type UserShardHolding, 
  type ShardTransaction 
} from '@/utils/advisorShards';
import { 
  Sparkles, RefreshCw, Search, Filter, ShieldCheck, Download, 
  History, Users, Award, Coins, ArrowUpRight, ArrowDownRight, User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminShardHistory: React.FC = () => {
  const [holdings, setHoldings] = useState<UserShardHolding[]>([]);
  const [transactions, setTransactions] = useState<ShardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions'>('holdings');

  const loadData = async () => {
    setLoading(true);
    try {
      const [holdingsData, txData] = await Promise.all([
        getAllUsersShardHoldings(),
        getAllShardTransactions(150),
      ]);
      setHoldings(holdingsData);
      setTransactions(txData);
    } catch (err) {
      console.error('[AdminShardHistory] failed to load admin shard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Realm aggregates
  const totalRealmShards = holdings.reduce((sum, h) => sum + h.totalCollected, 0);
  const totalRealmPurchased = holdings.reduce((sum, h) => sum + h.totalPurchased, 0);
  const totalRealmSpent = holdings.reduce((sum, h) => sum + h.totalSpent, 0);
  const activeHoldersCount = holdings.filter((h) => h.totalCollected > 0).length;

  // Advisor distribution
  const advisorTotals = useMemo(() => {
    const res: Record<AdvisorId, { held: number; spent: number; purchased: number }> = {
      socrates: { held: 0, spent: 0, purchased: 0 },
      aryabhata: { held: 0, spent: 0, purchased: 0 },
      chanakya: { held: 0, spent: 0, purchased: 0 },
      ramanujan: { held: 0, spent: 0, purchased: 0 },
    };
    holdings.forEach((h) => {
      res.socrates.held += h.socrates;
      res.aryabhata.held += h.aryabhata;
      res.chanakya.held += h.chanakya;
      res.ramanujan.held += h.ramanujan;
    });
    return res;
  }, [holdings]);

  // Filtered holdings
  const filteredHoldings = useMemo(() => {
    return holdings.filter((h) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        h.username.toLowerCase().includes(q) ||
        h.displayName.toLowerCase().includes(q) ||
        h.userId.toLowerCase().includes(q);
      const matchAdvisor =
        advisorFilter === 'all' ||
        (advisorFilter in h && (h as any)[advisorFilter] > 0);
      return matchSearch && matchAdvisor;
    });
  }, [holdings, searchQuery, advisorFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (t.username && t.username.toLowerCase().includes(q)) ||
        t.characterId.toLowerCase().includes(q) ||
        t.actionType.toLowerCase().includes(q);
      const matchAdvisor = advisorFilter === 'all' || t.characterId === advisorFilter;
      return matchSearch && matchAdvisor;
    });
  }, [transactions, searchQuery, advisorFilter]);

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeTab === 'holdings') {
      csvContent += 'User ID,Username,Display Name,Socrates,Aryabhata,Chanakya,Ramanujan,Total Held,Total Purchased,Total Spent\n';
      holdings.forEach((h) => {
        csvContent += `"${h.userId}","${h.username}","${h.displayName}",${h.socrates},${h.aryabhata},${h.chanakya},${h.ramanujan},${h.totalCollected},${h.totalPurchased},${h.totalSpent}\n`;
      });
    } else {
      csvContent += 'ID,Date,User,Advisor,Amount,Action,Balance After\n';
      transactions.forEach((t) => {
        csvContent += `"${t.id}","${t.createdAt}","${t.username || t.userId}","${t.characterId}",${t.amount},"${t.actionType}",${t.balanceAfter || ''}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shard_${activeTab}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-amber-500/20 shadow-lg">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">
            Royal Council Audit
          </span>
          <h1 className="text-xl md:text-2xl font-black font-serif uppercase tracking-wider flex items-center gap-2 text-white">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Advisor Shard Ledger & History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of shard balances, purchases, and in-quiz lifeline executions across the realm
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            onClick={exportCSV}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-2 border-primary/10 shadow-sm p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Total Shards In Circulation
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-600">{totalRealmShards}</span>
            <span className="text-xs font-bold text-slate-400">Active</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Across {holdings.length} registered players
          </p>
        </Card>

        <Card className="bg-white border-2 border-primary/10 shadow-sm p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Total Shards Purchased
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">+{totalRealmPurchased}</span>
            <span className="text-xs font-bold text-slate-400">Acquired</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Via armory shop and decree quests
          </p>
        </Card>

        <Card className="bg-white border-2 border-primary/10 shadow-sm p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Total Shards Spent
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600">-{totalRealmSpent}</span>
            <span className="text-xs font-bold text-slate-400">Expended</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            On 50/50, Audience Poll, Skip, Extra Time
          </p>
        </Card>

        <Card className="bg-white border-2 border-primary/10 shadow-sm p-4 rounded-2xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Active Shard Holders
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-500">{activeHoldersCount}</span>
            <span className="text-xs font-bold text-slate-400">Players</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">
            Holding at least 1 advisor shard
          </p>
        </Card>
      </div>

      {/* Advisor Distribution Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ADVISOR_LIFELINES.map((adv) => {
          const stat = advisorTotals[adv.id];
          return (
            <div
              key={adv.id}
              className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">{adv.emoji}</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-tight">
                    {adv.name}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    {adv.ability}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-0.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>In Vaults:</span>
                  <span className="font-black text-cyan-600">{stat.held}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Switcher and Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('holdings')}
            className={cn(
              'flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
              activeTab === 'holdings'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Users className="w-3.5 h-3.5" />
            Player Shard Holdings ({filteredHoldings.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={cn(
              'flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5',
              activeTab === 'transactions'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <History className="w-3.5 h-3.5" />
            Recent Transactions ({filteredTransactions.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search player or event..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          <select
            value={advisorFilter}
            onChange={(e) => setAdvisorFilter(e.target.value)}
            aria-label="Filter by Council Advisor"
            className="h-9 px-3 rounded-xl text-xs font-bold bg-slate-50 border border-slate-200 text-slate-700"
          >
            <option value="all">All Advisors</option>
            <option value="socrates">🏛️ Socrates (50/50)</option>
            <option value="aryabhata">📐 Aryabhata (Skip)</option>
            <option value="chanakya">📜 Chanakya (Poll)</option>
            <option value="ramanujan">🧠 Ramanujan (Time)</option>
          </select>
        </div>
      </div>

      {/* Main Table / Content Section */}
      <div className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold animate-pulse">
            Loading Imperial Shard Records…
          </div>
        ) : activeTab === 'holdings' ? (
          filteredHoldings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No players match your search filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3 text-center">🏛️ Socrates</th>
                    <th className="py-3 px-3 text-center">📐 Aryabhata</th>
                    <th className="py-3 px-3 text-center">📜 Chanakya</th>
                    <th className="py-3 px-3 text-center">🧠 Ramanujan</th>
                    <th className="py-3 px-4 text-center">Total Held</th>
                    <th className="py-3 px-4 text-center">Purchased</th>
                    <th className="py-3 px-4 text-center">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredHoldings.map((p) => (
                    <tr key={p.userId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-black text-slate-800 block text-xs">
                            {p.displayName || p.username}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            @{p.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={cn(p.socrates > 0 ? 'text-cyan-600 font-black' : 'text-slate-300')}>
                          {p.socrates}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={cn(p.aryabhata > 0 ? 'text-amber-600 font-black' : 'text-slate-300')}>
                          {p.aryabhata}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={cn(p.chanakya > 0 ? 'text-rose-600 font-black' : 'text-slate-300')}>
                          {p.chanakya}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={cn(p.ramanujan > 0 ? 'text-purple-600 font-black' : 'text-slate-300')}>
                          {p.ramanujan}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-black text-xs bg-cyan-50 text-cyan-700 border border-cyan-200">
                          {p.totalCollected}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                        {p.totalPurchased > 0 ? `+${p.totalPurchased}` : '0'}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-600 font-bold">
                        {p.totalSpent > 0 ? `-${p.totalSpent}` : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No transactions recorded in the ledger yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Player</th>
                    <th className="py-3 px-3">Advisor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">
                            {tx.username || tx.userId.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold uppercase text-[11px] text-slate-700">
                            {tx.characterId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-600">
                            {tx.actionType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn('font-black', isCredit ? 'text-emerald-600' : 'text-rose-600')}>
                            {isCredit ? '+' : ''}
                            {tx.amount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600 font-bold">
                          {tx.balanceAfter !== undefined ? tx.balanceAfter : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminShardHistory;
