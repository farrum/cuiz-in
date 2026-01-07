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
import GuestPlayProgressBar from '@/components/quiz/GuestPlayProgressBar';
import GuestPointsBanner from '@/components/quiz/GuestPointsBanner';
import MilestoneCelebration from '@/components/quiz/MilestoneCelebration';
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
  const [milestoneCheckTrigger, setMilestoneCheckTrigger] = useState(0);
  
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
  };
  
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
    'datePublished': '2024-01-01',
    'dateModified': new Date().toISOString().split('T')[0],
    'inLanguage': 'en-IN',
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
      'availability': 'https://schema.org/InStock',
      'validFrom': '2024-01-01'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '2456',
      'bestRating': '5',
      'worstRating': '1'
    },
    'review': [
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Ankit M.' },
        'datePublished': '2025-12-10',
        'reviewBody': 'Fun and educational! The daily challenges keep me coming back.',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      },
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Sneha P.' },
        'datePublished': '2025-11-28',
        'reviewBody': 'Love the variety of categories and difficulty levels.',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '4', 'bestRating': '5' }
      }
    ]
  };

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
      
      <MilestoneCelebration triggerCheck={milestoneCheckTrigger} />
      
      <main className="flex-1 container max-w-4xl pt-6 pb-8 px-4">
        <Breadcrumb className="mb-3">
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
        
        <GuestPlayProgressBar className="mb-4" />
        
        <SimpleAdBanner position="top" className="mb-4" />
        
        <div className="flex justify-between items-center mb-4">
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
          <div className="mb-4">
            <GameModeSelector />
          </div>
        )}
        
        {!isGameActive && currentMode === 'time-attack' && (
          <div className="bg-muted p-4 rounded-lg mb-4 text-center">
            <h2 className="text-xl font-bold mb-2">Time's Up!</h2>
            <p className="mb-3">You answered {questionsAnswered} questions in {config.timeLimit} seconds!</p>
            <Button onClick={resetGame} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Play Again
            </Button>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <PointsAndProgress 
              questionsAnswered={questionsAnswered}
              streak={streak}
              dailyPoints={dailyPoints}
              monthlyPoints={monthlyPoints}
              nextBadgeThreshold={nextBadgeThreshold}
            />
          
            <SimpleAdBanner position="middle" className="my-4" />
          
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
          
            <GuestPointsBanner className="my-4" />
            
            <DailyChallenges />
            
            <section className="mt-8 space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                🏆 Leaderboards
              </h2>
              
              <div className="animate-fade-in">
                <MonthlyWinnersSection className="hover-scale" limit={5} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                  <TopPlayersSection className="h-full hover-scale" limit={10} />
                </div>
                <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <LeaderboardSection />
                </div>
              </div>
            </section>
            
            <SimpleAdBanner position="bottom" className="mt-4" />
          </div>
          
          <aside className="hidden md:block w-64 flex-shrink-0">
            <SimpleAdBanner 
              position="sidebar" 
              className="sticky top-20"
            />
          </aside>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default QuizPage;
