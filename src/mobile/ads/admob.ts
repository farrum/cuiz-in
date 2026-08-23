import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  InterstitialAdPluginEvents,
  RewardAdPluginEvents,
  RewardInterstitialAdPluginEvents,
  type BannerAdOptions,
  type AdOptions,
  type RewardAdOptions,
} from '@capacitor-community/admob';
import { audioManager } from '@/utils/audioManager';

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
export const isMobileAdsEnabled = true;

let initPromise: Promise<boolean> | null = null;

/**
 * Initialize AdMob once globally on app boot.
 * UMP Consent is executed asynchronously in the background so it never blocks
 * SDK readiness or ad request pipelines.
 */
export function initAdMob(): Promise<boolean> {
  if (!isMobileAdsEnabled) return Promise.resolve(false);
  if (!Capacitor.isNativePlatform()) return Promise.resolve(false);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await AdMob.initialize({ initializeForTesting: Boolean(import.meta.env.DEV) });
        console.info('[AdMob] Initialized successfully');

        // Request UMP Consent Info in the background without blocking core initialization
        void (async () => {
          try {
            let consentInfo = await AdMob.requestConsentInfo();
            if (consentInfo.status === 'REQUIRED' && consentInfo.isConsentFormAvailable) {
              consentInfo = await AdMob.showConsentForm();
            }
            console.info('[AdMob/Consent] Consent status:', consentInfo.status);
          } catch (consentErr) {
            console.warn('[AdMob/Consent] Consent form update skipped/failed:', consentErr);
          }
        })();

        // Setup persistent banner listeners once
        setupBannerListeners();

        return true;
      } catch (e) {
        console.warn('[AdMob] Initialization failed:', e);
        return false;
      }
    })();
  }
  return initPromise;
}

// ─── Banner ───────────────────────────────────────────────────────────────────
let bannerShown = false;
let bannerPending: Promise<boolean> | null = null;
let lastMargin = -1;
let bannerListenersAttached = false;

function setupBannerListeners() {
  if (bannerListenersAttached || !Capacitor.isNativePlatform()) return;
  bannerListenersAttached = true;

  try {
    void AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: { width: number; height: number }) => {
      if (size?.height && size.height > 0) {
        document.documentElement.style.setProperty('--banner-h', `${Math.ceil(size.height)}px`);
      }
    });

    void AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (info: any) => {
      console.warn('[AdMob] Banner failed to load (no fill):', info);
      bannerShown = false;
    });

    void AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
      console.info('[AdMob] Banner loaded successfully');
      bannerShown = true;
      document.documentElement.style.setProperty('--banner-h', '50px');
    });
  } catch (e) {
    console.warn('[AdMob] Error attaching banner listeners:', e);
  }
}

/**
 * Compute the bottom margin needed so the banner clears both the WebView
 * BottomTabs bar AND the Android system navigation bar.
 */
function getBottomMargin(): number {
  return 76; // Clean 68px tab bar + 8px safe margin, no DOM mutation
}

/**
 * Show the AdMob banner (bottom-centre, sits above the tab bar + system nav bar).
 * Returns true on success; calls onFailed() and returns false on error.
 */
export async function showAdMobBanner(customMargin?: number, onFailed?: () => void): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return false;

  const margin = customMargin !== undefined ? customMargin : getBottomMargin();
  if (bannerShown && lastMargin === margin) return true;

  lastMargin = margin;
  if (bannerPending) return bannerPending;
  bannerPending = doShowBanner(margin, onFailed).finally(() => { bannerPending = null; });
  return bannerPending;
}

async function doShowBanner(margin: number, onFailed?: () => void): Promise<boolean> {
  if (!(await initAdMob())) { onFailed?.(); return false; }
  try {
    const options: BannerAdOptions = {
      adId: adId('banner'),
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin,
      isTesting: Boolean(import.meta.env.DEV),
    };
    await AdMob.showBanner(options);
    bannerShown = true;
    return true;
  } catch (e) {
    console.warn('[AdMob] banner show failed', e);
    onFailed?.();
    return false;
  }
}

