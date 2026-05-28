import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { useToast } from '@/hooks/use-toast';

export function WheelGame() {
  const haptics = useHaptics();
  const { toast } = useToast();
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [prize, setPrize] = useState<string | null>(null);
  const uid = localStorage.getItem(STORAGE_KEYS.USER_ID);

  const spin = async () => {
    if (!uid) { toast({ title: 'Sign in required' }); return; }
    setSpinning(true);
    haptics('medium');
    setAngle((a) => a + 1080 + Math.random() * 360);
    try {
      const { data, error } = await supabase.rpc('process_wheel_spin' as any, { user_uuid: uid });
      const r: any = data;
      if (error || r?.error) {
        toast({ title: 'Spin failed', description: r?.error || error?.message, variant: 'destructive' });
      } else {
        setPrize(`${r.label} (+${r.value || 0} 💎)`);
        haptics('success');
        if ((r.value || 0) > 0) confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 } });
      }
    } finally {
      setTimeout(() => setSpinning(false), 2400);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-6">
      <motion.div
        animate={{ rotate: angle }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
        className="w-64 h-64 rounded-full border-8 border-emerald-400 bg-gradient-conic from-emerald-400 via-teal-500 to-emerald-400 shadow-2xl flex items-center justify-center text-5xl"
        style={{ background: 'conic-gradient(from 0deg, #34d399, #14b8a6, #0ea5e9, #a855f7, #f59e0b, #ef4444, #34d399)' }}
      >🎡</motion.div>
      <button
        onClick={spin} disabled={spinning}
        className="mt-8 rounded-2xl px-8 py-3.5 font-bold text-primary-foreground bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg disabled:opacity-60"
      >{spinning ? 'Spinning…' : 'Spin (1/day)'}</button>
      {prize && <p className="mt-4 font-bold text-lg">🎉 {prize}</p>}
    </div>
  );
}