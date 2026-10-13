
import React from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArchivedChallenges from '@/components/ArchivedChallenges';

const ArchivedChallengesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Challenge Archive | CuizIN"
        description="Browse past CuizIN challenges and see how you scored. Revisit completed quizzes, track your progress, and get ready for the next daily challenge."
        canonicalUrl="https://cuiz.in/archived-challenges"
      />
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <ArchivedChallenges />
      </main>
      <Footer />
    </div>
  );
};

export default ArchivedChallengesPage;
