
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

export const useProfileInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [suspended, setSuspended] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>('email');
  
  const isMountedRef = useRef(true);
  
  const fetchUserProfile = useCallback(async (storedUserId: string) => {
    try {
      // Get the current Supabase session to access Google user_metadata if applicable
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, suspended, upi_id, profile_picture, display_name, email, phone, provider')
        .eq('id', storedUserId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching profile:', error);
      }
      
      if (data && isMountedRef.current) {
        let finalProfilePicture = data.profile_picture || '';
        let finalDisplayName = data.display_name || '';
        let finalEmail = data.email || '';
        let finalPhone = data.phone || '';
        let finalProvider = data.provider || 'email';
        
        // Auto-sync Google credentials if they are missing from the profile
        if (user && (user.app_metadata?.provider === 'google' || finalProvider === 'google')) {
          let needsDbUpdate = false;
          const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name;
          
          if (!finalProfilePicture && googleAvatar) {
            finalProfilePicture = googleAvatar;
            needsDbUpdate = true;
            console.log('[Google Auth Sync] Automatically syncing avatar url from Google:', googleAvatar);
          }
          if ((!data.display_name || data.display_name === data.username) && googleName) {
            finalDisplayName = googleName;
            needsDbUpdate = true;
            console.log('[Google Auth Sync] Automatically syncing full name from Google:', googleName);
          }
          if (!data.email && user.email) {
            finalEmail = user.email;
            needsDbUpdate = true;
          }
          if (!data.provider || data.provider !== 'google') {
            finalProvider = 'google';
            needsDbUpdate = true;
          }
          
          if (needsDbUpdate) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                profile_picture: finalProfilePicture,
                display_name: finalDisplayName,
                email: finalEmail,
                provider: 'google'
              })
              .eq('id', storedUserId);
              
            if (updateError) {
              console.error('[Google Auth Sync] Error updating synced fields in db:', updateError);
            } else {
              console.log('[Google Auth Sync] Profile synced with Google details successfully.');
            }
          }
        }

        setUsername(data.username);
        setDisplayName(finalDisplayName || data.display_name || data.username);
        setSuspended(data.suspended === true);
        setUserUpi(data.upi_id || '');
        setEmail(finalEmail || data.email || user?.email || null);
        setPhone(finalPhone || data.phone || user?.phone || null);
        setProvider(finalProvider);
        
        if (finalProfilePicture) {
          setProfilePicture(finalProfilePicture);
          localStorage.setItem('quiz_app_user_avatar', finalProfilePicture);
        } else {
          const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
          if (storedAvatar) {
            setProfilePicture(storedAvatar);
          }
        }
      } else if (isMountedRef.current) {
        const storedUsername = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
        if (storedUsername) {
          setUsername(storedUsername);
          setDisplayName(storedUsername);
        }
        if (storedAvatar) setProfilePicture(storedAvatar);
        setSuspended(false);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      if (isMountedRef.current) {
        const storedUsername = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
        if (storedUsername) {
          setUsername(storedUsername);
          setDisplayName(storedUsername);
        }
        if (storedAvatar) setProfilePicture(storedAvatar);
        setSuspended(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    
    setUserId(storedUserId);
    fetchUserProfile(storedUserId);
    
    return () => {
      isMountedRef.current = false;
    };
  }, [navigate, fetchUserProfile]);
  
  const handleProfileUpdate = useCallback((data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) => {
    if (data.displayName) setDisplayName(data.displayName);
    if (data.username) {
      setUsername(data.username);
      localStorage.setItem(STORAGE_KEYS.USER_NAME, data.username);
    }
    if (data.upiId !== undefined) setUserUpi(data.upiId);
    if (data.profilePicture !== undefined) {
      console.log("Profile picture updated:", data.profilePicture);
      setProfilePicture(data.profilePicture);
    }
    if (data.email !== undefined) setEmail(data.email || null);
    if (data.phone !== undefined) setPhone(data.phone || null);
  }, []);
  
  const handleReactivated = useCallback(() => {
    setSuspended(false);
    toast({
      title: "Account Reactivated",
      description: "Your account has been successfully reactivated."
    });
  }, [toast]);
  
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
    handleProfileUpdate,
    handleReactivated,
  };
};
