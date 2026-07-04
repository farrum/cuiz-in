
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { User, Trophy, History, Star, ShieldAlert, Award, Compass, Play } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';
import { AvatarEvolution } from '@/components/gamification/AvatarEvolution';
import { ModularAvatar } from '@/components/gamification/ModularAvatar';
import { SkillTreeContainer } from '@/components/gamification/SkillTreeContainer';
import { DailyChallengesHub } from '@/components/gamification/DailyChallengesHub';
import { Palette, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const [gems, setGems] = useState(0);
  const [stars, setStars] = useState(0);
  const [advisors, setAdvisors] = useState<any[]>([]);

  useEffect(() => {
    const fetchTreasury = async () => {
      // Fetch local storage fallbacks first
      const localGems = Number(localStorage.getItem('quiz_app_user_gems') || '0');
      const localStars = Number(localStorage.getItem('quiz_app_user_stars') || '0');
      setGems(localGems);
      setStars(localStars);

      const localSocratesLevel = Number(localStorage.getItem('hero_socrates_level') || '0');
      const localAryabhataLevel = Number(localStorage.getItem('hero_aryabhata_level') || '0');
      const localChanakyaLevel = Number(localStorage.getItem('hero_chanakya_level') || '0');
      const localRamanujanLevel = Number(localStorage.getItem('hero_ramanujan_level') || '0');
      
      setAdvisors([
        { id: 'socrates', name: 'Socrates', level: localSocratesLevel, emoji: '🏛️' },
        { id: 'aryabhata', name: 'Aryabhata', level: localAryabhataLevel, emoji: '📐' },
        { id: 'chanakya', name: 'Chanakya', level: localChanakyaLevel, emoji: '📜' },
        { id: 'ramanujan', name: 'Ramanujan', level: localRamanujanLevel, emoji: '🧠' }
      ]);

      if (userId) {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('gems:points, stars')
          .eq('id', userId)
          .maybeSingle();
        if (data) {
          setGems(data.gems || 0);
          setStars(data.stars || 0);
        }

        // Fetch advisor levels from DB
        const { data: dbChars } = await (supabase as any)
          .from('user_characters')
          .select('*')
          .eq('user_id', userId);
        if (dbChars && dbChars.length > 0) {
          const dbMap = new Map(dbChars.map((c: any) => [c.character_id, c.level]));
          setAdvisors([
            { id: 'socrates', name: 'Socrates', level: dbMap.get('socrates') || 0, emoji: '🏛️' },
            { id: 'aryabhata', name: 'Aryabhata', level: dbMap.get('aryabhata') || 0, emoji: '📐' },
            { id: 'chanakya', name: 'Chanakya', level: dbMap.get('chanakya') || 0, emoji: '📜' },
            { id: 'ramanujan', name: 'Ramanujan', level: dbMap.get('ramanujan') || 0, emoji: '🧠' }
          ]);
        }
      }
    };

    fetchTreasury();
  }, [userId]);

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
      
      {/* Royal Treasury Widget */}
      <div className="wooden-door p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="text-left">
          <span className="text-[10px] uppercase font-black text-amber-500/60 tracking-widest block font-serif">Royal Treasury</span>
          <h3 className="text-sm text-stone-400 font-bold mt-0.5">Kingdom Vault Balances</h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              💎
            </div>
            <div>
              <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider text-[9px]">Gems</span>
              <span className="text-lg font-black text-white">{gems.toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-stone-950/80 border border-stone-800 rounded-2xl px-5 py-2.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
              ⭐
            </div>
            <div>
              <span className="text-xs font-bold text-stone-400 block uppercase tracking-wider text-[9px]">Campaign Stars</span>
              <span className="text-lg font-black text-yellow-500">{stars}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 flex flex-wrap gap-1 bg-stone-950/50 border border-stone-900 p-1 rounded-2xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 text-stone-400 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all">
            <User className="w-3.5 h-3.5 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaign" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 text-stone-400 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all">
            <Compass className="w-3.5 h-3.5 mr-2" />
            Campaign
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 text-stone-400 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all">
            <Trophy className="w-3.5 h-3.5 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 text-stone-400 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all">
            <History className="w-3.5 h-3.5 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="daily-challenges" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 text-stone-400 rounded-xl px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all">
            <Flame className="w-3.5 h-3.5 mr-2 text-orange-500" />
            Daily Challenges
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="p-6 bg-stone-950/40 border-stone-850 text-stone-100 rounded-2xl">
            <ReferralSection />
          </Card>
        </TabsContent>

        <TabsContent value="campaign">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advisor levels card */}
            <div className="wooden-door p-5 shadow-lg">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif mb-4 flex items-center gap-2">
                🏛️ Advisor Council
              </h4>
              <div className="space-y-3">
                {advisors.map((adv) => (
                  <div key={adv.id} className="bg-stone-950/60 border border-stone-800 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{adv.emoji}</span>
                      <div>
                        <span className="text-xs font-black text-stone-200 block">{adv.name}</span>
                        <span className="text-[10px] text-stone-500 block uppercase tracking-wider">Level {adv.level}/4</span>
                      </div>
                    </div>
                    <div>
                      {adv.level > 0 ? (
                        <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          Recruited
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-stone-500 bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign map progress card */}
            <div className="wooden-door p-5 shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-serif mb-2 flex items-center gap-2">
                  🗺️ Campaign Progress
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed mb-4">
                  Advance through regional historic campaigns on the quests map, unlock advisor lifelines, and win battle stars.
                </p>
                <div className="bg-stone-950/60 border border-stone-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-stone-400">
                    <span>QUEST MAP PROGRESS</span>
                    <span className="text-amber-500">{stars >= 40 ? '100%' : `${Math.round((stars / 40) * 100)}%`}</span>
                  </div>
                  <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (stars / 40) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-stone-500 block uppercase tracking-wider mt-1">{stars} / 40 Stars to unlock campaigns</span>
                </div>
              </div>
              
              <a href="/empire-quests" className="medieval-btn text-stone-950 text-center py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs block mt-4 hover:scale-105 active:scale-95 transition-transform">
                Go to Quest Map
              </a>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <Card className="p-6 bg-stone-950/40 border-stone-850 text-stone-100 rounded-2xl">
            {userId && <BadgesSection userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-6 bg-stone-950/40 border-stone-850 text-stone-100 rounded-2xl">
            {userId && <RecentlyAnsweredQuestions userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="daily-challenges">
          <Card className="p-6 bg-stone-950/40 border-stone-850 text-stone-100 rounded-2xl">
            <DailyChallengesHub />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
