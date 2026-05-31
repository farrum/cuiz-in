import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdPool, type AdCreative } from './adProvider';

const REFRESH_MS = 30000;

/**
 * Top banner ad that refreshes its creative every 30 seconds.
 * Renders nothing when no creative is available for the current user.
 */
export function TopBannerAd() {
  const [pool] = useState<AdCreative[]>(() => getAdPool('banner'));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pool.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => i + 1), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [pool.length]);

  if (pool.length === 0) return null;
  const ad = pool[index % pool.length];

  return (
    <div className="px-3 pt-2">
      <AnimatePresence mode="wait">
        <motion.a
          key={ad.id + index}
          href={ad.href || undefined}
          target={ad.href ? '_blank' : undefined}
          rel={ad.href ? 'noopener noreferrer' : undefined}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className={`relative flex items-center gap-3 rounded-xl px-3 py-2 bg-gradient-to-r ${ad.bg} text-white shadow-md overflow-hidden`}
        >
          <span className="absolute top-1 right-1 text-[8px] font-bold uppercase bg-black/30 px-1.5 py-0.5 rounded">
            {ad.sample ? 'Sample Ad' : 'Ad'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight truncate">{ad.headline}</p>
            <p className="text-[11px] opacity-90 leading-tight truncate">{ad.body}</p>
          </div>
          <span className="shrink-0 text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
            {ad.cta}
          </span>
        </motion.a>
      </AnimatePresence>
    </div>
  );
}

export default TopBannerAd;