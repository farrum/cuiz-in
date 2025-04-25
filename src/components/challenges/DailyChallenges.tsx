
import React, { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import ChallengeCard from './ChallengeCard';
import NoChallengesDisplay from './NoChallengesDisplay';
import ChallengesHeader from './ChallengesHeader';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const DailyChallenges: React.FC = () => {
  const { challenges, progress, isLoading, handleStartChallenge, fetchActiveChallenges } = useDailyChallenges();

  useEffect(() => {
    // Log the challenges whenever they change
    console.log('Current challenges in component:', challenges);
  }, [challenges]);

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

  const handleRefresh = () => {
    fetchActiveChallenges();
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <ChallengesHeader title="Daily Challenges" />
        <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
      
      {!challenges.length ? (
        <NoChallengesDisplay />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              userProgress={progress[challenge.id]}
              onStartChallenge={handleStartChallenge}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyChallenges;
