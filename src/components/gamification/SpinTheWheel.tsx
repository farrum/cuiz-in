import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { useMiniGameVideoAd } from '@/hooks/useMiniGameVideoAd';

interface Prize {
  id: string;
  label: string;
  color: string;
  value: number;
}

const defaultPrizes: Prize[] = [
  { id: '1', label: '1 Gem', color: '#fef08a', value: 10 },
  { id: '2', label: '50 Gems', color: '#fca5a5', value: 50 },
  { id: '3', label: 'Try Again', color: '#e5e7eb', value: 0 },
  { id: '4', label: '100 Gems', color: '#86efac', value: 100 },
  { id: '5', label: '25 Gems', color: '#93c5fd', value: 25 },
  { id: '6', label: 'Jackpot!', color: '#c084fc', value: 500 },
];

interface SpinTheWheelProps {
  prizes?: Prize[];
  onSpinComplete?: (prize: Prize) => void;
  canSpin?: boolean;
}

export const SpinTheWheel: React.FC<SpinTheWheelProps> = ({
  prizes = defaultPrizes,
  onSpinComplete,
  canSpin = true,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const { showVideoAd, adElement } = useMiniGameVideoAd();
  const [activePrizes, setActivePrizes] = useState<Prize[]>(prizes);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('gamification_settings')
        .select('config')
        .eq('setting_type', 'wheel_prizes')
        .single();
        
      if (data && data.config) {
        setActivePrizes(data.config as Prize[]);
      }
    } catch (err) {
      console.error('Failed to load dynamic prizes, falling back to defaults', err);
    } finally {
      setIsLoading(false);
    }
  };

  const numSegments = activePrizes.length;
  const segmentAngle = 360 / numSegments;

  const handleSpin = async () => {
    if (!canSpin || isSpinning || isLoading) return;

    setIsSpinning(true);
    setWonPrize(null);

    // Initial continuous fast rotation to show immediate feedback!
    // We add 10 full spins, which it will start doing while awaiting the server.
    const initialSpin = rotation + 360 * 10;
    setRotation(initialSpin);

    let winningIndex = 0;
    
    // Secure Server-side check
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Must be logged in to spin");

      const { data: serverPrize, error } = await (supabase as any).rpc('process_wheel_spin', { 
        user_uuid: session.session.user.id 
      });

      if (error) throw error;
      if (serverPrize && serverPrize.error) {
        throw new Error(serverPrize.error);
      }

      // Find the index of the prize returned by the server
      const foundIndex = activePrizes.findIndex(p => p.id === serverPrize.id);
      winningIndex = foundIndex >= 0 ? foundIndex : 0;
      
    } catch (err: any) {
      console.error("Spin failed:", err);
      toast({ title: 'Spin Failed', description: err.message || 'Something went wrong', variant: 'destructive' });
      // Reset spinning state
      setIsSpinning(false);
      // Snap back to stop the infinite spin
      setRotation(rotation);
      return;
    }
    
    // Calculate rotation to land EXACTLY on the winning segment
    const extraSpins = 360 * 5;
    // We base the calculation on the original rotation to avoid jumping from the initialSpin
    // Align top pointer (0 deg) to winning index
    const targetAngle = extraSpins + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2);
    // Add some random variance so it doesn't land exactly in the center every time
    const variance = (Math.random() - 0.5) * (segmentAngle * 0.8);
    const finalRotation = rotation + targetAngle + variance;

    // Transition seamlessly to the final targeted landing position
    setRotation(finalRotation);

    // Wait for animation to finish (the duration is set to 4 seconds)
    setTimeout(() => {
      setIsSpinning(false);
      showVideoAd(() => {
        setWonPrize(activePrizes[winningIndex]);
        if (onSpinComplete) {
          onSpinComplete(activePrizes[winningIndex]);
        }
      });
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="relative w-72 h-72 md:w-80 md:h-80 my-4">
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />

        {/* Pointer at the Top */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-20 w-0 h-0 
            border-l-[14px] border-r-[14px] border-t-[28px] 
            border-l-transparent border-r-transparent border-t-rose-500 drop-shadow-[0_4px_6px_rgba(244,63,94,0.4)]"
          style={{ transformOrigin: 'top center' }}
        />
        
        {/* The Outer Rim */}
        <div className="w-full h-full rounded-full border-[8px] border-slate-800 bg-slate-900 shadow-2xl p-1 relative flex items-center justify-center">
          
          {/* Inner Spinning Wheel powered by Framer Motion */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ 
              duration: isSpinning ? 4 : 0, 
              ease: isSpinning ? [0.15, 0.85, 0.2, 1] : "linear" 
            }}
            className="w-full h-full rounded-full overflow-hidden relative shadow-inner"
            style={{
              background: `conic-gradient(${activePrizes.map((p, i) => 
                `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ')})`
            }}
          >
            {/* Draw Divider Lines between slices for better visibility */}
            {activePrizes.map((_, index) => {
              const lineAngle = index * segmentAngle;
              return (
                <div
                  key={`line-${index}`}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-slate-800/20 origin-bottom"
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
                  className="absolute w-full h-full flex justify-center items-start pt-4 text-xs font-bold text-slate-800"
                  style={{
                    transform: `rotate(${textAngle}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  <span className="block max-w-[75px] text-center font-extrabold truncate drop-shadow-sm select-none text-[13px]">
                    {prize.label}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* Premium Glowing Hub in the center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-slate-800 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-4 border-slate-700 flex items-center justify-center z-10">
            <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-full shadow-inner flex items-center justify-center animate-spin [animation-duration:8s]">
              <span className="text-[10px] select-none">💎</span>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Announcement */}
      <div className="text-center min-h-[60px] flex items-center justify-center w-full">
        {wonPrize ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <p className="font-extrabold text-xl text-emerald-500 drop-shadow-sm">
              🎉 You won {wonPrize.label}!
            </p>
          </motion.div>
        ) : (
          !isSpinning && (
            <p className="text-sm text-slate-500 font-medium">
              {canSpin ? "Spin the fortune wheel for a daily prize!" : "Come back tomorrow for another spin!"}
            </p>
          )
        )}
      </div>

      <Button 
        size="lg" 
        onClick={handleSpin} 
        disabled={!canSpin || isSpinning || isLoading}
        className={cn(
          "w-full max-w-xs font-extrabold text-base transition-all duration-200",
          canSpin && !isSpinning && !isLoading 
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]"
            : ""
        )}
      >
        {isLoading ? 'Loading...' : isSpinning ? 'Spinning...' : 'Spin Now!'}
      </Button>
      {adElement}
    </div>
  );
};
