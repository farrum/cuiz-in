
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  HeroSection, 
  FeatureSection,
  HowToEarnSection,
  InfoSection,
  TestimonialsSection,
  CallToAction,
  HelpSection,
  AnimatedBackgrounds,
  PartnershipSection,
  AdDebugPanel
} from '@/components/home';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useQuizAdSync } from '@/hooks/quiz/useQuizAdSync';
import { useHomePageState } from '@/hooks/useHomePageState';

const Index: React.FC = () => {
  const [forceReloadAds, setForceReloadAds] = useState<number>(0);
  const [isAdmin] = useLocalStorage('user_role', '');
  const { syncAdSlots } = useQuizAdSync(setForceReloadAds);
  
  // Get homepage state for hero section
  const { 
    userName,
    hasStarted,
    showNameInput,
    setUserName,
    setShowNameInput,
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit
  } = useHomePageState();
  
  // Ensure ads are loaded on page load
  useEffect(() => {
    syncAdSlots();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>CuizIN - Fun Quizzes with Rewards</title>
        <meta name="description" content="Play fun quizzes, earn points, and redeem rewards with CuizIN - the ultimate quiz platform." />
        <meta property="og:title" content="CuizIN - Fun Quizzes with Rewards" />
        <meta property="og:description" content="Play fun quizzes, earn points, and redeem rewards with CuizIN - the ultimate quiz platform." />
        <meta name="keywords" content="quiz, quiz games, rewards, points, trivia, knowledge test, online quiz, quiz competition" />
      </Helmet>
      
      <Header />
      
      <AnimatedBackgrounds />
      
      <main className="flex-1">
        <HeroSection 
          userName={userName}
          hasStarted={hasStarted}
          showNameInput={showNameInput}
          handleStartClick={handleStartClick}
          navigateToRegister={navigateToRegister}
          navigateToLogin={navigateToLogin}
          navigateToProfile={navigateToProfile}
        />
        
        <AdvertisementBanner 
          key={`top-${forceReloadAds}`}
          position="top" 
          slotId="home-top" 
          pageSection="home-page" 
        />
        
        <InfoSection />
        
        <FeatureSection />
        
        <AdvertisementBanner 
          key={`middle-${forceReloadAds}`}
          position="middle" 
          slotId="home-ad" 
          pageSection="home-page"
        />
        
        <HowToEarnSection />
        
        <AdvertisementBanner 
          key={`middle1-${forceReloadAds}`}
          position="middle" 
          slotId="home-middle-1" 
          pageSection="home-page-middle"
        />
        
        <TestimonialsSection />
        
        <AdvertisementBanner 
          key={`middle2-${forceReloadAds}`}
          position="middle" 
          slotId="home-middle-2" 
          pageSection="home-page-bottom"
        />
        
        <CallToAction />
        
        <HelpSection />
        
        <PartnershipSection />
        
        <AdvertisementBanner 
          key={`bottom-${forceReloadAds}`}
          position="bottom" 
          slotId="home-bottom" 
          pageSection="home-page-footer"
        />
      </main>
      
      <Footer />
      
      {/* Only show debug panel for admins */}
      {isAdmin === 'admin' && <AdDebugPanel />}
    </div>
  );
};

export default Index;
