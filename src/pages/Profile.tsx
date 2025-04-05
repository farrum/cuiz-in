
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/utils/quizData';
import ProfileEditor from '@/components/ProfileEditor';
import { supabase } from '@/integrations/supabase/client';
import TopPlayersSection from '@/components/TopPlayersSection';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userUpi, setUserUpi] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  
  useEffect(() => {
    const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!storedUserId) {
      navigate('/login');
      return;
    }
    
    setUserId(storedUserId);
    
    const storedUserName = localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
    setUserName(storedUserName);
    
    const storedUserUpi = localStorage.getItem('quiz_app_user_upi') || '';
    setUserUpi(storedUserUpi);
    
    const storedProfilePicture = localStorage.getItem('quiz_app_user_avatar') || '';
    setProfilePicture(storedProfilePicture);
    
    const fetchUserData = async () => {
      if (storedUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, upi_id, profile_picture')
          .eq('id', storedUserId)
          .single();
          
        if (!error && data) {
          setUserName(data.display_name || storedUserName);
          setUserUpi(data.upi_id || storedUserUpi);
          setProfilePicture(data.profile_picture || storedProfilePicture);
        }
      }
    };
    
    fetchUserData();
  }, [navigate]);
  
  const handleProfileUpdate = (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => {
    if (data.displayName) setUserName(data.displayName);
    if (data.upiId !== undefined) setUserUpi(data.upiId);
    if (data.profilePicture) setProfilePicture(data.profilePicture);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 lg:col-span-2 space-y-8">
            <ProfileEditor 
              userName={userName}
              userUpi={userUpi}
              userId={userId || ''}
              profilePicture={profilePicture}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
          
          <div className="col-span-1 space-y-8">
            <TopPlayersSection 
              className="sticky top-24" 
              limit={5} 
              showMonthlyComparison={true}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
