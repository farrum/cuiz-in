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
  userStars?: number;
  onRefresh: () => void;
  onNavigateToShop?: () => void;
}

export const HeroDashboardCard: React.FC<HeroDashboardCardProps> = ({
  hero,
  userId,
  userStars,
  onRefresh,
  onNavigateToShop,
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const haptics = useHaptics();

  // Requirements for levels:
  // Level 0 -> 1: 10 shards, 0 Stars (Unlock)
  // Level 1 -> 2: 20 shards, 100 Stars
  // Level 2 -> 3: 50 shards, 250 Stars
  // Level 3 -> 4: 100 shards, 500 Stars (Max level 4)
  const getLevelRequirements = (lvl: number) => {
    switch (lvl) {
      case 0: return { shards: 10, stars: 0, label: 'Recruit' };
      case 1: return { shards: 20, stars: 100, label: 'Level 2' };
      case 2: return { shards: 50, stars: 250, label: 'Level 3' };
      case 3: return { shards: 100, stars: 500, label: 'Level 4' };
      default: return { shards: 9999, stars: 9999, label: 'Max Level' };
    }
  };

  const currentStars = userStars !== undefined ? userStars : Number(localStorage.getItem('quiz_app_user_stars') || '50');
  const isLocked = hero.level === 0;
  const reqs = getLevelRequirements(hero.level);
  const hasEnoughShards = hero.shards >= reqs.shards;
  const hasEnoughStars = currentStars >= reqs.stars;
  const canUpgrade = hero.level < 4 && hasEnoughShards && hasEnoughStars;
  
  const handleUpgrade = async () => {
    if (!userId) {
      haptics('medium');
      if (currentStars < reqs.stars) {
        toast({ title: 'Treasury Empty', description: `Requires ${reqs.stars} Stars.`, variant: 'destructive' });
        return;
      }
      if (hero.shards < reqs.shards) {
        toast({ title: 'Insufficient Shards', description: `Requires ${reqs.shards} shards.`, variant: 'destructive' });
        return;
      }

      // Deduct stars & shards locally
      localStorage.setItem('quiz_app_user_stars', String(currentStars - reqs.stars));
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
        title: isLocked ? '🏆 COUNSELOR RECRUITED!' : '⚡ COUNSELOR ASCENDED!',
        description: isLocked 
          ? `You have recruited ${hero.name} to your battle counsel!`
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
      return "opacity-85 hover:opacity-100 !border-slate-300 bg-slate-50 transition-all";
    }
    switch (hero.level) {
      case 1:
        return "border-emerald-200 bg-emerald-50 shadow-md";
      case 2:
        return "border-amber-200 bg-amber-50 shadow-lg";
      case 3:
        return "border-cyan-200 bg-cyan-50 shadow-xl border-4";
      case 4:
        return "border-yellow-400 bg-yellow-50 shadow-2xl border-4";
      default:
        return "";
    }
  };

  return (
    <div className={cn(
      "w-full rounded-3xl overflow-hidden transition-all duration-300 relative group flex flex-col justify-between panel-3d border-2 border-primary/20 bg-white shadow-lg",
      getCardStyle()
    )}>
      
      {/* Dynamic sparks if upgrade available */}
      {canUpgrade && (
        <div className="absolute inset-0 z-0 h-40 pointer-events-none">
          <TorchSparks count={4} />
        </div>
      )}

      {/* Level Ribbon */}
      <div className="absolute top-4 right-4 flex items-center justify-center z-10">
        {isLocked ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300 shadow-sm">
            <Lock className="w-2.5 h-2.5" /> Unrecruited
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full border border-primary/20 shadow-md animate-pulse">
            Level {hero.level}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col relative z-10">
        {/* Profile and Portrait */}
        <div className="flex gap-4 items-center mb-4">
          {/* Stylized Portrait Token */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 relative panel-3d bg-white",
            isLocked ? "grayscale opacity-75" : "border-primary/30"
          )}>
            {hero.emoji}
            {!isLocked && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow-sm text-yellow-900 border border-yellow-200">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-foreground font-black text-base tracking-tight leading-tight">
              {hero.name}
            </h4>
            <p className="text-[10px] text-primary uppercase tracking-widest font-black mt-0.5">
              {hero.title}
            </p>
          </div>
        </div>

        {/* Lifeline / Special Ability Section */}
        <div className="bg-muted rounded-2xl p-4 border border-muted-foreground/10 mb-4 flex-1 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black text-muted-foreground tracking-widest uppercase">
              Counsel Powers
            </span>
            <span className="text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 shadow-sm">
              ⚡ {hero.starCost} Stars
            </span>
          </div>
          <h5 className="text-foreground text-sm font-black leading-tight mb-1">
            {hero.abilityName}
          </h5>
          <p className="text-xs text-muted-foreground leading-relaxed font-bold">
            {hero.abilityDesc}
          </p>
        </div>

        {/* Progress loop: shards */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-muted-foreground">Shards Progress</span>
            <span className={cn(hasEnoughShards ? "text-emerald-700 font-extrabold" : "text-amber-700")}>
              {hero.shards} / {hero.level < 4 ? `${reqs.shards} Shards` : 'Max Level'}
            </span>
          </div>
          {hero.level < 4 && (
            <Progress 
              value={Math.min((hero.shards / reqs.shards) * 100, 100)} 
              className="h-2.5 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-amber-500 rounded-full" 
            />
          )}
        </div>
      </div>

      {/* Action upgrade block */}
      {hero.level < 4 && (
        <div className="p-4 bg-slate-900 border-t-2 border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10 rounded-b-3xl text-white">
          <div className="text-left flex-1 min-w-0">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest block">
              {isLocked ? 'Recruit Requirements' : 'Ascension Cost'}
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-black mt-0.5">
              <span className={cn("flex items-center gap-1", hasEnoughShards ? "text-emerald-400" : "text-amber-400")}>
                💎 {hero.shards}/{reqs.shards} Shards
              </span>
              {reqs.stars > 0 && (
                <span className={cn("flex items-center gap-0.5", hasEnoughStars ? "text-yellow-400" : "text-rose-400")}>
                  + <Star className="w-3 h-3 fill-current" /> {reqs.stars} Stars
                </span>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (!hasEnoughShards) {
                toast({
                  title: "💎 Shards Required",
                  description: `Open chests in the Treasury Shop to find Counselor Shards. You need ${reqs.shards - hero.shards} more shards for ${hero.name}.`,
                });
                onNavigateToShop?.();
                return;
              }
              if (!hasEnoughStars) {
                toast({
                  title: "⭐ Stars Required",
                  description: `You need ${reqs.stars} Stars to upgrade. Play Quest Stages or tavern mini-games to earn Stars!`,
                  variant: "destructive"
                });
                return;
              }
              handleUpgrade();
            }}
            disabled={loading}
            className={cn(
              "font-black text-xs px-4 py-3 rounded-xl uppercase tracking-wider transition-all whitespace-nowrap w-full sm:w-auto text-center justify-center flex items-center gap-1.5",
              canUpgrade
                ? "btn-3d btn-3d-primary text-slate-950 shadow-lg ring-2 ring-yellow-400"
                : !hasEnoughShards
                ? "bg-slate-950 border-2 border-amber-500/70 text-amber-300 hover:bg-slate-800 hover:border-amber-400 shadow-md font-black"
                : "bg-slate-950 border-2 border-yellow-500/70 text-yellow-300 hover:bg-slate-800 shadow-md font-black"
            )}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : isLocked ? (
              canUpgrade ? <>🏆 Recruit</> : <>📦 Need Shards</>
            ) : (
              canUpgrade ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 stroke-[3]" /> Upgrade
                </>
              ) : !hasEnoughShards ? (
                <>📦 Need Shards</>
              ) : (
                <>⭐ Need Stars</>
              )
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

