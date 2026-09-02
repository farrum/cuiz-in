import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getFeedAd, type AdCreative } from './adProvider';
import { useHaptics } from '@/mobile/hooks/useHaptics';
import { cn } from '@/lib/utils';

interface ScrollAdBannerProps {
  slotId: string;
  position?: string;
  className?: string;
  fallbackIndex?: number;
}

interface DbAdSlot {
  id: string;
  name: string;
  code: string;
  position: string;
  active: boolean;
}

/**
 * High-performance, scroll-activated in-feed banner card for the mobile hub.
 * Loads lazily via IntersectionObserver (250px lookahead) so it never slows down
 * initial page mount or transition animations.
 */
export function ScrollAdBanner({
  slotId,
  position = 'app-banner',
  className,
  fallbackIndex = 0,
}: ScrollAdBannerProps) {
  const navigate = useNavigate();
  const haptics = useHaptics();
  const containerRef = useRef<HTMLDivElement>(null);

  const [hasScrolledIntoView, setHasScrolledIntoView] = useState(false);
  const [dbAd, setDbAd] = useState<DbAdSlot | null>(null);
  const [houseAd, setHouseAd] = useState<AdCreative>(() => getFeedAd(fallbackIndex));
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Trigger lazy-load on scroll via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      setHasScrolledIntoView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasScrolledIntoView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '250px 0px', // Look ahead 250px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 2. Once near viewport, resolve creative from Supabase or fallback pool
  useEffect(() => {
    if (!hasScrolledIntoView) return;

    let isSubscribed = true;

    async function loadCreative() {
      try {
        // Query Supabase for active ad slot configured for this specific position/slotId
        const { data, error } = await supabase
          .from('ad_slots')
          .select('id, name, code, position, active')
          .eq('active', true)
          .or(`position.eq.${slotId},position.eq.${position}`)
          .order('last_updated', { ascending: false })
          .limit(1);

        if (!isSubscribed) return;

        if (!error && data && data.length > 0 && data[0].code) {
          setDbAd(data[0]);
        } else {
          setHouseAd(getFeedAd(fallbackIndex));
        }
      } catch (err) {
        if (isSubscribed) {
          setHouseAd(getFeedAd(fallbackIndex));
        }
      } finally {
        if (isSubscribed) {
          setIsLoaded(true);
        }
      }
    }

    loadCreative();

    return () => {
      isSubscribed = false;
    };
  }, [hasScrolledIntoView, slotId, position, fallbackIndex]);

  const handleClick = (href?: string) => {
    haptics('light');
    if (!href) return;

    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(href);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full rounded-2xl overflow-hidden transition-all duration-300',
        className
      )}
    >
      <AnimatePresence mode="wait">
        {!isLoaded ? (
          // Pre-reserved zero-layout-shift placeholder while scrolling into view
          <div
            key="placeholder"
            className="w-full h-[88px] rounded-2xl bg-amber-900/5 border border-amber-500/10 animate-pulse flex items-center justify-center"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-800/30">
              ⚔️ Royal Dispatch
            </span>
          </div>
        ) : dbAd?.code && dbAd.code.includes('<img') ? (
          // Custom image creative from Supabase ad_slots
          <motion.div
            key="db-ad"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative rounded-2xl overflow-hidden shadow-md border border-amber-500/20 bg-card p-1 text-center"
          >
            <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider bg-black/50 text-amber-300 px-1.5 py-0.5 rounded-full z-10 backdrop-blur-sm">
              Ad
            </span>
            <div
              className="cursor-pointer [&_img]:rounded-xl [&_img]:w-full [&_img]:max-h-28 [&_img]:object-cover"
              dangerouslySetInnerHTML={{ __html: dbAd.code }}
            />
          </motion.div>
        ) : (
          // High-converting styled house / partner creative card
          <motion.div
            key="house-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={() => handleClick(houseAd.href)}
            className={cn(
              'group relative flex items-center justify-between gap-3 p-3.5 rounded-2xl text-white shadow-md cursor-pointer select-none overflow-hidden bg-gradient-to-r',
              houseAd.bg
            )}
            style={{
              boxShadow: '0 4px 14px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.25)',
              borderBottom: '2.5px solid rgba(0,0,0,0.3)',
            }}
          >
            {/* Ambient gloss reflection */}
            <div
              aria-hidden
              className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none"
            />

            {/* Icon / Emoji badge */}
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-black/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl shadow-inner">
              {houseAd.emoji || <Sparkles className="w-5 h-5 text-amber-300" />}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[8px] font-black tracking-wider uppercase bg-black/35 text-amber-300 px-1.5 py-0.5 rounded-full">
                  {houseAd.badge || 'PROMO'}
                </span>
                <p className="text-xs font-black text-white leading-tight truncate">
                  {houseAd.headline}
                </p>
              </div>
              <p className="text-[11px] text-white/85 font-medium leading-snug line-clamp-1">
                {houseAd.body}
              </p>
            </div>

            {/* Call to action button */}
            <div className="shrink-0 flex items-center gap-1 bg-white text-slate-900 font-black text-[11px] px-3 py-2 rounded-xl shadow-sm group-active:scale-95 transition-transform">
              <span>{houseAd.cta}</span>
              {houseAd.href?.startsWith('http') ? (
                <ExternalLink className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScrollAdBanner;
