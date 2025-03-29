import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { Trophy, Calendar, Award, Clock, ArrowRight } from 'lucide-react';
import { STORAGE_KEYS } from '@/utils/quizData';
import { DailyChallenge } from '@/types/challenges';
import { challengesService, challengeProgressService } from '@/services/challengesService';

const DailyChallenges = () => {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchActiveChallenges();
  }, []);
  
  const fetchActiveChallenges = async () => {
    try {
      setIsLoading(true);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Fetch active challenges using our service
      const challengesData = await challengesService.getActiveChallenges();
      
      // Fetch user progress for these challenges
      if (challengesData && challengesData.length > 0) {
        const challengeIds = challengesData.map(c => c.id);
        const progressMap = await challengeProgressService.getUserChallengeProgress(userId, challengeIds);
        setProgress(progressMap);
      }
      
      setChallenges(challengesData || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast({
        title: 'Error',
        description: 'Failed to load challenges',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const startChallenge = async (challenge: DailyChallenge) => {
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Check if this challenge is already started
      if (progress[challenge.id]) {
        // If it's already completed, show a message
        if (progress[challenge.id].completed) {
          toast({
            title: 'Challenge completed',
            description: 'You have already completed this challenge'
          });
          return;
        }
        
        // Otherwise, continue the challenge
        toast({
          title: 'Continue challenge',
          description: 'Continuing your progress on this challenge'
        });
        return;
      }
      
      // Start the challenge
      const { success, error } = await challengeProgressService.startChallenge(userId, challenge.id);
      
      if (!success) throw error;
      
      // Refresh the challenges
      fetchActiveChallenges();
      
      toast({
        title: 'Challenge started',
        description: 'Good luck with the challenge!'
      });
      
    } catch (error) {
      console.error('Error starting challenge:', error);
      toast({
        title: 'Error',
        description: 'Failed to start challenge',
        variant: 'destructive'
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Challenges</CardTitle>
          <CardDescription>Loading challenges...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
              <div className="h-4 w-48 bg-muted rounded mb-2"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (challenges.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Challenges</CardTitle>
          <CardDescription>Complete challenges to earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex flex-col items-center justify-center text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No active challenges</h3>
            <p className="text-muted-foreground">
              Check back later for new challenges
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Challenges</CardTitle>
        <CardDescription>Complete challenges to earn bonus points</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const challengeProgress = progress[challenge.id];
          const isStarted = !!challengeProgress;
          const isCompleted = isStarted && challengeProgress.completed;
          const progressPercent = isStarted 
            ? (challengeProgress.score / challenge.num_questions) * 100 
            : 0;
          
          return (
            <Card key={challenge.id} className="overflow-hidden">
              <div className={`p-1 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}></div>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <Badge variant={isCompleted ? "outline" : "secondary"}>
                    {isCompleted ? "Completed" : isStarted ? "In Progress" : "New"}
                  </Badge>
                </div>
                <CardDescription>
                  {challenge.description || "Complete this challenge to earn bonus points!"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{challenge.points_multiplier}x points multiplier</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>{challenge.num_questions} questions</span>
                  </div>
                </div>
                
                {isStarted && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress</span>
                      <span>
                        {challengeProgress.score} / {challenge.num_questions} questions
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="ml-auto" 
                  variant={isCompleted ? "outline" : "default"}
                  onClick={() => startChallenge(challenge)}
                  disabled={isCompleted}
                >
                  {isCompleted 
                    ? "Completed" 
                    : isStarted 
                      ? "Continue Challenge" 
                      : "Start Challenge"}
                  {!isCompleted && <ArrowRight className="h-4 w-4 ml-1" />}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;
