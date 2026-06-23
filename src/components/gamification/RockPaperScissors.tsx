import React, { useState, useEffect } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned, updateTotalGems } from '@/utils/gemsService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const CHOICES = [
  { name: 'rock', emoji: '✊', label: 'Rock' },
  { name: 'paper', emoji: '✋', label: 'Paper' },
  { name: 'scissors', emoji: '✌', label: 'Scissors' },
];

export const RockPaperScissors: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [gemsBalance, setGemsBalance] = useState<number>(0);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const haptics = useHaptics();
  
  const [gameState, setGameState] = useState<'idle' | 'battling' | 'result'>('idle');
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [aiChoice, setAiChoice] = useState<string | null>(null);
  const [result, setResult] = useState<'win' | 'tie' | 'lose' | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [hasPlayedFreeToday, setHasPlayedFreeToday] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Select Rock, Paper, or Scissors and play against the AI!');

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
        const freePlayed = localStorage.getItem(`rps_free_played_${session.user.id}_${today}`);
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

  const handlePlay = async (choice: string) => {
    if (gameState === 'battling') return;
    if (!userId) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to play Rock Paper Scissors.',
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

    setPlayerChoice(choice);
    haptics('medium');
    setGameState('battling');
    setMessage('Rock... Paper... Scissors...');

    // Trigger local storage tracking for daily mission progress
    const today = new Date().toISOString().split('T')[0];
    const missionKey = `daily_mission_rps_${userId}_${today}`;
    localStorage.setItem(missionKey, 'true');
    window.dispatchEvent(new CustomEvent('rpsPlayed'));

    setTimeout(async () => {
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

      showVideoAd(async () => {
        setGameState('result');
        setResult(battleOutcome);

        const baseAmount = isFreePlay ? 10 : betAmount;

        if (battleOutcome === 'win') {
          haptics('success');
          const reward = baseAmount * 2;
          await logGemsEarned(reward, userId);
          setGemsBalance(prev => prev + reward);
          
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.8 }
          });

          setMessage(`🎉 You Win! AI chose ${oppChoice.toUpperCase()}. Awarded ${reward} Gems!`);
          toast({
            title: '🎉 You Won!',
            description: `AI chose ${oppChoice}. You won ${reward} gems.`,
          });
        } else if (battleOutcome === 'tie') {
          haptics('warning');
          // Return stake back to user
          if (stake > 0) {
            await logGemsEarned(stake, userId);
            setGemsBalance(prev => prev + stake);
          }
          setMessage(`🤝 Tie! AI chose ${oppChoice.toUpperCase()}. Your stake has been returned.`);
          toast({
            title: '🤝 Tie Game!',
            description: 'No gems lost or gained.',
          });
        } else {
          haptics('error');
          setMessage(`😢 You Lost! AI chose ${oppChoice.toUpperCase()}. Better luck next time.`);
          toast({
            title: 'Better luck next time!',
            description: `AI chose ${oppChoice}. You lost your bet.`,
          });
        }

        if (isFreePlay) {
          localStorage.setItem(`rps_free_played_${userId}_${today}`, 'true');
          setHasPlayedFreeToday(true);
          setIsFreePlay(false);
        }
      });
    }, 1500);
  };

  const resetGame = () => {
    setGameState('idle');
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setMessage('Select Rock, Paper, or Scissors and play against the AI!');
  };

  const getEmoji = (name: string | null) => {
    return CHOICES.find(c => c.name === name)?.emoji || '';
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-sm mx-auto bg-card rounded-2xl border shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 text-yellow-600 font-bold text-xs bg-yellow-50 rounded-bl-xl border-l border-b border-yellow-100">
        <Coins className="w-3.5 h-3.5" />
        <span>{gemsBalance} Gems</span>
      </div>

      <div className="text-center w-full mt-4">
        <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <Sparkles className="text-orange-500 fill-orange-500 w-5 h-5 animate-pulse" />
          Rock Paper Scissors
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      {/* Battle visual frame */}
      <div className="flex justify-between items-center bg-slate-50 border rounded-2xl p-4 w-full h-32 relative overflow-hidden shadow-inner">
        {/* Player gesture */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">You</span>
          <span className={`text-4xl mt-2 ${gameState === 'battling' ? 'animate-bounce' : ''}`}>
            {playerChoice ? getEmoji(playerChoice) : '❓'}
          </span>
        </div>

        <div className="text-sm font-black text-slate-350">VS</div>

        {/* AI gesture */}
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">AI Opponent</span>
          <span className={`text-4xl mt-2 ${gameState === 'battling' ? 'animate-bounce' : ''}`}>
            {gameState === 'battling' ? '✊' : aiChoice ? getEmoji(aiChoice) : '❓'}
          </span>
        </div>
      </div>

      {gameState === 'idle' && (
        <div className="flex flex-col gap-4 w-full">
          {/* Choice Selection Grid */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {CHOICES.map(choice => (
              <Button
                key={choice.name}
                variant="outline"
                className="flex flex-col h-16 rounded-xl border-2 hover:bg-slate-50 border-slate-200 transition-all font-black text-xs uppercase"
                onClick={() => handlePlay(choice.name)}
              >
                <span className="text-2xl">{choice.emoji}</span>
                <span className="text-[9px] mt-1">{choice.label}</span>
              </Button>
            ))}
          </div>

          {/* Play Modes / Betting options */}
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
        </div>
      )}

      {gameState === 'result' && (
        <Button
          onClick={resetGame}
          className="w-full font-bold h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs uppercase tracking-wider transition-all mt-2"
        >
          Play Again
        </Button>
      )}

      {gameState === 'battling' && (
        <div className="w-full py-4 text-center text-xs font-bold text-orange-600 flex gap-2 justify-center items-center">
          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          Battling AI...
        </div>
      )}
      {adElement}
    </div>
  );
};
