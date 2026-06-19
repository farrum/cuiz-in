import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Card {
  id: number;
  rarity: 'common' | 'uncommon' | 'rare';
  value: number;
  label: string;
}

export const LuckyCardDraw: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  
  const [gameState, setGameState] = useState<'idle' | 'flipping' | 'revealed'>('idle');
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Pick a card to reveal your reward! Rare card wins 5x!');
  
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
        const freePlayed = localStorage.getItem(`lucky_card_free_played_${session.user.id}_${today}`);
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

  const handleCardClick = async (cardIndex: number) => {
    if (gameState !== 'idle') return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play the Lucky Card Draw.',
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

    setGameState('flipping');
    setSelectedCard(cardIndex);
    setMessage('Revealing your card...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_lucky_card_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('luckyCardPlayed'));

    // Payout calculation
    const baseAmount = isFreePlay ? 10 : betAmount;

    // Define probabilities for the selected card
    // Common (60%): 0.5x bet
    // Uncommon (30%): 1.5x bet
    // Rare (10%): 5x bet
    const roll = Math.random();
    let selectedCardRarity: 'common' | 'uncommon' | 'rare';
    let selectedCardVal = 0;
    let selectedCardLabel = '';

    if (roll < 0.6) {
      selectedCardRarity = 'common';
      selectedCardVal = Math.round(baseAmount * 0.5);
      selectedCardLabel = 'Common';
    } else if (roll < 0.9) {
      selectedCardRarity = 'uncommon';
      selectedCardVal = Math.round(baseAmount * 1.5);
      selectedCardLabel = 'Uncommon';
    } else {
      selectedCardRarity = 'rare';
      selectedCardVal = baseAmount * 5;
      selectedCardLabel = 'RARE';
    }

    // Generate random rewards for the other 2 cards
    const generateOtherCard = (): Card => {
      const r = Math.random();
      if (r < 0.6) {
        return { id: Math.random(), rarity: 'common', value: Math.round(baseAmount * 0.5), label: 'Common' };
      } else if (r < 0.9) {
        return { id: Math.random(), rarity: 'uncommon', value: Math.round(baseAmount * 1.5), label: 'Uncommon' };
      } else {
        return { id: Math.random(), rarity: 'rare', value: baseAmount * 5, label: 'RARE' };
      }
    };

    const newCards: Card[] = [];
    for (let i = 0; i < 3; i++) {
      if (i === cardIndex) {
        newCards.push({
          id: i,
          rarity: selectedCardRarity,
          value: selectedCardVal,
          label: selectedCardLabel,
        });
      } else {
        newCards.push({ ...generateOtherCard(), id: i });
      }
    }
    setCards(newCards);

    setTimeout(async () => {
      setGameState('revealed');
      
      if (selectedCardVal > 0) {
        await logGemsEarned(selectedCardVal, userId);
        setGemsBalance(prev => prev + selectedCardVal);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });

        if (selectedCardRarity === 'rare') {
          setMessage(`🏆 JACKPOT! You drew a RARE card and won ${selectedCardVal} Gems!`);
          toast({
            title: '🏆 RARE CARD DRAWN!',
            description: `Congratulations! You found the rare card and won ${selectedCardVal} gems.`,
          });
        } else if (selectedCardRarity === 'uncommon') {
          setMessage(`🎉 NICE! You drew an Uncommon card and won ${selectedCardVal} Gems!`);
          toast({
            title: '🎉 Uncommon Card Drawn!',
            description: `You found an Uncommon card and won ${selectedCardVal} gems.`,
          });
        } else {
          setMessage(`✨ You drew a Common card and won ${selectedCardVal} Gems!`);
          toast({
            title: '✨ Card Revealed',
            description: `Drew a Common card. Awarded ${selectedCardVal} gems.`,
          });
        }
      }

      if (isFreePlay) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`lucky_card_free_played_${userId}_${today}`, 'true');
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      }
    }, 1000);
  };

  const resetGame = () => {
    setGameState('idle');
    setSelectedCard(null);
    setCards([]);
    setMessage('Pick a card to reveal your reward! Rare card wins 5x!');
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-yellow-600 font-bold text-xs bg-yellow-50 rounded-bl-xl border-l border-b border-yellow-100">
        <Coins className="w-3.5 h-3.5" />
        <span>{gemsBalance} Gems</span>
      </div>

      <div className="text-center w-full mt-4">
        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="text-yellow-500 fill-yellow-500 w-5 h-5 animate-pulse" />
          Lucky Card Draw
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-3 gap-3 w-full my-2 h-36">
        {[0, 1, 2].map((idx) => {
          const card = cards[idx];
          const isSelected = selectedCard === idx;
          const isFlipped = gameState === 'revealed' || (gameState === 'flipping' && isSelected);
          
          return (
            <div 
              key={idx} 
              className="relative w-full h-full [perspective:1000px] cursor-pointer group"
              onClick={() => handleCardClick(idx)}
            >
              <div 
                className={`w-full h-full relative rounded-xl transition-transform duration-500 [transform-style:preserve-3d] ${
                  isFlipped ? '[transform:rotateY(180deg)]' : 'group-hover:scale-105'
                }`}
              >
                {/* Face Down (Card Back) */}
                <div className="absolute w-full h-full rounded-xl border-[3px] border-amber-500 bg-gradient-to-br from-amber-400 to-yellow-600 shadow-md flex items-center justify-center [backface-visibility:hidden]">
                  <div className="w-10 h-10 rounded-full border border-yellow-300 flex items-center justify-center bg-amber-500/20">
                    <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-100" />
                  </div>
                </div>

                {/* Face Up (Card Front) */}
                <div 
                  className={`absolute w-full h-full rounded-xl border-2 shadow-inner flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                    card?.rarity === 'rare' 
                      ? 'bg-purple-50 border-purple-300 text-purple-700' 
                      : card?.rarity === 'uncommon'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                    {card?.label || 'Mystery'}
                  </span>
                  <div className="flex items-center gap-0.5 mt-2 text-yellow-600">
                    <Coins className="w-3.5 h-3.5 fill-yellow-400 text-yellow-600" />
                    <span className="font-extrabold text-sm">+{card?.value || 0}</span>
                  </div>
                </div>
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
            Select one of the cards above to draw
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

      {gameState === 'flipping' && (
        <div className="w-full py-4 text-center text-xs font-bold text-amber-600 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
          Flipping Card...
        </div>
      )}
    </div>
  );
};
