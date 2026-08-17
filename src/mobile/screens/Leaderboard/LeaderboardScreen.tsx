import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Shield, Gem } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';

type Row = { user_id: string; username?: string; points: number };

const PODIUM_COLORS = [
  { bg: 'from-amber-400 to-yellow-500', ring: 'ring-amber-400', text: 'text-amber-700', label: 'text-amber-50', icon: Crown },
  { bg: 'from-slate-300 to-slate-400',  ring: 'ring-slate-300',  text: 'text-slate-600', label: 'text-slate-100', icon: Medal },
  { bg: 'from-amber-600 to-orange-700', ring: 'ring-amber-700',  text: 'text-amber-800', label: 'text-amber-50', icon: Medal },
];

function RankBadge({ rank, size = 'md' }: { rank: number; size?: 'sm' | 'md' }) {
  const p = rank <= 3 ? PODIUM_COLORS[rank - 1] : null;
  const sz = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-[13px]';
  if (p) {
    const Icon = p.icon;
    return (
      <div className={cn(`${sz} rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0 ring-2`, p.bg, p.ring)}>
        <Icon className={cn('drop-shadow-sm', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5', p.label)} />
      </div>
    );
  }
  return (
    <div className={cn(`${sz} rounded-xl flex items-center justify-center bg-slate-100 ring-1 ring-slate-200 shrink-0 font-black tabular-nums text-slate-500`)}>
      #{rank}
    </div>
  );
}

export default function LeaderboardScreen() {
  const [rows, setRows]     = useState<Row[]>([]);
  const [me, setMe]         = useState<Row | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const uid = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;

  useEffect(() => {
    (async () => {
      try {
        const month = new Date().toISOString().slice(0, 7);
        const { data } = await supabase.rpc('get_monthly_leaderboard', { _month: month, _limit: 50 });
        if (data?.length) {
          const enriched: Row[] = data.map((r: any) => ({
            user_id:  r.user_id,
            username: r.display_name || r.username || 'Player',
            points:   Number(r.points || 0),
          }));
          setRows(enriched);
          if (uid) {
            const idx = enriched.findIndex((r) => r.user_id === uid);
            if (idx >= 0) { setMyRank(idx + 1); setMe(enriched[idx]); }
          }
        }
      } finally { setLoading(false); }
    })();
  }, [uid]);

  return (
    <div className="relative min-h-full">

      {/* Ambient bg */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      <div className="relative px-4 pt-5 pb-6">

        {/* Header */}
        <div className="mb-6">
          <p className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-800/60">Monthly</p>
          <h1 className="text-[26px] font-black tracking-tight flex items-center gap-2" style={{ color: 'hsl(30 60% 18%)' }}>
            <Crown className="w-6 h-6 text-amber-500 drop-shadow-sm" />
            Royal Rankings
          </h1>
          <p className="text-[12px] font-semibold text-slate-500 mt-0.5">Top champions of the realm this moon</p>
        </div>

        {/* My rank card */}
        {myRank && me && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-2xl overflow-hidden shadow-md ring-1 ring-amber-300/50"
            style={{ background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
          >
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 ring-2 ring-white/40 flex items-center justify-center font-black text-xl text-white shrink-0">
                #{myRank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-[15px] truncate">{me.username}</p>
                <p className="text-[11px] text-white/80 font-bold mt-0.5">{me.points.toLocaleString()} gems this moon</p>
              </div>
              <Shield className="w-5 h-5 text-white/70 shrink-0" />
            </div>
          </motion.div>
        )}

        {/* Top 3 podium */}
        {!loading && rows.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-5">
            {[rows[1], rows[0], rows[2]].map((row, podiumIdx) => {
              const actualRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
              const heights   = ['h-24', 'h-32', 'h-20'];
              const p = PODIUM_COLORS[actualRank - 1];
              const Icon = p.icon;
              const isMe = row?.user_id === uid;
              return (
                <motion.div
                  key={row?.user_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumIdx * 0.08 }}
                  className={cn('flex-1 flex flex-col items-center rounded-2xl pt-3 pb-2 ring-2', heights[podiumIdx], p.ring,
                    isMe ? 'ring-offset-2 scale-[1.02]' : ''
                  )}
                  style={{ background: `linear-gradient(180deg, hsl(38 60% 95%), hsl(38 40% 90%))` }}
                >
                  <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br mb-1.5 ring-2', p.bg, p.ring)}>
                    <Icon className={cn('w-4 h-4 drop-shadow-sm', p.label)} />
                  </div>
                  <p className="text-[10px] font-black truncate max-w-full px-1 text-center" style={{ color: 'hsl(220 50% 15%)' }}>
                    {row?.username?.split(' ')[0]}
                  </p>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">{row?.points?.toLocaleString()} 💎</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full list */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-sm font-black uppercase tracking-widest text-slate-400 animate-pulse">Summoning court records…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 rounded-2xl bg-white/70 ring-1 ring-black/[0.06]">
            <p className="text-slate-500 font-semibold">No champion has claimed glory this moon. Be first!</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.slice(0, 50).map((row, i) => {
              const rank = i + 1;
              const isMe = row.user_id === uid;
              return (
                <motion.li
                  key={row.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-3.5 py-3 ring-1',
                    isMe
                      ? 'bg-amber-50 ring-amber-300 shadow-sm'
                      : 'bg-white/75 ring-black/[0.05]'
                  )}
                >
                  <RankBadge rank={rank} size="sm" />
                  <p className={cn('flex-1 font-black truncate text-[14px]', isMe ? 'text-amber-900' : 'text-slate-800')}>
                    {row.username}
                    {isMe && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">You</span>}
                  </p>
                  <p className="font-black text-[13px] tabular-nums text-amber-700">{row.points.toLocaleString()} 💎</p>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}