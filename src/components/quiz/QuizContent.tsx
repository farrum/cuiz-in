import React from 'react';
import EnhancedQuizCard from '@/components/quiz/EnhancedQuizCard';
import MotivationalCharacter from '@/components/MotivationalCharacter';
import { QuizQuestion } from '@/utils/quizData';
import ImageQuizContent from './ImageQuizContent';
import TimeAttackTimer from './TimeAttackTimer';
import TeamQuizContent from './team-quiz/TeamQuizContent';
import { GameMode } from '@/utils/types';
import { TrueFalseSwipe } from '@/components/gamification/TrueFalseSwipe';
import { FlashcardMatch } from '@/components/gamification/FlashcardMatch';
import { Loader2 } from 'lucide-react';

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
  questionsAnswered?: number;
  dailyGems?: number;
  upcomingQuestions?: QuizQuestion[];
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
  streak,
  questionsAnswered = 0,
  dailyGems = 0,
  upcomingQuestions = []
}) => {
  if (isLoading) {
    return (
      <div className="bg-card border rounded-2xl flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading next question...</p>
        </div>
      </div>
    );
  }
  
  if (!currentQuestion) {
    return (
      <div className="bg-card border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">No questions available. Please try again later.</p>
      </div>
    );
  }

  // Get team size from local storage
  const getTeamSize = () => {
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
    
    return 4;
  };

  // For team-quiz mode, use the old TeamQuizContent
  if (currentMode === 'team-quiz') {
    return (
      <TeamQuizContent
        question={currentQuestion}
        isLoading={isLoading}
        onQuestionComplete={onQuestionComplete}
        teamSize={getTeamSize()}
      />
    );
  }

  // True/False Mode
  if (currentMode === 'true-false') {
    const gameQuestions = [currentQuestion, ...upcomingQuestions].filter(q => q);
    return (
      <TrueFalseSwipe 
        questions={gameQuestions as QuizQuestion[]}
        onGameComplete={(score) => {
          // Just grant gems for the score and move on
          for(let i=0; i<score; i++) {
             onQuestionComplete(true, "TRUE");
          }
          if (score === 0) onQuestionComplete(false, "FALSE");
        }}
      />
    );
  }

  // Flashcards Mode
  if (currentMode === 'flashcards') {
    const gameQuestions = [currentQuestion, ...upcomingQuestions].filter(q => q);
    return (
      <FlashcardMatch 
        questions={gameQuestions as QuizQuestion[]}
        onGameComplete={(score) => {
          // Grant gems based on matches
          for(let i=0; i<score; i++) {
             onQuestionComplete(true, "MATCH");
          }
          if (score === 0) onQuestionComplete(false, "MISS");
        }}
      />
    );
  }

  // For image questions, use ImageQuizContent
  if (currentQuestion.questionType === 'image') {
    return (
      <ImageQuizContent
        question={currentQuestion}
        onComplete={onQuestionComplete}
        isChallenge={isChallenge}
      />
    );
  }

  // For time-attack mode, show timer separately
  if (currentMode === 'time-attack' && timeRemaining !== null) {
    return (
      <>
        <TimeAttackTimer 
          initialTime={timeRemaining} 
          isActive={isGameActive} 
          onTimeUp={handleTimeUp} 
        />
        <EnhancedQuizCard
          question={currentQuestion}
          onComplete={onQuestionComplete}
          streak={streak}
          questionsAnswered={questionsAnswered}
          totalGems={dailyGems}
          isChallenge={isChallenge}
        />
      </>
    );
  }

  // Default: use EnhancedQuizCard with built-in timer and feedback
  return (
    <>
      {showMotivation && motivationMessage && (
        <div className="flex justify-center mb-4">
          <MotivationalCharacter 
            mood="happy" 
            message={motivationMessage}
            showMessage={true}
          />
        </div>
      )}
      
      <EnhancedQuizCard
        question={currentQuestion}
        onComplete={onQuestionComplete}
        streak={streak}
        questionsAnswered={questionsAnswered}
        totalGems={dailyGems}
        isChallenge={isChallenge}
        showDifficultySelector={false}
      />
    </>
  );
};

export default QuizContent;
