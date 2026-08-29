import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, Trophy, Sparkles, Calendar, Flame,
  Pencil, Users, ExternalLink, Shield, Award,
  CheckCircle2, XCircle, Gem, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { IdleMascot } from '@/mobile/mascots/IdleMascot';
import { useMoodEngine } from '@/mobile/mascots/useMoodEngine';
import { moodFromAccuracy, characterOfTheDay } from '@/mobile/mascots/registry';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { ProfileEditSheet, MobileProfile } from './ProfileEditSheet';
import ReferralPreview from '@/components/home/ReferralPreview';
import { cn } from '@/lib/utils';
import {
  ARMORY_ITEMS,
  getUserBalances,
  getPurchasedItems,
  getEquippedItems,
  getEquippedTitle,
} from '@/utils/shopData';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { StarCounter } from '@/mobile/components/StarCounter';

// ── Animated stat card with shimmer ──────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }: {
  icon: any; label: string; value: string; gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="rounded-2xl bg-white/80 ring-1 ring-black/[0.06] p-4 relative overflow-hidden"
    >
      {/* Accent circle */}
      <div
        aria-hidden
        className="absolute -right-3 -top-3 w-14 h-14 rounded-full opacity-15"
        style={{ background: gradient }}
      />
      {/* Shimmer sweep on mount */}
      <motion.span
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
        initial={{ backgroundPosition: '150% center' }}
        animate={{ backgroundPosition: ['-50% center', '150% center'] }}
        transition={{ duration: 1.8, delay: 0.3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
      />
      <Icon className="w-4.5 h-4.5 mb-2 opacity-70" style={{ color: 'hsl(30 60% 25%)' }} />
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
      <p className="font-black text-[17px] leading-tight" style={{ color: 'hsl(220 50% 15%)' }}>{value}</p>
    </motion.div>
  );
}

// ── Report row with animated bar ─────────────────────────────────────────────
function ReportRow({ title, attempted, correct, gems }: {
  title: string; attempted: number; correct: number; gems: number;
}) {
  const acc = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const pct = Math.min(100, acc);
  const barColor = acc >= 70 ? '#10b981' : acc >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-black/[0.06] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-black text-[14px]" style={{ color: 'hsl(220 50% 15%)' }}>{title}</p>
        <span className={cn(
          'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
          acc >= 70 ? 'bg-emerald-100 text-emerald-700'
            : acc >= 40 ? 'bg-amber-100 text-amber-700'
            : 'bg-rose-100 text-rose-700'
        )}>
          {acc}% accuracy
        </span>
      </div>
      {/* Animated accuracy bar */}
      <div className="h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor, position: 'relative', overflow: 'hidden' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          {/* shimmer sweep on the bar */}
          <motion.span
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.45) 55%, transparent 70%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.1, delay: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 5 }}
          />
        </motion.div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[18px] font-black" style={{ color: 'hsl(220 50% 15%)' }}>{attempted}</p>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Battles</p>
        </div>
        <div>
          <p className="text-[18px] font-black text-emerald-600">{correct}</p>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Victories</p>
        </div>
        <div>
          <p className="text-[18px] font-black text-amber-600">{gems.toLocaleString()}</p>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">Gems</p>
        </div>
      </div>
    </div>
  );
}

