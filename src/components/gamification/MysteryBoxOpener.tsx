import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Sparkles, Coins, Star, Ticket, User, Gift, Lock, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';
import { TorchSparks } from '@/mobile/components/TorchSparks';

interface MysteryBoxOpenerProps {
  isOpen: boolean;
  onClose: () => void;
  boxTier: 'bronze' | 'gold' | 'legendary' | null;
  userId: string | null;
  onSuccess?: () => void;
}

interface RewardResult {
  reward_type: string;
  label: string;
  gems: number;
  stars: number;
  tickets: number;
  character_id?: string;
  shards?: number;
}

/* ----------  Local reward generator (guest / RPC-failure fallback) ---------- */
function generateLocalReward(boxTier: 'bronze' | 'gold' | 'legendary'): RewardResult {
  const rand = Math.random();
  const characters = ['socrates', 'aryabhata', 'chanakya', 'ramanujan'];
  const randomChar = characters[Math.floor(Math.random() * characters.length)];

  if (rand < 0.4) {
    const shardsCount = boxTier === 'legendary' ? 25 : boxTier === 'gold' ? 10 : 5;
    return {
      reward_type: 'shards',
      character_id: randomChar,
      shards: shardsCount,
      label: `Discovered ${shardsCount} shards of ${randomChar.toUpperCase()}!`,
      gems: 0, stars: 0, tickets: 0,
    };
  } else if (rand < 0.8) {
    const gemsCount = boxTier === 'legendary' ? 150 : boxTier === 'gold' ? 60 : 20;
    const starsCount = boxTier === 'legendary' ? 40 : boxTier === 'gold' ? 15 : 5;
    return {
      reward_type: 'gems_and_stars',
      gems: gemsCount,
      stars: starsCount,
      label: `Gained +${gemsCount} Gems & +${starsCount} Stars!`,
      tickets: 0,
    };
  } else {
    const ticketsCount = boxTier === 'legendary' ? 5 : boxTier === 'gold' ? 2 : 1;
    return {
      reward_type: 'spin_ticket',
      tickets: ticketsCount,
      label: `Discovered +${ticketsCount} Spin Tickets!`,
      gems: 0, stars: 0,
    };
  }
}

async function creditLocalStorage(result: RewardResult, userId?: string | null) {
  const localStars = Number(localStorage.getItem('quiz_app_user_stars') || '50');
  const localGems = Number(localStorage.getItem('quiz_app_user_gems') || '100');
  localStorage.setItem('quiz_app_user_stars', String(localStars + result.stars));
  localStorage.setItem('quiz_app_user_gems', String(localGems + result.gems));
  if (result.reward_type === 'shards' && result.character_id) {
    const amount = result.shards || 0;
    const currentShards = Number(localStorage.getItem(`hero_${result.character_id}_shards`) || '0');
    localStorage.setItem(`hero_${result.character_id}_shards`, String(currentShards + amount));

    // Persist to the database for signed-in players so upgrades validate server-side
    if (userId && amount > 0) {
      try {
        const { data } = await (supabase as any).rpc('award_character_shards', {
          p_character_id: result.character_id,
          p_amount: amount,
        });
        if (data?.success) {
          const syncedKey = `hero_${result.character_id}_shards_synced`;
          const alreadySynced = Number(localStorage.getItem(syncedKey) || '0');
          localStorage.setItem(syncedKey, String(alreadySynced + amount));
        }
      } catch {
        // keep local credit; the quest page will sync it on next load
      }
    }
  }
}

