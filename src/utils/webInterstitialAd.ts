import { Capacitor } from '@capacitor/core';

const SCRIPT_SRC = '//dcbbwymp1bhlf.cloudfront.net/?wbbcd=1569107';
const MIN_GAP_MS = 20_000; // don't fire more often than every 20s

let lastFired = 0;

const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

/**
 * Loads the web interstitial ad network script.
 * Web only — never runs inside the native (Capacitor) app.
 */
export const triggerWebInterstitial = (): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isNative() || import.meta.env.VITE_PLATFORM === 'mobile') return;

  const now = Date.now();
  if (now - lastFired < MIN_GAP_MS) return;
  lastFired = now;

  try {
    // Remove a previous injection so the network re-initialises for a new impression.
    document
      .querySelectorAll('script[data-web-interstitial="true"]')
      .forEach((el) => el.remove());

    const script = document.createElement('script');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('data-web-interstitial', 'true');
    script.async = true;
    script.src = SCRIPT_SRC;
    script.onerror = () => console.warn('[WebInterstitial] script failed to load');
    document.body.appendChild(script);
  } catch (e) {
    console.warn('[WebInterstitial] injection error', e);
  }
};
