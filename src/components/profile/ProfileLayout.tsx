
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';

interface ProfileLayoutProps {
  children: React.ReactNode;
  forceReloadAds: number;
  isSuspended?: boolean;
}

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ 
  children, 
  forceReloadAds,
  isSuspended = false
}) => {
  if (isSuspended) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <AdvertisementBanner 
          key={`profile-top-${forceReloadAds}`} 
          position="top" 
          slotId="profile-top" 
          pageSection="profile-page" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">
            {children}
          </div>
          
          <div className="md:col-span-3">
            <AdvertisementBanner 
              key={`profile-sidebar-${forceReloadAds}`} 
              position="sidebar" 
              slotId="profile-sidebar" 
              pageSection="profile-page" 
              className="sticky top-20"
            />
          </div>
        </div>
        
        <AdvertisementBanner 
          key={`profile-bottom-${forceReloadAds}`} 
          position="bottom" 
          slotId="profile-bottom" 
          pageSection="profile-page" 
        />
      </main>
      <Footer />
    </div>
  );
};

export default ProfileLayout;
