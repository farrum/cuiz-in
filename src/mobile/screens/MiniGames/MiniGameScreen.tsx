import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Capacitor } from '@capacitor/core';
import { X, Shield, Disc3, ScrollText, Swords, ImageIcon, Target, Coins, Dices, Gamepad2, Gift, KeyRound } from 'lucide-react';
import { Mascot } from '@/mobile/components/Mascot';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { TopBannerAd } from '../../ads/TopBannerAd';
import { showAdMobInterstitial } from '@/mobile/ads/admob';
import { WheelGame } from './games/WheelGame';
import { ScratchGame } from './games/ScratchGame';
import { TrueFalseGame } from './games/TrueFalseGame';
import { ImageGame } from './games/ImageGame';
import { STORAGE_KEYS } from '@/utils/quizData';
import { logPlaySession } from '@/utils/playTimeTracker';
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

export const normalizeGameId = (id: string | undefined): string => {
  if (!id) return 'wheel';
  const clean = id.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (clean === 'slotmachine' || clean === 'slots') return 'slot';
  if (clean === 'plinkogame') return 'plinko';
  if (clean === 'rockpaperscissors') return 'rps';
  if (clean === 'treasurechest' || clean === 'chest') return 'treasure';
  if (clean === 'spinthewheel') return 'wheel';
  if (clean === 'scratchcard') return 'scratch';
  if (clean === 'truefalseswipe' || clean === 'truefalse') return 'true-false';
  if (clean === 'imagereveal' || clean === 'imagetrivia') return 'image';
  if (clean === 'coin') return 'coinflip';
  if (clean === 'dice') return 'diceroll';
  if (clean === 'vault' || clean === 'riddle') return 'riddlevault';
  return clean;
};

