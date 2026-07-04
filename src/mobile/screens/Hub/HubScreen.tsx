import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift, KeyRound, Landmark, ChevronRight } from 'lucide-react';
import { GemCounter } from '@/mobile/components/GemCounter';
import { StreakFlame } from '@/mobile/components/StreakFlame';
import { MedievalKingBanner } from '@/mobile/components/MedievalKingBanner';
import { MedievalAdvisors } from '@/mobile/components/MedievalAdvisors';
import { useHaptics } from '@/mobile/hooks/useHaptics';
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
  { id: 'balloon', label: 'Balloon Pop', to: '/game/balloon', icon: Target, color: 'from-pink-400 to-rose-600', hint: 'Arcade balloon popping', badge: 'Hot' },
  { id: 'slot', label: 'Slot Machine', to: '/game/slot', icon: Coins, color: 'from-red-500 to-amber-500', hint: 'Test matching luck', badge: 'Lucky' },
  { id: 'plinko', label: 'Plinko Board', to: '/game/plinko', icon: Dices, color: 'from-green-400 to-emerald-600', hint: 'Bounce chips for prizes', badge: 'Fun' },
  { id: 'rps', label: 'Rock Paper Scissors', to: '/game/rps', icon: Gamepad2, color: 'from-purple-500 to-indigo-600', hint: 'Gesture battle vs AI', badge: 'Battle' },
  { id: 'treasure', label: 'Treasure Chest', to: '/game/treasure', icon: Gift, color: 'from-yellow-400 to-orange-500', hint: 'Open mystery chest', badge: 'Reward' },
  { id: 'coinflip', label: 'Coin Flip', to: '/game/coinflip', icon: Coins, color: 'from-amber-500 to-orange-600', hint: 'Double or nothing coin', badge: 'Luck' },
  { id: 'diceroll', label: 'Dice Roll', to: '/game/diceroll', icon: Dices, color: 'from-indigo-400 to-purple-600', hint: 'High rolling dice bonus', badge: 'Hot' },
  { id: 'riddlevault', label: 'Riddle Vault', to: '/game/riddlevault', icon: KeyRound, color: 'from-stone-600 to-stone-900', hint: 'Claim massive daily gems', badge: 'Daily' },
];

export default function HubScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak } = usePersistentQuizStats();
  const [gems, setGems] = useState<number>(() => Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || 0));
  const [name, setName] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Adventurer');

  useEffect(() => {
    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) return;
    supabase.from('profiles').select('username, display_name, points').eq('id', uid).maybeSingle()
      .then(({ data }) => {
        if (data) {
          const balance = (data as any).points ?? 0;
          setGems(balance);
          const dn = (data as any).display_name || (data as any).username || 'Adventurer';
          setName(dn);
          localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(balance));
          localStorage.setItem(STORAGE_KEYS.USER_NAME, dn);
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
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <GemCounter value={gems} />
        </div>
      </div>

      {/* ═══ King's Court ═══ */}
      <section className="relative mb-4">
        <MedievalKingBanner compact />
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
        <MedievalAdvisors compact />
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
    </div>
  );
}