export async function hideAdMobBanner(keepLayoutSpacer = false): Promise<void> {
  if (!isMobileAdsEnabled) return;
  if (!Capacitor.isNativePlatform() || !bannerShown) return;
  bannerShown = false;
  lastMargin = -1;
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
let interstitialPreloading = false;

export async function preloadAdMobInterstitial(): Promise<void> {
  if (!isMobileAdsEnabled) return;
  if (!(await initAdMob()) || interstitialPreloading) return;
  interstitialPreloading = true;
  try {
    const opts: AdOptions = { adId: adId('interstitial'), isTesting: Boolean(import.meta.env.DEV) };
    await AdMob.prepareInterstitial(opts);
    console.info('[AdMob] Interstitial preloaded successfully');
  } catch (e) {
    console.warn('[AdMob] preload interstitial failed', e);
  } finally {
    interstitialPreloading = false;
  }
}

/** Shows an AdMob interstitial. Resolves only when the user dismisses the ad or it fails to show. */
export async function showAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!(await initAdMob())) return false;

  return new Promise<boolean>(async (resolve) => {
    let completed = false;
    const handles: PluginListenerHandle[] = [];

    const cleanup = () => {
      handles.forEach((h) => { try { h.remove(); } catch {} });
      handles.length = 0;
      audioManager.startBGM();
      preloadAdMobInterstitial().catch(() => {});
    };

    const finish = (result: boolean) => {
      if (completed) return;
      completed = true;
      cleanup();
      resolve(result);
    };

    // Safety timeout: 15s max waiting for dismiss
    const timeoutId = window.setTimeout(() => {
      console.warn('[AdMob] Interstitial show timed out');
      finish(false);
    }, 15000);

    try {
      // Pause background music while full-screen ad plays
      audioManager.pauseBGM();

      const dismissedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.Dismissed,
        () => {
          console.info('[AdMob] Interstitial dismissed by user');
          window.clearTimeout(timeoutId);
          finish(true);
        }
      );
      handles.push(dismissedListener);

      const failedListener = await AdMob.addListener(
        InterstitialAdPluginEvents.FailedToShow,
        (info: any) => {
          console.warn('[AdMob] Interstitial failed to show:', info);
          window.clearTimeout(timeoutId);
          finish(false);
        }
      );
      handles.push(failedListener);

      await AdMob.showInterstitial();
    } catch (e) {
      console.warn('[AdMob] showInterstitial native call failed', e);
      window.clearTimeout(timeoutId);
      finish(false);
    }
  });
}

// ─── Rewarded ─────────────────────────────────────────────────────────────────
let rewardedPreloading = false;

export async function preloadAdMobRewarded(): Promise<void> {
  if (!isMobileAdsEnabled) return;
  if (!(await initAdMob()) || rewardedPreloading) return;
  rewardedPreloading = true;
  try {
    const opts: RewardAdOptions = { adId: adId('rewarded'), isTesting: Boolean(import.meta.env.DEV) };
    await AdMob.prepareRewardVideoAd(opts);
    console.info('[AdMob] Rewarded video preloaded successfully');
  } catch (e) {
    console.warn('[AdMob] preload rewarded failed', e);
  } finally {
    rewardedPreloading = false;
  }
}

