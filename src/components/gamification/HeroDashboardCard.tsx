import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { Shield, Sparkles, Star, User, Lock, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

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
      return "border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-700 bg-slate-900/60";
    }
    switch (hero.level) {
      case 1:
        return "border-amber-800/40 bg-slate-900/90 shadow-md hover:border-amber-700/60";
      case 2:
        return "border-slate-500/40 bg-slate-900/95 shadow-lg shadow-slate-500/5 hover:border-slate-400";
      case 3:
        return "border-cyan-500/40 bg-slate-900 shadow-xl shadow-cyan-500/10 hover:border-cyan-400 border-2";
      case 4:
        return "border-yellow-500 bg-slate-900 shadow-2xl shadow-yellow-500/25 hover:border-yellow-400 border-4 border-double";
      default:
        return "border-slate-850";
    }
  };

  return (
    <div className={cn(
      "w-full rounded-3xl overflow-hidden transition-all duration-300 relative group flex flex-col justify-between border",
      getCardStyle()
    )}>
      
      {/* Top Banner Gradient & Level Badge */}
      <div className={cn("h-2 w-full bg-gradient-to-r", hero.gradient)} />
      
      {/* Level Ribbon */}
      <div className="absolute top-4 right-4 flex items-center justify-center">
        {isLocked ? (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-850 px-2 py-0.5 rounded-full border border-slate-800">
            <Lock className="w-2.5 h-2.5" /> Locked
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/30 animate-pulse">
            Level {hero.level}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Profile and Portrait */}
        <div className="flex gap-4 items-center mb-4">
          {/* Stylized Portrait Token */}
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-md border-2 relative",
            isLocked ? "bg-slate-950 border-slate-800 grayscale" : cn("bg-gradient-to-tr border-yellow-500/30", hero.gradient)
          )}>
            {hero.emoji}
            {!isLocked && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 shadow-sm text-slate-950">
                <Sparkles className="w-2.5 h-2.5 fill-current" />
              </div>
            )}
          </div>

          <div>
            <h4 className="text-white font-extrabold text-base tracking-tight leading-tight">
              {hero.name}
            </h4>
            <p className="text-[10px] text-yellow-500 uppercase tracking-widest font-black mt-0.5">
              {hero.title}
            </p>
          </div>
        </div>

        {/* Lifeline / Special Ability Section */}
        <div className="bg-slate-950/60 rounded-2xl p-3 border border-slate-850 mb-4 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
              LIFELINE
            </span>
            <span className="text-[10px] font-extrabold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
              ⚡ {hero.starCost} Stars
            </span>
          </div>
          <h5 className="text-white text-xs font-bold leading-tight mb-1">
            {hero.abilityName}
          </h5>
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            {hero.abilityDesc}
          </p>
        </div>

        {/* Progress loop: shards */}
        <div className="space-y-2 mt-auto">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
            <span>Character Shards</span>
            <span className={cn(hero.shards >= reqs.shards ? "text-purple-400" : "text-slate-400")}>
              {hero.shards} / {hero.level < 4 ? reqs.shards : 'Max'}
            </span>
          </div>
          {hero.level < 4 && (
            <Progress 
              value={Math.min((hero.shards / reqs.shards) * 100, 100)} 
              className="h-1.5 bg-slate-950 [&>div]:bg-purple-500" 
            />
          )}
        </div>
      </div>

      {/* Action upgrade block */}
      {hero.level < 4 && (
        <div className="p-4 bg-slate-950/40 border-t border-slate-850 flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">
              {isLocked ? 'Unlock Cost' : 'Upgrade Cost'}
            </span>
            <span className="text-xs font-black text-yellow-400 flex items-center gap-1 mt-0.5">
              {reqs.stars > 0 ? (
                <>
                  <Star className="w-3.5 h-3.5 fill-yellow-400/20" />
                  {reqs.stars} Stars
                </>
              ) : (
                'FREE'
              )}
            </span>
          </div>

          <Button
            size="sm"
            onClick={handleUpgrade}
            disabled={loading || !canUpgrade}
            className={cn(
              "font-black text-xs px-4 py-2 rounded-xl shadow-md border-0 uppercase tracking-widest transition-all",
              canUpgrade
                ? "bg-yellow-500 hover:bg-yellow-600 text-slate-950 scale-100 hover:scale-105 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isLocked ? (
              <>Recruit</>
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
