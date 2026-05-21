
import { useProfileInfo } from './useProfileInfo';
import { useProfileAds } from './useProfileAds';

export const useProfileData = () => {
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
    handleProfileUpdate,
    handleReactivated
  } = useProfileInfo();
  
  const { forceReloadAds } = useProfileAds();
  
  return {
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
  };
};
