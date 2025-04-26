
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { User, Trophy, History, CreditCard } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import PointsDisplay from '@/components/PointsDisplay';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import WithdrawalSection from '@/components/WithdrawalSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';

interface ProfileTabsProps {
  userId: string | null;
  username: string | null;
  userUpi?: string;
  profilePicture: string;
  forceReloadAds?: number;
  onProfileUpdate?: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
  }) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  userId,
  username,
  userUpi,
  profilePicture,
  onProfileUpdate,
}) => {
  return (
    <div className="space-y-6">
      <ProfileHeader
        username={username}
        profilePicture={profilePicture}
      />
      
      <PointsDisplay animateUpdate className="mb-6" />
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <CreditCard className="w-4 h-4 mr-2" />
            Withdrawals
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="p-6">
            <ReferralSection />
          </Card>
        </TabsContent>
        
        <TabsContent value="achievements">
          <Card className="p-6">
            {userId && <BadgesSection userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-6">
            {userId && <RecentlyAnsweredQuestions userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <Card className="p-6">
            <WithdrawalSection />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
