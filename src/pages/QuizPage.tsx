
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { DailyChallenges } from '@/components/challenges';
import { useMonthlyReset } from '@/hooks/challenge/useMonthlyReset';
import { useQuizState } from '@/hooks/quiz';
import PointsAndProgress from '@/components/quiz/PointsAndProgress';
import QuizContent from '@/components/quiz/QuizContent';
import GameModeSelector from '@/components/quiz/GameModeSelector';
import { clearAdCache } from '@/services/adCacheService';
import AdDebugger from '@/components/ads/AdDebugger';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const QuizPage: React.FC = () => {
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);
  
  const {
    currentQuestion,
    streak,
    questionsAnswered,
    dailyPoints,
    monthlyPoints,
    isLoading,
    showMotivation,
    motivationMessage,
    nextBadgeThreshold,
    isSuspended,
    forceReloadAds,
    currentMode,
    config,
    timeRemaining,
    isGameActive,
    checkSuspensionStatus,
    loadInitialData,
    handleAdSlotsUpdated,
    handleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  } = useQuizState();
  
  useMonthlyReset();
  
  useEffect(() => {
    checkSuspensionStatus().then(success => {
      if (success) {
        loadInitialData();
      }
    });
    
    // Clear ad cache when component mounts to force fresh ads
    clearAdCache();
    
    // Force reload ads after 500ms to ensure ads load properly
    const initialLoadTimer = setTimeout(() => {
      setForceReloadAds(prev => prev + 1);
    }, 500);
    
    return () => {
      clearTimeout(initialLoadTimer);
    };
  }, []);
  
  useEffect(() => {
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    };
  }, []);
  
  useEffect(() => {
    showMotivationalMessage();
  }, [questionsAnswered]);
  
  if (isSuspended) {
    return null;
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <AdvertisementBanner key={`top-ad-${forceReloadAds}`} position="top" slotId="quiz-top" pageSection="quiz-page" />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {config.name}
            {currentMode === 'streak' && streak > 0 && (
              <span className="ml-2 text-primary">🔥 {streak}</span>
            )}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGameModeSelector(prev => !prev)}
          >
            Change Mode
          </Button>
        </div>
        
        {showGameModeSelector && (
          <div className="mb-6">
            <GameModeSelector />
          </div>
        )}
        
        {!isGameActive && currentMode === 'time-attack' && (
          <div className="bg-muted p-6 rounded-lg mb-6 text-center">
            <h2 className="text-xl font-bold mb-2">Time's Up!</h2>
            <p className="mb-4">You answered {questionsAnswered} questions in {config.timeLimit} seconds!</p>
            <Button onClick={resetGame} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Play Again
            </Button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <PointsAndProgress 
              questionsAnswered={questionsAnswered}
              streak={streak}
              dailyPoints={dailyPoints}
              monthlyPoints={monthlyPoints}
              nextBadgeThreshold={nextBadgeThreshold}
            />
          
            <AdvertisementBanner key={`middle-small-ad-${forceReloadAds}`} position="middle" size="small" slotId="quiz-middle-small" pageSection="quiz-page" />
          
            <AdvertisementBanner key={`middle-ad-${forceReloadAds}`} position="middle" slotId="quiz-middle" pageSection="quiz-page" />
          
            {isGameActive && (
              <QuizContent 
                isLoading={isLoading}
                currentQuestion={currentQuestion}
                showMotivation={showMotivation}
                motivationMessage={motivationMessage}
                onQuestionComplete={handleQuestionComplete}
                currentMode={currentMode}
                timeRemaining={timeRemaining}
                isGameActive={isGameActive}
                handleTimeUp={handleTimeUp}
                streak={streak}
              />
            )}
          
            <DailyChallenges />
          </div>
          
          {/* Sidebar Ads */}
          <div className="w-full md:w-64">
            <AdvertisementBanner 
              key={`sidebar-ad-${forceReloadAds}`} 
              position="sidebar" 
              slotId="quiz-sidebar" 
              pageSection="quiz-page" 
              className="sticky top-20"
            />
          </div>
        </div>
        
        <AdvertisementBanner key={`bottom-ad-${forceReloadAds}`} position="bottom" slotId="quiz-bottom" pageSection="quiz-page" />
        
        {isDevelopment && (
          <AdDebugger 
            position="bottom" 
            slotId="quiz-bottom" 
            pageSection="quiz-page" 
            className="mt-4 max-w-3xl w-full mx-auto"
          />
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
