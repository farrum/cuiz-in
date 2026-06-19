import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { checkMinigameStatus, incrementMinigamePlays } from '@/utils/minigameAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const faceRotations = {
  1: { x: 0, y: 0 },
  2: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: 90, y: 0 },
  6: { x: 0, y: 180 },
};

// Simple helper component to render dots on a die face
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
    <div className="absolute w-full h-full bg-white rounded-xl border-[3px] border-slate-200 p-2.5 grid grid-cols-3 grid-rows-3 gap-1 shadow-inner [backface-visibility:hidden]">
      {dotPositions[value]?.map((pos, idx) => (
        <span
          key={idx}
          className={`${pos} w-2.5 h-2.5 rounded-full bg-slate-800 self-center justify-self-center shadow-sm`}
        />
      ))}
    </div>
  );
};

export const DiceRoll: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  
  const [diceState, setDiceState] = useState<'idle' | 'rolling' | 'result'>('idle');
  const [diceValues, setDiceValues] = useState<[number, number]>([1, 1]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Roll the dice to earn gems! Double 6 wins jackpot.');
  
  const [diceRotation1, setDiceRotation1] = useState({ x: 0, y: 0 });
  const [diceRotation2, setDiceRotation2] = useState({ x: 0, y: 0 });
  
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
        const freePlayed = localStorage.getItem(`dice_roll_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();

    const checkStatus = async () => {
      const active = await checkMinigameStatus('dice');
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

  const handleRoll = async () => {
    if (diceState === 'rolling') return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play the Dice Roll game.',
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

    setDiceState('rolling');
    setMessage('Rolling the dice...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_dice_roll_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('diceRollPlayed'));

    // Track stats
    await incrementMinigamePlays('dice');

    // Generate random roll
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;

    // Spin animation rotations
    // Spin multiple full rotations, plus the target face alignment rotation
    const rot1 = faceRotations[d1 as keyof typeof faceRotations];
    const rot2 = faceRotations[d2 as keyof typeof faceRotations];

    // Extra spins to make it look active
    const extraSpins1X = (Math.floor(Math.random() * 3) + 3) * 360;
    const extraSpins1Y = (Math.floor(Math.random() * 3) + 3) * 360;
    const extraSpins2X = (Math.floor(Math.random() * 3) + 3) * 360;
    const extraSpins2Y = (Math.floor(Math.random() * 3) + 3) * 360;

    setDiceRotation1({ x: rot1.x + extraSpins1X, y: rot1.y + extraSpins1Y });
    setDiceRotation2({ x: rot2.x + extraSpins2X, y: rot2.y + extraSpins2Y });

    setTimeout(async () => {
      setDiceValues([d1, d2]);
      setDiceState('result');

      const sum = d1 + d2;
      let reward = 0;
      let isJackpot = false;
      let isDoubles = false;

      if (d1 === 6 && d2 === 6) {
        reward = isFreePlay ? 25 : 50; // Jackpot
        isJackpot = true;
      } else if (d1 === d2) {
        reward = isFreePlay ? sum : sum * 2; // Doubles bonus
        isDoubles = true;
      } else {
        reward = isFreePlay ? Math.ceil(sum / 2) : sum; // Regular reward
      }

      if (reward > 0) {
        await logGemsEarned(reward, userId);
        setGemsBalance(prev => prev + reward);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });

        if (isJackpot) {
          setMessage(`🏆 JACKPOT DOUBLE 6! You won ${reward} Gems!`);
          toast({
            title: '🏆 JACKPOT!',
            description: `You rolled double 6s! Awarded ${reward} gems.`,
          });
        } else if (isDoubles) {
          setMessage(`🎉 DOUBLES BONUS! Rolled double ${d1}s. You won ${reward} Gems!`);
          toast({
            title: '🎉 Doubles Bonus!',
            description: `Rolled double ${d1}s. Awarded ${reward} gems.`,
          });
        } else {
          setMessage(`✨ Rolled ${d1} and ${d2} (Total: ${sum}). You won ${reward} Gems!`);
          toast({
            title: '✨ You Won!',
            description: `Total roll is ${sum}. Awarded ${reward} gems.`,
          });
        }
      } else {
        setMessage(`Rolled ${d1} and ${d2}. No gems won this time.`);
      }

      if (isFreePlay) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`dice_roll_free_played_${userId}_${today}`, 'true');
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      }
    }, 1500);
  };

  const resetGame = () => {
    setDiceState('idle');
    setDiceRotation1({ x: 0, y: 0 });
    setDiceRotation2({ x: 0, y: 0 });
    setMessage('Roll the dice to earn gems! Double 6 wins jackpot.');
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
          <Sparkles className="text-indigo-500 fill-indigo-500 w-5 h-5 animate-pulse" />
          High Roller Dice
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Dice Container */}
      <div className="flex gap-8 justify-center items-center my-4 h-24">
        {/* Die 1 */}
        <div className="w-16 h-16 [perspective:600px]">
          <div
            className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-[1500ms]"
            style={{
              transform: `rotateX(${diceRotation1.x}deg) rotateY(${diceRotation1.y}deg)`,
            }}
          >
            {/* Front (1) */}
            <div className="absolute w-full h-full [transform:rotateY(0deg)_translateZ(32px)]">
              <DieFace value={1} />
            </div>
            {/* Top (2) */}
            <div className="absolute w-full h-full [transform:rotateX(90deg)_translateZ(32px)]">
              <DieFace value={2} />
            </div>
            {/* Right (3) */}
            <div className="absolute w-full h-full [transform:rotateY(90deg)_translateZ(32px)]">
              <DieFace value={3} />
            </div>
            {/* Left (4) */}
            <div className="absolute w-full h-full [transform:rotateY(-90deg)_translateZ(32px)]">
              <DieFace value={4} />
            </div>
            {/* Bottom (5) */}
            <div className="absolute w-full h-full [transform:rotateX(-90deg)_translateZ(32px)]">
              <DieFace value={5} />
            </div>
            {/* Back (6) */}
            <div className="absolute w-full h-full [transform:rotateY(180deg)_translateZ(32px)]">
              <DieFace value={6} />
            </div>
          </div>
        </div>

        {/* Die 2 */}
        <div className="w-16 h-16 [perspective:600px]">
          <div
            className="w-full h-full relative [transform-style:preserve-3d] transition-transform duration-[1500ms]"
            style={{
              transform: `rotateX(${diceRotation2.x}deg) rotateY(${diceRotation2.y}deg)`,
            }}
          >
            {/* Front (1) */}
            <div className="absolute w-full h-full [transform:rotateY(0deg)_translateZ(32px)]">
              <DieFace value={1} />
            </div>
            {/* Top (2) */}
            <div className="absolute w-full h-full [transform:rotateX(90deg)_translateZ(32px)]">
              <DieFace value={2} />
            </div>
            {/* Right (3) */}
            <div className="absolute w-full h-full [transform:rotateY(90deg)_translateZ(32px)]">
              <DieFace value={3} />
            </div>
            {/* Left (4) */}
            <div className="absolute w-full h-full [transform:rotateY(-90deg)_translateZ(32px)]">
              <DieFace value={4} />
            </div>
            {/* Bottom (5) */}
            <div className="absolute w-full h-full [transform:rotateX(-90deg)_translateZ(32px)]">
              <DieFace value={5} />
            </div>
            {/* Back (6) */}
            <div className="absolute w-full h-full [transform:rotateY(180deg)_translateZ(32px)]">
              <DieFace value={6} />
            </div>
          </div>
        </div>
      </div>

      {diceState === 'idle' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Play Modes / Betting options */}
          <div className="flex flex-col gap-2 w-full pt-1 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1 px-1">
              <span>Cost to Roll:</span>
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

          <Button
            onClick={handleRoll}
            className="w-full font-bold h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm shadow-md shadow-indigo-500/10 border-0 transition-transform active:scale-[0.98] mt-2"
          >
            Roll Dice
          </Button>
        </div>
      )}

      {diceState === 'result' && (
        <Button
          onClick={resetGame}
          className="w-full font-bold h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
        >
          Roll Again
        </Button>
      )}

      {diceState === 'rolling' && (
        <div className="w-full py-4 text-center text-xs font-bold text-indigo-600 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Rolling...
        </div>
      )}
    </div>
  );
};
