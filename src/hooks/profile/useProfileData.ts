
import { useProfileInfo } from './useProfileInfo';
import { useProfileAds } from './useProfileAds';

export const useProfileData = () => {
  const {
    isLoading,
    username,
    userUpi,
    userId,
    profilePicture,
    suspended,
    handleProfileUpdate,
    handleReactivated
  } = useProfileInfo();
  
  const { forceReloadAds } = useProfileAds();
  
  return {
    isLoading,
    username,
    userUpi,
    userId,
    profilePicture,
    suspended,
    forceReloadAds,
    handleProfileUpdate,
    handleReactivated,
  };
};
