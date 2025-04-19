
import React, { useEffect, useState } from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
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
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const [isAdmin] = useLocalStorage('user_role', '');
  const { syncAdSlots } = useQuizAdSync(setForceReloadAds);
  const homePageState = useHomePageState();
  
  // Schema.org structured data for the homepage
  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'url': 'https://cuiz.in',
    'name': 'CuizIN - Free Quiz Game with Rewards',
    'description': 'Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://cuiz.in/quiz?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };
  
  // Ensure ads are loaded on page load
  useEffect(() => {
    syncAdSlots();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="CuizIN - Free Quiz Game with Rewards" 
        description="Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      
      <Header />
      
      <AnimatedBackgrounds />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4">
        <HeroSection 
          userName={homePageState.userName}
          hasStarted={homePageState.hasStarted}
          showNameInput={homePageState.showNameInput}
          handleStartClick={homePageState.handleStartClick}
          navigateToRegister={homePageState.navigateToRegister}
          navigateToLogin={homePageState.navigateToLogin}
          navigateToProfile={homePageState.navigateToProfile}
        />
        
        <AdvertisementBanner 
          position="top" 
          slotId="home-top" 
          pageSection="home-page" 
          key={`top-${forceReloadAds}`} 
        />
        
        <InfoSection />
        
        <FeatureSection />
        
        <AdvertisementBanner 
          position="middle" 
          slotId="home-ad" 
          pageSection="home-page" 
          key={`middle-${forceReloadAds}`} 
        />
        
        <HowToEarnSection />
        
        <AdvertisementBanner 
          position="middle" 
          slotId="home-middle-1" 
          pageSection="home-page-middle" 
          key={`middle1-${forceReloadAds}`} 
        />
        
        <TestimonialsSection />
        
        <AdvertisementBanner 
          position="middle" 
          slotId="home-middle-2" 
          pageSection="home-page-bottom" 
          key={`middle2-${forceReloadAds}`} 
        />
        
        <CallToAction />
        
        <HelpSection />
        
        <PartnershipSection />
        
        <AdvertisementBanner 
          position="bottom" 
          slotId="home-bottom" 
          pageSection="home-page-footer" 
          key={`bottom-${forceReloadAds}`} 
        />
      </main>
      
      <Footer />
      
      {isAdmin === 'admin' && <AdDebugPanel />}
    </div>
  );
};

export default Index;
