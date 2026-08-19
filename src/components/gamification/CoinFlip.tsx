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
import { Coins, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CoinFlip: React.FC = () => {
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

  const [coinState, setCoinState] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [userChoice, setUserChoice] = useState<'heads' | 'tails' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [message, setMessage] = useState<string>('Select heads or tails and place your bet!');

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
      const freePlayed = localStorage.getItem(`coin_flip_free_played_${currentId}_${today}`);
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
        const active = await checkMinigameStatus('coin');
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

  const handleChoice = (choice: 'heads' | 'tails') => {
    if (coinState === 'flipping') return;
    haptics('light');
    setUserChoice(choice);
  };

  const handleFlip = async () => {
    if (coinState === 'flipping') return;
    if (!userChoice) {
      haptics('warning');
      toast({
        title: 'Choose Side',
        description: 'Please select Heads or Tails before flipping.',
        variant: 'destructive',
      });
      return;
    }

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to place this bet.`,
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

    setCoinState('flipping');
    haptics('medium');
    setMessage('Flipping the coin in the air...');

    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_coin_flip_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('coinFlipPlayed'));

    incrementMinigamePlays('coin').catch(() => {});

    setTimeout(() => {
      const outcomes: ('heads' | 'tails')[] = ['heads', 'tails'];
      const flipResult = outcomes[Math.floor(Math.random() * outcomes.length)];

      showVideoAd(() => {
        setResult(flipResult);
        setCoinState('result');

        const won = userChoice === flipResult;

        if (won) {
          haptics('success');
          const reward = isFreePlay ? 20 : betAmount * 2;
          updateUserBalances(reward, 0);
          setGemsBalance((prev) => prev + reward);
          window.dispatchEvent(new CustomEvent('gemsUpdated'));

          if (userId && userId !== 'guest') {
            logGemsEarned(reward, userId).catch(() => {});
          }

          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.7 },
          });

          setMessage(`🎉 It landed on ${flipResult.toUpperCase()}! You won ${reward} Gems!`);
          toast({
            title: '🎉 Winner!',
            description: `Landed on ${flipResult}. Awarded ${reward} gems.`,
          });
        } else {
          haptics('error');
          setMessage(`😢 It landed on ${flipResult.toUpperCase()}. Better luck next time!`);
          toast({
            title: 'No match!',
            description: `Landed on ${flipResult}.`,
          });
        }

        if (isFreePlay) {
          localStorage.setItem(`coin_flip_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }

        window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
      });
    }, 1200);
  };

  const resetGame = () => {
    setCoinState('idle');
    setUserChoice(null);
    setResult(null);
    setMessage('Select heads or tails for the next round!');
  };

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800">Game Suspended</h3>
        <p className="text-xs text-slate-500 font-semibold">Coin Flip is currently undergoing royal maintenance.</p>
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
            Free Daily Flip
          </span>
        )}
      </div>

      {/* 3D Coin Arena Box */}
      <div
        className="w-full rounded-3xl p-5 relative flex flex-col items-center shadow-xl border-4 border-amber-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(38 75% 25%) 0%, hsl(20 85% 18%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-amber-300 drop-shadow-sm flex items-center justify-center gap-1">
            <Coins className="w-4 h-4" /> Royal Coin Flip
          </span>
        </div>

        {/* 3D Coin Animation */}
        <div className="w-24 h-24 my-3 flex items-center justify-center relative">
          <div
            className={`w-20 h-20 rounded-full border-4 border-yellow-300 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-4xl shadow-xl transition-all ${
              coinState === 'flipping' ? 'animate-spin' : ''
            }`}
          >
            {result === 'heads' ? '👑' : result === 'tails' ? '🦅' : userChoice === 'heads' ? '👑' : userChoice === 'tails' ? '🦅' : '🪙'}
          </div>
        </div>

        {/* Message Banner */}
        <div className="w-full mt-2 bg-black/40 rounded-xl p-2.5 text-center min-h-[40px] flex items-center justify-center">
          <p className="text-xs font-black text-amber-200 leading-tight">{message}</p>
        </div>
      </div>

      {/* Controls & Choice */}
      <div className="w-full flex flex-col gap-3">
        {coinState === 'result' ? (
          <Button
            onClick={resetGame}
            className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-0 shadow-lg"
          >
            Flip Again
          </Button>
        ) : (
          <>
            {/* Heads / Tails Selector */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                disabled={coinState === 'flipping'}
                onClick={() => handleChoice('heads')}
                className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                  userChoice === 'heads'
                    ? 'bg-amber-500 border-amber-400 text-white shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">👑</span> Heads
              </button>
              <button
                type="button"
                disabled={coinState === 'flipping'}
                onClick={() => handleChoice('tails')}
                className={`py-3 px-4 rounded-2xl border-2 font-black text-xs uppercase transition-all flex items-center justify-center gap-2 ${
                  userChoice === 'tails'
                    ? 'bg-amber-500 border-amber-400 text-white shadow-md scale-105'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">🦅</span> Tails
              </button>
            </div>

            {!isFreePlay && (
              <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-black uppercase text-slate-500 px-2">Stake:</span>
                <div className="flex gap-1.5">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      disabled={coinState === 'flipping'}
                      onClick={() => { haptics('light'); setBetAmount(amt); }}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        betAmount === amt
                          ? 'bg-amber-600 text-white shadow-sm scale-105'
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
              onClick={handleFlip}
              disabled={coinState === 'flipping'}
              className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-950 shadow-lg border-0 transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
                boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.4)',
              }}
            >
              {coinState === 'flipping' ? '🪙 Flipping…' : isFreePlay ? '🪙 Free Flip Now' : `🪙 Flip Coin (💎 ${betAmount} Gems)`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CoinFlip;
