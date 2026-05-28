import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Sparkles, Calendar, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak, questionsAnswered } = usePersistentQuizStats();
  const [profile, setProfile] = useState<{ username: string; gems: number; daily: number; monthly: number } | null>(null);
  const uid = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      const [p, d, m] = await Promise.all([
        supabase.from('profiles').select('username, points, gems_balance').eq('id', uid).maybeSingle(),
        supabase.from('daily_points').select('points').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('monthly_points').select('points').eq('user_id', uid).eq('month', month).maybeSingle(),
      ]);
      setProfile({
        username: (p.data as any)?.username || 'Player',
        gems: Number((p.data as any)?.gems_balance ?? (p.data as any)?.points ?? 0),
        daily: Number((d.data as any)?.points ?? 0),
        monthly: Number((m.data as any)?.points ?? 0),
      });
    })();
  }, [uid]);

  const signOut = async () => {
    haptics('warning');
    await supabase.auth.signOut();
    [STORAGE_KEYS.USER_ID, STORAGE_KEYS.USER_NAME, STORAGE_KEYS.USER_GEMS, STORAGE_KEYS.USER_ROLE]
      .forEach((k) => localStorage.removeItem(k));
    navigate('/login');
  };

  if (!uid) {
    return (
      <div className="px-4 pt-10 pb-32 text-center">
        <Mascot mood="happy" size={120} className="mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Join CuizIN</h1>
        <p className="text-muted-foreground mb-6">Sign in to save your gems, climb the leaderboard, and win monthly prizes.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/login')}
          className="w-full rounded-2xl py-3 font-bold text-primary-foreground bg-gradient-to-r from-primary to-purple-500 shadow-lg"
        >
          Sign in / Sign up
        </motion.button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-32">
      {/* Hero */}
      <div className="flex items-center gap-4 mb-6">
        <Mascot mood={streak >= 3 ? 'celebrating' : 'happy'} size={80} />
        <div>
          <h1 className="text-2xl font-bold">{profile?.username || '…'}</h1>
          <p className="text-sm text-muted-foreground">{(profile?.gems ?? 0).toLocaleString()} gems</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Sparkles} label="Today" value={`${profile?.daily ?? 0} 💎`} color="from-primary to-purple-500" />
        <StatCard icon={Trophy} label="This month" value={`${profile?.monthly ?? 0} 💎`} color="from-amber-400 to-orange-500" />
        <StatCard icon={Flame} label="Streak" value={String(streak)} color="from-red-500 to-pink-500" />
        <StatCard icon={Calendar} label="Answered" value={String(questionsAnswered)} color="from-emerald-500 to-teal-500" />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={signOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-destructive border border-destructive/40"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </motion.button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl p-4 bg-card border border-border"
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gradient-to-br ${color} opacity-20 blur-xl`} />
      <Icon className="w-5 h-5 mb-2 text-primary" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-lg">{value}</p>
    </motion.div>
  );
}