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

export const CoinFlip: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
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
        const freePlayed = localStorage.getItem(`coin_flip_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();

    const checkStatus = async () => {
      const active = await checkMinigameStatus('coin');
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

  const handleChoice = (choice: 'heads' | 'tails') => {
    if (coinState === 'flipping') return;
    haptics('light');
    setUserChoice(choice);
  };

  const handleFlip = async () => {
    if (coinState === 'flipping') return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play the Coin Flip game.',
        variant: 'destructive',
      });
      return;
    }
    if (!userChoice) {
      toast({
        title: 'Choose Side',
        description: 'Please select Heads or Tails before flipping.',
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

    setCoinState('flipping');
    haptics('medium');
    setMessage('Flipping the coin...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_coin_flip_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('coinFlipPlayed'));
    
    // Track stats
    await incrementMinigamePlays('coin');

    // Flip animation delay (1.5 seconds)
    setTimeout(async () => {
      const outcomes: ('heads' | 'tails')[] = ['heads', 'tails'];
      const flipResult = outcomes[Math.floor(Math.random() * outcomes.length)];

      showVideoAd(async () => {
        setResult(flipResult);
        setCoinState('result');

        const won = userChoice === flipResult;

        if (won) {
          haptics('success');
          const reward = isFreePlay ? 5 : betAmount * 2;
          await logGemsEarned(reward, userId);
          setGemsBalance(prev => prev + reward);
          
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });

          setMessage(`🎉 It's ${flipResult.toUpperCase()}! You won ${reward} Gems!`);
          toast({
            title: '🎉 You Won!',
            description: `Guess was correct! Awarded ${reward} gems.`,
          });
        } else {
          haptics('error');
          setMessage(`😢 It's ${flipResult.toUpperCase()}! You lost your guess.`);
          toast({
            title: 'Better luck next time!',
            description: `The coin landed on ${flipResult}.`,
          });
        }

        if (isFreePlay) {
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`coin_flip_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }
      });
    }, 1500);
  };

  const resetGame = () => {
    setCoinState('idle');
    setUserChoice(null);
    setResult(null);
    setMessage('Select heads or tails and place your bet!');
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
          <Sparkles className="text-amber-500 fill-amber-500 w-5 h-5 animate-pulse" />
          Coin Flip Double or Nothing
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Coin rendering */}
      <div className="w-32 h-32 my-2 relative [perspective:1000px]">
        <div 
          className={`w-full h-full rounded-full transition-transform duration-[1500ms] [transform-style:preserve-3d] flex items-center justify-center border-4 border-amber-600 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-lg shadow-amber-500/10 cursor-pointer ${
            coinState === 'flipping' 
              ? 'animate-spin' 
              : result === 'tails' 
                ? '[transform:rotateY(180deg)]' 
                : ''
          }`}
          onClick={coinState === 'idle' ? handleFlip : undefined}
        >
          {/* Heads Side */}
          <div className="absolute w-full h-full rounded-full flex flex-col items-center justify-center [backface-visibility:hidden] select-none">
            <span className="text-3xl font-black text-amber-900 drop-shadow-sm">C</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Heads</span>
          </div>

          {/* Tails Side */}
          <div className="absolute w-full h-full rounded-full flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] select-none">
            <span className="text-3xl font-black text-amber-900 drop-shadow-sm">Z</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Tails</span>
          </div>
        </div>
      </div>

      {coinState === 'idle' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Side Choices */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant={userChoice === 'heads' ? 'default' : 'outline'}
              className={`font-bold rounded-xl h-11 border-2 text-xs uppercase tracking-wider transition-all duration-200 ${
                userChoice === 'heads' 
                  ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-md shadow-amber-600/10' 
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
              onClick={() => handleChoice('heads')}
            >
              Heads
            </Button>
            <Button
              variant={userChoice === 'tails' ? 'default' : 'outline'}
              className={`font-bold rounded-xl h-11 border-2 text-xs uppercase tracking-wider transition-all duration-200 ${
                userChoice === 'tails' 
                  ? 'bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-md shadow-amber-600/10' 
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
              onClick={() => handleChoice('tails')}
            >
              Tails
            </Button>
          </div>

          {/* Play Modes / Betting options */}
          <div className="flex flex-col gap-2 w-full pt-1 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 px-1">
              <span>Bet Amount:</span>
              <span>{isFreePlay ? 'FREE PLAY' : `${betAmount} Gems`}</span>
            </div>

            <div className="flex gap-2 w-full justify-between items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
              <Button
                variant={isFreePlay ? 'secondary' : 'ghost'}
                disabled={hasPlayedFreeToday}
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
                Daily free play used. Playing for gems.
              </p>
            )}
          </div>

          <Button
            onClick={handleFlip}
            className="w-full font-bold h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white rounded-xl text-sm shadow-md shadow-amber-500/10 border-0 transition-transform active:scale-[0.98] mt-2"
          >
            Flip Coin
          </Button>
        </div>
      )}

      {coinState === 'result' && (
        <Button
          onClick={resetGame}
          className="w-full font-bold h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
        >
          Play Again
        </Button>
      )}

      {coinState === 'flipping' && (
        <div className="w-full py-4 text-center text-xs font-bold text-amber-600 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Flipping...
        </div>
      )}
      {adElement}
    </div>
  );
};
