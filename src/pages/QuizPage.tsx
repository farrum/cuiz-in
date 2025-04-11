
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { DailyChallenges } from '@/components/challenges';
import { useMonthlyReset } from '@/hooks/challenge/useMonthlyReset';
import { useQuizState } from '@/hooks/useQuizState';
import PointsAndProgress from '@/components/quiz/PointsAndProgress';
import QuizContent from '@/components/quiz/QuizContent';

const QuizPage: React.FC = () => {
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
    checkSuspensionStatus,
    loadInitialData,
    handleAdSlotsUpdated,
    handleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds
  } = useQuizState();
  
  useMonthlyReset();
  
  useEffect(() => {
    checkSuspensionStatus().then(success => {
      if (success) {
        loadInitialData();
      }
    });
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
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <AdvertisementBanner key={`top-ad-${forceReloadAds}`} position="top" slotId="quiz-top" pageSection="quiz-page" />
        
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
          
            <QuizContent 
              isLoading={isLoading}
              currentQuestion={currentQuestion}
              showMotivation={showMotivation}
              motivationMessage={motivationMessage}
              onQuestionComplete={handleQuestionComplete}
            />
          
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
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
