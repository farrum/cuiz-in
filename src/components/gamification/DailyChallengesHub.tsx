import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyRiddleVault } from './DailyRiddleVault';
import { TriviaWordle } from './TriviaWordle';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const DailyChallengesHub: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [hasPlayedWordle, setHasPlayedWordle] = useState(false);
  const [hasAttemptedRiddle, setHasAttemptedRiddle] = useState(false);
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

      // Check if user played today (simulate using localStorage for immediate client feedback)
      // In production this would check a 'user_daily_activity' table via RPC.
      const today = new Date().toISOString().split('T')[0];
      const wordlePlayed = localStorage.getItem(`wordle_${today}`);
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
      const { data } = await supabase.from('profiles').select('gems_balance').eq('id', session.session.user.id).single();
      const currentBalance = data?.gems_balance || 0;
      await supabase.from('profiles').update({ gems_balance: currentBalance + amount }).eq('id', session.session.user.id);
    }
  };

  const handleWordleComplete = async (score: number) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`wordle_${today}`, 'true');
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

  if (!config) {
    return <div className="p-8 text-center text-slate-500">No challenges configured for today.</div>;
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 px-2">Trivia Wordle</h2>
        {hasPlayedWordle ? (
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            You've already played Wordle today. Come back tomorrow!
          </div>
        ) : (
          <TriviaWordle 
            clue={config.wordle_clue}
            targetWord={config.wordle_answer}
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
