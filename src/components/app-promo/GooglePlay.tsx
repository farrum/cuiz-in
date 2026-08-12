import React, { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.geologon.cuiz';

export const isNativeApp = (() => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
})();

/** Google Play glyph (official triangle mark colors) */
const PlayGlyph: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 512 512" className={className} aria-hidden="true" focusable="false">
    <path fill="#00D2FF" d="M47 20c-6 6-9 15-9 27v418c0 12 3 21 9 27l2 2 234-234v-8L49 18l-2 2z" />
    <path fill="#FFCE00" d="M361 340l-78-78v-8l78-78 2 1 93 53c26 15 26 39 0 54l-93 53-2 3z" />
    <path fill="#FF3A44" d="M363 337l-80-81L47 492c9 9 23 10 39 1l277-156" />
    <path fill="#00E676" d="M363 175L86 20C70 11 56 12 47 21l236 235 80-81z" />
  </svg>
);

interface BadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

/** "Get it on Google Play" badge-style link. */
export const GooglePlayBadge: React.FC<BadgeProps> = ({ className, size = 'md', label }) => (
  <a
    href={PLAY_STORE_URL}
    target="_blank"
    rel="noopener"
    aria-label="Download the CuizIN app on Google Play"
    className={cn(
      'inline-flex items-center gap-3 rounded-xl bg-slate-950 text-white border border-white/15 shadow-lg hover:scale-[1.03] active:scale-95 transition-transform',
      size === 'sm' && 'px-3 py-1.5',
      size === 'md' && 'px-4 py-2.5',
      size === 'lg' && 'px-6 py-3',
      className
    )}
  >
    <PlayGlyph className={cn(size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6')} />
    <span className="flex flex-col leading-none text-left">
      <span className={cn('opacity-70', size === 'sm' ? 'text-[8px]' : 'text-[10px]')}>
        {label ?? 'GET IT ON'}
      </span>
      <span className={cn('font-semibold tracking-tight', size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-base')}>
        Google Play
      </span>
    </span>
  </a>
);

/** Prominent promo card for sections/sidebars. */
export const AppDownloadCard: React.FC<{ className?: string; compact?: boolean }> = ({
  className,
  compact,
}) => {
  if (isNativeApp) return null;
  return (
    <section
      aria-label="Download the CuizIN Android app"
      className={cn(
        'rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 text-white p-5 shadow-xl',
        className
      )}
    >
      <div className={cn('flex gap-4', compact ? 'flex-col items-start' : 'flex-col sm:flex-row sm:items-center sm:justify-between')}>
        <div className="flex items-center gap-3">
          <img
            src="/cuizin-logo.png"
            alt="CuizIN Android app icon"
            width={48}
            height={48}
            loading="lazy"
            className="w-12 h-12 rounded-xl shadow-md"
          />
          <div>
            <h2 className="text-lg font-bold leading-tight">CuizIN app is on Google Play</h2>
            <p className="text-sm text-white/70">
              Play offline-friendly quizzes, daily mini-games and keep your streak alive on your phone.
            </p>
          </div>
        </div>
        <GooglePlayBadge size={compact ? 'md' : 'lg'} className="shrink-0" />
      </div>
    </section>
  );
};

const DISMISS_KEY = 'cuizin_play_store_bar_dismissed';

/** Sticky bottom bar shown on web (mobile + desktop) until dismissed. */
export const AppDownloadStickyBar: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isNativeApp) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-[4.75rem] md:bottom-4 z-[60] px-3 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-slate-950/95 backdrop-blur-md text-white px-3 py-2 shadow-2xl">
        <img
          src="/cuizin-logo.png"
          alt="CuizIN app icon"
          width={36}
          height={36}
          loading="lazy"
          className="w-9 h-9 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">Get the CuizIN app</p>
          <p className="text-[11px] text-white/60 leading-tight truncate">
            Faster play, daily rewards & mini-games
          </p>
        </div>
        <a
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noopener"
          aria-label="Download CuizIN on Google Play"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Install
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss app download banner"
          className="p-1 text-white/50 hover:text-white"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
