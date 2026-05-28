import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';

export function ScratchGame() {
  const [revealed, setRevealed] = useState(false);
  const [prize, setPrize] = useState<{ label: string; value: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const haptics = useHaptics();
  const { toast } = useToast();

  const reveal = async () => {
    if (revealed || loading) return;
    setLoading(true); haptics('medium');
    try {
      const { data, error } = await supabase.rpc('process_scratch_card' as any, { p_context: 'daily' });
      const r: any = data;
      if (error || r?.error) {
        toast({ title: 'Already played today?', description: r?.error || error?.message, variant: 'destructive' });
      } else {
        setPrize({ label: r.label, value: r.value || 0 });
        setRevealed(true);
        haptics('success');
        if (r.value > 0) confetti({ particleCount: 100, spread: 70 });
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-6">
      <motion.button
        onClick={reveal} disabled={loading || revealed}
        whileTap={{ scale: 0.96 }}
        className="relative w-64 h-40 rounded-3xl overflow-hidden shadow-2xl"
      >
        {!revealed ? (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
            Tap to scratch
          </div>
        ) : (
          <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="absolute inset-0 bg-card flex flex-col items-center justify-center">
            <p className="text-4xl">🎁</p>
            <p className="font-bold text-xl mt-2">{prize?.label}</p>
            <p className="text-amber-600 font-bold">+{prize?.value} 💎</p>
          </motion.div>
        )}
      </motion.button>
      <p className="text-xs text-muted-foreground mt-4">Daily scratch — one card per day.</p>
    </div>
  );
}