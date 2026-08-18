import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react';

export function GemCounter({ value }: { value: number }) {
  const mv       = useMotionValue(value);
  const rounded  = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(value.toLocaleString());
  const [pop, setPop]         = useState(false);
  const prevRef               = useRef(value);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.75, ease: 'easeOut' });
    const unsub    = rounded.on('change', (v) => setDisplay(v));

    // Trigger a brief scale "pop" when value increases
    if (value > prevRef.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      prevRef.current = value;
      return () => { controls.stop(); unsub(); clearTimeout(t); };
    }
    prevRef.current = value;
    return () => { controls.stop(); unsub(); };
  }, [value, mv, rounded]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      animate={pop ? { scale: [1, 1.12, 1] } : { scale: 1 }}
      transition={{ duration: 0.35, type: 'spring', stiffness: 400, damping: 18 }}
      className="relative flex items-center gap-2 rounded-full px-4 py-1.5 bg-card border-2 border-white shadow-[0_4px_0_rgba(0,0,0,0.1)] overflow-hidden"
    >
      {/*
        Pure CSS shimmer — background-position sweep via a CSS keyframe.
        This is GPU-composited (transform/background-position), causes zero
        JS work per frame, and never triggers layout reflow.
      */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none gem-shimmer"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
      />
      <Gem className="w-5 h-5 text-quiz-gold relative z-10 drop-shadow-sm fill-quiz-gold" strokeWidth={2} />
      <span className="font-bold text-sm text-foreground relative z-10 tabular-nums tracking-wide">{display}</span>
    </motion.div>
  );
}

export default GemCounter;
