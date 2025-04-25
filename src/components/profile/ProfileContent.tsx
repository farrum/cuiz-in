
import React from 'react';
import PointsDisplay from '@/components/PointsDisplay';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import ProfileHeader from './ProfileHeader';

interface ProfileContentProps {
  userId: string | null;
  username: string | null;
  profilePicture: string;
  userUpi?: string;
  forceReloadAds?: number;
  onProfileUpdate?: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userId,
  username,
  profilePicture,
  userUpi,
  onProfileUpdate,
}) => {
  return (
    <>
      <PointsDisplay animateUpdate className="mb-6" />
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <ProfileHeader
          username={username}
          profilePicture={profilePicture}
        />
      </div>
      
      <SimpleAdBanner position="middle" className="my-8" />
      
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
