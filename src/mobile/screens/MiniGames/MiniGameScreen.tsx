import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift, KeyRound } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { TopBannerAd } from '@/mobile/ads/TopBannerAd';
import { WheelGame } from './games/WheelGame';
import { ScratchGame } from './games/ScratchGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { ImageGame } from './games/ImageGame';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { BurningTorch } from '@/components/gamification/BurningTorch';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';

// Import web game components to reuse directly in mobile!
import { SlotMachine } from '@/components/gamification/SlotMachine';
import { PlinkoGame } from '@/components/gamification/PlinkoGame';
import { RockPaperScissors } from '@/components/gamification/RockPaperScissors';
import { TreasureChest } from '@/components/gamification/TreasureChest';
import { CoinFlip } from '@/components/gamification/CoinFlip';
import { DiceRoll } from '@/components/gamification/DiceRoll';
import { DailyRiddleVault } from '@/components/gamification/DailyRiddleVault';

const GAMES = [
  { id: 'wheel', title: 'Spin the Wheel', color: 'from-emerald-400 to-teal-600', bgGlow: 'bg-emerald-500/15', icon: Disc3, short: 'Spin' },
  { id: 'scratch', title: 'Scratch Card', color: 'from-amber-400 to-orange-600', bgGlow: 'bg-amber-500/15', icon: ScrollText, short: 'Scratch' },
  { id: 'true-false', title: 'True or False', color: 'from-sky-400 to-blue-600', bgGlow: 'bg-sky-500/15', icon: Swords, short: 'True/False' },
  { id: 'image', title: 'Image Trivia', color: 'from-violet-500 to-fuchsia-600', bgGlow: 'bg-violet-500/15', icon: ImageIcon, short: 'Image' },
  { id: 'slot', title: 'Slot Machine', color: 'from-red-500 to-amber-500', bgGlow: 'bg-red-500/15', icon: Coins, short: 'Slot' },
  { id: 'plinko', title: 'Plinko', color: 'from-green-400 to-emerald-600', bgGlow: 'bg-emerald-500/15', icon: Dices, short: 'Plinko' },
  { id: 'rps', title: 'Rock Paper Scissors', color: 'from-purple-500 to-indigo-600', bgGlow: 'bg-indigo-500/15', icon: Gamepad2, short: 'RPS' },
  { id: 'treasure', title: 'Treasure Chest', color: 'from-yellow-400 to-orange-500', bgGlow: 'bg-yellow-500/15', icon: Gift, short: 'Treasure' },
  { id: 'coinflip', title: 'Coin Flip', color: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/15', icon: Coins, short: 'Coin Flip' },
  { id: 'diceroll', title: 'Dice Roll', color: 'from-indigo-400 to-purple-600', bgGlow: 'bg-indigo-500/15', icon: Dices, short: 'Dice Roll' },
  { id: 'riddlevault', title: 'Riddle Vault', color: 'from-slate-600 to-slate-900', bgGlow: 'bg-slate-500/15', icon: KeyRound, short: 'Riddle' },
];

export default function MiniGameScreen() {
  const { gameId = '' } = useParams();
  const navigate = useNavigate();
  const haptics = useHaptics();
  const current = GAMES.find((g) => g.id === gameId);
  const otherGames = GAMES.filter((g) => g.id !== gameId);

  // Gamification Play State
  const [hasPaid, setHasPaid] = useState(false);

  // States for Riddle Vault
  const [riddleText, setRiddleText] = useState('What has keys but can\'t open locks?');
  const [riddleAnswer, setRiddleAnswer] = useState('piano');
  const [hasAttemptedRiddle, setHasAttemptedRiddle] = useState(false);
  const [riddleLoading, setRiddleLoading] = useState(false);

  useEffect(() => {
    setHasPaid(false);
    if (gameId === 'riddlevault') {
      const loadRiddle = async () => {
        setRiddleLoading(true);
        try {
          const today = new Date().toISOString().split('T')[0];
          const riddleAttempted = localStorage.getItem(`riddle_${today}`);
          if (riddleAttempted === 'true') {
            setHasAttemptedRiddle(true);
          } else {
            setHasAttemptedRiddle(false);
          }

          const { data: settingData } = await supabase
            .from('gamification_settings')
            .select('config')
            .eq('setting_type', 'daily_challenges')
            .maybeSingle();

          const cfg = settingData?.config as { riddle_text?: string; riddle_answer?: string } | null;
          if (cfg?.riddle_text) {
            setRiddleText(cfg.riddle_text);
            setRiddleAnswer(cfg.riddle_answer || '');
          }
        } catch (err) {
          console.error('Failed to load riddle config:', err);
        } finally {
          setRiddleLoading(false);
        }
      };
      loadRiddle();
    }
    if (gameId && gameId !== 'riddlevault') {
      window.dispatchEvent(new CustomEvent('baronTaskAction', { detail: { type: 'games' } }));
    }
  }, [gameId]);

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  const isFirstPlayToday = () => {
    const today = getTodayString();
    const lastPlay = localStorage.getItem(`cuizin-last-play-${gameId}`);
    return lastPlay !== today;
  };

  const handlePayAndStart = () => {
    if (isFirstPlayToday()) {
      const today = getTodayString();
      localStorage.setItem(`cuizin-last-play-${gameId}`, today);
      setHasPaid(true);
    } else {
      const { gems } = getUserBalances();
      if (gems < 5) {
        alert("You need at least 5 Gems to play again today! Play quizzes or claim daily mystery boxes to earn more.");
        return;
      }
      updateUserBalances(-5, 0);
      setHasPaid(true);
    }
  };

  const renderLaunchScreen = () => {
    const isFree = isFirstPlayToday();
    const { gems } = getUserBalances();

    return (
      <div className="flex flex-col items-center justify-center text-center p-4 max-w-sm mx-auto space-y-6">
        <span className="text-6xl animate-bounce select-none">
          {gameId === 'wheel' && '🎡'}
          {gameId === 'scratch' && '🎫'}
          {gameId === 'true-false' && '⚖️'}
          {gameId === 'image' && '🖼️'}
          {gameId === 'slot' && '🎰'}
          {gameId === 'plinko' && '🔴'}
          {gameId === 'rps' && '✊'}
          {gameId === 'treasure' && '🏴‍☠️'}
          {gameId === 'coinflip' && '🪙'}
          {gameId === 'diceroll' && '🎲'}
          {gameId === 'riddlevault' && '🔑'}
        </span>
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">{current?.title}</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            {gameId === 'wheel' && 'Spin the wheel of fortune to win coins, tickets, and mystery items.'}
            {gameId === 'scratch' && 'Scratch away the golden foil to match items and win rewards.'}
            {gameId === 'true-false' && 'Test your reflexes and knowledge in a rapid‑fire fact‑checking challenge.'}
            {gameId === 'image' && 'Identify visual cues and images to solve trivia questions.'}
            {gameId === 'slot' && 'Spin the reels and try your luck for big wins.'}
            {gameId === 'plinko' && 'Drop chips and watch them bounce to random prizes.'}
            {gameId === 'rps' && 'Classic hand‑gesture showdown against the computer.'}
            {gameId === 'treasure' && 'Open chests for random rewards and bonuses.'}
            {gameId === 'coinflip' && 'Double or nothing! Flip the coin and guess heads or tails to win big.'}
            {gameId === 'diceroll' && 'Roll the high-stakes dice for multipliers, doubles bonuses, and jackpots.'}
            {gameId === 'riddlevault' && 'Solve the daily cryptic riddle to unlock the vault and claim 500 Gems.'}
          </p>
        </div>
        
        <div className="bg-slate-950/60 border border-yellow-500/20 rounded-2xl p-4 w-full flex justify-between items-center text-left">
          <div>
            <span className="text-[9px] text-slate-500 font-black uppercase block leading-none">Your Balance</span>
            <span className="text-xs font-black text-amber-500 mt-1 block">💎 {gems} Gems</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-slate-500 font-black uppercase block leading-none">Entry Fee</span>
            <span className="text-xs font-black text-yellow-500 mt-1 block">
              {isFree ? 'FREE (Daily)' : '💎 5 Gems'}
            </span>
          </div>
        </div>

        <button 
          onClick={handlePayAndStart}
          className="w-full bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-widest border-0 shadow-md transition-all duration-200"
        >
          {isFree ? ' Start Free Play' : ' Pay 5 Gems & Play'}
        </button>
      </div>
    );
  };

  const handleRiddleSubmit = async (guess: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`riddle_${today}`, 'true');
    setHasAttemptedRiddle(true);

    const isCorrect = guess.toLowerCase().trim() === riddleAnswer.toLowerCase().trim();
    if (isCorrect) {
      window.dispatchEvent(new CustomEvent('baronTaskAction', { detail: { type: 'riddles' } }));
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from('profiles')
          .select('points')
          .eq('id', session.session.user.id)
          .maybeSingle();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentBalance = (data as any)?.points || 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('profiles')
          .update({ points: currentBalance + 500 })
          .eq('id', session.session.user.id);
        
        window.dispatchEvent(new CustomEvent('gemsUpdated'));
      }
      return { success: true, message: 'You unlocked the vault and received 500 Gems!', gemsWon: 500 };
    }
    return { success: false, message: 'Incorrect answer. Try again tomorrow!' };
  };

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
  else if (gameId === 'slot') body = <SlotMachine />;
  else if (gameId === 'plinko') body = <PlinkoGame />;
  else if (gameId === 'rps') body = <RockPaperScissors />;
  else if (gameId === 'treasure') body = <TreasureChest />;
  else if (gameId === 'coinflip') body = <CoinFlip />;
  else if (gameId === 'diceroll') body = <DiceRoll />;
  else if (gameId === 'riddlevault') {
    if (riddleLoading) {
      body = (
        <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">Preparing daily riddle...</p>
        </div>
      );
    } else {
      body = (
        <DailyRiddleVault
          riddleText={riddleText}
          hasAttemptedToday={hasAttemptedRiddle}
          onSubmit={handleRiddleSubmit}
        />
      );
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col stone-wall overflow-hidden">
      {/* Torch ambience */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <BurningTorch className="absolute top-12 left-4 scale-75 opacity-70" />
        <BurningTorch className="absolute top-12 right-4 scale-75 opacity-70" />
        <motion.div
          className={cn('absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl', current?.bgGlow ?? 'bg-primary/10')}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-4 py-2"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
      >
        <button
          onClick={() => { haptics('light'); navigate('/hub'); }}
          className="p-2 -ml-2 rounded-xl iron-frame hover:bg-stone-800/60 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-stone-300" />
        </button>
        <h1 className="font-bold text-lg text-amber-400" style={{ fontFamily: "'Cinzel', serif" }}>
          {current?.title || 'Tavern Games'}
        </h1>
        <div className="w-9" />
      </div>

      {/* Game body — centered vertically & horizontally */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-2 min-h-0 overflow-y-auto w-full"
      >
        <div className="w-full max-w-md bg-stone-900/95 border-4 border-double border-amber-500/20 rounded-3xl p-6 shadow-2xl relative text-slate-100">
          {hasPaid ? body : renderLaunchScreen()}
        </div>
      </motion.div>

      {/* Other Games nav bar */}
      <div className="relative z-10 px-4 pt-1 pb-1.5">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-500 mb-1.5 text-center">
          More Tavern Games
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1 scrollbar-none justify-start w-full max-w-full">
          {otherGames.map((g) => {
            const Icon = g.icon;
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => { haptics('light'); navigate(`/game/${g.id}`); }}
                className="flex items-center gap-1.5 rounded-2xl px-3 py-2 wooden-door shadow-sm transition-colors"
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br iron-frame', g.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-stone-300">{g.short}</span>
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