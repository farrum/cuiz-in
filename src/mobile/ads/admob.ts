import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  type BannerAdOptions,
  type AdOptions,
  type RewardAdOptions,
} from '@capacitor-community/admob';
import {
  showLevelPlayInterstitial,
  showLevelPlayRewarded,
  setLevelPlayConsent,
} from './levelplay';

// ─── Ad Unit IDs ──────────────────────────────────────────────────────────────
// App ID: ca-app-pub-2831295465597549~8524102249 (set in AndroidManifest.xml)
// All units below are live AdMob units.
export const ADMOB_AD_UNITS = {
  banner:               'ca-app-pub-2831295465597549/6948956225',
  interstitial:         'ca-app-pub-2831295465597549/8851079305',
  rewarded:             'ca-app-pub-2831295465597549/7154854253',
  rewardedInterstitial: 'ca-app-pub-2831295465597549/7694056096',
  native:               'ca-app-pub-2831295465597549/8847923880',
} as const;

// Google's official test unit IDs — used automatically in DEV builds.
const TEST_UNITS: Record<keyof typeof ADMOB_AD_UNITS, string> = {
  banner:               'ca-app-pub-3940256099942544/6300978111',
  interstitial:         'ca-app-pub-3940256099942544/1033173712',
  rewarded:             'ca-app-pub-3940256099942544/5224354917',
  rewardedInterstitial: 'ca-app-pub-3940256099942544/5354046379',
  native:               'ca-app-pub-3940256099942544/2247696110',
};

function adId(type: keyof typeof ADMOB_AD_UNITS): string {
  return import.meta.env.DEV ? TEST_UNITS[type] : ADMOB_AD_UNITS[type];
}

// ─── SDK Initialisation ───────────────────────────────────────────────────────
let initPromise: Promise<boolean> | null = null;

export function initAdMob(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(false);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: import.meta.env.DEV as boolean });
        console.info('[AdMob] initialized');

        // Request UMP Consent Info
        try {
          let consentInfo = await AdMob.requestConsentInfo();
          if (consentInfo.status === 'REQUIRED' && consentInfo.isConsentFormAvailable) {
            consentInfo = await AdMob.showConsentForm();
          }

          // Propagate consent to LevelPlay
          const consentGranted = consentInfo.status === 'OBTAINED' || consentInfo.status === 'NOT_REQUIRED';
          await setLevelPlayConsent(consentGranted);
          console.info('[AdMob/Consent] consent status:', consentInfo.status, 'granted:', consentGranted);
        } catch (consentErr) {
          console.warn('[AdMob/Consent] consent update failed, propagating default consent', consentErr);
          // Default to granting consent so we don't block ad loads if UMP server is offline or fails
          await setLevelPlayConsent(true);
        }

        return true;
      } catch (e) {
        console.warn('[AdMob] init failed', e);
        // Fallback: propagate default consent to LevelPlay even if AdMob fails to initialize
        try { await setLevelPlayConsent(true); } catch {}
        return false;
      }
    })();
  }
  return initPromise;
}

// ─── Banner ───────────────────────────────────────────────────────────────────
// A single banner surface is owned by the app (see BannerHost). Showing is
// idempotent: repeated calls never stack a second surface, and hiding only
// removes a banner that is actually on screen. The old reference-count could
// drift (it incremented before init and on the LevelPlay fallback path), which
// made the banner blink or duplicate as the session went on.
let bannerShown = false;
let bannerPending: Promise<boolean> | null = null;

/**
 * Compute the bottom margin needed so the banner clears both the WebView
 * BottomTabs bar AND the Android system navigation bar.
 *
 * On devices using gesture navigation the system nav bar is ~0–24 px.
 * On devices using 3-button navigation it is ~48 px.
 * We read it from the CSS variable set by BottomTabs via safe-area-inset-bottom,
 * falling back to a safe 80 px (tab bar) so nothing overlaps on any device.
 */
function getBottomMargin(): number {
  // --tab-h is our WebView tab bar (68px).
  // env(safe-area-inset-bottom) covers the gesture/nav-button bar on the device.
  // We use offsetHeight of a measuring element to get the computed px value.
  try {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(el);
    const safeBottom = el.offsetHeight || 0;
    document.body.removeChild(el);
    // 68px tab bar + safe-area bottom. Minimum 68 so we never drop below the tab bar.
    return Math.max(68, 68 + safeBottom);
  } catch {
    return 80; // safe fallback
  }
}

/**
 * Show the AdMob banner (bottom-centre, sits above the tab bar + system nav bar).
 * Returns true on success; calls onFailed() and returns false on error so
 * the caller can fall back to a LevelPlay banner.
 */
export async function showAdMobBanner(onFailed?: () => void): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (bannerShown) return true;
  if (bannerPending) return bannerPending;
  bannerPending = doShowBanner(onFailed).finally(() => { bannerPending = null; });
  return bannerPending;
}

