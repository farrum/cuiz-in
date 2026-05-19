
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Clock, ChevronRight, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Challenge, ChallengeProgress } from './types';

interface ChallengeCardProps {
  challenge: Challenge;
  userProgress?: ChallengeProgress;
  onStartChallenge: (challenge: Challenge) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  userProgress, 
  onStartChallenge 
}) => {
  // Check if the challenge is active (between start and end date)
  const now = new Date();
  const startDate = new Date(challenge.start_date);
  const endDate = new Date(challenge.end_date);
  
  const isActive = startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;
  const hasEnded = endDate < now;
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
          {isActive && !isCompleted && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Clock className="h-3 w-3 mr-1" /> Active
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
            <span className="font-medium text-foreground">{challenge.gems_multiplier}x</span> gems multiplier
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            {isUpcoming 
              ? `Starts ${formatDistanceToNow(startDate, { addSuffix: true })}`
              : hasEnded 
                ? `Ended ${formatDistanceToNow(endDate, { addSuffix: true })}`
                : `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}`
            }
          </div>
          {isCompleted && userProgress && (
            <div className="flex items-center text-primary">
              <Trophy className="h-4 w-4 mr-1" />
              Score: {userProgress.score || 0} gems
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant={isCompleted ? "outline" : "default"}
          className={`w-full ${isCompleted ? "border-primary/30 text-primary" : ""}`}
          disabled={isUpcoming || (hasEnded && !isCompleted)}
          onClick={() => onStartChallenge(challenge)}
        >
          {isCompleted 
            ? "View Results" 
            : userProgress && !isCompleted
              ? "Continue Challenge"
              : "Start Challenge"
          }
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChallengeCard;
