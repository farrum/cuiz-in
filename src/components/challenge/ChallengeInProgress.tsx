
import React, { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [errorState, setErrorState] = useState<{ hasError: boolean, message: string }>({
    hasError: false,
    message: ""
  });

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    onExit();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  const handleComplete = (isCorrect: boolean, selectedOption: string) => {
    try {
      if (!selectedOption) {
        setErrorState({
          hasError: true,
          message: "Please select an answer to continue"
        });
        return;
      }
      
      setErrorState({ hasError: false, message: "" });
      onComplete(selectedOption);
    } catch (error) {
      console.error("Error completing question:", error);
      setErrorState({
        hasError: true,
        message: "Something went wrong. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={handleExitClick}
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
        
        {errorState.hasError && (
          <Alert variant="warning" className="mb-4">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {errorState.message}
            </AlertDescription>
          </Alert>
        )}
        
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
              onComplete={(isCorrect, selectedOption) => handleComplete(isCorrect, selectedOption)}
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

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Challenge?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be saved, but you won't earn points for this question. 
              Are you sure you want to exit the challenge?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelExit}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>Exit Challenge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChallengeInProgress;
