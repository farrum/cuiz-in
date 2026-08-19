import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Star } from 'lucide-react';

// ── Star-shaped sparkle particles ─────────────────────────────────────────
const STAR_COLORS = [
  '#FFD700', '#FFF176', '#FFC107', '#FFFDE7', '#FFB300', '#FFEE58', '#FFFFFF',
];

type Particle = { id: number; angle: number; color: string; size: number; distance: number };

function buildParticles(): Particle[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id:       i,
    angle:    (360 / 7) * i + (Math.random() * 28 - 14),
    color:    STAR_COLORS[i % STAR_COLORS.length],
    size:     Math.random() * 3.5 + 3,
    distance: Math.random() * 20 + 20,
  }));
}

function StarParticle({ angle, color, size, distance }: Omit<Particle, 'id'>) {
  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * distance;
  const ty  = Math.sin(rad) * distance;
  // 5-point star via clip-path
  const starPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
  return (
    <motion.span
      aria-hidden
      className="absolute pointer-events-none"
      style={{
        width: size, height: size,
        background: color,
        clipPath: starPath,
        top: '50%', left: '50%',
        translateX: '-50%', translateY: '-50%',
        boxShadow: `0 0 ${size * 2}px ${color}`,
        zIndex: 20,
      }}
      initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
      animate={{ opacity: 0, x: tx, y: ty, scale: 0, rotate: 180 }}
      exit={{}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

export function StarCounter({ value }: { value: number }) {
  const mv      = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(value.toLocaleString());
  const [pop,     setPop]     = useState(false);
  const [glow,    setGlow]    = useState(false);
  const [burst,   setBurst]   = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevRef = useRef(value);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' });
    const unsub    = rounded.on('change', (v) => setDisplay(v));

    if (value > prevRef.current && !reducedMotion) {
      setParticles(buildParticles());
      setBurst(true);
      const bt = setTimeout(() => { setBurst(false); setParticles([]); }, 680);

      setPop(true);
      const pt = setTimeout(() => setPop(false), 420);

      setGlow(true);
      const gt = setTimeout(() => setGlow(false), 750);

      prevRef.current = value;
      return () => { controls.stop(); unsub(); clearTimeout(bt); clearTimeout(pt); clearTimeout(gt); };
    }
    prevRef.current = value;
    return () => { controls.stop(); unsub(); };
  }, [value, mv, rounded, reducedMotion]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      animate={pop ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.38, type: 'spring', stiffness: 420, damping: 18 }}
      className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 via-amber-400/20 to-yellow-500/20 border overflow-visible"
      style={{
        borderColor: glow ? 'rgba(255,210,30,0.8)' : 'rgba(234,179,8,0.4)',
        boxShadow: glow
          ? '0 0 0 3px rgba(255,210,30,0.35), 0 0 14px rgba(255,185,0,0.5)'
          : 'none',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Shimmer sweep */}
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        style={{ mixBlendMode: 'overlay' }}
      />

      {/* Star icon + particle origin */}
      <span className="relative z-10 flex items-center">
        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/40 relative z-10" />
        <AnimatePresence>
          {burst && particles.map((p) => (
            <StarParticle key={p.id} {...p} />
          ))}
        </AnimatePresence>
      </span>

      <span className="font-bold text-xs text-yellow-100 relative z-10 tabular-nums">
        {display}
      </span>
    </motion.div>
  );
}

export default StarCounter;
