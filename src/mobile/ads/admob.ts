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
    initPromise = AdMob.initialize({ initializeForTesting: import.meta.env.DEV as boolean })
      .then(() => {
        console.info('[AdMob] initialized');
        return true;
      })
      .catch((e) => {
        console.warn('[AdMob] init failed', e);
        return false;
      });
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
 * Show the AdMob banner (bottom-centre, sits above the 56 px tab bar).
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
    const options: BannerAdOptions = {
      adId: adId('banner'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 68, // clears the ~68px BottomTabs bar
      isTesting: import.meta.env.DEV as boolean,
    };
    await AdMob.showBanner(options);
    bannerShown = true;
    return true;
  } catch (e) {
    console.warn('[AdMob] banner failed', e);
    onFailed?.();
    return false;
  }
}

export async function hideAdMobBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !bannerShown) return;
  bannerShown = false;
  try { await AdMob.removeBanner(); } catch { /* noop */ }
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
  } catch (e) {
    console.warn('[AdMob] preload interstitial failed', e);
  }
}

/** Shows an AdMob interstitial. Returns true when an ad was actually displayed. */
export async function showAdMobInterstitial(): Promise<boolean> {
  if (!(await initAdMob())) return false;
  try {
    const opts: AdOptions = { adId: adId('interstitial'), isTesting: import.meta.env.DEV as boolean };
    await AdMob.prepareInterstitial(opts);
    await AdMob.showInterstitial();
    // Warm up the next one immediately.
    AdMob.prepareInterstitial(opts).catch(() => {});
    return true;
  } catch (e) {
    console.warn('[AdMob] interstitial failed', e);
    return false;
  }
}

// ─── Rewarded ─────────────────────────────────────────────────────────────────
export async function preloadAdMobRewarded(): Promise<void> {
  if (!(await initAdMob())) return;
  try {
    const opts: RewardAdOptions = { adId: adId('rewarded'), isTesting: import.meta.env.DEV as boolean };
    await AdMob.prepareRewardVideoAd(opts);
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
    const opts: RewardAdOptions = { adId: adId('rewarded'), isTesting: import.meta.env.DEV as boolean };
    await AdMob.prepareRewardVideoAd(opts);
    const result = await AdMob.showRewardVideoAd();
    // Warm up next.
    AdMob.prepareRewardVideoAd(opts).catch(() => {});
    // result.value > 0 means the SDK fired the reward callback.
    return { shown: true, rewarded: !!(result as any)?.value };
  } catch (e) {
    console.warn('[AdMob] rewarded failed', e);
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
    const admobR = await showAdMobRewarded();
    if (admobR.shown) return true;
    const lpR = await showLevelPlayRewarded();
    return lpR.shown;
  }

  if (await showAdMobInterstitial()) return true;
  return await showLevelPlayInterstitial();
}
