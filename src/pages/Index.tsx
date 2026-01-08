
import React, { Suspense } from 'react';
import SEO from '@/components/SEO';
import OrganizationSchema from '@/components/OrganizationSchema';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useHomePageState } from '@/hooks/useHomePageState';
import {
  HeroSectionEnhanced,
  HowItWorksSection,
  CallToAction,
  MobileBottomNav,
  TryQuestionSection,
  RegistrationIncentiveModal,
  DailyStreakTracker,
  ReferralPreview,
} from '@/components/home';

// Lazy load below-the-fold sections
const CategoryPreviewSection = React.lazy(() => import('@/components/home/CategoryPreviewSection'));
const TestimonialsSection = React.lazy(() => import('@/components/home/TestimonialsSection'));
const RecentWinnersSection = React.lazy(() => import('@/components/home/RecentWinnersSection'));
const SimpleAdBanner = React.lazy(() => import('@/components/ads/SimpleAdBanner'));

// Minimal section loader with fixed height to prevent CLS
const SectionLoader = () => <div className="min-h-[200px]" aria-hidden="true" />;

// Ad placeholder with fixed height to prevent layout shift
const AdPlaceholder = () => <div className="min-h-[250px] md:min-h-[90px]" aria-hidden="true" />;

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
    'datePublished': '2024-01-01',
    'dateModified': new Date().toISOString().split('T')[0],
    'inLanguage': 'en-IN',
    'publisher': {
      '@type': 'Organization',
      'name': 'CuizIN',
      'url': 'https://cuiz.in',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://cuiz.in/og-image.png'
      }
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.8',
      'reviewCount': '3250',
      'bestRating': '5',
      'worstRating': '1'
    },
    'review': [
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Priya S.' },
        'datePublished': '2025-12-15',
        'reviewBody': 'Amazing quiz app! I love earning rewards while learning new things.',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      },
      {
        '@type': 'Review',
        'author': { '@type': 'Person', 'name': 'Rahul K.' },
        'datePublished': '2025-11-20',
        'reviewBody': 'Great variety of questions across categories. Highly recommended!',
        'reviewRating': { '@type': 'Rating', 'ratingValue': '5', 'bestRating': '5' }
      }
    ],
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
      <OrganizationSchema />
      <Header />
      
      {!isLoggedIn && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
      <div className="flex-1 flex flex-col pt-20 pb-20 md:pb-8">
        {/* Hero Section - Critical, loads immediately */}
        <section className="py-8 md:py-12">
          <HeroSectionEnhanced 
            isLoggedIn={isLoggedIn}
            hasStarted={hasStarted}
            navigateToRegister={navigateToRegister}
            navigateToLogin={navigateToLogin}
          />
        </section>
        
        {/* Try a Question Section - Important for engagement */}
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

        {/* Recent Winners Section - Lazy loaded */}
        <Suspense fallback={<SectionLoader />}>
          <RecentWinnersSection />
        </Suspense>

        {/* Category Preview Section - Lazy loaded */}
        <section className="py-6 md:py-8">
          <Suspense fallback={<SectionLoader />}>
            <CategoryPreviewSection />
          </Suspense>
        </section>
        
        {/* Ad placement - Lazy loaded with fixed height placeholder */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<AdPlaceholder />}>
            <SimpleAdBanner position="content" className="rounded-xl overflow-hidden min-h-[250px] md:min-h-[90px]" />
          </Suspense>
        </div>

        {/* How It Works Section */}
        <section className="py-6 md:py-8 bg-muted/30">
          <HowItWorksSection />
        </section>

        {/* Testimonials - Lazy loaded */}
        <section className="py-6 md:py-8 px-4">
          <Suspense fallback={<SectionLoader />}>
            <TestimonialsSection />
          </Suspense>
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
