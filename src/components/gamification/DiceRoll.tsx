import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { checkMinigameStatus, incrementMinigamePlays } from '@/utils/minigameAdmin';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, Dices, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const faceRotations = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

const DieFace: React.FC<{ value: number }> = ({ value }) => {
  const dotPositions: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: [
      'col-start-1 row-start-1',
      'col-start-3 row-start-1',
      'col-start-1 row-start-3',
      'col-start-3 row-start-3',
    ],
    5: [
      'col-start-1 row-start-1',
      'col-start-3 row-start-1',
      'col-start-2 row-start-2',
      'col-start-1 row-start-3',
      'col-start-3 row-start-3',
    ],
    6: [
      'col-start-1 row-start-1',
      'col-start-3 row-start-1',
      'col-start-1 row-start-2',
      'col-start-3 row-start-2',
      'col-start-1 row-start-3',
      'col-start-3 row-start-3',
    ],
  };

  return (
    <div className="absolute w-full h-full bg-white rounded-xl border-[2.5px] border-slate-300 p-2 grid grid-cols-3 grid-rows-3 gap-1 shadow-inner [backface-visibility:hidden]">
      {dotPositions[value]?.map((pos, idx) => (
        <span
          key={idx}
          className={`${pos} w-2.5 h-2.5 rounded-full bg-slate-900 self-center justify-self-center shadow-sm`}
        />
      ))}
    </div>
  );
};

