
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArchivedChallenges from '@/components/ArchivedChallenges';

const ArchivedChallengesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <ArchivedChallenges />
      </main>
      <Footer />
    </div>
  );
};

export default ArchivedChallengesPage;
