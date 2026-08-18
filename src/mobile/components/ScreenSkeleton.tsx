import { Shield } from 'lucide-react';

/**
 * Lightweight in-pane loading placeholder used while a lazy route chunk
 * loads. Keeps the shell (tabs + banner) on screen instead of replacing the
 * whole viewport with the full-screen splash.
 *
 * The Shield uses CSS `animate-spin` (transform: rotate) rather than a
 * framer-motion `rotate` keyframe — GPU-composited, no layout reflow on
 * Android WebView.
 */
export function ScreenSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading">
      {/* CSS-spin shield — zero JS overhead, no layout reflow */}
      <div className="flex justify-center pt-2 pb-1">
        <Shield
          className="w-8 h-8 text-amber-300/70 animate-spin"
          style={{ animationDuration: '2.2s', animationTimingFunction: 'ease-in-out' }}
          strokeWidth={1.5}
        />
      </div>


      {/* Warm amber shimmer skeleton rows */}
      {[{ h: 'h-24', w: 'full', delay: 0 }, { h: 'h-16', w: 'full', delay: 100 }, { h: 'h-16', w: 'full', delay: 200 }, { h: 'h-16', w: 'full', delay: 300 }].map(({ h, delay }, i) => (
        <div
          key={i}
          className={`${h} w-full rounded-2xl animate-pulse`}
          style={{
            background: `linear-gradient(90deg, hsl(38 55% 92%) 0%, hsl(38 70% 96%) 50%, hsl(38 55% 92%) 100%)`,
            backgroundSize: '200% 100%',
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export default ScreenSkeleton;