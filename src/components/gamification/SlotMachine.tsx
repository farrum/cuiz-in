import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { checkMinigameStatus, incrementMinigamePlays } from '@/utils/minigameAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const SYMBOLS = ['🍒', '🍋', '🔔', '💎', '🍀', '7️⃣'];

export const SlotMachine: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch current points/gems
        const { data } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          setGemsBalance(data.points || 0);
        }

        // Check if free play is used today
        const today = new Date().toISOString().split('T')[0];
        const freePlayed = localStorage.getItem(`slot_machine_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();

    const checkStatus = async () => {
      const active = await checkMinigameStatus('slot');
      setIsSuspended(!active);
    };
    checkStatus();
    
    // Listen for gems updates
    const handleGemsUpdated = () => {
      fetchUser();
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    return () => window.removeEventListener('gemsUpdated', handleGemsUpdated);
  }, []);

  const handleSpin = async () => {
    if (spinning) return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play the Slot Machine.',
        variant: 'destructive',
      });
      return;
    }

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      toast({
        title: 'Insufficient Gems',
        description: 'You do not have enough gems to place this bet.',
        variant: 'destructive',
      });
      return;
    }

    // Deduct stake if not free play
    if (stake > 0) {
      await updateTotalGems(-stake, userId);
      setGemsBalance(prev => prev - stake);
    }

    setSpinning(true);
    haptics('medium');
    setMessage('Spinning the reels...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_slot_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('slotPlayed'));

    // Track stats
    await incrementMinigamePlays('slot');

    // Reel spin interval effect
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
        
        // Final outcomes
        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        setReels(finalReels);
        
        showVideoAd(() => {
          setSpinning(false);

          // Check payouts
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
            logGemsEarned(reward, userId);
            setGemsBalance(prev => prev + reward);
            
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 }
            });

            toast({
              title: '🎉 Winner!',
              description: `You won ${reward} gems from the slot machine.`,
            });
          }

          if (isFreePlay) {
            localStorage.setItem(`slot_machine_free_played_${userId}_${today}`, 'true');
            setHasPlayedFreeToday(true);
            setIsFreePlay(false);
          }
        });
      }
    }, 100);
  };

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800">Game Suspended</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          This game is temporarily suspended by the administrator. Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-yellow-600 font-bold text-xs bg-yellow-50 rounded-bl-xl border-l border-b border-yellow-100">
        <Coins className="w-3.5 h-3.5" />
        <span>{gemsBalance} Gems</span>
      </div>

      <div className="text-center w-full mt-4">
        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="text-red-500 fill-red-500 w-5 h-5 animate-pulse" />
          Jackpot Slots
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Reels Visual Container */}
      <div className="flex gap-4 bg-slate-900 border-4 border-slate-700 rounded-2xl p-4 shadow-xl w-full justify-center">
        {reels.map((sym, idx) => (
          <div 
            key={idx} 
            className={`w-16 h-20 rounded-xl bg-white border-2 border-slate-300 shadow-inner flex items-center justify-center text-4xl select-none font-bold transition-all ${
              spinning ? 'animate-pulse' : ''
            }`}
          >
            {sym}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 w-full">
        {/* Play Modes / Betting options */}
        <div className="flex flex-col gap-2 w-full pt-1 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 px-1">
            <span>Cost to Spin:</span>
            <span>{isFreePlay ? 'FREE SPIN' : `${betAmount} Gems`}</span>
          </div>

          <div className="flex gap-2 w-full justify-between items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
            <Button
              variant={isFreePlay ? 'secondary' : 'ghost'}
              disabled={hasPlayedFreeToday || spinning}
              className={`flex-1 text-[10px] font-bold h-8 rounded-lg uppercase tracking-wide transition-all ${
                isFreePlay 
                  ? 'bg-white shadow-sm border border-slate-200 text-purple-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setIsFreePlay(true)}
            >
              Free {hasPlayedFreeToday && '✔'}
            </Button>
            <div className="flex gap-1 items-center flex-1">
              {[5, 10, 25].map(amt => (
                <Button
                  key={amt}
                  variant={!isFreePlay && betAmount === amt ? 'secondary' : 'ghost'}
                  disabled={spinning}
                  className={`flex-1 text-[10px] font-black h-8 rounded-lg px-0 transition-all ${
                    !isFreePlay && betAmount === amt 
                      ? 'bg-white shadow-sm border border-slate-200 text-slate-800' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => {
                    setIsFreePlay(false);
                    setBetAmount(amt);
                  }}
                >
                  {amt}
                </Button>
              ))}
            </div>
          </div>
          {hasPlayedFreeToday && isFreePlay && (
            <p className="text-[10px] text-slate-400 text-center font-medium mt-1">
              Daily free spin used. Spinning for gems.
            </p>
          )}
        </div>

        <Button
          onClick={handleSpin}
          disabled={spinning}
          className="w-full font-bold h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl text-sm shadow-md shadow-red-500/10 border-0 transition-transform active:scale-[0.98]"
        >
          {spinning ? 'Spinning...' : 'Spin Reels'}
        </Button>
      </div>
      {adElement}
    </div>
  );
};
