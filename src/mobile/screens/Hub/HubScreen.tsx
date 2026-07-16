import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift, KeyRound, Landmark, ChevronRight } from 'lucide-react';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MedievalCharacterBanner } from '@/mobile/components/MedievalCharacterBanner';
import { MedievalAdvisors } from '@/mobile/components/MedievalAdvisors';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';
import { audioManager } from '@/utils/audioManager';
import { useToast } from '@/hooks/use-toast';
import { DailyBountyBoard } from '@/components/home/DailyBountyBoard';

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
  { id: 'quests', label: 'Empire Quests', to: '/empire-quests', icon: Swords, color: 'from-amber-500 via-yellow-500 to-amber-600', hint: 'March across historical campaigns with your battle counsel' },
  { id: 'kingdoms', label: 'Kingdoms Dynasty', to: '/kingdoms', icon: Landmark, color: 'from-blue-600 to-indigo-500', hint: 'Establish your faction, design crests & compete in rankings' },
  { id: 'quiz', label: 'Quick Quiz', to: '/quiz', icon: Sparkles, color: 'from-purple-600 to-pink-500', hint: 'Answer questions, build streaks & earn gems' },
  { id: 'daily', label: 'Daily Challenge', to: '/daily', icon: Calendar, color: 'from-orange-500 to-red-500', hint: 'Complete the daily special for 2x rewards!' },
];

const TAVERN_GAMES: Node[] = [
  { id: 'wheel', label: 'Spin Wheel', to: '/game/wheel', emoji: '🎡', color: 'from-emerald-400 to-teal-600', hint: '1 free spin / day', badge: 'Daily' },
  { id: 'scratch', label: 'Scratch Card', to: '/game/scratch', emoji: '🎫', color: 'from-amber-400 to-orange-600', hint: 'Mystery gems reward', badge: 'Daily' },
  { id: 'true-false', label: 'True / False', to: '/game/true-false', emoji: '⚖️', color: 'from-sky-400 to-blue-600', hint: 'Rapid‑fire swipe', badge: 'New' },
  { id: 'image', label: 'Image Trivia', to: '/game/image', emoji: '🖼️', color: 'from-violet-500 to-fuchsia-600', hint: 'Visual trivia puzzles', badge: 'Image' },
  { id: 'slot', label: 'Slot Machine', to: '/game/slot', emoji: '🎰', color: 'from-red-500 to-amber-500', hint: 'Test matching luck', badge: 'Lucky' },
  { id: 'plinko', label: 'Plinko Board', to: '/game/plinko', emoji: '🔴', color: 'from-green-400 to-emerald-600', hint: 'Bounce chips for prizes', badge: 'Fun' },
  { id: 'rps', label: 'Rock Paper Scissors', to: '/game/rps', emoji: '✊', color: 'from-purple-500 to-indigo-600', hint: 'Gesture battle vs AI', badge: 'Battle' },
  { id: 'treasure', label: 'Treasure Chest', to: '/game/treasure', emoji: '🏴‍☠️', color: 'from-yellow-400 to-orange-500', hint: 'Open mystery chest', badge: 'Reward' },
  { id: 'coinflip', label: 'Coin Flip', to: '/game/coinflip', emoji: '🪙', color: 'from-amber-500 to-orange-600', hint: 'Double or nothing coin', badge: 'Luck' },
  { id: 'diceroll', label: 'Dice Roll', to: '/game/diceroll', emoji: '🎲', color: 'from-indigo-400 to-purple-600', hint: 'High rolling dice bonus', badge: 'Hot' },
  { id: 'riddlevault', label: 'Riddle Vault', to: '/game/riddlevault', emoji: '🔑', color: 'from-stone-600 to-stone-900', hint: 'Claim massive daily gems', badge: 'Daily' },
];

import { StarCounter } from '@/mobile/components/StarCounter';

