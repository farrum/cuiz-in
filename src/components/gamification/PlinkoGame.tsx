import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const MULTIPLIERS = [5.0, 1.5, 0.2, 0.2, 1.5, 5.0];

// Peg board grid layout values (pixel heights)
const ROW_SPACING = 35;
const PEG_START_Y = 60;
const BOARD_WIDTH = 300;
const CENTER_X = BOARD_WIDTH / 2;

export const PlinkoGame: React.FC = () => {
  const [userId, setUserId] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('cuizin_user_id') : null) ||
      'guest'
    );
  });
  const [gemsBalance, setGemsBalance] = useState<number>(() => getUserBalances().gems);
  const { showVideoAd } = useMiniGameVideoAd();
  const haptics = useHaptics();

  const [dropping, setDropping] = useState<boolean>(false);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Drop the ball! Land on the edges for a 5x payout.');

  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { gems } = getUserBalances();
      setGemsBalance(gems);

      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || userId;
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data } = await supabase.from('profiles').select('points').eq('id', session.user.id).maybeSingle();
        if (data && data.points !== undefined && data.points !== null) {
          setGemsBalance(Number(data.points));
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const freePlayed = localStorage.getItem(`plinko_free_played_${currentId}_${today}`);
      if (freePlayed === 'true') {
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      } else {
        setIsFreePlay(true);
      }
    };

    fetchUser();

    const handleGemsUpdated = () => {
      const { gems } = getUserBalances();
      setGemsBalance(gems);
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    return () => window.removeEventListener('gemsUpdated', handleGemsUpdated);
  }, [userId]);

  const handleDrop = async () => {
    if (dropping) return;

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to drop the ball.`,
        variant: 'destructive',
      });
      return;
    }

    // Deduct stake locally & remotely
    if (stake > 0) {
      updateUserBalances(-stake, 0);
      setGemsBalance((prev) => Math.max(0, prev - stake));
      window.dispatchEvent(new CustomEvent('gemsUpdated'));
      if (userId && userId !== 'guest') {
        updateTotalGems(-stake, userId).catch(() => {});
      }
    }

    setDropping(true);
    haptics('medium');
    setMessage('Dropping ball through the pegs...');

    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_plinko_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('plinkoPlayed'));

    // Precalculate ball path (5 rows of pegs, 5 choices)
    const choices: number[] = [];
    let rightCount = 0;
    for (let i = 0; i < 5; i++) {
      const choice = Math.random() < 0.5 ? 0 : 1;
      choices.push(choice);
      if (choice === 1) rightCount++;
    }

    // Run animation steps
    let currentStep = 0;
    let currentX = CENTER_X;
    let currentY = PEG_START_Y - 30;

    setBallPos({ x: currentX, y: currentY });

    const stepInterval = setInterval(() => {
      if (currentStep < 5) {
        const choice = choices[currentStep];
        currentX += choice === 1 ? 16 : -16;
        currentY = PEG_START_Y + currentStep * ROW_SPACING + 15;
        setBallPos({ x: currentX, y: currentY });
        haptics('light');
        currentStep++;
      } else {
        clearInterval(stepInterval);

        // Land in bin (index 0 to 5)
        const targetBin = Math.max(0, Math.min(5, rightCount));
        const finalX = (BOARD_WIDTH / 6) * targetBin + BOARD_WIDTH / 12;
        const finalY = PEG_START_Y + 5 * ROW_SPACING + 20;
        setBallPos({ x: finalX, y: finalY });

        const multiplier = MULTIPLIERS[targetBin];
        const baseAmount = isFreePlay ? 10 : betAmount;
        const reward = Math.round(baseAmount * multiplier);

        showVideoAd(async () => {
          setDropping(false);

          if (reward > 0) {
            haptics(multiplier >= 1.5 ? 'success' : 'warning');
            updateUserBalances(reward, 0);
            setGemsBalance((prev) => prev + reward);
            window.dispatchEvent(new CustomEvent('gemsUpdated'));

            if (userId && userId !== 'guest') {
              logGemsEarned(reward, userId).catch(() => {});
            }

            if (multiplier >= 1.5) {
              confetti({
                particleCount: 90,
                spread: 65,
                origin: { y: 0.8 },
              });
            }

            setMessage(`🎉 Landed on ${multiplier}x! You won ${reward} Gems!`);
            toast({
              title: '🎉 Multiplier Hit!',
              description: `Landed on ${multiplier}x slot. Awarded ${reward} gems.`,
            });
          } else {
            haptics('error');
            setMessage(`Landed on ${multiplier}x. You won 0 gems.`);
          }

          if (isFreePlay) {
            localStorage.setItem(`plinko_free_played_${userId}_${today}`, 'true');
            setHasPlayedFreeToday(true);
            setIsFreePlay(false);
          }

          window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
        });
      }
    }, 180);
  };

  // Generate pegs coords for rendering the board visual background
  const renderPegs = () => {
    const pegList = [];
    for (let row = 0; row < 5; row++) {
      const pegCount = row + 2;
      const startX = CENTER_X - ((pegCount - 1) * 32) / 2;
      for (let i = 0; i < pegCount; i++) {
        pegList.push({
          x: startX + i * 32,
          y: PEG_START_Y + row * ROW_SPACING,
        });
      }
    }
    return pegList;
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 sm:p-4 max-w-sm mx-auto select-none">
      {/* Balance Bar */}
      <div className="w-full flex justify-between items-center px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-slate-700">💎 {gemsBalance}</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Gems</span>
        </div>
        {isFreePlay && (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
            Free Daily Drop
          </span>
        )}
      </div>

      {/* 3D Plinko Board Canvas Box */}
      <div
        className="w-full rounded-3xl p-4 relative flex flex-col items-center shadow-xl border-4 border-emerald-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(165 70% 20%) 0%, hsl(175 80% 12%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-300 drop-shadow-sm flex items-center justify-center gap-1">
            <Sparkles className="w-4 h-4" /> Royal Plinko Pegs
          </span>
        </div>

        {/* Board SVG */}
        <div className="w-[300px] h-[260px] relative bg-slate-950/90 rounded-2xl border-2 border-emerald-400/40 overflow-hidden shadow-inner flex flex-col justify-between">
          <svg className="w-full h-full absolute inset-0 pointer-events-none">
            {/* Pegs */}
            {renderPegs().map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="4.5"
                className="fill-emerald-400 filter drop-shadow-[0_0_3px_rgba(52,211,153,0.8)]"
              />
            ))}

            {/* Bouncing Ball */}
            {ballPos && (
              <circle
                cx={ballPos.x}
                cy={ballPos.y}
                r="7.5"
                className="fill-amber-400 stroke-yellow-200 stroke-2 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-pulse"
              />
            )}
          </svg>

          <div className="flex-1" />

          {/* Multiplier Bins */}
          <div className="w-full grid grid-cols-6 h-10 border-t-2 border-emerald-500/40 bg-slate-900/90 relative z-10">
            {MULTIPLIERS.map((mult, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-center text-[10px] font-black border-r last:border-r-0 border-emerald-500/30 ${
                  mult >= 5
                    ? 'text-amber-400 bg-amber-500/15'
                    : mult >= 1.5
                    ? 'text-emerald-300 bg-emerald-500/10'
                    : 'text-slate-400'
                }`}
              >
                {mult}x
              </div>
            ))}
          </div>
        </div>

        {/* Message Banner */}
        <div className="w-full mt-3 bg-black/40 rounded-xl p-2 text-center min-h-[38px] flex items-center justify-center">
          <p className="text-xs font-black text-emerald-300 leading-tight">{message}</p>
        </div>
      </div>

      {/* Controls & Bet Selector */}
      <div className="w-full flex flex-col gap-3">
        {!isFreePlay && (
          <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-black uppercase text-slate-500 px-2">Bet Amount:</span>
            <div className="flex gap-1.5">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  disabled={dropping}
                  onClick={() => { haptics('light'); setBetAmount(amt); }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    betAmount === amt
                      ? 'bg-emerald-600 text-white shadow-sm scale-105'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleDrop}
          disabled={dropping}
          className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-950 shadow-lg border-0 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(160deg, hsl(150 85% 50%), hsl(165 90% 40%))',
            boxShadow: '0 4px 0 hsl(165 80% 25%), 0 6px 20px hsl(150 70% 50% / 0.4)',
          }}
        >
          {dropping ? '🔴 Ball Dropping…' : isFreePlay ? '🔴 Free Drop Now' : `🔴 Drop Ball (💎 ${betAmount} Gems)`}
        </Button>
      </div>
    </div>
  );
};

export default PlinkoGame;
