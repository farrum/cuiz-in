import { registerPlugin, Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

/**
 * CuizIN Native Ads Plugin Interface (Unity LevelPlay + Unity Ads)
 */
export interface NativeAdsPlugin {
  initialize(options?: { levelPlayAppKey?: string; gameId?: string; testMode?: boolean }): Promise<void>;
  prepareBanner(options: { adId?: string; margin?: number }): Promise<void>;
  showBanner(options: { adId?: string; margin?: number; forceRefresh?: boolean }): Promise<void>;
  refreshBanner(): Promise<void>;
  hideBanner(): Promise<void>;
  prepareInterstitial(options?: { adId?: string }): Promise<void>;
  showInterstitial(): Promise<void>;
  prepareRewardVideoAd(options?: { adId?: string }): Promise<void>;
  showRewardVideoAd(): Promise<{ type: string; amount: number }>;
  adDiagnostics(): Promise<AdDiagnostics>;
  addListener(
    eventName: 'bannerState',
    listenerFunc: (event: { state: 'loaded' | 'failed' | 'hidden'; heightDp?: number; message?: string }) => void,
  ): Promise<PluginListenerHandle>;
}

export interface AdDiagnostics {
  levelPlayInit: boolean;
  unityDirectInit: boolean;
  bannerWanted: boolean;
  lpBannerLoaded: boolean;
  unityBannerLoaded: boolean;
  lpInterstitialReady: boolean;
  unityInterstitialLoaded: boolean;
  lpRewardedAvailable: boolean;
  unityRewardedLoaded: boolean;
  lastInitError: string | null;
  lastBannerError: string | null;
  lastInterstitialError: string | null;
  lastRewardedError: string | null;
}

// Registered native plugin (named CustomAdMob for Capacitor bridge compatibility)
const NativeAds = registerPlugin<NativeAdsPlugin>('CustomAdMob');

// LevelPlay (ironSource) Configuration - Primary
export const LEVELPLAY_CONFIG = {
  appKey: '268f29025',
  bannerId: 'nfbd7er5vhgheohp',
  interstitialId: '5kn5xibxgrngcju9g',
  rewardedId: 'l396uc79p1ajnsmt',
};

// Unity Ads Configuration - Direct Secondary
export const UNITY_CONFIG = {
  gameId: '800078728',
  userId: 'cae8dcab-c6a2-4fa1-a3f0-4ebb5ab2b644',
  androidBannerId: 'Banner_Android',
  androidInterstitialId: 'Interstitial_Android',
  androidRewardedId: 'Rewarded_Android',
  testMode: false,
};

export const isMobileAdsEnabled = true;

let isInitialized = false;
let isBannerWanted = false;
let fullScreenDepth = 0;
let initPromise: Promise<boolean> | null = null;
let lastBannerMargin = 0;

export function isFullScreenAdActive(): boolean {
  return fullScreenDepth > 0;
}

function notifyFullScreenAdState(active: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cuizin_fullscreen_ad_active', { detail: { active } }));
  }
}

/**
 * Initialize Unity LevelPlay (Primary) & Unity Ads (Secondary).
 * Safe, idempotent, warm up full-screen inventory in the background.
 */
export async function initAdManager(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await NativeAds.initialize({
        levelPlayAppKey: LEVELPLAY_CONFIG.appKey,
        gameId: UNITY_CONFIG.gameId,
        testMode: UNITY_CONFIG.testMode,
      });
      isInitialized = true;
      console.log('[AdManager] LevelPlay & Unity Ads initialized natively');
      preloadInterstitial();
      preloadRewarded();
      return true;
    } catch (e) {
      console.warn('[AdManager] Init warning:', e);
      return false;
    }
  })();

  return initPromise;
}

// ─── Banner Controls ────────────────────────────────────────────────────────

export async function showBanner(margin = 0, forceRefresh = false): Promise<boolean> {
  isBannerWanted = true;
  lastBannerMargin = margin;
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  await initAdManager();
  if (fullScreenDepth > 0) return false;

  try {
    await NativeAds.showBanner({ adId: LEVELPLAY_CONFIG.bannerId, margin, forceRefresh });
    return true;
  } catch (err) {
    console.warn('[AdManager] showBanner failed:', err);
    return false;
  }
}

