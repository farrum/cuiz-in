import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, Gift, Lock, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Chest {
  id: number;
  rarity: 'common' | 'uncommon' | 'rare';
  value: number;
  label: string;
  multiplier: number;
}

export const TreasureChest: React.FC = () => {
  const [userId, setUserId] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('cuizin_user_id') : null) ||
      'guest'
    );
  });
  const [gemsBalance, setGemsBalance] = useState<number>(() => getUserBalances().gems);
  const [starsBalance, setStarsBalance] = useState<number>(() => getUserBalances().stars);
  const { showVideoAd } = useMiniGameVideoAd();
  const haptics = useHaptics();

  const [gameState, setGameState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [selectedChest, setSelectedChest] = useState<number | null>(null);
  const [chests, setChests] = useState<Chest[]>([]);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Pick a treasure chest to unlock royal bounty!');

  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      const { gems, stars } = getUserBalances();
      setGemsBalance(gems);
      setStarsBalance(stars);

      const { data: { session } } = await supabase.auth.getSession();
      const currentId = session?.user?.id || userId;
      if (session?.user?.id) {
        setUserId(session.user.id);
        const { data } = await supabase.from('profiles').select('points, stars').eq('id', session.user.id).maybeSingle();
        if (data) {
          if (data.points !== undefined && data.points !== null) setGemsBalance(Number(data.points));
          if (data.stars !== undefined && data.stars !== null) setStarsBalance(Number(data.stars));
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const freePlayed = localStorage.getItem(`treasure_chest_free_played_${currentId}_${today}`);
      if (freePlayed === 'true') {
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      } else {
        setIsFreePlay(true);
      }
    };

    fetchUser();

    const handleGemsUpdated = () => {
      const { gems, stars } = getUserBalances();
      setGemsBalance(gems);
      setStarsBalance(stars);
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    window.addEventListener('starsUpdated', handleGemsUpdated);
    return () => {
      window.removeEventListener('gemsUpdated', handleGemsUpdated);
      window.removeEventListener('starsUpdated', handleGemsUpdated);
    };
  }, [userId]);

  const handleChestClick = async (chestIdx: number) => {
    if (gameState !== 'idle') return;

    // Check Star requirements for higher tier chests
    if (chestIdx === 1 && starsBalance < 5) {
      haptics('warning');
      toast({
        title: '🔒 Chest Locked',
        description: 'You need at least 5 Stars to open the Silver Chest. Play Quest battles to earn stars!',
        variant: 'destructive',
      });
      return;
    }
    if (chestIdx === 2 && starsBalance < 15) {
      haptics('warning');
      toast({
        title: '🔒 Chest Locked',
        description: 'You need at least 15 Stars to open the Golden Vault.',
        variant: 'destructive',
      });
      return;
    }

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to open a chest.`,
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

    setSelectedChest(chestIdx);
    setGameState('opening');
    haptics('medium');
    setMessage('Unlocking ancient seal...');

    const baseAmount = isFreePlay ? 10 : betAmount;

    // Generate random rewards
    const mults = [1.5, 3.0, 6.0];
    const chosenMult = mults[chestIdx] || 2.0;
    const isJackpot = Math.random() < 0.2;
    const finalMult = isJackpot ? chosenMult * 2 : chosenMult;
    const reward = Math.round(baseAmount * finalMult);

    const generatedChests: Chest[] = [
      { id: 0, rarity: 'common', value: Math.round(baseAmount * 1.5), label: 'Bronze Hoard', multiplier: 1.5 },
      { id: 1, rarity: 'uncommon', value: Math.round(baseAmount * 3.0), label: 'Silver Stash', multiplier: 3.0 },
      { id: 2, rarity: 'rare', value: Math.round(baseAmount * 6.0), label: 'Royal Vault', multiplier: 6.0 },
    ];
    generatedChests[chestIdx].value = reward;
    setChests(generatedChests);

    setTimeout(() => {
      showVideoAd(() => {
        setGameState('revealed');
        haptics('success');

        updateUserBalances(reward, 0);
        setGemsBalance((prev) => prev + reward);
        window.dispatchEvent(new CustomEvent('gemsUpdated'));

        if (userId && userId !== 'guest') {
          logGemsEarned(reward, userId).catch(() => {});
        }

        confetti({
          particleCount: 110,
          spread: 75,
          origin: { y: 0.7 },
        });

        setMessage(`🎉 Chest Opened! You claimed ${reward} Gems!`);
        toast({
          title: '🎉 Treasure Claimed!',
          description: `You won ${reward} gems from the chest!`,
        });

        const today = new Date().toISOString().split('T')[0];
        if (isFreePlay) {
          localStorage.setItem(`treasure_chest_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }

        window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
      });
    }, 1200);
  };

  const resetGame = () => {
    setGameState('idle');
    setSelectedChest(null);
    setChests([]);
    setMessage('Pick another chest to continue your conquest!');
  };

  return (
    <div className="flex flex-col items-center gap-5 p-2 sm:p-4 max-w-sm mx-auto select-none">
      {/* Balance Bar */}
      <div className="w-full flex justify-between items-center px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-slate-700">💎 {gemsBalance}</span>
          <span className="text-sm font-black text-amber-600 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {starsBalance}
          </span>
        </div>
        {isFreePlay && (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse">
            Free Daily Chest
          </span>
        )}
      </div>

      {/* 3D Treasury Box */}
      <div
        className="w-full rounded-3xl p-5 relative flex flex-col items-center shadow-xl border-4 border-amber-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(38 75% 25%) 0%, hsl(24 85% 15%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-amber-300 drop-shadow-sm flex items-center justify-center gap-1">
            <Gift className="w-4 h-4" /> Royal Vault Relics
          </span>
        </div>

        {/* 3 Chest Choices */}
        <div className="grid grid-cols-3 gap-2.5 w-full my-2">
          {[
            { name: 'Bronze', emoji: '📦', minStars: 0, mult: '1.5x' },
            { name: 'Silver', emoji: '🪙', minStars: 5, mult: '3.0x' },
            { name: 'Gold Vault', emoji: '👑', minStars: 15, mult: '6.0x' },
          ].map((c, idx) => {
            const isLocked = starsBalance < c.minStars;
            const isThisSelected = selectedChest === idx;

            return (
              <button
                key={idx}
                disabled={gameState !== 'idle'}
                onClick={() => handleChestClick(idx)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all relative overflow-hidden ${
                  isThisSelected
                    ? 'bg-amber-400/30 border-amber-300 shadow-lg scale-105 animate-pulse'
                    : isLocked
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : 'bg-slate-950/80 border-amber-500/30 hover:border-amber-400 shadow-md active:scale-95'
                }`}
              >
                {isLocked ? (
                  <Lock className="w-6 h-6 text-slate-500 my-2" />
                ) : (
                  <span className={`text-4xl my-1 ${gameState === 'opening' && isThisSelected ? 'animate-bounce' : ''}`}>
                    {gameState === 'revealed' && isThisSelected ? '🏆' : c.emoji}
                  </span>
                )}

                <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 mt-1">
                  {c.name}
                </span>

                <span className="text-[9px] font-bold text-amber-400/80">
                  {isLocked ? `${c.minStars}★ Req` : `Up to ${c.mult}`}
                </span>

                {gameState === 'revealed' && chests[idx] && (
                  <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-1 animate-in zoom-in">
                    <span className="text-xs font-black text-amber-300">+{chests[idx].value}</span>
                    <span className="text-[8px] font-bold text-slate-400">Gems</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Message Banner */}
        <div className="w-full mt-3 bg-black/40 rounded-xl p-2.5 text-center min-h-[40px] flex items-center justify-center">
          <p className="text-xs font-black text-amber-200 leading-tight">{message}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex flex-col gap-3">
        {gameState === 'revealed' ? (
          <Button
            onClick={resetGame}
            className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-0 shadow-lg"
          >
            Open Another Chest
          </Button>
        ) : (
          !isFreePlay && (
            <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <span className="text-[11px] font-black uppercase text-slate-500 px-2">Stake:</span>
              <div className="flex gap-1.5">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    disabled={gameState !== 'idle'}
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
          )
        )}
      </div>
    </div>
  );
};

export default TreasureChest;
