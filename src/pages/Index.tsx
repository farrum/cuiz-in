import React, { Suspense, lazy } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import OrganizationSchema from '@/components/OrganizationSchema';
import { useHomePageState } from '@/hooks/useHomePageState';
import HeroSectionEnhanced from '@/components/home/HeroSectionEnhanced';
import TryQuestionSection from '@/components/home/TryQuestionSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import TestimonialsSection from '@/components/home/TestimonialsSection';
import CallToAction from '@/components/home/CallToAction';
import DailyStreakTracker from '@/components/home/DailyStreakTracker';
import ReferralPreview from '@/components/home/ReferralPreview';
import { DailyBountyBoard } from '@/components/home/DailyBountyBoard';
import RegistrationIncentiveModal from '@/components/home/RegistrationIncentiveModal';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import DailyRewardsSection from '@/components/home/DailyRewardsSection';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { MedievalAdvisors } from '@/mobile/components/MedievalAdvisors';
import { MiniGamesPavilion } from '@/components/home/MiniGamesPavilion';


const CategoryPreviewSection = lazy(() => import('@/components/home/CategoryPreviewSection'));
const LatestArticlesSection = lazy(() => import('@/components/home/LatestArticlesSection'));
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
    'description': 'Play quizzes, earn gems, and climb the leaderboard. CuizIN is a completely free quiz platform where players can test their knowledge and compete.',
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
    <PageLayout className="stone-wall glass-diamond-bg" containerClassName="pt-4 pb-20 md:pb-8">
      <SEO 
        title="CuizIN - Play Quiz & Learn" 
        description="Play quizzes, earn gems, and climb the leaderboard. CuizIN is a completely free quiz platform where players can test their knowledge and compete."
        schemaType="WebSite"
        schemaData={homeSchema}
      />
      <OrganizationSchema />
      
      {!isLoggedIn && <RegistrationIncentiveModal triggerAfterQuestions={3} />}
      
      {/* Ad placement - very top of homepage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
        <Suspense fallback={null}>
          <SimpleAdBanner position="header" slotId="home-hero-top" className="rounded-xl overflow-hidden" />
        </Suspense>
      </div>

      {/* Hero Section - Critical, loads immediately */}
      <section className="py-8 md:py-12">
        <HeroSectionEnhanced 
          isLoggedIn={isLoggedIn}
          hasStarted={hasStarted}
          navigateToRegister={navigateToRegister}
          navigateToLogin={navigateToLogin}
        />
      </section>

      {/* Curia Regis (Royal Council) Section */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4" aria-labelledby="curia-regis-heading">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
          <div className="text-center px-4">
            <span className="text-xs font-black tracking-[0.25em] uppercase text-amber-900/70 block font-cinzel">
              Curia Regis
            </span>
            <h2 id="curia-regis-heading" className="text-xl md:text-2xl font-black text-amber-950 font-cinzel">
              The Royal Council & Legendary Advisors
            </h2>
            <p className="text-xs text-amber-800/60 font-semibold mt-0.5">
              Consult your councillors for lifelines or forge shards with gems & royal decrees to ascend their rank
            </p>
          </div>
          <span className="h-px flex-1 section-divider-shimmer rounded-full" />
        </div>

        <MedievalAdvisors />
      </section>
      
      {/* Try a Question Section - Knowledge Trial */}
      <TryQuestionSection />

      {/* Mini-Games Arcade Pavilion */}
      <MiniGamesPavilion />

      {/* Ad placement - Top of homepage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <SimpleAdBanner position="header" slotId="home-top" className="rounded-xl overflow-hidden" />
        </Suspense>
      </div>

      {/* Engagement Section - Streak & Referral */}
      <section className="py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DailyStreakTracker />
            <ReferralPreview />
          </div>
          <DailyBountyBoard />
        </div>
      </section>

      {/* Daily Rewards Section */}
      <section className="py-6 md:py-8 bg-purple-50/30 border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DailyRewardsSection />
        </div>
      </section>

      {/* Category Preview Section - Lazy loaded */}
      <section className="py-6 md:py-8">
        <Suspense fallback={<SectionLoader />}>
          <CategoryPreviewSection />
        </Suspense>
      </section>

      {/* Latest Articles Section - AdSense SEO Bulking */}
      <section className="py-6 md:py-8 bg-muted/10 border-y">
        <Suspense fallback={<SectionLoader />}>
          <LatestArticlesSection />
        </Suspense>
      </section>
      
      {/* Ad placement - Lazy loaded with fixed height placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <SimpleAdBanner position="content" slotId="home-middle" className="rounded-xl overflow-hidden" />
        </Suspense>
      </div>

      {/* How It Works Section */}
      <section className="py-6 md:py-8 bg-muted/30">
        <HowItWorksSection />
      </section>

      {/* Testimonials - Lazy loaded */}
      <section className="py-6 md:py-8 px-4">
        <TestimonialsSection />
      </section>

      {/* Final CTA */}
      <section className="py-6 md:py-8 px-4">
        <CallToAction />
      </section>

      {/* Ad placement - Bottom of homepage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={null}>
          <SimpleAdBanner position="footer" slotId="home-bottom" className="rounded-xl overflow-hidden" />
        </Suspense>
      </div>

      <MobileBottomNav />
    </PageLayout>
  );
};

export default Index;
