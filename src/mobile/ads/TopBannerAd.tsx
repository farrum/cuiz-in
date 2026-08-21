import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getAdPool, type AdCreative } from "./adProvider";
import { getAdSlotsByPosition } from "@/utils/adService";
import SimpleAdBanner from "@/components/ads/SimpleAdBanner";
import { Capacitor } from "@capacitor/core";
import { NativeBannerAd } from "./NativeBannerAd";
import { isAdMobBannerShown } from "./admob";

// Rotate house creatives slowly — fast swaps read as the screen "blinking".
const REFRESH_MS = 30000;

/**
 * Thin banner ad (rendered at the bottom, above the tab bar) that
 * refreshes its creative every 30 seconds.
 * Renders nothing when no creative is available for the current user.
 */
interface TopBannerAdProps {
  noMargin?: boolean;
}

export function TopBannerAd({ noMargin = false }: TopBannerAdProps) {
  const [pool] = useState<AdCreative[]>(() => getAdPool("banner"));
  const [index, setIndex] = useState(0);
  const [hasDbAd, setHasDbAd] = useState(false);


  useEffect(() => {
    const dbAds = getAdSlotsByPosition("app-banner");
    setHasDbAd(dbAds && dbAds.length > 0);
  }, []);


  useEffect(() => {
    // Only rotate the house-creative pool when that branch is actually
    // rendered; when a DB ad is shown the timer just caused pointless
    // re-renders of the banner.
    if (hasDbAd || pool.length <= 1) return;
    const t = window.setInterval(() => setIndex((i) => i + 1), REFRESH_MS);
    return () => window.clearInterval(t);
  }, [pool.length, hasDbAd]);

  const marginClass = noMargin ? "" : "mb-1";

  if (Capacitor.isNativePlatform()) {
    // On native builds, the banner is persistent. Always render the spacer immediately on mount.
    return <div className="shrink-0" style={{ height: 'var(--banner-h, 50px)' }} />;
  }

  if (hasDbAd) {
    return (
      <div className={`px-3 py-1.5 max-h-16 overflow-hidden ${marginClass}`}>
        <SimpleAdBanner position="app-banner" className="rounded-lg overflow-hidden max-h-12" />
      </div>
    );
  }

  if (pool.length === 0) return null;
  const ad = pool[index % pool.length];

  return (
    <div className={`px-3 py-1.5 ${marginClass}`}>
      {/*
        AnimatePresence cross-fades between creatives when the rotation
        index changes. Fixed height on the outer div prevents the banner
        slot from jumping during the transition.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.a
          key={index % pool.length}
          href={ad.href || undefined}
          target={ad.href ? "_blank" : undefined}
          rel={ad.href ? "noopener noreferrer" : undefined}
          className={`relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-gradient-to-r ${ad.bg} text-white shadow-sm overflow-hidden`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="absolute top-0.5 right-0.5 text-[7px] font-bold uppercase bg-black/30 px-1 py-0.5 rounded">
            {ad.sample ? "Sample Ad" : "Ad"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold leading-tight truncate">{ad.headline}</p>
            <p className="text-[10px] opacity-90 leading-tight truncate">{ad.body}</p>
          </div>
          <span className="shrink-0 text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">{ad.cta}</span>
        </motion.a>
      </AnimatePresence>
    </div>
  );
}

export default TopBannerAd;
