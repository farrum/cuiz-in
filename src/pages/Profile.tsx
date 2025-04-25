
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileLayout from '@/components/profile/ProfileLayout';
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
  
  // Use either the URL param or the logged-in user's ID
  const displayUserId = urlUserId || userId;
  
  // Don't show the suspended account component in the main content area
  // ProfileLayout will handle conditional rendering based on suspension status
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 container max-w-6xl py-10 px-4">
        <SimpleAdBanner position="header" className="mb-6" />
        
        <ProfileLayout forceReloadAds={forceReloadAds} isSuspended={suspended}>
          <ProfileContent 
            userId={displayUserId}
            username={username}
            userUpi={userUpi}
            profilePicture={profilePicture}
            forceReloadAds={forceReloadAds}
            onProfileUpdate={handleProfileUpdate}
          />
        </ProfileLayout>
        
        <SimpleAdBanner position="footer" className="mt-8" />
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
