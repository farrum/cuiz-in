
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { Challenge } from '@/hooks/challenge/challengeTypes';
import { QuizQuestion } from '@/utils/quizData';
import QuizCard from '@/components/QuizCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ChallengeInProgressProps {
  challenge: Challenge;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  currentPoints: number;
  onExit: () => void;
  onComplete: (selectedAnswer: string) => void;
}

const ChallengeInProgress: React.FC<ChallengeInProgressProps> = ({
  challenge,
  questions,
  currentQuestionIndex,
  currentPoints,
  onExit,
  onComplete
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={onExit}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Exit Challenge
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{challenge?.title}</h1>
          {challenge?.description && (
            <p className="text-muted-foreground mt-1">{challenge.description}</p>
          )}
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-1">
            <span>Question {currentQuestionIndex + 1} of {challenge?.num_questions || 0}</span>
            <span>Points: {currentPoints}</span>
          </div>
          <Progress 
            value={((currentQuestionIndex) / (challenge?.num_questions || 1)) * 100} 
            className="h-2"
          />
        </div>
        
        <AdvertisementBanner position="middle" slotId="challenge-middle" pageSection="challenge-page" />
        
        {questions.length > currentQuestionIndex ? (
          <div className="relative mb-8">
            <div className="absolute -top-16 -right-10 z-10 transform scale-75">
              <MotivationalCharacter 
                mood="neutral"
                showMessage={false}
              />
            </div>
            <QuizCard
              question={questions[currentQuestionIndex]}
              onComplete={(selectedOption) => onComplete(selectedOption)}
              pointsMultiplier={challenge?.points_multiplier}
              isChallenge={true}
            />
          </div>
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available for this challenge.</p>
          </div>
        )}
        
        <AdvertisementBanner position="bottom" slotId="challenge-bottom" pageSection="challenge-page" />
      </main>
      <Footer />
    </div>
  );
};

export default ChallengeInProgress;
