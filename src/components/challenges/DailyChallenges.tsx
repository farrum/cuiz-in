
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import ChallengeCard from './ChallengeCard';
import NoChallengesDisplay from './NoChallengesDisplay';
import ChallengesHeader from './ChallengesHeader';

const DailyChallenges: React.FC = () => {
  const { challenges, progress, isLoading, handleStartChallenge } = useDailyChallenges();

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

  return (
    <div className="mt-8">
      <ChallengesHeader title="Daily Challenges" />
      
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
