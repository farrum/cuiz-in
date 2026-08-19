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

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '🍀', '7️⃣'];

export const SlotMachine: React.FC = () => {
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

  const [reels, setReels] = useState<string[]>(['💎', '💎', '💎']);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Match symbols to win! Triple 7️⃣ wins the Jackpot.');

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
      const freePlayed = localStorage.getItem(`slot_machine_free_played_${currentId}_${today}`);
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
        const active = await checkMinigameStatus('slot');
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

  const handleSpin = async () => {
    if (spinning) return;

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to spin.`,
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

    setSpinning(true);
    haptics('medium');
    setMessage('Spinning the reels...');

    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_slot_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('slotPlayed'));

    incrementMinigamePlays('slot').catch(() => {});

    // Reel spin animation effect
    let spinCount = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      spinCount++;
      if (spinCount > 15) {
        clearInterval(interval);

        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        setReels(finalReels);

        showVideoAd(() => {
          setSpinning(false);

          const baseAmount = isFreePlay ? 10 : betAmount;
          let reward = 0;
          let won = false;
          let winMsg = '';

          const [r1, r2, r3] = finalReels;

          if (r1 === r2 && r2 === r3) {
            haptics('success');
            won = true;
            if (r1 === '7️⃣') {
              reward = baseAmount * 25; // Jackpot
              winMsg = `🏆 JACKPOT! Triple 7s! You won ${reward} Gems!`;
            } else if (r1 === '💎') {
              reward = baseAmount * 15;
              winMsg = `💎 Amazing! Triple Diamonds! You won ${reward} Gems!`;
            } else {
              reward = baseAmount * 5;
              winMsg = `🎉 Triple match! You won ${reward} Gems!`;
            }
          } else if (r1 === r2 || r2 === r3 || r1 === r3) {
            haptics('warning');
            won = true;
            reward = Math.round(baseAmount * 1.5);
            winMsg = `✨ Double match! You won ${reward} Gems!`;
          } else {
            haptics('error');
            winMsg = '😢 No match. Better luck next spin!';
          }

          setMessage(winMsg);

          if (won && reward > 0) {
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

            toast({
              title: '🎉 Winner!',
              description: `You won ${reward} gems from the slot machine!`,
            });
          }

          if (isFreePlay) {
            localStorage.setItem(`slot_machine_free_played_${userId}_${today}`, 'true');
            setHasPlayedFreeToday(true);
            setIsFreePlay(false);
          }

          window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
        });
      }
    }, 90);
  };

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800">Game Suspended</h3>
        <p className="text-xs text-slate-500 font-semibold">The Grand Treasury has temporarily locked the Slot Machine for maintenance.</p>
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
            Free Daily Spin
          </span>
        )}
      </div>

      {/* 3D Slot Machine Casing */}
      <div
        className="w-full rounded-3xl p-6 relative flex flex-col items-center shadow-2xl border-4 border-amber-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(355 75% 45%) 0%, hsl(20 85% 35%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4)',
        }}
      >
        <div className="text-center mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-amber-200 drop-shadow-sm flex items-center justify-center gap-1">
            <Coins className="w-4 h-4" /> Royal Jackpot Slots
          </span>
        </div>

        {/* Reels Viewport */}
        <div className="w-full bg-slate-950 p-4 rounded-2xl border-4 border-amber-400/80 shadow-inner flex justify-around items-center relative overflow-hidden">
          {/* Glass glare */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-b from-white via-transparent to-black"
          />

          {reels.map((symbol, idx) => (
            <div
              key={idx}
              className="w-16 h-20 sm:w-20 sm:h-24 bg-white rounded-xl flex items-center justify-center text-3xl sm:text-4xl shadow-md border border-slate-200 transform transition-transform"
              style={{
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.15)',
              }}
            >
              <span className={spinning ? 'animate-pulse scale-90' : 'scale-100 transition-transform'}>
                {symbol}
              </span>
            </div>
          ))}
        </div>

        {/* Message Banner */}
        <div className="w-full mt-4 bg-black/40 rounded-xl p-2.5 text-center min-h-[44px] flex items-center justify-center">
          <p className="text-xs font-black text-amber-300 leading-tight">{message}</p>
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
                  disabled={spinning}
                  onClick={() => { haptics('light'); setBetAmount(amt); }}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                    betAmount === amt
                      ? 'bg-amber-500 text-white shadow-sm scale-105'
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
          onClick={handleSpin}
          disabled={spinning}
          className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest text-slate-950 shadow-lg border-0 transition-transform active:scale-95"
          style={{
            background: 'linear-gradient(160deg, hsl(45 95% 55%), hsl(30 90% 48%))',
            boxShadow: '0 4px 0 hsl(30 80% 35%), 0 6px 20px hsl(45 70% 50% / 0.4)',
          }}
        >
          {spinning ? (
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" /> Spinning…
            </span>
          ) : isFreePlay ? (
            '🎰 Free Spin Now'
          ) : (
            `🎰 Spin (💎 ${betAmount} Gems)`
          )}
        </Button>
      </div>
    </div>
  );
};

export default SlotMachine;
