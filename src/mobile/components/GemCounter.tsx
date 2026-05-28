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
      className="relative flex items-center gap-2 rounded-full px-4 py-1.5 bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-amber-400/20 border border-amber-400/40 shadow-sm overflow-hidden"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        style={{ mixBlendMode: 'overlay' }}
      />
      <Gem className="w-4 h-4 text-amber-500 relative z-10" />
      <span className="font-bold text-sm text-foreground relative z-10 tabular-nums">{display}</span>
    </motion.div>
  );
}

export default GemCounter;