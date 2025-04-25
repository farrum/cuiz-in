
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
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [suspended, setSuspended] = useState(false);
  
  const isMountedRef = useRef(true);
  
  // Optimized fetch profile function
  const fetchUserProfile = useCallback(async (storedUserId: string) => {
    try {
      // Select only the fields we need in a single query
      const { data, error } = await supabase
        .from('profiles')
        .select('username, suspended, upi_id, profile_picture, display_name')
        .eq('id', storedUserId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data && isMountedRef.current) {
        setUsername(data.display_name || data.username);
        
        // Only set suspended to true if the field is explicitly true
        // This ensures we don't show suspended UI for active accounts
        setSuspended(data.suspended === true);
        console.log("Account suspension status:", data.suspended);
        
        setUserUpi(data.upi_id || '');
        
        if (data.profile_picture) {
          console.log("Profile picture from DB:", data.profile_picture);
          setProfilePicture(data.profile_picture);
          localStorage.setItem('quiz_app_user_avatar', data.profile_picture);
        } else {
          const storedAvatar = localStorage.getItem('quiz_app_user_avatar');
          if (storedAvatar) {
            console.log("Profile picture from localStorage:", storedAvatar);
            setProfilePicture(storedAvatar);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (isMountedRef.current) {
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
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
