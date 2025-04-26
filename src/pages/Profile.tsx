
import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useProfileData } from '@/hooks/profile';

const Profile: React.FC = () => {
  const { userId: urlUserId } = useParams();
  
  const {
    username,
    userUpi,
    userId,
    profilePicture,
    forceReloadAds,
    handleProfileUpdate,
  } = useProfileData();
  
  const displayUserId = urlUserId || userId;
  
  return (
    <PageLayout>
      <div className="flex-1 container max-w-4xl py-10 px-4">
        <ProfileTabs
          userId={displayUserId}
          username={username}
          userUpi={userUpi}
          profilePicture={profilePicture}
          forceReloadAds={forceReloadAds}
          onProfileUpdate={handleProfileUpdate}
        />
      </div>
    </PageLayout>
  );
};

export default Profile;
