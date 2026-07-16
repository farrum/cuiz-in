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
    <div className="px-4 pt-4 pb-32 bg-background min-h-full">
      <h1 className="text-2xl font-black mb-1 text-primary">
        <Crown className="w-6 h-6 inline mr-2 -mt-1 text-primary drop-shadow-sm" />Royal Rankings
      </h1>
      <p className="text-sm text-muted-foreground font-bold mb-6 tracking-wide">Top champions of the realm this moon</p>

      {myRank && me && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 panel-3d bg-primary/10 flex items-center gap-3 border-2 border-primary"
        >
          <div className="w-12 h-12 rounded-xl shadow-sm bg-primary text-white flex items-center justify-center font-black text-lg border-2 border-primary-foreground/20">
            #{myRank}
          </div>
          <div className="flex-1">
            <p className="font-black text-foreground text-lg tracking-tight">{me.username} <span className="text-[11px] text-muted-foreground uppercase">(you)</span></p>
            <p className="text-sm font-bold text-primary mt-0.5">{me.points.toLocaleString()} gems earned this moon</p>
          </div>
          <Shield className="w-6 h-6 text-primary drop-shadow-sm" />
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground font-black uppercase tracking-widest text-sm animate-pulse">Summoning the court records…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 panel-3d bg-white">
          <p className="text-muted-foreground font-bold">No champion has claimed glory this moon. Be first!</p>
        </div>
      ) : (
        <ul className="space-y-3">
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
                  'flex items-center gap-3 panel-3d p-3',
                  isMe ? 'bg-primary/5 border-2 border-primary' : 'bg-white'
                )}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-sm border-2 border-white bg-muted text-muted-foreground">
                  {rank === 1 ? <Crown className="w-5 h-5 text-yellow-500 drop-shadow-sm" /> :
                   rank === 2 ? <Medal className="w-5 h-5 text-slate-400 drop-shadow-sm" /> :
                   rank === 3 ? <Medal className="w-5 h-5 text-amber-600 drop-shadow-sm" /> :
                   <span>#{rank}</span>}
                </div>
                <p className="flex-1 font-black truncate text-foreground tracking-tight">{row.username}</p>
                <p className="text-base font-black text-primary tabular-nums tracking-wide">{row.points.toLocaleString()} 💎</p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}