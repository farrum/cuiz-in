import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
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
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
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
        const freePlayed = localStorage.getItem(`plinko_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();
    
    // Listen for gems updates
    const handleGemsUpdated = () => {
      fetchUser();
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    return () => window.removeEventListener('gemsUpdated', handleGemsUpdated);
  }, []);

  const handleDrop = async () => {
    if (dropping) return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play Plinko.',
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

    setDropping(true);
    haptics('medium');
    setMessage('Dropping ball...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_plinko_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('plinkoPlayed'));

    // Precalculate ball path (5 rows of pegs, so 5 left/right choices)
    // choices: array of 5 decisions where 0 = left (-1), 1 = right (+1)
    const choices: number[] = [];
    let rightCount = 0;
    for (let i = 0; i < 5; i++) {
      const choice = Math.random() < 0.5 ? 0 : 1;
      choices.push(choice);
      if (choice === 1) rightCount++;
    }

    // Run animation steps
    let currentStep = 0;
    let currX = CENTER_X;
    let currY = 20;
    setBallPos({ x: currX, y: currY });

    const animateInterval = setInterval(async () => {
      if (currentStep < 5) {
        // Drop to next row, bounce left or right
        const nextY = PEG_START_Y + currentStep * ROW_SPACING;
        const dir = choices[currentStep] === 0 ? -1 : 1;
        const nextX = currX + dir * 18; // offset on peg grid

        setBallPos({ x: nextX, y: nextY });
        haptics('light');
        currX = nextX;
        currY = nextY;
        currentStep++;
      } else if (currentStep === 5) {
        // Drop to the final slot at the bottom
        const finalY = 270;
        setBallPos({ x: currX, y: finalY });
        haptics('light');
        currY = finalY;
        currentStep++;
      } else {
        // Animation finished
        clearInterval(animateInterval);

        const binIndex = rightCount;
        const multiplier = MULTIPLIERS[binIndex];
        const baseAmount = isFreePlay ? 10 : betAmount;
        const reward = Math.round(baseAmount * multiplier);

        showVideoAd(async () => {
          setDropping(false);

          if (reward > 0) {
            haptics(multiplier >= 1.5 ? 'success' : 'warning');
            await logGemsEarned(reward, userId);
            setGemsBalance(prev => prev + reward);
            
            if (multiplier >= 1.5) {
              confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.8 }
              });
            }

            setMessage(`🎉 Landed on ${multiplier}x! You won ${reward} Gems!`);
            toast({
              title: '🎉 Multiplier hit!',
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
        });
      }
    }, 200);
  };

  // Generate pegs coords for rendering the board visual background
  const renderPegs = () => {
    const pegList = [];
    for (let row = 0; row < 5; row++) {
      // Row row has row + 2 pegs
      const pegCount = row + 2;
      const startX = CENTER_X - ((pegCount - 1) * 18) / 2;
      for (let i = 0; i < pegCount; i++) {
        pegList.push({
          x: startX + i * 18,
          y: PEG_START_Y + row * ROW_SPACING,
        });
      }
    }
    return pegList;
  };

  return (
    <div className="panel-3d flex flex-col items-center gap-6 p-6 max-w-sm mx-auto bg-white rounded-3xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-amber-600 font-black text-xs bg-amber-50 rounded-bl-2xl border-l-2 border-b-2 border-amber-200">
        <Coins className="w-3.5 h-3.5" />
        <span>{gemsBalance} Gems</span>
      </div>

      <div className="text-center w-full mt-4">
        <h3 className="text-2xl font-black text-primary tracking-widest uppercase flex items-center justify-center gap-2">
          <Sparkles className="text-emerald-500 fill-emerald-500 w-6 h-6 animate-pulse" />
          Plinko Board
        </h3>
        <p className="text-sm font-bold text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Plinko Board Screen */}
      <div className="relative bg-slate-50 border-4 border-slate-200 rounded-3xl w-[300px] h-[320px] overflow-hidden shadow-inner flex flex-col justify-between p-2 select-none">
        {/* Draw Pegs */}
        <div className="absolute inset-0">
          {renderPegs().map((peg, idx) => (
            <div
              key={idx}
              className="absolute w-2 h-2 rounded-full bg-slate-400 shadow-sm"
              style={{
                left: `${peg.x - 4}px`,
                top: `${peg.y - 4}px`,
              }}
            />
          ))}
        </div>

        {/* Draw Drop Point Indicator */}
        <div 
          className="absolute top-2 w-4 h-4 border-2 border-dashed border-slate-400 rounded-full"
          style={{ left: `${CENTER_X - 8}px` }}
        />

        {/* Draw Ball */}
        {ballPos && (
          <div
            className="absolute w-4.5 h-4.5 rounded-full bg-yellow-400 border border-yellow-500 shadow-md transition-all duration-200 z-10"
            style={{
              width: '18px',
              height: '18px',
              left: `${ballPos.x - 9}px`,
              top: `${ballPos.y - 9}px`,
            }}
          />
        )}

        {/* Bottom Slots */}
        <div className="absolute bottom-2 left-2 right-2 grid grid-cols-6 gap-1 h-12 items-end">
          {MULTIPLIERS.map((mult, idx) => (
            <div
              key={idx}
              className={`rounded-xl py-1 text-center font-black text-xs border-2 flex flex-col items-center justify-center h-full ${
                mult >= 1.5 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-600' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <span>{mult}x</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {/* Play Modes / Betting options */}
        {!dropping && (
          <div className="flex flex-col gap-2 w-full pt-1 border-t-2 border-muted">
            <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-muted-foreground mb-1 px-1">
              <span>Bet Amount:</span>
              <span>{isFreePlay ? 'FREE PLAY' : `${betAmount} Gems`}</span>
            </div>

            <div className="flex gap-2 w-full justify-between items-center bg-slate-50 rounded-2xl p-1 border-2 border-slate-200">
              <Button
                variant={isFreePlay ? 'secondary' : 'ghost'}
                disabled={hasPlayedFreeToday}
                className={`flex-1 text-[10px] font-black h-10 rounded-xl uppercase tracking-widest transition-all ${
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
                    className={`flex-1 text-[10px] font-black h-10 rounded-xl px-0 transition-all ${
                      !isFreePlay && betAmount === amt 
                        ? 'bg-white shadow-sm border border-slate-200 text-primary' 
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
              <p className="text-[10px] text-muted-foreground text-center font-bold mt-1">
                Daily free play used. Playing for gems.
              </p>
            )}
          </div>
        )}

        <Button
          onClick={handleDrop}
          disabled={dropping}
          className="w-full btn-3d bg-emerald-500 border-2 border-emerald-600 hover:bg-emerald-400 font-black py-6 rounded-2xl text-lg tracking-widest uppercase shadow-md text-white"
        >
          {dropping ? 'Dropping...' : 'Drop Ball'}
        </Button>
      </div>
      {adElement}
    </div>
  );
};
