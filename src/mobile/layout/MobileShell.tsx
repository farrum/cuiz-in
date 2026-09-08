import { Outlet, useLocation } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NativeBannerAd } from '../ads/NativeBannerAd';

/**
 * MobileShell — root layout wrapper for all shell routes (Hub, Profile, etc.)
 *
 * Layout stack (top → bottom):
 *   [Status bar]          → paddingTop: var(--safe-top)
 *   [Screen content]      → flex-1 overflow-y-auto scroller
 *   [Banner spacer]       → h-[var(--banner-h)]  (native SDK banner drawn above by BannerHost)
 *   [BottomTabs]          → fixed height ~68px + env(safe-area-inset-bottom)
 *
 * CRITICAL: The outer div uses background-color via CSS variable --shell-bg
 * so that the background is NEVER white even before JS hydrates.
 * This eliminates the white flash on navigation.
 */
export function MobileShell() {
  const location = useLocation();

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        paddingTop: 'var(--safe-top)',
        // Use the CSS variable so this color is applied from the very first paint.
        // inline style takes priority over any Tailwind bg that might lag.
        backgroundColor: 'var(--shell-bg, hsl(38 65% 94%))',
        // Polished living parchment gradient — set directly so it's synchronous with first render.
        background: 'linear-gradient(160deg, hsl(40 62% 95%) 0%, hsl(36 55% 92%) 40%, hsl(210 40% 93%) 100%)',
      }}
    >
      {/* Subtle ambient texture overlay — gives depth without affecting bg color */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(180,140,60,0.06) 0px, rgba(180,140,60,0.06) 1px, transparent 1px, transparent 28px)',
        }}
      />

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10">
        {/* No AnimatePresence exit: waiting for an outgoing screen to animate
            away leaves a blank pane between routes. The new screen fades in only. */}
        <div className="min-h-full">
          <ErrorBoundary compact resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      {/* Banner space reservation + house-promo fallback */}
      <NativeBannerAd />

      {/* Bottom navigation */}
      <BottomTabs />
    </div>
  );
}

export default MobileShell;