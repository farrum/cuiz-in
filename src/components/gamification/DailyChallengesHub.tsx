import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyRiddleVault } from './DailyRiddleVault';
import { TriviaWordle } from './TriviaWordle';
import { DailyMissions } from './DailyMissions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DailyChallengesHub: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [hasPlayedWordle, setHasPlayedWordle] = useState(false);
  const [hasAttemptedRiddle, setHasAttemptedRiddle] = useState(false);
  const [hourlyWordle, setHourlyWordle] = useState<{ clue: string, answer: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      // Fetch today's config
      const { data: settingData } = await supabase
        .from('gamification_settings')
        .select('config')
        .eq('setting_type', 'daily_challenges')
        .single();
        
      if (settingData?.config) {
        setConfig(settingData.config);
      }

      // Fetch hourly Wordle from RPC
      const { data: wordleData, error: wordleError } = await supabase.rpc('get_hourly_wordle');
      if (!wordleError && wordleData && wordleData.length > 0) {
        setHourlyWordle({
          clue: wordleData[0].question,
          answer: wordleData[0].correct_answer
        });
      }

      // Check if user played today/this hour
      const today = new Date().toISOString().split('T')[0];
      const currentHour = new Date().getHours();
      
      const wordlePlayed = localStorage.getItem(`wordle_${today}_${currentHour}`);
      const riddleAttempted = localStorage.getItem(`riddle_${today}`);
      
      if (wordlePlayed) setHasPlayedWordle(true);
      if (riddleAttempted) setHasAttemptedRiddle(true);

    } catch (err) {
      console.error("Error fetching daily challenges", err);
    } finally {
      setIsLoading(false);
    }
  };

  const grantGems = async (amount: number) => {
    const { data: session } = await supabase.auth.getSession();
    if (session?.session?.user && amount > 0) {
      const sb = supabase as any;
      const { data } = await sb.from('profiles').select('points').eq('id', session.session.user.id).maybeSingle();
      const currentBalance = (data as any)?.points || 0;
      await sb.from('profiles').update({ points: currentBalance + amount }).eq('id', session.session.user.id);
    }
  };

  const handleWordleComplete = async (score: number) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    localStorage.setItem(`wordle_${today}_${currentHour}`, 'true');
    setHasPlayedWordle(true);
    
    if (score > 0) {
      await grantGems(score);
      toast({ title: 'Gems Added!', description: `You earned ${score} Gems from Wordle!` });
    }
  };

  const handleRiddleSubmit = async (guess: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`riddle_${today}`, 'true');
    setHasAttemptedRiddle(true);

    const isCorrect = guess.toLowerCase() === (config.riddle_answer || '').toLowerCase();
    
    if (isCorrect) {
      await grantGems(500);
      return { success: true, message: 'You have been awarded 500 Gems!', gemsWon: 500 };
    }
    
    return { success: false, message: 'Your guess was incorrect.' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48 bg-slate-50 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!config && !hourlyWordle) {
    return <div className="p-8 text-center text-slate-500">No challenges configured for today.</div>;
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Daily Missions Checklist at the Top */}
      <DailyMissions />

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 px-2">Trivia Wordle</h2>
        {hasPlayedWordle ? (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            You've already solved this hour's Wordle. Come back in the next hour for a new one!
          </div>
        ) : (
          <TriviaWordle 
            key={hourlyWordle?.answer || config?.wordle_answer}
            clue={hourlyWordle?.clue || config?.wordle_clue}
            targetWord={hourlyWordle?.answer || config?.wordle_answer}
            onComplete={handleWordleComplete}
          />
        )}
      </div>

      <div className="space-y-4">
        <DailyRiddleVault 
          riddleText={config.riddle_text}
          hasAttemptedToday={hasAttemptedRiddle}
          onSubmit={handleRiddleSubmit}
        />
      </div>
    </div>
  );
};
