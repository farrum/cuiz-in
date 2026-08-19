import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Tiered fire levels:
 *   0–2   → cold   (grey, minimal animation)
 *   3–5   → warm   (orange single-flame + glow)
 *   6–9   → hot    (orange + inner yellow flame + stronger glow)
 *   10+   → legendary (blue/purple "dragon fire" + orbit sparks)
 */

type FlameLevel = 'cold' | 'warm' | 'hot' | 'legendary';

function getLevel(streak: number): FlameLevel {
  if (streak >= 10) return 'legendary';
  if (streak >= 6)  return 'hot';
  if (streak >= 3)  return 'warm';
  return 'cold';
}

const LEVEL_CONFIG = {
  cold: {
    outer: 'from-slate-200/60 to-slate-300/60 border-slate-400/30',
    flameColor: 'text-slate-400',
    glowColor: 'rgba(150,150,160,0.5)',
    label: 'text-slate-500',
  },
  warm: {
    outer: 'from-orange-500/15 to-red-500/15 border-orange-500/40',
    flameColor: 'text-orange-500',
    glowColor: 'rgba(255,110,30,0.65)',
    label: 'text-orange-700',
  },
  hot: {
    outer: 'from-red-500/20 to-amber-600/20 border-red-500/50',
    flameColor: 'text-red-500',
    glowColor: 'rgba(255,50,10,0.75)',
    label: 'text-red-700',
  },
  legendary: {
    outer: 'from-violet-600/20 to-blue-600/20 border-violet-500/50',
    flameColor: 'text-violet-400',
    glowColor: 'rgba(140,60,255,0.8)',
    label: 'text-violet-700',
  },
};

// Tiny orbiting spark for legendary tier
function OrbitSpark({ angle }: { angle: number }) {
  return (
    <motion.span
      aria-hidden
      className="absolute w-1 h-1 rounded-full bg-violet-300"
      style={{
        top: '50%',
        left: '50%',
        marginTop: -2,
        marginLeft: -2,
      }}
      animate={{
        rotate:    [angle, angle + 360],
        translateX: [10, 10],
        scale: [1, 1.4, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        rotate:    { duration: 2, repeat: Infinity, ease: 'linear' },
        scale:     { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
        opacity:   { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
}

export function StreakFlame({ streak }: { streak: number }) {
  const level  = getLevel(streak);
  const config = LEVEL_CONFIG[level];
  const isHot  = level === 'hot' || level === 'legendary';
  const isLegendary = level === 'legendary';

  return (
    <motion.div
      whileTap={{ scale: 0.9, rotate: -8 }}
      className={cn(
        'relative flex items-center gap-1.5 rounded-full px-3 py-1.5',
        'bg-gradient-to-r border overflow-visible',
        config.outer,
        'flame-glow',
      )}
      style={{
        '--flame-color': config.glowColor,
      } as React.CSSProperties}
    >
      {/* ── Flame icon stack ── */}
      <span className="relative flex items-center justify-center w-5 h-5">
        {/* Outer base flame */}
        <span className={cn('absolute inset-0 flex items-center justify-center flame-base')}>
          <Flame
            className={cn('w-5 h-5 drop-shadow-sm', config.flameColor)}
            strokeWidth={isHot ? 2.5 : 2}
          />
        </span>

        {/* Inner bright core flame (warm+) */}
        {level !== 'cold' && (
          <span className="absolute inset-0 flex items-center justify-center flame-inner" style={{ transform: 'scale(0.6)' }}>
            <Flame
              className={cn(
                'w-5 h-5',
                isLegendary ? 'text-white' : 'text-amber-200',
              )}
              strokeWidth={3}
              fill={isLegendary ? 'rgba(220,180,255,0.7)' : 'rgba(255,240,100,0.65)'}
            />
          </span>
        )}

        {/* Legendary orbit sparks */}
        {isLegendary && (
          <>
            <OrbitSpark angle={0}   />
            <OrbitSpark angle={120} />
            <OrbitSpark angle={240} />
          </>
        )}
      </span>

      {/* Streak number */}
      <span className={cn('text-sm font-bold tabular-nums', config.label)}>
        {streak}
      </span>

      {/* Legendary crown badge */}
      {isLegendary && (
        <span className="text-[8px] font-black uppercase tracking-widest text-violet-400 ml-0.5">
          🔥
        </span>
      )}
    </motion.div>
  );
}

export default StreakFlame;