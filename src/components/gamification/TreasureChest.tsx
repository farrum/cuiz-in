import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { checkMinigameStatus, incrementMinigamePlays } from '@/utils/minigameAdmin';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Chest {
  id: number;
  rarity: 'common' | 'uncommon' | 'rare';
  value: number;
  label: string;
}

export const TreasureChest: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  
  const [gameState, setGameState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chests, setChests] = useState<Chest[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Pick a treasure chest to open! Find the Rare chest for 5x payout.');

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
        const freePlayed = localStorage.getItem(`treasure_chest_free_played_${session.user.id}_${today}`);
        if (freePlayed === 'true') {
          setHasPlayedFreeToday(true);
        } else {
          setIsFreePlay(true); // Default to free play if available
        }
      }
    };
    
    fetchUser();

    const checkStatus = async () => {
      const active = await checkMinigameStatus('chest');
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

  const handleChestClick = async (chestIdx: number) => {
    if (gameState !== 'idle') return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to open a treasure chest.',
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

    setGameState('opening');
    setSelectedChest(chestIdx);
    setMessage('Opening chest...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_chest_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('chestPlayed'));

    // Track stats
    await incrementMinigamePlays('chest');

    const baseAmount = isFreePlay ? 10 : betAmount;

    // Define probabilities for the selected chest
    // Common (60%): 0.5x bet
    // Uncommon (30%): 1.5x bet
    // Rare (10%): 5x bet
    const roll = Math.random();
    let selectedRarity: 'common' | 'uncommon' | 'rare';
    let selectedVal = 0;
    let selectedLabel = '';

    if (roll < 0.6) {
      selectedRarity = 'common';
      selectedVal = Math.round(baseAmount * 0.5);
      selectedLabel = 'Common';
    } else if (roll < 0.9) {
      selectedRarity = 'uncommon';
      selectedVal = Math.round(baseAmount * 1.5);
      selectedLabel = 'Uncommon';
    } else {
      selectedRarity = 'rare';
      selectedVal = baseAmount * 5;
      selectedLabel = 'RARE';
    }

    // Generate random rewards for the other 2 chests
    const generateOtherChest = (): Chest => {
      const r = Math.random();
      if (r < 0.6) {
        return { id: Math.random(), rarity: 'common', value: Math.round(baseAmount * 0.5), label: 'Common' };
      } else if (r < 0.9) {
        return { id: Math.random(), rarity: 'uncommon', value: Math.round(baseAmount * 1.5), label: 'Uncommon' };
      } else {
        return { id: Math.random(), rarity: 'rare', value: baseAmount * 5, label: 'RARE' };
      }
    };

    const newChests: Chest[] = [];
    for (let i = 0; i < 3; i++) {
      if (i === chestIdx) {
        newChests.push({
          id: i,
          rarity: selectedRarity,
          value: selectedVal,
          label: selectedLabel,
        });
      } else {
        newChests.push({ ...generateOtherChest(), id: i });
      }
    }
    setChests(newChests);

    setTimeout(async () => {
      setGameState('revealed');
      
      if (selectedVal > 0) {
        await logGemsEarned(selectedVal, userId);
        setGemsBalance(prev => prev + selectedVal);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });

        if (selectedRarity === 'rare') {
          setMessage(`🏆 JACKPOT! You opened a RARE Chest and found ${selectedVal} Gems!`);
          toast({
            title: '🏆 RARE CHEST OPENED!',
            description: `Congratulations! You found the rare chest and won ${selectedVal} gems.`,
          });
        } else if (selectedRarity === 'uncommon') {
          setMessage(`🎉 NICE! You opened an Uncommon Chest and found ${selectedVal} Gems!`);
          toast({
            title: '🎉 Uncommon Chest Opened!',
            description: `You found an Uncommon chest and won ${selectedVal} gems.`,
          });
        } else {
          setMessage(`✨ You opened a Common Chest and found ${selectedVal} Gems!`);
          toast({
            title: '✨ Chest Opened',
            description: `Found a Common chest. Awarded ${selectedVal} gems.`,
          });
        }
      }

      if (isFreePlay) {
        localStorage.setItem(`treasure_chest_free_played_${userId}_${today}`, 'true');
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      }
    }, 1200);
  };

  const resetGame = () => {
    setGameState('idle');
    setSelectedChest(null);
    setChests([]);
    setMessage('Pick a treasure chest to open! Find the Rare chest for 5x payout.');
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
          Treasure Chests
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Chests Container */}
      <div className="grid grid-cols-3 gap-4 w-full my-4 h-32">
        {[0, 1, 2].map((idx) => {
          const chest = chests[idx];
          const isSelected = selectedChest === idx;
          const isOpening = gameState === 'opening' && isSelected;
          const isRevealed = gameState === 'revealed';
          
          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center border-2 rounded-xl transition-all duration-300 p-2 relative select-none cursor-pointer ${
                isSelected 
                  ? 'border-amber-500 bg-amber-50/20' 
                  : isRevealed 
                    ? 'border-slate-100 opacity-60 bg-slate-50/50' 
                    : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50'
              } ${isOpening ? 'animate-bounce' : ''}`}
              onClick={() => handleChestClick(idx)}
            >
              {/* Chest Icon */}
              <div className="text-4xl">
                {isRevealed 
                  ? (chest?.rarity === 'rare' ? '👑' : chest?.rarity === 'uncommon' ? '💎' : '🪙')
                  : '📦'}
              </div>
              
              <div className="mt-2 text-center">
                {isRevealed ? (
                  <>
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">
                      {chest?.label}
                    </span>
                    <div className="text-xs font-extrabold text-amber-600">
                      +{chest?.value}
                    </div>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-slate-400">Chest {idx + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {gameState === 'idle' && (
        <div className="flex flex-col gap-4 w-full">
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
          
          <p className="text-[10px] text-slate-400 text-center font-medium">
            Select one of the chests above to open
          </p>
        </div>
      )}

      {gameState === 'revealed' && (
        <Button
          onClick={resetGame}
          className="w-full font-bold h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
        >
          Draw Again
        </Button>
      )}

      {gameState === 'opening' && (
        <div className="w-full py-4 text-center text-xs font-bold text-amber-600 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Unlocking chest...
        </div>
      )}
    </div>
  );
};
