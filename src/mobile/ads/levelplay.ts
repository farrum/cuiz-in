import { Capacitor } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

// ─── LevelPlay (ironSource) Configuration ─────────────────────────────────────
// Live Unity LevelPlay App Key (replace with your production ironSource App Key)
export const LEVELPLAY_CONFIG = {
  // Replace with your Unity LevelPlay / ironSource App Key from the dashboard
  appKey: import.meta.env.VITE_LEVELPLAY_APP_KEY || '1d2b83495',
  testAppKey: '1d2b83495', // Standard ironSource test key
  isTesting: Boolean(import.meta.env.DEV),
} as const;

export const isLevelPlayEnabled = true;

function getAppKey(): string {
  return LEVELPLAY_CONFIG.isTesting ? LEVELPLAY_CONFIG.testAppKey : LEVELPLAY_CONFIG.appKey;
}

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitialPreloading = false;
let rewardedPreloading = false;

// ─── LevelPlay SDK Initialization ─────────────────────────────────────────────
/**
 * Initialize Unity LevelPlay SDK once globally.
 */
export async function initLevelPlay(): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true; // Simulated in web preview

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.info('[LevelPlay] Initializing LevelPlay SDK with App Key:', getAppKey());

      // Attempt to interface with native ironSource/LevelPlay plugin if available
      const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
      if (ironSourcePlugin && typeof ironSourcePlugin.init === 'function') {
        await ironSourcePlugin.init({
          appKey: getAppKey(),
          adFormats: ['INTERSTITIAL', 'REWARDED'],
        });
      }

      isInitialized = true;
      console.info('[LevelPlay] Initialized successfully');
      
      // Warm up ads immediately
      void preloadLevelPlayInterstitial();
      void preloadLevelPlayRewarded();

      return true;
    } catch (err) {
      console.warn('[LevelPlay] Initialization failed/fallback active:', err);
      isInitialized = true;
      return true;
    }
  })();

  return initPromise;
}

// ─── Interstitial Ads ─────────────────────────────────────────────────────────

export async function preloadLevelPlayInterstitial(): Promise<void> {
  if (!isLevelPlayEnabled || interstitialPreloading) return;
  if (!Capacitor.isNativePlatform()) return;

  interstitialPreloading = true;
  try {
    const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
    if (ironSourcePlugin && typeof ironSourcePlugin.loadInterstitial === 'function') {
      await ironSourcePlugin.loadInterstitial();
      console.info('[LevelPlay] Interstitial loaded successfully');
    }
  } catch (err) {
    console.warn('[LevelPlay] Preload interstitial skipped/failed:', err);
  } finally {
    interstitialPreloading = false;
  }
}

/**
 * Shows a Unity LevelPlay full-screen Interstitial Ad.
 * Returns true if shown & dismissed, or false if failed.
 */
export async function showLevelPlayInterstitial(): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  await initLevelPlay();

  console.info('[LevelPlay] Requesting Interstitial Ad');

  if (!Capacitor.isNativePlatform()) {
    // In-browser preview simulation
    console.info('[LevelPlay/Web] Simulating Interstitial Ad presentation');
    return new Promise<boolean>((resolve) => {
      audioManager.pauseBGM();
      setTimeout(() => {
        audioManager.startBGM();
        resolve(true);
      }, 1500);
    });
  }

  return new Promise<boolean>(async (resolve) => {
    let completed = false;
    let timeoutId: number;

    const finish = (result: boolean) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      audioManager.startBGM();
      // Preload next interstitial for zero latency
      void preloadLevelPlayInterstitial();
      resolve(result);
    };

    // Safety timeout: 12 seconds max waiting for ad to dismiss
    timeoutId = window.setTimeout(() => {
      console.warn('[LevelPlay] Interstitial show timed out, continuing flow');
      finish(false);
    }, 12000);

    try {
      audioManager.pauseBGM();

      const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
      if (ironSourcePlugin && typeof ironSourcePlugin.showInterstitial === 'function') {
        ironSourcePlugin.showInterstitial({
          onDismiss: () => finish(true),
          onFailed: (err: any) => {
            console.warn('[LevelPlay] Interstitial failed to show:', err);
            finish(false);
          },
        });
      } else {
        // Plugin not loaded in native shell yet, fallback cleanly without blocking
        console.warn('[LevelPlay] Native LevelPlay plugin not active, resuming game');
        finish(true);
      }
    } catch (e) {
      console.warn('[LevelPlay] showInterstitial native call failed', e);
      finish(false);
    }
  });
}

// ─── Rewarded Video Ads ───────────────────────────────────────────────────────

export async function preloadLevelPlayRewarded(): Promise<void> {
  if (!isLevelPlayEnabled || rewardedPreloading) return;
  if (!Capacitor.isNativePlatform()) return;

  rewardedPreloading = true;
  try {
    const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
    if (ironSourcePlugin && typeof ironSourcePlugin.loadRewardedVideo === 'function') {
      await ironSourcePlugin.loadRewardedVideo();
      console.info('[LevelPlay] Rewarded video loaded successfully');
    }
  } catch (err) {
    console.warn('[LevelPlay] Preload rewarded skipped/failed:', err);
  } finally {
    rewardedPreloading = false;
  }
}

