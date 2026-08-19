import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { getUserBalances, updateUserBalances } from '@/utils/shopData';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles, Swords } from 'lucide-react';
import confetti from 'canvas-confetti';

const CHOICES = [
  { name: 'rock', emoji: '✊', label: 'Rock' },
  { name: 'paper', emoji: '✋', label: 'Paper' },
  { name: 'scissors', emoji: '✌', label: 'Scissors' },
];

export const RockPaperScissors: React.FC = () => {
  const [userId, setUserId] = useState<string>(() => {
    return (
      (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) || localStorage.getItem('cuizin_user_id') : null) ||
      'guest'
    );
  });
  const [gemsBalance, setGemsBalance] = useState<number>(() => getUserBalances().gems);
  const { showVideoAd } = useMiniGameVideoAd();
  const haptics = useHaptics();

  const [gameState, setGameState] = useState<'idle' | 'battling' | 'result'>('idle');
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<'win' | 'tie' | 'lose' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Select Rock, Paper, or Scissors to duel the Royal Bot!');

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
      const freePlayed = localStorage.getItem(`rps_free_played_${currentId}_${today}`);
      if (freePlayed === 'true') {
        setHasPlayedFreeToday(true);
        setIsFreePlay(false);
      } else {
        setIsFreePlay(true);
      }
    };

    fetchUser();

    const handleGemsUpdated = () => {
      const { gems } = getUserBalances();
      setGemsBalance(gems);
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    return () => window.removeEventListener('gemsUpdated', handleGemsUpdated);
  }, [userId]);

  const handlePlay = async (choice: string) => {
    if (gameState === 'battling') return;

    const stake = isFreePlay ? 0 : betAmount;
    if (gemsBalance < stake) {
      haptics('error');
      toast({
        title: 'Insufficient Gems',
        description: `You need at least ${stake} gems to duel.`,
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

    setPlayerChoice(choice);
    haptics('medium');
    setGameState('battling');
    setMessage('Rock… Paper… Scissors… Shoot!');

    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_rps_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('rpsPlayed'));

    setTimeout(() => {
      const oppChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)].name;
      setAiChoice(oppChoice);

      let battleOutcome: 'win' | 'tie' | 'lose';
      if (choice === oppChoice) {
        battleOutcome = 'tie';
      } else if (
        (choice === 'rock' && oppChoice === 'scissors') ||
        (choice === 'scissors' && oppChoice === 'paper') ||
        (choice === 'paper' && oppChoice === 'rock')
      ) {
        battleOutcome = 'win';
      } else {
        battleOutcome = 'lose';
      }

      showVideoAd(() => {
        setGameState('result');
        setResult(battleOutcome);

        const baseAmount = isFreePlay ? 10 : betAmount;

        if (battleOutcome === 'win') {
          haptics('success');
          const reward = baseAmount * 2;
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

          setMessage(`🎉 Victory! Bot chose ${oppChoice.toUpperCase()}. Won ${reward} Gems!`);
          toast({
            title: '🎉 You Won!',
            description: `Bot chose ${oppChoice}. You won ${reward} gems.`,
          });
        } else if (battleOutcome === 'tie') {
          haptics('warning');
          if (stake > 0) {
            updateUserBalances(stake, 0);
            setGemsBalance((prev) => prev + stake);
            window.dispatchEvent(new CustomEvent('gemsUpdated'));
          }
          setMessage(`🤝 Tie! Bot chose ${oppChoice.toUpperCase()}. Stake returned.`);
          toast({
            title: '🤝 Tie Game!',
            description: 'No gems lost.',
          });
        } else {
          haptics('error');
          setMessage(`😢 Defeat! Bot chose ${oppChoice.toUpperCase()}. Better luck next duel!`);
          toast({
            title: 'Bot took the round!',
            description: `Bot chose ${oppChoice}.`,
          });
        }

        if (isFreePlay) {
          localStorage.setItem(`rps_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }

        window.dispatchEvent(new CustomEvent('miniGameRoundComplete'));
      });
    }, 1200);
  };

  const resetGame = () => {
    setGameState('idle');
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setMessage('Select your move for the next round!');
  };

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
            Free Daily Duel
          </span>
        )}
      </div>

      {/* 3D Battle Arena Box */}
      <div
        className="w-full rounded-3xl p-5 relative flex flex-col items-center shadow-xl border-4 border-indigo-600/40"
        style={{
          background: 'linear-gradient(160deg, hsl(260 65% 25%) 0%, hsl(240 75% 15%) 100%)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)',
        }}
      >
        <div className="text-center mb-3">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-300 drop-shadow-sm flex items-center justify-center gap-1">
            <Swords className="w-4 h-4" /> Royal Hand Duel
          </span>
        </div>

        {/* Battle Duel Stage */}
        <div className="w-full bg-slate-950/90 rounded-2xl p-4 border-2 border-indigo-400/40 flex justify-around items-center min-h-[120px] shadow-inner">
          {/* Player Side */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-indigo-300 uppercase">You</span>
            <div className="w-16 h-16 rounded-2xl bg-indigo-900/60 border border-indigo-400/50 flex items-center justify-center text-3xl shadow-md">
              {playerChoice ? CHOICES.find((c) => c.name === playerChoice)?.emoji : '❓'}
            </div>
          </div>

          <span className="text-xl font-black text-amber-400">VS</span>

          {/* AI Side */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-rose-300 uppercase">Royal Bot</span>
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-400/50 flex items-center justify-center text-3xl shadow-md">
              {gameState === 'battling' ? (
                <span className="animate-spin text-2xl">⚔️</span>
              ) : aiChoice ? (
                CHOICES.find((c) => c.name === aiChoice)?.emoji
              ) : (
                '🤖'
              )}
            </div>
          </div>
        </div>

        {/* Outcome Message */}
        <div className="w-full mt-3 bg-black/40 rounded-xl p-2.5 text-center min-h-[40px] flex items-center justify-center">
          <p className="text-xs font-black text-indigo-200 leading-tight">{message}</p>
        </div>
      </div>

      {/* Move Choice Buttons */}
      <div className="w-full flex flex-col gap-3">
        {gameState === 'result' ? (
          <Button
            onClick={resetGame}
            className="w-full h-13 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 border-0 shadow-lg"
          >
            Play Next Round
          </Button>
        ) : (
          <>
            {!isFreePlay && (
              <div className="flex justify-between items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-black uppercase text-slate-500 px-2">Duel Stake:</span>
                <div className="flex gap-1.5">
                  {[5, 10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      disabled={gameState === 'battling'}
                      onClick={() => { haptics('light'); setBetAmount(amt); }}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                        betAmount === amt
                          ? 'bg-indigo-600 text-white shadow-sm scale-105'
                          : 'bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2.5 w-full">
              {CHOICES.map((choice) => (
                <button
                  key={choice.name}
                  disabled={gameState === 'battling'}
                  onClick={() => handlePlay(choice.name)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border-2 border-indigo-200 shadow-sm hover:border-indigo-400 hover:shadow-md active:scale-95 transition-all"
                >
                  <span className="text-3xl mb-1">{choice.emoji}</span>
                  <span className="text-[11px] font-black uppercase text-slate-700">{choice.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RockPaperScissors;
