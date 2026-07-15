import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Trophy, Sparkles, Calendar, Flame, Pencil, Users, ExternalLink, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { IdleMascot } from '@/mobile/mascots/IdleMascot';
import { useMoodEngine } from '@/mobile/mascots/useMoodEngine';
import { moodFromAccuracy, characterOfTheDay } from '@/mobile/mascots/registry';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { usePersistentQuizStats } from '@/hooks/quiz/usePersistentQuizStats';
import { ProfileEditSheet, MobileProfile } from './ProfileEditSheet';
import { cn } from '@/lib/utils';
import {
  ARMORY_ITEMS,
  getUserBalances,
  purchaseItem,
  getPurchasedItems,
  getEquippedItems,
  getEquippedTitle,
  equipItem,
  unequipItem,
  equipTitle,
  unequipTitle
} from '@/utils/shopData';
import { Award } from 'lucide-react';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const { streak, questionsAnswered } = usePersistentQuizStats();
  const { accuracy, sample } = useMoodEngine();
  const mirrorMood = moodFromAccuracy(accuracy, sample);
  const [profile, setProfile] = useState<{ name: string; username: string; gems: number; daily: number; monthly: number } | null>(null);
  const [reports, setReports] = useState<{
    dayAttempted: number; dayCorrect: number;
    monthAttempted: number; monthCorrect: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<MobileProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const uid = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ID) : null;
  const userRole = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.USER_ROLE) : null;
  const isTeamLeader = ['admin', 'king', 'baron', 'knight', 'officer'].includes(userRole || '');

  // Shop States
  const [purchased, setPurchased] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<Record<string, string>>({});
  const [equippedTitleId, setEquippedTitleId] = useState('');
  const [shopTrigger, setShopTrigger] = useState(0);

  useEffect(() => {
    setPurchased(getPurchasedItems());
    setEquipped(getEquippedItems());
    setEquippedTitleId(getEquippedTitle());
  }, [shopTrigger]);

  const reloadGems = () => {
    const { gems } = getUserBalances();
    setProfile(prev => prev ? { ...prev, gems } : prev);
  };

  useEffect(() => {
    if (!uid) return;
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const month = new Date().toISOString().slice(0, 7);
      const [p, d, m] = await Promise.all([
        supabase.from('profiles').select('username, points, display_name, email, phone, upi_id, profile_picture, date_of_birth').eq('id', uid).maybeSingle(),
        supabase.from('daily_points').select('points').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('monthly_points').select('points').eq('user_id', uid).eq('month', month).maybeSingle(),
      ]);
      const pd = p.data as any;
      setProfile({
        name: pd?.display_name || pd?.username || 'Player',
        username: pd?.username || 'Player',
        gems: Number(pd?.points ?? 0),
        daily: Number((d.data as any)?.points ?? 0),
        monthly: Number((m.data as any)?.points ?? 0),
      });

      // Questions attempted / correct — today and this month
      const dayStart = `${today}T00:00:00.000Z`;
      const monthStart = `${month}-01T00:00:00.000Z`;
      const [dAtt, dCorr, mAtt, mCorr] = await Promise.all([
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', dayStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).gte('answered_at', monthStart),
        supabase.from('quiz_answers').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('correct', true).gte('answered_at', monthStart),
      ]);
      setReports({
        dayAttempted: dAtt.count ?? 0,
        dayCorrect: dCorr.count ?? 0,
        monthAttempted: mAtt.count ?? 0,
        monthCorrect: mCorr.count ?? 0,
      });

      setAvatarUrl(pd?.profile_picture || '');
      const { data: { session } } = await supabase.auth.getSession();
      const provider = session?.user?.app_metadata?.provider === 'google' ? 'google' : 'email';
      setEditProfile({
        username: pd?.username || '',
        display_name: pd?.display_name ?? null,
        email: pd?.email ?? session?.user?.email ?? null,
        phone: pd?.phone ?? null,
        upi_id: pd?.upi_id ?? null,
        profile_picture: pd?.profile_picture ?? null,
        date_of_birth: pd?.date_of_birth ?? null,
        provider,
      });
    })();
  }, [uid]);

  const signOut = async () => {
    haptics('warning');
    await supabase.auth.signOut();
    [STORAGE_KEYS.USER_ID, STORAGE_KEYS.USER_NAME, STORAGE_KEYS.USER_GEMS, STORAGE_KEYS.USER_ROLE]
      .forEach((k) => localStorage.removeItem(k));
    navigate('/login');
  };

  if (!uid) {
    return (
      <div className="px-4 pt-10 pb-32 text-center">
        <MascotPlayer character={characterOfTheDay()} mood="cheer" size={140} className="mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2 text-amber-400" style={{ fontFamily: "'Cinzel', serif" }}>Join the Kingdom</h1>
        <p className="text-stone-500 mb-6 text-sm">Pledge your allegiance to save gems, climb the Royal Rankings, and win monthly bounties.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/login')}
          className="w-full rounded-2xl py-3 medieval-btn"
        >
          Enter the Realm
        </motion.button>
      </div>
    );
  }

  const equippedFrame = ARMORY_ITEMS.find(item => item.id === equipped.avatar_frame);
  const equippedWeapon = ARMORY_ITEMS.find(item => item.id === equipped.weapon);
  const equippedShield = ARMORY_ITEMS.find(item => item.id === equipped.shield);
  const equippedTitle = ARMORY_ITEMS.find(item => item.id === equippedTitleId);

  return (
    <div className="px-4 pt-4 pb-32">
      {/* Hero */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={profile?.name ? `${profile.name}'s profile picture` : 'Your profile picture'} className={cn("w-[90px] h-[90px] rounded-2xl object-cover iron-frame transition-all duration-300", equippedFrame?.previewClass)} />
          ) : (
            <IdleMascot size={90} override={streak >= 3 ? 'excited' : undefined} />
          )}
          {equippedFrame && (
            <span className="absolute -top-2.5 -right-2.5 text-xl select-none animate-pulse filter drop-shadow">
              {equippedFrame.emoji}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold truncate text-stone-900 font-serif" style={{ fontFamily: "'Cinzel', serif" }}>{profile?.name || '…'}</h1>
            {equippedTitle && (
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit mt-1 tracking-wider">
                {equippedTitle.emoji} {equippedTitle.name.replace(' Title', '')}
              </span>
            )}
          </div>
          {profile?.username && profile.username !== profile.name && (
            <p className="text-xs text-stone-600 truncate mt-0.5">@{profile.username}</p>
          )}
          <p className="text-sm text-amber-600 font-bold mt-1">{(profile?.gems ?? 0).toLocaleString()} gems</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setEditOpen(true)}
          disabled={!editProfile}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold iron-frame text-amber-600 disabled:opacity-50"
        >
          <Pencil className="w-4 h-4" /> Edit
        </motion.button>
      </div>

      {sample > 0 && (
        <div className="mb-6 rounded-2xl wooden-door p-4 flex items-center gap-3">
          <MascotPlayer character={characterOfTheDay()} mood={mirrorMood} size={64} noHalo />
          <div className="flex-1">
            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Court Mirror</p>
            <p className="font-bold text-sm text-stone-900">
              {mirrorMood === 'excited' && "You're crushing it — keep going!"}
              {mirrorMood === 'cheer' && "Solid run. One more quest?"}
              {mirrorMood === 'neutral' && 'Steady. Play a quick round to warm up.'}
              {mirrorMood === 'sad' && 'Tough patch. Win one to cheer me up?'}
              {mirrorMood === 'angry' && 'Save us with a comeback! 💪'}
            </p>
            <p className="text-[11px] text-stone-600 mt-0.5 font-medium">Last {sample} battles · {Math.round(accuracy * 100)}% accuracy</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Sparkles} label="Today" value={`${profile?.daily ?? 0} 💎`} color="from-primary to-purple-500" />
        <StatCard icon={Trophy} label="This month" value={`${profile?.monthly ?? 0} 💎`} color="from-amber-400 to-orange-500" />
        <StatCard icon={Flame} label="Streak" value={String(streak)} color="from-red-500 to-pink-500" />
        <StatCard icon={Calendar} label="Answered" value={String(questionsAnswered)} color="from-emerald-500 to-teal-500" />
      </div>

      {isTeamLeader && (
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            haptics('light');
            navigate('/team-dashboard');
          }}
          className="mb-6 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-md">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <p className="font-bold text-sm">Team Control Center</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(userRole || 'infantry').toUpperCase()} Dashboard
              </p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-indigo-500 animate-pulse" />
        </motion.div>
      )}

      {/* Reports */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3">Battle Records</h2>
      <div className="space-y-3 mb-6">
        <ReportRow
          title="Today"
          attempted={reports?.dayAttempted ?? 0}
          correct={reports?.dayCorrect ?? 0}
          gems={profile?.daily ?? 0}
        />
        <ReportRow
          title="This month"
          attempted={reports?.monthAttempted ?? 0}
          correct={reports?.monthCorrect ?? 0}
          gems={profile?.monthly ?? 0}
        />
      </div>

      {/* Royal Shop & Armory Section */}
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 mb-3 flex items-center gap-1.5 pt-2">
        <Award className="w-3.5 h-3.5 text-yellow-500" /> Royal Shop & Enhancements
      </h2>
      <div className="space-y-4 mb-6">
        <div className="bg-stone-900/90 border border-stone-850 p-4 rounded-3xl space-y-4">
          <p className="text-xs text-stone-400 leading-relaxed">
            Acquire virtual enhancements, customize your avatar frame, or recruit advisors to assist you in battles.
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            {ARMORY_ITEMS.map((item) => {
              const isShard = item.type === 'counselor_shard';
              const owned = purchased.includes(item.id);
              const isEquipped = equipped[item.type] === item.id || (item.type === 'prestige_title' && equippedTitleId === item.id);
              
              return (
                <div key={item.id} className="bg-stone-950/80 border border-stone-850/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none">{item.emoji}</span>
                    <div>
                      <h4 className="text-xs font-black text-white leading-none">{item.name}</h4>
                      <span className="text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 mt-1 inline-block uppercase leading-none">
                        {item.effect}
                      </span>
                    </div>
                  </div>

                  <div>
                    {owned && !isShard ? (
                      isEquipped ? (
                        <button 
                          onClick={() => {
                            haptics('light');
                            if (item.type === 'prestige_title') {
                              unequipTitle();
                            } else {
                              unequipItem(item.type);
                            }
                            setShopTrigger(p => p + 1);
                          }}
                          className="bg-stone-800 border border-stone-700 text-stone-300 font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-xl"
                        >
                          Unequip
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            haptics('light');
                            if (item.type === 'prestige_title') {
                              equipTitle(item.id);
                            } else {
                              equipItem(item.id);
                            }
                            setShopTrigger(p => p + 1);
                          }}
                          className="bg-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl"
                        >
                          Equip
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => {
                          haptics('success');
                          const res = purchaseItem(item.id);
                          if (res.success) {
                            alert(res.message);
                            reloadGems();
                          } else {
                            alert(res.message);
                          }
                          setShopTrigger(p => p + 1);
                        }}
                        className="bg-slate-900 border border-yellow-500/25 text-yellow-400 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1"
                      >
                        Buy 💎{item.costGems}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={signOut}
        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold text-red-500 wooden-door !border-red-900/40"
      >
        <LogOut className="w-4 h-4" /> Leave the Kingdom
      </motion.button>

      {editProfile && uid && (
        <ProfileEditSheet
          uid={uid}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={editProfile}
          onSaved={(next) => {
            setEditProfile(next);
            setAvatarUrl(next.profile_picture || '');
            setProfile((prev) => (prev ? { ...prev, username: next.username, name: next.display_name || next.username } : prev));
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl p-4 wooden-door"
    >
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gradient-to-br ${color} opacity-15 blur-xl`} />
      <Icon className="w-5 h-5 mb-2 text-amber-500" />
      <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">{label}</p>
      <p className="font-bold text-lg text-stone-900">{value}</p>
    </motion.div>
  );
}

function ReportRow({ title, attempted, correct, gems }: { title: string; attempted: number; correct: number; gems: number }) {
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  return (
    <div className="rounded-2xl wooden-door p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-sm text-stone-900">{title}</p>
        <span className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">{accuracy}% accuracy</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-stone-800">{attempted}</p>
          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Battles</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-600">{correct}</p>
          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Victories</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">{gems.toLocaleString()}</p>
          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Gems</p>
        </div>
      </div>
    </div>
  );
}