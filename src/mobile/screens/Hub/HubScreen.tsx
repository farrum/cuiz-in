import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Calendar, Sparkles, Swords, Landmark, Users,
  ChevronRight, Flame, Star, Gem, LogIn, Crown,
  Disc3, ScrollText, ImageIcon, Coins, Dices,
  Gamepad2, Gift, KeyRound, Scale, CircleDot
} from 'lucide-react';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { MedievalAdvisors } from '@/mobile/components/MedievalAdvisors';
import { StarCounter } from '@/mobile/components/StarCounter';
import { EmberBackground } from '@/mobile/components/EmberBackground';
import { TiltCard } from '@/mobile/components/TiltCard';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import { showLevelPlayRewarded, isLevelPlayEnabled } from '@/mobile/ads/levelplay';
import { audioManager } from '@/utils/audioManager';
import { useToast } from '@/hooks/use-toast';
import { DailyBountyBoard } from '@/components/home/DailyBountyBoard';
import { getDailyTributeStatus, claimDailyTribute } from '@/services/dailyTributeService';

type Node = {
  id: string;
  label: string;
  to: string;
  icon?: any;
  emoji?: string;
  color: string;
  hint?: string;
  badge?: string;
};

const ROYAL_CHAMBERS: Node[] = [
  { id: 'quests',   label: 'Quest Board',       to: '/empire-quests',  icon: Swords,   color: 'from-amber-500 to-orange-600',   hint: 'Conquer locked campaign stages & earn star crowns' },
  { id: 'kingdoms', label: 'Kingdoms Dynasty',  to: '/kingdoms',       icon: Landmark, color: 'from-blue-600 to-indigo-700',    hint: 'Establish your faction & compete in rankings' },
  { id: 'team',     label: 'Team & Squad',       to: '/team-dashboard', icon: Users,    color: 'from-indigo-500 to-purple-700',  hint: 'Build your squad & earn recurring gems', badge: 'Squad' },
  { id: 'quiz',     label: 'Quick Quiz',         to: '/quiz',           icon: Sparkles, color: 'from-violet-500 to-pink-600',    hint: 'Answer questions & build streaks' },
  { id: 'daily',    label: 'Daily Challenge',    to: '/daily',          icon: Calendar, color: 'from-rose-500 to-red-600',       hint: 'Complete the daily special for 2× rewards!', badge: 'HOT' },
];

interface TavernGameNode {
  id: string;
  label: string;
  subtitle: string;
  to: string;
  icon: any;
  gradient: string;
  accentGlow: string;
  badge?: string;
  badgeColor?: string;
}

