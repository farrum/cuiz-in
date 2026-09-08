/**
 * HubScreen — rebuilt as a lean orchestrator.
 *
 * All data/effect logic lives here. All JSX is delegated to:
 *   HubHeader        — top bar (name, gems, stars, streak)
 *   HubPlayCards     — "Play" tab
 *   HubGamesGrid     — "Games" tab
 *   HubRewardsTab    — "Rewards" tab (contracts + bounty board)
 *   DailyTributeModal— once-per-day check-in modal (no delay)
 *
 * Key fixes vs old version:
 *   - No white flash: background is inherited from MobileShell
 *   - No 800 ms tribute delay: modal shows on first render after fetch
 *   - Tab-based layout: Play / Games / Rewards each with their own ad
 *   - DailyTribute enforced server-side + localStorage (once per calendar day)
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { useToast } from '@/hooks/use-toast';
import { getDailyTributeStatus, claimDailyTribute } from '@/services/dailyTributeService';
import { showAdMobRewarded, isMobileAdsEnabled } from '@/mobile/ads/admob';
import { audioManager } from '@/utils/audioManager';
import { Capacitor } from '@capacitor/core';
import { cn } from '@/lib/utils';

import { HubHeader } from './HubHeader';
import { HubPlayCards } from './HubPlayCards';
import { HubGamesGrid } from './HubGamesGrid';
import { HubRewardsTab } from './HubRewardsTab';
import { DailyTributeModal } from './DailyTributeModal';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { MedievalAdvisors } from '@/mobile/components/MedievalAdvisors';
import { EmberBackground } from '@/mobile/components/EmberBackground';

// ── Tab definition ────────────────────────────────────────────────────────────
type TabId = 'play' | 'games' | 'rewards';
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'play',    label: 'Play',    icon: Sparkles  },
  { id: 'games',   label: 'Games',   icon: Gamepad2  },
  { id: 'rewards', label: 'Rewards', icon: Gift       },
];

export default function HubScreen() {
  const haptics = useHaptics();
  const { streak } = usePersistentQuizStats();
  const { toast } = useToast();

  // ── User state ──────────────────────────────────────────────────────────────
  const [gems,  setGems]  = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [stars, setStars] = useState<number>(() => Number(localStorage.getItem('quiz_app_user_stars') || 50));
  const [name,  setName]  = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Adventurer');
  const [role,  setRole]  = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'player');

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('play');

  // ── Daily Tribute ───────────────────────────────────────────────────────────
  const [tributeShow,    setTributeShow]    = useState(false);
  const [tributeStars,   setTributeStars]   = useState(0);
  const [tributeStreak,  setTributeStreak]  = useState(1);

  // ── Baron Tasks (Rewards tab) ───────────────────────────────────────────────
  const [baronTasks, setBaronTasks] = useState<any[]>([]);

  // ── Pending rewarded ad for task claim ────────────────────────────────────
  const [bountyClaimPending, setBountyClaimPending] = useState<{
    taskId: string; gemsReward: number; starsReward: number;
    shardsReward: number; shardType: string;
  } | null>(null);

  // ── Advisor speech ──────────────────────────────────────────────────────────
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [activeId,     setActiveId]     = useState<string | null>(null);

  // ── Profile fetch + tribute check (runs once on mount) ─────────────────────
  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);

    const checkTribute = async (userId?: string | null) => {
      // Only show once per day, and not if already dismissed this session
      if (sessionStorage.getItem('daily_tribute_modal_dismissed')) return;
      const status = await getDailyTributeStatus(userId);
      if (status.canClaim) {
        setTributeStars(status.rewardStars);
        setTributeStreak(status.streak);
        setTributeShow(true);
        haptics('success');
        if (!Capacitor.isNativePlatform()) {
          try {
            import('canvas-confetti').then((m) =>
              m.default({ particleCount: 60, spread: 50, origin: { y: 0.55 } }),
            );
          } catch {}
        }
      }
    };

    if (!uid) {
      checkTribute(null);
      return;
    }

    supabase
      .from('profiles')
      .select('username, display_name, points, stars')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const balance = (data as any).points ?? 0;
          const starsBal = (data as any).stars ?? 0;
          const dn = (data as any).display_name || (data as any).username || 'Adventurer';
          setGems(balance);
          setStars(starsBal);
          setName(dn);
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(balance));
          localStorage.setItem('quiz_app_user_stars', String(starsBal));
          localStorage.setItem(STORAGE_KEYS.USER_STARS, String(starsBal));
          localStorage.setItem(STORAGE_KEYS.USER_NAME, dn);
          checkTribute(uid);
        }
      });

    const r = localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'player';
    setRole(r);
  }, []);

  // ── Sync gems/stars from custom events ─────────────────────────────────────
  useEffect(() => {
    const sync = () => {
      const g = Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
      const s = Number(localStorage.getItem('quiz_app_user_stars') || localStorage.getItem(STORAGE_KEYS.USER_STARS) || '0');
      setGems(g);
      setStars(s);
    };
    window.addEventListener('gemsUpdated', sync);
    window.addEventListener('starsUpdated', sync);
    return () => {
      window.removeEventListener('gemsUpdated', sync);
      window.removeEventListener('starsUpdated', sync);
    };
  }, []);

  // ── Baron task loading ──────────────────────────────────────────────────────
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
        const mapped = (data as any[]).map((t) => {
          const key = `cuizin_user_task_${userId}_${t.id}`;
          let localProg: any = null;
          try { localProg = JSON.parse(localStorage.getItem(key) || 'null'); } catch {}
          const dbProg = progressMap.get(t.id);
          return {
            id: t.id, title: t.title, description: t.description || '',
            targetCount: t.target_count,
            currentCount: dbProg?.currentCount ?? localProg?.currentCount ?? 0,
            type: t.type,
            rewardGems: t.reward_gems, rewardStars: t.reward_stars,
            rewardShards: t.reward_shards, shardType: t.shard_type,
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
          .from('empire_tasks' as any).select('*').eq('type', type)
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
              task_id: task.id, user_id: userId, current_count: newCount,
              target_count: task.target_count, status: newStatus,
              last_updated: new Date().toISOString(),
            });
            if (isCompleted && existing.status !== 'completed') {
              toast({ title: 'Contract Completed!', description: 'Switch to Rewards tab to claim!' });
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
  }, []);

  // ── Claim tribute ───────────────────────────────────────────────────────────
  const handleClaimTribute = async () => {
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
    setTributeShow(false);
  };

  const handleDismissTribute = () => {
    sessionStorage.setItem('daily_tribute_modal_dismissed', 'true');
    setTributeShow(false);
  };

  // ── Claim task (with optional rewarded ad) ──────────────────────────────────
  const executeClaimTask = async (
    taskId: string, gemsR: number, starsR: number, shardsR: number, shardType: string, doubled = false
  ) => {
    haptics('success');
    audioManager.playSFX('chest');
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (uid) {
      try {
        await supabase.from('user_task_progress' as any).upsert({
          task_id: taskId, user_id: uid, status: 'claimed', last_updated: new Date().toISOString(),
        });
      } catch {}
    }
    const newGems  = gems  + gemsR;
    const newStars = stars + starsR;
    setGems(newGems); setStars(newStars);
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(newGems));
    localStorage.setItem('quiz_app_user_stars', String(newStars));
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
    if (shardsR > 0) {
      const key = `advisor_shards_${shardType.toLowerCase()}`;
      localStorage.setItem(key, String(Number(localStorage.getItem(key) || '0') + shardsR));
      window.dispatchEvent(new CustomEvent('shardsUpdated'));
    }
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess?.session?.user) {
        await (supabase as any).from('profiles').update({ points: newGems, stars: newStars }).eq('id', sess.session.user.id);
      }
    } catch {}
    setBaronTasks((prev) => prev.filter((t) => t.id !== taskId));
    toast({
      title: doubled ? '⚔️ Bounty Doubled!' : '⚔️ Contract Claimed!',
      description: `+${gemsR} 💎 · +${starsR} ⭐ · +${shardsR} ${shardType} Shards`,
    });
  };

  const handleClaimTask = async (taskId: string, gemsR: number, starsR: number, shardsR: number, shardType: string) => {
    if (Capacitor.isNativePlatform() && gemsR > 0 && isMobileAdsEnabled) {
      setBountyClaimPending({ taskId, gemsReward: gemsR, starsReward: starsR, shardsReward: shardsR, shardType });
    } else {
      await executeClaimTask(taskId, gemsR, starsR, shardsR, shardType);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-full" style={{ backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))' }}>

      {/* Ambient ember particles */}
      <EmberBackground count={18} />

      {/* ── Sticky top bar ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(255, 251, 240, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(212, 170, 80, 0.2)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 10px rgba(0,0,0,0.05)',
        }}
      >
        {/* Gold shimmer line */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px section-divider-shimmer pointer-events-none"
        />

        {/* Stats row */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
          <img src="/cuizin-logo.png" alt="CuizIN" className="h-7 w-auto object-contain" draggable={false} />
          <div
            className="rounded-2xl px-2 py-1"
            style={{
              background: 'rgba(255, 248, 220, 0.75)',
              boxShadow: '0 0 0 1px rgba(212,170,60,0.22), 0 2px 8px rgba(212,170,60,0.1)',
            }}
          >
            <HubHeader name={name} gems={gems} stars={stars} streak={streak} role={role} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center px-4 pb-0 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics('light'); setActiveTab(tab.id); }}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-black uppercase tracking-wider transition-colors flex-1 justify-center',
                  isActive
                    ? 'text-amber-800'
                    : 'text-amber-700/45',
                )}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={isActive ? 2.5 : 2} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="hub-active-tab"
                    className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-amber-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Character banner (shown on Play tab only) ───────────────────── */}
      {activeTab === 'play' && (
        <div className="px-4 pt-3">
          <div className="rounded-2xl overflow-hidden shadow-md ring-1 ring-black/[0.07]">
            <MedievalCharacterBanner compact />
          </div>
        </div>
      )}

      {/* ── Advisors (shown on Play tab only) ──────────────────────────── */}
      {activeTab === 'play' && (
        <div className="px-4 pt-3">
          <MedievalAdvisors
            onAdvisorTap={(advisor) => {
              const quote = advisor.quotes[Math.floor(Math.random() * advisor.quotes.length)];
              setActiveSpeech(quote);
              setActiveId(advisor.id);
              setTimeout(() => { setActiveSpeech(null); setActiveId(null); }, 3500);
            }}
          />
        </div>
      )}

      {/* ── Tab content panels ──────────────────────────────────────────── */}
      <div className="pb-4" style={{ paddingBottom: 'calc(var(--bottom-clearance, 120px) + 16px)' }}>
        {activeTab === 'play' && <HubPlayCards />}
        {activeTab === 'games' && <HubGamesGrid />}
        {activeTab === 'rewards' && (
          <HubRewardsTab tasks={baronTasks} onClaimTask={handleClaimTask} />
        )}
      </div>

      {/* ── Daily Tribute Modal ─────────────────────────────────────────── */}
      <DailyTributeModal
        show={tributeShow}
        streak={tributeStreak}
        rewardStars={tributeStars}
        onClaim={handleClaimTribute}
        onDismiss={handleDismissTribute}
      />

      {/* ── Rewarded ad for task claim ──────────────────────────────────── */}
      {bountyClaimPending && (
        <div className="fixed inset-0 z-[900] bg-black/60 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl p-5 mx-4 max-w-xs w-full text-center shadow-2xl">
            <p className="font-black text-amber-800 mb-1">Watch an Ad to Double Your Reward?</p>
            <p className="text-sm text-slate-500 mb-4">
              Collect +{bountyClaimPending.gemsReward * 2} 💎 instead of +{bountyClaimPending.gemsReward}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const p = bountyClaimPending;
                  setBountyClaimPending(null);
                  executeClaimTask(p.taskId, p.gemsReward, p.starsReward, p.shardsReward, p.shardType, false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
              >
                Skip
              </button>
              <button
                onClick={async () => {
                  const p = bountyClaimPending;
                  setBountyClaimPending(null);
                  const result = await showAdMobRewarded();
                  await executeClaimTask(p.taskId, result.rewarded ? p.gemsReward * 2 : p.gemsReward, p.starsReward, p.shardsReward, p.shardType, result.rewarded);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-black text-white"
                style={{ background: 'linear-gradient(135deg, hsl(45 95% 55%), hsl(30 90% 48%))' }}
              >
                Watch Ad 🎁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}