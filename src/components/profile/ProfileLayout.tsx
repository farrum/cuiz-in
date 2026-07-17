import React, { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
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

  return (
    <SuspendedAccountHandler
      isAuthenticated={isAuthenticated}
      isSuspended={isSuspended}
      userRole={userRole}
      onReactivated={() => {}}
    >
      <PageLayout containerClassName="container max-w-4xl pt-8 pb-12 px-4">
        <SimpleAdBanner position="top" className="mb-6" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9">{children}</div>

          <div className="md:col-span-3">
            <SimpleAdBanner position="sidebar" className="sticky top-20" />
          </div>
        </div>

        <SimpleAdBanner position="bottom" className="mt-6" />
      </PageLayout>
    </SuspendedAccountHandler>
  );
};

export default ProfileLayout;
