
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';

export const useProfileData = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [suspended, setSuspended] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  
  const adSlotsLoadedRef = useRef(false);
  const adRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastAdRefreshRef = useRef(0);
  
  // Load user profile data
  useEffect(() => {
    isMountedRef.current = true;
    
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    
    setUserId(storedUserId);
    
    const fetchUserProfile = async () => {
      try {
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
          setSuspended(data.suspended);
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
    };
    
    fetchUserProfile();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [navigate, toast]);
  
  // Handle ad slot updates
  useEffect(() => {
    const handleAdSlotsUpdated = () => {
      if (!isMountedRef.current) return;
      
      console.log('Ad slots updated event received in profile page');
      
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
      
      const now = Date.now();
      const timeSinceLastRefresh = now - lastAdRefreshRef.current;
      
      if (timeSinceLastRefresh < 5000) {
        console.log(`Throttling ad refresh, last refresh was ${timeSinceLastRefresh}ms ago`);
        
        adRefreshTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            console.log('Refreshing profile page ads after throttle delay...');
            lastAdRefreshRef.current = Date.now();
            setForceReloadAds(prev => prev + 1);
          }
          adRefreshTimeoutRef.current = null;
        }, 5000 - timeSinceLastRefresh);
        
        return;
      }
      
      adRefreshTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.log('Refreshing profile page ads after debounce...');
          lastAdRefreshRef.current = Date.now();
          setForceReloadAds(prev => prev + 1);
        }
        adRefreshTimeoutRef.current = null;
      }, 300);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
    };
  }, []);
  
  // Sync ad slots from server
  useEffect(() => {
    if (adSlotsLoadedRef.current || !isMountedRef.current) return;
    
    const syncAdSlots = async () => {
      try {
        console.log('Syncing ad slots from server for profile page...');
        const { data: adSlots, error } = await supabase
          .from('ad_slots')
          .select('*')
          .eq('active', true);
          
        if (!error && adSlots && isMountedRef.current) {
          console.log(`Successfully loaded ${adSlots.length} ad slots for profile page`);
          localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
          
          setForceReloadAds(1);
          adSlotsLoadedRef.current = true;
          lastAdRefreshRef.current = Date.now();
          
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { 
            detail: { source: 'profilePage', slots: adSlots }
          }));
        } else if (isMountedRef.current) {
          console.error('Error fetching ad slots for profile page:', error);
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error('Error syncing ad slots for profile page:', err);
        }
      }
    };
    
    syncAdSlots();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleProfileUpdate = (data: {
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
  };
  
  const handleReactivated = () => {
    setSuspended(false);
    toast({
      title: "Account Reactivated",
      description: "Your account has been successfully reactivated."
    });
  };
  
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
