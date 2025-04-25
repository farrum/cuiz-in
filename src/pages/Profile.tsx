
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileContent from '@/components/profile/ProfileContent';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import { useProfileData } from '@/hooks/profile';

const Profile: React.FC = () => {
  const { userId: urlUserId } = useParams();
  
  const {
    isLoading,
    username,
    userUpi,
    userId,
    profilePicture,
    suspended,
    forceReloadAds,
    handleProfileUpdate,
    handleReactivated,
  } = useProfileData();
  
  const displayUserId = urlUserId || userId;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 container max-w-6xl py-10 px-4">
        <SimpleAdBanner position="top" className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            <ProfileContent 
              userId={displayUserId}
              username={username}
              userUpi={userUpi}
              profilePicture={profilePicture}
              forceReloadAds={forceReloadAds}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
          
          <div className="md:col-span-3">
            <SimpleAdBanner 
              position="sidebar" 
              className="sticky top-20"
            />
          </div>
        </div>
        
        <SimpleAdBanner position="bottom" className="mt-8" />
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
