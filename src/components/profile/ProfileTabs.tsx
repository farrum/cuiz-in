
import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { User, Users, Trophy, History, Star, ShieldAlert, Award, Compass, Play } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import BadgesSection from '@/components/BadgesSection';
import ReferralSection from '@/components/ReferralSection';
import RecentlyAnsweredQuestions from '@/components/quiz-history';
import { AvatarEvolution } from '@/components/gamification/AvatarEvolution';
import { ModularAvatar } from '@/components/gamification/ModularAvatar';
import { SkillTreeContainer } from '@/components/gamification/SkillTreeContainer';
import { DailyChallengesHub } from '@/components/gamification/DailyChallengesHub';
import { Palette, Flame, HelpCircle, CheckCircle2, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  ARMORY_ITEMS,
  getUserBalances,
  purchaseItem,
  getPurchasedItems,
  getEquippedItems,
  getEquippedTitle,
  equipItem,
  unequipItem
} from '@/utils/shopData';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { useMoodEngine } from '@/mobile/mascots/useMoodEngine';
import { moodFromAccuracy, characterOfTheDay } from '@/mobile/mascots/registry';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const { streak, questionsAnswered } = usePersistentQuizStats();
  const { accuracy, sample } = useMoodEngine();
  const mirrorMood = moodFromAccuracy(accuracy, sample);

  const [gems, setGems] = useState(0);
  const [stars, setStars] = useState(0);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [purchased, setPurchased] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [equippedTitleId, setEquippedTitleId] = useState('');

  const [dailyGems, setDailyGems] = useState(0);
  const [monthlyGems, setMonthlyGems] = useState(0);
  const [dayAttempted, setDayAttempted] = useState(0);
  const [dayCorrect, setDayCorrect] = useState(0);
  const [monthAttempted, setMonthAttempted] = useState(0);
  const [monthCorrect, setMonthCorrect] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  
  const [teamName, setTeamName] = useState<string | null>(null);
  const [squadSize, setSquadSize] = useState(0);
  const [userRole, setUserRole] = useState('infantry');

  useEffect(() => {
    const fetchTreasury = async () => {
      // Fetch local storage fallbacks first
      const { gems: localGems, stars: localStars } = getUserBalances();
      setGems(localGems);
      setStars(localStars);
      setPurchased(getPurchasedItems());
      setEquipped(getEquippedItems());
      setEquippedTitleId(getEquippedTitle());

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

      const roleKey = localStorage.getItem('quiz_app_user_role') || 'infantry';
      setUserRole(roleKey);

      if (userId) {
        const today      = new Date().toISOString().slice(0, 10);
        const month      = new Date().toISOString().slice(0, 7);
        const dayStart   = `${today}T00:00:00.000Z`;
        const monthStart = `${month}-01T00:00:00.000Z`;

        const [p, r, d, m, dAtt, dCorr, mAtt, mCorr, allAtt, allCorr] = await Promise.all([
          supabase.from('profiles').select('username, points, display_name, email, phone, upi_id, profile_picture, date_of_birth, stars').eq('id', userId).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
          supabase.from('daily_points').select('points').eq('user_id', userId).eq('date', today).maybeSingle(),
          supabase.from('monthly_points').select('points').eq('user_id', userId).eq('month', month).maybeSingle(),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('answered_at', dayStart),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('correct', true).gte('answered_at', dayStart),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('answered_at', monthStart),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('correct', true).gte('answered_at', monthStart),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
          supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('correct', true),
        ]);

        const pd = p.data as any;
        if (pd) {
          setGems(Number(pd.points ?? 0));
          setStars(Number(pd.stars ?? 0));
        }

        let userRoleFetched = 'infantry';
        const rd = r.data as any;
        if (rd?.role) {
          userRoleFetched = rd.role;
        } else {
          // Fall back to rpc get_user_rank if user_roles returns empty due to hydration/RLS
          const { data: rpcRole } = await supabase.rpc('get_user_rank' as any, {
            p_user_id: userId,
          });
          if (rpcRole) userRoleFetched = String(rpcRole);
        }
        setUserRole(userRoleFetched);
        localStorage.setItem('quiz_app_user_role', userRoleFetched);

        if (d.data) setDailyGems(Number((d.data as any).points ?? 0));
        if (m.data) setMonthlyGems(Number((m.data as any).points ?? 0));

        setDayAttempted(dAtt.count ?? 0);
        setDayCorrect(dCorr.count ?? 0);
        setMonthAttempted(mAtt.count ?? 0);
        setMonthCorrect(mCorr.count ?? 0);
        setTotalAttempted(allAtt.count ?? 0);
        setTotalCorrect(allCorr.count ?? 0);

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

        // Fetch team / squad details (leader of this user)
        const { data: myReferral } = await supabase
          .from('user_referrals')
          .select('referrer_id, referrer_name')
          .eq('referred_id', userId)
          .maybeSingle();

        if (myReferral?.referrer_id) {
          const { data: refProfile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', myReferral.referrer_id)
            .maybeSingle();
          setTeamName(
            refProfile?.display_name || refProfile?.username || myReferral.referrer_name || 'Baron Squad'
          );
        }

        // Fetch squad size
        const { count } = await supabase
          .from('user_referrals')
          .select('id', { count: 'exact', head: true })
          .eq('referrer_id', userId);
        setSquadSize(count || 0);
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

  const mirrorMessage: Record<string, string> = {
    excited: "You're crushing it — keep going!",
    cheer:   "Solid run. One more quest?",
    neutral: 'Steady. Play a quick round to warm up.',
    sad:     'Tough patch. Win one to cheer me up?',
    align:   'Comeback is real! Keep going!',
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
        userRole={userRole}
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

      {/* ── Stats Grid ── */}
      <div className="space-y-4">
        {/* Row 1: gems + attempted */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-violet-400/10 pointer-events-none" />
            <Play className="w-5 h-5 mb-2 text-violet-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Gems Today</span>
            <span className="font-black text-xl text-slate-800">{dailyGems.toFixed(1)} 💎</span>
          </div>
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-amber-400/10 pointer-events-none" />
            <Trophy className="w-5 h-5 mb-2 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Gems This Month</span>
            <span className="font-black text-xl text-slate-800">{monthlyGems.toFixed(1)} 💎</span>
          </div>
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-sky-400/10 pointer-events-none" />
            <HelpCircle className="w-5 h-5 mb-2 text-sky-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Attempted Today</span>
            <span className="font-black text-xl text-slate-800">{dayAttempted} Qs</span>
          </div>
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-indigo-400/10 pointer-events-none" />
            <HelpCircle className="w-5 h-5 mb-2 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Attempted This Month</span>
            <span className="font-black text-xl text-slate-800">{monthAttempted} Qs</span>
          </div>
        </div>

        {/* Row 2: 4 stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-rose-400/10 pointer-events-none" />
            <Flame className="w-5 h-5 mb-2 text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Streak</span>
            <span className="font-black text-xl text-slate-800">{streak} Days</span>
          </div>
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-emerald-400/10 pointer-events-none" />
            <Award className="w-5 h-5 mb-2 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Battles</span>
            <span className="font-black text-xl text-slate-800">{questionsAnswered} Runs</span>
          </div>


          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-teal-400/10 pointer-events-none" />
            <CheckCircle2 className="w-5 h-5 mb-2 text-teal-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Correct</span>
            <span className="font-black text-xl text-slate-800">{totalCorrect} Qs</span>
          </div>
          <div className="panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-orange-400/10 pointer-events-none" />
            <Target className="w-5 h-5 mb-2 text-orange-600" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Accuracy</span>
            <span className="font-black text-xl text-slate-800">{totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Court Mirror & Squad Center ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Court Mirror (Mascot) */}
        <div className="md:col-span-6 panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
          {sample > 0 ? (
            <>
              <MascotPlayer character={characterOfTheDay()} mood={mirrorMood} size={64} noHalo />
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5 font-serif">Court Mirror</span>
                <span className="font-black text-sm text-slate-800 block leading-snug">
                  {mirrorMessage[mirrorMood] ?? 'Play more to see your mood!'}
                </span>
                <span className="text-xs text-slate-500 font-bold block mt-1">
                  Last {sample} battles · {Math.round(accuracy * 100)}% accuracy
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4 w-full">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl">
                🔮
              </div>
              <div className="flex-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5 font-serif">Court Mirror</span>
                <span className="font-black text-sm text-slate-800 block leading-snug">
                  Answer questions to activate your court mirror!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Squad Center Widget */}
        <div className="md:col-span-6 panel-3d bg-white p-5 border-2 border-primary/10 rounded-2xl flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-0.5 font-serif">Squad Center</span>
              <span className="font-black text-sm text-slate-800 block leading-snug">
                {squadSize > 0 ? `Commanding ${squadSize} Members` : teamName ? `Member of ${teamName}` : 'No active squad recruited'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mt-0.5">
                {userRole ? userRole.replace('_', ' ') : 'Infantry'} Rank
              </span>
            </div>
          </div>
          <Button
            onClick={() => navigate('/team-dashboard')}
            className="medieval-btn text-xs font-black uppercase py-2 h-9 px-4 shrink-0 shadow-sm"
          >
            Manage Squad
          </Button>
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
