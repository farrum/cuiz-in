import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ADVISOR_LIFELINES, 
  AdvisorId, 
  getShardHistory, 
  getAllShardBalances, 
  getAllShardsPurchased, 
  type ShardTransaction 
} from '@/utils/advisorShards';
import { supabase } from '@/integrations/supabase/client';
import { 
  History, Sparkles, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, 
  Clock, ShieldCheck, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ShardHistoryTab: React.FC = () => {
  const [transactions, setTransactions] = useState<ShardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'earned' | 'spent'>('all');
  const [balances, setBalances] = useState<Record<AdvisorId, number>>(() => getAllShardBalances());
  const [lifetimePurchased, setLifetimePurchased] = useState<Record<AdvisorId, number>>(() => getAllShardsPurchased());
  const [lifetimeSpent, setLifetimeSpent] = useState<Record<AdvisorId, number>>({
    socrates: 0,
    aryabhata: 0,
    chanakya: 0,
    ramanujan: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      setBalances(getAllShardBalances());
      setLifetimePurchased(getAllShardsPurchased());

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      if (userId) {
        // Fetch lifetime spent from user_characters
        const { data: charData } = await (supabase as any)
          .from('user_characters')
          .select('character_id, shards_spent, shards_purchased, shards_collected')
          .eq('user_id', userId);

        if (Array.isArray(charData)) {
          const spentMap: Record<AdvisorId, number> = {
            socrates: 0,
            aryabhata: 0,
            chanakya: 0,
            ramanujan: 0,
          };
          const balMap: Record<AdvisorId, number> = { ...balances };
          const purchMap: Record<AdvisorId, number> = { ...lifetimePurchased };

          charData.forEach((row: any) => {
            const cId = row.character_id as AdvisorId;
            if (cId in spentMap) {
              spentMap[cId] = row.shards_spent || 0;
              balMap[cId] = row.shards_collected || 0;
              purchMap[cId] = row.shards_purchased || 0;
            }
          });
          setLifetimeSpent(spentMap);
          setBalances(balMap);
          setLifetimePurchased(purchMap);
        }
      }

      const history = await getShardHistory(userId);
      setTransactions(history);
    } catch (err) {
      console.warn('[ShardHistoryTab] failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener('advisorShardsUpdated', handleUpdate);
    return () => window.removeEventListener('advisorShardsUpdated', handleUpdate);
  }, []);

  const totalCollected = Object.values(balances).reduce((sum, n) => sum + n, 0);
  const totalPurchased = Object.values(lifetimePurchased).reduce((sum, n) => sum + n, 0);
  const totalSpent = Object.values(lifetimeSpent).reduce((sum, n) => sum + n, 0);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchAdv = selectedAdvisor === 'all' || t.characterId === selectedAdvisor;
      const matchType =
        selectedType === 'all' ||
        (selectedType === 'earned' && t.amount > 0) ||
        (selectedType === 'spent' && t.amount < 0);
      return matchAdv && matchType;
    });
  }, [transactions, selectedAdvisor, selectedType]);

  const formatActionLabel = (tx: ShardTransaction) => {
    switch (tx.actionType) {
      case 'purchase':
        return 'Royal Shop Shard Pack (+5 Shards)';
      case 'quest_bounty':
        return 'Bounty Board Decree Reward';
      case 'lifeline_fifty_fifty':
        return 'Socrates 50/50 Lifeline (Eliminated 2 wrong answers)';
      case 'lifeline_audience_poll':
        return 'Chanakya Audience Poll (Court consensus revealed)';
      case 'lifeline_skip':
        return 'Aryabhata Skip Lifeline (Tactical retreat)';
      case 'lifeline_extra_time':
        return 'Ramanujan Extra Time (+15s clock boost)';
      case 'sync_migration':
        return 'Cross-device account balance sync';
      default:
        return tx.amount > 0 ? 'Shards Acquired' : 'Lifeline Activated';
    }
  };

  const getAdvisorMeta = (id: AdvisorId) => {
    return ADVISOR_LIFELINES.find((a) => a.id === id) || {
      name: id,
      shortName: id,
      emoji: '🏛️',
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel-3d bg-white p-5 rounded-2xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-cyan-400/10 pointer-events-none" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Current Shard Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-600 drop-shadow-sm">{totalCollected}</span>
            <span className="text-xs font-bold text-slate-400">Total Shards</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2">
            Ready to spend on quiz lifelines
          </p>
        </div>

        <div className="panel-3d bg-white p-5 rounded-2xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-emerald-400/10 pointer-events-none" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Lifetime Acquired
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 drop-shadow-sm">{totalPurchased}</span>
            <span className="text-xs font-bold text-slate-400">Forged & Won</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2">
            Via shop packs, decrees & quests
          </p>
        </div>

        <div className="panel-3d bg-white p-5 rounded-2xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-rose-400/10 pointer-events-none" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
            Lifetime Spent
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 drop-shadow-sm">{totalSpent}</span>
            <span className="text-xs font-bold text-slate-400">Spent in Battles</span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold mt-2">
            {Math.floor(totalSpent / 10)} lifelines invoked
          </p>
        </div>
      </div>

      {/* Advisor Breakdown Bar */}
      <div className="panel-3d bg-white p-5 rounded-2xl border-2 border-primary/10 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 font-serif mb-4 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" /> Royal Council Vault Holdings
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ADVISOR_LIFELINES.map((adv) => {
            const bal = balances[adv.id] || 0;
            const spent = lifetimeSpent[adv.id] || 0;
            const purch = lifetimePurchased[adv.id] || 0;
            return (
              <div
                key={adv.id}
                className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 shadow-inner flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{adv.emoji}</span>
                  <div>
                    <span className="text-xs font-black text-slate-800 block leading-tight">
                      {adv.shortName}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">
                      {adv.ability}
                    </span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-sm font-black text-slate-800">{bal} shards</span>
                  <span className="text-[9px] font-bold text-slate-400">
                    {spent > 0 ? `-${spent}` : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction History Filter and List */}
      <div className="panel-3d bg-white p-5 rounded-2xl border-2 border-primary/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider font-serif flex items-center gap-2">
              <History className="w-4 h-4 text-primary" /> Shard Transaction Audit Ledger
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Authoritative record of all shards forged, won, and expended on lifelines
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="text-xs font-black uppercase tracking-wider rounded-xl h-8 px-3"
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedType('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                selectedType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              All Events
            </button>
            <button
              onClick={() => setSelectedType('earned')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                selectedType === 'earned'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              + Earned / Bought
            </button>
            <button
              onClick={() => setSelectedType('spent')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                selectedType === 'spent'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              - Lifeline Spends
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedAdvisor('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all',
                selectedAdvisor === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              )}
            >
              All Advisors
            </button>
            {ADVISOR_LIFELINES.map((adv) => (
              <button
                key={adv.id}
                onClick={() => setSelectedAdvisor(adv.id)}
                className={cn(
                  'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1',
                  selectedAdvisor === adv.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                <span>{adv.emoji}</span>
                <span>{adv.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs animate-pulse">
            Consulting the Imperial Archives…
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-black text-slate-600 uppercase tracking-wider">No Shard Events Found</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              Forge shards in the Royal Shop or unlock them through quests. When you activate 50/50 or Audience Poll in quizzes, your expenditures will be documented here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((tx) => {
              const adv = getAdvisorMeta(tx.characterId);
              const isCredit = tx.amount > 0;
              const dateStr = new Date(tx.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={tx.id}
                  className="bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border',
                        isCredit
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-rose-50 border-rose-200 text-rose-600'
                      )}
                    >
                      {adv.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 truncate">
                          {adv.shortName}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                          {tx.actionType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold truncate mt-0.5">
                        {formatActionLabel(tx)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'text-sm font-black flex items-center justify-end gap-0.5',
                        isCredit ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {isCredit ? '+' : ''}
                      {tx.amount} shards
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShardHistoryTab;
