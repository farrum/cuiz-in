import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, ChevronRight, Trophy, ArrowLeft, Clock, Ban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

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

const ArchivedChallenges: React.FC = () => {
  const [archivedChallenges, setArchivedChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<{[key: string]: ChallengeProgress}>({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);

  useEffect(() => {
    fetchArchivedChallenges();
  }, []);

  const fetchArchivedChallenges = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data: challengesData, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .lt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false });

      if (challengesError) throw challengesError;

      if (challengesData && challengesData.length > 0) {
        setArchivedChallenges(challengesData);

        const { data: progressData, error: progressError } = await supabase
          .from('user_challenge_progress')
          .select('*')
          .eq('user_id', userId)
          .in('challenge_id', challengesData.map(c => c.id));

        if (progressError) throw progressError;

        const progressLookup: {[key: string]: ChallengeProgress} = {};
        if (progressData) {
          progressData.forEach(p => {
            progressLookup[p.challenge_id] = p;
          });
        }
        
        setProgress(progressLookup);
      } else {
        setArchivedChallenges([]);
      }
    } catch (error) {
      console.error('Error fetching archived challenges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch archived challenges",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewChallenge = (challengeId: string, isCompleted: boolean) => {
    if (isCompleted) {
      navigate(`/challenge/${challengeId}`);
    } else {
      toast({
        title: "Challenge Expired",
        description: "This challenge has ended and cannot be played anymore.",
        variant: "warning"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => navigate('/quiz')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={() => navigate('/quiz')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Archived Challenges</h2>
      </div>

      {archivedChallenges.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No archived challenges found.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later when challenges have been completed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {archivedChallenges.map((challenge) => {
            const userProgress = progress[challenge.id];
            const isCompleted = userProgress?.completed || false;
            
            return (
              <Card key={challenge.id} className={isCompleted ? "border-primary/40" : "border-muted/40"}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    {isCompleted ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        <Trophy className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                        <Ban className="h-3 w-3 mr-1" /> Expired
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
                      <Calendar className="h-4 w-4 mr-1" />
                      Ended {formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })}
                    </div>
                    {isCompleted && (
                      <div className="flex items-center text-primary">
                        <Trophy className="h-4 w-4 mr-1" />
                        Score: {userProgress.score || 0} points
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={isCompleted ? "outline" : "secondary"} 
                    className={`w-full ${isCompleted ? "border-primary/30 text-primary" : "text-muted-foreground"}`}
                    onClick={() => handleViewChallenge(challenge.id, isCompleted)}
                  >
                    {isCompleted 
                      ? "View Results" 
                      : "View Details"
                    }
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArchivedChallenges;
