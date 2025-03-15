
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ReferralSection from '@/components/referrals/ReferralSection';
import { STORAGE_KEYS } from '@/types/quiz';
import { User } from 'lucide-react';
import { ReferralEntry } from '@/types/referral';
import ReferralTable from '@/components/referrals/ReferralTable';

const ReferralPage = () => {
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);

  useEffect(() => {
    const savedReferrals = localStorage.getItem(STORAGE_KEYS.REFERRALS);
    if (savedReferrals) {
      setReferrals(JSON.parse(savedReferrals));
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-24 md:py-24">
        <h1 className="text-3xl font-bold mb-8 animate-fade-in">My Referrals</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Referral section for inviting new friends */}
          <div className="md:col-span-1">
            <ReferralSection />
          </div>
          
          {/* List of referred users */}
          <div className="md:col-span-1">
            <div className="quiz-card">
              <h3 className="text-xl font-medium mb-6">Referred Friends</h3>
              
              {referrals.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <User className="w-10 h-10 text-muted-foreground/50 mb-4" />
                  <p>You haven't referred any friends yet.</p>
                  <p className="text-sm mt-2">Invite friends to earn rewards!</p>
                </div>
              ) : (
                <ReferralTable referrals={referrals} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReferralPage;