/* ----------  Component ---------- */
export const MysteryBoxOpener: React.FC<MysteryBoxOpenerProps> = ({
  isOpen,
  onClose,
  boxTier,
  userId,
  onSuccess,
}) => {
  const [status, setStatus] = useState<'idle' | 'shaking' | 'revealed'>('idle');
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const { toast } = useToast();
  const haptics = useHaptics();

  if (!boxTier) return null;

  /* Tier-specific visual config */
  const TIER_CONFIG = {
    bronze: {
      name: 'Bronze Chest',
      bodyGrad: 'from-amber-800 via-amber-700 to-amber-900',
      lidGrad: 'from-amber-700 via-amber-600 to-amber-800',
      bandColor: 'bg-stone-600',
      rivetColor: 'bg-stone-500',
      lockColor: 'text-stone-400',
      glowColor: 'rgba(217,119,6,0.25)',
      borderGlow: 'border-amber-600/40',
      particleColor: 'amber',
    },
    gold: {
      name: 'Golden Vault',
      bodyGrad: 'from-yellow-600 via-amber-500 to-yellow-700',
      lidGrad: 'from-yellow-500 via-amber-400 to-yellow-600',
      bandColor: 'bg-yellow-400/80',
      rivetColor: 'bg-yellow-300',
      lockColor: 'text-yellow-300',
      glowColor: 'rgba(234,179,8,0.35)',
      borderGlow: 'border-yellow-500/50',
      particleColor: 'gold',
    },
    legendary: {
      name: "Emperor's Tomb",
      bodyGrad: 'from-purple-900 via-indigo-800 to-purple-900',
      lidGrad: 'from-purple-700 via-indigo-600 to-purple-800',
      bandColor: 'bg-purple-400/70',
      rivetColor: 'bg-purple-300',
      lockColor: 'text-purple-300',
      glowColor: 'rgba(139,92,246,0.4)',
      borderGlow: 'border-purple-500/60',
      particleColor: 'purple',
    },
  } as const;

  const tier = TIER_CONFIG[boxTier];

  /* ---- Open handler with RPC + fallback ---- */
  const handleOpenChest = async () => {
    if (status !== 'idle') return;
    setLoading(true);
    setStatus('shaking');
    haptics('medium');

    const finalize = (result: RewardResult) => {
      setTimeout(() => {
        setReward(result);
        setStatus('revealed');
        setLoading(false);
        haptics('success');
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
        if (onSuccess) onSuccess();
      }, 2000);
    };

    /* Guest path – always local */
    if (!userId) {
      const result = generateLocalReward(boxTier);
      await creditLocalStorage(result);
      finalize(result);
      return;
    }

    /* Logged-in path – try RPC, fallback to local on failure */
    try {
      const { data, error } = await (supabase as any).rpc('open_mystery_box', {
        user_uuid: userId,
        box_tier: boxTier,
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast({ title: 'Unlock Failed', description: result.error, variant: 'destructive' });
        setStatus('idle');
        setLoading(false);
        return;
      }

      finalize(result);
    } catch {
      // Fallback: generate reward locally so the user is never blocked
      const result = generateLocalReward(boxTier);
      await creditLocalStorage(result);
      finalize(result);
    }
  };

  const handleClaim = () => {
    setStatus('idle');
    setReward(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && status !== 'shaking') handleClaim(); }}>
      <DialogContent className={cn(
        "sm:max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-2 border-primary/20",
      )}>

        <DialogHeader className="text-center pt-4">
          <DialogTitle className="text-2xl font-black text-primary uppercase tracking-wider flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-amber-500" />
            {status === 'revealed' ? 'Treasure Found!' : `Unlocking ${tier.name}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm font-bold">
            {status === 'revealed'
              ? 'The empire has favored your quest!'
              : 'Tap the chest to break the seal and claim your bounty.'}
          </DialogDescription>
        </DialogHeader>

        {/* ---- Chest / Reward Area ---- */}
        <div className="flex flex-col items-center justify-center py-8 relative min-h-[320px]">

          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 55%, ${tier.glowColor} 0%, transparent 65%)`,
            }}
          />

          {/* ===== IDLE: Medieval Chest ===== */}
          {status === 'idle' && (
            <div
              onClick={handleOpenChest}
              className="relative cursor-pointer group select-none"
              role="button"
              aria-label={`Open ${tier.name}`}
            >
              {/* Floating particles */}
              <div className="absolute -inset-6 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-yellow-400/60 animate-float-particle"
                    style={{
                      left: `${15 + Math.random() * 70}%`,
                      top: `${10 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.4}s`,
                      animationDuration: `${2.5 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              {/* ---- Chest Image ---- */}
              <div className="relative flex flex-col items-center">
                <img 
                  src="/chest_asset.jpg" 
                  alt="Mystery Chest"
                  className={cn(
                    "w-48 h-48 object-contain drop-shadow-2xl",
                    "group-hover:scale-105 group-hover:brightness-110 transition-all duration-300",
                    tier.borderGlow
                  )}
                />

                {/* Shadow under chest */}
                <div className="w-36 h-3 mx-auto rounded-full bg-black/40 blur-sm mt-1" />
              </div>

              {/* CTA pill */}
              <div className="mt-4 flex justify-center">
                <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black text-[10px] tracking-[0.2em] px-5 py-1.5 rounded-full shadow-lg uppercase flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-3 h-3" />
                  TAP TO OPEN
                </div>
              </div>
            </div>
          )}

          {/* ===== SHAKING ===== */}
          {status === 'shaking' && (
            <div className="flex flex-col items-center gap-4">
              {/* Shaking chest (simplified) */}
              <div className="relative animate-chest-shake">
                <div className={cn(
                  "w-36 h-12 mx-auto rounded-t-2xl bg-gradient-to-b border-2 border-b-0 animate-lid-rattle",
                  tier.lidGrad, tier.borderGlow
                )}>
                  <div className={cn("absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2", tier.bandColor)} />
                </div>
                <div className={cn(
                  "w-40 h-20 mx-auto rounded-b-xl bg-gradient-to-b border-2 border-t-0",
                  tier.bodyGrad, tier.borderGlow
                )} style={{ marginTop: '-1px' }}>
                  <div className={cn("absolute inset-x-0 top-3 h-1", tier.bandColor)} />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Lock className={cn("w-5 h-5 animate-pulse", tier.lockColor)} />
                  </div>
                </div>
                {/* Spark / energy burst */}
                <div className="absolute -inset-4 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-4 bg-yellow-400/80 rounded-full animate-spark"
                      style={{
                        left: `${20 + i * 12}%`,
                        top: `${30 + Math.random() * 30}%`,
                        animationDelay: `${i * 0.15}s`,
                        transform: `rotate(${-30 + i * 15}deg)`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs font-black tracking-[0.25em] text-yellow-400 uppercase animate-pulse mt-4">
                ⚒ Breaking the Seal ⚒
              </p>
            </div>
          )}

          {/* ===== REVEALED ===== */}
          {status === 'revealed' && reward && (
            <div className="flex flex-col items-center text-center gap-6 animate-scaleIn w-full px-4 relative">
              {/* Magical TorchSparks rising from behind the reward */}
              <div className="absolute inset-0 z-0 h-40">
                <TorchSparks count={10} />
              </div>

              {/* Radiant background rays */}
              <div className="absolute inset-0 pointer-events-none z-0"
                style={{
                  background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${tier.glowColor} 15deg, transparent 30deg, transparent 45deg, ${tier.glowColor} 60deg, transparent 75deg, transparent 90deg, ${tier.glowColor} 105deg, transparent 120deg)`,
                  animation: 'spin 8s linear infinite',
                  opacity: 0.35,
                }}
              />

              {/* Reward Card — Parchment look with golden glowing border */}
              <div className="relative z-10 w-full max-w-[260px] scroll-unroll-container animate-[scaleIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)]">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-90 blur shadow-[0_0_25px_rgba(234,179,8,0.5)]" />
                <div className="relative parchment-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border-[3px] border-amber-600">

                  {/* Opened chest icon */}
                  <div className="text-5xl drop-shadow-lg filter mb-1 animate-bounce">👑</div>

                  {reward.reward_type === 'gems_and_stars' && (
                    <div className="flex justify-center gap-6">
                      {reward.gems > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 bg-amber-800/10 rounded-xl flex items-center justify-center text-amber-900 border border-amber-600/30 shadow-md">
                            <Coins className="w-7 h-7 fill-amber-700/20" />
                          </div>
                          <span className="text-[9px] text-amber-900 font-black mt-1.5 uppercase tracking-wider">Gems</span>
                          <span className="text-xl font-black text-amber-950">+{reward.gems}</span>
                        </div>
                      )}
                      {reward.stars > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-14 h-14 bg-amber-800/10 rounded-xl flex items-center justify-center text-amber-900 border border-amber-600/30 shadow-md">
                            <Star className="w-7 h-7 fill-amber-700/20" />
                          </div>
                          <span className="text-[9px] text-amber-900 font-black mt-1.5 uppercase tracking-wider">Stars</span>
                          <span className="text-xl font-black text-amber-950">+{reward.stars}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {reward.reward_type === 'shards' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gradient-to-br from-amber-950/80 to-amber-900/60 rounded-2xl border-2 border-amber-500/40 flex items-center justify-center relative overflow-hidden shadow-lg shadow-amber-950/40">
                        <svg viewBox="0 0 24 24" className="w-9 h-9 text-amber-400 fill-amber-500/20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2 L18 9 L12 22 L6 9 Z" />
                          <path d="M12 2 L12 22" className="opacity-60" />
                          <path d="M6 9 L18 9" className="opacity-60" />
                        </svg>
                        <div className="absolute bottom-0 inset-x-0 bg-amber-600 text-slate-950 font-black text-[8px] text-center py-0.5 uppercase tracking-widest">
                          SHARD
                        </div>
                      </div>
                      <span className="text-[10px] text-amber-900 font-black tracking-[0.2em] uppercase mt-1">
                        {reward.character_id}
                      </span>
                      <span className="text-2xl font-black text-amber-950">
                        +{reward.shards} Shards
                      </span>
                    </div>
                  )}

                  {(reward.reward_type === 'spin_ticket' || reward.reward_type === 'scratch_card') && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-amber-800/10 rounded-xl flex items-center justify-center text-amber-900 border border-amber-600/30 shadow-md">
                        <Ticket className="w-7 h-7" />
                      </div>
                      <span className="text-[9px] text-amber-900 font-black mt-1 uppercase tracking-wider">Royal Decree</span>
                      <span className="text-xl font-black text-amber-950">+{reward.tickets} {reward.reward_type === 'spin_ticket' ? 'Spin' : 'Scratch'}</span>
                    </div>
                  )}

                  {reward.reward_type === 'spin_scratch_bundle' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-amber-800/10 rounded-xl flex items-center justify-center text-amber-900 border border-amber-600/30 shadow-md">
                        <Gift className="w-7 h-7" />
                      </div>
                      <span className="text-[9px] text-amber-900 font-black mt-1 uppercase tracking-wider">Royal Bundle</span>
                      <span className="text-sm font-black text-amber-950">2 Spins & 2 Scratches</span>
                    </div>
                  )}

                  <p className="text-xs font-bold text-stone-700 mt-2 italic leading-relaxed">{reward.label}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Claim Footer */}
        {status === 'revealed' && (
          <div className="p-4 border-t border-muted bg-slate-50 flex justify-center">
            <Button
              onClick={handleClaim}
              className="btn-3d btn-3d-primary text-white font-black px-10 py-4 rounded-xl text-sm uppercase tracking-[0.1em] shadow-lg border-0"
            >
              Claim Treasure
            </Button>
          </div>
        )}
      </DialogContent>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-8deg); }
          30% { transform: rotate(6deg); }
          45% { transform: rotate(-4deg); }
          60% { transform: rotate(3deg); }
          75% { transform: rotate(-2deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out infinite;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes scaleIn {
          from { transform: scale(0.6); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes chest-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10% { transform: translateX(-4px) rotate(-2deg); }
          20% { transform: translateX(4px) rotate(2deg); }
          30% { transform: translateX(-6px) rotate(-3deg); }
          40% { transform: translateX(6px) rotate(3deg); }
          50% { transform: translateX(-4px) rotate(-2deg); }
          60% { transform: translateX(4px) rotate(2deg); }
          70% { transform: translateX(-3px) rotate(-1deg); }
          80% { transform: translateX(3px) rotate(1deg); }
          90% { transform: translateX(-1px) rotate(0deg); }
        }
        .animate-chest-shake {
          animation: chest-shake 0.6s ease-in-out infinite;
        }
        @keyframes lid-rattle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-3px) rotate(-1deg); }
          50% { transform: translateY(0) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(1deg); }
        }
        .animate-lid-rattle {
          animation: lid-rattle 0.35s ease-in-out infinite;
        }
        @keyframes float-particle {
          0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 1; transform: translateY(-12px) scale(1); }
        }
        .animate-float-particle {
          animation: float-particle 3s ease-in-out infinite;
        }
        @keyframes spark {
          0% { opacity: 1; transform: scaleY(1); }
          50% { opacity: 0.8; transform: scaleY(1.5); }
          100% { opacity: 0; transform: scaleY(0.3); }
        }
        .animate-spark {
          animation: spark 0.5s ease-out infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Dialog>
  );
};
