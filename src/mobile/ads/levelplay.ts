import { Capacitor } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

// ─── Unity LevelPlay (ironSource) Configuration ───────────────────────────────
export const LEVELPLAY_CONFIG = {
  appKey: import.meta.env.VITE_LEVELPLAY_APP_KEY || '800078728',
  placements: {
    banner: 'Banner_Android',
    interstitial: 'Interstitial_Android',
    rewarded: 'Rewarded_Android',
  },
} as const;

export const isLevelPlayEnabled = true;

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let interstitialPreloaded = false;
let rewardedPreloaded = false;
let bannerShown = false;
let lastMargin = -1;

/** Helper to access native LevelPlay / ironSource plugin object */
function getNativePlugin(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).ironSource || (window as any).LevelPlay || (window as any).IronSourceAds || null;
}

// ─── LevelPlay Initialization ─────────────────────────────────────────────────
export async function initLevelPlay(): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.info('[LevelPlay] Initializing Unity LevelPlay with App Key:', LEVELPLAY_CONFIG.appKey);

      const plugin = getNativePlugin();
      if (plugin) {
        if (typeof plugin.init === 'function') {
          await plugin.init({
            appKey: LEVELPLAY_CONFIG.appKey,
            adFormats: ['INTERSTITIAL', 'REWARDED', 'BANNER'],
          });
        } else if (typeof plugin.initIronSource === 'function') {
          await plugin.initIronSource({
            appKey: LEVELPLAY_CONFIG.appKey,
          });
        }
        console.info('[LevelPlay] Native LevelPlay SDK initialized successfully');
      } else {
        console.info('[LevelPlay] LevelPlay client active with App Key:', LEVELPLAY_CONFIG.appKey);
      }

      isInitialized = true;

      // Preload ads immediately for zero-latency presentation
      void preloadLevelPlayInterstitial();
      void preloadLevelPlayRewarded();

      return true;
    } catch (err) {
      console.warn('[LevelPlay] Initialization error:', err);
      isInitialized = true;
      return true;
    }
  })();

  return initPromise;
}

// ─── Interstitial Ads ─────────────────────────────────────────────────────────

export async function preloadLevelPlayInterstitial(): Promise<void> {
  if (!isLevelPlayEnabled || !Capacitor.isNativePlatform()) return;
  if (interstitialPreloaded) return;

  try {
    const plugin = getNativePlugin();
    if (plugin && typeof plugin.loadInterstitial === 'function') {
      await plugin.loadInterstitial({
        placementName: LEVELPLAY_CONFIG.placements.interstitial,
      });
      interstitialPreloaded = true;
      console.info('[LevelPlay] Interstitial preloaded for:', LEVELPLAY_CONFIG.placements.interstitial);
    }
  } catch (err) {
    console.warn('[LevelPlay] Preload interstitial warning:', err);
  }
}

export async function showLevelPlayInterstitial(): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  await initLevelPlay();

  console.info('[LevelPlay] Showing Interstitial Ad:', LEVELPLAY_CONFIG.placements.interstitial);

  if (!Capacitor.isNativePlatform()) {
    return new Promise<boolean>((resolve) => {
      audioManager.pauseBGM();
      setTimeout(() => {
        audioManager.startBGM();
        resolve(true);
      }, 1500);
    });
  }

  return new Promise<boolean>((resolve) => {
    let completed = false;
    let timeoutId: number;

    const cleanup = () => {
      window.removeEventListener('levelplay_interstitialClosed', onClosed as EventListener);
      window.removeEventListener('levelplay_interstitialShowFailed', onFailed as EventListener);
    };

    const finish = (result: boolean) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      cleanup();
      audioManager.startBGM();
      interstitialPreloaded = false;
      void preloadLevelPlayInterstitial();
      resolve(result);
    };

    const onClosed = () => finish(true);
    const onFailed = () => finish(false);

    window.addEventListener('levelplay_interstitialClosed', onClosed as EventListener);
    window.addEventListener('levelplay_interstitialShowFailed', onFailed as EventListener);

    timeoutId = window.setTimeout(() => {
      console.warn('[LevelPlay] Interstitial presentation timeout');
      finish(false);
    }, 12000); // Wait 12 seconds to load, if it shows, the event listeners will handle it

    try {
      audioManager.pauseBGM();

      const plugin = getNativePlugin();
      if (plugin && typeof plugin.showInterstitial === 'function') {
        plugin.showInterstitial(LEVELPLAY_CONFIG.placements.interstitial);
      } else {
        finish(true);
      }
    } catch (e) {
      console.warn('[LevelPlay] showInterstitial exception:', e);
      finish(false);
    }
  });
}

// ─── Rewarded Video Ads ───────────────────────────────────────────────────────

