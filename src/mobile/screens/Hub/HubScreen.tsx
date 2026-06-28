import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift, KeyRound } from 'lucide-react';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MotivationBubble } from '@/mobile/components/MotivationBubble';
import { useMotivation } from '@/mobile/hooks/useMotivation';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { IdleMascot } from '@/mobile/mascots/IdleMascot';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { cn } from '@/lib/utils';

type Node = {
  id: string;
  label: string;
  to: string;
  icon: typeof Calendar;
  color: string;
  hint?: string;
  badge?: string;
};

const FEATURED_MODES: Node[] = [
  { id: 'quiz', label: 'Quick Quiz', to: '/quiz', icon: Sparkles, color: 'from-primary via-purple-500 to-pink-500', hint: 'Answer questions, build streaks & earn gems' },
  { id: 'daily', label: 'Daily Challenge', to: '/daily', icon: Calendar, color: 'from-orange-500 to-red-500', hint: 'Complete the daily special for 2x rewards!' },
];

const GRID_GAMES: Node[] = [
  { id: 'wheel', label: 'Spin Wheel', to: '/game/wheel', icon: Disc3, color: 'from-emerald-400 to-teal-600', hint: '1 free spin / day', badge: 'Daily' },
  { id: 'scratch', label: 'Scratch Card', to: '/game/scratch', icon: ScrollText, color: 'from-amber-400 to-orange-600', hint: 'Mystery gems reward', badge: 'Daily' },
  { id: 'true-false', label: 'True / False', to: '/game/true-false', icon: Swords, color: 'from-sky-400 to-blue-600', hint: 'Rapid‑fire swipe', badge: 'New' },
  { id: 'image', label: 'Image Trivia', to: '/game/image', icon: ImageIcon, color: 'from-violet-500 to-fuchsia-600', hint: 'Visual trivia puzzles', badge: 'Image' },
  { id: 'balloon', label: 'Balloon Pop', to: '/game/balloon', icon: Target, color: 'from-pink-400 to-rose-600', hint: 'Arcade balloon popping', badge: 'Hot' },
  { id: 'slot', label: 'Slot Machine', to: '/game/slot', icon: Coins, color: 'from-red-500 to-amber-500', hint: 'Test matching luck', badge: 'Lucky' },
  { id: 'plinko', label: 'Plinko Board', to: '/game/plinko', icon: Dices, color: 'from-green-400 to-emerald-600', hint: 'Bounce chips for prizes', badge: 'Fun' },
  { id: 'rps', label: 'Rock Paper Scissors', to: '/game/rps', icon: Gamepad2, color: 'from-purple-500 to-indigo-600', hint: 'Gesture battle vs AI', badge: 'Battle' },
  { id: 'treasure', label: 'Treasure Chest', to: '/game/treasure', icon: Gift, color: 'from-yellow-400 to-orange-500', hint: 'Open mystery chest', badge: 'Reward' },
  { id: 'coinflip', label: 'Coin Flip', to: '/game/coinflip', icon: Coins, color: 'from-amber-500 to-orange-600', hint: 'Double or nothing coin', badge: 'Luck' },
  { id: 'diceroll', label: 'Dice Roll', to: '/game/diceroll', icon: Dices, color: 'from-indigo-400 to-purple-600', hint: 'High rolling dice bonus', badge: 'Hot' },
  { id: 'riddlevault', label: 'Riddle Vault', to: '/game/riddlevault', icon: KeyRound, color: 'from-slate-600 to-slate-900', hint: 'Claim massive daily gems', badge: 'Daily' },
];

export default function HubScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const motivation = useMotivation('on_open');
  const { streak } = usePersistentQuizStats();
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [name, setName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Player');

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) return;
    supabase.from('profiles').select('username, display_name, points').eq('id', uid).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const balance = (data as any).points ?? 0;
          setGems(balance);
          const dn = (data as any).display_name || (data as any).username || 'Player';
          setName(dn);
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(balance));
          localStorage.setItem(STORAGE_KEYS.USER_NAME, dn);
        }
      });
  }, []);

  const isLoggedIn = !!localStorage.getItem(STORAGE_KEYS.USER_ID);

  return (
    <div className="relative min-h-full pb-32 px-4 pt-3 overflow-hidden">
      {/* animated background blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-primary/20 blur-3xl"
        animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute top-32 -right-20 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Brand */}
      <div className="relative flex justify-center mb-3">
        <motion.img
          src="/cuizin-logo.png"
          alt="CuizIN"
          className="h-9 w-auto"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Hello,</p>
          <h1 className="text-xl font-bold leading-tight">{name} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* Mascot + motivation */}
      <div className="relative flex items-end gap-3 mb-6">
        <IdleMascot size={96} />
        <div className="pb-2">
          <MotivationBubble message={motivation?.text || ''} emoji={motivation?.emoji} />
        </div>
      </div>

      {!isLoggedIn && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { haptics('medium'); navigate('/login'); }}
          className="w-full mb-6 rounded-2xl p-4 text-left bg-gradient-to-r from-primary to-purple-500 text-primary-foreground shadow-lg"
        >
          <p className="font-bold">Sign in to save your gems</p>
          <p className="text-xs opacity-90">Climb the leaderboard and win monthly prizes.</p>
        </motion.button>
      )}

      {/* Core Featured Modes */}
      <section className="relative mb-6">
        <h2 className="text-xs font-black tracking-widest text-muted-foreground mb-3.5 uppercase">Featured Modes</h2>
        <div className="space-y-3.5">
          {FEATURED_MODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 20 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { haptics('medium'); navigate(node.to); }}
                className="relative w-full flex items-center gap-4 rounded-[1.75rem] p-4 text-left bg-card border border-border/80 shadow-md overflow-hidden"
              >
                {/* Visual back glow effect */}
                <div className={cn(
                  "absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-[0.08] bg-gradient-to-br",
                  node.color
                )} />

                <div className={cn(
                  'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-br relative z-10',
                  node.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="font-extrabold text-base leading-tight">{node.label}</p>
                  {node.hint && <p className="text-[11px] text-muted-foreground mt-1 leading-normal">{node.hint}</p>}
                </div>
                <motion.span
                  className="text-xl text-muted-foreground/80 relative z-10 pr-1"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  aria-hidden
                >→</motion.span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Mini Games Grid */}
      <section className="relative">
        <h2 className="text-xs font-black tracking-widest text-muted-foreground mb-3.5 uppercase">Mini Games</h2>
        <div className="grid grid-cols-2 gap-3.5">
          {GRID_GAMES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i + 2) * 0.05, type: 'spring', stiffness: 220, damping: 22 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { haptics('medium'); navigate(node.to); }}
                className="relative flex flex-col justify-between rounded-2xl p-4 text-left bg-card border border-border/80 shadow-md h-36 overflow-hidden"
              >
                {/* Small badge inside game tile */}
                {node.badge && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {node.badge}
                  </span>
                )}

                {/* Icon box */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shadow-sm',
                  node.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info block */}
                <div className="mt-4">
                  <h4 className="font-extrabold text-xs text-foreground tracking-tight line-clamp-1">{node.label}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">{node.hint}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}