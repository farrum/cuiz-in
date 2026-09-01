import { registerPlugin, Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

// Register the custom native ads plugin (powered by LevelPlay + Unity Ads SDKs)
export interface CustomAdMobPlugin {
  initialize(options?: { levelPlayAppKey?: string; gameId?: string; testMode?: boolean }): Promise<void>;
  prepareBanner(options: { adId?: string, margin?: number }): Promise<void>;
  showBanner(options: { adId?: string, margin?: number, forceRefresh?: boolean }): Promise<void>;
  refreshBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  prepareInterstitial(options?: { adId?: string }): Promise<void>;
  showInterstitial(): Promise<void>;
  prepareRewardVideoAd(options?: { adId?: string }): Promise<void>;
  showRewardVideoAd(): Promise<{ type: string; amount: number }>;
  addListener(
    eventName: 'bannerState',
    listenerFunc: (event: { state: 'loaded' | 'failed' | 'hidden'; heightDp?: number; message?: string }) => void,
  ): Promise<PluginListenerHandle>;
}

const CustomAdMob = registerPlugin<CustomAdMobPlugin>('CustomAdMob');

// LevelPlay (ironSource) Configuration - Primary
export const LEVELPLAY_CONFIG = {
  appKey: '268f29025',
  bannerId: 'nfbd7er5vhgheohp',
  interstitialId: '5kn5xibxgrngcju9g',
  rewardedId: 'l396uc79p1ajnsmt',
};

// Unity Ads Standalone Configuration - Secondary / Direct Fallback
export const UNITY_CONFIG = {
  gameId: '800078728',
  userId: 'cae8dcab-c6a2-4fa1-a3f0-4ebb5ab2b644',
  androidBannerId: 'Banner_Android',
  androidInterstitialId: 'Interstitial_Android',
  androidRewardedId: 'Rewarded_Android',
  testMode: false,
};

// Backward-compatible alias for existing callers
const ADMOB_CONFIG = LEVELPLAY_CONFIG;

export const isMobileAdsEnabled = true;

let isInitialized = false;
let bannerWanted = false;
let fullScreenDepth = 0; // Tracks if an interstitial/rewarded is currently showing
let initPromise: Promise<boolean> | null = null;
let fullScreenPromise: Promise<unknown> | null = null;

// Initialize LevelPlay (Primary) + Unity Ads (Secondary) and warm up all ad units
export async function initAdMob(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await CustomAdMob.initialize({
        levelPlayAppKey: LEVELPLAY_CONFIG.appKey,
        gameId: UNITY_CONFIG.gameId,
        testMode: UNITY_CONFIG.testMode,
      });
      isInitialized = true;
      console.log('Unity LevelPlay & Unity Ads Initialized natively via Capacitor');
      // BannerHost owns banner creation and positioning after the route layout
      // has been measured. Only full-screen formats are warmed here.
      preloadAdMobInterstitial();
      preloadAdMobRewarded();
      return true;
    } catch (e) {
      console.error('LevelPlay / Unity Ads Init Error:', e);
      return false;
    }
  })();

  return initPromise;
}

let lastBannerMargin = 0;
// ─── Banner Ad Handlers ───────────────────────────────────────────────────────

export async function preloadAdMobBanner(margin = 70): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  lastBannerMargin = margin;
  try {
    await CustomAdMob.prepareBanner({ adId: LEVELPLAY_CONFIG.bannerId, margin });
  } catch (e) {
    console.warn('CustomAdMob prepareBanner error:', e);
  }
}

export async function showAdMobBanner(margin = 0, forceRefresh = false): Promise<boolean> {
  bannerWanted = true;
  lastBannerMargin = margin;
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true; // Mock for web

  await initAdMob();

  if (fullScreenDepth > 0) return false;

  try {
    await CustomAdMob.showBanner({ adId: LEVELPLAY_CONFIG.bannerId, margin, forceRefresh });
    return true;
  } catch (err) {
    console.warn('CustomAdMob showBanner error:', err);
    return false;
  }
}

