
import React from 'react';
import SuspendedAccountHandler from '@/components/SuspendedAccountHandler';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { useProfileData } from '@/hooks/profile';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const ProfilePage: React.FC = () => {
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
  
  const { isAuthenticated, userRole } = useAuthCheck();
  
  if (suspended) {
    return (
      <SuspendedAccountHandler 
        isAuthenticated={isAuthenticated || false}
        isSuspended={suspended}
        userRole={userRole}
        onReactivated={handleReactivated}
      >
        <div>Account is suspended</div>
      </SuspendedAccountHandler>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <SimpleAdBanner position="top" className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            <ProfileTabs
              userId={userId}
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
        
        <SimpleAdBanner position="bottom" className="mt-6" />
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
