
import React from 'react';
import QuizCard from '@/components/QuizCard';
import LoadingCard from '@/components/LoadingCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { QuizQuestion } from '@/utils/quizData';

interface QuizContentProps {
  isLoading: boolean;
  currentQuestion: QuizQuestion | null;
  showMotivation: boolean;
  motivationMessage: string;
  onQuestionComplete: (isCorrect: boolean) => void;
}

const QuizContent: React.FC<QuizContentProps> = ({
  isLoading,
  currentQuestion,
  showMotivation,
  motivationMessage,
  onQuestionComplete
}) => {
  if (isLoading) {
    return (
      <div className="quiz-card animate-pulse flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading next question...</p>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="quiz-card text-center">
        <p>No questions available. Please try again later.</p>
      </div>
    );
  }
  
  return (
    <>
      {showMotivation && (
        <div className="flex justify-center my-4">
          <MotivationalCharacter 
            mood="happy" 
            message={motivationMessage}
            showMessage={true}
          />
        </div>
      )}
      
      <div className="relative">
        <div className="absolute -top-16 -right-10 z-10 transform scale-75">
          <MotivationalCharacter 
            mood="neutral"
            showMessage={false}
          />
        </div>
        <QuizCard
          question={currentQuestion}
          onComplete={onQuestionComplete}
        />
      </div>
    </>
  );
};

export default QuizContent;