/**
 * Manually requests a fresh banner. BannerHost owns the 20-second cadence;
 * the native plugin protects against overlapping loads.
 */
export async function refreshAdMobBanner(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  if (fullScreenDepth > 0) return;
  try {
    await CustomAdMob.refreshBanner();
  } catch (err) {
    console.warn('CustomAdMob refreshBanner error:', err);
  }
}

export async function hideAdMobBanner(): Promise<void> {
  bannerWanted = false;
  if (!isMobileAdsEnabled) return;
  if (!Capacitor.isNativePlatform()) return;

  try {
    await CustomAdMob.hideBanner();
  } catch (err) {
    console.warn('CustomAdMob hideBanner error:', err);
  }
}

export function isAdMobBannerShown(): boolean {
  return bannerWanted;
}

export async function listenForBannerState(
  listener: (event: { state: 'loaded' | 'failed' | 'hidden'; heightDp?: number; message?: string }) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return CustomAdMob.addListener('bannerState', listener);
}

export async function suspendAdMobBanner(): Promise<void> {
  if (!bannerWanted || !isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  try {
    await CustomAdMob.hideBanner();
  } catch (err) {}
}

export async function resumeAdMobBanner(): Promise<void> {
  if (!bannerWanted || !isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  if (fullScreenDepth > 0) return;
  try {
    await CustomAdMob.showBanner({ adId: LEVELPLAY_CONFIG.bannerId, margin: lastBannerMargin });
  } catch (err) {}
}

// ─── Full-Screen Ad Handlers ──────────────────────────────────────────────────

export async function preloadAdMobInterstitial(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await CustomAdMob.prepareInterstitial({
      adId: LEVELPLAY_CONFIG.interstitialId,
    });
  } catch (e) {
    console.warn('CustomAdMob prepareInterstitial error:', e);
  }
}

export async function showAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (fullScreenPromise) return false;
  await initAdMob();
  const operation = (async () => {
    fullScreenDepth++;
    audioManager.pauseBGM();
    try {
      await CustomAdMob.showInterstitial();
      return true;
    } catch (e) {
      console.warn('CustomAdMob showInterstitial error:', e);
      return false;
    } finally {
      fullScreenDepth--;
      audioManager.startBGM();
      preloadAdMobInterstitial();
    }
  })();
  fullScreenPromise = operation;
  try {
    return await operation;
  } finally {
    fullScreenPromise = null;
  }
}

export async function preloadAdMobRewarded(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await CustomAdMob.prepareRewardVideoAd({
      adId: LEVELPLAY_CONFIG.rewardedId,
    });
  } catch (e) {
    console.warn('CustomAdMob prepareRewardVideoAd error:', e);
  }
}

export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!Capacitor.isNativePlatform()) return { shown: true, rewarded: true };

  if (fullScreenPromise) return { shown: false, rewarded: false };
  await initAdMob();
  const operation = (async () => {
  fullScreenDepth++;
  audioManager.pauseBGM();

  let rewarded = false;

  try {
    const rewardItem = await CustomAdMob.showRewardVideoAd();
    if (rewardItem && rewardItem.amount > 0) {
      rewarded = true;
    }
    return { shown: true, rewarded };
  } catch (e) {
    console.warn('CustomAdMob showRewardVideoAd error:', e);
    return { shown: false, rewarded: false };
  } finally {
    fullScreenDepth--;
    audioManager.startBGM();
    // Preload next
    preloadAdMobRewarded();
  }
  })();
  fullScreenPromise = operation;
  try {
    return await operation;
  } finally {
    fullScreenPromise = null;
  }
}

export async function showAdMobRewardedInterstitial(): Promise<{ shown: boolean; rewarded: boolean }> {
  // Use rewarded ad logic for now as a fallback
  return showAdMobRewarded();
}

export async function showAdWithFallback(
  prefer: 'interstitial' | 'rewarded' = 'interstitial',
): Promise<boolean> {
  if (prefer === 'rewarded') {
    const res = await showAdMobRewarded();
    return res.shown;
  }
  return showAdMobInterstitial();
}