async function doShowBanner(onFailed?: () => void): Promise<boolean> {
  if (!(await initAdMob())) { onFailed?.(); return false; }
  try {
    const margin = getBottomMargin();
    const options: BannerAdOptions = {
      adId: adId('banner'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin,
      isTesting: import.meta.env.DEV as boolean,
    };
    await AdMob.showBanner(options);
    bannerShown = true;

    // Listen for the actual rendered banner height so CSS spacers match.
    (AdMob as any)
      .addListener('bannerAdSizeChanged', (size: { width: number; height: number }) => {
        if (size?.height) {
          document.documentElement.style.setProperty('--banner-h', `${Math.ceil(size.height)}px`);
        }
      })
      ?.catch?.(() => {/* plugin may not support this listener — safe to ignore */});

    // Listen for ad load failure (like no fill) to trigger fallback to LevelPlay
    try {
      const failListener = await (AdMob as any).addListener('bannerAdFailedToLoad', async (info: any) => {
        console.warn('[AdMob] Banner failed to load (no fill):', info);
        bannerShown = false;
        try { await AdMob.removeBanner(); } catch {}
        document.documentElement.style.setProperty('--banner-h', '0px');
        onFailed?.();
        failListener.remove();
      });
    } catch (err) {
      console.warn('[AdMob] Failed to attach bannerAdFailedToLoad listener:', err);
    }

    return true;
  } catch (e) {
    console.warn('[AdMob] banner failed', e);
    onFailed?.();
    return false;
  }
}

export async function hideAdMobBanner(keepLayoutSpacer = false): Promise<void> {
  if (!Capacitor.isNativePlatform() || !bannerShown) return;
  bannerShown = false;
  try {
    await AdMob.removeBanner();
    if (!keepLayoutSpacer) {
      document.documentElement.style.setProperty('--banner-h', '0px');
    }
  } catch { /* noop */ }
}

export function isAdMobBannerShown(): boolean {
  return bannerShown;
}

// ─── Interstitial ─────────────────────────────────────────────────────────────
export async function preloadAdMobInterstitial(): Promise<void> {
  if (!(await initAdMob())) return;
  try {
    const opts: AdOptions = { adId: adId('interstitial'), isTesting: import.meta.env.DEV as boolean };
    await AdMob.prepareInterstitial(opts);
    console.info('[AdMob] Interstitial preloaded successfully');
  } catch (e) {
    console.warn('[AdMob] preload interstitial failed', e);
  }
}

/** Shows an AdMob interstitial. Returns true when an ad was actually displayed. */
export async function showAdMobInterstitial(): Promise<boolean> {
  if (!(await initAdMob())) return false;
  try {
    // Show the already prepared/cached interstitial instantly with zero network delay
    await AdMob.showInterstitial();
    // Warm up the next interstitial in the background immediately
    preloadAdMobInterstitial().catch(() => {});
    return true;
  } catch (e) {
    console.warn('[AdMob] interstitial show failed (falling back/preloading next)', e);
    // Trigger a background preload so an ad is fetched for the next round
    preloadAdMobInterstitial().catch(() => {});
    return false;
  }
}

// ─── Rewarded ─────────────────────────────────────────────────────────────────
export async function preloadAdMobRewarded(): Promise<void> {
  if (!(await initAdMob())) return;
  try {
    const opts: RewardAdOptions = { adId: adId('rewarded'), isTesting: import.meta.env.DEV as boolean };
    await AdMob.prepareRewardVideoAd(opts);
    console.info('[AdMob] Rewarded video preloaded successfully');
  } catch (e) {
    console.warn('[AdMob] preload rewarded failed', e);
  }
}

/**
 * Shows an AdMob rewarded ad.
 * Returns { shown, rewarded } consistent with the LevelPlay API so callers
 * can treat both SDKs identically.
 */
export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!(await initAdMob())) return { shown: false, rewarded: false };
  try {
    // Show the already prepared/cached rewarded video instantly
    const result = await AdMob.showRewardVideoAd();
    // Warm up the next one in the background immediately
    preloadAdMobRewarded().catch(() => {});
    // result.value > 0 means the SDK fired the reward callback.
    return { shown: true, rewarded: !!(result as any)?.value };
  } catch (e) {
    console.warn('[AdMob] rewarded show failed (falling back/preloading next)', e);
    // Pre-warm the next one for future rounds
    preloadAdMobRewarded().catch(() => {});
    return { shown: false, rewarded: false };
  }
}

// ─── Unified Waterfall ────────────────────────────────────────────────────────
/** Shows an AdMob rewarded interstitial. */
export async function showAdMobRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!(await initAdMob())) return { shown: false, rewarded: false };
  try {
    const opts: RewardAdOptions = {
      adId: adId('rewardedInterstitial'),
      isTesting: import.meta.env.DEV as boolean,
    };
    await AdMob.prepareRewardInterstitialAd(opts);
    const result = await AdMob.showRewardInterstitialAd();
    return { shown: true, rewarded: !!(result as any)?.amount };
  } catch (e) {
    console.warn('[AdMob] rewarded interstitial failed', e);
    return { shown: false, rewarded: false };
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timeoutId: number;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = window.setTimeout(() => {
      console.warn(`[Ads] Promise timed out after ${timeoutMs}ms`);
      resolve(fallbackValue);
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    window.clearTimeout(timeoutId);
  });
}

/**
 * Unified ad entry point for every native video/fullscreen slot.
 *
 * Waterfall priority:
 *   prefer='interstitial' → AdMob Interstitial → LevelPlay Interstitial → LevelPlay Rewarded
 *   prefer='rewarded'     → AdMob Rewarded     → LevelPlay Rewarded     → LevelPlay Interstitial
 *
 * Returns true when a native ad was shown — callers should only show their
 * own web fallback creative when this returns false.
 */
export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  // The waterfall is capped at two surfaces on purpose: preparing four
  // full-screen ads back-to-back (each of which also warms the next one) piles
  // up native memory and was crashing the WebView after a few rounds.
  if (prefer === 'rewarded') {
    const admobR = await withTimeout(
      showAdMobRewarded(),
      5000,
      { shown: false, rewarded: false }
    );
    if (admobR.shown) return true;
    
    const lpR = await withTimeout(
      showLevelPlayRewarded(),
      5000,
      { shown: false, rewarded: false }
    );
    return lpR.shown;
  }

  const admobI = await withTimeout(
    showAdMobInterstitial(),
    5000,
    false
  );
  if (admobI) return true;
  
  return await withTimeout(
    showLevelPlayInterstitial(),
    5000,
    false
  );
}
