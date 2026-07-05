import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

export function StarCounter({ value }: { value: number }) {
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
      className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-500/20 border border-yellow-500/40 shadow-sm overflow-hidden"
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        style={{ mixBlendMode: 'overlay' }}
      />
      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/40 relative z-10 animate-pulse" />
      <span className="font-bold text-xs text-yellow-100 relative z-10 tabular-nums">{display}</span>
    </motion.div>
  );
}

export default StarCounter;