export async function hideBanner(): Promise<void> {
  isBannerWanted = false;
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;

  try {
    await NativeAds.hideBanner();
  } catch (err) {
    console.warn('[AdManager] hideBanner failed:', err);
  }
}

export async function refreshBanner(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  if (fullScreenDepth > 0) return;
  try {
    await NativeAds.refreshBanner();
  } catch (err) {
    console.warn('[AdManager] refreshBanner failed:', err);
  }
}

export function isBannerShown(): boolean {
  return isBannerWanted;
}

export async function suspendBanner(): Promise<void> {
  if (!isBannerWanted || !isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  try {
    await NativeAds.hideBanner();
  } catch (err) {
    console.warn('[AdManager] suspendBanner failed:', err);
  }
}

export async function resumeBanner(): Promise<void> {
  if (!isBannerWanted || !isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  if (fullScreenDepth > 0) return;
  try {
    await NativeAds.showBanner({ adId: LEVELPLAY_CONFIG.bannerId, margin: lastBannerMargin });
  } catch (err) {
    console.warn('[AdManager] resumeBanner failed:', err);
  }
}

export async function listenForBannerState(
  listener: (event: { state: 'loaded' | 'failed' | 'hidden'; heightDp?: number; message?: string }) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null;
  return NativeAds.addListener('bannerState', listener);
}

// ─── Full-Screen Ads (With Strict Zero-Struggle Timeouts) ────────────────────

export async function preloadInterstitial(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdManager();
  try {
    await NativeAds.prepareInterstitial({ adId: LEVELPLAY_CONFIG.interstitialId });
  } catch (e) {
    console.warn('[AdManager] preloadInterstitial failed:', e);
  }
}

/**
 * Show interstitial ad with a strict timeout.
 * If no ad is ready, or if showing fails, resolves immediately with false
 * so the player's game flow is NEVER blocked or stalled.
 */
export async function showInterstitial(timeoutMs = 1500): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (fullScreenDepth > 0) return false;
  await initAdManager();

  const adPromise = (async (): Promise<boolean> => {
    fullScreenDepth++;
    notifyFullScreenAdState(true);
    audioManager.pauseBGM();
    try {
      await NativeAds.showInterstitial();
      return true;
    } catch (e) {
      console.warn('[AdManager] Interstitial unavailable/rejected:', e);
      return false;
    } finally {
      fullScreenDepth--;
      notifyFullScreenAdState(false);
      audioManager.startBGM();
      preloadInterstitial();
    }
  })();

  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), timeoutMs);
  });

  return Promise.race([adPromise, timeoutPromise]);
}

export async function preloadRewarded(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdManager();
  try {
    await NativeAds.prepareRewardVideoAd({ adId: LEVELPLAY_CONFIG.rewardedId });
  } catch (e) {
    console.warn('[AdManager] preloadRewarded failed:', e);
  }
}

/**
 * Show rewarded video ad with a clean resolution.
 * If no ad feed is available, fails gracefully and promptly without hanging.
 */
export async function showRewarded(timeoutMs = 2500): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!Capacitor.isNativePlatform()) return { shown: true, rewarded: true };

  if (fullScreenDepth > 0) return { shown: false, rewarded: false };
  await initAdManager();

  const adPromise = (async (): Promise<{ shown: boolean; rewarded: boolean }> => {
    fullScreenDepth++;
    notifyFullScreenAdState(true);
    audioManager.pauseBGM();
    let rewarded = false;

    try {
      const rewardItem = await NativeAds.showRewardVideoAd();
      if (rewardItem && rewardItem.amount > 0) {
        rewarded = true;
      }
      return { shown: true, rewarded };
    } catch (e) {
      console.warn('[AdManager] Rewarded ad unavailable:', e);
      return { shown: false, rewarded: false };
    } finally {
      fullScreenDepth--;
      notifyFullScreenAdState(false);
      audioManager.startBGM();
      preloadRewarded();
    }
  })();

  const timeoutPromise = new Promise<{ shown: boolean; rewarded: boolean }>((resolve) => {
    setTimeout(() => resolve({ shown: false, rewarded: false }), timeoutMs);
  });

  return Promise.race([adPromise, timeoutPromise]);
}

export async function getAdDiagnostics(): Promise<AdDiagnostics | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    return await NativeAds.adDiagnostics();
  } catch {
    return null;
  }
}
