import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { WheelGame } from './games/WheelGame';
import { ScratchGame } from './games/ScratchGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { ImageGame } from './games/ImageGame';
import { cn } from '@/lib/utils';

// Import web game components to reuse directly in mobile!
import { BalloonPop } from '@/components/gamification/BalloonPop';
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PlinkoGame } from '@/components/gamification/PlinkoGame';
import { RockPaperScissors } from '@/components/gamification/RockPaperScissors';
import { TreasureChest } from '@/components/gamification/TreasureChest';

const GAMES = [
  { id: 'wheel', title: 'Spin the Wheel', color: 'from-emerald-400 to-teal-600', bgGlow: 'bg-emerald-500/15', icon: Disc3, short: 'Spin' },
  { id: 'scratch', title: 'Scratch Card', color: 'from-amber-400 to-orange-600', bgGlow: 'bg-amber-500/15', icon: ScrollText, short: 'Scratch' },
  { id: 'true-false', title: 'True or False', color: 'from-sky-400 to-blue-600', bgGlow: 'bg-sky-500/15', icon: Swords, short: 'True/False' },
  { id: 'image', title: 'Image Trivia', color: 'from-violet-500 to-fuchsia-600', bgGlow: 'bg-violet-500/15', icon: ImageIcon, short: 'Image' },
  { id: 'balloon', title: 'Balloon Pop', color: 'from-pink-400 to-rose-600', bgGlow: 'bg-rose-500/15', icon: Target, short: 'Balloon' },
  { id: 'slot', title: 'Slot Machine', color: 'from-red-500 to-amber-500', bgGlow: 'bg-red-500/15', icon: Coins, short: 'Slot' },
  { id: 'plinko', title: 'Plinko', color: 'from-green-400 to-emerald-600', bgGlow: 'bg-emerald-500/15', icon: Dices, short: 'Plinko' },
  { id: 'rps', title: 'Rock Paper Scissors', color: 'from-purple-500 to-indigo-600', bgGlow: 'bg-indigo-500/15', icon: Gamepad2, short: 'RPS' },
  { id: 'treasure', title: 'Treasure Chest', color: 'from-yellow-400 to-orange-500', bgGlow: 'bg-yellow-500/15', icon: Gift, short: 'Treasure' },
];

export default function MiniGameScreen() {
  const { gameId = '' } = useParams();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const current = GAMES.find((g) => g.id === gameId);
  const otherGames = GAMES.filter((g) => g.id !== gameId);

  let body: React.ReactNode = (
    <div className="text-center">
      <Mascot mood="thinking" size={100} className="mx-auto mb-4" />
      <p className="text-muted-foreground">This mini-game is coming soon.</p>
    </div>
  );
  if (gameId === 'wheel') body = <WheelGame />;
  else if (gameId === 'scratch') body = <ScratchGame />;
  else if (gameId === 'true-false') body = <TrueFalseGame />;
  else if (gameId === 'image') body = <ImageGame />;
  else if (gameId === 'balloon') body = <BalloonPop />;
  else if (gameId === 'slot') body = <SlotMachine />;
  else if (gameId === 'plinko') body = <PlinkoGame />;
  else if (gameId === 'rps') body = <RockPaperScissors />;
  else if (gameId === 'treasure') body = <TreasureChest />;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Themed ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <motion.div
          className={cn('absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl', current?.bgGlow ?? 'bg-primary/10')}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className={cn('absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl', current?.bgGlow ?? 'bg-purple-500/10')}
          animate={{ scale: [1, 1.15, 1], y: [0, -25, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-4 py-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button
          onClick={() => { haptics('light'); navigate('/hub'); }}
          className="p-2 -ml-2 rounded-full hover:bg-muted/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className={`font-extrabold text-lg bg-gradient-to-r ${current?.color ?? 'from-primary to-purple-500'} bg-clip-text text-transparent`}>
          {current?.title || 'Mini-game'}
        </h1>
        <div className="w-9" />
      </div>

      {/* Game body — centered vertically & horizontally */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-2 min-h-0 overflow-y-auto"
      >
        {body}
      </motion.div>

      {/* Other Games nav bar */}
      <div className="relative z-10 px-4 pt-1 pb-1.5">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5 text-center">
          More games
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-none justify-start w-full max-w-full">
          {otherGames.map((g) => {
            const Icon = g.icon;
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => { haptics('light'); navigate(`/game/${g.id}`); }}
                className="flex items-center gap-1.5 rounded-2xl px-3 py-2 bg-card border border-border shadow-sm transition-colors hover:bg-muted/50"
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br', g.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">{g.short}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Ad banner */}
      <div className="relative z-10" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)' }}>
        <TopBannerAd />
      </div>
    </div>
  );
}