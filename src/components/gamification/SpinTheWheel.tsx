import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [activePrizes, setActivePrizes] = useState<Prize[]>(prizes);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const { data, error } = await supabase
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

    let winningIndex = 0;
    
    // Secure Server-side check
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) throw new Error("Must be logged in to spin");

      const { data: serverPrize, error } = await supabase.rpc('process_wheel_spin', { 
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
      setIsSpinning(false);
      return;
    }
    
    // Calculate rotation to land on the winning segment
    const extraSpins = 360 * 5;
    const targetRotation = extraSpins + (360 - (winningIndex * segmentAngle)) - (segmentAngle / 2);
    const variance = (Math.random() - 0.5) * (segmentAngle * 0.8);
    const finalRotation = rotation + targetRotation + variance;

    // Use a small timeout to ensure the `isSpinning: true` state is applied to the DOM 
    // before we change the rotation, so the CSS transition triggers.
    setTimeout(() => {
      setRotation(finalRotation);
    }, 50);

    // Wait for animation to finish
    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(activePrizes[winningIndex]);
      if (onSpinComplete) {
        onSpinComplete(activePrizes[winningIndex]);
      }
    }, 4050); // 4s transition time + 50ms delay
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 z-10 w-0 h-0 
          border-l-[12px] border-r-[12px] border-t-[24px] 
          border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md" 
        />
        
        {/* The Wheel */}
        <div 
          className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'none',
          }}
        >
          {activePrizes.map((prize, index) => {
            const startAngle = index * segmentAngle;
            return (
              <div
                key={prize.id}
                className="absolute w-full h-full top-0 left-0"
                style={{
                  clipPath: `polygon(50% 50%, 100% 0, 100% 50%)`, // Rough approximation for CSS triangle, 
                  // In a real app, conic-gradient is much better for arbitrary slices:
                }}
              />
            );
          })}
          
          {/* Conic Gradient for slices */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${activePrizes.map((p, i) => 
                `${p.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
              ).join(', ')})`
            }}
          />

          {/* Text Labels */}
          {activePrizes.map((prize, index) => {
            const angle = index * segmentAngle + (segmentAngle / 2);
            return (
              <div
                key={`label-${prize.id}`}
                className="absolute w-full h-full flex justify-center items-start pt-4 text-sm font-bold text-gray-800"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: '50% 50%',
                }}
              >
                <span className="block max-w-[80px] text-center truncate drop-shadow-sm">
                  {prize.label}
                </span>
              </div>
            );
          })}

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-inner border-2 border-gray-100 flex items-center justify-center">
            <div className="w-4 h-4 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>

      <div className="text-center min-h-[60px]">
        {wonPrize ? (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <p className="text-lg font-bold text-green-600">You won {wonPrize.label}!</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {canSpin ? "Spin the wheel for a daily prize!" : "Come back tomorrow for another spin!"}
          </p>
        )}
      </div>

      <Button 
        size="lg" 
        onClick={handleSpin} 
        disabled={!canSpin || isSpinning || isLoading}
        className="w-full max-w-xs font-bold"
      >
        {isLoading ? 'Loading...' : isSpinning ? 'Spinning...' : 'Spin Now!'}
      </Button>
    </div>
  );
};