export const DiceRoll: React.FC = () => {
  const [userId, setUserId] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('cuizin_user_id') : null) ||
      'guest'
    );
  });
  const [gemsBalance, setGemsBalance] = useState<number>(() => getUserBalances().gems);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const { showVideoAd } = useMiniGameVideoAd();
  const haptics = useHaptics();

  const [diceState, setDiceState] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Roll the dice to earn gems! Doubles & high totals win big.');

  const [diceRotation1, setDiceRotation1] = useState({ x: 0, y: 0 });
  const [diceRotation2, setDiceRotation2] = useState({ x: 0, y: 0 });

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
      const freePlayed = localStorage.getItem(`dice_roll_free_played_${currentId}_${today}`);
      if (freePlayed === 'true') {
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      } else {
        setIsFreePlay(true);
      }
    };

    fetchUser();

    const checkStatus = async () => {
      try {
        const active = await checkMinigameStatus('dice');
        setIsSuspended(!active);
      } catch {
        setIsSuspended(false);
      }
    };
    checkStatus();

    const handleGemsUpdated = () => {
      const { gems } = getUserBalances();
      setGemsBalance(gems);
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    return () => window.removeEventListener('gemsUpdated', handleGemsUpdated);
  }, [userId]);

  const handleRoll = async () => {
    if (diceState === 'rolling') return;

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to place this roll.`,
        variant: 'destructive',
      });
      return;
    }

    if (stake > 0) {
      updateUserBalances(-stake, 0);
      setGemsBalance((prev) => Math.max(0, prev - stake));
      window.dispatchEvent(new CustomEvent('gemsUpdated'));
      if (userId && userId !== 'guest') {
        updateTotalGems(-stake, userId).catch(() => {});
      }
    }

    setDiceState('rolling');
    haptics('medium');
    setMessage('Rolling the dice across the table...');

    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_dice_roll_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('diceRollPlayed'));

    incrementMinigamePlays('dice').catch(() => {});

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    const rot1 = faceRotations[d1 as keyof typeof faceRotations];
    const rot2 = faceRotations[d2 as keyof typeof faceRotations];

    const extraSpins1X = (Math.floor(Math.random() * 2) + 2) * 360;
    const extraSpins1Y = (Math.floor(Math.random() * 2) + 2) * 360;
    const extraSpins2X = (Math.floor(Math.random() * 2) + 2) * 360;
    const extraSpins2Y = (Math.floor(Math.random() * 2) + 2) * 360;

    setDiceRotation1({ x: rot1.x + extraSpins1X, y: rot1.y + extraSpins1Y });
    setDiceRotation2({ x: rot2.x + extraSpins2X, y: rot2.y + extraSpins2Y });

    setTimeout(() => {
      setDiceValues([d1, d2]);

      showVideoAd(() => {
        setDiceState('result');

        const total = d1 + d2;
        const isDoubles = d1 === d2;
        const isDoubleSix = isDoubles && d1 === 6;

        let multiplier = 0;
        let outcomeMsg = '';

        if (isDoubleSix) {
          multiplier = 5.0; // Jackpot
          outcomeMsg = '🏆 DOUBLE SIX JACKPOT! 5x Multiplier!';
          haptics('success');
        } else if (isDoubles) {
          multiplier = 2.5;
          outcomeMsg = `✨ Doubles (${d1} & ${d2})! 2.5x Multiplier!`;
          haptics('success');
        } else if (total >= 9) {
          multiplier = 1.5;
          outcomeMsg = `🎉 High Total (${total})! 1.5x Multiplier!`;
          haptics('success');
        } else if (total === 7) {
          multiplier = 1.0;
          outcomeMsg = `Lucky 7! Stake returned.`;
          haptics('warning');
        } else {
          multiplier = 0;
          outcomeMsg = `Total: ${total}. Better luck next roll!`;
          haptics('error');
        }

        const baseAmount = isFreePlay ? 10 : betAmount;
        const reward = Math.round(baseAmount * multiplier);

        if (reward > 0) {
          updateUserBalances(reward, 0);
          setGemsBalance((prev) => prev + reward);
          window.dispatchEvent(new CustomEvent('gemsUpdated'));

          if (userId && userId !== 'guest') {
            logGemsEarned(reward, userId).catch(() => {});
          }

          if (multiplier >= 2.0) {
            confetti({
              particleCount: 90,
              spread: 70,
              origin: { y: 0.7 },
            });
          }

          toast({
            title: '🎉 Roll Complete!',
            description: `Rolled ${total}. Awarded ${reward} gems!`,
          });
        }

        setMessage(outcomeMsg);

        if (isFreePlay) {
          localStorage.setItem(`dice_roll_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }

        window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
      });
    }, 1200);
  };

  const resetGame = () => {
    setDiceState('idle');
    setMessage('Roll again to test your luck!');
  };

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800">Game Suspended</h3>
        <p className="text-xs text-slate-500 font-semibold">Dice Roll is undergoing maintenance.</p>
      </div>
    );
  }

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
            Free Daily Roll
          </span>
        )}
      </div>

      {/* 3D Dice Arena */}
      <div
        className="w-full rounded-3xl p-5 relative flex flex-col items-center shadow-xl border-4 border-indigo-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(235 60% 25%) 0%, hsl(250 70% 15%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-300 drop-shadow-sm flex items-center justify-center gap-1">
            <Dices className="w-4 h-4" /> Royal High Dice
          </span>
        </div>

        {/* Dice Viewport */}
        <div className="w-full h-32 bg-slate-950/90 rounded-2xl border-2 border-indigo-400/40 flex justify-around items-center px-4 shadow-inner relative overflow-hidden">
          <div
            className={`w-16 h-16 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center text-3xl font-black text-slate-900 shadow-lg transition-transform ${
              diceState === 'rolling' ? 'animate-bounce' : ''
            }`}
          >
            {diceValues[0] === 1 && '⚀'}
            {diceValues[0] === 2 && '⚁'}
            {diceValues[0] === 3 && '⚂'}
            {diceValues[0] === 4 && '⚃'}
            {diceValues[0] === 5 && '⚄'}
            {diceValues[0] === 6 && '⚅'}
          </div>

          <div
            className={`w-16 h-16 bg-white rounded-2xl border-2 border-slate-200 flex items-center justify-center text-3xl font-black text-slate-900 shadow-lg transition-transform ${
              diceState === 'rolling' ? 'animate-bounce' : ''
            }`}
          >
            {diceValues[1] === 1 && '⚀'}
            {diceValues[1] === 2 && '⚁'}
            {diceValues[1] === 3 && '⚂'}
            {diceValues[1] === 4 && '⚃'}
            {diceValues[1] === 5 && '⚄'}
            {diceValues[1] === 6 && '⚅'}
          </div>
        </div>

        {/* Message Banner */}
        <div className="w-full mt-3 bg-black/40 rounded-xl p-2.5 text-center min-h-[40px] flex items-center justify-center">
          <p className="text-xs font-black text-indigo-200 leading-tight">{message}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col gap-3">
        {diceState === 'result' ? (
          <Button
            onClick={resetGame}
            className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-0 shadow-lg"
          >
            Roll Next Round
          </Button>
        ) : (
          <>
            {!isFreePlay && (
              <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-black uppercase text-slate-500 px-2">Roll Stake:</span>
                <div className="flex gap-1.5">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      disabled={diceState === 'rolling'}
                      onClick={() => { haptics('light'); setBetAmount(amt); }}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        betAmount === amt
                          ? 'bg-indigo-600 text-white shadow-sm scale-105'
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
              onClick={handleRoll}
              disabled={diceState === 'rolling'}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-950 shadow-lg border-0 transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(160deg, hsl(230 90% 60%), hsl(250 85% 50%))',
                boxShadow: '0 4px 0 hsl(250 80% 30%), 0 6px 20px hsl(230 70% 50% / 0.4)',
              }}
            >
              {diceState === 'rolling' ? '🎲 Rolling…' : isFreePlay ? '🎲 Free Roll Now' : `🎲 Roll Dice (💎 ${betAmount} Gems)`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DiceRoll;
