
import React from 'react';
import SuspendedAccountHandler from '@/components/SuspendedAccountHandler';
import ProfileLayout from '@/components/profile/ProfileLayout';
import ProfileContent from '@/components/profile/ProfileContent';
import { useProfileData } from '@/hooks/profile';
import { useAuthCheck } from '@/hooks/useAuthCheck';

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
    <ProfileLayout forceReloadAds={forceReloadAds} isSuspended={suspended}>
      <ProfileContent
        userId={userId}
        username={username}
        userUpi={userUpi}
        profilePicture={profilePicture}
        forceReloadAds={forceReloadAds}
        onProfileUpdate={handleProfileUpdate}
      />
    </ProfileLayout>
  );
};

export default ProfilePage;
