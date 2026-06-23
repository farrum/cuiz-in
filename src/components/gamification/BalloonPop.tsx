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

interface Balloon {
  id: number;
  type: 'normal' | 'gold' | 'bomb';
  color: string;
  popped: boolean;
  x: number; // percentage width
  y: number; // pixels from bottom
  speed: number;
}

export const BalloonPop: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const haptics = useHaptics();
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [dartsLeft, setDartsLeft] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Pop balloons with darts to earn gems! Avoid the bomb!');

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
        const freePlayed = localStorage.getItem(`balloon_pop_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();

    const checkStatus = async () => {
      const active = await checkMinigameStatus('balloon');
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

  // Game tick to animate balloons floating up
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Use a stable interval to animate balloons upward. Updated to avoid overwriting pop state.
    const interval = setInterval(() => {
      setBalloons(prev => {
        // Move balloons up
        const moved = prev.map(b => ({
          ...b,
          y: b.y + b.speed,
        }));

        // Filter out off-screen balloons (y >= 350) and spawn new ones if needed
        const active = moved.filter(b => b.y < 350 && !b.popped);

        // Spawn new balloon if there are fewer than 5 active ones
        if (active.length < 5 && Math.random() < 0.3) {
          const typeRoll = Math.random();
          let type: 'normal' | 'gold' | 'bomb' = 'normal';
          let color = 'bg-red-400';
          if (typeRoll < 0.15) {
            type = 'gold';
            color = 'bg-yellow-400';
          } else if (typeRoll < 0.3) {
            type = 'bomb';
            color = 'bg-slate-800';
          } else {
            const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-pink-400', 'bg-purple-400'];
            color = colors[Math.floor(Math.random() * colors.length)];
          }
          active.push({
            id: Date.now() + Math.random(),
            type,
            color,
            popped: false,
            x: Math.floor(Math.random() * 80) + 10,
            y: -40,
            speed: Math.random() * 1.5 + 1,
          });
        }
        return active;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleStartGame = async () => {
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play.',
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

    // Deduct stake
    if (stake > 0) {
      await updateTotalGems(-stake, userId);
      setGemsBalance(prev => prev - stake);
    }

    // Set daily free play tracking
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_balloon_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('balloonPlayed'));

    // Track stats
    await incrementMinigamePlays('balloon');

    setBalloons([]);
    setDartsLeft(5);
    setScore(0);
    setGameState('playing');
    haptics('medium');
    setMessage('Tap floating balloons! Darts left: 5');
  };

  const handlePop = async (balloonId: number) => {
    if (gameState !== 'playing' || dartsLeft <= 0) return;

    let hitBomb = false;
    let pointAward = 0;

    setBalloons(prev => 
      prev.map(b => {
        if (b.id === balloonId && !b.popped) {
          if (b.type === 'bomb') {
            hitBomb = true;
          } else {
            pointAward = b.type === 'gold' ? 10 : 3;
          }
          return { ...b, popped: true };
        }
        return b;
      })
    );

    if (hitBomb) {
      setDartsLeft(0);
      haptics('heavy');
      endGame(score, true);
    } else if (pointAward > 0) {
      haptics('light');
      const newScore = score + pointAward;
      setScore(newScore);
      const newDarts = dartsLeft - 1;
      setDartsLeft(newDarts);

      if (newDarts <= 0) {
        endGame(newScore, false);
      } else {
        setMessage(`Pop! Points: ${newScore}. Darts left: ${newDarts}`);
      }
    }
  };

  const endGame = async (finalScore: number, hitBomb: boolean) => {
    showVideoAd(async () => {
      setGameState('ended');
      
      const multiplier = isFreePlay ? 0.5 : (betAmount / 10);
      const reward = Math.round(finalScore * multiplier);
      haptics(reward > 0 ? 'success' : 'error');

      if (hitBomb) {
        setMessage(`💥 BOOM! You hit a bomb! Game over. You earned ${reward} Gems.`);
      } else {
        setMessage(`🎯 All darts used! You scored ${finalScore} points and earned ${reward} Gems!`);
      }

      if (reward > 0 && userId) {
        await logGemsEarned(reward, userId);
        setGemsBalance(prev => prev + reward);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });

        toast({
          title: '🎉 Game Ended!',
          description: `You earned ${reward} gems from popping balloons.`,
        });
      }

      if (isFreePlay && userId) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`balloon_pop_free_played_${userId}_${today}`, 'true');
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      }
    });
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
          <Sparkles className="text-pink-500 fill-pink-500 w-5 h-5 animate-pulse" />
          Balloon Pop
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Game Window */}
      <div className="relative w-full h-[320px] bg-sky-50 border rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
        {gameState === 'idle' && (
          <span className="text-xs text-slate-400 font-bold">Ready to pop? Start the game!</span>
        )}
        
        {gameState === 'playing' && balloons.map(b => (
          <div
            key={b.id}
            className={`absolute w-12 h-14 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${
              b.popped ? 'scale-0' : 'scale-100'
            } ${b.color} shadow-md`}
            style={{
              left: `${b.x}%`,
              bottom: `${b.y}px`,
            }}
            // Prevent handling clicks when game ended or no darts left
            onClick={(e) => {
              e.stopPropagation();
              if (gameState !== 'playing' || dartsLeft <= 0) return;
              handlePop(b.id);
            }}
          >
            {/* Balloon Node Content */}
            <span className="text-xl font-bold select-none">
              {b.type === 'bomb' ? '💣' : b.type === 'gold' ? '⭐' : '🎈'}
            </span>
          </div>
        ))}

        {gameState === 'ended' && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl font-black text-slate-800">GAME OVER</span>
            <span className="text-xs font-bold text-slate-500">Score: {score} Points</span>
          </div>
        )}
      </div>

      {gameState !== 'playing' && (
        <div className="flex flex-col gap-4 w-full">
          {gameState === 'idle' && (
            <div className="flex flex-col gap-2 w-full pt-1 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 px-1">
                <span>Cost to Play:</span>
                <span>{isFreePlay ? 'FREE PLAY' : `${betAmount} Gems`}</span>
              </div>

              <div className="flex gap-2 w-full justify-between items-center bg-slate-55 bg-slate-50 rounded-xl p-1 border border-slate-100">
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
          )}

          <Button
            onClick={handleStartGame}
            className="w-full font-bold h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-sm shadow-md shadow-pink-500/10 border-0 transition-transform active:scale-[0.98]"
          >
            {gameState === 'ended' ? 'Play Again' : 'Start Game'}
          </Button>
        </div>
      )}
      {adElement}
    </div>
  );
};
