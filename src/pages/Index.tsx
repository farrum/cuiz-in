
import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { useHomePageState } from '@/hooks/useHomePageState';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
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
    setUserName,
    handleStartClick,
    navigateToRegister,
    navigateToLogin,
    navigateToProfile,
    handleNameSubmit
  } = useHomePageState();
  
  // Use this to only show debug in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Schema.org data for the website
  const websiteSchema = {
    name: 'CuizIN',
    url: 'https://cuiz.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cuiz.in/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    description: 'Free quiz platform where users can earn fixed monthly income by completing quizzes, challenges, and referring friends.',
    publisher: {
      '@type': 'Organization',
      name: 'CuizIN',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cuiz.in/og-image.png'
      }
    }
  };

  // Organization schema
  const organizationSchema = {
    name: 'CuizIN',
    url: 'https://cuiz.in',
    logo: 'https://cuiz.in/og-image.png',
    sameAs: [
      'https://facebook.com/cuizin',
      'https://twitter.com/cuizin',
      'https://instagram.com/cuizin'
    ]
  };
  
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <SEOMetaTags 
        title="CuizIN - Play Quizzes, Earn Rewards"
        description="Join CuizIN's free quiz platform and earn a fixed monthly income by completing quizzes, daily challenges, and referring friends. No payment required to start."
        keywords="quiz app, earn money online, free quiz platform, referral program, quiz rewards, online income, knowledge games, trivia rewards"
        ogImage="/og-image.png"
      />
      
      <StructuredData type="WebSite" data={websiteSchema} />
      <StructuredData type="Organization" data={organizationSchema} />
      
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
        
        {/* Bottom ad without debugger in production */}
        <AdvertisementBanner position="bottom" slotId="home-bottom" pageSection="home-page-footer" className="mt-12" />
        
        {/* Only show debugger in development mode */}
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
