
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { ProfileFormValues } from './ProfileEditorForm';

interface ProfileEditorStateProps {
  userName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

export const useProfileEditorState = ({
  userName,
  userUpi,
  userId,
  profilePicture,
  onProfileUpdate
}: ProfileEditorStateProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(profilePicture || '');
  const [isSessionValid, setIsSessionValid] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Checking auth in ProfileEditor for userId:", userId);
    console.log("Current profile picture is:", profilePicture);
    
    if (localStorage.getItem(STORAGE_KEYS.USER_NAME)) {
      console.log("User has a valid name in localStorage:", localStorage.getItem(STORAGE_KEYS.USER_NAME));
      setIsSessionValid(true);
      return;
    }
    
    const isLocalAuth = localStorage.getItem(STORAGE_KEYS.USER_AUTH) === 'true';
    
    if (isLocalAuth) {
      console.log("User authenticated via localStorage");
      setIsSessionValid(true);
      return;
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User authenticated via Supabase session");
        setIsSessionValid(true);
      } else {
        console.log("No valid authentication found");
        setIsSessionValid(false);
      }
    };
    
    checkAuth();
  }, [userId, profilePicture]);

  useEffect(() => {
    setSelectedAvatar(profilePicture || '');
    console.log("ProfileEditor updated with profile picture:", profilePicture);
  }, [profilePicture]);

  const handleAvatarChange = (avatar: string) => {
    console.log("Avatar changed to:", avatar);
    setSelectedAvatar(avatar);
  };

  const handleSubmit = async (data: ProfileFormValues) => {
    try {
      console.log("Profile update initiated for user:", userId);
      
      // Check if we have a valid user ID
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      // Only check for Supabase session if localStorage auth is not present and no username
      if (!localStorage.getItem(STORAGE_KEYS.USER_NAME) && 
          localStorage.getItem(STORAGE_KEYS.USER_AUTH) !== 'true') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please log in again.');
        }
      }
      
      console.log('Updating profile with data:', {
        displayName: data.displayName,
        upiId: data.upiId,
        profilePicture: selectedAvatar
      });
      
      // Update local storage
      if (data.displayName !== userName) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, data.displayName);
      }
      
      if (data.upiId !== userUpi) {
        localStorage.setItem('quiz_app_user_upi', data.upiId || '');
      }
      
      // Store profile picture selection if available
      if (selectedAvatar) {
        localStorage.setItem('quiz_app_user_avatar', selectedAvatar);
      }
      
      // Update the profile data in Supabase to sync with admin view
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: data.displayName,
            profile_picture: selectedAvatar,
            upi_id: data.upiId || null
          })
          .eq('id', userId);
        
        if (error) {
          console.error('Error updating profile in Supabase:', error);
          console.log('Continuing with local profile update despite server error');
        }
      } catch (supabaseError) {
        console.error('Caught exception updating profile in Supabase:', supabaseError);
      }
      
      // Call the callback to update parent state
      onProfileUpdate({
        displayName: data.displayName,
        upiId: data.upiId,
        profilePicture: selectedAvatar
      });
      
      // Close the dialog
      setIsOpen(false);
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return {
    isOpen,
    setIsOpen,
    selectedAvatar,
    isSessionValid,
    handleAvatarChange,
    handleSubmit
  };
};