/** Shows an AdMob rewarded ad. Resolves only when the user dismisses the ad or it fails to show. */
export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!(await initAdMob())) return { shown: false, rewarded: false };

  return new Promise<{ shown: boolean; rewarded: boolean }>(async (resolve) => {
    let completed = false;
    let rewardGranted = false;
    const handles: PluginListenerHandle[] = [];

    const cleanup = () => {
      handles.forEach((h) => { try { h.remove(); } catch {} });
      handles.length = 0;
      audioManager.startBGM();
      preloadAdMobRewarded().catch(() => {});
    };

    const finish = (shown: boolean, rewarded: boolean) => {
      if (completed) return;
      completed = true;
      cleanup();
      resolve({ shown, rewarded });
    };

    // Safety timeout: 25s max waiting for reward/dismiss
    const timeoutId = window.setTimeout(() => {
      console.warn('[AdMob] Rewarded video timed out');
      finish(false, rewardGranted);
    }, 25000);

    try {
      // Pause background music while video ad plays
      audioManager.pauseBGM();

      // Listen for the reward event (plugin event: onRewardedVideoAdReward)
      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (info: any) => {
          console.info('[AdMob] User earned reward:', info);
          rewardGranted = true;
        }
      );
      handles.push(rewardListener);

      // Listen for dismiss event (plugin event: onRewardedVideoAdDismissed)
      const dismissedListener = await AdMob.addListener(
        RewardAdPluginEvents.Dismissed,
        () => {
          console.info('[AdMob] Rewarded ad dismissed. Reward granted:', rewardGranted);
          window.clearTimeout(timeoutId);
          finish(true, rewardGranted);
        }
      );
      handles.push(dismissedListener);

      // Listen for failed to show event (plugin event: onRewardedVideoAdFailedToShow)
      const failedListener = await AdMob.addListener(
        RewardAdPluginEvents.FailedToShow,
        (info: any) => {
          console.warn('[AdMob] Rewarded ad failed to show:', info);
          window.clearTimeout(timeoutId);
          finish(false, false);
        }
      );
      handles.push(failedListener);

      await AdMob.showRewardVideoAd();
    } catch (e) {
      console.warn('[AdMob] showRewardVideoAd native call failed', e);
      window.clearTimeout(timeoutId);
      finish(false, false);
    }
  });
}

// ─── Rewarded Interstitial ────────────────────────────────────────────────────────
export async function showAdMobRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!(await initAdMob())) return { shown: false, rewarded: false };

  return new Promise<{ shown: boolean; rewarded: boolean }>(async (resolve) => {
    let completed = false;
    let rewardGranted = false;
    const handles: PluginListenerHandle[] = [];

    const cleanup = () => {
      handles.forEach((h) => { try { h.remove(); } catch {} });
      handles.length = 0;
      audioManager.startBGM();
    };

    const finish = (shown: boolean, rewarded: boolean) => {
      if (completed) return;
      completed = true;
      cleanup();
      resolve({ shown, rewarded });
    };

    const timeoutId = window.setTimeout(() => {
      console.warn('[AdMob] Rewarded interstitial timed out');
      finish(false, rewardGranted);
    }, 25000);

    try {
      audioManager.pauseBGM();

      const rewardListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.Rewarded,
        (info: any) => {
          console.info('[AdMob] Rewarded interstitial reward earned:', info);
          rewardGranted = true;
        }
      );
      handles.push(rewardListener);

      const dismissedListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.Dismissed,
        () => {
          console.info('[AdMob] Rewarded interstitial dismissed');
          window.clearTimeout(timeoutId);
          finish(true, rewardGranted);
        }
      );
      handles.push(dismissedListener);

      const failedListener = await AdMob.addListener(
        RewardInterstitialAdPluginEvents.FailedToShow,
        (info: any) => {
          console.warn('[AdMob] Rewarded interstitial failed to show:', info);
          window.clearTimeout(timeoutId);
          finish(false, false);
        }
      );
      handles.push(failedListener);

      const opts: RewardAdOptions = {
        adId: adId('rewardedInterstitial'),
        isTesting: Boolean(import.meta.env.DEV),
      };
      await AdMob.prepareRewardInterstitialAd(opts);
      await AdMob.showRewardInterstitialAd();
    } catch (e) {
      console.warn('[AdMob] rewarded interstitial failed', e);
      window.clearTimeout(timeoutId);
      finish(false, false);
    }
  });
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
 * Unified ad entry point for legacy native video/fullscreen slot callers.
 */
export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return false;

  if (prefer === 'rewarded') {
    const admobR = await withTimeout(
      showAdMobRewarded(),
      10000,
      { shown: false, rewarded: false }
    );
    return admobR.shown;
  }

  const admobI = await withTimeout(
    showAdMobInterstitial(),
    10000,
    false
  );
  return admobI;
}
