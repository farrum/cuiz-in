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
  icon: typeof Calendar;
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
  { id: 'wheel', label: 'Spin Wheel', to: '/game/wheel', icon: Disc3, color: 'from-emerald-400 to-teal-600', hint: '1 free spin / day', badge: 'Daily' },
  { id: 'scratch', label: 'Scratch Card', to: '/game/scratch', icon: ScrollText, color: 'from-amber-400 to-orange-600', hint: 'Mystery gems reward', badge: 'Daily' },
  { id: 'true-false', label: 'True / False', to: '/game/true-false', icon: Swords, color: 'from-sky-400 to-blue-600', hint: 'Rapid‑fire swipe', badge: 'New' },
  { id: 'image', label: 'Image Trivia', to: '/game/image', icon: ImageIcon, color: 'from-violet-500 to-fuchsia-600', hint: 'Visual trivia puzzles', badge: 'Image' },
  { id: 'slot', label: 'Slot Machine', to: '/game/slot', icon: Coins, color: 'from-red-500 to-amber-500', hint: 'Test matching luck', badge: 'Lucky' },
  { id: 'plinko', label: 'Plinko Board', to: '/game/plinko', icon: Dices, color: 'from-green-400 to-emerald-600', hint: 'Bounce chips for prizes', badge: 'Fun' },
  { id: 'rps', label: 'Rock Paper Scissors', to: '/game/rps', icon: Gamepad2, color: 'from-purple-500 to-indigo-600', hint: 'Gesture battle vs AI', badge: 'Battle' },
  { id: 'treasure', label: 'Treasure Chest', to: '/game/treasure', icon: Gift, color: 'from-yellow-400 to-orange-500', hint: 'Open mystery chest', badge: 'Reward' },
  { id: 'coinflip', label: 'Coin Flip', to: '/game/coinflip', icon: Coins, color: 'from-amber-500 to-orange-600', hint: 'Double or nothing coin', badge: 'Luck' },
  { id: 'diceroll', label: 'Dice Roll', to: '/game/diceroll', icon: Dices, color: 'from-indigo-400 to-purple-600', hint: 'High rolling dice bonus', badge: 'Hot' },
  { id: 'riddlevault', label: 'Riddle Vault', to: '/game/riddlevault', icon: KeyRound, color: 'from-stone-600 to-stone-900', hint: 'Claim massive daily gems', badge: 'Daily' },
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
    const today = new Date().toISOString().split('T')[0];
    const lastCheckIn = localStorage.getItem(`last_check_in_date_${userKey}`);
    const currentStreak = Number(localStorage.getItem(`check_in_streak_${userKey}`) || '0');

    if (lastCheckIn === today) return;

    let newStreak = 1;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
    <div className="relative min-h-full pb-32 px-4 pt-3 overflow-hidden">

      {/* ═══ Header ═══ */}
      <div className="relative flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] text-muted-foreground font-serif tracking-wider uppercase">Welcome,</p>
          <h1 className="text-lg font-black leading-tight font-serif text-yellow-500">{name}</h1>
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
          className="w-full mb-5 rounded-2xl p-4 text-left wooden-door"
        >
          <p className="font-black text-yellow-400 font-serif tracking-wide">⚔ Pledge Your Allegiance</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sign in to save your gems & climb the rankings.</p>
        </motion.button>
      )}

      {/* ═══ Your Council ═══ */}
      <section className="relative mb-5">
        <h2 className="text-[10px] font-black tracking-[0.25em] text-muted-foreground mb-3 uppercase font-serif flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-800/30" />
          Your Battle Council
          <span className="flex-1 h-[1px] bg-amber-800/30" />
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
      <section className="relative mb-5">
        <h2 className="text-[10px] font-black tracking-[0.25em] text-muted-foreground mb-3 uppercase font-serif flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-800/30" />
          Royal Chambers
          <span className="flex-1 h-[1px] bg-amber-800/30" />
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
                className="relative w-full flex items-center gap-4 rounded-2xl p-4 text-left wooden-door overflow-hidden group"
              >
                {/* Iron handle glow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/5 group-hover:bg-amber-500/15 transition-colors" />

                {/* Icon emblem */}
                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br relative z-10 iron-frame',
                  node.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-black text-base leading-tight text-white font-serif">{node.label}</p>
                  {node.hint && <p className="text-[11px] text-stone-300 font-medium mt-0.5 leading-normal">{node.hint}</p>}
                </div>

                {/* Chevron */}
                <ChevronRight className="w-4 h-4 text-amber-600/40 relative z-10 group-hover:text-amber-500 transition-colors" />

                {/* Iron rivets on corners */}
                <div className="absolute top-2 left-2 iron-rivet" />
                <div className="absolute top-2 right-2 iron-rivet" />
                <div className="absolute bottom-2 left-2 iron-rivet" />
                <div className="absolute bottom-2 right-2 iron-rivet" />
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ═══ Baron Contracts ═══ */}
      {baronTasks.filter(t => t.status !== 'claimed').length > 0 && (
        <section className="relative mb-5">
          <h2 className="text-[10px] font-black tracking-[0.25em] text-stone-400 mb-3 uppercase font-serif flex items-center gap-2">
            <span className="w-8 h-[1px] bg-amber-800/30" />
            Active Baron Contracts
            <span className="flex-1 h-[1px] bg-amber-800/30" />
          </h2>
          <div className="space-y-2.5">
            {baronTasks.filter(t => t.status !== 'claimed').map((task) => (
              <div 
                key={task.id} 
                className="wooden-door border border-amber-800/40 rounded-2xl p-4 shadow-md space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-serif font-black text-sm text-yellow-500 block uppercase tracking-wider">
                      📜 {task.title}
                    </span>
                    <span className="text-[10px] text-stone-300 block mt-0.5 leading-relaxed">
                      {task.description}
                    </span>
                  </div>
                  
                  {task.status === 'completed' ? (
                    <Button 
                      onClick={() => handleClaimTask(task.id, task.rewardGems, task.rewardStars, task.rewardShards, task.shardType)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-black py-1 h-7 px-3 rounded-lg text-[10px] uppercase tracking-wider animate-bounce"
                    >
                      Claim Reward
                    </Button>
                  ) : (
                    <span className="text-[10px] font-black uppercase text-amber-500/70 tracking-widest bg-stone-950/80 px-2 py-0.5 rounded border border-stone-850">
                      Active
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                    <span>Progress</span>
                    <span>{task.currentCount} / {task.targetCount}</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-950 rounded-full overflow-hidden border border-stone-850">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (task.currentCount / task.targetCount) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rewards overview */}
                <div className="flex gap-2.5 pt-1.5 border-t border-stone-850 text-[9px] font-bold text-slate-450 uppercase tracking-wide">
                  <span>Rewards:</span>
                  <span className="text-amber-500">+{task.rewardGems} Gems</span>
                  <span className="text-yellow-400">+{task.rewardStars} Stars</span>
                  {task.rewardShards > 0 && (
                    <span className="text-blue-400">+{task.rewardShards} {task.shardType} Shards</span>
                  )}
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
      <section className="relative">
        <h2 className="text-[10px] font-black tracking-[0.25em] text-stone-400 mb-3 uppercase font-serif flex items-center gap-2">
          <span className="w-8 h-[1px] bg-amber-800/30" />
          Tavern Games
          <span className="flex-1 h-[1px] bg-amber-800/30" />
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
                className="relative flex flex-col justify-between rounded-2xl p-4 text-left h-36 overflow-hidden wooden-door"
              >
                {/* Badge */}
                {node.badge && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-550/15 text-amber-400 border border-amber-500/25 font-serif">
                    {node.badge}
                  </span>
                )}

                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-md iron-frame',
                  node.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
                <div className="mt-4">
                  <h4 className="font-black text-xs text-white tracking-tight line-clamp-1 font-serif">{node.label}</h4>
                  <p className="text-[10px] text-stone-300 font-medium mt-0.5 line-clamp-2 leading-tight">{node.hint}</p>
                </div>

                {/* Corner rivets */}
                <div className="absolute top-1.5 left-1.5 iron-rivet" style={{ width: 6, height: 6 }} />
                <div className="absolute bottom-1.5 right-1.5 iron-rivet" style={{ width: 6, height: 6 }} />
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* ═══ DAILY CHECK-IN MODAL ═══ */}
      <AnimatePresence>
        {showCheckInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="wooden-door max-w-sm w-full rounded-3xl p-6 text-center border-4 border-double border-yellow-500/40 relative shadow-2xl"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-slate-950 rounded-full w-20 h-20 flex items-center justify-center text-4xl shadow-lg border-4 border-amber-955/20">
                ✨
              </div>

              <h3 className="text-xl font-black font-serif text-yellow-500 mt-8 mb-2 uppercase tracking-wide">
                Daily Tribute!
              </h3>
              <p className="text-xs text-stone-305 leading-relaxed mb-6">
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
                        "rounded-lg p-1.5 flex flex-col items-center justify-between border text-[9px] font-bold h-20 transition-all",
                        isDayCompleted 
                          ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 opacity-60" 
                          : isDayCurrent
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-400 scale-105 ring-2 ring-yellow-500/30 shadow-md shadow-yellow-500/5"
                          : "bg-slate-955/80 border-stone-850 text-stone-400"
                      )}
                    >
                      <span className="opacity-60 text-[8px]">Day {day}</span>
                      <span className="text-xs">{day === 7 ? '👑' : '⭐'}</span>
                      <span className={cn(
                        "font-black font-mono",
                        isDayCurrent ? "text-yellow-400" : "text-stone-300"
                      )}>+{rewardAmt}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-slate-955/80 border border-amber-900/30 rounded-2xl p-4 mb-6 flex items-center justify-around">
                <div className="text-left">
                  <span className="text-[10px] text-stone-400 font-serif uppercase tracking-wider block">Today's Reward</span>
                  <span className="text-xl font-black text-yellow-500 leading-tight">+{checkInRewardStars} Stars</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 font-serif uppercase tracking-wider block">Current Streak</span>
                  <span className="text-xl font-black text-amber-500 leading-tight">{checkInStreak} Days</span>
                </div>
              </div>

              <button
                onClick={() => {
                  haptics('medium');
                  setShowCheckInModal(false);
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase py-3 rounded-2xl shadow-lg border-0 transition-transform scale-100 active:scale-95"
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