import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles, Zap, Flame, Star, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { audioManager } from '@/utils/audioManager';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS } from '@/utils/quizData';
import { showRewarded } from '@/mobile/ads/adManager';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export interface Advisor {
  id: string;
  name: string;
  title: string;
  portrait: string;
  emoji: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  ability: string;
  quotes: string[];
}

export const ADVISORS: Advisor[] = [
  {
    id: 'socrates',
    name: 'King Socrates',
    title: 'The Philosopher King',
    portrait: '/medieval/socrates.png',
    emoji: '🏛️',
    accentColor: 'from-cyan-500 to-teal-600',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(6,182,212,0.15)',
    ability: '50/50 Lifeline',
    quotes: [
      '"The only true wisdom is in knowing you know nothing."',
      '"An unexamined question is not worth answering."',
      '"I can guide thee — but two paths shall remain."',
    ],
  },
  {
    id: 'aryabhata',
    name: 'King Aryabhata',
    title: 'The Astronomer King',
    portrait: '/medieval/aryabhata.png',
    emoji: '📐',
    accentColor: 'from-amber-500 to-yellow-600',
    borderColor: 'border-amber-500/40',
    glowColor: 'rgba(245,158,11,0.15)',
    ability: 'Skip Question',
    quotes: [
      '"Numbers speak truths that words cannot."',
      '"Let calculation guide thy next move."',
      '"A wise warrior knows when to retreat."',
    ],
  },
  {
    id: 'chanakya',
    name: 'Emperor Chanakya',
    title: 'The Strategist Emperor',
    portrait: '/medieval/chanakya.png',
    emoji: '📜',
    accentColor: 'from-rose-500 to-red-600',
    borderColor: 'border-rose-500/40',
    glowColor: 'rgba(244,63,94,0.15)',
    ability: 'Audience Poll',
    quotes: [
      '"Before you act, consider the counsel of the masses."',
      '"A king who listens to all, falls to none."',
      '"Strategy without knowledge is but a gamble."',
    ],
  },
  {
    id: 'ramanujan',
    name: 'Prince Ramanujan',
    title: 'The Prince of Numbers',
    portrait: '/medieval/ramanujan.png',
    emoji: '🧠',
    accentColor: 'from-purple-500 to-violet-600',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(139,92,246,0.15)',
    ability: 'Extra Time',
    quotes: [
      '"An equation has no meaning unless it expresses the thought of God."',
      '"Time bends for those who see beyond."',
      '"I shall grant thee a moment more, use it wisely."',
    ],
  },
];

interface MedievalAdvisorsProps {
  compact?: boolean;
  onAdvisorTap?: (advisor: Advisor) => void;
}

