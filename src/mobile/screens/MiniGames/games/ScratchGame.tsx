import { useState } from 'react';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Gift } from 'lucide-react';

export function ScratchGame() {
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState<{ label: string; value: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const haptics = useHaptics();
  const { toast } = useToast();
  const { showVideoAd, adElement } = useMiniGameVideoAd();

  const reveal = async () => {
    if (revealed || loading) return;
    setLoading(true); 
    haptics('medium');
    try {
      const { data, error } = await supabase.rpc('process_scratch_card' as any, { p_context: 'daily' });
      const r: any = data;
      if (error || r?.error) {
        toast({ 
          title: 'Already played today?', 
          description: r?.error || error?.message || 'You can only scratch one card per day.', 
          variant: 'destructive' 
        });
      } else {
        showVideoAd(() => {
          setPrize({ label: r.label, value: r.value || 0 });
          setRevealed(true);
          haptics('success');
          if (r.value > 0) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        });
      }
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Something went wrong', 
        variant: 'destructive' 
      });
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full px-4">
      {/* Outer Card Wrapper with Glowing Ambient Background */}
      <div className="relative w-80 h-96 md:w-96 md:h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-orange-500/10 rounded-[2.5rem] blur-2xl pointer-events-none" />
        
        <motion.button
          onClick={reveal}
          disabled={loading || revealed}
          whileTap={{ scale: 0.96 }}
          className="relative w-full h-full rounded-[2.5rem] border-4 border-amber-500/30 overflow-hidden shadow-2xl bg-card transition-all duration-300 focus:outline-none"
        >
          {!revealed ? (
            /* Unrevealed Premium Shimmer Card */
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-6 flex flex-col justify-between items-center text-white">
              {/* Top Row decoration */}
              <div className="flex justify-between items-center w-full opacity-80">
                <Sparkles className="w-6 h-6 animate-pulse text-amber-200" />
                <span className="text-[10px] tracking-widest font-black uppercase bg-white/20 px-3 py-1 rounded-full">
                  DAILY BONUS
                </span>
                <Sparkles className="w-6 h-6 animate-pulse text-amber-200" />
              </div>

              {/* Central Scratch Area Indicator */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center border border-white/20 shadow-inner backdrop-blur-sm">
                  <Gift className="w-10 h-10 text-white animate-bounce" />
                </div>
                <h2 className="text-2xl font-black tracking-tight drop-shadow-md">
                  Tap to Reveal!
                </h2>
                <p className="text-xs text-amber-100 opacity-90 max-w-[200px] text-center leading-relaxed">
                  Scratch and win points, extra gems, or rare items!
                </p>
              </div>

              {/* Shimmer overlay effect */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
                <motion.div 
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                />
              </div>

              {/* Bottom Row */}
              <div className="text-[10px] tracking-widest font-bold opacity-60">
                LUCKY REWARDS
              </div>
            </div>
          ) : (
            /* Revealed Prize Screen */
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className="absolute inset-0 bg-card p-6 flex flex-col justify-between items-center border border-amber-500/20"
            >
              <div className="w-full text-center">
                <span className="text-[10px] tracking-widest font-black text-muted-foreground uppercase">
                  REVEAL RESULT
                </span>
              </div>

              <div className="flex flex-col items-center">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.5 }} 
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>
                <h3 className="font-extrabold text-2xl text-foreground text-center leading-tight mb-2">
                  {prize?.label}
                </h3>
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-transparent bg-clip-text font-black text-4xl mt-2 flex items-center gap-1">
                  +{prize?.value} <span className="text-3xl text-orange-500">💎</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                The rewards have been added directly to your profile.
              </p>
            </motion.div>
          )}
        </motion.button>
      </div>

      <p className="text-[11px] text-muted-foreground mt-4 font-semibold uppercase tracking-wider">
        Daily scratch — reset every 24 hours.
      </p>
      {adElement}
    </div>
  );
}