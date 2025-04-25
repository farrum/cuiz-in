import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { Challenge, ChallengeProgress } from '@/components/challenges/types';

export const useDailyChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<{[key: string]: ChallengeProgress}>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  const fetchActiveChallenges = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching active challenges...');

      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (challengesError) throw challengesError;

      console.log('Challenges data from server:', challengesData);
      
      const now = new Date();
      let filteredChallenges: Challenge[] = [];
      
      if (challengesData && challengesData.length > 0) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', userId)
          .in('challenge_id', challengesData.map(c => c.id));

        if (progressError) throw progressError;
        
        console.log('User progress data:', progressData);
        
        const progressLookup: {[key: string]: ChallengeProgress} = {};
        if (progressData) {
          progressData.forEach(p => {
            progressLookup[p.challenge_id] = p;
          });
        }
        
        setProgress(progressLookup);
        
        // Filter challenges:
        // 1. Keep active challenges that are within their date range
        // 2. Remove challenges that have been completed by the user
        filteredChallenges = challengesData.filter(challenge => {
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          const isActive = startDate <= now && endDate >= now;
          const userCompleted = progressLookup[challenge.id]?.completed;
          
          console.log(`Challenge ${challenge.title}: isActive=${isActive}, startDate=${startDate}, endDate=${endDate}, now=${now}, userCompleted=${userCompleted}`);
          
          // Only keep challenges that:
          // 1. Are currently active (between start and end date), AND
          // 2. User hasn't completed them yet
          return isActive && !userCompleted;
        });
        
        console.log('Filtered challenges to show:', filteredChallenges);
        setChallenges(filteredChallenges);
      } else {
        console.log('No active challenges found in database');
        setChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChallenge = async (challenge: Challenge) => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please login to start a challenge",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    try {
      if (progress[challenge.id]) {
        if (progress[challenge.id].completed) {
          navigate(`/challenge/${challenge.id}`);
          return;
        }
        
        navigate(`/challenge/${challenge.id}`);
        return;
      }

      const { data, error } = await supabase
        .from('user_challenge_progress')
        .insert([
          {
            challenge_id: challenge.id,
            user_id: userId,
            started_at: new Date().toISOString(),
            completed: false,
            score: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setProgress({
        ...progress,
        [challenge.id]: data
      });

      navigate(`/challenge/${challenge.id}`);
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({
        title: "Error",
        description: "Failed to start challenge. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  return {
    challenges,
    progress,
    isLoading,
    handleStartChallenge,
    fetchActiveChallenges
  };
};

// Helper function to check if a date is in the past
function isPast(date: Date): boolean {
  return date < new Date();
}
