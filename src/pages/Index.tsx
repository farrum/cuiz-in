
import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { useHomePageState } from '@/hooks/useHomePageState';
import AdDebugger from '@/components/ads/AdDebugger';
import {
  HeroSection,
  NameInputForm,
  FeatureSection,
  HowToEarnSection,
  InfoSection,
  TestimonialsSection,
  CallToAction,
  HelpSection,
  AnimatedBackgrounds
} from '@/components/home';

const Index: React.FC = () => {
  const {
    userName,
    hasStarted,
    showNameInput,
    forceReloadAds,
    setUserName,
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit
  } = useHomePageState();
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
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
  
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <SEO 
        title="CuizIN - Free Quiz Game with Rewards" 
        description="Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <AnimatedBackgrounds />
        
        {showNameInput ? (
          <NameInputForm 
            userName={userName} 
            onChange={setUserName} 
            onSubmit={handleNameSubmit} 
          />
        ) : (
          <HeroSection 
            userName={userName}
            hasStarted={hasStarted}
            showNameInput={showNameInput}
            handleStartClick={handleStartClick}
            navigateToRegister={navigateToRegister}
            navigateToLogin={navigateToLogin}
            navigateToProfile={navigateToProfile}
          />
        )}
        
        <AdvertisementBanner position="middle" slotId="home-ad" pageSection="home-page" />
        
        <FeatureSection />
        
        <HelpSection />
        
        {/* New Ad Slot 1 */}
        <AdvertisementBanner position="middle" slotId="home-middle-1" pageSection="home-page-middle" className="mt-12" />
        
        <HowToEarnSection />
        
        {/* New Ad Slot 2 */}
        <AdvertisementBanner position="middle" slotId="home-middle-2" pageSection="home-page-bottom" className="mt-12" />
        
        {/* New SEO Content Section */}
        <InfoSection />
        
        <TestimonialsSection />
        
        <CallToAction />
        
        {/* Bottom ad with debugger */}
        <AdvertisementBanner position="bottom" slotId="home-bottom" pageSection="home-page-footer" className="mt-12" />
        
        {isDevelopment && (
          <AdDebugger 
            position="bottom" 
            slotId="home-bottom" 
            pageSection="home-page-footer" 
            className="mt-4 max-w-3xl w-full"
          />
        )}
      </div>
      
      <Footer />
    </main>
  );
};

export default Index;
