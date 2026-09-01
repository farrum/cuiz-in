import { registerPlugin, Capacitor } from '@capacitor/core';
import { audioManager } from '@/utils/audioManager';

// Register the custom native ads plugin (powered by Unity Ads Android SDK)
export interface CustomAdMobPlugin {
  initialize(options?: { gameId?: string; testMode?: boolean }): Promise<void>;
  prepareBanner(options: { adId: string, margin?: number }): Promise<void>;
  showBanner(options: { adId: string, margin?: number }): Promise<void>;
  hideBanner(): Promise<void>;
  prepareInterstitial(options: { adId: string }): Promise<void>;
  showInterstitial(): Promise<void>;
  prepareRewardVideoAd(options: { adId: string }): Promise<void>;
  showRewardVideoAd(): Promise<{ type: string; amount: number }>;
}

const CustomAdMob = registerPlugin<CustomAdMobPlugin>('CustomAdMob');

export const UNITY_CONFIG = {
  gameId: '800078728',
  userId: 'cae8dcab-c6a2-4fa1-a3f0-4ebb5ab2b644',
  androidBannerId: 'Banner_Android',
  androidInterstitialId: 'Interstitial_Android',
  androidRewardedId: 'Rewarded_Android',
  // Set to true so ads show immediately on test/sideloaded devices without NO_FILL errors.
  // Switch to false before publishing release build to Google Play Console.
  testMode: true,
};

// Backward-compatible alias for existing callers
const ADMOB_CONFIG = UNITY_CONFIG;

export const isMobileAdsEnabled = true;

let isInitialized = false;
let bannerWanted = false;
let fullScreenDepth = 0; // Tracks if an interstitial/rewarded is currently showing
let initPromise: Promise<boolean> | null = null;

// Ensure we initialize Unity Ads natively and continuously warm up all ad types
export async function initAdMob(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  if (isInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await CustomAdMob.initialize({
        gameId: UNITY_CONFIG.gameId,
        testMode: UNITY_CONFIG.testMode,
      });
      isInitialized = true;
      console.log('Unity Ads Initialized natively via Capacitor');
      // Warm up banner, interstitial, and rewarded in advance in the background
      preloadAdMobBanner(70);
      preloadAdMobInterstitial();
      preloadAdMobRewarded();
      return true;
    } catch (e) {
      console.error('Unity Ads Init Error:', e);
      return false;
    }
  })();

  return initPromise;
}

let lastBannerMargin = 70;

// ─── Banner Ad Handlers ───────────────────────────────────────────────────────

export async function preloadAdMobBanner(margin = 70): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  lastBannerMargin = margin;
  try {
    await CustomAdMob.prepareBanner({ adId: ADMOB_CONFIG.androidBannerId, margin });
  } catch (e) {
    console.warn('CustomAdMob prepareBanner error:', e);
  }
}

export async function showAdMobBanner(margin = 0): Promise<boolean> {
  bannerWanted = true;
  lastBannerMargin = margin;
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true; // Mock for web

  await initAdMob();

  if (fullScreenDepth > 0) return false;

  try {
    await CustomAdMob.showBanner({ adId: ADMOB_CONFIG.androidBannerId, margin });
    return true;
  } catch (err) {
    console.warn('CustomAdMob showBanner error:', err);
    return false;
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
    await CustomAdMob.showBanner({ adId: ADMOB_CONFIG.androidBannerId, margin: lastBannerMargin });
  } catch (err) {}
}

// ─── Full-Screen Ad Handlers ──────────────────────────────────────────────────

export async function preloadAdMobInterstitial(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await CustomAdMob.prepareInterstitial({
      adId: ADMOB_CONFIG.androidInterstitialId,
    });
  } catch (e) {
    console.warn('CustomAdMob prepareInterstitial error:', e);
  }
}

export async function showAdMobInterstitial(): Promise<boolean> {
  if (!isMobileAdsEnabled) return false;
  if (!Capacitor.isNativePlatform()) return true;

  await initAdMob();
  fullScreenDepth++;
  await suspendAdMobBanner();
  audioManager.pauseBGM();

  try {
    await CustomAdMob.showInterstitial();
    return true;
  } catch (e) {
    console.warn('CustomAdMob showInterstitial error:', e);
    return false;
  } finally {
    fullScreenDepth--;
    if (bannerWanted) await resumeAdMobBanner();
    audioManager.startBGM();
    // Preload next
    preloadAdMobInterstitial();
  }
}

export async function preloadAdMobRewarded(): Promise<void> {
  if (!isMobileAdsEnabled || !Capacitor.isNativePlatform()) return;
  await initAdMob();

  try {
    await CustomAdMob.prepareRewardVideoAd({
      adId: ADMOB_CONFIG.androidRewardedId,
    });
  } catch (e) {
    console.warn('CustomAdMob prepareRewardVideoAd error:', e);
  }
}

export async function showAdMobRewarded(): Promise<{ shown: boolean; rewarded: boolean }> {
  if (!isMobileAdsEnabled) return { shown: false, rewarded: false };
  if (!Capacitor.isNativePlatform()) return { shown: true, rewarded: true };

  await initAdMob();
  fullScreenDepth++;
  await suspendAdMobBanner();
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
    if (bannerWanted) await resumeAdMobBanner();
    audioManager.startBGM();
    // Preload next
    preloadAdMobRewarded();
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