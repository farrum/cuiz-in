
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
  RegistrationIncentiveModal
} from '@/components/home';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const Index: React.FC = () => {
  const {
    hasStarted,
    isLoggedIn,
    navigateToRegister,
    navigateToLogin,
  } = useHomePageState();
  
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
    <main className="min-h-screen flex flex-col gradient-hero">
      <SEO 
        title="CuizIN - Free Quiz Game with Rewards" 
        description="Play quizzes, earn points, and get rewarded. CuizIN is a completely free quiz platform where players can earn monthly income through active play."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      <Header />
      
      {/* Registration incentive modal for guests */}
      {!isLoggedIn && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
      <div className="flex-1 flex flex-col pt-20 pb-24 md:pb-12">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <HeroSectionEnhanced 
            isLoggedIn={isLoggedIn}
            hasStarted={hasStarted}
            navigateToRegister={navigateToRegister}
            navigateToLogin={navigateToLogin}
          />
        </section>
        
        {/* Try a Question Section */}
        <TryQuestionSection />

        {/* Category Preview Section */}
        <section className="py-12 md:py-16">
          <CategoryPreviewSection />
        </section>
        
        {/* Ad placement - less intrusive */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
          <SimpleAdBanner position="content" className="rounded-xl overflow-hidden" />
        </div>

        {/* How It Works Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <HowItWorksSection />
        </section>

        {/* Testimonials */}
        <section className="py-12 md:py-16">
          <TestimonialsSection />
        </section>

        {/* Final CTA */}
        <section className="py-12 md:py-16">
          <CallToAction />
        </section>
      </div>
      
      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </main>
  );
};

export default Index;
