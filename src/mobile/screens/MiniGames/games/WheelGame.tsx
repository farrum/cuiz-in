import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';
import { MascotPlayer } from '@/mobile/mascots/MascotPlayer';
import { pickCharacter, type Character, type Mood } from '@/mobile/mascots/registry';

interface Prize {
  id: string;
  label: string;
  color: string;
  value: number;
  probability?: number;
}

const defaultPrizes: Prize[] = [
  { id: '1', label: '10 Gems', color: '#fef08a', value: 10 },
  { id: '2', label: '50 Gems', color: '#fca5a5', value: 50 },
  { id: '3', label: 'Try Again', color: '#e5e7eb', value: 0 },
  { id: '4', label: '100 Gems', color: '#86efac', value: 100 },
  { id: '5', label: '25 Gems', color: '#93c5fd', value: 25 },
  { id: '6', label: 'Jackpot!', color: '#c084fc', value: 500 },
];

interface WheelGameProps {
  paidPlay?: boolean;
  chanceLabel?: string;
  onRoundComplete?: () => void;
}

export function WheelGame({ paidPlay = false, chanceLabel = 'Free daily spin', onRoundComplete }: WheelGameProps) {
  const haptics = useHaptics();
  const { toast } = useToast();
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [prize, setPrize] = useState<string | null>(null);
  const [reaction, setReaction] = useState<{ char: Character; mood: Mood } | null>(null);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const [activePrizes, setActivePrizes] = useState<Prize[]>(defaultPrizes);
  const [loading, setLoading] = useState(true);
  const [chanceUsed, setChanceUsed] = useState(false);
  const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_settings')
        .select('config')
        .eq('setting_type', 'wheel_prizes')
        .maybeSingle();
        
      if (data && data.config) {
        setActivePrizes(data.config as unknown as Prize[]);
      }
    } catch (err) {
      console.error('Failed to load dynamic wheel prizes, falling back to defaults', err);
    } finally {
      setLoading(false);
    }
  };

  const numSegments = activePrizes.length;
  const segmentAngle = 360 / numSegments;

  const spin = async () => {
    if (!uid) { 
      toast({ title: 'Sign in required', description: 'Please log in to spin the wheel!' }); 
      return; 
    }
    if (spinning || loading || chanceUsed) return;

    setSpinning(true);
    setPrize(null);
    setReaction(null);
    haptics('medium');

    try {
      const { data, error } = await supabase.rpc('process_wheel_spin' as any, { user_uuid: uid, p_paid: paidPlay });
      const r: any = data;

      if (error || r?.error) {
        toast({ 
          title: 'Spin failed', 
          description: r?.error || error?.message || 'Daily limit reached or server error', 
          variant: 'destructive' 
        });
        setSpinning(false);
        return;
      }

      // Find the index of the won prize
      const foundIndex = activePrizes.findIndex(p => p.id === r.id);
      const winningIndex = foundIndex >= 0 ? foundIndex : 0;
      const wonPrizeObj = activePrizes[winningIndex];

      // Each mounted game represents exactly one granted chance. A replay must
      // be purchased or earned from the parent screen before another spin.
      setChanceUsed(true);

      // landing animation calculation: land EXACTLY in the middle of the segment
      // 1440 degrees = 4 full extra rotations for high velocity feeling
      const extraSpins = 1440;
      // Landing formula: align top pointer (0 deg / 360 deg) to winning index
      const targetAngle = extraSpins + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2);
      const newAngle = angle + targetAngle;

      setAngle(newAngle);

      // Trigger reveal ONLY when wheel finishes spinning (3.2 seconds duration)
      setTimeout(() => {
        setSpinning(false);
        showVideoAd(() => {
          haptics('success');
          
          const labelText = wonPrizeObj.value > 0 ? `${wonPrizeObj.label} (+${wonPrizeObj.value} 💎)` : wonPrizeObj.label;
          setPrize(labelText);

          const value = wonPrizeObj.value || 0;
          setReaction({ 
            char: pickCharacter(), 
            mood: value > 50 ? 'hype' : value > 0 ? 'cheer' : 'sad' 
          });

          if (value > 0) {
            confetti({ 
              particleCount: value > 50 ? 200 : 120, 
              spread: 80, 
              origin: { y: 0.45 } 
            });
          }
          onRoundComplete?.();
        });
      }, 3200);

    } catch (err: any) {
      console.error("Spin error:", err);
      toast({ title: 'Spin error', description: err.message || 'Something went wrong', variant: 'destructive' });
      setSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pb-8 w-full max-w-md mx-auto">
      {/* Dynamic Wheel Container */}
      <div className="relative w-[min(72vw,17rem)] h-[min(72vw,17rem)] md:w-80 md:h-80 mt-6 mb-4">
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />

        {/* Triangle Pointer at the top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 w-0 h-0 
            border-l-[14px] border-r-[14px] border-t-[28px] 
            border-l-transparent border-r-transparent border-t-rose-500 drop-shadow-[0_4px_6px_rgba(244,63,94,0.4)]"
          style={{ transformOrigin: 'top center' }}
        />

        {/* The Outer Rim */}
        <div className="w-full h-full rounded-full border-[10px] border-muted-foreground/20 bg-white panel-3d p-1 relative flex items-center justify-center">
          
          {/* Inner Spinning Wheel */}
          <motion.div
            animate={{ rotate: angle }}
            transition={{ duration: 3.2, ease: [0.15, 0.85, 0.2, 1] }}
            className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
            style={{
              background: `conic-gradient(${activePrizes.map((p, i) => 
                `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ')})`
            }}
          >
            {/* Draw Divider Lines between slices */}
            {activePrizes.map((_, index) => {
              const lineAngle = index * segmentAngle;
              return (
                <div
                  key={`line-${index}`}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-muted-foreground/20 origin-bottom"
                  style={{
                    transform: `rotate(${lineAngle}deg)`,
                    transformOrigin: '50% 100%'
                  }}
                />
              );
            })}

            {/* Radial Segment text labels */}
            {activePrizes.map((prize, index) => {
              const textAngle = index * segmentAngle + (segmentAngle / 2);
              return (
                <div
                  key={`label-${prize.id}`}
                  className="absolute w-full h-full flex justify-center items-start pt-4 text-xs font-bold text-foreground"
                  style={{
                    transform: `rotate(${textAngle}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  <span className="block max-w-[70px] text-center font-extrabold truncate drop-shadow-sm select-none">
                    {prize.label}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Premium Glowing Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-4 border-muted flex items-center justify-center z-10">
            <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-full shadow-inner flex items-center justify-center animate-spin [animation-duration:8s]">
              <span className="text-[10px] select-none">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Button */}
      <button
        onClick={spin} 
        disabled={spinning || loading || chanceUsed}
        className="mt-6 rounded-xl px-10 py-4 font-black uppercase text-base btn-3d btn-3d-primary w-full max-w-[240px]"
      >
        {loading ? 'Loading...' : spinning ? 'Spinning…' : chanceUsed ? 'Chance used' : chanceLabel}
      </button>

      {/* Winner Announcement */}
      <div className="text-center min-h-[50px] mt-4 flex items-center justify-center w-full px-4">
        {prize ? (
          <motion.p 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="font-extrabold text-lg text-emerald-400 drop-shadow-sm"
          >
            🎉 {prize}
          </motion.p>
        ) : (
          !spinning && (
            <p className="text-sm font-bold text-muted-foreground">
              {uid ? "Spin the fortune wheel to win gems!" : "Sign in to play daily!"}
            </p>
          )
        )}
      </div>

      {/* Mascot Reaction popup */}
      <AnimatePresence>
        {reaction && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            className="mt-2"
          >
            <MascotPlayer character={reaction.char} mood={reaction.mood} size={120} />
          </motion.div>
        )}
      </AnimatePresence>
      {adElement}
    </div>
  );
}