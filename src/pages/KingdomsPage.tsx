import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { audioManager } from '@/utils/audioManager';
import { 
  Shield, Landmark, Users, Star, Trophy, Send, 
  PlusCircle, LogOut, Search, Info, Flame, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoatOfArmsShield } from '@/components/gamification/CoatOfArmsShield';
import { getEquippedTitle, ARMORY_ITEMS } from '@/utils/shopData';

interface Alliance {
  alliance_id: string;
  name: string;
  description: string;
  crest_emoji: string;
  biweekly_stars: number;
  total_stars: number;
  member_count: number;
}

interface AllianceMember {
  user_id: string;
  username: string;
  role: string;
  joined_at: string;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

export default function KingdomsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Alliances states
  const [rankings, setRankings] = useState<Alliance[]>([]);
  const [myAlliance, setMyAlliance] = useState<Alliance | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [members, setMembers] = useState<AllianceMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Title state
  const [equippedTitleStr, setEquippedTitleStr] = useState('');

  useEffect(() => {
    const titleId = getEquippedTitle();
    const item = ARMORY_ITEMS.find(i => i.id === titleId);
    if (item) {
      setEquippedTitleStr(item.name.replace(' Title', ''));
    } else {
      setEquippedTitleStr('');
    }
  }, []);

  // Alliance creation form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPattern, setNewPattern] = useState('solid');
  const [newColorA, setNewColorA] = useState('sable');
  const [newColorB, setNewColorB] = useState('or');
  const [newCharge, setNewCharge] = useState('🦁');
  const [creating, setCreating] = useState(false);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const { toast } = useToast();
  const haptics = useHaptics();

  useEffect(() => {
    initKingdoms();
  }, []);

