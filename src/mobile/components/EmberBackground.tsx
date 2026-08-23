import { useMemo } from 'react';

type Ember = {
  id: number;
  size: number;          // px
  left: number;          // % from left
  top: number;           // % from top (starting position)
  color: string;
  dur: number;           // s — animation duration
  delay: number;         // s
  sway: number;          // px — horizontal drift
  flick: number;         // s — flicker speed
};

const EMBER_COLORS = [
  'rgba(255, 200, 80, 0.9)',
  'rgba(255, 160, 40, 0.8)',
  'rgba(255, 220, 120, 0.7)',
  'rgba(255, 140, 50, 0.75)',
  'rgba(255, 240, 180, 0.65)',
  'rgba(240, 120, 30, 0.7)',
];

function buildEmbers(count: number): Ember[] {
  return Array.from({ length: count }, (_, i) => ({
    id:    i,
    size:  Math.random() * 3 + 2,                 // 2–5 px
    left:  Math.random() * 95 + 2,                // 2–97%
    top:   Math.random() * 30 + 65,               // 65–95% (bottom region)
    color: EMBER_COLORS[i % EMBER_COLORS.length],
    dur:   Math.random() * 3 + 3.5,               // 3.5–6.5 s
    delay: Math.random() * 5,                     // 0–5 s stagger
    sway:  (Math.random() * 24 - 12),             // ±12 px
    flick: Math.random() * 0.6 + 0.6,             // 0.6–1.2 s
  }));
}

interface EmberBackgroundProps {
  /** Number of floating embers. Default 22. */
  count?: number;
}

/**
 * Pure CSS animated ember particles — GPU-composited, zero JS per frame.
 * Place this as the first child inside any `position: relative` container.
 * Automatically hidden when `prefers-reduced-motion: reduce` is active
 * (the `.ember-particle` class handles that via index.css).
 */
export function EmberBackground({ count = 22 }: EmberBackgroundProps) {
  // Native WebViews (Android especially) run out of composited-layer budget
  // long before desktop Chrome does, and every extra `will-change` particle
  // adds a full-screen repaint risk. Keep the effect, halve the cost.
  const nativeSafeCount = useMemo(() => {
    let isNative = false;
    try { isNative = Capacitor.isNativePlatform(); } catch { isNative = false; }
    return isNative ? Math.min(count, 8) : count;
  }, [count]);

  // Memoised so the random values don't regenerate on every parent render
  const embers = useMemo(() => buildEmbers(nativeSafeCount), [nativeSafeCount]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden -z-10"
    >

      {embers.map((e) => (
        <span
          key={e.id}
          className="ember-particle"
          style={{
            width:  e.size,
            height: e.size,
            left:   `${e.left}%`,
            top:    `${e.top}%`,
            background: e.color,
            boxShadow: `0 0 ${e.size * 2}px ${e.color}`,
            // CSS custom properties feed the keyframe variables
            '--ember-dur':   `${e.dur}s`,
            '--ember-delay': `${e.delay}s`,
            '--ember-sway':  `${e.sway}px`,
            '--ember-flick': `${e.flick}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default EmberBackground;
