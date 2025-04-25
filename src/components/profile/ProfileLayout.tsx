
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SuspendedAccountHandler from '@/components/SuspendedAccountHandler';
import { useAuthCheck } from '@/hooks/useAuthCheck';

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
  const { isAuthenticated, userRole } = useAuthCheck();
  
  useEffect(() => {
    console.log(`ProfileLayout rendered with forceReloadAds: ${forceReloadAds}, isSuspended: ${isSuspended}`);
  }, [forceReloadAds, isSuspended]);

  // Handle the suspended account separately through SuspendedAccountHandler
  return (
    <SuspendedAccountHandler
      isAuthenticated={isAuthenticated}
      isSuspended={isSuspended}
      userRole={userRole}
      onReactivated={() => {}}
    >
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
          <SimpleAdBanner 
            position="header" 
            className="mb-6" 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-9">
              {children}
            </div>
            
            <div className="md:col-span-3">
              <SimpleAdBanner 
                position="sidebar" 
                className="sticky top-20"
              />
            </div>
          </div>
          
          <SimpleAdBanner 
            position="footer" 
            className="mt-6" 
          />
        </main>
        <Footer />
      </div>
    </SuspendedAccountHandler>
  );
};

export default ProfileLayout;