const TAVERN_GAMES: TavernGameNode[] = [
  { 
    id: 'wheel', 
    label: 'Spin Wheel', 
    subtitle: 'Spin & Win Gems', 
    to: '/game/wheel', 
    icon: Disc3, 
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    accentGlow: 'rgba(16, 185, 129, 0.4)',
    badge: 'Daily',
    badgeColor: 'bg-emerald-400 text-emerald-950',
  },
  { 
    id: 'scratch', 
    label: 'Scratch Card', 
    subtitle: 'Instant Stars', 
    to: '/game/scratch', 
    icon: Gift, 
    gradient: 'from-amber-500 via-orange-500 to-amber-700',
    accentGlow: 'rgba(245, 158, 11, 0.4)',
    badge: 'Daily',
    badgeColor: 'bg-amber-300 text-amber-950',
  },
  { 
    id: 'true-false', 
    label: 'True / False', 
    subtitle: 'Speed Logic', 
    to: '/game/true-false', 
    icon: Scale, 
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    accentGlow: 'rgba(2, 132, 199, 0.4)',
    badge: 'New',
    badgeColor: 'bg-cyan-300 text-cyan-950',
  },
  { 
    id: 'image', 
    label: 'Image Trivia', 
    subtitle: 'Visual Puzzle', 
    to: '/game/image', 
    icon: ImageIcon, 
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
    accentGlow: 'rgba(168, 85, 247, 0.4)',
  },
  { 
    id: 'slot', 
    label: 'Slot Machine', 
    subtitle: '777 Jackpot', 
    to: '/game/slot', 
    icon: Gamepad2, 
    gradient: 'from-rose-600 via-red-600 to-amber-700',
    accentGlow: 'rgba(225, 29, 72, 0.4)',
    badge: 'Hot',
    badgeColor: 'bg-rose-300 text-rose-950',
  },
  { 
    id: 'plinko', 
    label: 'Plinko Board', 
    subtitle: 'Bounce & Earn', 
    to: '/game/plinko', 
    icon: CircleDot, 
    gradient: 'from-teal-600 via-emerald-600 to-green-700',
    accentGlow: 'rgba(13, 148, 136, 0.4)',
  },
  { 
    id: 'rps', 
    label: 'Rock Paper Scissors', 
    subtitle: 'Tavern Duel', 
    to: '/game/rps', 
    icon: Swords, 
    gradient: 'from-indigo-600 via-violet-600 to-purple-800',
    accentGlow: 'rgba(99, 102, 241, 0.4)',
  },
  { 
    id: 'treasure', 
    label: 'Treasure Chest', 
    subtitle: 'Mystery Loot', 
    to: '/game/treasure', 
    icon: Crown, 
    gradient: 'from-yellow-500 via-amber-600 to-orange-800',
    accentGlow: 'rgba(234, 179, 8, 0.4)',
  },
  { 
    id: 'coinflip', 
    label: 'Coin Flip', 
    subtitle: 'Double Gems', 
    to: '/game/coinflip', 
    icon: Coins, 
    gradient: 'from-amber-500 via-yellow-600 to-orange-700',
    accentGlow: 'rgba(217, 119, 6, 0.4)',
  },
  { 
    id: 'diceroll', 
    label: 'Dice Roll', 
    subtitle: 'Fortune Strike', 
    to: '/game/diceroll', 
    icon: Dices, 
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    accentGlow: 'rgba(79, 70, 229, 0.4)',
    badge: 'Hot',
    badgeColor: 'bg-pink-300 text-pink-950',
  },
  { 
    id: 'riddlevault', 
    label: 'Riddle Vault', 
    subtitle: 'Solve Daily Lore', 
    to: '/game/riddlevault', 
    icon: KeyRound, 
    gradient: 'from-stone-700 via-amber-900 to-stone-900',
    accentGlow: 'rgba(120, 53, 15, 0.4)',
    badge: 'Daily',
    badgeColor: 'bg-amber-300 text-amber-950',
  },
];

// ── Stagger animation helpers ───────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
});

const popIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  transition: { delay, type: 'spring' as const, stiffness: 260, damping: 22 },
});

// ── Section heading ──────────────────────────────────────────────────────────
function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)}>
      <span className="h-px flex-1 bg-amber-900/15 rounded-full" />
      <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/50">
        {children}
      </span>
      <span className="h-px flex-1 bg-amber-900/15 rounded-full" />
    </div>
  );
}

