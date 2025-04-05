
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileEditor from '@/components/ProfileEditor';
import BadgesSection from '@/components/BadgesSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import TopPlayersSection from '@/components/TopPlayersSection';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userUpi, setUserUpi] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const storedUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME);
    
    if (!storedUserId || !storedUserName) {
      navigate('/login');
      return;
    }
    
    setUserId(storedUserId);
    setUserName(storedUserName);
    setIsAuthenticated(true);
    
    // Fetch profile data
    fetchProfileData(storedUserId);
  }, [navigate]);
  
  const fetchProfileData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture, upi_id')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching profile data:', error);
        return;
      }
      
      if (data) {
        setProfilePicture(data.profile_picture);
        setUserUpi(data.upi_id);
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
  };
  
  const handleProfileUpdate = async (updates: { userName?: string; userUpi?: string; profilePicture?: string }) => {
    try {
      if (!userId) return;
      
      const updateData: any = {};
      
      if (updates.userName) {
        updateData.display_name = updates.userName;
        setUserName(updates.userName);
        localStorage.setItem(STORAGE_KEYS.USER_NAME, updates.userName);
      }
      
      if (updates.userUpi) {
        updateData.upi_id = updates.userUpi;
        setUserUpi(updates.userUpi);
      }
      
      if (updates.profilePicture) {
        updateData.profile_picture = updates.profilePicture;
        setProfilePicture(updates.profilePicture);
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Update Failed",
          description: "Unable to update your profile information",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated",
      });
      
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login page
  }

  return (
    <>
      <Header />
      
      <main className="container mx-auto px-4 py-24 md:py-32 max-w-5xl">
        <h1 className="text-4xl font-extrabold mb-12">Your Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            <ProfileEditor 
              userName={userName || ''}
              userUpi={userUpi || ''}
              userId={userId || ''}
              profilePicture={profilePicture || ''}
              onProfileUpdate={handleProfileUpdate}
            />
            
            <BadgesSection userId={userId || ''} />
            
            <WithdrawalSection userId={userId || ''} />
          </div>
          
          {/* Right Column */}
          <div className="space-y-8">
            <TopPlayersSection />
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default Profile;
