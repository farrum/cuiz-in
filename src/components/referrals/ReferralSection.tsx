
import React from 'react';
import useReferrals from '@/hooks/useReferrals';
import ReferralInviteForm from './ReferralInviteForm';
import ReferralLinkShare from './ReferralLinkShare';
import ReferralTable from './ReferralTable';
import DemoControls from './DemoControls';

const ReferralSection: React.FC = () => {
  const { referrals, addReferral, simulateMonthlyActivity } = useReferrals();
  
  return (
    <div className="quiz-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium">Refer Friends</h3>
        <div className="rounded-full bg-primary/10 text-primary px-3 py-1 text-sm">
          ₹500 per month
        </div>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Invite your friends to play QuizPoints and earn ₹500 for each friend who joins and plays actively! 
        You'll continue to earn ₹500 every month your friend remains active.
      </p>
      
      <ReferralInviteForm addReferral={addReferral} />
      
      <ReferralLinkShare />
      
      {referrals.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium mb-4">Your Referrals</h4>
          
          <ReferralTable referrals={referrals} />
          
          {/* Demo buttons - For testing only */}
          {referrals.length > 0 && (
            <DemoControls 
              referralId={referrals[0]?.id} 
              onSimulateActivity={simulateMonthlyActivity} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