// ── Section title ────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="h-px flex-1 bg-amber-900/12 rounded-full" />
      <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/45">{children}</span>
      <span className="h-px flex-1 bg-amber-900/12 rounded-full" />
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak, questionsAnswered } = usePersistentQuizStats();
  const { accuracy, sample } = useMoodEngine();
  const mirrorMood = moodFromAccuracy(accuracy, sample);

  const [profile, setProfile] = useState<{
    name: string; username: string; gems: number; daily: number; monthly: number;
  } | null>(null);
  const [stars, setStars] = useState<number>(() => Number(localStorage.getItem('quiz_app_user_stars') || 50));
  const [reports, setReports] = useState<{
    dayAttempted: number; dayCorrect: number;
    monthAttempted: number; monthCorrect: number;
  } | null>(null);

  const [editOpen,    setEditOpen]    = useState(false);
  const [editProfile, setEditProfile] = useState<MobileProfile | null>(null);
  const [avatarUrl,   setAvatarUrl]   = useState('');
  const [equipped,    setEquipped]    = useState<Record<string, string>>({});
  const [equippedTitleId, setEquippedTitleId] = useState('');
  const [shopTrigger, setShopTrigger] = useState(0);

  const uid      = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;
  const userRole = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ROLE) : null;
  const isTeamLeader = ['admin', 'king', 'baron', 'knight', 'officer', 'team_leader', 'junior_team_leader'].includes(userRole || '');

  useEffect(() => {
    const { gems } = getUserBalances();
    setEquipped(getEquippedItems());
    setEquippedTitleId(getEquippedTitle());
    getPurchasedItems(); // warm cache
  }, [shopTrigger]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const today      = new Date().toISOString().slice(0, 10);
      const month      = new Date().toISOString().slice(0, 7);
      const dayStart   = `${today}T00:00:00.000Z`;
      const monthStart = `${month}-01T00:00:00.000Z`;

      const [p, d, m, dAtt, dCorr, mAtt, mCorr] = await Promise.all([
        supabase.from('profiles').select('username, points, display_name, email, phone, upi_id, profile_picture, date_of_birth, stars').eq('id', uid).maybeSingle(),
        supabase.from('daily_points').select('points').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('monthly_points').select('points').eq('user_id', uid).eq('month', month).maybeSingle(),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', monthStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', monthStart),
      ]);

      const pd = p.data as any;
      setProfile({
        name: pd?.display_name || pd?.username || 'Player',
        username: pd?.username || 'Player',
        gems: Number(pd?.points ?? 0),
        daily:   Number((d.data as any)?.points ?? 0),
        monthly: Number((m.data as any)?.points ?? 0),
      });
      if (pd?.stars !== undefined) {
        setStars(Number(pd.stars));
        localStorage.setItem('quiz_app_user_stars', String(pd.stars));
      }
      setReports({
        dayAttempted:   dAtt.count ?? 0,
        dayCorrect:     dCorr.count ?? 0,
        monthAttempted: mAtt.count ?? 0,
        monthCorrect:   mCorr.count ?? 0,
      });
      setAvatarUrl(pd?.profile_picture || '');

      const { data: { session } } = await supabase.auth.getSession();
      const provider = session?.user?.app_metadata?.provider === 'google' ? 'google' : 'email';
      setEditProfile({
        username:         pd?.username     || '',
        display_name:     pd?.display_name ?? null,
        email:            pd?.email        ?? session?.user?.email ?? null,
        phone:            pd?.phone        ?? null,
        upi_id:           pd?.upi_id       ?? null,
        profile_picture:  pd?.profile_picture ?? null,
        date_of_birth:    pd?.date_of_birth   ?? null,
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

  // ── Guest state ────────────────────────────────────────────────────────────
  if (!uid) {
    return (
      <div className="relative min-h-full">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />
        <div className="relative flex flex-col items-center px-6 pt-16 pb-8 text-center">
          <MascotPlayer character={characterOfTheDay()} mood="cheer" size={130} className="mb-5" />
          <h1 className="text-[26px] font-black tracking-tight mb-2" style={{ color: 'hsl(30 60% 18%)' }}>
            Join the Kingdom
          </h1>
          <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[260px] leading-snug">
            Pledge your allegiance to save gems, climb the Royal Rankings &amp; win monthly bounties.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/login')}
            className="w-full max-w-xs rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white"
            style={{
              background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 45%))',
              boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.4)',
            }}
          >
            ⚔️ Enter the Realm
          </motion.button>
        </div>
      </div>
    );
  }

  if (uid && profile === null) {
    return (
      <div className="relative min-h-full">
        {/* Ambient background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

        {/* ── Sticky Top Bar ── glassmorphic ─────────────────────────────── */}
        <div
          className="sticky top-0 z-30 px-4 py-2.5"
          style={{
            background: 'rgba(255, 251, 240, 0.80)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: '1px solid rgba(212, 170, 80, 0.22)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
                Herald Profile
              </span>
            </div>
            {/* HUD stats with soft glow ring */}
            <div
              className="flex items-center gap-1 rounded-2xl px-2 py-1"
              style={{
                background: 'rgba(255, 248, 220, 0.70)',
                boxShadow: '0 0 0 1px rgba(212,170,60,0.25), 0 2px 8px rgba(212,170,60,0.12)',
              }}
            >
              <StreakFlame streak={streak} />
              <div className="w-[85px] h-[34px] bg-slate-200/50 rounded-full animate-pulse" />
              <div className="w-[85px] h-[34px] bg-slate-200/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        <div className="relative px-4 pt-5 pb-6 space-y-5">
          {/* Skeleton Hero Card */}
          <div className="rounded-2xl h-[160px] w-full animate-pulse"
            style={{
              background: 'linear-gradient(145deg, hsl(30 60% 15%), hsl(220 55% 15%))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div className="p-5 flex items-start gap-4">
              <div className="w-[76px] h-[76px] rounded-2xl bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-5 w-2/3 rounded bg-white/20" />
                <div className="h-3.5 w-1/2 rounded bg-white/10" />
                <div className="h-3 w-1/3 rounded bg-amber-400/30" />
              </div>
            </div>
          </div>

          {/* Skeleton Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[96px] rounded-2xl bg-white/80 ring-1 ring-black/[0.06] p-4 animate-pulse">
                <div className="w-5 h-5 rounded bg-amber-200/50 mb-2" />
                <div className="h-3 w-1/2 rounded bg-slate-200 mb-1.5" />
                <div className="h-4.5 w-2/3 rounded bg-amber-200/40" />
              </div>
            ))}
          </div>

          {/* Skeleton Court Mirror */}
          <div className="h-[80px] rounded-2xl bg-white/80 ring-1 ring-black/[0.06] p-4 animate-pulse flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-amber-200/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/4 rounded bg-slate-200" />
              <div className="h-3.5 w-3/4 rounded bg-amber-200/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const equippedFrame = ARMORY_ITEMS.find(item => item.id === equipped.avatar_frame);
  const equippedTitle = ARMORY_ITEMS.find(item => item.id === equippedTitleId);

  const mirrorMessage: Record<string, string> = {
    excited: "You're crushing it — keep going!",
    cheer:   "Solid run. One more quest?",
    neutral: 'Steady. Play a quick round to warm up.',
    sad:     'Tough patch. Win one to cheer me up?',
    angry:   'Save us with a comeback! 💪',
  };

  return (
    <div className="relative min-h-full">

      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(220 40% 92%) 100%)' }} />

      {/* ── Sticky Top Bar ── glassmorphic ─────────────────────────────── */}
      <div
        className="sticky top-0 z-30 px-4 py-2.5"
        style={{
          background: 'rgba(255, 251, 240, 0.80)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(212, 170, 80, 0.22)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        {/* Shimmer line along the bottom edge */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(212,170,80,0.4) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
              Herald Profile
            </span>
          </div>
          {/* HUD stats with soft glow ring */}
          <div
            className="flex items-center gap-1 rounded-2xl px-2 py-1"
            style={{
              background: 'rgba(255, 248, 220, 0.70)',
              boxShadow: '0 0 0 1px rgba(212,170,60,0.25), 0 2px 8px rgba(212,170,60,0.12)',
            }}
          >
            <StreakFlame streak={streak} />
            <GemCounter value={profile?.gems ?? 0} />
            <StarCounter value={stars} />
          </div>
        </div>
      </div>

      <div className="relative px-4 pt-5 pb-6 space-y-5">

        {/* ── Hero card ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-md ring-1 ring-black/[0.07]"
          style={{ background: 'linear-gradient(145deg, hsl(30 60% 18%), hsl(220 55% 18%))' }}
        >
          {/* Dot-grid texture overlay */}
          <div aria-hidden className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Avatar with spinning rank-tinted ring */}
              <div className="relative shrink-0">
                {/* Rotating conic gradient ring */}
                <motion.div
                  aria-hidden
                  className="absolute -inset-1.5 rounded-[20px]"
                  style={{
                    background: (
                      userRole === 'admin' || userRole === 'king'
                        ? 'conic-gradient(from 0deg, hsl(45 95% 55%), hsl(38 80% 70%), hsl(45 95% 55%))'
                        : userRole === 'baron' || userRole === 'team_leader'
                        ? 'conic-gradient(from 0deg, hsl(35 80% 55%), hsl(28 70% 70%), hsl(35 80% 55%))'
                        : 'conic-gradient(from 0deg, hsl(210 70% 60%), hsl(200 60% 75%), hsl(210 70% 60%))'
                    ),
                    filter: 'blur(1px)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                />
                <div className="relative w-[76px] h-[76px] rounded-2xl overflow-hidden shadow-lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={profile?.name ? `${profile.name}'s avatar` : 'Profile'}
                      className={cn('w-full h-full object-cover', equippedFrame?.previewClass)}
                    />
                  ) : (
                    <IdleMascot size={76} override={streak >= 3 ? 'excited' : undefined} />
                  )}
                </div>
                {equippedFrame && (
                  <span className="absolute -top-2 -right-2 text-xl select-none drop-shadow-md">
                    {equippedFrame.emoji}
                  </span>
                )}
              </div>

              {/* Name + title + gems */}
              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-[22px] font-black text-white leading-tight truncate">{profile?.name || '…'}</h1>
                {equippedTitle && (
                  <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 mt-1">
                    {equippedTitle.emoji} {equippedTitle.name.replace(' Title', '')}
                  </span>
                )}
                {profile?.username && profile.username !== profile.name && (
                  <p className="text-[12px] font-medium text-white/55 mt-1">@{profile.username}</p>
                )}
                <p className="text-[13px] font-black text-amber-300 mt-1.5">
                  {(profile?.gems ?? 0).toLocaleString()} 💎 gems
                </p>
              </div>

              {/* Edit button */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setEditOpen(true)}
                disabled={!editProfile}
                className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 bg-white/15 ring-1 ring-white/20 text-white text-[12px] font-black disabled:opacity-40"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </motion.button>
            </div>

            {/* Streak + role badges */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/20">
                <Flame className="w-3.5 h-3.5" /> {streak} day streak
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                <Shield className="w-3.5 h-3.5" /> {userRole ? userRole.replace('_', ' ') : 'Infantry'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" /> {questionsAnswered} battles
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Stats grid ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 gap-2.5"
        >
          <StatCard icon={Sparkles}  label="Today"       value={`${profile?.daily   ?? 0} 💎`} gradient="linear-gradient(135deg, hsl(270 70% 60%), hsl(300 70% 60%))" />
          <StatCard icon={Trophy}    label="This month"   value={`${profile?.monthly ?? 0} 💎`} gradient="linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 50%))" />
          <StatCard icon={Flame}     label="Streak"       value={String(streak)}             gradient="linear-gradient(135deg, hsl(350 85% 60%), hsl(330 80% 55%))" />
          <StatCard icon={Calendar}  label="Answered"     value={String(questionsAnswered)}   gradient="linear-gradient(135deg, hsl(160 70% 45%), hsl(180 70% 40%))" />
        </motion.div>

        {/* ── Court Mirror (mascot mood) ────────────────────────────── */}
        {sample > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 rounded-2xl bg-white/80 ring-1 ring-black/[0.06] px-4 py-3.5"
          >
            <MascotPlayer character={characterOfTheDay()} mood={mirrorMood} size={56} noHalo />
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Court Mirror</p>
              <p className="font-black text-[13px] leading-snug" style={{ color: 'hsl(220 50% 15%)' }}>
                {mirrorMessage[mirrorMood] ?? 'Play more to see your mood!'}
              </p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Last {sample} battles · {Math.round(accuracy * 100)}% accuracy
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Team Dashboard CTA ────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          whileTap={{ scale: 0.975 }}
          onClick={() => { haptics('light'); navigate('/team-dashboard'); }}
          className="w-full flex items-center gap-3 rounded-2xl bg-white/80 ring-1 ring-black/[0.06] px-4 py-3.5 text-left"
        >
          <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(240 60% 55%), hsl(270 65% 50%))' }}>
            <Users className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[14px] leading-tight" style={{ color: 'hsl(220 50% 15%)' }}>
              Team &amp; Squad Center
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
              {isTeamLeader ? `${userRole || 'baron'} Dashboard` : 'Build Your Squad & Recruits'}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
        </motion.button>

        {/* ── Referral ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <ReferralPreview />
        </motion.div>

        {/* ── Battle Records ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
        >
          <SectionTitle>Battle Records</SectionTitle>
          <div className="space-y-2.5">
            <ReportRow title="Today"      attempted={reports?.dayAttempted   ?? 0} correct={reports?.dayCorrect   ?? 0} gems={profile?.daily   ?? 0} />
            <ReportRow title="This month" attempted={reports?.monthAttempted ?? 0} correct={reports?.monthCorrect ?? 0} gems={profile?.monthly ?? 0} />
          </div>
        </motion.div>

        {/* ── Royal Shop link ──────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          whileTap={{ scale: 0.975 }}
          onClick={() => { haptics('light'); navigate('/shop'); }}
          className="w-full flex items-center gap-3 rounded-2xl overflow-hidden px-4 py-3.5 text-left relative"
          style={{ background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
        >
          {/* dot texture */}
          <div aria-hidden className="absolute inset-0 opacity-15 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <span className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/20 shrink-0">
            <Award className="w-5 h-5 text-white" />
          </span>
          <div className="relative flex-1 min-w-0">
            <p className="font-black text-[14px] text-white leading-tight">Royal Armory</p>
            <p className="text-[10px] text-white/75 font-bold uppercase tracking-wider mt-0.5">Buy Enhancements &amp; Avatars</p>
          </div>
          <ChevronRight className="relative w-4 h-4 text-white/70 shrink-0" />
        </motion.button>

        {/* ── Sign out ─────────────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.21 }}
          whileTap={{ scale: 0.97 }}
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-black text-[13px] text-rose-600 bg-white/80 ring-1 ring-rose-200 uppercase tracking-wide"
        >
          <LogOut className="w-4 h-4" /> Leave the Kingdom
        </motion.button>

      </div>

      {/* ── Edit Sheet ───────────────────────────────────────────────── */}
      {editProfile && uid && (
        <ProfileEditSheet
          uid={uid}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={editProfile}
          onSaved={(next) => {
            setEditProfile(next);
            setAvatarUrl(next.profile_picture || '');
            setProfile((prev) => prev ? { ...prev, username: next.username, name: next.display_name || next.username } : prev);
          }}
        />
      )}
    </div>
  );
}