import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { DailyChallenges } from '@/components/challenges';
import { useMonthlyReset } from '@/hooks/challenge/useMonthlyReset';
import { useQuizState } from '@/hooks/quiz';
import PointsAndProgress from '@/components/quiz/PointsAndProgress';
import QuizContent from '@/components/quiz/QuizContent';
import GameModeSelector from '@/components/quiz/GameModeSelector';
import SEOKeywords from '@/components/SEOKeywords';
import TopPlayersSection from '@/components/TopPlayersSection';
import LeaderboardSection from '@/components/LeaderboardSection';
import MonthlyWinnersSection from '@/components/MonthlyWinnersSection';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
    handleQuestionComplete,
    showMotivationalMessage,
    setForceReloadAds,
    changeGameMode,
    handleTimeUp,
    resetGame
  } = useQuizState();
  
  useMonthlyReset();
  
  useEffect(() => {
    const initializeQuiz = async () => {
      // First, set user context for legacy users
      const userId = localStorage.getItem('cuizin_user_id');
      if (userId) {
        const { setUserContext } = await import('@/utils/authContext');
        await setUserContext(userId);
      }
      
      // Then check suspension and load data
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
  
  // Schema.org quiz structured data with enhanced properties
  const quizSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    'name': 'CuizIN Quiz Game',
    'description': 'Test your knowledge and earn rewards with our interactive quiz game.',
    'about': 'Quiz game with monetary rewards',
    'educationalUse': 'assessment',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'ratingCount': '2456'
    }
  };

  // Quiz-specific keywords
  const quizKeywords = [
    'quiz', 'online quiz', 'knowledge quiz', 'trivia', 'free quiz',
    'educational quiz', 'quiz game', 'earn rewards', 'quiz challenges',
    'daily quiz', 'fun quiz', 'interactive quiz', 'cuizin quiz',
    'points quiz', 'streak quiz', 'knowledge test', 'question answers',
    'time attack quiz', 'quiz rewards', 'quiz competition'
  ];

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.quiz()
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Play Quiz and Earn Rewards | CuizIN"
        description="Play our free quiz game, answer questions correctly to earn points and rewards. Challenge yourself with our daily quiz challenges!"
        ogType="website"
        schemaType="Quiz"
        schemaData={quizSchema}
        keywords={quizKeywords}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <SEOKeywords customKeywords={quizKeywords} />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        {/* Visual Breadcrumb */}
        <Breadcrumb className="mb-4">
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
        
        <SimpleAdBanner position="top" className="mb-6" />
        
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
          
            <SimpleAdBanner position="middle" className="my-6" />
          
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
            
            {/* Top Players & Leaderboard Section */}
            <section className="mt-10 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                🏆 Leaderboards
              </h2>
              
              {/* Monthly Winners - Full Width with Animation */}
              <div className="animate-fade-in">
                <MonthlyWinnersSection className="hover-scale" limit={5} />
              </div>
              
              {/* Top Players & All-Time Leaderboard - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <TopPlayersSection className="h-full hover-scale" limit={10} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <LeaderboardSection />
                </div>
              </div>
            </section>
            
            <SimpleAdBanner position="bottom" className="mt-6" />
          </div>
          
          <div className="w-full md:w-64">
            <SimpleAdBanner 
              position="sidebar" 
              className="sticky top-20"
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
