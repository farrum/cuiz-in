import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';

type Row = { user_id: string; username?: string; points: number };

export default function LeaderboardScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState<Row | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const uid = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;

  useEffect(() => {
    (async () => {
      try {
        const month = new Date().toISOString().slice(0, 7);
        const { data } = await supabase.rpc('get_monthly_leaderboard', {
          _month: month,
          _limit: 50,
        });

        if (data && data.length) {
          const enriched: Row[] = data.map((r: any) => ({
            user_id: r.user_id,
            username: r.display_name || r.username || 'Player',
            points: Number(r.points || 0),
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
    <div className="px-4 pt-4 pb-32">
      <h1 className="text-xl font-bold mb-1 text-amber-400" style={{ fontFamily: "'Cinzel', serif" }}>
        <Crown className="w-5 h-5 inline mr-2 -mt-0.5 text-yellow-500" />Royal Rankings
      </h1>
      <p className="text-xs text-stone-500 mb-5 tracking-wide">Top champions of the realm this moon</p>

      {myRank && me && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl p-4 wooden-door flex items-center gap-3 !border-amber-700/60"
        >
          <div className="w-10 h-10 rounded-xl iron-frame bg-amber-900/60 text-amber-400 flex items-center justify-center font-black text-sm">
            #{myRank}
          </div>
          <div className="flex-1">
            <p className="font-bold text-stone-100">{me.username} <span className="text-[10px] text-stone-400">(you)</span></p>
            <p className="text-xs text-stone-300">{me.points.toLocaleString()} gems earned this moon</p>
          </div>
          <Shield className="w-5 h-5 text-amber-500 fill-amber-500/20" />
        </motion.div>
      )}

      {loading ? (
        <p className="text-center text-stone-350 py-10 font-semibold">Summoning the court records…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-stone-450 py-10 font-semibold">No champion has claimed glory this moon. Be first!</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, i) => {
            const rank = i + 1;
            const isMe = row.user_id === uid;
            return (
              <motion.li
                key={row.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  'flex items-center gap-3 rounded-xl p-3 wooden-door',
                  isMe && '!border-amber-700/60'
                )}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm iron-frame bg-stone-900">
                  {rank === 1 ? <Crown className="w-4 h-4 text-yellow-400" /> :
                   rank === 2 ? <Medal className="w-4 h-4 text-slate-300" /> :
                   rank === 3 ? <Medal className="w-4 h-4 text-amber-700" /> :
                   <span className="text-stone-400">#{rank}</span>}
                </div>
                <p className="flex-1 font-semibold truncate text-stone-100">{row.username}</p>
                <p className="text-sm font-bold text-amber-400 tabular-nums">{row.points.toLocaleString()} 💎</p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}