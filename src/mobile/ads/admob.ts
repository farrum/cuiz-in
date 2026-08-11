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
// Real banner unit is live.
// ⚠ Replace the interstitial & rewarded IDs below with your real AdMob unit
//   IDs once you create them at https://admob.google.com — right now they point
//   to Google's official test units so you can verify the plumbing immediately.
export const ADMOB_AD_UNITS = {
  banner:        'ca-app-pub-2831295465597549/6948956225', // ✅ real
  interstitial:  'ca-app-pub-3940256099942544/1033173712', // ⚠ test — replace
  rewarded:      'ca-app-pub-3940256099942544/5224354917', // ⚠ test — replace
} as const;

// Google's official test unit IDs — used automatically in DEV builds.
const TEST_UNITS: Record<keyof typeof ADMOB_AD_UNITS, string> = {
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded:     'ca-app-pub-3940256099942544/5224354917',
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
let bannerRefCount = 0;

/**
 * Show the AdMob banner (bottom-centre, sits above the 56 px tab bar).
 * Returns true on success; calls onFailed() and returns false on error so
 * the caller can fall back to a LevelPlay banner.
 */
export async function showAdMobBanner(onFailed?: () => void): Promise<boolean> {
  bannerRefCount += 1;
  if (!(await initAdMob())) { onFailed?.(); return false; }
  if (bannerRefCount <= 0) return false;
  try {
    const options: BannerAdOptions = {
      adId: adId('banner'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 56,
      isTesting: import.meta.env.DEV as boolean,
    };
    await AdMob.showBanner(options);
    return true;
  } catch (e) {
    console.warn('[AdMob] banner failed', e);
    onFailed?.();
    return false;
  }
}

export async function hideAdMobBanner(): Promise<void> {
  bannerRefCount = Math.max(0, bannerRefCount - 1);
  if (!Capacitor.isNativePlatform() || bannerRefCount > 0) return;
  try { await AdMob.removeBanner(); } catch { /* noop */ }
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

  if (prefer === 'rewarded') {
    // 1. AdMob Rewarded
    const admobR = await showAdMobRewarded();
    if (admobR.shown) return true;
    // 2. LevelPlay Rewarded
    const lpR = await showLevelPlayRewarded();
    if (lpR.shown) return true;
    // 3. LevelPlay Interstitial (last resort)
    return await showLevelPlayInterstitial();
  }

  // prefer === 'interstitial'
  // 1. AdMob Interstitial
  if (await showAdMobInterstitial()) return true;
  // 2. LevelPlay Interstitial
  if (await showLevelPlayInterstitial()) return true;
  // 3. LevelPlay Rewarded (last resort)
  const lpR = await showLevelPlayRewarded();
  return lpR.shown;
}
