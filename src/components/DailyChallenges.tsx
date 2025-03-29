
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Trophy, Clock, ChevronRight, Award } from 'lucide-react';
import { formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  num_questions: number;
  points_multiplier: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  question_ids: string[];
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  completed: boolean;
  score: number;
}

const DailyChallenges: React.FC = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<{[key: string]: ChallengeProgress}>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get active challenges
      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      if (challengesError) throw challengesError;

      if (challengesData && challengesData.length > 0) {
        setChallenges(challengesData);

        // Get user progress for these challenges
        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', userId)
          .in('challenge_id', challengesData.map(c => c.id));

        if (progressError) throw progressError;

        // Build progress lookup object
        const progressLookup: {[key: string]: ChallengeProgress} = {};
        if (progressData) {
          progressData.forEach(p => {
            progressLookup[p.challenge_id] = p;
          });
        }
        
        setProgress(progressLookup);
      } else {
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
      // Check if already started
      if (progress[challenge.id]) {
        // If already completed, just show message
        if (progress[challenge.id].completed) {
          toast({
            title: "Already Completed",
            description: "You've already completed this challenge",
          });
          return;
        }
        
        // If started but not completed, navigate to challenge
        navigate(`/challenge/${challenge.id}`);
        return;
      }

      // Create new progress entry
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

      // Update local state
      setProgress({
        ...progress,
        [challenge.id]: data
      });

      // Navigate to challenge page
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

  if (isLoading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Daily Challenges</h2>
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No active challenges at the moment.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for new challenges!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Daily Challenges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {challenges.map((challenge) => {
          const hasStarted = isPast(new Date(challenge.start_date));
          const hasEnded = isPast(new Date(challenge.end_date));
          const isUpcoming = isFuture(new Date(challenge.start_date));
          const userProgress = progress[challenge.id];
          const isCompleted = userProgress?.completed;
          
          return (
            <Card key={challenge.id} className={isCompleted ? "border-primary/40" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  {isCompleted && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Trophy className="h-3 w-3 mr-1" /> Completed
                    </Badge>
                  )}
                  {isUpcoming && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                      <Clock className="h-3 w-3 mr-1" /> Upcoming
                    </Badge>
                  )}
                  {hasEnded && !isCompleted && (
                    <Badge variant="outline" className="bg-muted/30 text-muted-foreground">
                      Ended
                    </Badge>
                  )}
                </div>
                {challenge.description && (
                  <CardDescription>{challenge.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col space-y-1 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Award className="h-4 w-4 mr-1" />
                    <span className="font-medium text-foreground">{challenge.points_multiplier}x</span> points multiplier
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {isUpcoming 
                      ? `Starts ${formatDistanceToNow(new Date(challenge.start_date), { addSuffix: true })}`
                      : hasEnded 
                        ? `Ended ${formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}`
                        : `Ends ${formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}`
                    }
                  </div>
                  {isCompleted && (
                    <div className="flex items-center text-primary">
                      <Trophy className="h-4 w-4 mr-1" />
                      Score: {userProgress?.score || 0} points
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={isCompleted ? "outline" : "default"}
                  className={`w-full ${isCompleted ? "border-primary/30 text-primary" : ""}`}
                  disabled={isUpcoming || hasEnded}
                  onClick={() => handleStartChallenge(challenge)}
                >
                  {isCompleted 
                    ? "View Results" 
                    : userProgress
                      ? "Continue Challenge"
                      : "Start Challenge"
                  }
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  );
};

export default DailyChallenges;
