
import React from 'react';
import { useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileLayout from '@/components/profile/ProfileLayout';
import ProfileContent from '@/components/profile/ProfileContent';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

const Profile: React.FC = () => {
  const { userId } = useParams();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 container max-w-6xl py-10 px-4">
        <SimpleAdBanner position="header" className="mb-6" />
        
        <ProfileLayout>
          <ProfileContent userId={userId} />
        </ProfileLayout>
        
        <SimpleAdBanner position="footer" className="mt-8" />
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
