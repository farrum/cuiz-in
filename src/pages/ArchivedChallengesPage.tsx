
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ArchivedChallenges from '@/components/ArchivedChallenges';

const ArchivedChallengesPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Challenge Archive | CuizIN</title>
        <meta name="description" content="Browse past CuizIN challenges and see how you scored. Revisit completed quizzes, track your progress, and get ready for the next daily challenge." />
      </Helmet>
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <ArchivedChallenges />
      </main>
      <Footer />
    </div>
  );
};

export default ArchivedChallengesPage;
