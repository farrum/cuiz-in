import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Shield, Sparkles, Star, User, Lock, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { TorchSparks } from '@/mobile/components/TorchSparks';

export interface HeroData {
  id: string; // 'socrates', 'aryabhata', 'chanakya', 'ramanujan'
  name: string;
  emoji: string;
  gradient: string;
  title: string;
  abilityName: string;
  abilityDesc: string;
  starCost: number;
  level: number; // 0 = locked, 1+ unlocked
  shards: number;
}

interface HeroDashboardCardProps {
  hero: HeroData;
  userId: string | null;
  onRefresh: () => void;
}

export const HeroDashboardCard: React.FC<HeroDashboardCardProps> = ({
  hero,
  userId,
  onRefresh
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const haptics = useHaptics();

  // Requirements for levels:
  // Level 0 -> 1: 10 shards, 0 Stars
  // Level 1 -> 2: 20 shards, 100 Stars
  // Level 2 -> 3: 50 shards, 250 Stars
  // Level 3 -> 4: 100 shards, 500 Stars (Max level 4)
  const getLevelRequirements = (lvl: number) => {
    switch (lvl) {
      case 0: return { shards: 10, stars: 0, label: 'Unlock' };
      case 1: return { shards: 20, stars: 100, label: 'Level 2' };
      case 2: return { shards: 50, stars: 250, label: 'Level 3' };
      case 3: return { shards: 100, stars: 500, label: 'Level 4' };
      default: return { shards: 9999, stars: 9999, label: 'Max Level' };
    }
  };

  const isLocked = hero.level === 0;
  const reqs = getLevelRequirements(hero.level);
  const canUpgrade = hero.level < 4 && hero.shards >= reqs.shards;
  
  const handleUpgrade = async () => {
    if (!userId) {
      haptics('medium');
      const localStars = Number(localStorage.getItem('quiz_app_user_stars') || '50');
      if (localStars < reqs.stars) {
        toast({ title: 'Treasury Empty', description: `Requires ${reqs.stars} Stars.`, variant: 'destructive' });
        return;
      }
      if (hero.shards < reqs.shards) {
        toast({ title: 'Insufficient Shards', description: `Requires ${reqs.shards} shards.`, variant: 'destructive' });
        return;
      }

      // Deduct stars & shards locally
      localStorage.setItem('quiz_app_user_stars', String(localStars - reqs.stars));
      localStorage.setItem(`hero_${hero.id}_level`, String(hero.level + 1));
      localStorage.setItem(`hero_${hero.id}_shards`, String(hero.shards - reqs.shards));

      haptics('success');
      confetti({ particleCount: 80, spread: 60, colors: ['#eab308', '#a855f7', '#ffffff'] });

      toast({
        title: isLocked ? '🏆 HERO RECRUITED!' : '⚡ HERO LEVELED UP!',
        description: isLocked 
          ? `You have recruited ${hero.name} to your local counsel!`
          : `Leveled ${hero.name} up to Level ${hero.level + 1}!`,
      });

      onRefresh();
      return;
    }

    setLoading(true);
    haptics('medium');

    try {
      const { data, error } = await (supabase as any).rpc('upgrade_character', {
        user_uuid: userId,
        char_id: hero.id
      });

      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast({
          title: 'Upgrade Failed',
          description: result.error,
          variant: 'destructive',
        });
        return;
      }

      // Success!
      haptics('success');
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#eab308', '#a855f7', '#ffffff']
      });

      toast({
        title: isLocked ? '🏆 HERO RECRUITED!' : '⚡ HERO LEVELED UP!',
        description: isLocked 
          ? `You have recruited ${hero.name} to your intellectual counsel!`
          : `Leveled ${hero.name} up to Level ${result.new_level}!`,
      });

      onRefresh();
    } catch (err: any) {
      console.error('Error upgrading character:', err);
      toast({
        title: 'Error',
        description: 'Failed to complete character action.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCardStyle = () => {
    if (isLocked) {
      return "opacity-75 hover:opacity-100 !border-stone-800 bg-stone-900/40";
    }
    switch (hero.level) {
      case 1:
        return "!border-amber-800/40 shadow-md";
      case 2:
        return "!border-stone-500/50 shadow-lg";
      case 3:
        return "!border-cyan-500/40 shadow-xl border-2";
      case 4:
        return "!border-yellow-500 shadow-2xl border-4 border-double";
      default:
        return "";
    }
  };

  return (
    <div className={cn(
      "w-full rounded-3xl overflow-hidden transition-all duration-300 relative group flex flex-col justify-between wooden-door",
      getCardStyle()
    )}>
      
      {/* Dynamic sparks if upgrade available */}
      {canUpgrade && (
        <div className="absolute inset-0 z-0 h-40">
          <TorchSparks count={4} />
        </div>
      )}

      {/* Level Ribbon */}
      <div className="absolute top-4 right-4 flex items-center justify-center z-10">
        {isLocked ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-stone-500 bg-stone-950 px-2 py-0.5 rounded-full border border-stone-800">
            <Lock className="w-2.5 h-2.5" /> Locked
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-800/30 animate-pulse">
            Level {hero.level}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-10">
        {/* Profile and Portrait */}
        <div className="flex gap-4 items-center mb-4">
          {/* Stylized Portrait Token */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 relative iron-frame bg-stone-800",
            isLocked ? "grayscale opacity-50" : "border-yellow-500/30"
          )}>
            {hero.emoji}
            {!isLocked && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-sm text-slate-950">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-stone-100 font-extrabold text-base tracking-tight leading-tight font-serif" style={{ fontFamily: "'Cinzel', serif" }}>
              {hero.name}
            </h4>
            <p className="text-[9px] text-amber-500 uppercase tracking-widest font-black mt-0.5">
              {hero.title}
            </p>
          </div>
        </div>

        {/* Lifeline / Special Ability Section */}
        <div className="bg-stone-950/60 rounded-2xl p-3 border border-stone-850 mb-4 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-stone-500 tracking-wider uppercase">
              COUNSEL POWERS
            </span>
            <span className="text-[10px] font-extrabold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/20">
              ⚡ {hero.starCost} Stars
            </span>
          </div>
          <h5 className="text-stone-200 text-xs font-bold leading-tight mb-1">
            {hero.abilityName}
          </h5>
          <p className="text-[11px] text-stone-400 leading-relaxed font-medium">
            {hero.abilityDesc}
          </p>
        </div>

        {/* Progress loop: shards */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center text-[10px] text-stone-500 font-bold">
            <span>Character Shards</span>
            <span className={cn(hero.shards >= reqs.shards ? "text-amber-400" : "text-stone-500")}>
              {hero.shards} / {hero.level < 4 ? reqs.shards : 'Max'}
            </span>
          </div>
          {hero.level < 4 && (
            <Progress 
              value={Math.min((hero.shards / reqs.shards) * 100, 100)} 
              className="h-1.5 bg-stone-950 [&>div]:bg-amber-500" 
            />
          )}
        </div>
      </div>

      {/* Action upgrade block */}
      {hero.level < 4 && (
        <div className="p-4 bg-stone-950/40 border-t border-stone-850 flex items-center justify-between gap-3 relative z-10">
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold text-stone-500 tracking-wider block">
              {isLocked ? 'Recruit cost' : 'Upgrade cost'}
            </span>
            <span className="text-xs font-black text-amber-500 flex items-center gap-1 mt-0.5">
              {reqs.stars > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-amber-500/20" />
                  {reqs.stars} Stars
                </>
              ) : (
                'FREE'
              )}
            </span>
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (!canUpgrade) {
                toast({
                  title: "Shards Required",
                  description: `Collect Shards by opening chests in the Chest Shop tab. You need ${reqs.shards - hero.shards} more shards to recruit ${hero.name}.`,
                  variant: "default"
                });
                return;
              }
              handleUpgrade();
            }}
            disabled={loading}
            className={cn(
              "font-black text-xs px-4 py-2 rounded-xl shadow-md border-0 uppercase tracking-widest transition-all",
              canUpgrade
                ? "medieval-btn hover:scale-105 active:scale-95 text-stone-950"
                : "bg-stone-950 text-amber-500 border border-amber-500/20 hover:bg-stone-900"
            )}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : isLocked ? (
              canUpgrade ? <>Recruit</> : <>Get Shards</>
            ) : (
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> Upgrade
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
