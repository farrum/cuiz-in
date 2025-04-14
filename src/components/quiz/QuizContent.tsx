
import React from 'react';
import QuizCard from '@/components/QuizCard';
import LoadingCard from '@/components/LoadingCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { QuizQuestion } from '@/utils/quizData';
import ImageQuizContent from './ImageQuizContent';
import TimeAttackTimer from './TimeAttackTimer';
import { GameMode } from '@/utils/types';

interface QuizContentProps {
  isLoading: boolean;
  currentQuestion: QuizQuestion | null;
  showMotivation: boolean;
  motivationMessage: string;
  onQuestionComplete: (isCorrect: boolean, selectedAnswer: string) => void;
  isChallenge?: boolean;
  currentMode: GameMode;
  timeRemaining: number | null;
  isGameActive: boolean;
  handleTimeUp: () => void;
  streak: number;
}

const QuizContent: React.FC<QuizContentProps> = ({
  isLoading,
  currentQuestion,
  showMotivation,
  motivationMessage,
  onQuestionComplete,
  isChallenge = false,
  currentMode,
  timeRemaining,
  isGameActive,
  handleTimeUp,
  streak
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

  // Show streak indicator for streak mode
  const renderStreak = () => {
    if (currentMode === 'streak' && streak > 0) {
      return (
        <div className="absolute top-2 right-2">
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center space-x-2">
            <span className="text-lg font-bold">{streak}</span>
            <span className="text-sm">🔥</span>
          </div>
        </div>
      );
    }
    return null;
  };

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
      
      {currentMode === 'time-attack' && timeRemaining !== null && (
        <TimeAttackTimer 
          initialTime={timeRemaining} 
          isActive={isGameActive} 
          onTimeUp={handleTimeUp} 
        />
      )}
      
      <div className="relative">
        <div className="absolute -top-16 -right-10 z-10 transform scale-75">
          <MotivationalCharacter 
            mood="neutral"
            showMessage={false}
          />
        </div>
        
        {renderStreak()}
        
        {currentQuestion.questionType === 'image' ? (
          <ImageQuizContent
            question={currentQuestion}
            onComplete={onQuestionComplete}
            isChallenge={isChallenge}
          />
        ) : (
          <QuizCard
            question={currentQuestion}
            onComplete={onQuestionComplete}
            isChallenge={isChallenge}
          />
        )}
      </div>
    </>
  );
};

export default QuizContent;
