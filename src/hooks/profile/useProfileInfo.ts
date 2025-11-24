
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { setUserContext } from '@/utils/authContext';

export const useProfileInfo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [suspended, setSuspended] = useState(false);
  
  const isMountedRef = useRef(true);
  
  // Optimized fetch profile function
  const fetchUserProfile = useCallback(async (storedUserId: string) => {
    try {
      // Set user context for RLS policies
      await setUserContext(storedUserId);
      
      // Select only the fields we need in a single query
      const { data, error } = await supabase
        .from('profiles')
        .select('username, suspended, upi_id, profile_picture, display_name')
        .eq('id', storedUserId)
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching profile:', error);
        // Don't show error toast, fall back to localStorage
      }
      
      if (data && isMountedRef.current) {
        setUsername(data.display_name || data.username);
        setSuspended(data.suspended === true);
        setUserUpi(data.upi_id || '');
        
        if (data.profile_picture) {
          setProfilePicture(data.profile_picture);
          localStorage.setItem('quiz_app_user_avatar', data.profile_picture);
        } else {
          const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
          if (storedAvatar) {
            setProfilePicture(storedAvatar);
          }
        }
      } else if (isMountedRef.current) {
        // No profile found - fall back to localStorage for legacy users
        const storedUsername = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
        
        if (storedUsername) {
          setUsername(storedUsername);
        }
        if (storedAvatar) {
          setProfilePicture(storedAvatar);
        }
        
        // Assume not suspended if no profile data
        setSuspended(false);
      }
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      // Fall back to localStorage
      if (isMountedRef.current) {
        const storedUsername = localStorage.getItem(STORAGE_KEYS.USER_NAME);
        const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
        
        if (storedUsername) {
          setUsername(storedUsername);
        }
        if (storedAvatar) {
          setProfilePicture(storedAvatar);
        }
        setSuspended(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [toast]);
  
  // Load user profile data
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
  }) => {
    if (data.displayName) {
      setUsername(data.displayName);
    }
    
    if (data.upiId !== undefined) {
      setUserUpi(data.upiId);
    }
    
    if (data.profilePicture !== undefined) {
      console.log("Profile picture updated:", data.profilePicture);
      setProfilePicture(data.profilePicture);
    }
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
    userUpi,
    userId,
    profilePicture,
    suspended,
    handleProfileUpdate,
    handleReactivated,
  };
};