export default function HubScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak } = usePersistentQuizStats();
  const [gems,  setGems]  = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [stars, setStars] = useState<number>(() => Number(localStorage.getItem('quiz_app_user_stars') || 50));
  const [name,  setName]  = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Adventurer');

  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [activeId,     setActiveId]     = useState<string | null>(null);

  const [showCheckInModal,    setShowCheckInModal]    = useState(false);
  const [checkInRewardStars,  setCheckInRewardStars]  = useState(0);
  const [checkInStreak,       setCheckInStreak]       = useState(0);
  const [showRatingModal,      setShowRatingModal]     = useState(false);
  const [bountyClaimPending, setBountyClaimPending] = useState<{
    taskId: string;
    gemsReward: number;
    starsReward: number;
    shardsReward: number;
    shardType: string;
  } | null>(null);
  const [bountyAdShowing, setBountyAdShowing] = useState(false);

  const { toast } = useToast();
  const [baronTasks, setBaronTasks] = useState<any[]>([]);

  // ── Task loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadTasks = async () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;

      const { data, error } = await supabase
        .from('empire_tasks' as any)
        .select('*')
        .or(`assigned_to.eq.${userId},assigned_to.is.null`)
        .neq('status', 'claimed');

      if (!error && data) {
        const { data: userProgressData } = await supabase
          .from('user_task_progress' as any)
          .select('*')
          .eq('user_id', userId);

        const progressMap = new Map<string, { currentCount: number; status: string }>();
        if (userProgressData) {
          userProgressData.forEach((up: any) => {
            progressMap.set(up.task_id, { currentCount: up.current_count, status: up.status });
          });
        }

        const mapped = data.map((t: any) => {
          const key = `cuizin_user_task_${userId}_${t.id}`;
          let localProg: any = null;
          try { localProg = JSON.parse(localStorage.getItem(key) || 'null'); } catch { localProg = null; }
          const dbProg = progressMap.get(t.id);
          return {
            id: t.id,
            title: t.title,
            description: t.description || '',
            targetCount: t.target_count,
            currentCount: dbProg?.currentCount ?? localProg?.currentCount ?? 0,
            type: t.type,
            rewardGems:   t.reward_gems,
            rewardStars:  t.reward_stars,
            rewardShards: t.reward_shards,
            shardType: t.shard_type,
            status: (dbProg?.status ?? localProg?.status ?? 'active') as 'active' | 'completed' | 'claimed',
            assignedTo: t.assigned_to || 'all',
          };
        });
        setBaronTasks(mapped);
      }
    };

    const handleAction = async (e: Event) => {
      const type = (e as CustomEvent).detail?.type;
      if (!type) return;
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;
      try {
        const { data: tasks, error } = await supabase
          .from('empire_tasks' as any)
          .select('*')
          .eq('type', type)
          .or(`assigned_to.eq.${userId},assigned_to.is.null`);
        if (!error && tasks) {
          for (const task of (tasks as any[])) {
            const key = `cuizin_user_task_${userId}_${task.id}`;
            let existing: any = { currentCount: 0, status: 'active' };
            try { existing = JSON.parse(localStorage.getItem(key) || '') || existing; } catch {}
            if (existing.status === 'claimed') continue;
            const newCount = (existing.currentCount || 0) + 1;
            const isCompleted = newCount >= task.target_count;
            const newStatus = isCompleted ? 'completed' : 'active';
            localStorage.setItem(key, JSON.stringify({ currentCount: newCount, status: newStatus }));
            await supabase.from('user_task_progress' as any).upsert({
              task_id: task.id, user_id: userId,
              current_count: newCount, target_count: task.target_count,
              status: newStatus, last_updated: new Date().toISOString(),
            });
            if (isCompleted && existing.status !== 'completed') {
              toast({ title: 'Contract Completed!', description: 'Open the Hub to claim your reward!' });
            }
          }
          loadTasks();
        }
      } catch (err) { console.error(err); }
    };

    loadTasks();
    window.addEventListener('baronTasksUpdated', loadTasks);
    window.addEventListener('baronTaskAction' as any, handleAction);
    return () => {
      window.removeEventListener('baronTasksUpdated', loadTasks);
      window.removeEventListener('baronTaskAction' as any, handleAction);
    };
  }, [gems, stars]);

  const executeClaimTask = async (taskId: string, gemsReward: number, starsReward: number, shardsReward: number, shardType: string, isDoubled = false) => {
    haptics('success');
    audioManager.playSFX('chest');
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;
      await supabase.from('user_task_progress' as any).upsert({
        task_id: taskId, user_id: userId, status: 'claimed', last_updated: new Date().toISOString(),
      });
      const { data } = await supabase
        .from('empire_tasks' as any).select('*').or(`assigned_to.eq.${userId},assigned_to.is.null`);
      if (data) {
        const { data: upd } = await supabase.from('user_task_progress' as any).select('*').eq('user_id', userId);
        const claimedIds = new Set((upd || []).filter((u: any) => u.status === 'claimed').map((u: any) => u.task_id));
        setBaronTasks(data.filter((t: any) => !claimedIds.has(t.id)).map((t: any) => ({
          id: t.id, title: t.title, description: t.description || '',
          targetCount: t.target_count, currentCount: t.current_count, type: t.type,
          rewardGems: t.reward_gems, rewardStars: t.reward_stars, rewardShards: t.reward_shards,
          shardType: t.shard_type, status: t.status, assignedTo: t.assigned_to || 'all',
        })));
      }
    } catch (e) { console.error(e); }
    const newGems = gems + gemsReward;
    const newStars = stars + starsReward;
    setGems(newGems); setStars(newStars);
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(newGems));
    localStorage.setItem('quiz_app_user_stars', String(newStars));
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
    if (shardsReward > 0) {
      const key = `advisor_shards_${shardType.toLowerCase()}`;
      localStorage.setItem(key, String(Number(localStorage.getItem(key) || '0') + shardsReward));
      window.dispatchEvent(new CustomEvent('shardsUpdated'));
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await (supabase as any).from('profiles').update({ points: newGems, stars: newStars }).eq('id', session.session.user.id);
      }
    } catch (e) { console.warn(e); }
    toast({
      title: isDoubled ? '⚔️ Bounty Doubled!' : '⚔️ Contract Claimed!',
      description: `+${gemsReward} 💎 · +${starsReward} ⭐ · +${shardsReward} ${shardType} Shards`
    });
  };

  const handleClaimTask = async (taskId: string, gemsReward: number, starsReward: number, shardsReward: number, shardType: string) => {
    if (Capacitor.isNativePlatform() && gemsReward > 0 && isLevelPlayEnabled) {
      setBountyClaimPending({ taskId, gemsReward, starsReward, shardsReward, shardType });
    } else {
      await executeClaimTask(taskId, gemsReward, starsReward, shardsReward, shardType);
    }
  };

  const checkDailyTribute = async (uid?: string | null) => {
    const status = await getDailyTributeStatus(uid);
    if (status.canClaim && !sessionStorage.getItem('daily_tribute_modal_dismissed')) {
      setCheckInRewardStars(status.rewardStars);
      setCheckInStreak(status.streak);
      setTimeout(() => {
        setShowCheckInModal(true);
        haptics('success');
        try {
          import('canvas-confetti').then((m) => m.default({ particleCount: 70, spread: 55, origin: { y: 0.55 } }));
        } catch {}
      }, 1200);
    }
  };

  const handleClaimDailyTribute = async () => {
    haptics('medium');
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID) || 'guest';
    const result = await claimDailyTribute(uid);
    if (result.success) {
      setStars((prev) => prev + result.rewardStars);
      toast({
        title: '👑 Daily Tribute Claimed!',
        description: `+${result.rewardStars} Stars added to your royal treasury!`,
      });
    }
    sessionStorage.setItem('daily_tribute_modal_dismissed', 'true');
    setShowCheckInModal(false);
  };

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) {
      checkDailyTribute(null);
      return;
    }
    supabase.from('profiles').select('username, display_name, points, stars').eq('id', uid).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const balance = (data as any).points ?? 0;
          const starsBalance = (data as any).stars ?? 0;
          setGems(balance);
          setStars(starsBalance);
          const dn = (data as any).display_name || (data as any).username || 'Adventurer';
          setName(dn);
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(balance));
          localStorage.setItem('quiz_app_user_stars', String(starsBalance));
          localStorage.setItem(STORAGE_KEYS.USER_STARS, String(starsBalance));
          localStorage.setItem(STORAGE_KEYS.USER_NAME, dn);
          checkDailyTribute(uid);
        }
      });
  }, []);

  useEffect(() => {
    const handleSync = () => {
      const g = Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
      const s = Number(localStorage.getItem('quiz_app_user_stars') || localStorage.getItem(STORAGE_KEYS.USER_STARS) || '0');
      setGems(g);
      setStars(s);
    };
    window.addEventListener('gemsUpdated', handleSync);
    window.addEventListener('starsUpdated', handleSync);
    return () => {
      window.removeEventListener('gemsUpdated', handleSync);
      window.removeEventListener('starsUpdated', handleSync);
    };
  }, []);

  useEffect(() => {
    const lifetimeWins = Number(localStorage.getItem('cuizin_lifetime_wins') || '0');
    const isRated = localStorage.getItem('cuizin_app_rated') === 'true';
    const isPromptShownThisSession = sessionStorage.getItem('rating_prompt_shown') === 'true';
    
    if (lifetimeWins >= 5 && !isRated && !isPromptShownThisSession && !showCheckInModal) {
      const timer = setTimeout(() => {
        setShowRatingModal(true);
        sessionStorage.setItem('rating_prompt_shown', 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showCheckInModal]);

  const isLoggedIn = !!localStorage.getItem(STORAGE_KEYS.USER_ID);
  const activeTasks = baronTasks.filter(t => t.status !== 'claimed');

  return (
    <div className="relative min-h-full overflow-hidden">

      {/* ── Ambient background gradient + Ember particle atmosphere ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(160deg, hsl(38 60% 93%) 0%, hsl(24 49% 88%) 50%, hsl(200 40% 90%) 100%)',
        }}
      />
      <EmberBackground count={20} />

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
            <img src="/cuizin-logo.png" alt="CuizIN" className="h-7 w-auto object-contain" draggable={false} />
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
            <GemCounter value={gems} />
            <StarCounter value={stars} />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────── */}
      <div className="relative px-4 pt-5 pb-6 space-y-7">

        {/* ── Hero: Welcome + Character ─────────────────────────────── */}
        <motion.section {...fadeUp(0)}>
          {/* Welcome text */}
          <div className="mb-3">
            <p className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-800/60">Welcome back,</p>
            <h1 className="text-[26px] font-black leading-tight tracking-tight"
              style={{ color: 'hsl(30 60% 18%)' }}>
              {name}
            </h1>
          </div>

          {/* Character Banner — full-width, taller on the revamped hub */}
          <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/10">
            <MedievalCharacterBanner compact />
          </div>

          {/* Guest CTA */}
          {!isLoggedIn && (
            <motion.button
              {...fadeUp(0.05)}
              onClick={() => { haptics('medium'); navigate('/login'); }}
              className="mt-3 w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
              style={{
                background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 50%))',
                boxShadow: '0 4px 0 hsl(30 80% 38%), 0 6px 16px hsl(45 60% 50% / 0.35)',
              }}
            >
              <LogIn className="w-5 h-5 text-white/90 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm tracking-tight">Pledge Your Allegiance</p>
                <p className="text-[11px] text-white/80 font-bold">Sign in to save gems & climb the ranks</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 shrink-0" />
            </motion.button>
          )}
        </motion.section>

        {/* ── Royal Chambers (main modes) ───────────────────────────── */}
        <motion.section {...fadeUp(0.06)}>
          <SectionTitle>Royal Chambers</SectionTitle>
          <div className="space-y-2.5">
            {ROYAL_CHAMBERS.map((node, i) => {
              const Icon = node.icon!;
              const isHot = node.badge === 'HOT';
              return (
                <TiltCard
                  key={node.id}
                  maxTilt={6}
                  glareIntensity={0.2}
                  hoverScale={1.015}
                  className="relative w-full rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #fff 0%, hsl(38 60% 98%) 100%)',
                    boxShadow: '0 4px 0 rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)',
                  }}
                  onClick={() => { haptics('medium'); audioManager.playSFX('click'); navigate(node.to); }}
                >
                  <motion.div
                    {...popIn(i * 0.055)}
                    className="relative flex items-center gap-3.5 px-4 py-3.5 text-left group"
                  >
                    {/* Animated colour accent strip */}
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.06, duration: 0.35, ease: 'easeOut' }}
                      style={{ transformOrigin: 'top' }}
                      className={cn('absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b', node.color)}
                    />

                    {/* Icon emblem */}
                    <div className={cn(
                      'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-white bg-gradient-to-br',
                      node.color
                    )} style={{ boxShadow: '0 3px 8px rgba(0,0,0,0.18)' }}>
                      <Icon className="w-5 h-5 drop-shadow-sm" strokeWidth={2.2} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[15px] leading-tight" style={{ color: 'hsl(220 50% 15%)' }}>
                        {node.label}
                      </p>
                      <p className="text-[11px] font-semibold mt-0.5 leading-tight text-slate-500 truncate">
                        {node.hint}
                      </p>
                    </div>

                    {/* Badge + Chevron */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {node.badge && (
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full',
                          isHot
                            ? 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse'
                            : 'bg-amber-100 text-amber-700 border border-amber-300'
                        )}>
                          {node.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </motion.div>
                </TiltCard>
              );
            })}
          </div>
        </motion.section>

        {/* ── Battle Council (Advisors) ─────────────────────────────── */}
        <motion.section {...fadeUp(0.10)}>
          <SectionTitle>Your Battle Council</SectionTitle>
          <MedievalAdvisors
            onAdvisorTap={(advisor) => {
              const quote = advisor.quotes[Math.floor(Math.random() * advisor.quotes.length)];
              setActiveSpeech(quote);
              setActiveId(advisor.id);
              setTimeout(() => { setActiveSpeech(null); setActiveId(null); }, 3500);
            }}
          />
        </motion.section>

        {/* ── Active Contracts ──────────────────────────────────────── */}
        {activeTasks.length > 0 && (
          <motion.section {...fadeUp(0.13)}>
            <SectionTitle>Active Contracts</SectionTitle>
            <div className="space-y-2.5">
              {activeTasks.map((task) => {
                const pct = Math.min(100, (task.currentCount / task.targetCount) * 100);
                const isComplete = task.status === 'completed';
                return (
                  <div
                    key={task.id}
                    className="relative rounded-2xl bg-white/80 ring-1 ring-black/[0.06] shadow-sm p-4 overflow-hidden"
                  >
                    {/* Completion shimmer */}
                    {isComplete && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/60 to-transparent pointer-events-none" />
                    )}

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-amber-800 uppercase tracking-wide truncate">
                          📜 {task.title}
                        </p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {isComplete ? (
                        <Button
                          onClick={() => handleClaimTask(task.id, task.rewardGems, task.rewardStars, task.rewardShards, task.shardType)}
                          className="h-8 px-3 text-[11px] font-black bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shrink-0 animate-bounce shadow-md"
                        >
                          Claim
                        </Button>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-full shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Progress</span>
                        <span>{task.currentCount} / {task.targetCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', isComplete ? 'bg-emerald-500' : 'bg-amber-400')}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Rewards row */}
                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Rewards:</span>
                      {task.rewardGems  > 0 && <span className="text-[11px] font-black text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded-full">💎 {task.rewardGems}</span>}
                      {task.rewardStars > 0 && <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">⭐ {task.rewardStars}</span>}
                      {task.rewardShards > 0 && <span className="text-[11px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">🧩 {task.rewardShards}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* ── Daily Bounty Board ────────────────────────────────────── */}
        <motion.section {...fadeUp(0.15)}>
          <DailyBountyBoard />
        </motion.section>

        {/* ── Tavern Games ─────────────────────────────────────────── */}
        <motion.section {...fadeUp(0.18)}>
          <SectionTitle>Tavern Games & Contests</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {TAVERN_GAMES.map((node, i) => {
              const Icon = node.icon;
              return (
                <TiltCard
                  key={node.id}
                  maxTilt={8}
                  glareIntensity={0.2}
                  hoverScale={1.03}
                  onClick={() => { haptics('light'); audioManager.playSFX('click'); navigate(node.to); }}
                  className={cn(
                    "relative flex flex-col justify-between p-3.5 min-h-[106px] rounded-2xl overflow-hidden text-left bg-gradient-to-br shadow-md transition-all",
                    node.gradient
                  )}
                  style={{
                    boxShadow: `0 4px 12px ${node.accentGlow}, 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.35)`,
                    borderBottom: '3px solid rgba(0,0,0,0.25)',
                  }}
                >
                  {/* Subtle radial gloss overlay */}
                  <div
                    aria-hidden
                    className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/15 blur-xl pointer-events-none"
                  />

                  {/* Top row: Crisp Icon + Badge */}
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/20 backdrop-blur-sm border border-white/25 shadow-inner"
                    >
                      <Icon className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.2} />
                    </div>

                    {node.badge && (
                      <span
                        className={cn(
                          "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm",
                          node.badgeColor || "bg-white/90 text-slate-950"
                        )}
                      >
                        {node.badge}
                      </span>
                    )}
                  </div>

                  {/* Bottom: Title and subtitle hint */}
                  <div className="relative z-10 mt-2">
                    <p className="font-black text-[14px] leading-tight tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] line-clamp-1">
                      {node.label}
                    </p>
                    <p className="text-[10px] font-bold text-white/80 leading-tight tracking-tight mt-0.5 line-clamp-1">
                      {node.subtitle}
                    </p>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </motion.section>

      </div>{/* end scrollable content */}

      {/* ── Rate App Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              padding: 'calc(1rem + var(--safe-top, 0px)) 1rem calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative my-auto w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'hsl(38 60% 97%)' }}
            >
              {/* Header gradient band */}
              <div className="relative h-28 flex flex-col items-center justify-end pb-4"
                style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 50%))' }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <Star className="w-10 h-10 text-white fill-white/20 drop-shadow-lg mb-1 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Support the Realm</p>
              </div>

              <div className="px-5 pt-5 pb-6">
                <h3 className="text-xl font-black text-center mb-1" style={{ color: 'hsl(30 60% 18%)' }}>
                  Rate the Kingdom!
                </h3>
                <p className="text-[12px] text-center text-slate-500 font-medium mb-5">
                  Your wisdom has conquered multiple trivia battles! Rate Cuiz.in to help other query-seekers find our kingdom.
                </p>

                {/* Stars Selection */}
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      key={star}
                      onClick={() => {
                        haptics('light');
                        localStorage.setItem('cuizin_app_rated', 'true');
                        setShowRatingModal(false);
                        window.open('https://cuiz.in', '_blank');
                      }}
                      className="text-3xl leading-none filter drop-shadow-sm bg-transparent border-0 outline-none cursor-pointer"
                    >
                      ⭐
                    </motion.button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      haptics('medium');
                      localStorage.setItem('cuizin_app_rated', 'true');
                      setShowRatingModal(false);
                      window.open('https://cuiz.in', '_blank');
                    }}
                    className="w-full rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white"
                    style={{
                      background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 45%))',
                      boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.4)',
                    }}
                  >
                    ⚔️ Rate 5 Stars
                  </button>
                  <button
                    onClick={() => {
                      haptics('light');
                      setShowRatingModal(false);
                    }}
                    className="w-full py-2.5 font-black text-slate-400 hover:text-slate-600 text-xs uppercase tracking-wider transition-colors bg-transparent border-0 outline-none cursor-pointer"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Daily Check-In Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
            style={{
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              padding: 'calc(1rem + var(--safe-top, 0px)) 1rem calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative my-auto w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
              style={{ background: 'hsl(38 60% 97%)' }}
            >
              {/* Header gradient band */}
              <div className="relative h-28 flex flex-col items-center justify-end pb-4"
                style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 50%))' }}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <Crown className="w-10 h-10 text-white drop-shadow-lg mb-1" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Royal Decree</p>
              </div>

              <div className="px-5 pt-5 pb-6">
                <h3 className="text-xl font-black text-center mb-1" style={{ color: 'hsl(30 60% 18%)' }}>
                  Daily Tribute!
                </h3>
                <p className="text-[12px] text-center text-slate-500 font-medium mb-5">
                  Your presence graces the King's Council. Claim your daily stars to expand your empire!
                </p>

                {/* 7-Day track */}
                <div className="grid grid-cols-7 gap-1 mb-5">
                  {[1,2,3,4,5,6,7].map((day) => {
                    const done    = day < checkInStreak;
                    const current = day === checkInStreak;
                    const amt     = day === 7 ? 50 : day * 5;
                    return (
                      <div key={day} className={cn(
                        'flex flex-col items-center justify-center rounded-xl border-2 py-1.5 gap-0.5 transition-all',
                        done    ? 'bg-emerald-100 border-emerald-300'
                        : current ? 'bg-amber-100 border-amber-400 scale-105 shadow-md'
                        : 'bg-slate-50 border-slate-200'
                      )}>
                        <span className="text-[8px] font-black text-slate-400 uppercase">D{day}</span>
                        <span className="text-base leading-none">{day === 7 ? '👑' : '⭐'}</span>
                        <span className={cn('text-[9px] font-black', current ? 'text-amber-600' : 'text-slate-400')}>
                          +{amt}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Reward summary */}
                <div className="flex items-center justify-around rounded-2xl bg-amber-50 border border-amber-200 p-3.5 mb-5">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-wide text-amber-600/70 mb-0.5">Today's Reward</p>
                    <p className="text-2xl font-black text-amber-700 leading-none">+{checkInRewardStars}</p>
                    <p className="text-[10px] font-bold text-amber-600 mt-0.5">Stars</p>
                  </div>
                  <div className="w-px h-10 bg-amber-200" />
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-wide text-amber-600/70 mb-0.5">Streak</p>
                    <p className="text-2xl font-black text-amber-700 leading-none">{checkInStreak}</p>
                    <p className="text-[10px] font-bold text-amber-600 mt-0.5">Days</p>
                  </div>
                </div>

                <button
                  onClick={handleClaimDailyTribute}
                  className="w-full rounded-2xl py-3.5 font-black text-sm uppercase tracking-wider text-white"
                  style={{
                    background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 45%))',
                    boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.4)',
                  }}
                >
                  ⚔️ Claim Tribute
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Double Bounty Gems Rewarded Ad Confirmation Modal ──────────────── */}
      <AnimatePresence>
        {bountyClaimPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border-2 border-amber-300 relative overflow-hidden"
            >
              {/* Medieval decorative background banner */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              <div className="text-center mt-3">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 mb-4 animate-bounce">
                  <Gem className="w-8 h-8 text-amber-500 fill-amber-300" />
                </div>
                
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                  Double Your Gems?
                </h3>
                
                <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
                  Watch a short video scroll to double your contract earnings!
                  <br />
                  <span className="text-amber-600 font-bold">+{bountyClaimPending.gemsReward} 💎</span> becomes <span className="text-emerald-600 font-black">+{bountyClaimPending.gemsReward * 2} 💎</span>
                </p>

                <div className="space-y-2">
                  <Button
                    disabled={bountyAdShowing}
                    onClick={async () => {
                      haptics('medium');
                      setBountyAdShowing(true);
                      try {
                        const res = await showLevelPlayRewarded();
                        if (res.rewarded) {
                          await executeClaimTask(
                            bountyClaimPending.taskId,
                            bountyClaimPending.gemsReward * 2, // Double gems!
                            bountyClaimPending.starsReward,
                            bountyClaimPending.shardsReward,
                            bountyClaimPending.shardType,
                            true // isDoubled
                          );
                        } else {
                          // Standard claim fallback
                          await executeClaimTask(
                            bountyClaimPending.taskId,
                            bountyClaimPending.gemsReward,
                            bountyClaimPending.starsReward,
                            bountyClaimPending.shardsReward,
                            bountyClaimPending.shardType
                          );
                          toast({ title: 'Ad closed early', description: 'Gems were not doubled.' });
                        }
                      } catch (err) {
                        console.error('Rewarded ad failed', err);
                        // Standard claim fallback on error
                        await executeClaimTask(
                          bountyClaimPending.taskId,
                          bountyClaimPending.gemsReward,
                          bountyClaimPending.starsReward,
                          bountyClaimPending.shardsReward,
                          bountyClaimPending.shardType
                        );
                      } finally {
                        setBountyAdShowing(false);
                        setBountyClaimPending(null);
                      }
                    }}
                    className="w-full rounded-2xl py-6 font-black text-sm uppercase tracking-wider text-white shadow-md transition-all active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                      boxShadow: '0 4px 0 hsl(30 80% 35%)',
                    }}
                  >
                    {bountyAdShowing ? 'Preparing Scroll...' : '⚔️ Watch to Double (2x)'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    disabled={bountyAdShowing}
                    onClick={async () => {
                      haptics('light');
                      await executeClaimTask(
                        bountyClaimPending.taskId,
                        bountyClaimPending.gemsReward,
                        bountyClaimPending.starsReward,
                        bountyClaimPending.shardsReward,
                        bountyClaimPending.shardType
                      );
                      setBountyClaimPending(null);
                    }}
                    className="w-full rounded-2xl py-5 text-xs font-bold text-slate-400 hover:text-slate-500 uppercase tracking-wider"
                  >
                    Claim Standard (+{bountyClaimPending.gemsReward} 💎)
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}