
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReferralSection from '@/components/ReferralSection';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const ReferralPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24 max-w-4xl">
        <SimpleAdBanner position="top" className="mb-6" />
        
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">Referral Program</h1>
        
        {/* Single full-width referral section */}
        <ReferralSection />
        
        <SimpleAdBanner position="bottom" className="mt-8" />
      </main>
      
      <div className="hidden md:block fixed right-4 top-24 w-64">
        <SimpleAdBanner position="sidebar" className="sticky top-24" />
      </div>
      
      <Footer />
    </div>
  );
};

export default ReferralPage;
