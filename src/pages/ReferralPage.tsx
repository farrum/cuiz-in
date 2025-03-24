
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReferralSection from '@/components/ReferralSection';

const ReferralPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">Referral Program</h1>
        
        {/* Single full-width referral section */}
        <ReferralSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default ReferralPage;
