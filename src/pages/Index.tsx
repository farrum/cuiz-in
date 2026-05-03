import React, { Suspense, lazy } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import OrganizationSchema from '@/components/OrganizationSchema';
import { useHomePageState } from '@/hooks/useHomePageState';
import HeroSectionEnhanced from '@/components/home/HeroSectionEnhanced';
import TryQuestionSection from '@/components/home/TryQuestionSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import CallToAction from '@/components/home/CallToAction';
import DailyStreakTracker from '@/components/home/DailyStreakTracker';
import ReferralPreview from '@/components/home/ReferralPreview';
import RegistrationIncentiveModal from '@/components/home/RegistrationIncentiveModal';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import AdPlaceholder from '@/components/ads/AdPlaceholder';

const CategoryPreviewSection = lazy(() => import('@/components/home/CategoryPreviewSection'));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection'));
const SectionLoader = () => <div className="min-h-[200px] flex items-center justify-center"><div className="animate-pulse text-muted-foreground text-sm">Loading...</div></div>;

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
    'name': 'CuizIN - Play Quiz & Learn',
    'description': 'Play quizzes, earn points, and climb the leaderboard. CuizIN is a completely free quiz platform where players can test their knowledge and compete.',
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
        'reviewBody': 'Amazing quiz app! I love learning new things while competing on the leaderboard.',
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
    <PageLayout className="gradient-hero" containerClassName="pt-4 pb-20 md:pb-8">
      <SEO 
        title="CuizIN - Play Quiz & Learn" 
        description="Play quizzes, earn points, and climb the leaderboard. CuizIN is a completely free quiz platform where players can test their knowledge and compete."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      <OrganizationSchema />
      
      {!isLoggedIn && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
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

      {/* Ad placement - Top of homepage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
        <Suspense fallback={<AdPlaceholder position="top" />}>
          <SimpleAdBanner position="header" slotId="home-top" className="rounded-xl overflow-hidden min-h-[90px]" />
        </Suspense>
      </div>

      {/* Engagement Section - Streak & Referral */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DailyStreakTracker />
            <ReferralPreview />
          </div>
        </div>
      </section>

      {/* Category Preview Section - Lazy loaded */}
      <section className="py-6 md:py-8">
        <Suspense fallback={<SectionLoader />}>
          <CategoryPreviewSection />
        </Suspense>
      </section>
      
      {/* Ad placement - Lazy loaded with fixed height placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <Suspense fallback={<AdPlaceholder position="middle" />}>
          <SimpleAdBanner position="content" slotId="home-middle" className="rounded-xl overflow-hidden min-h-[250px] md:min-h-[90px]" />
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

      {/* Ad placement - Bottom of homepage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Suspense fallback={<AdPlaceholder position="bottom" />}>
          <SimpleAdBanner position="footer" slotId="home-bottom" className="rounded-xl overflow-hidden min-h-[90px]" />
        </Suspense>
      </div>

      <MobileBottomNav />
    </PageLayout>
  );
};

export default Index;