export default function MiniGameScreen() {
  const { gameId: rawGameId = 'wheel' } = useParams();
  const gameId = normalizeGameId(rawGameId);
  const navigate = useNavigate();
  const haptics = useHaptics();
  const current = GAMES.find((g) => g.id === gameId) || GAMES[0];
  const otherGames = GAMES.filter((g) => g.id !== gameId);

  // Gamification Play State
  const [hasPaid, setHasPaid] = useState(false);
  const [playToken, setPlayToken] = useState(0);
  const [playMode, setPlayMode] = useState<'free' | 'paid' | 'ad'>('free');
  const [roundComplete, setRoundComplete] = useState(false);
  const { showVideoAd } = useMiniGameVideoAd();

  // States for Riddle Vault
  const [riddleText, setRiddleText] = useState('What has keys but can\'t open locks?');
  const [riddleAnswer, setRiddleAnswer] = useState('piano');
  const [hasAttemptedRiddle, setHasAttemptedRiddle] = useState(false);
  const [riddleLoading, setRiddleLoading] = useState(false);

  useEffect(() => {
    setHasPaid(false);
    setPlayMode('free');
    setRoundComplete(false);
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
      logPlaySession(gameId, 180);
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
      setPlayMode('free');
      setHasPaid(true);
    } else {
      // Server-backed games (wheel / scratch) charge the 5 Gem fee on the server
      const serverCharged = gameId === 'wheel' || gameId === 'scratch';
      const { gems } = getUserBalances();
      if (gems < 5) {
        alert("You need at least 5 Gems to play again today! Play quizzes or claim daily mystery boxes to earn more.");
        return;
      }
      if (!serverCharged) updateUserBalances(-5, 0);
      setPlayMode('paid');
      setHasPaid(true);
    }
    setRoundComplete(false);
    setPlayToken((t) => t + 1);
  };

  // Watch a video ad to earn the 5 Gems needed for one extra round.
  const handleWatchAdForChance = () => {
    showVideoAd(async (shown) => {
      // On native, only grant the extra chance if a rewarded ad actually played.
      if (Capacitor.isNativePlatform() && !shown) {
        alert('No ad available right now. Please try again in a moment.');
        return;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('award_currency', {
          p_points_delta: 5,
          p_stars_delta: 0,
          p_reason: 'rewarded_ad_extra_chance',
        });
      } catch (err) {
        console.error('Failed to grant ad reward', err);
      }
      updateUserBalances(5, 0);
      window.dispatchEvent(new CustomEvent('gemsUpdated'));
      setPlayMode('ad');
      setHasPaid(true);
      setRoundComplete(false);
      setPlayToken((t) => t + 1);
    });
  };

  const handleRoundComplete = () => {
    localStorage.setItem(`cuizin-last-play-${gameId}`, getTodayString());
    setRoundComplete(true);
  };

  // Any game can signal completion generically via a window event.
  useEffect(() => {
    const onDone = () => handleRoundComplete();
    window.addEventListener('miniGameRoundComplete', onDone);
    return () => window.removeEventListener('miniGameRoundComplete', onDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

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
          <h2 className="text-xl font-black text-primary uppercase tracking-wider drop-shadow-sm">{current?.title}</h2>
          <p className="text-slate-500 font-bold text-xs mt-2 leading-relaxed px-2">
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
        
        <div className="panel-3d bg-white p-4 w-full flex justify-between items-center text-left">
          <div>
            <span className="text-[10px] text-muted-foreground font-black uppercase block leading-none tracking-wider">Your Balance</span>
            <span className="text-sm font-black text-primary mt-1.5 block drop-shadow-sm">💎 {gems} Gems</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-muted-foreground font-black uppercase block leading-none tracking-wider">Entry Fee</span>
            <span className="text-sm font-black text-yellow-500 mt-1.5 block drop-shadow-sm">
              {isFree ? 'FREE (Daily)' : '💎 5 Gems'}
            </span>
          </div>
        </div>

        <button 
          onClick={handlePayAndStart}
          className="w-full btn-3d btn-3d-primary py-3 uppercase"
        >
          {isFree ? ' Start Free Play' : ' Pay 5 Gems & Play'}
        </button>

        {!isFree && (
          <button
            onClick={handleWatchAdForChance}
            className="w-full btn-3d btn-3d-secondary py-3 uppercase text-[13px] font-black"
          >
            ▶ Watch ad for a free chance
          </button>
        )}
      </div>
    );
  };

  const handleRiddleSubmit = async (guess: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`riddle_${today}`, 'true');
    setHasAttemptedRiddle(true);

    const isCorrect = guess.toLowerCase().trim() === riddleAnswer.toLowerCase().trim();
    handleRoundComplete();
    if (isCorrect) {
      window.dispatchEvent(new CustomEvent('baronTaskAction', { detail: { type: 'riddles' } }));
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).rpc('award_currency', {
          p_points_delta: 500,
          p_stars_delta: 0,
          p_reason: 'vault_unlock'
        });
        
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
  if (gameId === 'wheel') {
    body = (
      <WheelGame
        paidPlay={playMode !== 'free'}
        chanceLabel={playMode === 'free' ? 'Free daily spin' : playMode === 'ad' ? 'Ad reward spin' : 'Paid spin'}
        onRoundComplete={handleRoundComplete}
      />
    );
  }
  else if (gameId === 'scratch') body = <ScratchGame paidPlay={playMode !== 'free'} onRoundComplete={handleRoundComplete} />;
  else if (gameId === 'true-false') body = <TrueFalseGame onRoundComplete={handleRoundComplete} />;
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
          <Shield
            className="w-10 h-10 text-amber-500/80 animate-spin mb-4"
            style={{ animationDuration: '2s', animationTimingFunction: 'ease-in-out' }}
            strokeWidth={1.5}
          />
          <p className="text-sm font-black text-amber-900">Preparing daily riddle...</p>
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
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Static gradient background — replaced the animated blur-3xl motion.div.
          An animated `filter: blur` forces a full GPU repaint every frame on Android
          WebView, causing visible frame drops. A static gradient is zero-cost. */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `radial-gradient(ellipse at -10% -10%, ${current?.bgGlow ? 'hsl(var(--primary)/0.25)' : 'hsl(var(--primary)/0.15)'} 0%, transparent 65%)`
        }}
      />

      {/* Top bar — glassmorphic */}
      <div
        className="relative z-20 flex items-center justify-between px-4 py-2.5"
        style={{
          paddingTop: 'calc(var(--safe-top) + 8px)',
          background: 'rgba(255, 251, 240, 0.80)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(212, 170, 80, 0.22)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <button
          onClick={async () => {
            haptics('light');
            if (Capacitor.isNativePlatform()) {
              try {
                await showAdMobInterstitial();
              } catch (e) {
                console.warn('AdMob interstitial failed on exit', e);
              }
            }
            navigate('/hub');
          }}
          className="p-2 -ml-1.5 rounded-xl bg-white/80 ring-1 ring-black/[0.06] hover:bg-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
        <h1 className="font-black text-[17px] tracking-tight" style={{ color: 'hsl(30 60% 18%)' }}>
          {current?.title || 'Tavern Games'}
        </h1>
        <div className="w-9" />
      </div>

      {/* Game body — centered vertically & horizontally */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pt-2 pb-2 min-h-0 overflow-y-auto w-full"
      >
        <div className="w-full max-w-md rounded-2xl bg-white/85 ring-1 ring-black/[0.07] shadow-md p-4 sm:p-6 relative my-auto">
          {hasPaid ? <div key={playToken}>{body}</div> : renderLaunchScreen()}
        </div>

        {hasPaid && roundComplete && (
          <div className="w-full max-w-md mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={handlePayAndStart}
              className="rounded-xl py-2.5 text-[12px] font-black uppercase tracking-wide text-white"
              style={{ background: 'linear-gradient(160deg, hsl(220 60% 40%), hsl(220 70% 28%))', boxShadow: '0 3px 0 hsl(220 70% 18%)' }}
            >
              💎 5 Gems · Play again
            </button>
            <button
              onClick={handleWatchAdForChance}
              className="rounded-xl py-2.5 text-[12px] font-black uppercase tracking-wide text-white"
              style={{ background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 45%))', boxShadow: '0 3px 0 hsl(30 80% 35%)' }}
            >
              ▶ Watch ad · Free
            </button>
          </div>
        )}
      </motion.div>

      {/* Other Games nav bar */}
      <div className="relative z-10 px-4 pt-1 pb-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] font-black text-slate-400 mb-1.5 text-center">Tavern Switcher</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-3 px-1 scrollbar-none">
          {GAMES.map((g) => {
            const Icon = g.icon;
            const active = g.id === gameId;
            return (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.92 }}
                onClick={() => { haptics('light'); navigate(`/game/${g.id}`); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 whitespace-nowrap flex-shrink-0 transition-colors relative",
                  active ? "bg-white ring-2 ring-amber-400 shadow-sm" : "bg-white/80 ring-1 ring-black/[0.06] hover:bg-white"
                )}
              >
                {/* Active slider background indicator */}
                {active && (
                  <motion.div
                    layoutId="active-game-pill"
                    className="absolute inset-0 rounded-xl border border-amber-400/40 pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 25 }}
                  />
                )}
                <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-white bg-gradient-to-br relative z-10', g.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className={cn("text-[12px] font-black tracking-tight relative z-10", active ? "text-amber-800 font-extrabold" : "text-slate-700 font-semibold")}>
                  {g.short}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <TopBannerAd />
    </div>
  );
}