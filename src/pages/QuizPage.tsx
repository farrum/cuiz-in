import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { AppDownloadCard } from '@/components/app-promo/GooglePlay';
import SidebarVideoAd from '@/components/ads/SidebarVideoAd';
import AdminAdDebugPanel from '@/components/ads/AdminAdDebugPanel';
import { DailyChallenges } from '@/components/challenges';
import { useMonthlyReset } from '@/hooks/challenge/useMonthlyReset';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { triggerWebInterstitial } from '@/utils/webInterstitialAd';
import { triggerAdRefresh } from '@/utils/adService';

import QuizInterstitial from '@/components/quiz/QuizInterstitial';

import { useQuizState } from '@/hooks/quiz';
import CompactStatsBar from '@/components/quiz/CompactStatsBar';
import QuizContent from '@/components/quiz/QuizContent';
import GameModeSelector from '@/components/quiz/GameModeSelector';
import GuestGemsBanner from '@/components/quiz/GuestGemsBanner';
import MilestoneCelebration from '@/components/quiz/MilestoneCelebration';
import SEOKeywords from '@/components/SEOKeywords';
import TopPlayersSection from '@/components/TopPlayersSection';
import LeaderboardSection from '@/components/LeaderboardSection';
import MonthlyWinnersSection from '@/components/MonthlyWinnersSection';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const QuizPage: React.FC = () => {
  const [showGameModeSelector, setShowGameModeSelector] = useState(false);
  const [milestoneCheckTrigger, setMilestoneCheckTrigger] = useState(0);
  const [showLeaderboards, setShowLeaderboards] = useState(false);
  // Web ad break shown before every 3rd question.
  const [adBreakOpen, setAdBreakOpen] = useState(false);
  // VAST video interstitial between questions (fills on mobile-web; on desktop
  // the network returns no video inventory and it auto-skips harmlessly).
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const answeredSinceAdRef = useRef(0);
  const nextAdThresholdRef = useRef(2 + Math.floor(Math.random() * 2)); // 2-3
  const {
    currentQuestion,
    streak,
    questionsAnswered,
    dailyGems,
    monthlyGems,
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
    handleQuestionComplete: originalHandleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  } = useQuizState();

  const handleQuestionComplete = (isCorrect: boolean) => {
    originalHandleQuestionComplete(isCorrect);
    setTimeout(() => {
      setMilestoneCheckTrigger(prev => prev + 1);
    }, 500);

    // Every 2 answered questions, surface an ad break before the next question.
    answeredSinceAdRef.current += 1;
    if (answeredSinceAdRef.current >= 2) {
      answeredSinceAdRef.current = 0;
      nextAdThresholdRef.current = 2;
      // Network interstitial script (web only, throttled internally)
      triggerWebInterstitial();
      // Small delay so the answer feedback shows before the ad overlay.
      setTimeout(() => {
        setAdBreakOpen(true);
        showVideoAd(() => {});
      }, 800);
    }

  };
  
  // Rotate every banner on this page whenever a new question is shown.
  useEffect(() => {
    if (currentQuestion?.id) {
      triggerAdRefresh();
    }
  }, [currentQuestion?.id]);

  useMonthlyReset();
  

  
  useEffect(() => {
    const initializeQuiz = async () => {
      const userId = localStorage.getItem('cuizin_user_id');
      if (userId) {
        const { setUserContext } = await import('@/utils/authContext');
        await setUserContext(userId);
      }
      
      const success = await checkSuspensionStatus();
      if (success) {
        loadInitialData();
      }
    };
    
    initializeQuiz();
  }, []);
  
  if (isSuspended) {
    return null;
  }
  
  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': 'CuizIN Quiz Game',
    'description': 'Test your knowledge and earn rewards with our interactive quiz game.',
    'about': 'Quiz game with monetary rewards',
    'educationalUse': 'assessment',
    'learningResourceType': 'Quiz',
    'typicalAgeRange': '13+',
    'educationalAlignment': {
      '@type': 'AlignmentObject',
      'alignmentType': 'educationalSubject',
      'targetName': 'General Knowledge',
      'educationalFramework': 'General Education'
    },
    'assesses': 'General Knowledge, Trivia, Current Affairs',
    'datePublished': '2024-01-01',
    'dateModified': new Date().toISOString().split('T')[0],
    'inLanguage': 'en-IN',
    'encodingFormat': 'text/html',
    'author': {
      '@type': 'Organization',
      'name': 'CuizIN'
    },
    'provider': {
      '@type': 'Organization',
      'name': 'CuizIN',
      'url': 'https://cuiz.in'
    },
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'INR',
      'availability': 'https://schema.org/InStock'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '2456',
      'bestRating': '5',
      'worstRating': '1'
    }
  };

  const quizKeywords = [
    'quiz', 'online quiz', 'knowledge quiz', 'trivia', 'free quiz',
    'educational quiz', 'quiz game', 'earn rewards', 'quiz challenges',
    'daily quiz', 'fun quiz', 'interactive quiz', 'cuizin quiz'
  ];

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.quiz()
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Play Quiz and Earn Rewards | CuizIN"
        description="Play our free quiz game, answer questions correctly to earn gems and rewards. Challenge yourself with our daily quiz challenges!"
        ogType="website"
        schemaType="Quiz"
        schemaData={quizSchema}
        keywords={quizKeywords}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <SEOKeywords customKeywords={quizKeywords} />
      <Header />
      <NewsTicker className="mt-16" />
      
      <MilestoneCelebration triggerCheck={milestoneCheckTrigger} />
      
      <main className="flex-1 container max-w-4xl pt-4 pb-6 px-3 md:px-4">
        {/* Breadcrumb - compact */}
        <Breadcrumb className="mb-3 text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Quiz</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Admin-only Ad Debug Panel */}
        <AdminAdDebugPanel className="mb-3" />

        {/* Top Ad - compact */}
        <SimpleAdBanner position="top" slotId="quiz-top" className="mb-3" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9 space-y-4">
            {/* Header with mode selector */}
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                {config.name}
                {currentMode === 'streak' && streak > 0 && (
                  <span className="text-primary text-base">🔥 {streak}</span>
                )}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGameModeSelector(prev => !prev)}
                className="text-xs gap-1"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Mode
              </Button>
            </div>
            
            {/* Game mode selector - collapsible */}
            {showGameModeSelector && (
              <div className="mb-3 animate-fade-in">
                <GameModeSelector />
              </div>
            )}
            
            {/* Time attack game over state */}
            {!isGameActive && currentMode === 'time-attack' && (
              <div className="bg-card border rounded-2xl p-4 mb-3 text-center">
                <h2 className="text-lg font-bold mb-2">⏱️ Time's Up!</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  You answered {questionsAnswered} questions in {config.timeLimit} seconds!
                </p>
                <Button onClick={resetGame} size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Play Again
                </Button>
              </div>
            )}
            
            {/* Compact stats bar */}
            <CompactStatsBar
              questionsAnswered={questionsAnswered}
              streak={streak}
              dailyGems={dailyGems}
              className="mb-4"
            />
            
            {/* Main Quiz Area */}
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
                questionsAnswered={questionsAnswered}
                dailyGems={dailyGems}
              />
            )}
            
            {/* Guest banner */}
            <GuestGemsBanner className="mt-4" />

            {/* Google Play app promo */}
            <AppDownloadCard className="mt-4" />
            
            {/* Daily Challenges - compact */}
            <div className="mt-4">
              <DailyChallenges />
            </div>
            
            {/* Middle Ad */}
            <SimpleAdBanner position="middle" slotId="quiz-middle" className="my-4" />
            
            {/* Leaderboards - collapsible on mobile */}
            <div className="mt-4">
              <button
                onClick={() => setShowLeaderboards(!showLeaderboards)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-card border hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold flex items-center gap-2">
                  🏆 Leaderboards
                </span>
                {showLeaderboards ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {showLeaderboards && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <MonthlyWinnersSection limit={5} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TopPlayersSection limit={5} />
                    <LeaderboardSection />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-3">
            <div className="sticky top-20 space-y-4">
              <AppDownloadCard compact />
              <SimpleAdBanner position="sidebar" slotId="quiz-sidebar" />
              <SidebarVideoAd alwaysVideo />
            </div>
          </div>
        </div>
        
        {/* Bottom Ad */}
        <SimpleAdBanner position="bottom" slotId="quiz-bottom" className="mt-4" />
      </main>
      
      <Footer />
      {adElement}

      {adBreakOpen && (
        <div className="fixed inset-0 z-[120] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg">
            <QuizInterstitial onContinue={() => setAdBreakOpen(false)} countdownSeconds={8} />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
