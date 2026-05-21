
import React from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useProfileData } from '@/hooks/profile';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SEO from '@/components/SEO';

const Profile: React.FC = () => {
  const { userId: urlUserId } = useParams();
  
  const {
    username,
    displayName,
    userUpi,
    userId,
    profilePicture,
    email,
    phone,
    provider,
    forceReloadAds,
    handleProfileUpdate,
  } = useProfileData();
  
  const displayUserId = urlUserId || userId;
  
  return (
    <PageLayout hidePreFooterAd={true}>
      <SEO
        title="My Profile | CuizIN"
        description="View and manage your CuizIN profile — track your quiz progress, points, streaks, achievements, and rewards in one place."
        noindex={true}
      />
      <div className="flex-1 container max-w-4xl py-10 px-4">
        <h1 className="sr-only">My CuizIN Profile</h1>
        <SimpleAdBanner position="top" className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            <ProfileTabs
              userId={displayUserId}
              username={username}
              displayName={displayName}
              userUpi={userUpi}
              profilePicture={profilePicture}
              email={email}
              phone={phone}
              provider={provider}
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