export default function HubScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak } = usePersistentQuizStats();
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [stars, setStars] = useState<number>(() => Number(localStorage.getItem('quiz_app_user_stars') || 50));
  const [name, setName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Adventurer');

  // Shared state for advisor speech bubble
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Daily check-in states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInRewardStars, setCheckInRewardStars] = useState(0);
  const [checkInStreak, setCheckInStreak] = useState(0);

  const { toast } = useToast();
  const [baronTasks, setBaronTasks] = useState<any[]>([]);

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
        const mapped = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          targetCount: t.target_count,
          currentCount: t.current_count,
          type: t.type,
          rewardGems: t.reward_gems,
          rewardStars: t.reward_stars,
          rewardShards: t.reward_shards,
          shardType: t.shard_type,
          status: t.status,
          assignedTo: t.assigned_to || 'all'
        }));
        setBaronTasks(mapped);
      }
    };
    loadTasks();

    const handleAction = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const type = customEvent.detail?.type;
      if (!type) return;

      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!userId) return;

      try {
        const { data: tasks, error } = await supabase
          .from('empire_tasks' as any)
          .select('*')
          .eq('type', type)
          .eq('status', 'active')
          .or(`assigned_to.eq.${userId},assigned_to.is.null`);

        if (!error && tasks) {
          for (const task of (tasks as any[])) {
            const newCount = task.current_count + 1;
            const isCompleted = newCount >= task.target_count;
            
            await supabase
              .from('empire_tasks' as any)
              .update({
                current_count: newCount,
                status: isCompleted ? 'completed' : 'active'
              })
              .eq('id', task.id);

            if (isCompleted) {
              toast({
                title: "Contract Completed!",
                description: "Open the Hub to claim your reward stars, gems, and shards!",
              });
            }
          }
          loadTasks();
        }
      } catch (err) {
        console.error('Error handling task action:', err);
      }
    };

    window.addEventListener('baronTasksUpdated', loadTasks);
    window.addEventListener('baronTaskAction' as any, handleAction);
    return () => {
      window.removeEventListener('baronTasksUpdated', loadTasks);
      window.removeEventListener('baronTaskAction' as any, handleAction);
    };
  }, [gems, stars]);

  const handleClaimTask = async (taskId: string, gemsReward: number, starsReward: number, shardsReward: number, shardType: string) => {
    haptics('success');
    audioManager.playSFX('chest');

    try {
      const { error } = await supabase
        .from('empire_tasks' as any)
        .update({ status: 'claimed' })
        .eq('id', taskId);

      if (error) throw error;
      
      // Force reload tasks
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      if (userId) {
        const { data } = await supabase
          .from('empire_tasks' as any)
          .select('*')
          .or(`assigned_to.eq.${userId},assigned_to.is.null`)
          .neq('status', 'claimed');
        if (data) {
          setBaronTasks(data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            targetCount: t.target_count,
            currentCount: t.current_count,
            type: t.type,
            rewardGems: t.reward_gems,
            rewardStars: t.reward_stars,
            rewardShards: t.reward_shards,
            shardType: t.shard_type,
            status: t.status,
            assignedTo: t.assigned_to || 'all'
          })));
        }
      }
    } catch (e) {
      console.error('Error claiming task:', e);
    }

    const newGems = gems + gemsReward;
    const newStars = stars + starsReward;
    setGems(newGems);
    setStars(newStars);
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(newGems));
    localStorage.setItem('quiz_app_user_stars', String(newStars));
    window.dispatchEvent(new CustomEvent('gemsUpdated'));

    if (shardsReward > 0) {
      const key = `advisor_shards_${shardType.toLowerCase()}`;
      const curShards = Number(localStorage.getItem(key) || '0');
      localStorage.setItem(key, String(curShards + shardsReward));
      window.dispatchEvent(new CustomEvent('shardsUpdated'));
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await (supabase as any)
          .from('profiles')
          .update({ 
            points: newGems, 
            stars: newStars 
          })
          .eq('id', session.session.user.id);
      }
    } catch (e) {
      console.warn(e);
    }

    toast({
      title: "Contract Claimed!",
      description: `Claimed +${gemsReward} Gems, +${starsReward} Stars, and +${shardsReward} ${shardType} Shards!`,
    });
  };

  const triggerDailyCheckIn = async (userKey: string, currentStars: number) => {
    const today = new Date().toLocaleDateString();
    const lastCheckIn = localStorage.getItem(`last_check_in_date_${userKey}`);
    const currentStreak = Number(localStorage.getItem(`check_in_streak_${userKey}`) || '0');

    if (lastCheckIn === today || sessionStorage.getItem('daily_checkin_shown')) return;
    sessionStorage.setItem('daily_checkin_shown', 'true');

    let newStreak = 1;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();

    if (lastCheckIn === yesterdayStr) {
      newStreak = currentStreak + 1;
    }
    if (newStreak > 7) {
      newStreak = 1;
    }

    const reward = newStreak === 7 ? 50 : newStreak * 5;

    // Apply reward
    setCheckInRewardStars(reward);
    setCheckInStreak(newStreak);
    setStars(prev => prev + reward);

    localStorage.setItem(`last_check_in_date_${userKey}`, today);
    localStorage.setItem(`check_in_streak_${userKey}`, String(newStreak));
    localStorage.setItem('quiz_app_user_stars', String(currentStars + reward));

    if (userKey !== 'guest') {
      try {
        await (supabase as any).from('profiles').update({ stars: currentStars + reward }).eq('id', userKey);
      } catch (err) {
        console.warn("Failed to sync check-in stars to DB:", err);
      }
    }

    setTimeout(() => {
      setShowCheckInModal(true);
      haptics('success');
      try {
        import('canvas-confetti').then((m) => m.default({ particleCount: 60, spread: 50 }));
      } catch {}
    }, 1200);
  };

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) {
      // Guest login check
      triggerDailyCheckIn('guest', stars);
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
          localStorage.setItem(STORAGE_KEYS.USER_NAME, dn);

          // Trigger daily check-in for registered user
          triggerDailyCheckIn(uid, starsBalance);
        }
      });
  }, []);

  const isLoggedIn = !!localStorage.getItem(STORAGE_KEYS.USER_ID);

  return (
    <div className="relative min-h-full pb-32 px-4 pt-4 overflow-hidden bg-background">

      {/* ═══ Header ═══ */}
      <div className="relative flex items-center justify-between mb-5">
        <div>
          <p className="text-[11px] text-muted-foreground font-bold tracking-widest uppercase">Welcome,</p>
          <h1 className="text-2xl font-black leading-tight text-primary drop-shadow-sm">{name}</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
          <StarCounter value={stars} />
        </div>
      </div>

      {/* ═══ King's Court / Character Banner ═══ */}
      <section className="relative mb-4">
        <MedievalCharacterBanner compact />
      </section>

      {/* Sign-in CTA for guests */}
      {!isLoggedIn && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { haptics('medium'); navigate('/login'); }}
          className="w-full mb-6 p-4 text-left panel-3d bg-white"
        >
          <p className="font-black text-primary tracking-wide text-lg">⚔ Pledge Your Allegiance</p>
          <p className="text-[12px] text-muted-foreground mt-0.5 font-bold">Sign in to save your gems & climb the rankings.</p>
        </motion.button>
      )}

      {/* ═══ Your Council ═══ */}
      <section className="relative mb-6">
        <h2 className="text-[11px] font-black tracking-widest text-muted-foreground mb-3 uppercase flex items-center gap-2">
          <span className="w-8 h-[2px] bg-muted/50 rounded-full" />
          Your Battle Council
          <span className="flex-1 h-[2px] bg-muted/50 rounded-full" />
        </h2>
        <MedievalAdvisors 
          compact 
          onAdvisorTap={(advisor) => {
            const quote = advisor.quotes[Math.floor(Math.random() * advisor.quotes.length)];
            setActiveSpeech(quote);
            setActiveId(advisor.id);
            setTimeout(() => {
              setActiveSpeech(null);
              setActiveId(null);
            }, 3500);
          }}
        />
      </section>

      {/* ═══ Royal Chambers (Featured Modes) ═══ */}
      <section className="relative mb-6">
        <h2 className="text-[11px] font-black tracking-widest text-muted-foreground mb-3 uppercase flex items-center gap-2">
          <span className="w-8 h-[2px] bg-muted/50 rounded-full" />
          Royal Chambers
          <span className="flex-1 h-[2px] bg-muted/50 rounded-full" />
        </h2>
        <div className="space-y-3">
          {ROYAL_CHAMBERS.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { haptics('medium'); navigate(node.to); }}
                className="relative w-full flex items-center gap-4 p-4 text-left panel-3d bg-white group overflow-hidden"
              >
                {/* Icon emblem */}
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br relative z-10 border-2 border-white/20',
                  node.color
                )}>
                  <Icon className="w-6 h-6 drop-shadow-sm" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-black text-lg text-foreground tracking-tight">{node.label}</p>
                  <p className="text-[12px] text-muted-foreground font-bold mt-0.5 leading-tight">{node.hint}</p>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 relative z-10 group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ═══ Baron Contracts ═══ */}
      {baronTasks.filter(t => t.status !== 'claimed').length > 0 && (
        <section className="relative mb-6">
          <h2 className="text-[11px] font-black tracking-widest text-muted-foreground mb-3 uppercase flex items-center gap-2">
            <span className="w-8 h-[2px] bg-muted/50 rounded-full" />
            Active Contracts
            <span className="flex-1 h-[2px] bg-muted/50 rounded-full" />
          </h2>
          <div className="space-y-3">
            {baronTasks.filter(t => t.status !== 'claimed').map((task) => (
              <div 
                key={task.id} 
                className="panel-3d bg-white p-4 space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-sm text-primary block uppercase tracking-wider">
                      📜 {task.title}
                    </span>
                    <span className="text-[12px] text-muted-foreground block mt-0.5 leading-relaxed font-bold">
                      {task.description}
                    </span>
                  </div>
                  
                  {task.status === 'completed' ? (
                    <Button 
                      onClick={() => handleClaimTask(task.id, task.rewardGems, task.rewardStars, task.rewardShards, task.shardType)}
                      className="btn-3d btn-3d-success py-1.5 h-8 px-4 text-[10px] animate-bounce"
                    >
                      Claim
                    </Button>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted px-2 py-1 rounded-md">
                      Active
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                    <span>Progress</span>
                    <span>{task.currentCount} / {task.targetCount}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(100, (task.currentCount / task.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rewards display */}
                <div className="flex items-center gap-3 pt-2 text-[11px] font-bold">
                  <span className="text-muted-foreground">Rewards:</span>
                  {task.rewardGems > 0 && <span className="flex items-center gap-1 text-sky-500">💎 {task.rewardGems}</span>}
                  {task.rewardStars > 0 && <span className="flex items-center gap-1 text-amber-500">⭐ {task.rewardStars}</span>}
                  {task.rewardShards > 0 && <span className="flex items-center gap-1 text-purple-500">🧩 {task.rewardShards} {task.shardType}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Daily Bounty Board */}
      <section className="relative mb-5">
        <DailyBountyBoard />
      </section>

      {/* ═══ Tavern Games ═══ */}
      <section className="relative mb-6">
        <h2 className="text-[11px] font-black tracking-widest text-muted-foreground mb-3 uppercase flex items-center gap-2">
          <span className="w-8 h-[2px] bg-muted/50 rounded-full" />
          Tavern Games & Contests
          <span className="flex-1 h-[2px] bg-muted/50 rounded-full" />
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TAVERN_GAMES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i + 2) * 0.04, type: 'spring', stiffness: 220, damping: 22 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics('medium'); navigate(node.to); }}
                className="relative flex flex-col justify-between p-4 text-left h-36 overflow-hidden panel-3d bg-white"
              >
                {/* Badge */}
                {node.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-red-500 text-white shadow-sm">
                    {node.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br border-2 border-white/20',
                  node.color
                )}>
                  {node.emoji ? (
                    <span className="text-xl drop-shadow-sm">{node.emoji}</span>
                  ) : node.icon ? (
                    <Icon className="w-5 h-5 drop-shadow-sm" />
                  ) : null}
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h4 className="font-black text-sm text-foreground tracking-tight line-clamp-1">{node.label}</h4>
                  <p className="text-[11px] text-muted-foreground font-bold mt-0.5 line-clamp-2 leading-tight">{node.hint}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ═══ DAILY CHECK-IN MODAL ═══ */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="panel-3d bg-white max-w-sm w-full p-6 text-center shadow-2xl relative"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-white rounded-full w-20 h-20 flex items-center justify-center text-4xl shadow-lg border-4 border-white">
                ✨
              </div>

              <h3 className="text-2xl font-black text-primary mt-10 mb-2 uppercase tracking-wide">
                Daily Tribute!
              </h3>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed mb-6">
                Your presence is requested at the King's Council. Claim your daily tribute of stars to expand your empire!
              </p>

              {/* 7-Day Progression track */}
              <div className="grid grid-cols-7 gap-1.5 mb-6">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const isDayCompleted = day < checkInStreak;
                  const isDayCurrent = day === checkInStreak;
                  const rewardAmt = day === 7 ? 50 : day * 5;

                  return (
                    <div 
                      key={day} 
                      className={cn(
                        "rounded-xl p-1 flex flex-col items-center justify-between border-2 text-[10px] font-bold h-20 transition-all",
                        isDayCompleted 
                          ? "bg-emerald-100 border-emerald-300 text-emerald-600" 
                          : isDayCurrent
                          ? "bg-yellow-100 border-yellow-400 text-yellow-600 scale-105 shadow-md"
                          : "bg-muted/50 border-muted text-muted-foreground"
                      )}
                    >
                      <span className="opacity-70 text-[9px]">Day {day}</span>
                      <span className="text-lg">{day === 7 ? '👑' : '⭐'}</span>
                      <span className={cn(
                        "font-black font-mono",
                        isDayCurrent ? "text-yellow-600" : "text-muted-foreground"
                      )}>+{rewardAmt}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-muted/30 border-2 border-muted rounded-2xl p-4 mb-6 flex items-center justify-around">
                <div className="text-left">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">Today's Reward</span>
                  <span className="text-2xl font-black text-primary leading-tight">+{checkInRewardStars} Stars</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">Current Streak</span>
                  <span className="text-2xl font-black text-secondary leading-tight">{checkInStreak} Days</span>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics('medium');
                  setShowCheckInModal(false);
                }}
                className="w-full btn-3d btn-3d-primary"
              >
                Claim Tribute
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}