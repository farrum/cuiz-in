
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
import SocialChallenges from '@/components/quiz/SocialChallenges';
import { clearAdCache } from '@/services/adCacheService';
import AdDebugger from '@/components/ads/AdDebugger';
import { Button } from '@/components/ui/button';
import { useQuizTypes } from '@/hooks/quiz/useQuizTypes';
import { Clock, Users, Wand } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  
  const { currentMode, setCurrentMode, startTimeAttack } = useQuizTypes();
  const [activeTab, setActiveTab] = useState('quiz');
  
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
  
  const handleModeSelect = (mode: string) => {
    if (mode === 'time-attack') {
      startTimeAttack(60);
    } else {
      setCurrentMode(mode as any);
    }
  };
  
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
            
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={currentMode === 'standard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeSelect('standard')}
              >
                <Wand className="h-4 w-4 mr-1" /> Standard
              </Button>
              <Button
                variant={currentMode === 'time-attack' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeSelect('time-attack')}
              >
                <Clock className="h-4 w-4 mr-1" /> Time Attack
              </Button>
              <Button
                variant={currentMode === 'multiplayer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('social')}
              >
                <Users className="h-4 w-4 mr-1" /> Social
              </Button>
            </div>
          
            <AdvertisementBanner key={`middle-small-ad-${forceReloadAds}`} position="middle" size="small" slotId="quiz-middle-small" pageSection="quiz-page" />
          
            <AdvertisementBanner key={`middle-ad-${forceReloadAds}`} position="middle" slotId="quiz-middle" pageSection="quiz-page" />
            
            <Tabs defaultValue="quiz" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
              </TabsList>
              
              <TabsContent value="quiz" className="space-y-4">
                <QuizContent 
                  isLoading={isLoading}
                  currentQuestion={currentQuestion}
                  showMotivation={showMotivation}
                  motivationMessage={motivationMessage}
                  onQuestionComplete={handleQuestionComplete}
                />
                
                <DailyChallenges />
              </TabsContent>
              
              <TabsContent value="social" className="space-y-4">
                <SocialChallenges />
              </TabsContent>
            </Tabs>
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
