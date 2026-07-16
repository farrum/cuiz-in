import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Gem } from 'lucide-react';

export function GemCounter({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(value.toLocaleString());

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' });
    const unsub = rounded.on('change', (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value, mv, rounded]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className="relative flex items-center gap-2 rounded-full px-4 py-1.5 bg-card border-2 border-white shadow-[0_4px_0_rgba(0,0,0,0.1)] overflow-hidden"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
      />
      <Gem className="w-5 h-5 text-quiz-gold relative z-10 drop-shadow-sm fill-quiz-gold" strokeWidth={2} />
      <span className="font-bold text-sm text-foreground relative z-10 tabular-nums tracking-wide">{display}</span>
    </motion.div>
  );
}

export default GemCounter;