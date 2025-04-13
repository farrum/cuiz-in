
import React from 'react';
import PointsDisplay from '@/components/PointsDisplay';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import AccountReactivation from '@/components/AccountReactivation';
import ProfileHeader from './ProfileHeader';

interface ProfileContentProps {
  userId: string | null;
  username: string | null;
  userUpi: string;
  profilePicture: string;
  forceReloadAds: number;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  username,
  userUpi,
  profilePicture,
  forceReloadAds,
  onProfileUpdate
}) => {
  return (
    <>
      <PointsDisplay animateUpdate className="mb-6" />
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <AccountReactivation />
        
        <ProfileHeader
          username={username}
          userUpi={userUpi}
          userId={userId}
          profilePicture={profilePicture}
          onProfileUpdate={onProfileUpdate}
        />
      </div>
      
      <AdvertisementBanner 
        key={`profile-middle-${forceReloadAds}`} 
        position="middle" 
        slotId="profile-middle" 
        pageSection="profile-page" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {userId && <BadgesSection userId={userId} />}
        <ReferralSection />
      </div>
      
      <WithdrawalSection />
      
      {userId && <RecentlyAnsweredQuestions userId={userId} />}
    </>
  );
};

export default ProfileContent;