export async function preloadLevelPlayRewarded(): Promise<void> {
  if (!isLevelPlayEnabled || !Capacitor.isNativePlatform()) return;
  if (rewardedPreloaded) return;

  try {
    const plugin = getNativePlugin();
    if (plugin && typeof plugin.loadRewardedVideo === 'function') {
      try {
        plugin.loadRewardedVideo(LEVELPLAY_CONFIG.placements.rewarded);
      } catch {
        plugin.loadRewardedVideo({ placementName: LEVELPLAY_CONFIG.placements.rewarded });
      }
      rewardedPreloaded = true;
      console.info('[LevelPlay] Rewarded video preloaded for:', LEVELPLAY_CONFIG.placements.rewarded);
    }
  } catch (err) {
    console.warn('[LevelPlay] Preload rewarded warning:', err);
  }
}

export async function showLevelPlayRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isLevelPlayEnabled) return { shown: false, rewarded: false };
  await initLevelPlay();

  console.info('[LevelPlay] Showing Rewarded Video Ad:', LEVELPLAY_CONFIG.placements.rewarded);

  if (!Capacitor.isNativePlatform()) {
    return new Promise<{ shown: boolean; rewarded: boolean }>((resolve) => {
      audioManager.pauseBGM();
      setTimeout(() => {
        audioManager.startBGM();
        resolve({ shown: true, rewarded: true });
      }, 2000);
    });
  }

  return new Promise<{ shown: boolean; rewarded: boolean }>((resolve) => {
    let completed = false;
    let rewardGranted = false;
    let timeoutId: number;

    const cleanup = () => {
      window.removeEventListener('levelplay_rewardedEarnedReward', onRewarded as EventListener);
      window.removeEventListener('levelplay_rewardedClosed', onClosed as EventListener);
      window.removeEventListener('levelplay_rewardedShowFailed', onFailed as EventListener);
    };

    const finish = (shown: boolean) => {
      if (completed) return;
      completed = true;
      window.clearTimeout(timeoutId);
      cleanup();
      audioManager.startBGM();
      rewardedPreloaded = false;
      void preloadLevelPlayRewarded();
      resolve({ shown, rewarded: rewardGranted });
    };

    const onRewarded = () => { rewardGranted = true; };
    const onClosed = () => finish(true);
    const onFailed = () => finish(false);

    window.addEventListener('levelplay_rewardedEarnedReward', onRewarded as EventListener);
    window.addEventListener('levelplay_rewardedClosed', onClosed as EventListener);
    window.addEventListener('levelplay_rewardedShowFailed', onFailed as EventListener);

    timeoutId = window.setTimeout(() => {
      console.warn('[LevelPlay] Rewarded video presentation timeout');
      finish(false);
    }, 35000); // Increased timeout to 35s to allow user to finish watching the video

    try {
      audioManager.pauseBGM();

      const plugin = getNativePlugin();
      if (plugin && typeof plugin.showRewardedVideo === 'function') {
        plugin.showRewardedVideo(LEVELPLAY_CONFIG.placements.rewarded);
      } else {
        finish(true);
      }
    } catch (e) {
      console.warn('[LevelPlay] showRewardedVideo exception:', e);
      finish(false);
    }
  });
}

export async function showLevelPlayRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  return showLevelPlayRewarded();
}

// ─── Banner Ads ───────────────────────────────────────────────────────────────

export async function showLevelPlayBanner(customMargin?: number, onFailed?: () => void): Promise<boolean> {
  if (!isLevelPlayEnabled) return false;
  await initLevelPlay();

  const margin = customMargin ?? 76;
  if (bannerShown && lastMargin === margin) return true;
  lastMargin = margin;

  if (!Capacitor.isNativePlatform()) {
    document.documentElement.style.setProperty('--banner-h', '50px');
    bannerShown = true;
    return true;
  }

  try {
    const plugin = getNativePlugin();
    if (plugin && typeof plugin.loadBanner === 'function') {
      try {
        // Direct native Java bridge call: loadBanner(placement, marginDp)
        plugin.loadBanner(LEVELPLAY_CONFIG.placements.banner, margin);
      } catch {
        // Plugin object signature
        plugin.loadBanner({
          position: 'BOTTOM',
          margin,
          size: 'BANNER',
          placementName: LEVELPLAY_CONFIG.placements.banner,
        });
      }
      document.documentElement.style.setProperty('--banner-h', '50px');
      bannerShown = true;
      console.info('[LevelPlay] Banner displayed for placement:', LEVELPLAY_CONFIG.placements.banner, 'margin:', margin);
      return true;
    } else {
      document.documentElement.style.setProperty('--banner-h', '50px');
      bannerShown = true;
      return true;
    }
  } catch (err) {
    console.warn('[LevelPlay] showBanner error:', err);
    bannerShown = false;
    document.documentElement.style.setProperty('--banner-h', '0px');
    if (onFailed) onFailed();
    return false;
  }
}

export async function hideLevelPlayBanner(): Promise<void> {
  if (!bannerShown) return;
  bannerShown = false;
  lastMargin = -1;
  document.documentElement.style.setProperty('--banner-h', '0px');

  if (!Capacitor.isNativePlatform()) return;

  try {
    const plugin = getNativePlugin();
    if (plugin && typeof plugin.hideBanner === 'function') {
      await plugin.hideBanner();
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
  await hideLevelPlayBanner();
}