  useEffect(() => {
    if (myAlliance) {
      fetchAllianceDetails(myAlliance.alliance_id);
      
      // Realtime subscription for alliance chat
      const channel = supabase
        .channel(`alliance_chat:${myAlliance.alliance_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alliance_chat',
            filter: `alliance_id=eq.${myAlliance.alliance_id}`
          },
          (payload) => {
            const newMsg = payload.new as ChatMessage;
            setChatMessages(prev => [...prev, newMsg]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [myAlliance?.alliance_id]);

  const initKingdoms = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // Fetch username
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUsername(profile.username);

        // Fetch my alliance membership
        const { data: membership } = await (supabase as any)
          .from('alliance_members')
          .select('alliance_id, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (membership) {
          setMyRole(membership.role);
          // Fetch the full alliance record
          const { data: allData } = await (supabase as any)
            .from('alliances')
            .select('*')
            .eq('id', membership.alliance_id)
            .maybeSingle();
          
          if (allData) {
            setMyAlliance({
              alliance_id: allData.id,
              name: allData.name,
              description: allData.description || '',
              crest_emoji: allData.crest_emoji || '🦁',
              biweekly_stars: allData.biweekly_stars || 0,
              total_stars: allData.total_stars || 0,
              member_count: 0 // Will load dynamically
            });
          }
        } else {
          setMyAlliance(null);
          setMyRole(null);
        }
      }
      await fetchRankings();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRankings = async () => {
    try {
      const { data, error } = await (supabase as any).rpc('get_alliance_rankings');
      if (!error && data) {
        setRankings(data as Alliance[]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllianceDetails = async (allianceId: string) => {
    try {
      // 1. Fetch Members list
      const { data: membersList } = await (supabase as any)
        .from('alliance_members')
        .select(`
          user_id,
          role,
          joined_at,
          profiles:user_id (username)
        ` as any);

      // Map profiles response correctly
      if (membersList) {
        const formatted = (membersList as any[]).map(m => ({
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          username: m.profiles?.username || 'Unknown Knight'
        }));
        setMembers(formatted);
      }

      // 2. Fetch Chat messages
      const { data: chatData } = await (supabase as any)
        .from('alliance_chat')
        .select('id, username, message, created_at')
        .eq('alliance_id', allianceId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (chatData) {
        setChatMessages(chatData);
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCreateAlliance = async () => {
    if (!userId) return;
    if (!newName.trim()) {
      toast({ title: "Name required", description: "Your Kingdom needs a name.", variant: "destructive" });
      return;
    }

    setCreating(true);
    haptics('medium');
    try {
      const computedCrest = `${newPattern}|${newColorA}-${newColorB}|${newCharge}`;
      const { data, error } = await (supabase as any).rpc('create_alliance', {
        p_name: newName,
        p_description: newDesc,
        p_crest_emoji: computedCrest,
        p_user_id: userId
      });

      if (error) {
        toast({ title: "Construction Failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Kingdom Established!", description: `The Kingdom of ${newName} is built.` });
        audioManager.playSFX('chest');
        await initKingdoms();
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinAlliance = async (allianceId: string, allianceName: string) => {
    if (!userId) return;
    haptics('light');
    try {
      const { data, error } = await (supabase as any).rpc('join_alliance', {
        p_alliance_id: allianceId,
        p_user_id: userId
      });

      if (error) {
        toast({ title: "Siege Blocked", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Allegiance Sworn!", description: `You have joined the forces of ${allianceName}.` });
        audioManager.playSFX('click');
        await initKingdoms();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLeaveAlliance = async () => {
    if (!userId) return;
    const confirmMsg = myRole === 'king' 
      ? "Dissolving the Kingdom will destroy the castle, kick all members, and delete the alliance forever. Confirm?" 
      : "Are you sure you want to leave this alliance?";

    if (!window.confirm(confirmMsg)) return;

    haptics('warning');
    try {
      const { data, error } = await (supabase as any).rpc('leave_alliance', { p_user_id: userId });

      if (error) {
        toast({ title: "Command Failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: data?.dissolved ? "Kingdom dissolved" : "Sworn treaty broken",
          description: data?.dissolved ? "Your castle lies in ruins." : "You left the alliance."
        });
        await initKingdoms();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !myAlliance || !newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    haptics('light');
    try {
      await (supabase as any).from('alliance_chat').insert({
        alliance_id: myAlliance.alliance_id,
        user_id: userId,
        username: username || 'Knight',
        message: newMessage
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  const getMyRank = () => {
    if (!myAlliance) return null;
    const rankIndex = rankings.findIndex(r => r.alliance_id === myAlliance.alliance_id);
    return rankIndex !== -1 ? rankIndex + 1 : null;
  };

  const getRankBuff = (rank: number | null) => {
    if (!rank) return 'No Buffs';
    if (rank <= 3) return '+10% Gems bonus on Quests & Lifeline Stars discount (-3★)';
    if (rank <= 10) return '+5% Gems bonus on Quests';
    return '+2% Gems bonus on Quests';
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-[#f4faff] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-primary font-black font-serif uppercase tracking-widest text-xs">Consulting High Council...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#f4faff] pb-16 text-foreground font-sans bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        
        {/* Banner Title */}
        <div className="panel-3d bg-white mx-4 mt-6 py-8 px-4 text-center rounded-3xl border-2 border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />
          
          <Landmark className="w-12 h-12 text-primary mx-auto mb-3 animate-[bounce_2s_infinite] relative z-10" />
          <h1 className="text-2xl md:text-3xl font-black font-serif uppercase tracking-widest text-primary drop-shadow-sm relative z-10">
            Grand Kingdoms Hall
          </h1>
          <p className="text-xs md:text-sm text-slate-600 font-semibold max-w-md mx-auto mt-2 leading-relaxed relative z-10">
            Form alliances with other players. Pool your bi-weekly Stars to secure territorial ranking titles and passive income buffs.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: ALLIANCE PORTAL / GUILD HALL */}
          <div className="lg:col-span-2 space-y-8">
            
            {myAlliance ? (
              // ACTIVE MEMBER VIEW (GUILD HALL)
              <div className="panel-3d bg-white border-2 border-primary/20 rounded-3xl p-6 shadow-md text-foreground relative overflow-hidden">
                
                {/* Kingdom Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-slate-100 pb-5 mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <CoatOfArmsShield crestString={myAlliance.crest_emoji} size="lg" />
                    <div>
                      <h2 className="text-xl font-black uppercase font-serif text-primary drop-shadow-sm">{myAlliance.name}</h2>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">"{myAlliance.description}"</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="text-center bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-inner">
                      <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Bi-weekly Pool</span>
                      <span className="text-sm font-black text-amber-600 flex items-center justify-center gap-1.5 drop-shadow-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {myAlliance.biweekly_stars} ★
                      </span>
                    </div>

                    <div className="text-center bg-slate-50 px-4 py-2 rounded-2xl border-2 border-slate-200 shadow-inner">
                      <span className="text-[10px] uppercase font-black text-slate-500 block mb-1">Global Rank</span>
                      <span className="text-sm font-black text-primary flex items-center justify-center gap-1.5 drop-shadow-sm">
                        <Trophy className="w-4 h-4 text-primary" />
                        #{getMyRank() || 'Unranked'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kingdom Perks Card */}
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl mb-6 shadow-sm relative z-10">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Flame className="w-4 h-4 text-amber-600" /> Active Kingdom Buff
                  </span>
                  <p className="text-sm font-bold text-amber-950">
                    {getRankBuff(getMyRank())}
                  </p>
                </div>

                {/* Grid Split: Members list & Chat Room */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                  
                  {/* Members list */}
                  <div>
                    <h3 className="text-xs uppercase font-black text-primary tracking-wider flex items-center gap-2 mb-4 border-b-2 border-slate-100 pb-2">
                      <Users className="w-4 h-4 text-primary" /> Knights of the Kingdom ({members.length})
                    </h3>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {members.map(member => (
                        <div 
                          key={member.user_id} 
                          className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border-2 border-slate-100 shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl drop-shadow-sm">🛡️</span>
                            <div>
                              <span className="text-[13px] font-black block text-slate-800">
                                {member.username}
                                {member.username === username && equippedTitleStr && (
                                  <span className="ml-2 text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                    {equippedTitleStr}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg",
                            member.role === 'king' 
                              ? "bg-primary/10 border-2 border-primary/20 text-primary" 
                              : "bg-slate-200/50 border-2 border-slate-200 text-slate-600"
                          )}>
                            {member.role === 'king' ? 'King' : 'Knight'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bulletin Board Chat Roll */}
                  <div className="flex flex-col bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 min-h-[300px] max-h-[320px] shadow-inner">
                    <h3 className="text-xs uppercase font-black text-slate-600 tracking-wider mb-2 border-b-2 border-slate-200 pb-2">
                      🏰 Guard Chat Log
                    </h3>

                    {/* Chat roll area */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 my-2 custom-scrollbar">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-[11px] font-bold text-slate-400">
                          <span>No messages on the notice board yet.</span>
                        </div>
                      ) : (
                        chatMessages.map(msg => (
                          <div key={msg.id} className="text-xs bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-extrabold text-primary text-[11px]">{msg.username}</span>
                              <span className="text-[9px] text-slate-400 font-bold">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 font-semibold text-[12px] leading-relaxed">{msg.message}</p>
                          </div>
                        ))
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendChatMessage} className="flex gap-2 mt-3 pt-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Pin a message..."
                        disabled={sendingMsg}
                        className="flex-1 bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 shadow-inner"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={sendingMsg || !newMessage.trim()}
                        className="h-10 w-10 btn-3d btn-3d-primary rounded-xl flex items-center justify-center p-0 shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Dangerous buttons */}
                <div className="mt-8 flex justify-end relative z-10">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLeaveAlliance} 
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-[11px] font-black uppercase flex items-center gap-1.5 transition-colors rounded-xl px-4 py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {myRole === 'king' ? 'Dissolve Kingdom' : 'Abjure Allegiance'}
                  </Button>
                </div>

              </div>
            ) : (
              // NOT IN ALLIANCE VIEW: SEARCH & CREATE CARDS
              <div className="space-y-8">
                
                {/* Construction Card */}
                <div className="panel-3d bg-white border-2 border-primary/20 rounded-3xl p-6 shadow-md relative overflow-hidden text-foreground">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <h2 className="text-xl font-black uppercase font-serif text-primary mb-2 flex items-center gap-2 relative z-10 drop-shadow-sm">
                    <PlusCircle className="text-amber-500 w-6 h-6" /> Establish Your Dynasty
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed relative z-10">
                    Construct your own castle, name your legion, select your crest, and recruit knights to conquer weekly charts.
                  </p>

                  <div className="space-y-5 relative z-10">
                    <div>
                      <label className="text-[11px] uppercase font-black tracking-wider text-slate-600 block mb-2">Kingdom Name</label>
                      <input
                        type="text"
                        maxLength={20}
                        placeholder="e.g. Byzantine Legacy"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary/50 shadow-inner placeholder-slate-400 transition-colors"
                      />
                    </div>

                    <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-inner">
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-3">Coat of Arms Preview</label>
                        <CoatOfArmsShield 
                          crestString={`${newPattern}|${newColorA}-${newColorB}|${newCharge}`} 
                          size="lg" 
                          className="bg-white rounded-2xl p-2 border-2 border-slate-200 shadow-md transform hover:scale-105 transition-transform"
                        />
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Shield Layout</label>
                          <select
                            value={newPattern}
                            onChange={(e) => setNewPattern(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 cursor-pointer shadow-sm"
                          >
                            <option value="solid">Solid</option>
                            <option value="vertical">Vertical Split</option>
                            <option value="diagonal">Diagonal Split</option>
                            <option value="cross">Four Quadrants</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Charge Emblem</label>
                          <select
                            value={newCharge}
                            onChange={(e) => setNewCharge(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 cursor-pointer shadow-sm"
                          >
                            {["🦁", "🐉", "🛡️", "⚔️", "🦅", "🐺", "👑", "🏹", "🦄", "🏔️"].map(emoji => (
                              <option key={emoji} value={emoji}>{emoji}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Primary Color</label>
                          <select
                            value={newColorA}
                            onChange={(e) => setNewColorA(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 cursor-pointer shadow-sm"
                          >
                            <option value="sable">Obsidian Black</option>
                            <option value="gules">Crimson Red</option>
                            <option value="azure">Sapphire Blue</option>
                            <option value="or">Imperial Gold</option>
                            <option value="vert">Emerald Green</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1.5">Secondary Color</label>
                          <select
                            value={newColorB}
                            onChange={(e) => setNewColorB(e.target.value)}
                            disabled={newPattern === 'solid'}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary/50 cursor-pointer shadow-sm disabled:opacity-50 disabled:bg-slate-100"
                          >
                            <option value="or">Imperial Gold</option>
                            <option value="gules">Crimson Red</option>
                            <option value="azure">Sapphire Blue</option>
                            <option value="sable">Obsidian Black</option>
                            <option value="vert">Emerald Green</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase font-black tracking-wider text-slate-600 block mb-2">Dynastic Decree (Description)</label>
                      <input
                        type="text"
                        placeholder="e.g. Conquest and academic supremacy."
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-primary/50 shadow-inner placeholder-slate-400 transition-colors"
                      />
                    </div>

                    <Button
                      onClick={handleCreateAlliance}
                      disabled={creating}
                      className="w-full btn-3d btn-3d-primary h-12 text-sm uppercase tracking-widest mt-2"
                    >
                      {creating ? 'Erecting Castle Keep...' : 'Erect Castle keep'}
                    </Button>
                  </div>
                </div>

                {/* Alliance search lists */}
                <div className="panel-3d bg-white border-2 border-primary/20 rounded-3xl p-6 shadow-md text-foreground relative">
                  <div className="flex items-center justify-between gap-4 border-b-2 border-slate-100 pb-4 mb-5">
                    <h2 className="text-lg font-black uppercase font-serif text-primary tracking-wider drop-shadow-sm">Search Kingdoms</h2>
                    
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border-2 border-slate-200 max-w-[220px] shadow-inner transition-colors focus-within:border-primary/40">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none placeholder-slate-400 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {rankings.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <p className="text-center text-xs font-bold text-slate-400 py-8">No rival kingdoms found nearby.</p>
                    ) : (
                      rankings
                        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(all => (
                          <div 
                            key={all.alliance_id}
                            className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 hover:border-primary/30 hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <CoatOfArmsShield crestString={all.crest_emoji} size="md" className="group-hover:scale-110 transition-transform shadow-sm" />
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-sm drop-shadow-sm">{all.name}</h4>
                                <p className="text-[11px] text-slate-500 font-semibold max-w-[220px] mt-0.5">"{all.description}"</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-5">
                              <div className="text-right">
                                <span className="text-[10px] uppercase font-black text-slate-400 block mb-0.5">Members</span>
                                <span className="text-sm font-black text-slate-700">{all.member_count}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleJoinAlliance(all.alliance_id, all.name)}
                                className="btn-3d bg-slate-800 text-white hover:bg-slate-900 text-xs font-black uppercase tracking-wider px-4 h-9"
                              >
                                Join Kingdom
                              </Button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: GLOBAL LEADERBOARD */}
          <div className="panel-3d bg-white border-2 border-primary/20 rounded-3xl p-6 shadow-md h-fit text-foreground relative overflow-hidden">
            <h2 className="text-lg font-black uppercase font-serif tracking-widest text-primary mb-2 flex items-center gap-2 drop-shadow-sm">
              <Trophy className="w-6 h-6 text-amber-500 drop-shadow" /> Regional Hegemons
            </h2>
            <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed relative z-10">
              Global rankings based on bi-weekly gathered Stars. Buff perks apply dynamically at reset intervals.
            </p>

            <div className="space-y-4 relative z-10">
              {rankings.map((all, index) => {
                const rank = index + 1;
                return (
                  <div 
                    key={all.alliance_id}
                    className={cn(
                      "flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all shadow-sm hover:scale-[1.02]",
                      myAlliance && all.alliance_id === myAlliance.alliance_id
                        ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20"
                        : "bg-slate-50 border-slate-100 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 shadow-sm border-2",
                        rank === 1 ? "bg-yellow-400 text-amber-950 border-yellow-200" :
                        rank === 2 ? "bg-slate-300 text-slate-900 border-slate-100" :
                        rank === 3 ? "bg-amber-700 text-amber-50 border-amber-500" :
                        "bg-white text-slate-400 border-slate-200"
                      )}>
                        {rank}
                      </span>
                      <CoatOfArmsShield crestString={all.crest_emoji} size="sm" className="shadow-sm" />
                      <div>
                        <span className="font-extrabold text-[13px] block text-slate-800 drop-shadow-sm">{all.name}</span>
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-0.5">
                          <Users className="w-3 h-3 text-slate-400" /> {all.member_count} knights
                        </span>
                      </div>
                    </div>

                    <span className="text-sm font-black text-amber-600 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-inner border border-slate-100">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500 drop-shadow-sm" />
                      {all.biweekly_stars}
                    </span>
                  </div>
                );
              })}

              {rankings.length === 0 && (
                <p className="text-center text-xs font-bold text-slate-400 py-10">No Dynasties recorded in the registry.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
}