/**
 * Shows a Unity LevelPlay Rewarded Video Ad.
 * Returns { shown: boolean, rewarded: boolean } when dismissed.
 */
export async function showLevelPlayRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isLevelPlayEnabled) return { shown: false, rewarded: false };
  await initLevelPlay();

  console.info('[LevelPlay] Requesting Rewarded Video Ad');

  if (!Capacitor.isNativePlatform()) {
    // In-browser preview simulation
    console.info('[LevelPlay/Web] Simulating Rewarded Video Ad');
    return new Promise<{ shown: boolean; rewarded: boolean }>((resolve) => {
      audioManager.pauseBGM();
      setTimeout(() => {
        audioManager.startBGM();
        resolve({ shown: true, rewarded: true });
      }, 2000);
    });
  }

  return new Promise<{ shown: boolean; rewarded: boolean }>(async (resolve) => {
    let completed = false;
    let rewardGranted = false;
    let timeoutId: number;

    const finish = (shown: boolean, rewarded: boolean) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      audioManager.startBGM();
      // Preload next rewarded video
      void preloadLevelPlayRewarded();
      resolve({ shown, rewarded });
    };

    // Safety timeout: 25 seconds max waiting for reward
    timeoutId = window.setTimeout(() => {
      console.warn('[LevelPlay] Rewarded video timed out');
      finish(false, rewardGranted);
    }, 25000);

    try {
      audioManager.pauseBGM();

      const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
      if (ironSourcePlugin && typeof ironSourcePlugin.showRewardedVideo === 'function') {
        ironSourcePlugin.showRewardedVideo({
          onReward: () => {
            console.info('[LevelPlay] User earned reward!');
            rewardGranted = true;
          },
          onDismiss: () => finish(true, rewardGranted),
          onFailed: (err: any) => {
            console.warn('[LevelPlay] Rewarded video failed to show:', err);
            finish(false, false);
          },
        });
      } else {
        // Native fallback grant reward cleanly
        console.warn('[LevelPlay] Native LevelPlay plugin not active, simulating reward grant');
        finish(true, true);
      }
    } catch (e) {
      console.warn('[LevelPlay] showRewardedVideo native call failed', e);
      finish(false, false);
    }
  });
}

// ─── Rewarded Interstitial Ads ────────────────────────────────────────────────

export async function showLevelPlayRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  // In LevelPlay, Rewarded Interstitials use the rewarded video pipeline with automatic placement
  return showLevelPlayRewarded();
}

// ─── Banner Ads ───────────────────────────────────────────────────────────────

let bannerShown = false;

/**
 * Loads and displays a LevelPlay bottom banner ad.
 * Passes customMargin so it sits cleanly above bottom tabs without overlapping.
 */
export async function showLevelPlayBanner(customMargin?: number, onFailed?: () => void): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  await initLevelPlay();

  if (!Capacitor.isNativePlatform()) {
    // In web preview, enable the banner height spacer so UI accommodates it
    document.documentElement.style.setProperty('--banner-h', '50px');
    bannerShown = true;
    return true;
  }

  try {
    const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
    if (ironSourcePlugin && typeof ironSourcePlugin.loadBanner === 'function') {
      await ironSourcePlugin.loadBanner({
        position: 'BOTTOM',
        margin: customMargin ?? 0,
        size: 'BANNER', // Standard 320x50
      });
      document.documentElement.style.setProperty('--banner-h', '50px');
      bannerShown = true;
      console.info('[LevelPlay] Banner shown with bottom margin:', customMargin ?? 0);
      return true;
    } else {
      // Fallback: reserve banner space
      document.documentElement.style.setProperty('--banner-h', '50px');
      bannerShown = true;
      return true;
    }
  } catch (err) {
    console.warn('[LevelPlay] showBanner failed:', err);
    bannerShown = false;
    document.documentElement.style.setProperty('--banner-h', '0px');
    if (onFailed) onFailed();
    return false;
  }
}

/**
 * Hides the LevelPlay banner and resets the layout spacer.
 */
export async function hideLevelPlayBanner(): Promise<void> {
  if (!bannerShown) return;
  bannerShown = false;
  document.documentElement.style.setProperty('--banner-h', '0px');

  if (!Capacitor.isNativePlatform()) return;

  try {
    const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
    if (ironSourcePlugin && typeof ironSourcePlugin.hideBanner === 'function') {
      await ironSourcePlugin.hideBanner();
      console.info('[LevelPlay] Banner hidden');
    }
  } catch (err) {
    console.warn('[LevelPlay] hideBanner error:', err);
  }
}

export function isLevelPlayBannerShown(): boolean {
  return bannerShown;
}

export async function destroyLevelPlayBanner(): Promise<void> {
  bannerShown = false;
  document.documentElement.style.setProperty('--banner-h', '0px');

  if (!Capacitor.isNativePlatform()) return;

  try {
    const ironSourcePlugin = (window as any).ironSource || (window as any).LevelPlay;
    if (ironSourcePlugin && typeof ironSourcePlugin.destroyBanner === 'function') {
      await ironSourcePlugin.destroyBanner();
    }
  } catch (err) {
    console.warn('[LevelPlay] destroyBanner error:', err);
  }
}

