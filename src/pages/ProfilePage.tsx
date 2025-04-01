
import React, { useState, useEffect } from 'react';
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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [forceReloadAds, setForceReloadAds] = useState(0);
  
  useEffect(() => {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!userId) {
      navigate('/login');
      return;
    }
    
    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, suspended')
          .eq('id', userId)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setUsername(data.username);
          setSuspended(data.suspended);
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
    
    // Refresh ads when ad slots are updated
    const handleAdSlotsUpdated = () => {
      console.log('Ad slots updated, refreshing profile page ads...');
      setForceReloadAds(prev => prev + 1);
    };
    
    window.addEventListener('adSlotsUpdated', handleAdSlotsUpdated);
    return () => window.removeEventListener('adSlotsUpdated', handleAdSlotsUpdated);
  }, [navigate, toast]);
  
  if (suspended) {
    return <SuspendedAccountHandler />;
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
          <ProfileEditor />
        </div>
        
        <AdvertisementBanner 
          key={`profile-middle-${forceReloadAds}`} 
          position="middle" 
          slotId="profile-middle" 
          pageSection="profile-page" 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <BadgesSection />
          <ReferralSection />
        </div>
        
        <WithdrawalSection className="mb-6" />
        
        <RecentlyAnsweredQuestions />
        
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
