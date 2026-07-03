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

  // Alliance creation form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCrest, setNewCrest] = useState('🦁');
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
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();
        if (profile) setUsername(profile.username);

        // Fetch my alliance membership
        const { data: membership } = await supabase
          .from('alliance_members')
          .select('alliance_id, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (membership) {
          setMyRole(membership.role);
          // Fetch the full alliance record
          const { data: allData } = await supabase
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
      const { data, error } = await supabase.rpc('get_alliance_rankings');
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
      const { data: membersList } = await supabase
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
      const { data: chatData } = await supabase
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
      const { data } = await supabase.rpc('create_alliance', {
        p_name: newName,
        p_description: newDesc,
        p_crest_emoji: newCrest,
        p_user_id: userId
      });

      const res = data as any;
      if (res?.error) {
        toast({ title: "Construction Failed", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Kingdom Established!", description: `The Kingdom of ${newName} is built.` });
        audioManager.playSFX('chest');
        await initKingdoms();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinAlliance = async (allianceId: string, allianceName: string) => {
    if (!userId) return;
    haptics('light');
    try {
      const { data } = await supabase.rpc('join_alliance', {
        p_alliance_id: allianceId,
        p_user_id: userId
      });

      const res = data as any;
      if (res?.error) {
        toast({ title: "Siege Blocked", description: res.error, variant: "destructive" });
      } else {
        toast({ title: "Allegiance Sworn!", description: `You have joined the forces of ${allianceName}.` });
        audioManager.playSFX('click');
        await initKingdoms();
      }
    } catch (err) {
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
      const { data } = await supabase.rpc('leave_alliance', { p_user_id: userId });
      const res = data as any;

      if (res?.error) {
        toast({ title: "Command Failed", description: res.error, variant: "destructive" });
      } else {
        toast({
          title: res.dissolved ? "Kingdom dissolved" : "Sworn treaty broken",
          description: res.dissolved ? "Your castle lies in ruins." : "You left the alliance."
        });
        await initKingdoms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !myAlliance || !newMessage.trim() || sendingMsg) return;

    setSendingMsg(true);
    haptics('light');
    try {
      await supabase.from('alliance_chat').insert({
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
        <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-yellow-500/70 font-serif uppercase tracking-widest text-xs">Consulting High Council...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#090d16] pb-16 text-white font-sans">
        
        {/* Banner Title */}
        <div className="bg-slate-950 py-10 px-4 text-center border-b border-yellow-500/10">
          <Landmark className="w-10 h-10 text-yellow-500 mx-auto mb-3 animate-pulse" />
          <h1 className="text-2xl md:text-3xl font-black font-serif uppercase tracking-widest text-white">
            Grand Kingdoms Hall
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            Form alliances with other players. Pool your bi-weekly Stars to secure territorial ranking titles and passive income buffs.
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: ALLIANCE PORTAL / GUILD HALL */}
          <div className="lg:col-span-2 space-y-8">
            
            {myAlliance ? (
              // ACTIVE MEMBER VIEW (GUILD HALL)
              <div className="bg-slate-900 border-4 border-double border-yellow-500/20 rounded-3xl p-6 shadow-md">
                
                {/* Kingdom Header Card */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
                  <div className="flex items-center gap-4">
                    <span className="text-5xl bg-slate-950 w-16 h-16 rounded-2xl flex items-center justify-center border border-yellow-500/20">
                      {myAlliance.crest_emoji}
                    </span>
                    <div>
                      <h2 className="text-lg font-black uppercase font-serif text-white">{myAlliance.name}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">"{myAlliance.description}"</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="text-center bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Bi-weekly Pool</span>
                      <span className="text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500/10 text-yellow-400" />
                        {myAlliance.biweekly_stars} ★
                      </span>
                    </div>

                    <div className="text-center bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-850">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">Global Rank</span>
                      <span className="text-xs font-black text-amber-500 flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        #{getMyRank() || 'Unranked'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kingdom Perks Card */}
                <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl mb-6">
                  <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Flame className="w-3.5 h-3.5" /> Active Kingdom Buffet Buff
                  </span>
                  <p className="text-xs font-bold text-slate-200">
                    {getRankBuff(getMyRank())}
                  </p>
                </div>

                {/* Grid Split: Members list & Chat Room */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Members list */}
                  <div>
                    <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
                      <Users className="w-4 h-4 text-yellow-500" /> Knights of the Kingdom ({members.length})
                    </h3>
                    
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {members.map(member => (
                        <div 
                          key={member.user_id} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-850/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🛡️</span>
                            <div>
                              <span className="text-xs font-black block text-slate-200">{member.username}</span>
                              <span className="text-[9px] text-slate-500">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                            member.role === 'king' 
                              ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-500" 
                              : "bg-slate-800 text-slate-400"
                          )}>
                            {member.role === 'king' ? 'King' : 'Knight'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bulletin Board Chat Roll */}
                  <div className="flex flex-col bg-slate-950 border border-slate-850 rounded-2xl p-4 min-h-[300px] max-h-[320px]">
                    <h3 className="text-xs uppercase font-black text-slate-400 tracking-wider mb-2 border-b border-slate-900 pb-2">
                      🏰 Guard Chat Log
                    </h3>

                    {/* Chat roll area */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-[10px] text-slate-600">
                          <span>No messages on the notice board yet.</span>
                        </div>
                      ) : (
                        chatMessages.map(msg => (
                          <div key={msg.id} className="text-xs bg-slate-900/50 p-2 rounded-lg border border-slate-850/40">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-extrabold text-yellow-500/90 text-[10px]">{msg.username}</span>
                              <span className="text-[8px] text-slate-600">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">{msg.message}</p>
                          </div>
                        ))
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input */}
                    <form onSubmit={handleSendChatMessage} className="flex gap-1.5 mt-2 border-t border-slate-900 pt-2.5">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Pin a message..."
                        disabled={sendingMsg}
                        className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50"
                      />
                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={sendingMsg || !newMessage.trim()}
                        className="h-8 w-8 bg-yellow-500 hover:bg-yellow-600 text-slate-950 rounded-lg flex items-center justify-center p-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Dangerous buttons */}
                <div className="border-t border-slate-850 pt-5 mt-6 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLeaveAlliance} 
                    className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {myRole === 'king' ? 'Dissolve Kingdom' : 'Abjure Allegiance'}
                  </Button>
                </div>

              </div>
            ) : (
              // NOT IN ALLIANCE VIEW: SEARCH & CREATE CARDS
              <div className="space-y-6">
                
                {/* Construction Card */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-md">
                  <h2 className="text-lg font-black uppercase font-serif text-white mb-2 flex items-center gap-2">
                    <PlusCircle className="text-yellow-500 w-5 h-5" /> Establish Your Dynasty
                  </h2>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Construct your own castle, name your legion, select your crest, and recruit knights to conquer weekly charts.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Kingdom Name</label>
                      <input
                        type="text"
                        maxLength={20}
                        placeholder="e.g. Byzantine Legacy"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Crest Emoji</label>
                        <select
                          value={newCrest}
                          onChange={(e) => setNewCrest(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50 appearance-none text-center"
                        >
                          {["🦁", "🐉", "🛡️", "⚔️", "🦅", "🐺", "👑", "🏹", "🦄", "🏔️"].map(emoji => (
                            <option key={emoji} value={emoji}>{emoji}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] uppercase font-black tracking-wider text-slate-500 block mb-1">Dynastic Decree (Description)</label>
                        <input
                          type="text"
                          placeholder="e.g. Conquest and academic supremacy."
                          value={newDesc}
                          onChange={(e) => setNewDesc(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-yellow-500/50"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateAlliance}
                      disabled={creating}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black h-11 text-xs uppercase tracking-widest border-0 shadow-md"
                    >
                      {creating ? 'Erecting Castle Keep...' : 'Erect Castle keep'}
                    </Button>
                  </div>
                </div>

                {/* Alliance search lists */}
                <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-md">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-850 pb-3 mb-4">
                    <h2 className="text-sm font-black uppercase text-white tracking-wider">Search Kingdoms</h2>
                    
                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-850 max-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent text-[11px] text-white focus:outline-none placeholder-slate-600 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {rankings.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <p className="text-center text-[10px] text-slate-600 py-6">No rival kingdoms found nearby.</p>
                    ) : (
                      rankings
                        .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(all => (
                          <div 
                            key={all.alliance_id}
                            className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex flex-wrap justify-between items-center gap-3 hover:border-yellow-500/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl bg-slate-950 p-2 rounded-xl border border-slate-850">{all.crest_emoji}</span>
                              <div>
                                <h4 className="font-extrabold text-white text-xs">{all.name}</h4>
                                <p className="text-[10px] text-slate-500 max-w-[220px]">"{all.description}"</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Members</span>
                                <span className="text-xs font-black text-slate-200">{all.member_count}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleJoinAlliance(all.alliance_id, all.name)}
                                className="bg-slate-900 border border-slate-800 text-yellow-500 hover:text-yellow-400 text-[10px] font-black uppercase tracking-wider px-3 h-8"
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
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-md h-fit">
            <h2 className="text-sm font-black uppercase font-serif tracking-widest text-white mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Regional Hegemons
            </h2>
            <p className="text-[10px] text-slate-400 mb-6 leading-relaxed">
              Global rankings based on bi-weekly gathered Stars. Buff perks apply dynamically at reset intervals.
            </p>

            <div className="space-y-3.5">
              {rankings.map((all, index) => {
                const rank = index + 1;
                return (
                  <div 
                    key={all.alliance_id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-2xl border transition-all",
                      myAlliance && all.alliance_id === myAlliance.alliance_id
                        ? "bg-yellow-500/10 border-yellow-500/40"
                        : "bg-slate-950/40 border-slate-850"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
                        rank === 1 ? "bg-yellow-500 text-slate-950" :
                        rank === 2 ? "bg-slate-300 text-slate-950" :
                        rank === 3 ? "bg-amber-600 text-slate-950" :
                        "bg-slate-850 text-slate-400"
                      )}>
                        {rank}
                      </span>
                      <span className="text-xl">{all.crest_emoji}</span>
                      <div>
                        <span className="font-extrabold text-xs block text-slate-200">{all.name}</span>
                        <span className="text-[9px] text-slate-500 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> {all.member_count} knights
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-yellow-500 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-500/10 text-yellow-400" />
                      {all.biweekly_stars}
                    </span>
                  </div>
                );
              })}

              {rankings.length === 0 && (
                <p className="text-center text-[10px] text-slate-600 py-6">No Dynasties recorded in the registry.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </PageLayout>
  );
}
