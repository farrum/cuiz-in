
import React from 'react';
import Header from '@/components/Header';
import QuizCard from '@/components/QuizCard';
import PointsDisplay from '@/components/PointsDisplay';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import ProgressTracker from '@/components/quiz/ProgressTracker';
import TargetProgress from '@/components/quiz/TargetProgress';
import QuizProgress from '@/components/quiz/QuizProgress';
import QuizLoader from '@/components/quiz/QuizLoader';
import { useQuiz } from '@/hooks/useQuiz';

const QuizPage: React.FC = () => {
  const {
    currentQuestion,
    isLoading,
    questionsAnswered,
    streak,
    userPoints,
    dailyPoints,
    monthlyPoints,
    handleQuestionComplete
  } = useQuiz();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        {/* First Advertisement - Top */}
        <AdvertisementBanner position="top" />
        
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <PointsDisplay animateUpdate className="flex-1" />
          <ProgressTracker questionsAnswered={questionsAnswered} streak={streak} />
        </div>
        
        {/* Daily & Monthly Target Progress */}
        <TargetProgress 
          dailyPoints={dailyPoints}
          monthlyPoints={monthlyPoints}
        />
        
        {/* Second Advertisement - After Stats */}
        <AdvertisementBanner position="middle" size="small" />
        
        {/* Question Progress Bar */}
        <QuizProgress questionsAnswered={questionsAnswered} />
        
        {/* Third Advertisement - Before Question */}
        <AdvertisementBanner position="middle" />
        
        {isLoading ? (
          <QuizLoader />
        ) : currentQuestion ? (
          <QuizCard
            question={currentQuestion}
            onComplete={handleQuestionComplete}
          />
        ) : (
          <div className="quiz-card text-center">
            <p>No questions available. Please try again later.</p>
          </div>
        )}
        
        {/* Fourth Advertisement - Bottom */}
        <AdvertisementBanner position="bottom" />
      </main>
    </div>
  );
};

export default QuizPage;