export function MedievalAdvisors({ compact = false, onAdvisorTap }: MedievalAdvisorsProps) {
  const haptics = useHaptics();
  const { toast } = useToast();
  const [activeSpeech, setActiveSpeech] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const [shardTick, setShardTick] = useState(0);

  // Re-render when shards or profiles update
  useEffect(() => {
    const handler = () => setShardTick((t) => t + 1);
    window.addEventListener('profileUpdated', handler);
    window.addEventListener('advisorShardsUpdated', handler);
    window.addEventListener('gemsUpdated', handler);
    return () => {
      window.removeEventListener('profileUpdated', handler);
      window.removeEventListener('advisorShardsUpdated', handler);
      window.removeEventListener('gemsUpdated', handler);
    };
  }, []);

  const handleTap = (advisor: Advisor) => {
    audioManager.playSFX(advisor.id as any);

    if (onAdvisorTap) {
      onAdvisorTap(advisor);
      return;
    }
    const quote = advisor.quotes[Math.floor(Math.random() * advisor.quotes.length)];
    setActiveSpeech(quote);
    setActiveId(advisor.id);

    setTimeout(() => {
      setActiveSpeech(null);
      setActiveId(null);
    }, 3500);
  };

  // Selected advisor stats
  const selectedLevel = selectedAdvisor ? Number(localStorage.getItem(`hero_${selectedAdvisor.id}_level`) || '0') : 0;
  const selectedShards = selectedAdvisor ? Number(localStorage.getItem(`hero_${selectedAdvisor.id}_shards`) || '0') : 0;
  const selectedShardsNeeded = (selectedLevel + 1) * 10;

  const handleBuyWithGems = () => {
    if (!selectedAdvisor) return;
    const currentGems = Number(localStorage.getItem(STORAGE_KEYS.USER_GEMS) || '0');
    if (currentGems < 50) {
      toast({
        title: 'Not enough gems',
        description: 'You need at least 50 Gems to forge 5 councillor shards.',
        variant: 'destructive',
      });
      return;
    }
    const nextGems = currentGems - 50;
    localStorage.setItem(STORAGE_KEYS.USER_GEMS, String(nextGems));

    const currentShards = Number(localStorage.getItem(`hero_${selectedAdvisor.id}_shards`) || '0');
    const nextShards = currentShards + 5;
    localStorage.setItem(`hero_${selectedAdvisor.id}_shards`, String(nextShards));

    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (uid) {
      void (supabase as any).rpc('award_character_shards', {
        user_uuid: uid,
        char_id: selectedAdvisor.id,
        shards_delta: 5,
      });
      void (supabase as any).rpc('award_currency', {
        p_points_delta: -50,
        p_stars_delta: 0,
        p_reason: 'forge_councillor_shards',
      });
    }

    haptics('success');
    window.dispatchEvent(new CustomEvent('gemsUpdated'));
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    window.dispatchEvent(new CustomEvent('advisorShardsUpdated'));
    setShardTick((t) => t + 1);

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    toast({
      title: '✨ Shards Forged!',
      description: `Acquired +5 ${selectedAdvisor.name} Shards!`,
    });
  };

  const handleWatchAdForShards = async () => {
    if (!selectedAdvisor || adLoading) return;
    setAdLoading(true);
    try {
      const res = await showRewarded(3000);
      if (res.rewarded) {
        const currentShards = Number(localStorage.getItem(`hero_${selectedAdvisor.id}_shards`) || '0');
        const nextShards = currentShards + 2;
        localStorage.setItem(`hero_${selectedAdvisor.id}_shards`, String(nextShards));

        const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
        if (uid) {
          void (supabase as any).rpc('award_character_shards', {
            user_uuid: uid,
            char_id: selectedAdvisor.id,
            shards_delta: 2,
          });
        }

        haptics('success');
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        window.dispatchEvent(new CustomEvent('advisorShardsUpdated'));
        setShardTick((t) => t + 1);

        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        toast({
          title: '🎁 Royal Reward!',
          description: `Granted +2 ${selectedAdvisor.name} Shards!`,
        });
      } else {
        toast({
          title: 'Ad closed',
          description: 'Watch the full video to claim shards.',
        });
      }
    } catch (err) {
      console.warn('[Advisors] Shards rewarded ad failed:', err);
    } finally {
      setAdLoading(false);
    }
  };

  const handleAscend = () => {
    if (!selectedAdvisor) return;
    const currentLevel = Number(localStorage.getItem(`hero_${selectedAdvisor.id}_level`) || '0');
    const currentShards = Number(localStorage.getItem(`hero_${selectedAdvisor.id}_shards`) || '0');
    const needed = (currentLevel + 1) * 10;
    if (currentShards < needed) return;

    const nextLevel = currentLevel + 1;
    const remainingShards = currentShards - needed;

    localStorage.setItem(`hero_${selectedAdvisor.id}_level`, String(nextLevel));
    localStorage.setItem(`hero_${selectedAdvisor.id}_shards`, String(remainingShards));

    const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (uid) {
      void (supabase as any).rpc('upgrade_character', {
        user_uuid: uid,
        char_id: selectedAdvisor.id,
      });
    }

    haptics('success');
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    window.dispatchEvent(new CustomEvent('advisorShardsUpdated'));
    setShardTick((t) => t + 1);

    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    toast({
      title: '⚡ COUNCILLOR ASCENDED!',
      description: `${selectedAdvisor.name} is now Level ${nextLevel}!`,
    });
  };

  return (
    <div className="relative">
      {/* Speech bubble - Centered over the advisors block */}
      <AnimatePresence>
        {!onAdvisorTap && activeSpeech && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="absolute -top-24 left-0 right-0 z-30 flex justify-center pointer-events-none"
          >
            <div className="parchment-card rounded-xl px-4 py-2 text-[11px] sm:text-xs italic leading-snug text-center shadow-2xl border border-amber-800/40 bg-[#f4ebd0] text-amber-950 max-w-[280px]">
              {activeSpeech}
            </div>
            <div className="absolute bottom-[-4px] w-2.5 h-2.5 bg-[#f4ebd0] border border-amber-800/40 rotate-45 border-t-0 border-l-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advisor cards */}
      <div className={cn(
        "grid gap-3 sm:gap-4",
        compact ? "grid-cols-4" : "grid-cols-2 md:grid-cols-4"
      )}>
        {ADVISORS.map((advisor, i) => {
          const level = Number(localStorage.getItem(`hero_${advisor.id}_level`) || '0');
          const shards = Number(localStorage.getItem(`hero_${advisor.id}_shards`) || '0');
          const shardsNeeded = (level + 1) * 10;
          const shardPercent = Math.min((shards / shardsNeeded) * 100, 100);
          const canAscend = shards >= shardsNeeded;
          const isActive = activeId === advisor.id;

          return (
            <motion.div
              key={`${advisor.id}-${shardTick}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.28 }}
              className={cn(
                "relative flex flex-col items-center rounded-2xl overflow-hidden transition-all duration-300",
                compact ? "p-3" : "p-4",
                "iron-frame",
                isActive && "ring-2 ring-amber-500/60"
              )}
              style={{ background: `linear-gradient(180deg, hsl(28 15% 12%) 0%, hsl(25 18% 8%) 100%)` }}
              onClick={() => handleTap(advisor)}
            >
              {/* Ambient glow */}
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(circle at 50% 30%, ${advisor.glowColor}, transparent 70%)` }}
              />

              {/* Portrait */}
              <div className={cn(
                "relative z-10 rounded-xl overflow-hidden border-2 shadow-lg cursor-pointer",
                advisor.borderColor,
                compact ? "w-14 h-14" : "w-16 h-16 sm:w-20 sm:h-20"
              )}>
                <img
                  src={advisor.portrait}
                  alt={advisor.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Level badge */}
                <div className="absolute -bottom-0.5 inset-x-0 bg-black/75 text-center">
                  <span className="text-[8px] font-black text-yellow-400 tracking-wider">
                    LV.{level}
                  </span>
                </div>
              </div>

              {/* Name & title */}
              <div className={cn("relative z-10 text-center cursor-pointer", compact ? "mt-1" : "mt-2")}>
                <p className={cn(
                  "font-black text-amber-100 leading-tight font-serif",
                  compact ? "text-[10px]" : "text-[12px]"
                )}>
                  {advisor.name}
                </p>
                {!compact && (
                  <p className="text-[10px] text-stone-400 mt-0.5 italic truncate max-w-[125px]">
                    {advisor.title}
                  </p>
                )}
              </div>

              {/* Shard progress bar and + button */}
              {!compact && (
                <div className="relative z-10 w-full mt-2">
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", advisor.accentColor)}
                      initial={{ width: 0 }}
                      animate={{ width: `${shardPercent}%` }}
                      transition={{ delay: 0.15 + i * 0.05, duration: 0.5 }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 px-0.5">
                    <span className="text-[9px] font-bold text-amber-200/75 tracking-wide">
                      {shards}/{shardsNeeded} shards
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics('light');
                        setSelectedAdvisor(advisor);
                      }}
                      className={cn(
                        "flex items-center justify-center rounded-full w-5 h-5 transition-transform active:scale-90 shadow-md",
                        canAscend 
                          ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 font-black ring-2 ring-yellow-400/80 animate-pulse" 
                          : "bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-950 font-black hover:scale-105"
                      )}
                      title="Add more shards"
                      aria-label="Add shards"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>
              )}

              {/* Ability tag */}
              {!compact && (
                <div className={cn(
                  "relative z-10 mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase",
                  "bg-primary/10 text-primary border border-primary/20"
                )}>
                  {advisor.ability}
                </div>
              )}

              {/* Breathing animation */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0, 0.05, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.7 }}
                style={{ background: `radial-gradient(circle, ${advisor.glowColor}, transparent)` }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── Shard Acquisition Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAdvisor && (
          <div
            className="fixed inset-0 z-[850] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
            onClick={() => setSelectedAdvisor(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(160deg, hsl(38 75% 98%) 0%, hsl(36 60% 93%) 100%)',
                border: '1px solid rgba(180,140,60,0.32)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.85) inset, 0 16px 48px rgba(120,80,20,0.3)',
              }}
            >
              {/* Header */}
              <div
                className="relative px-4 pt-4 pb-3 text-center"
                style={{
                  background: 'linear-gradient(135deg, hsl(38 88% 50%) 0%, hsl(30 92% 44%) 100%)',
                }}
              >
                <button
                  onClick={() => setSelectedAdvisor(null)}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-black/25 active:scale-95 flex items-center justify-center text-white transition-transform"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/40 mx-auto mb-1.5 shadow-md">
                  <img src={selectedAdvisor.portrait} alt={selectedAdvisor.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider drop-shadow-sm">
                  {selectedAdvisor.name}
                </h3>
                <p className="text-amber-100/90 text-[10px] font-semibold italic">
                  {selectedAdvisor.title}
                </p>
                <div className="inline-block mt-1 px-2 py-0.5 rounded-full bg-black/20 text-[9px] font-bold text-amber-100 tracking-wider uppercase">
                  {selectedAdvisor.ability}
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Level & Shard Progress */}
                <div className="rounded-2xl p-3 bg-amber-500/10 border border-amber-600/15">
                  <div className="flex justify-between items-center text-[11px] font-black text-amber-900 mb-1.5">
                    <span>Rank: Level {selectedLevel}</span>
                    <span>{selectedShards} / {selectedShardsNeeded} Shards</span>
                  </div>
                  <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn("h-full rounded-full bg-gradient-to-r", selectedAdvisor.accentColor)}
                      animate={{ width: `${Math.min((selectedShards / selectedShardsNeeded) * 100, 100)}%` }}
                    />
                  </div>
                  {selectedShards >= selectedShardsNeeded && (
                    <p className="text-[10px] font-extrabold text-emerald-700 mt-1.5 text-center flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" /> Ready to Ascend to Level {selectedLevel + 1}!
                    </p>
                  )}
                </div>

                {/* Ascend Button (if ready) */}
                {selectedShards >= selectedShardsNeeded && (
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleAscend}
                    className="w-full py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-1.5"
                    style={{
                      background: 'linear-gradient(135deg, hsl(145 75% 45%) 0%, hsl(155 85% 35%) 100%)',
                      boxShadow: '0 3px 0 hsl(155 85% 25%), 0 6px 16px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    Ascend to Level {selectedLevel + 1}!
                  </motion.button>
                )}

                {/* Shard Options */}
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/60 text-center">
                  Forge Shards
                </p>

                {/* Option 1: Buy with 50 Gems */}
                <button
                  onClick={handleBuyWithGems}
                  className="w-full p-2.5 rounded-2xl border border-amber-600/20 bg-white/80 hover:bg-white active:scale-98 transition-all flex items-center justify-between text-left shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700 font-black text-xs">
                      💎
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-amber-950 leading-tight">
                        Exchange 50 Gems
                      </div>
                      <div className="text-[9px] text-amber-800/60 font-semibold">
                        Receive +5 {selectedAdvisor.name.split(' ')[1]} Shards
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-100 text-amber-800 uppercase tracking-wide">
                    50 💎
                  </span>
                </button>

                {/* Option 2: Watch Ad for 2 Shards */}
                <button
                  onClick={handleWatchAdForShards}
                  disabled={adLoading}
                  className="w-full p-2.5 rounded-2xl border border-amber-600/20 bg-white/80 hover:bg-white active:scale-98 transition-all flex items-center justify-between text-left shadow-sm disabled:opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-700 font-black text-xs">
                      🎬
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-amber-950 leading-tight">
                        Royal Envoy Video
                      </div>
                      <div className="text-[9px] text-amber-800/60 font-semibold">
                        Watch short ad · +2 Shards
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    FREE
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
