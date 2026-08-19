import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Gem } from 'lucide-react';

// ── Sparkle particle config ────────────────────────────────────────────────
const PARTICLE_COUNT = 8;
const PARTICLE_COLORS = [
  '#FFD700', // gold
  '#FFA500', // amber
  '#FFFACD', // lemon chiffon
  '#FFE066', // yellow
  '#FFC0CB', // pink-gold
  '#E0C44A', // deep gold
  '#FFFFFF', // white spark
  '#FFD700',
];

type Particle = {
  id: number;
  angle: number; // degrees
  color: string;
  size: number;
  distance: number;
};

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id:       i,
    angle:    (360 / PARTICLE_COUNT) * i + (Math.random() * 30 - 15),
    color:    PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    size:     Math.random() * 3 + 3,  // 3–6 px
    distance: Math.random() * 22 + 22, // 22–44 px
  }));
}

function SparkleParticle({ angle, color, size, distance }: Omit<Particle, 'id'>) {
  const rad = (angle * Math.PI) / 180;
  const tx  = Math.cos(rad) * distance;
  const ty  = Math.sin(rad) * distance;

  return (
    <motion.span
      aria-hidden
      className="absolute pointer-events-none rounded-full"
      style={{
        width:  size,
        height: size,
        background: color,
        top:  '50%',
        left: '50%',
        translateX: '-50%',
        translateY: '-50%',
        boxShadow: `0 0 ${size * 1.5}px ${color}`,
        zIndex: 20,
      }}
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
      exit={{}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

// ── GemCounter ─────────────────────────────────────────────────────────────
export function GemCounter({ value }: { value: number }) {
  const mv      = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [display, setDisplay] = useState(value.toLocaleString());
  const [pop,     setPop]     = useState(false);
  const [glow,    setGlow]    = useState(false);
  const [burst,   setBurst]   = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prevRef = useRef(value);

  // Respect prefers-reduced-motion
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.75, ease: 'easeOut' });
    const unsub    = rounded.on('change', (v) => setDisplay(v));

    if (value > prevRef.current && !reducedMotion) {
      // Particle burst
      setParticles(buildParticles());
      setBurst(true);
      const burstTimer = setTimeout(() => {
        setBurst(false);
        setParticles([]);
      }, 600);

      // Scale pop
      setPop(true);
      const popTimer = setTimeout(() => setPop(false), 400);

      // Glow ring
      setGlow(true);
      const glowTimer = setTimeout(() => setGlow(false), 700);

      prevRef.current = value;
      return () => {
        controls.stop(); unsub();
        clearTimeout(burstTimer);
        clearTimeout(popTimer);
        clearTimeout(glowTimer);
      };
    }

    prevRef.current = value;
    return () => { controls.stop(); unsub(); };
  }, [value, mv, rounded, reducedMotion]);

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      animate={pop ? { scale: [1, 1.18, 1] } : { scale: 1 }}
      transition={{ duration: 0.38, type: 'spring', stiffness: 420, damping: 18 }}
      className="relative flex items-center gap-2 rounded-full px-4 py-1.5 bg-card border-2 border-white overflow-visible"
      style={{
        boxShadow: glow
          ? '0 4px 0 rgba(0,0,0,0.1), 0 0 0 4px rgba(255,210,60,0.45), 0 0 18px rgba(255,185,0,0.55)'
          : '0 4px 0 rgba(0,0,0,0.1)',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      {/* CSS shimmer — GPU-composited, zero JS per frame */}
      <span
        aria-hidden
        className="absolute inset-0 pointer-events-none gem-shimmer rounded-full"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* Gem icon + particle origin */}
      <span className="relative z-10 flex items-center">
        <Gem
          className="w-5 h-5 text-quiz-gold drop-shadow-sm fill-quiz-gold"
          strokeWidth={2}
        />

        {/* Burst particles */}
        <AnimatePresence>
          {burst && particles.map((p) => (
            <SparkleParticle key={p.id} {...p} />
          ))}
        </AnimatePresence>
      </span>

      {/* Animated count */}
      <span className="font-bold text-sm text-foreground relative z-10 tabular-nums tracking-wide">
        {display}
      </span>
    </motion.div>
  );
}

export default GemCounter;