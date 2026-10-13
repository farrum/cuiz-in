import React from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DailyChallenges from '@/components/challenges/DailyChallenges';
import DailyRewardsSection from '@/components/home/DailyRewardsSection';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const DailyChallengePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Daily Challenge | CuizIN"
        description="Take on today's CuizIN daily challenge: fresh trivia questions every day. Keep your streak alive, climb the leaderboard and collect bonus points and gems."
        canonicalUrl="https://cuiz.in/daily"
      />

      <Header />

      <main className="flex-1 container max-w-5xl px-4 pt-24 pb-10">
        <h1 className="text-2xl md:text-3xl font-black font-cinzel text-amber-950">
          Daily Challenge
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fresh challenges every day — complete them to keep your streak and earn rewards.
        </p>

        <SimpleAdBanner position="header" slotId="daily-top" className="mt-4 rounded-xl overflow-hidden" />

        <DailyChallenges />

        <div className="mt-8">
          <DailyRewardsSection />
        </div>

        <SimpleAdBanner position="footer" slotId="daily-bottom" className="mt-6 rounded-xl overflow-hidden" />
      </main>

      <Footer />
    </div>
  );
};

export default DailyChallengePage;
