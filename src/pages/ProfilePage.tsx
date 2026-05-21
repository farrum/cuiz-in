
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
    displayName,
    userUpi,
    userId,
    profilePicture,
    suspended,
    email,
    phone,
    provider,
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
      
      <main className="flex-1 container max-w-4xl pt-6 pb-8 px-4">
        <SimpleAdBanner position="top" className="mb-4" />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-9">
            <ProfileTabs
              userId={userId}
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
          
          <aside className="hidden md:block md:col-span-3">
            <SimpleAdBanner 
              position="sidebar" 
              className="sticky top-20"
            />
          </aside>
        </div>
        
        <SimpleAdBanner position="bottom" className="mt-4" />
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
