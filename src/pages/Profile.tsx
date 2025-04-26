
import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useProfileData } from '@/hooks/profile';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

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
        <SimpleAdBanner position="top" className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            <ProfileTabs
              userId={displayUserId}
              username={username}
              userUpi={userUpi}
              profilePicture={profilePicture}
              forceReloadAds={forceReloadAds}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
          
          <div className="md:col-span-3">
            <SimpleAdBanner position="sidebar" className="sticky top-20" />
          </div>
        </div>
        
        <SimpleAdBanner position="bottom" className="mt-6" />
      </div>
    </PageLayout>
  );
};

export default Profile;
