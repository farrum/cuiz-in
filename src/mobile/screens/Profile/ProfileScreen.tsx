import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Sparkles, Calendar, Flame, Pencil, Users, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { IdleMascot } from '@/mobile/mascots/IdleMascot';
import { useMoodEngine } from '@/mobile/mascots/useMoodEngine';
import { moodFromAccuracy, characterOfTheDay } from '@/mobile/mascots/registry';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { ProfileEditSheet, MobileProfile } from './ProfileEditSheet';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak, questionsAnswered } = usePersistentQuizStats();
  const { accuracy, sample } = useMoodEngine();
  const mirrorMood = moodFromAccuracy(accuracy, sample);
  const [profile, setProfile] = useState<{ name: string; username: string; gems: number; daily: number; monthly: number } | null>(null);
  const [reports, setReports] = useState<{
    dayAttempted: number; dayCorrect: number;
    monthAttempted: number; monthCorrect: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<MobileProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const uid = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;
  const userRole = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ROLE) : null;
  const isTeamLeader = userRole === 'team_leader' || userRole === 'teamleader' || userRole === 'junior_team_leader';

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      const [p, d, m] = await Promise.all([
        supabase.from('profiles').select('username, points, display_name, email, phone, upi_id, profile_picture, date_of_birth').eq('id', uid).maybeSingle(),
        supabase.from('daily_points').select('points').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('monthly_points').select('points').eq('user_id', uid).eq('month', month).maybeSingle(),
      ]);
      const pd = p.data as any;
      setProfile({
        name: pd?.display_name || pd?.username || 'Player',
        username: pd?.username || 'Player',
        gems: Number(pd?.points ?? 0),
        daily: Number((d.data as any)?.points ?? 0),
        monthly: Number((m.data as any)?.points ?? 0),
      });

      // Questions attempted / correct — today and this month
      const dayStart = `${today}T00:00:00.000Z`;
      const monthStart = `${month}-01T00:00:00.000Z`;
      const [dAtt, dCorr, mAtt, mCorr] = await Promise.all([
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', monthStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', monthStart),
      ]);
      setReports({
        dayAttempted: dAtt.count ?? 0,
        dayCorrect: dCorr.count ?? 0,
        monthAttempted: mAtt.count ?? 0,
        monthCorrect: mCorr.count ?? 0,
      });

      setAvatarUrl(pd?.profile_picture || '');
      const { data: { session } } = await supabase.auth.getSession();
      const provider = session?.user?.app_metadata?.provider === 'google' ? 'google' : 'email';
      setEditProfile({
        username: pd?.username || '',
        display_name: pd?.display_name ?? null,
        email: pd?.email ?? session?.user?.email ?? null,
        phone: pd?.phone ?? null,
        upi_id: pd?.upi_id ?? null,
        profile_picture: pd?.profile_picture ?? null,
        date_of_birth: pd?.date_of_birth ?? null,
        provider,
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
        <MascotPlayer character={characterOfTheDay()} mood="cheer" size={140} className="mx-auto mb-4" />
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
        {avatarUrl ? (
          <img src={avatarUrl} alt={profile?.name ? `${profile.name}'s profile picture` : 'Your profile picture'} className="w-[90px] h-[90px] rounded-full object-cover border-2 border-border" />
        ) : (
          <IdleMascot size={90} override={streak >= 3 ? 'excited' : undefined} />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{profile?.name || '…'}</h1>
          {profile?.username && profile.username !== profile.name && (
            <p className="text-xs text-muted-foreground/80 truncate">@{profile.username}</p>
          )}
          <p className="text-sm text-muted-foreground">{(profile?.gems ?? 0).toLocaleString()} gems</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditOpen(true)}
          disabled={!editProfile}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-primary border border-primary/40 disabled:opacity-50"
        >
          <Pencil className="w-4 h-4" /> Edit
        </motion.button>
      </div>

      {sample > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <MascotPlayer character={characterOfTheDay()} mood={mirrorMood} size={64} noHalo />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Mood mirror</p>
            <p className="font-bold text-sm">
              {mirrorMood === 'excited' && "You're crushing it — keep going!"}
              {mirrorMood === 'cheer' && "Solid run. One more streak?"}
              {mirrorMood === 'neutral' && 'Steady. Play a quick round to warm up.'}
              {mirrorMood === 'sad' && 'Tough patch. Win one to cheer me up?'}
              {mirrorMood === 'angry' && 'Save us with a comeback! 💪'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Last {sample} answers · {Math.round(accuracy * 100)}% accuracy</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Sparkles} label="Today" value={`${profile?.daily ?? 0} 💎`} color="from-primary to-purple-500" />
        <StatCard icon={Trophy} label="This month" value={`${profile?.monthly ?? 0} 💎`} color="from-amber-400 to-orange-500" />
        <StatCard icon={Flame} label="Streak" value={String(streak)} color="from-red-500 to-pink-500" />
        <StatCard icon={Calendar} label="Answered" value={String(questionsAnswered)} color="from-emerald-500 to-teal-500" />
      </div>

      {isTeamLeader && (
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptics('light');
            navigate('/team-dashboard');
          }}
          className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-md">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-sm">Team Control Center</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {userRole === 'junior_team_leader' ? 'Junior Team Leader' : 'Main Team Leader'} Dashboard
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-indigo-500 animate-pulse" />
        </motion.div>
      )}

      {/* Reports */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Your reports</h2>
      <div className="space-y-3 mb-6">
        <ReportRow
          title="Today"
          attempted={reports?.dayAttempted ?? 0}
          correct={reports?.dayCorrect ?? 0}
          gems={profile?.daily ?? 0}
        />
        <ReportRow
          title="This month"
          attempted={reports?.monthAttempted ?? 0}
          correct={reports?.monthCorrect ?? 0}
          gems={profile?.monthly ?? 0}
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={signOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-destructive border border-destructive/40"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </motion.button>

      {editProfile && uid && (
        <ProfileEditSheet
          uid={uid}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={editProfile}
          onSaved={(next) => {
            setEditProfile(next);
            setAvatarUrl(next.profile_picture || '');
            setProfile((prev) => (prev ? { ...prev, username: next.username, name: next.display_name || next.username } : prev));
          }}
        />
      )}
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

function ReportRow({ title, attempted, correct, gems }: { title: string; attempted: number; correct: number; gems: number }) {
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-sm">{title}</p>
        <span className="text-xs text-muted-foreground">{accuracy}% accuracy</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold">{attempted}</p>
          <p className="text-[11px] text-muted-foreground">Attempted</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-600">{correct}</p>
          <p className="text-[11px] text-muted-foreground">Correct</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">{gems.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Gems</p>
        </div>
      </div>
    </div>
  );
}