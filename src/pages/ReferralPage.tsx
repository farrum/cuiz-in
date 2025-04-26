
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import ReferralSection from '@/components/ReferralSection';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const ReferralPage = () => {
  return (
    <PageLayout>
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24 max-w-4xl">
        <SimpleAdBanner position="top" className="mb-6" />
        
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">Referral Program</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            <ReferralSection />
          </div>
          
          <div className="md:col-span-3">
            <SimpleAdBanner position="sidebar" className="sticky top-20" />
          </div>
        </div>
        
        <SimpleAdBanner position="bottom" className="mt-8" />
      </main>
    </PageLayout>
  );
};

export default ReferralPage;
