import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logGemsEarned } from '@/utils/gemsService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Coins, Dices, Layers, CheckCircle2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  target: number;
  icon: React.ComponentType<any>;
  progress: number;
  claimed: boolean;
}

export const DailyMissions: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const { toast } = useToast();

  const fetchMissionsProgress = async (uid: string) => {
    const today = new Date().toISOString().split('T')[0];

    // Read progress from localStorage
    const triviaProgress = Number(localStorage.getItem(`daily_mission_trivia_${uid}_${today}`) || '0');
    const coinFlipProgress = localStorage.getItem(`daily_mission_coin_flip_${uid}_${today}`) === 'true' ? 1 : 0;
    const diceRollProgress = localStorage.getItem(`daily_mission_dice_roll_${uid}_${today}`) === 'true' ? 1 : 0;
    const luckyCardProgress = localStorage.getItem(`daily_mission_lucky_card_${uid}_${today}`) === 'true' ? 1 : 0;

    // Read claimed states from localStorage
    const triviaClaimed = localStorage.getItem(`daily_mission_claimed_trivia_${uid}_${today}`) === 'true';
    const coinFlipClaimed = localStorage.getItem(`daily_mission_claimed_coin_flip_${uid}_${today}`) === 'true';
    const diceRollClaimed = localStorage.getItem(`daily_mission_claimed_dice_roll_${uid}_${today}`) === 'true';
    const luckyCardClaimed = localStorage.getItem(`daily_mission_claimed_lucky_card_${uid}_${today}`) === 'true';

    setMissions([
      {
        id: 'trivia',
        title: 'Daily Trivia',
        description: 'Answer 5 quiz questions today',
        reward: 15,
        target: 5,
        icon: BookOpen,
        progress: Math.min(triviaProgress, 5),
        claimed: triviaClaimed,
      },
      {
        id: 'coinFlip',
        title: 'Coin Flipper',
        description: 'Play the Coin Flip game 1 time',
        reward: 10,
        target: 1,
        icon: Coins,
        progress: coinFlipProgress,
        claimed: coinFlipClaimed,
      },
      {
        id: 'diceRoll',
        title: 'High Roller',
        description: 'Play the Dice Roll game 1 time',
        reward: 10,
        target: 1,
        icon: Dices,
        progress: diceRollProgress,
        claimed: diceRollClaimed,
      },
      {
        id: 'luckyCard',
        title: 'Card Collector',
        description: 'Play the Lucky Card Draw 1 time',
        reward: 10,
        target: 1,
        icon: Layers,
        progress: luckyCardProgress,
        claimed: luckyCardClaimed,
      },
    ]);
  };

  useEffect(() => {
    const initUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchMissionsProgress(session.user.id);
      }
    };

    initUser();

    // Re-fetch progress when events occur
    const handleUpdate = () => {
      if (userId) {
        fetchMissionsProgress(userId);
      } else {
        initUser();
      }
    };

    window.addEventListener('coinFlipPlayed', handleUpdate);
    window.addEventListener('diceRollPlayed', handleUpdate);
    window.addEventListener('luckyCardPlayed', handleUpdate);
    window.addEventListener('quizQuestionCompleted', handleUpdate);
    window.addEventListener('gemsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('coinFlipPlayed', handleUpdate);
      window.removeEventListener('diceRollPlayed', handleUpdate);
      window.removeEventListener('luckyCardPlayed', handleUpdate);
      window.removeEventListener('quizQuestionCompleted', handleUpdate);
      window.removeEventListener('gemsUpdated', handleUpdate);
    };
  }, [userId]);

  const handleClaim = async (mission: Mission) => {
    if (!userId) return;
    if (mission.progress < mission.target || mission.claimed) return;

    try {
      // Award reward
      await logGemsEarned(mission.reward, userId);

      // Save claimed state
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem(`daily_mission_claimed_${mission.id}_${userId}_${today}`, 'true');

      // Trigger animation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update state
      fetchMissionsProgress(userId);

      toast({
        title: '🎉 Reward Claimed!',
        description: `Successfully claimed ${mission.reward} gems for completing "${mission.title}".`,
      });
    } catch (error) {
      console.error('Error claiming mission reward:', error);
      toast({
        title: 'Error',
        description: 'Failed to claim reward. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full bg-card rounded-2xl border shadow-sm p-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500 fill-amber-500/20" />
          <div>
            <h3 className="font-black text-slate-800 text-lg tracking-tight">Daily Missions</h3>
            <p className="text-xs text-slate-500 font-medium">Complete daily tasks to claim extra gems</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {missions.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400 font-medium">
            Loading your daily tasks...
          </div>
        ) : (
          missions.map((mission) => {
            const Icon = mission.icon;
            const isCompleted = mission.progress >= mission.target;
            const percentage = (mission.progress / mission.target) * 100;

            return (
              <div 
                key={mission.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                  mission.claimed 
                    ? 'bg-slate-50/50 border-slate-100 opacity-70' 
                    : isCompleted 
                      ? 'bg-emerald-50/20 border-emerald-100' 
                      : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex gap-3.5 items-start flex-1">
                  <div className={`p-2.5 rounded-lg border ${
                    mission.claimed
                      ? 'bg-slate-100 border-slate-200 text-slate-400'
                      : isCompleted
                        ? 'bg-emerald-500/10 border-emerald-200 text-emerald-600'
                        : 'bg-indigo-50/50 border-indigo-100 text-indigo-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800 tracking-tight">
                        {mission.title}
                      </h4>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        mission.claimed
                          ? 'bg-slate-200 text-slate-500'
                          : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        +{mission.reward} Gems
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {mission.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mt-3.5">
                      <Progress value={percentage} className="h-1.5 flex-1" />
                      <span className="text-[10px] font-black text-slate-600 min-w-[30px] text-right">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:self-center flex justify-end">
                  {mission.claimed ? (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-slate-400" />
                      <span>Claimed</span>
                    </div>
                  ) : isCompleted ? (
                    <Button
                      onClick={() => handleClaim(mission)}
                      size="sm"
                      className="font-bold text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg px-4 shadow-md shadow-emerald-500/10 border-0 transition-all hover:scale-105 active:scale-[0.98] animate-pulse"
                    >
                      Claim Reward
                    </Button>
                  ) : (
                    <Button
                      disabled
                      size="sm"
                      variant="outline"
                      className="font-bold text-xs rounded-lg px-4 text-slate-400 bg-slate-50 border-slate-200 cursor-not-allowed"
                    >
                      In Progress
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
