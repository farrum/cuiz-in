import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Lightweight in-pane loading placeholder used while a lazy route chunk
 * loads. Keeps the shell (tabs + banner) on screen instead of replacing the
 * whole viewport with the full-screen splash.
 */
export function ScreenSkeleton() {
  return (
    <div className="p-4 space-y-3" aria-busy="true" aria-label="Loading">
      {/* Thematic shield spinner */}
      <div className="flex justify-center pt-2 pb-1">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield className="w-8 h-8 text-amber-300/80" strokeWidth={1.5} />
        </motion.div>
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