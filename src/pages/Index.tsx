
import React from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useHomePageState } from '@/hooks/useHomePageState';
import {
  HeroSectionEnhanced,
  HowItWorksSection,
  CategoryPreviewSection,
  TestimonialsSection,
  CallToAction,
  MobileBottomNav,
  TryQuestionSection,
  RegistrationIncentiveModal,
  DailyStreakTracker,
  ReferralPreview,
  RecentWinnersSection
} from '@/components/home';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const Index: React.FC = () => {
  const {
    hasStarted,
    isLoggedIn,
    navigateToRegister,
    navigateToLogin,
  } = useHomePageState();
  
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
    <main className="min-h-screen flex flex-col gradient-hero">
      <SEO 
        title="CuizIN - Free Quiz Game with Rewards" 
        description="Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      <Header />
      
      {!isLoggedIn && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
      <div className="flex-1 flex flex-col pt-20 pb-20 md:pb-8">
        {/* Hero Section */}
        <section className="py-8 md:py-12">
          <HeroSectionEnhanced 
            isLoggedIn={isLoggedIn}
            hasStarted={hasStarted}
            navigateToRegister={navigateToRegister}
            navigateToLogin={navigateToLogin}
          />
        </section>
        
        {/* Try a Question Section */}
        <TryQuestionSection />

        {/* Engagement Section - Streak & Referral */}
        <section className="py-6 md:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DailyStreakTracker />
              <ReferralPreview />
            </div>
          </div>
        </section>

        {/* Recent Winners Section */}
        <RecentWinnersSection />

        {/* Category Preview Section */}
        <section className="py-6 md:py-8">
          <CategoryPreviewSection />
        </section>
        
        {/* Ad placement - wrapped to collapse gracefully */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SimpleAdBanner position="content" className="rounded-xl overflow-hidden" />
        </div>

        {/* How It Works Section */}
        <section className="py-6 md:py-8 bg-muted/30">
          <HowItWorksSection />
        </section>

        {/* Testimonials */}
        <section className="py-6 md:py-8 px-4">
          <TestimonialsSection />
        </section>

        {/* Final CTA */}
        <section className="py-6 md:py-8 px-4">
          <CallToAction />
        </section>
      </div>
      
      <Footer />
      <MobileBottomNav />
    </main>
  );
};

export default Index;
