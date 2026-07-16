
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
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  ARMORY_ITEMS,
  getUserBalances,
  purchaseItem,
  getPurchasedItems,
  getEquippedItems,
  equipItem,
  unequipItem
} from '@/utils/shopData';

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
  const { toast } = useToast();
  const [gems, setGems] = useState(0);
  const [stars, setStars] = useState(0);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchTreasury = async () => {
      // Fetch local storage fallbacks first
      const { gems: localGems, stars: localStars } = getUserBalances();
      setGems(localGems);
      setStars(localStars);
      setPurchased(getPurchasedItems());
      setEquipped(getEquippedItems());

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

    const handleGemsUpdated = () => {
      fetchTreasury();
    };
    window.addEventListener('gemsUpdated', handleGemsUpdated);
    window.addEventListener('starsUpdated', handleGemsUpdated);
    window.addEventListener('profileUpdated', handleGemsUpdated);
    return () => {
      window.removeEventListener('gemsUpdated', handleGemsUpdated);
      window.removeEventListener('starsUpdated', handleGemsUpdated);
      window.removeEventListener('profileUpdated', handleGemsUpdated);
    };
  }, [userId]);

  const handlePurchase = (itemId: string) => {
    const res = purchaseItem(itemId);
    if (res.success) {
      toast({ title: "Purchase Successful", description: res.message });
    } else {
      toast({ title: "Purchase Failed", description: res.message, variant: "destructive" });
    }
  };

  const handleEquip = (itemId: string) => {
    equipItem(itemId);
    toast({ title: "Item Equipped", description: "Your equipment has been updated." });
  };

  const handleUnequip = (type: string) => {
    unequipItem(type);
    toast({ title: "Item Unequipped", description: "Your equipment has been updated." });
  };

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
      <div className="panel-3d bg-white p-5 shadow-sm border-2 border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="text-left relative z-10">
          <span className="text-[11px] uppercase font-black text-primary tracking-widest block font-serif">Royal Treasury</span>
          <h3 className="text-sm text-slate-500 font-bold mt-1">Kingdom Vault Balances</h3>
        </div>
        <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto justify-between sm:justify-start">
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-inner w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-xl shadow-sm">
              💎
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Gems</span>
              <span className="text-xl font-black text-blue-600 drop-shadow-sm">{gems.toFixed(1)}</span>
            </div>
          </div>
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-2.5 flex items-center gap-3 shadow-inner w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-200 flex items-center justify-center text-xl shadow-sm">
              ⭐
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Stars</span>
              <span className="text-xl font-black text-amber-500 drop-shadow-sm">{stars}</span>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 flex flex-wrap gap-2 bg-transparent p-0 w-full h-auto justify-start">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_0_0_#9a3412] data-[state=active]:translate-y-0 data-[state=active]:border-primary border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <User className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaign" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_0_0_#9a3412] data-[state=active]:translate-y-0 data-[state=active]:border-primary border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <Compass className="w-4 h-4 mr-2" />
            Campaign
          </TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_0_0_#9a3412] data-[state=active]:translate-y-0 data-[state=active]:border-primary border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_0_0_#9a3412] data-[state=active]:translate-y-0 data-[state=active]:border-primary border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="daily-challenges" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-[0_4px_0_0_#c2410c] data-[state=active]:translate-y-0 data-[state=active]:border-orange-500 border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <Flame className="w-4 h-4 mr-2 text-orange-500 data-[state=active]:text-white" />
            Daily Challenges
          </TabsTrigger>
          <TabsTrigger value="armory" className="data-[state=active]:bg-amber-400 data-[state=active]:text-amber-950 data-[state=active]:shadow-[0_4px_0_0_#b45309] data-[state=active]:translate-y-0 data-[state=active]:border-amber-400 border-2 border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl px-5 py-2.5 font-black text-[11px] uppercase tracking-wider transition-all shadow-sm">
            <Award className="w-4 h-4 mr-2 text-yellow-500 data-[state=active]:text-amber-900" />
            Royal Shop
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card className="p-0 bg-transparent border-0 shadow-none">
            <ReferralSection />
          </Card>
        </TabsContent>

        <TabsContent value="campaign">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advisor levels card */}
            <div className="panel-3d bg-white p-6 rounded-3xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
              <h4 className="text-lg font-black text-primary uppercase tracking-widest font-serif mb-5 flex items-center gap-2 drop-shadow-sm">
                <span className="text-2xl drop-shadow">🏛️</span> Advisor Council
              </h4>
              <div className="space-y-4">
                {advisors.map((adv) => (
                  <div key={adv.id} className="bg-slate-50 border-2 border-slate-100 p-3.5 rounded-2xl flex items-center justify-between shadow-inner transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl drop-shadow-sm bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-100">{adv.emoji}</span>
                      <div>
                        <span className="text-sm font-black text-slate-800 block drop-shadow-sm">{adv.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Level {adv.level}/4</span>
                      </div>
                    </div>
                    <div>
                      {adv.level > 0 ? (
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm">
                          Recruited
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-300 shadow-inner">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign map progress card */}
            <div className="panel-3d bg-white p-6 rounded-3xl border-2 border-primary/20 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              <div>
                <h4 className="text-lg font-black text-primary uppercase tracking-widest font-serif mb-2 flex items-center gap-2 drop-shadow-sm">
                  <span className="text-2xl drop-shadow">🗺️</span> Campaign Progress
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6">
                  Advance through regional historic campaigns on the quests map, unlock advisor lifelines, and win battle stars.
                </p>
                <div className="bg-slate-50 border-2 border-slate-100 p-5 rounded-2xl space-y-3 shadow-inner">
                  <div className="flex justify-between text-[11px] font-black text-slate-500">
                    <span className="uppercase tracking-wider">Map Progress</span>
                    <span className="text-amber-500">{stars >= 40 ? '100%' : `${Math.round((stars / 40) * 100)}%`}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden shadow-inner border border-slate-300">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[inset_0_-2px_0_0_rgba(0,0,0,0.2)]" style={{ width: `${Math.min(100, (stars / 40) * 100)}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mt-1">{stars} / 40 Stars to unlock campaigns</span>
                </div>
              </div>
              
              <a href="/empire-quests" className="btn-3d btn-3d-primary w-full text-center py-3.5 rounded-xl font-black uppercase tracking-wider text-sm block mt-6">
                Go to Quest Map
              </a>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="achievements">
          <Card className="p-0 bg-transparent border-0 shadow-none">
            {userId && <BadgesSection userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="p-0 bg-transparent border-0 shadow-none">
            {userId && <RecentlyAnsweredQuestions userId={userId} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="daily-challenges">
          <Card className="p-0 bg-transparent border-0 shadow-none">
            <DailyChallengesHub />
          </Card>
        </TabsContent>

        <TabsContent value="armory">
          <div className="text-center max-w-md mx-auto mb-8 pt-4">
            <h2 className="text-2xl font-black uppercase tracking-widest text-primary font-serif drop-shadow-sm">Royal Armory & Treasury</h2>
            <p className="text-sm font-semibold text-slate-500 mt-2">Acquire virtual enhancements, customize your profile avatar frame, or recruit legendary advisors to assist in battles.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {ARMORY_ITEMS.map((item) => {
              const isShard = item.type === 'counselor_shard';
              const owned = purchased.includes(item.id);
              const isEquipped = equipped[item.type] === item.id;
              
              return (
                <div key={item.id} className="panel-3d bg-white p-6 rounded-3xl flex flex-col justify-between items-center text-center shadow-sm relative group transition-all hover:scale-[1.02] border-2 border-primary/10 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  
                  {isEquipped && (
                    <span className="absolute -top-3 bg-amber-400 text-amber-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse border-2 border-amber-200">
                      Active Equipment
                    </span>
                  )}
                  
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
                    {item.emoji}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between relative z-10">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg tracking-tight mb-2 drop-shadow-sm">{item.name}</h3>
                      <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 shadow-sm mb-3 inline-block">
                        {item.effect}
                      </span>
                      <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-5 min-h-[44px]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="w-full mt-auto pt-3 relative z-10 border-t-2 border-slate-100">
                    {owned && !isShard ? (
                      <div className="flex gap-2 w-full pt-3">
                        {isEquipped ? (
                          <Button 
                            onClick={() => handleUnequip(item.type)}
                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 font-extrabold px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-inner"
                          >
                            Unequip
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleEquip(item.id)}
                            className="w-full btn-3d btn-3d-primary py-2.5 rounded-xl text-xs uppercase tracking-wider"
                          >
                            Equip Item
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-3">
                        <Button 
                          onClick={() => handlePurchase(item.id)}
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold border-2 border-slate-700 px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transform hover:scale-[1.02] transition-transform"
                        >
                          Buy for 
                          {item.costGems > 0 && <span className="text-blue-400">💎 {item.costGems}</span>}
                          {item.costStars > 0 && <span className="text-amber-400">⭐ {item.costStars}</span>}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
