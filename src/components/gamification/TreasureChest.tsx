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

interface Chest {
  id: number;
  rarity: 'common' | 'uncommon' | 'rare';
  value: number;
  label: string;
}

export const TreasureChest: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const [starsBalance, setStarsBalance] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const haptics = useHaptics();
  
  const [gameState, setGameState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chests, setChests] = useState<Chest[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Pick a treasure chest to open! Chest 2 requires 10 ⭐, Chest 3 requires 25 ⭐.');

  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch current points/gems & campaign stars
        const { data } = await supabase
          .from('profiles')
          .select('points, stars')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (data) {
          setGemsBalance(data.points || 0);
          setStarsBalance(data.stars || 0);
        }

        // Check daily streak
        const todayStr = new Date().toISOString().split('T')[0];
        const lastPlayedStr = localStorage.getItem(`treasure_chest_last_played_${session.user.id}`);
        const savedStreak = Number(localStorage.getItem(`treasure_chest_streak_${session.user.id}`) || '0');
        
        if (lastPlayedStr) {
          const lastPlayedDate = new Date(lastPlayedStr);
          const todayDate = new Date(todayStr);
          const diffTime = Math.abs(todayDate.getTime() - lastPlayedDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 1) {
            setStreak(savedStreak);
          } else {
            setStreak(0);
            localStorage.setItem(`treasure_chest_streak_${session.user.id}`, '0');
          }
        } else {
          setStreak(0);
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

    // Check Campaign Stars requirements
    if (chestIdx === 1 && starsBalance < 10) {
      toast({
        title: '🔒 Chest Locked',
        description: 'You need at least 10 Campaign Stars to unlock Chest 2 (Uncommon). Advance in the Quests Map to unlock!',
        variant: 'destructive',
      });
      return;
    }
    if (chestIdx === 2 && starsBalance < 25) {
      toast({
        title: '🔒 Chest Locked',
        description: 'You need at least 25 Campaign Stars to unlock Chest 3 (Rare). Advance in the Quests Map to unlock!',
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
    haptics('medium');
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

    // Update streak and calculate multiplier
    const lastPlayed = localStorage.getItem(`treasure_chest_last_played_${userId}`);
    let newStreak = streak;
    if (lastPlayed !== today) {
      if (lastPlayed) {
        const lastPlayedDate = new Date(lastPlayed);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate.getTime() - lastPlayedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak = streak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      setStreak(newStreak);
      localStorage.setItem(`treasure_chest_streak_${userId}`, String(newStreak));
      localStorage.setItem(`treasure_chest_last_played_${userId}`, today);
    }
    
    // Apply streak multiplier
    const multiplier = newStreak >= 5 ? 1.5 : newStreak >= 3 ? 1.25 : 1.0;
    selectedVal = Math.round(selectedVal * multiplier);

    // Generate random rewards for the other 2 chests
    const generateOtherChest = (): Chest => {
      const r = Math.random();
      let otherVal = 0;
      let otherRarity: 'common' | 'uncommon' | 'rare' = 'common';
      let otherLabel = '';

      if (r < 0.6) {
        otherRarity = 'common';
        otherVal = Math.round(baseAmount * 0.5);
        otherLabel = 'Common';
      } else if (r < 0.9) {
        otherRarity = 'uncommon';
        otherVal = Math.round(baseAmount * 1.5);
        otherLabel = 'Uncommon';
      } else {
        otherRarity = 'rare';
        otherVal = baseAmount * 5;
        otherLabel = 'RARE';
      }
      otherVal = Math.round(otherVal * multiplier);
      return { id: Math.random(), rarity: otherRarity, value: otherVal, label: otherLabel };
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
      showVideoAd(async () => {
        haptics('success');
        setGameState('revealed');
        
        if (selectedVal > 0) {
          await logGemsEarned(selectedVal, userId);
          setGemsBalance(prev => prev + selectedVal);
          
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });

          const bonusText = multiplier > 1 ? ` (${multiplier}x streak bonus!)` : '';
          if (selectedRarity === 'rare') {
            setMessage(`🏆 JACKPOT! You opened a RARE Chest and found ${selectedVal} Gems!${bonusText}`);
            toast({
              title: '🏆 RARE CHEST OPENED!',
              description: `Congratulations! You found the rare chest and won ${selectedVal} gems.`,
            });
          } else if (selectedRarity === 'uncommon') {
            setMessage(`🎉 NICE! You opened an Uncommon Chest and found ${selectedVal} Gems!${bonusText}`);
            toast({
              title: '🎉 Uncommon Chest Opened!',
              description: `You found an Uncommon chest and won ${selectedVal} gems.`,
            });
          } else {
            setMessage(`✨ You opened a Common Chest and found ${selectedVal} Gems!${bonusText}`);
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
      });
    }, 1200);
  };

  const resetGame = () => {
    setGameState('idle');
    setSelectedChest(null);
    setChests([]);
    setMessage('Pick a treasure chest to open! Chest 2 requires 10 ⭐, Chest 3 requires 25 ⭐.');
  };

  if (isSuspended) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 max-w-sm mx-auto parchment-card rounded-3xl text-center border-2 border-amber-850/20">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h3 className="text-lg font-black text-stone-900 font-serif">Game Suspended</h3>
        <p className="text-xs text-stone-600 leading-relaxed font-semibold">
          This game is temporarily suspended by the administrator. Please check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-sm mx-auto panel-3d bg-white rounded-3xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-primary font-bold text-xs bg-primary/10 rounded-bl-xl border-l border-b border-primary/20">
        <Coins className="w-3.5 h-3.5 text-primary" />
        <span>{gemsBalance} Gems</span>
      </div>

      <div className="text-center w-full mt-4">
        <h3 className="text-xl font-black text-foreground tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="text-primary fill-primary w-6 h-6 animate-pulse" />
          Treasure Chests
        </h3>
        {streak > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border-2 border-secondary/20 text-secondary text-[11px] font-black mt-2 uppercase tracking-wide">
            🔥 {streak}-Day Streak ({streak >= 5 ? '1.5x' : streak >= 3 ? '1.25x' : '1.0x'} Boost)
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 max-w-[240px] mx-auto leading-relaxed font-bold">
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
          const isLocked = (idx === 1 && starsBalance < 10) || (idx === 2 && starsBalance < 25);
          
          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center justify-center border-2 rounded-2xl transition-all duration-300 p-2 relative select-none cursor-pointer ${
                isLocked
                  ? 'border-muted opacity-60 bg-muted/20 cursor-not-allowed'
                  : isSelected 
                    ? 'border-primary bg-primary/10 shadow-inner' 
                    : isRevealed 
                      ? 'border-muted opacity-60 bg-muted/40' 
                      : 'border-white hover:border-primary/50 hover:bg-primary/5 shadow-sm bg-muted/10 panel-3d'
              } ${isOpening ? 'animate-bounce' : ''}`}
              onClick={() => handleChestClick(idx)}
            >
              {/* Chest Icon */}
              <div className="text-4xl">
                {isRevealed 
                  ? (chest?.rarity === 'rare' ? '👑' : chest?.rarity === 'uncommon' ? '💎' : '🪙')
                  : isLocked 
                    ? '🔒' 
                    : '📦'}
              </div>
              
              <div className="mt-2 text-center">
                {isRevealed ? (
                  <>
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                      {chest?.label}
                    </span>
                    <div className="text-sm font-black text-primary drop-shadow-sm mt-0.5">
                      +{chest?.value}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black text-muted-foreground tracking-tight">Chest {idx + 1}</span>
                    {isLocked && (
                      <span className="text-[9px] font-black text-destructive uppercase tracking-tight mt-1 bg-destructive/10 px-1.5 py-0.5 rounded-md">
                        {idx === 1 ? '10 ⭐ Req' : '25 ⭐ Req'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {gameState === 'idle' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Play Modes / Betting options */}
          <div className="flex flex-col gap-2 w-full pt-1 border-t border-amber-800/15">
            <div className="flex justify-between items-center text-[11px] font-bold text-muted-foreground mb-1 px-1">
              <span className="uppercase tracking-wider">Bet Amount:</span>
              <span className="text-foreground">{isFreePlay ? 'FREE PLAY' : `${betAmount} Gems`}</span>
            </div>

            <div className="flex gap-2 w-full justify-between items-center bg-stone-900/5 rounded-xl p-1 border border-amber-800/10">
              <Button
                variant={isFreePlay ? 'secondary' : 'ghost'}
                disabled={hasPlayedFreeToday}
                className={`flex-1 text-[11px] font-black h-9 rounded-xl uppercase tracking-wide transition-all ${
                  isFreePlay 
                    ? 'panel-3d bg-white text-primary border-2 border-primary/20' 
                    : 'text-muted-foreground hover:bg-muted'
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
                    className={`flex-1 text-[12px] font-black h-9 rounded-xl px-0 transition-all ${
                      !isFreePlay && betAmount === amt 
                        ? 'panel-3d bg-white text-foreground border-2 border-primary/20' 
                        : 'text-muted-foreground hover:bg-muted'
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
              <p className="text-[10px] text-stone-500 text-center font-medium mt-1">
                Daily free play used. Playing for gems.
              </p>
            )}
          </div>
          
          <p className="text-[10px] text-stone-500 text-center font-medium">
            Select one of the chests above to open
          </p>
        </div>
      )}

      {gameState === 'revealed' && (
        <Button
          onClick={resetGame}
          className="w-full btn-3d btn-3d-primary mt-2 uppercase"
        >
          Draw Again
        </Button>
      )}

      {gameState === 'opening' && (
        <div className="w-full py-4 text-center text-xs font-bold text-amber-700 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Unlocking chest...
        </div>
      )}
      {adElement}
    </div>
  );
};
