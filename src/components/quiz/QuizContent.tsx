
import React from 'react';
import QuizCard from '@/components/QuizCard';
import LoadingCard from '@/components/LoadingCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { QuizQuestion } from '@/utils/quizData';
import ImageQuizContent from './ImageQuizContent';
import TimeAttackTimer from './TimeAttackTimer';
import TeamQuizContent from './team-quiz/TeamQuizContent';
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

  // Get team size from local storage or default to the current game mode's config
  const getTeamSize = () => {
    // Check if we're playing a team challenge with a specific size
    const storedTeamChallenges = localStorage.getItem('team_challenges');
    if (storedTeamChallenges) {
      try {
        const challenges = JSON.parse(storedTeamChallenges);
        const activeChallenge = challenges.find((c: any) => c.isActive === true);
        if (activeChallenge && activeChallenge.teamSize) {
          return activeChallenge.teamSize;
        }
      } catch (e) {
        console.error("Error parsing team challenges:", e);
      }
    }
    
    // Get team size from game mode config
    const gameSettings = localStorage.getItem('quiz_game_mode_settings');
    if (gameSettings) {
      try {
        const settings = JSON.parse(gameSettings);
        if (settings && settings.teamSize) {
          return settings.teamSize;
        }
      } catch (e) {
        console.error("Error parsing game mode settings:", e);
      }
    }
    
    return 4; // Default fallback
  };

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
        {currentMode !== 'team-quiz' && (
          <div className="absolute -top-16 -right-10 z-10 transform scale-75">
            <MotivationalCharacter 
              mood="neutral"
              showMessage={false}
            />
          </div>
        )}
        
        {renderStreak()}
        
        {currentMode === 'team-quiz' ? (
          <TeamQuizContent
            question={currentQuestion}
            isLoading={isLoading}
            onQuestionComplete={onQuestionComplete}
            teamSize={getTeamSize()}
          />
        ) : currentQuestion.questionType === 'image' ? (
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
