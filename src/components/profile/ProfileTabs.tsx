
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { User, Trophy, History } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import GemsDisplay from '@/components/GemsDisplay';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';
import { AvatarEvolution } from '@/components/gamification/AvatarEvolution';
import { ModularAvatar } from '@/components/gamification/ModularAvatar';
import { SkillTreeContainer } from '@/components/gamification/SkillTreeContainer';
import { DailyChallengesHub } from '@/components/gamification/DailyChallengesHub';
import { Palette, Flame } from 'lucide-react';

interface ProfileTabsProps {
  userId: string | null;
  username: string | null;
  displayName: string | null;
  userUpi?: string;
  profilePicture: string;
  email?: string | null;
  phone?: string | null;
  provider?: string;
  forceReloadAds?: number;
  onProfileUpdate?: (data: {
    displayName?: string;
    upiId?: string;
    profilePicture?: string;
    email?: string;
    phone?: string;
    username?: string;
  }) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  userId,
  username,
  displayName,
  userUpi,
  profilePicture,
  email,
  phone,
  provider,
  onProfileUpdate,
}) => {
  return (
    <div className="space-y-6">
      <ProfileHeader
        username={username}
        displayName={displayName}
        profilePicture={profilePicture}
        userId={userId}
        userUpi={userUpi}
        email={email}
        phone={phone}
        provider={provider}
        onProfileUpdate={onProfileUpdate}
      />
      
      <GemsDisplay animateUpdate className="mb-6" />
      
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
          <TabsTrigger value="avatar-skills">
            <Palette className="w-4 h-4 mr-2" />
            Avatar & Skills
          </TabsTrigger>
          <TabsTrigger value="daily-challenges">
            <Flame className="w-4 h-4 mr-2 text-orange-500" />
            Daily Challenges
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
        
        <TabsContent value="avatar-skills">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 flex flex-col gap-6">
              <AvatarEvolution currentLevel={3} currentXP={450} xpToNextLevel={1000} />
              
              <Card className="p-4 flex flex-col items-center">
                <h3 className="font-bold text-sm text-slate-500 mb-4">Your Custom Avatar</h3>
                <ModularAvatar 
                  config={{
                    baseColor: '#fcd34d',
                    eyes: 'cool',
                    mouth: 'smirk',
                    headwear: 'cap',
                    accessory: 'glasses'
                  }} 
                  size={140}
                />
                <p className="text-xs text-center mt-4 text-slate-400">Unlock more styles via the Skill Tree and Shop coming soon!</p>
              </Card>
            </div>
            <div className="col-span-1 lg:col-span-2">
              {userId ? (
                <SkillTreeContainer userId={userId} />
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl">Sign in to view your Skill Tree</div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="daily-challenges">
          <Card className="p-6">
            <DailyChallengesHub />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
