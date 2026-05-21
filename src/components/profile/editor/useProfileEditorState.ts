
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { ProfileFormValues } from './ProfileEditorForm';

interface ProfileEditorStateProps {
  userName: string;
  displayName: string;
  userUpi: string;
  userId: string;
  profilePicture?: string;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  onProfileUpdate: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) => void;
}

export const useProfileEditorState = ({
  userName,
  displayName,
  userUpi,
  userId,
  profilePicture,
  email,
  phone,
  provider = 'email',
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
      setIsSessionValid(true);
      return;
    }
    
    const isLocalAuth = localStorage.getItem(STORAGE_KEYS.USER_AUTH) === 'true';
    if (isLocalAuth) {
      setIsSessionValid(true);
      return;
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSessionValid(true);
      } else {
        setIsSessionValid(false);
      }
    };
    
    checkAuth();
  }, [userId, profilePicture]);

  useEffect(() => {
    setSelectedAvatar(profilePicture || '');
  }, [profilePicture]);

  const handleAvatarChange = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  const handleGoogleSync = async () => {
    try {
      if (!userId) {
        throw new Error('User not identified. Please log in.');
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Could not establish a valid session with Supabase.');
      }

      const user = session.user;
      const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
      const googleEmail = user.email;

      if (!googleAvatar && !googleName) {
        throw new Error('No new profile information was found on your Google Account.');
      }

      console.log('[Google Auth Sync] Manually syncing:', { googleAvatar, googleName, googleEmail });

      const finalAvatar = googleAvatar || selectedAvatar;
      const finalDisplayName = googleName || displayName || userName;
      const finalEmail = googleEmail || email || '';

      // Update database profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_picture: finalAvatar,
          display_name: finalDisplayName,
          email: finalEmail || null,
          provider: 'google'
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Update local storage for avatar and username if applicable
      if (finalAvatar) {
        localStorage.setItem('quiz_app_user_avatar', finalAvatar);
        setSelectedAvatar(finalAvatar);
      }

      // Trigger callback to update parent state
      onProfileUpdate({
        displayName: finalDisplayName,
        profilePicture: finalAvatar,
        email: finalEmail,
      });

      toast({
        title: "Successfully Synced",
        description: "Your profile details have been synced with Google.",
      });
    } catch (err) {
      console.error('[Google Sync Error]', err);
      toast({
        title: "Sync Failed",
        description: err instanceof Error ? err.message : "Failed to sync details from Google.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (data: ProfileFormValues) => {
    try {
      console.log("Profile update initiated for user:", userId);
      
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      // Ensure session is still active
      if (!localStorage.getItem(STORAGE_KEYS.USER_NAME) && 
          localStorage.getItem(STORAGE_KEYS.USER_AUTH) !== 'true') {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session found. Please log in again.');
        }
      }

      // 1. Username Handle Uniqueness Verification (if changed)
      if (data.username !== userName) {
        const cleanUsername = data.username.trim();
        const handleRegex = /^[a-zA-Z0-9_]+$/;
        if (!handleRegex.test(cleanUsername)) {
          throw new Error('Username handles can only contain letters, numbers, and underscores.');
        }

        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (checkError) {
          console.error('Error verifying username handle uniqueness:', checkError);
        }

        if (existingUser && existingUser.id !== userId) {
          throw new Error('This username handle is already taken. Please choose another.');
        }
      }

      // 2. Auth Credentials Updates (Email & Password, only for standard email users)
      if (provider === 'email') {
        // Email update
        if (data.email && data.email !== email) {
          const { error: emailUpdateError } = await supabase.auth.updateUser({ email: data.email });
          if (emailUpdateError) {
            throw new Error(`Email update failed: ${emailUpdateError.message}`);
          }
        }

        // Password update
        if (data.newPassword) {
          if (data.newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long.');
          }
          if (data.newPassword !== data.confirmPassword) {
            throw new Error('New password and password confirmation do not match.');
          }

          const { error: passwordUpdateError } = await supabase.auth.updateUser({ password: data.newPassword });
          if (passwordUpdateError) {
            throw new Error(`Password update failed: ${passwordUpdateError.message}`);
          }
        }
      }

      console.log('Updating profile database row:', {
        displayName: data.displayName,
        username: data.username,
        upiId: data.upiId,
        profilePicture: selectedAvatar,
        email: data.email,
        phone: data.phone
      });
      
      // 3. Update Database Profile Table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          display_name: data.displayName,
          username: data.username,
          upi_id: data.upiId || null,
          profile_picture: selectedAvatar,
          email: data.email || null,
          phone: data.phone || null
        })
        .eq('id', userId);
      
      if (dbError) {
        throw new Error(`Database profile update failed: ${dbError.message}`);
      }
      
      // 4. Update local storage values to reflect changes instantly across tabs/pages
      localStorage.setItem(STORAGE_KEYS.USER_NAME, data.username);
      localStorage.setItem('quiz_app_user_upi', data.upiId || '');
      if (selectedAvatar) {
        localStorage.setItem('quiz_app_user_avatar', selectedAvatar);
      }
      
      // 5. Invoke parent callback
      onProfileUpdate({
        displayName: data.displayName,
        username: data.username,
        upiId: data.upiId,
        profilePicture: selectedAvatar,
        email: data.email,
        phone: data.phone
      });
      
      // Close the modal and show success notification
      setIsOpen(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile details have been successfully saved."
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
    handleGoogleSync,
    handleSubmit
  };
};
