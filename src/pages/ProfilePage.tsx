
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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  const { isAuthenticated, userRole } = useAuthCheck();
  
  // Refs to prevent multiple refreshes
  const adSlotsLoadedRef = useRef(false);
  const adRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
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
          .select('username, suspended, upi_id')
          .eq('id', storedUserId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setUsername(data.username);
          setSuspended(data.suspended);
          setUserUpi(data.upi_id || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // Debounced refresh for ad slots updates
    const handleAdSlotsUpdated = () => {
      console.log('Ad slots updated event received in profile page');
      
      // Clear any existing timeout
      if (adRefreshTimeoutRef.current) {
        clearTimeout(adRefreshTimeoutRef.current);
      }
      
      // Set a new timeout to refresh ads
      adRefreshTimeoutRef.current = setTimeout(() => {
        console.log('Refreshing profile page ads after debounce...');
        setForceReloadAds(prev => prev + 1);
        adRefreshTimeoutRef.current = null;
      }, 500);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    
    return () => {
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
    if (adSlotsLoadedRef.current) return;
    
    const syncAdSlots = async () => {
      try {
        console.log('Syncing ad slots from server for profile page...');
        const { data: adSlots, error } = await supabase
          .from('ad_slots')
          .select('*')
          .eq('active', true);
          
        if (!error && adSlots) {
          console.log(`Successfully loaded ${adSlots.length} ad slots for profile page`);
          localStorage.setItem('quiz_app_ad_slots', JSON.stringify(adSlots));
          
          // Force reload of ads only once
          setForceReloadAds(1);
          adSlotsLoadedRef.current = true;
          
          // Dispatch a custom event with the specific slots that were updated
          window.dispatchEvent(new CustomEvent('adSlotsUpdated', { detail: adSlots }));
        } else {
          console.error('Error fetching ad slots for profile page:', error);
        }
      } catch (err) {
        console.error('Error syncing ad slots for profile page:', err);
      }
    };
    
    syncAdSlots();
  }, []);
  
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
          <ProfileEditor 
            userName={username || ''}
            userUpi={userUpi}
            userId={userId || ''}
            onProfileUpdate={handleProfileUpdate}
          />
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
