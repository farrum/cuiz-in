/**
 * HubGamesGrid — "Games" tab panel.
 * Tavern games displayed as a polished 2-column grid with an in-feed ad midway.
 */
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Disc3, Gift, Scale, ImageIcon, Gamepad2,
  CircleDot, Swords, Crown, Coins, Dices, KeyRound,
} from 'lucide-react';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { ScrollAdBanner } from '@/mobile/ads/ScrollAdBanner';
import { cn } from '@/lib/utils';

interface GameNode {
  id: string;
  label: string;
  subtitle: string;
  to: string;
  icon: any;
  gradient: string;
  glow: string;
  badge?: string;
  badgeClass?: string;
}

const GAMES: GameNode[] = [
  {
    id: 'wheel',
    label: 'Spin Wheel',
    subtitle: 'Spin & Win Gems',
    to: '/game/wheel',
    icon: Disc3,
    gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    glow: 'rgba(16, 185, 129, 0.45)',
    badge: 'Daily',
    badgeClass: 'bg-emerald-400 text-emerald-950',
  },
  {
    id: 'scratch',
    label: 'Scratch Card',
    subtitle: 'Instant Stars',
    to: '/game/scratch',
    icon: Gift,
    gradient: 'from-amber-500 via-orange-500 to-amber-700',
    glow: 'rgba(245, 158, 11, 0.45)',
    badge: 'Daily',
    badgeClass: 'bg-amber-300 text-amber-950',
  },
  {
    id: 'true-false',
    label: 'True / False',
    subtitle: 'Speed Logic',
    to: '/game/true-false',
    icon: Scale,
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    glow: 'rgba(2, 132, 199, 0.4)',
    badge: 'New',
    badgeClass: 'bg-cyan-300 text-cyan-950',
  },
  {
    id: 'image',
    label: 'Image Trivia',
    subtitle: 'Visual Puzzle',
    to: '/game/image',
    icon: ImageIcon,
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-700',
    glow: 'rgba(168, 85, 247, 0.4)',
  },
  {
    id: 'slot',
    label: 'Slot Machine',
    subtitle: '777 Jackpot',
    to: '/game/slot',
    icon: Gamepad2,
    gradient: 'from-rose-600 via-red-600 to-amber-700',
    glow: 'rgba(225, 29, 72, 0.4)',
    badge: 'Hot',
    badgeClass: 'bg-rose-300 text-rose-950',
  },
  {
    id: 'plinko',
    label: 'Plinko Board',
    subtitle: 'Bounce & Earn',
    to: '/game/plinko',
    icon: CircleDot,
    gradient: 'from-teal-600 via-emerald-600 to-green-700',
    glow: 'rgba(13, 148, 136, 0.4)',
  },
  {
    id: 'rps',
    label: 'Rock Paper Scissors',
    subtitle: 'Tavern Duel',
    to: '/game/rps',
    icon: Swords,
    gradient: 'from-indigo-600 via-violet-600 to-purple-800',
    glow: 'rgba(99, 102, 241, 0.4)',
  },
  {
    id: 'treasure',
    label: 'Treasure Chest',
    subtitle: 'Mystery Loot',
    to: '/game/treasure',
    icon: Crown,
    gradient: 'from-yellow-500 via-amber-600 to-orange-800',
    glow: 'rgba(234, 179, 8, 0.4)',
  },
  {
    id: 'coinflip',
    label: 'Coin Flip',
    subtitle: 'Double Gems',
    to: '/game/coinflip',
    icon: Coins,
    gradient: 'from-amber-500 via-yellow-600 to-orange-700',
    glow: 'rgba(217, 119, 6, 0.4)',
  },
  {
    id: 'diceroll',
    label: 'Dice Roll',
    subtitle: 'Fortune Strike',
    to: '/game/diceroll',
    icon: Dices,
    gradient: 'from-blue-600 via-indigo-600 to-purple-700',
    glow: 'rgba(79, 70, 229, 0.4)',
    badge: 'Hot',
    badgeClass: 'bg-pink-300 text-pink-950',
  },
  {
    id: 'riddlevault',
    label: 'Riddle Vault',
    subtitle: 'Solve Daily Lore',
    to: '/game/riddlevault',
    icon: KeyRound,
    gradient: 'from-stone-700 via-amber-900 to-stone-900',
    glow: 'rgba(120, 53, 15, 0.4)',
    badge: 'Daily',
    badgeClass: 'bg-amber-300 text-amber-950',
  },
];

export function HubGamesGrid() {
  const navigate = useNavigate();
  const haptics = useHaptics();

  // Split games into two halves so we can insert an ad in the middle
  const firstHalf = GAMES.slice(0, 6);
  const secondHalf = GAMES.slice(6);

  const go = (to: string) => {
    haptics('medium');
    navigate(to);
  };

  return (
    <div className="hub-tab-panel px-4 py-3 pb-4">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        <span className="text-[10px] font-black tracking-[0.18em] uppercase text-amber-900/50">
          Tavern Games
        </span>
        <span className="h-px flex-1 section-divider-shimmer rounded-full" />
      </div>

      {/* First 6 games */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {firstHalf.map((game, idx) => (
          <GameCard key={game.id} game={game} idx={idx} onPress={() => go(game.to)} />
        ))}
      </div>

      {/* Mid-scroll in-tab ad */}
      <div className="mb-3">
        <ScrollAdBanner slotId="hub-games-mid" position="hub-games" fallbackIndex={1} />
      </div>

      {/* Remaining games */}
      <div className="grid grid-cols-2 gap-2.5">
        {secondHalf.map((game, idx) => (
          <GameCard key={game.id} game={game} idx={idx + 6} onPress={() => go(game.to)} />
        ))}
      </div>
    </div>
  );
}

function GameCard({ game, idx, onPress }: { game: GameNode; idx: number; onPress: () => void }) {
  const Icon = game.icon;
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: idx * 0.045, duration: 0.28, type: 'spring', stiffness: 300, damping: 22 }}
      whileTap={{ scale: 0.94 }}
      onClick={onPress}
      className="relative flex flex-col items-center justify-center gap-2 rounded-2xl p-4 overflow-hidden text-center game-card-glow"
      style={{
        background: 'linear-gradient(145deg, hsl(40 70% 97%) 0%, hsl(36 55% 93%) 100%)',
        border: '1px solid rgba(180,140,60,0.18)',
        boxShadow: `0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 14px rgba(120,80,20,0.09)`,
        minHeight: 110,
      }}
    >
      {/* Badge */}
      {game.badge && (
        <span
          className={cn(
            'absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide',
            game.badgeClass,
          )}
        >
          {game.badge}
        </span>
      )}

      {/* Icon */}
      <div
        className={cn('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br', game.gradient)}
        style={{ boxShadow: `0 4px 14px ${game.glow}` }}
      >
        <Icon className="w-6 h-6 text-white drop-shadow-sm" strokeWidth={2} />
      </div>

      {/* Labels */}
      <div>
        <p className="text-xs font-black leading-tight" style={{ color: 'hsl(30 55% 20%)' }}>
          {game.label}
        </p>
        <p className="text-[10px] text-amber-800/50 font-semibold mt-0.5">{game.subtitle}</p>
      </div>
    </motion.button>
  );
}
