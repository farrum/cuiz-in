
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileEditor from '@/components/ProfileEditor';
import PointsDisplay from '@/components/PointsDisplay';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import RecentlyAnsweredQuestions from '@/components/RecentlyAnsweredQuestions';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import AccountReactivation from '@/components/AccountReactivation';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SuspendedAccountHandler from '@/components/SuspendedAccountHandler';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRound } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [suspended, setSuspended] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const { isAuthenticated, userRole } = useAuthCheck();
  
  // Refs to prevent multiple refreshes
  const adSlotsLoadedRef = useRef(false);
  const adRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track component mount state
  const isMountedRef = useRef(true);
  // Last ad refresh timestamp to prevent too frequent reloads
  const lastAdRefreshRef = useRef(0);
  
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
          // Set username from display_name if available, otherwise use username
          setUsername(data.display_name || data.username);
          setSuspended(data.suspended);
          setUserUpi(data.upi_id || '');
          
          // Set profile picture
          if (data.profile_picture) {
            console.log("Profile picture from DB:", data.profile_picture);
            setProfilePicture(data.profile_picture);
            // Also store in localStorage for consistency
            localStorage.setItem('quiz_app_user_avatar', data.profile_picture);
          } else {
            // Check localStorage as fallback
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
    
    // Create a debounced handler for ad slot updates that respects minimum interval
    const handleAdSlotsUpdated = () => {
      if (!isMountedRef.current) return;
      
      console.log('Ad slots updated event received in profile page');
      
      // Clear any existing timeout
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
      
      // Respect minimum refresh interval (5 seconds)
      const now = Date.now();
      const timeSinceLastRefresh = now - lastAdRefreshRef.current;
      
      if (timeSinceLastRefresh < 5000) {
        console.log(`Throttling ad refresh, last refresh was ${timeSinceLastRefresh}ms ago`);
        
        // Schedule refresh after delay to ensure proper interval
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
      
      // Set a new timeout to refresh ads with small delay for batching
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
  }, [navigate, toast]);
  
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
  
  // Force reload ads from server only if they haven't been loaded already
  useEffect(() => {
    // Avoid multiple initial ad loads
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
          
          // Force reload of ads only once
          setForceReloadAds(1);
          adSlotsLoadedRef.current = true;
          lastAdRefreshRef.current = Date.now();
          
          // Dispatch a custom event with the specific slots that were updated
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
  
  // Helper function to render profile avatar based on its type
  const renderProfileAvatar = () => {
    console.log("Rendering profile avatar with:", profilePicture);
    
    if (profilePicture) {
      if (profilePicture.startsWith('http')) {
        // URL-based avatar (from image upload)
        return (
          <Avatar className="w-20 h-20 border-4 border-primary/10">
            <AvatarImage src={profilePicture} alt={username || 'User'} />
            <AvatarFallback className="bg-primary/10 text-xl font-semibold">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        );
      } else {
        // Default avatars like 'smile', 'robot', etc.
        // These could be icons or emoji representations
        switch (profilePicture) {
          case 'user-round':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10">
                  <UserRound className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
            );
          case 'smile':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  😊
                </AvatarFallback>
              </Avatar>
            );
          case 'robot':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🤖
                </AvatarFallback>
              </Avatar>
            );
          case 'graduation-cap':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🎓
                </AvatarFallback>
              </Avatar>
            );
          case 'award':
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-3xl">
                  🏆
                </AvatarFallback>
              </Avatar>
            );
          default:
            // If the stored value doesn't match known types, show initial
            return (
              <Avatar className="w-20 h-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
                  {username ? username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            );
        }
      }
    }
    
    // Fallback if no profile picture is set
    return (
      <Avatar className="w-20 h-20 border-4 border-primary/10">
        <AvatarFallback className="bg-primary/10 text-2xl font-semibold">
          {username ? username.charAt(0).toUpperCase() : 'U'}
        </AvatarFallback>
      </Avatar>
    );
  };
  
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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4">
        <AdvertisementBanner 
          key={`profile-top-${forceReloadAds}`} 
          position="top" 
          slotId="profile-top" 
          pageSection="profile-page" 
        />
        
        <PointsDisplay animateUpdate className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          <AccountReactivation />
          <div className="glass p-6 rounded-xl shadow-md flex items-center gap-4">
            {renderProfileAvatar()}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold">{username || 'User'}</h2>
                <ProfileEditor 
                  userName={username || ''}
                  userUpi={userUpi}
                  userId={userId || ''}
                  profilePicture={profilePicture}
                  onProfileUpdate={handleProfileUpdate}
                />
              </div>
              {userUpi && (
                <p className="text-sm text-muted-foreground">
                  UPI ID: {userUpi}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <AdvertisementBanner 
          key={`profile-middle-${forceReloadAds}`} 
          position="middle" 
          slotId="profile-middle" 
          pageSection="profile-page" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {userId && <BadgesSection userId={userId} />}
          <ReferralSection />
        </div>
        
        <WithdrawalSection />
        
        {userId && <RecentlyAnsweredQuestions userId={userId} />}
        
        <AdvertisementBanner 
          key={`profile-bottom-${forceReloadAds}`} 
          position="bottom" 
          slotId="profile-bottom" 
          pageSection="profile-page" 
        />
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
