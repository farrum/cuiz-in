import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal } from 'lucide-react';
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
        const { data } = await supabase
          .from('monthly_points')
          .select('user_id, points')
          .eq('month', month)
          .order('points', { ascending: false })
          .limit(50);

        if (data && data.length) {
          const ids = data.map((r) => r.user_id);
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, username, display_name')
            .in('id', ids);
          const byId = new Map((profs || []).map((p: any) => [p.id, p.display_name || p.username]));
          const enriched: Row[] = data.map((r: any) => ({
            user_id: r.user_id,
            username: byId.get(r.user_id) || 'Player',
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
      <h1 className="text-2xl font-bold mb-1">Monthly Leaderboard</h1>
      <p className="text-sm text-muted-foreground mb-5">Top players this month</p>

      {myRank && me && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl p-4 bg-gradient-to-r from-primary/15 to-purple-500/15 border border-primary/30 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            #{myRank}
          </div>
          <div className="flex-1">
            <p className="font-bold">{me.username} <span className="text-xs text-muted-foreground">(you)</span></p>
            <p className="text-xs text-muted-foreground">{me.points.toLocaleString()} gems this month</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No one has scored this month yet. Be first!</p>
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
                  'flex items-center gap-3 rounded-xl p-3 border bg-card',
                  isMe ? 'border-primary/50' : 'border-border'
                )}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-muted">
                  {rank === 1 ? <Crown className="w-4 h-4 text-amber-500" /> :
                   rank === 2 ? <Medal className="w-4 h-4 text-slate-400" /> :
                   rank === 3 ? <Medal className="w-4 h-4 text-amber-700" /> :
                   `#${rank}`}
                </div>
                <p className="flex-1 font-semibold truncate">{row.username}</p>
                <p className="text-sm font-bold text-amber-600 tabular-nums">{row.points.toLocaleString()} 💎</p>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}