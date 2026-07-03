import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Sparkles, Coins, Star, Ticket, User, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

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

export const MysteryBoxOpener: React.FC<MysteryBoxOpenerProps> = ({
  isOpen,
  onClose,
  boxTier,
  userId,
  onSuccess
}) => {
  const [status, setStatus] = useState<'idle' | 'shaking' | 'revealed'>('idle');
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState<RewardResult | null>(null);
  const { toast } = useToast();
  const haptics = useHaptics();

  if (!boxTier) return null;

  const getChestIcon = () => {
    switch (boxTier) {
      case 'bronze':
        return { emoji: '📦', color: 'from-amber-700 to-amber-500', name: 'Bronze Chest' };
      case 'gold':
        return { emoji: '🏆', color: 'from-yellow-600 via-amber-500 to-yellow-500', name: 'Golden Vault' };
      case 'legendary':
        return { emoji: '👑', color: 'from-purple-800 via-indigo-600 to-purple-600', name: "Emperor's Tomb" };
    }
  };

  const chestData = getChestIcon();

  const handleOpenChest = async () => {
    if (status !== 'idle') return;

    setLoading(true);
    setStatus('shaking');
    haptics('medium');

    try {
      if (!userId) {
        // Guest local storage fallback
        const rand = Math.random();
        let result: RewardResult;
        
        const characters = ['socrates', 'aryabhata', 'chanakya', 'ramanujan'];
        const randomChar = characters[Math.floor(Math.random() * characters.length)];

        if (rand < 0.4) {
          // Shards drop
          const shardsCount = boxTier === 'legendary' ? 25 : boxTier === 'gold' ? 10 : 5;
          result = {
            reward_type: 'shards',
            character_id: randomChar,
            shards: shardsCount,
            label: `Discovered ${shardsCount} shards of ${randomChar.toUpperCase()}!`,
            gems: 0, stars: 0, tickets: 0
          };
        } else if (rand < 0.8) {
          // Gems and Stars drop
          const gemsCount = boxTier === 'legendary' ? 150 : boxTier === 'gold' ? 60 : 20;
          const starsCount = boxTier === 'legendary' ? 40 : boxTier === 'gold' ? 15 : 5;
          result = {
            reward_type: 'gems_and_stars',
            gems: gemsCount,
            stars: starsCount,
            label: `Gained +${gemsCount} Gems & +${starsCount} Stars!`,
            tickets: 0
          };
        } else {
          // Ticket drop
          const ticketsCount = boxTier === 'legendary' ? 5 : boxTier === 'gold' ? 2 : 1;
          result = {
            reward_type: 'spin_ticket',
            tickets: ticketsCount,
            label: `Discovered +${ticketsCount} Spin Tickets!`,
            gems: 0, stars: 0
          };
        }

        // Add to guest local storage
        const localStars = Number(localStorage.getItem('quiz_app_user_stars') || '50');
        const localGems = Number(localStorage.getItem('quiz_app_user_gems') || '100');
        
        localStorage.setItem('quiz_app_user_stars', String(localStars + result.stars));
        localStorage.setItem('quiz_app_user_gems', String(localGems + result.gems));
        
        if (result.reward_type === 'shards' && result.character_id) {
          const currentShards = Number(localStorage.getItem(`hero_${result.character_id}_shards`) || '0');
          localStorage.setItem(`hero_${result.character_id}_shards`, String(currentShards + (result.shards || 0)));
        }

        // Keep shaking for 1.8 seconds to build suspense
        setTimeout(() => {
          setReward(result);
          setStatus('revealed');
          setLoading(false);
          haptics('success');
          
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          if (onSuccess) onSuccess();
        }, 1800);
        return;
      }

      // Call Supabase RPC
      const { data, error } = await supabase.rpc('open_mystery_box', {
        user_uuid: userId,
        box_tier: boxTier
      });

      if (error) throw error;
      
      const result = data as any;
      if (result?.error) {
        toast({
          title: 'Unlock Failed',
          description: result.error,
          variant: 'destructive',
        });
        setStatus('idle');
        setLoading(false);
        return;
      }

      // Keep shaking for 1.8 seconds to build suspense
      setTimeout(() => {
        setReward(result);
        setStatus('revealed');
        setLoading(false);
        haptics('success');
        
        // Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        if (onSuccess) onSuccess();
      }, 1800);

    } catch (err: any) {
      console.error('Error opening box:', err);
      toast({
        title: 'Network Error',
        description: 'Failed to contact the empire treasury.',
        variant: 'destructive',
      });
      setStatus('idle');
      setLoading(false);
    }
  };

  const handleClaim = () => {
    // Reset state and close
    setStatus('idle');
    setReward(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && status !== 'shaking') handleClaim(); }}>
      <DialogContent className="sm:max-w-md bg-slate-950 text-white border-2 border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl">
        <DialogHeader className="text-center pt-4">
          <DialogTitle className="text-xl font-black text-yellow-500 uppercase tracking-wider flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-pulse text-yellow-400" />
            {status === 'revealed' ? 'Treasure Found!' : `Unlocking ${chestData.name}`}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            {status === 'revealed' 
              ? 'The gods of the empire have favored your quest!' 
              : 'Tap to crack the seal and reveal what lies inside.'}
          </DialogDescription>
        </DialogHeader>

        {/* Animations Container */}
        <div className="flex flex-col items-center justify-center py-10 relative min-h-[300px]">
          {/* Radiant background rays when chest is opened */}
          {status === 'revealed' && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.15)_0%,transparent_60%)] animate-pulse" />
          )}

          {status === 'idle' && (
            <div 
              onClick={handleOpenChest}
              className={cn(
                "w-44 h-44 rounded-full bg-gradient-to-br flex items-center justify-center text-7xl cursor-pointer shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-yellow-500/20 relative group",
                chestData.color
              )}
            >
              <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span>{chestData.emoji}</span>
              <div className="absolute -bottom-2 bg-yellow-500 text-slate-950 font-black text-[10px] tracking-widest px-3 py-1 rounded-full shadow-md uppercase">
                TAP TO OPEN
              </div>
            </div>
          )}

          {status === 'shaking' && (
            <div className="flex flex-col items-center gap-4">
              {/* Shaking Chest */}
              <div className="text-8xl animate-bounce select-none relative" style={{
                animationDuration: '0.4s',
                transformOrigin: 'bottom center',
              }}>
                <span className="inline-block animate-wiggle">{chestData.emoji}</span>
              </div>
              <p className="text-xs font-black tracking-widest text-yellow-500 uppercase animate-pulse mt-4">
                Breaking Seal...
              </p>
            </div>
          )}

          {status === 'revealed' && reward && (
            <div className="flex flex-col items-center text-center gap-6 animate-scaleIn w-full px-4">
              {/* Reward Icon Card */}
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 opacity-75 blur animate-pulse" />
                <div className="relative bg-slate-900 border-2 border-yellow-500/40 rounded-2xl p-6 min-w-[200px] flex flex-col items-center justify-center gap-3">
                  {reward.reward_type === 'gems_and_stars' && (
                    <div className="flex justify-center gap-4">
                      {reward.gems > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 border border-amber-500/30">
                            <Coins className="w-6 h-6 fill-amber-500/20" />
                          </div>
                          <span className="text-xs text-slate-400 font-bold mt-1">Gems</span>
                          <span className="text-xl font-black text-amber-500">+{reward.gems}</span>
                        </div>
                      )}
                      {reward.stars > 0 && (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 border border-yellow-500/30">
                            <Star className="w-6 h-6 fill-yellow-500/20" />
                          </div>
                          <span className="text-xs text-slate-400 font-bold mt-1">Stars</span>
                          <span className="text-xl font-black text-yellow-400">+{reward.stars}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {reward.reward_type === 'shards' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-purple-500/10 rounded-2xl border-2 border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                        <User className="w-10 h-10 text-purple-400" />
                        <div className="absolute bottom-0 inset-x-0 bg-purple-500 text-white font-black text-[9px] text-center py-0.5 uppercase">
                          SHARDS
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase mt-1">
                        {reward.character_id}
                      </span>
                      <span className="text-2xl font-black text-purple-400">
                        +{reward.shards} Shards
                      </span>
                    </div>
                  )}

                  {(reward.reward_type === 'spin_ticket' || reward.reward_type === 'scratch_card') && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        <Ticket className="w-7 h-7" />
                      </div>
                      <span className="text-xs text-slate-400 font-bold mt-1">Reward Ticket</span>
                      <span className="text-xl font-black text-indigo-400">+{reward.tickets} {reward.reward_type === 'spin_ticket' ? 'Spin' : 'Scratch'}</span>
                    </div>
                  )}

                  {reward.reward_type === 'spin_scratch_bundle' && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 bg-pink-500/10 rounded-full flex items-center justify-center text-pink-400 border border-pink-500/30">
                        <Gift className="w-7 h-7" />
                      </div>
                      <span className="text-xs text-slate-400 font-bold mt-1">Gamer Bundle</span>
                      <span className="text-sm font-black text-pink-400">2 Spins & 2 Scratches</span>
                    </div>
                  )}

                  <p className="text-xs font-semibold text-slate-300 mt-2">
                    {reward.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Claim Footer */}
        {status === 'revealed' && (
          <div className="p-4 bg-slate-900 border-t border-yellow-500/20 flex justify-center">
            <Button
              onClick={handleClaim}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black px-8 py-2.5 rounded-xl text-xs uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 transition-all border-0"
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
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes scaleIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </Dialog>
  );
};
